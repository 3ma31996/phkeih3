// WorkTrack — config.js : data global, helper, util UI, dropdown, renderAll
// 1. DATA GLOBAL & DICTIONARY
        window.DEFAULT_CODE_MAP = {
            '001': 'Penyusunan Draft dan Pemutakhiran RKP lingkup Hilirisasi Kelautan dan Perikanan',
            '002': 'Kebijakan Inovasi Pengembangan Model Hilirisasi dalam Mendukung Pertumbuhan Ekonomi untuk Hilirisasi Bidang Kelautan dan Perikanan',
            '003': 'Draft Rekomendasi Isu Strategis Lingkup Hilirisasi Bidang Kelautan dan Perikanan',
            '004': 'Pemantauan dan Evaluasi Rencana Pembangunan Lingkup Hilirisasi Bidang Kelautan dan Perikanan',
            '005': 'Laporan Penugasan Lain-Lain Lingkup Hilirisasi Bidang Kelautan dan Perikanan',
            '006': 'Laporan Penugasan Lain-Lain Lingkup Hilirisasi Bidang Kelautan dan Perikanan',
            '007': 'Pengembangan Kompetensi Pegawai Minimal 20 JP',
            '008': 'Melaksanakan Pelatihan Dasar Badan Pengawasan Keuangan dan Pembangunan (BPKP) Calon Pegawai Negeri Sipil (CPNS)'
        };

        // ============================================================
        // PETA EMAIL LOGIN (Firebase Authentication)
        // Hubungkan tiap PROFIL aplikasi ke EMAIL akun yang Anda buat
        // di Firebase Console (Authentication > Users).
        // >>> EDIT baris di bawah bila email yang Anda buat BERBEDA. <<<
        // ============================================================
        window.AUTH_EMAIL_MAP = {
            'u1': 'indra@worktrack.local',
            'u2': 'mikhael@worktrack.local',
            'u3': 'emir@worktrack.local',
            'u4': 'ammar@worktrack.local',
            'u0': 'admin@worktrack.local'
        };
        window.getAuthEmail = function(acc) {
            if (!acc) return '';
            if (acc.email) return acc.email;
            return window.AUTH_EMAIL_MAP[acc.id] || (acc.id + '@worktrack.local');
        };
        // Sumber profil untuk layar login: database (jika sudah termuat) -> cache lokal -> daftar default.
        // Penting karena Firestore Rules memblokir pembacaan database SEBELUM login.
        window.getLoginProfiles = function() {
            if (window.accounts && window.accounts.length) return window.accounts;
            try {
                var cached = JSON.parse(localStorage.getItem('wt_profiles_cache') || 'null');
                if (cached && cached.length) return cached;
            } catch (e) {}
            return window.DEFAULT_USERS;
        };
        window.mapAuthError = function(err) {
            var code = (err && err.code) ? err.code : '';
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found')
                return '❌ Email/password salah, atau akun login belum dibuat di Firebase Console.';
            if (code === 'auth/invalid-email') return '❌ Format email tidak valid (cek AUTH_EMAIL_MAP).';
            if (code === 'auth/too-many-requests') return '⏳ Terlalu banyak percobaan. Tunggu beberapa menit.';
            if (code === 'auth/network-request-failed') return '📶 Gagal terhubung ke server. Cek koneksi internet.';
            return '❌ Gagal login: ' + (err.message || code || 'unknown');
        };

        // DEFAULT AKUN (dipakai untuk seeding awal ke Firestore jika belum ada 'accounts')
        window.DEFAULT_USERS = [
            { id: 'u1', name: 'Indra M', role: 'koordinator', label: 'Koordinator Tim' },
            { id: 'u2', name: 'Mikhael', role: 'staff', label: 'Staff' },
            { id: 'u3', name: 'Emir', role: 'staff', label: 'Staff' },
            { id: 'u4', name: 'Ammar', role: 'staff', label: 'Staff' },
            { id: 'u0', name: 'Admin System', role: 'admin', label: 'Admin (Moderator)' }
        ];

        // window.USERS = daftar akun aktif (runtime). Diisi dari Firestore 'accounts'.
        window.USERS = window.DEFAULT_USERS.slice();
        window.accounts = [];           // profil akun (id, name, role, label, email)
        window._seedingAccounts = false;
        window._pendingLoginId = null;

        window.currentUser = null;
        window.tasks = [];
        window.discussions = [];
        window.todoList = [];
        window.manualRecall = [];
        window.categoryCodes = [];
        window.presences = [];
        window.contacts = [];
        window.notifiedDeadlines = {};
        window.calState = {
            month: new Date().getMonth(),
            year: new Date().getFullYear(),
            selectedDate: new Date().toISOString().slice(0, 10)
        };

        window.tempCustomRecurrence = null;

        // ============================================================
        // PASSWORD HASHING (SHA-256). Pakai Web Crypto bila tersedia,
        // fallback ke implementasi murni JS agar tetap jalan di file://.
        // ============================================================
        window._sha256js = function(ascii) {
            function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
            var mathPow = Math.pow;
            var maxWord = mathPow(2, 32);
            var i, j;
            var result = '';
            var words = [];
            var asciiBitLength = ascii.length * 8;
            var hash = window._sha256js.h = window._sha256js.h || [];
            var k = window._sha256js.k = window._sha256js.k || [];
            var primeCounter = k.length;
            var isComposite = {};
            for (var candidate = 2; primeCounter < 64; candidate++) {
                if (!isComposite[candidate]) {
                    for (i = 0; i < 313; i += candidate) { isComposite[i] = candidate; }
                    hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
                    k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
                }
            }
            ascii += '\x80';
            while (ascii.length % 64 - 56) ascii += '\x00';
            for (i = 0; i < ascii.length; i++) {
                j = ascii.charCodeAt(i);
                if (j >> 8) return null;
                words[i >> 2] |= j << ((3 - i) % 4) * 8;
            }
            words[words.length] = ((asciiBitLength / maxWord) | 0);
            words[words.length] = (asciiBitLength);
            for (j = 0; j < words.length;) {
                var w = words.slice(j, j += 16);
                var oldHash = hash;
                hash = hash.slice(0, 8);
                for (i = 0; i < 64; i++) {
                    var w15 = w[i - 15], w2 = w[i - 2];
                    var a = hash[0], e = hash[4];
                    var temp1 = hash[7]
                        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                        + ((e & hash[5]) ^ ((~e) & hash[6]))
                        + k[i]
                        + (w[i] = (i < 16) ? w[i] : (
                            w[i - 16]
                            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                            + w[i - 7]
                            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                          ) | 0
                        );
                    var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
                    hash = [(temp1 + temp2) | 0].concat(hash);
                    hash[4] = (hash[4] + temp1) | 0;
                }
                for (i = 0; i < 8; i++) { hash[i] = (hash[i] + oldHash[i]) | 0; }
            }
            for (i = 0; i < 8; i++) {
                for (j = 3; j + 1; j--) {
                    var b = (hash[i] >> (j * 8)) & 255;
                    result += ((b < 16) ? 0 : '') + b.toString(16);
                }
            }
            return result;
        };

        window.hashPassword = async function(pw) {
            pw = pw || '';
            try {
                if (window.crypto && window.crypto.subtle && window.TextEncoder) {
                    var enc = new TextEncoder().encode(pw);
                    var buf = await window.crypto.subtle.digest('SHA-256', enc);
                    return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
                }
            } catch (e) { /* fallback di bawah */ }
            var utf8 = unescape(encodeURIComponent(pw));
            return window._sha256js(utf8);
        };

        window.getCategoryCodeDesc = function(code) {
            var foundCustom = window.categoryCodes.find(c => c.code === code);
            if (foundCustom) return foundCustom.desc;
            return window.DEFAULT_CODE_MAP[code] || 'Dokumen Penugasan Hilirisasi';
        };

        // 4. UI ENGINES & FUNCTIONS
        window.toggleMobileSidebar = function() {
            var sidebar = document.getElementById('sidebar');
            var overlay = document.getElementById('sidebarOverlay');
            if (sidebar && overlay) {
                if (sidebar.classList.contains('-translate-x-full')) {
                    sidebar.classList.remove('-translate-x-full');
                    overlay.classList.remove('hidden');
                } else {
                    sidebar.classList.add('-translate-x-full');
                    overlay.classList.add('hidden');
                }
            }
        };

        // ============================================================
        // ADMIN: KELOLA AKUN & PASSWORD
        // ============================================================
        window._genAccountId = function() {
            var max = 0;
            (window.accounts || []).forEach(function(a) {
                var m = /^u(\d+)$/.exec(a.id);
                if (m) { var n = parseInt(m[1]); if (n > max) max = n; }
            });
            return 'u' + (max + 1);
        };

        window.roleToLabel = function(role) {
            if (role === 'admin') return 'Admin (Moderator)';
            if (role === 'koordinator') return 'Koordinator Tim';
            return 'Staff';
        };

        window.updateClock = function() {
            var now = new Date();
            var dateEl = document.getElementById('currentDateDisplay');
            var timeEl = document.getElementById('currentTimeDisplay');
            if (dateEl) dateEl.innerText = now.toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            if (timeEl) timeEl.innerText = now.toLocaleTimeString('id-ID') + ' WIB';
        };

        window.populateDropdowns = function() {
            var leadSelect = document.getElementById('taskLead');
            var supportCheckboxes = document.getElementById('taskSupportCheckboxes');
            var finAssignee = document.getElementById('finDiscAssignee');
            var todoAssignee = document.getElementById('todoAssignee');
            var presUser = document.getElementById('presUser');

            // HANYA PERSONIL TIM SUNGGUHAN (EKSKLUSI ROLE ADMIN)
            var activeTeamMembers = window.USERS.filter(function(u) { return u.role !== 'admin'; });
            var staffList = activeTeamMembers.filter(function(u) { return u.role === 'staff'; });

            if (leadSelect) {
                leadSelect.innerHTML = staffList.map(function(u) {
                    return '<option value="' + u.id + '">' + u.name + '</option>';
                }).join('');
            }

            if (supportCheckboxes) {
                supportCheckboxes.innerHTML = staffList.map(function(u) {
                    return '<label class="flex items-center gap-1.5 text-xs"><input type="checkbox" name="taskSupport" value="' + u.id + '"> ' + u.name + '</label>';
                }).join('');
            }

            if (finAssignee) {
                finAssignee.innerHTML = activeTeamMembers.map(function(u) {
                    return '<option value="' + u.id + '">' + u.name + ' (' + u.label + ')</option>';
                }).join('');
            }

            if (todoAssignee) {
                todoAssignee.innerHTML = activeTeamMembers.map(function(u) {
                    return '<option value="' + u.id + '">' + u.name + ' (' + u.label + ')</option>';
                }).join('');
            }

            if (presUser) {
                var presOptions = '<option value="ALL_TEAM">👥 Semua Tim (Full Team)</option>';
                presOptions += activeTeamMembers.map(function(u) {
                    return '<option value="' + u.id + '">' + u.name + ' (' + u.label + ')</option>';
                }).join('');
                presUser.innerHTML = presOptions;
            }

            // Filter user di kalender (dinamis mengikuti daftar akun)
            var calFilter = document.getElementById('calUserFilter');
            if (calFilter) {
                var prev = calFilter.value;
                var opts = '<option value="ALL">👥 Semua Tim</option>';
                opts += activeTeamMembers.map(function(u) {
                    return '<option value="' + u.id + '">' + u.name + ' (' + u.label + ')</option>';
                }).join('');
                calFilter.innerHTML = opts;
                if (prev) { try { calFilter.value = prev; } catch (e) {} }
            }

            window.renderCategoryCodeDropdowns();
        };

        window.renderCategoryCodeDropdowns = function() {
            var propSelect = document.getElementById('propCategoryCode');
            var taskSelect = document.getElementById('taskCategoryCode');
            var stSelect = document.getElementById('stCategoryCode');
            var wrSelect = document.getElementById('wrCategoryCode');
            var ePerfSelect = document.getElementById('ePerfCode');

            var optionsHtml = '';
            
            Object.keys(window.DEFAULT_CODE_MAP).forEach(code => {
                optionsHtml += `<option value="${code}">${code} - ${window.DEFAULT_CODE_MAP[code].slice(0, 45)}...</option>`;
            });

            (window.categoryCodes || []).forEach(item => {
                optionsHtml += `<option value="${item.code}">${item.code} [Thn ${item.year}] - ${item.desc.slice(0, 40)}...</option>`;
            });

            if (propSelect) propSelect.innerHTML = optionsHtml;
            if (taskSelect) taskSelect.innerHTML = optionsHtml;
            if (stSelect) stSelect.innerHTML = optionsHtml;
            if (wrSelect) wrSelect.innerHTML = optionsHtml;
            if (ePerfSelect) {
                var prevVal = ePerfSelect.value;
                ePerfSelect.innerHTML = optionsHtml;
                if (prevVal) ePerfSelect.value = prevVal;
            }
        };

        window.initFilterOptions = function(typeId, detailId) {
            var typeEl = document.getElementById(typeId);
            var detailEl = document.getElementById(detailId);
            if (!typeEl || !detailEl) return;

            var type = typeEl.value;
            var html = '';

            if (type === 'ALL') {
                detailEl.className = 'hidden';
                return;
            } else {
                detailEl.className = 'text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium';
            }

            if (type === 'MONTH') {
                const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                html = months.map((m, idx) => `<option value="${idx + 1}">${m}</option>`).join('');
            } else if (type === 'QUARTER') {
                html = `
                    <option value="1">Triwulan I (Jan - Mar)</option>
                    <option value="2">Triwulan II (Apr - Jun)</option>
                    <option value="3">Triwulan III (Jul - Sep)</option>
                    <option value="4">Triwulan IV (Okt - Des)</option>
                `;
            } else if (type === 'SEMESTER') {
                html = `
                    <option value="1">Semester I (Jan - Jun)</option>
                    <option value="2">Semester II (Jul - Des)</option>
                `;
            } else if (type === 'YEAR') {
                html = `
                    <option value="2026">Tahun 2026</option>
                    <option value="2025">Tahun 2025</option>
                    <option value="2027">Tahun 2027</option>
                `;
            }

            detailEl.innerHTML = html;
        };

        window.onFilterTypeChange = function(typeId, detailId, renderCallback) {
            window.initFilterOptions(typeId, detailId);
            if (typeof renderCallback === 'function') {
                renderCallback();
            }
        };

        window.isDateInFilter = function(dateStr, type, detailVal) {
            if (type === 'ALL' || !dateStr) return true;
            var d = new Date(dateStr);
            if (isNaN(d.getTime())) return true;

            var month = d.getMonth() + 1;
            var year = d.getFullYear();

            if (type === 'MONTH') {
                return month === parseInt(detailVal);
            } else if (type === 'QUARTER') {
                var q = parseInt(detailVal);
                if (q === 1) return month >= 1 && month <= 3;
                if (q === 2) return month >= 4 && month <= 6;
                if (q === 3) return month >= 7 && month <= 9;
                if (q === 4) return month >= 10 && month <= 12;
            } else if (type === 'SEMESTER') {
                var s = parseInt(detailVal);
                if (s === 1) return month >= 1 && month <= 6;
                if (s === 2) return month >= 7 && month <= 12;
            } else if (type === 'YEAR') {
                return year === parseInt(detailVal);
            }
            return true;
        };

        window.renderAll = function() {
            if(!window.currentUser) return;
            document.getElementById('cardTotalWork').innerText = window.tasks.length + window.manualRecall.length;
            document.getElementById('cardActiveWork').innerText = window.tasks.filter(function(t) { return t.status !== 'DONE'; }).length;
            document.getElementById('cardActiveTodo').innerText = window.todoList.filter(function(td) { return td.status !== 'DONE'; }).length;
            document.getElementById('cardDiscussionWork').innerText = window.discussions.filter(function(d) { return !d.completed; }).length;

            window.renderTasks();
            window.renderDiscussions();
            window.renderTodoList();
            window.renderWorkload();
            window.renderHistory();
            window.renderArchiveWorkRecall();
            if (window.renderContacts) window.renderContacts();
            window.renderAdminCodeList();
            window.renderCategoryCodeDropdowns();
            if (document.getElementById('calendarGrid')) window.renderCalendar();
            
            if (window.currentUser.id === 'u2' || window.currentUser.id === 'u3') {
                window.updateEPerfOptions();
            }
        };

        window.toggleAccordion = function(id) {
            var el = document.getElementById(id);
            if (el) el.classList.toggle('hidden');
        };

        window.switchTab = function(tab) {
            if (tab === 'eperformance' && (window.currentUser.id !== 'u2' && window.currentUser.id !== 'u3')) {
                alert("Akses Terbatas: Menu Report ePerformance khusus untuk akun Mikhael dan Emir.");
                return;
            }

            ['tasks', 'discussions', 'todo', 'workload', 'calendar', 'contacts', 'history', 'archive', 'eperformance', 'slidemonth', 'hilirisasinews', 'dashboardhilirisasi'].forEach(function(t) {
                var sec = document.getElementById('sec-' + t);
                var side = document.getElementById('side-' + t);
                if (sec) sec.classList.add('hidden');
                if (side) side.classList.remove('sidebar-active');
            });
            var activeSec = document.getElementById('sec-' + tab);
            var activeSide = document.getElementById('side-' + tab);
            if (activeSec) activeSec.classList.remove('hidden');
            if (activeSide) activeSide.classList.add('sidebar-active');

            if (tab === 'eperformance') window.updateEPerfOptions();
            if (tab === 'calendar') window.renderCalendar();
            if (tab === 'contacts' && window.renderContacts) window.renderContacts();

            var sidebar = document.getElementById('sidebar');
            var overlay = document.getElementById('sidebarOverlay');
            if (sidebar && !sidebar.classList.contains('-translate-x-full') && window.innerWidth < 768) {
                sidebar.classList.add('-translate-x-full');
                if (overlay) overlay.classList.add('hidden');
            }
        };

        window.openModal = function(id) { 
            var m = document.getElementById(id);
            if (m) m.classList.remove('hidden'); 
        };
        window.closeModal = function(id) { 
            var m = document.getElementById(id);
            if (m) m.classList.add('hidden'); 
        };
