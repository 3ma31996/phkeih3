// WorkTrack — records.js : history, arsip, kelola kode & akun
window.openAccountAdmin = function() {
            if (!window.currentUser || window.currentUser.role !== 'admin') {
                alert('Akses ditolak. Hanya Admin yang dapat mengelola akun.');
                return;
            }
            window.renderAccountAdminList();
            window.openModal('accountAdminModal');
        };

        window.submitNewAccount = async function(e) {
            e.preventDefault();
            if (!window.currentUser || window.currentUser.role !== 'admin') { alert('Akses ditolak. Hanya Admin.'); return; }

            var name = document.getElementById('accName').value.trim();
            var role = document.getElementById('accRole').value;
            var email = document.getElementById('accEmail').value.trim().toLowerCase();

            if (!name || !email) { alert('Nama dan email login wajib diisi.'); return; }

            if (!window.accounts) window.accounts = [];
            if (window.accounts.some(function(a) { return window.getAuthEmail(a).toLowerCase() === email; })) {
                alert('Email login ini sudah dipakai profil lain.');
                return;
            }

            window.accounts.push({
                id: window._genAccountId(),
                name: name,
                role: role,
                label: window.roleToLabel(role),
                email: email
            });

            document.getElementById('accName').value = '';
            document.getElementById('accEmail').value = '';

            await window.saveData();
            window.renderAccountAdminList();
            alert('Profil "' + name + '" ditambahkan.\n\nLANGKAH WAJIB agar bisa login:\nBuat akun di Firebase Console → Authentication → Users\ndengan email: ' + email + '\ndan tetapkan passwordnya di sana.');
        };

        window.adminRenameAccount = function(id) {
            if (!window.currentUser || window.currentUser.role !== 'admin') return;
            var acc = (window.accounts || []).find(function(a) { return a.id === id; });
            if (!acc) return;
            var nn = prompt('Ubah nama untuk akun ini:', acc.name);
            if (nn === null) return;
            nn = nn.trim();
            if (!nn) { alert('Nama tidak boleh kosong.'); return; }
            acc.name = nn;
            window.saveData();
            window.renderAccountAdminList();
        };

        window.adminChangeRole = function(id, newRole) {
            if (!window.currentUser || window.currentUser.role !== 'admin') return;
            var acc = (window.accounts || []).find(function(a) { return a.id === id; });
            if (!acc) return;

            if (acc.role === 'admin' && newRole !== 'admin') {
                var admins = window.accounts.filter(function(a) { return a.role === 'admin'; });
                if (admins.length <= 1) {
                    alert('Tidak bisa menurunkan admin terakhir. Angkat/buat admin lain dulu.');
                    window.renderAccountAdminList();
                    return;
                }
            }
            acc.role = newRole;
            acc.label = window.roleToLabel(newRole);
            window.saveData();
            window.renderAccountAdminList();
        };

        window.adminResetAccountPassword = function(id) {
            if (!window.currentUser || window.currentUser.role !== 'admin') return;
            var acc = (window.accounts || []).find(function(a) { return a.id === id; });
            if (!acc) return;
            var email = window.getAuthEmail(acc);
            alert('Reset password "' + acc.name + '" dilakukan di Firebase Console:\n\n'
                + '1. console.firebase.google.com → project WorkTrackH3\n'
                + '2. Menu Authentication → tab Users\n'
                + '3. Cari email: ' + email + '\n'
                + '4. Klik ikon titik tiga (⋮) → Reset password / Edit\n\n'
                + 'Demi keamanan, reset password akun orang lain hanya bisa lewat Console.');
        };

        window.adminDeleteAccount = function(id) {
            if (!window.currentUser || window.currentUser.role !== 'admin') return;
            var acc = (window.accounts || []).find(function(a) { return a.id === id; });
            if (!acc) return;
            if (id === window.currentUser.id) { alert('Anda tidak bisa menghapus akun yang sedang login.'); return; }
            if (acc.role === 'admin') {
                var admins = window.accounts.filter(function(a) { return a.role === 'admin'; });
                if (admins.length <= 1) { alert('Tidak bisa menghapus admin terakhir.'); return; }
            }
            var email = window.getAuthEmail(acc);
            if (!confirm('[ADMIN] Hapus profil "' + acc.name + '"?\nData task/riwayat lama yang menyebut nama ini TIDAK ikut terhapus.')) return;
            window.accounts = window.accounts.filter(function(a) { return a.id !== id; });
            window.saveData();
            window.renderAccountAdminList();
            alert('Profil "' + acc.name + '" dihapus dari aplikasi.\n\nAgar orang ini benar-benar tidak bisa login lagi, hapus juga akunnya di\nFirebase Console → Authentication → Users (email: ' + email + ').');
        };

        window.renderAccountAdminList = function() {
            var c = document.getElementById('accountAdminListContainer');
            if (!c) return;
            if (!window.accounts || !window.accounts.length) {
                c.innerHTML = '<div class="text-slate-400 italic text-[11px]">Belum ada akun tersimpan.</div>';
                return;
            }
            c.innerHTML = window.accounts.map(function(a) {
                var isSelf = window.currentUser && a.id === window.currentUser.id;
                return '<div class="bg-white p-2.5 rounded-xl border space-y-1.5">' +
                    '<div class="flex justify-between items-start gap-2">' +
                        '<div class="min-w-0">' +
                            '<div class="font-bold text-slate-800 text-xs truncate">' + a.name + (isSelf ? ' <span class="text-[9px] text-blue-500">(Anda)</span>' : '') + '</div>' +
                            '<div class="text-[10px] text-slate-400 truncate">📧 ' + window.getAuthEmail(a) + '</div>' +
                        '</div>' +
                        '<select onchange="window.adminChangeRole(\'' + a.id + '\', this.value)" class="text-[10px] border rounded-lg px-1.5 py-1 bg-slate-50 font-semibold">' +
                            '<option value="staff"' + (a.role === 'staff' ? ' selected' : '') + '>Staff</option>' +
                            '<option value="koordinator"' + (a.role === 'koordinator' ? ' selected' : '') + '>Koordinator</option>' +
                            '<option value="admin"' + (a.role === 'admin' ? ' selected' : '') + '>Admin</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="flex flex-wrap gap-1.5 pt-1.5 border-t">' +
                        '<button onclick="window.adminRenameAccount(\'' + a.id + '\')" class="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">✏️ Ubah Nama</button>' +
                        '<button onclick="window.adminResetAccountPassword(\'' + a.id + '\')" class="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700">🔑 Reset Password (Console)</button>' +
                        (isSelf ? '' : '<button onclick="window.adminDeleteAccount(\'' + a.id + '\')" class="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600">🗑️ Hapus</button>') +
                    '</div>' +
                '</div>';
            }).join('');
        };

        window.submitNewCategoryCode = function(e) {
            e.preventDefault();
            if (!window.currentUser || window.currentUser.role !== 'admin') {
                alert("Akses ditolak. Hanya Admin System yang dapat mengubah data kode.");
                return;
            }

            var year = document.getElementById('newCodeYear').value;
            var code = document.getElementById('newCodeNumber').value.trim();
            var desc = document.getElementById('newCodeDesc').value.trim();

            if (!code || !desc) return;

            if (!window.categoryCodes) window.categoryCodes = [];

            var existingIndex = window.categoryCodes.findIndex(c => c.code === code);
            if (existingIndex !== -1) {
                window.categoryCodes[existingIndex] = { year, code, desc };
            } else {
                window.categoryCodes.push({ year, code, desc });
            }

            document.getElementById('newCodeNumber').value = '';
            document.getElementById('newCodeDesc').value = '';

            window.saveData();
            window.renderAdminCodeList();
            window.renderCategoryCodeDropdowns();
            alert(`Kode Kategori ${code} berhasil disimpan untuk tahun ${year}!`);
        };

        window.deleteCategoryCode = function(code) {
            if (!confirm(`[ADMIN] Hapus Kode Kategori ${code}?`)) return;
            window.categoryCodes = window.categoryCodes.filter(c => c.code !== code);
            window.saveData();
            window.renderAdminCodeList();
            window.renderCategoryCodeDropdowns();
        };

        window.renderAdminCodeList = function() {
            var container = document.getElementById('adminCodeListContainer');
            if (!container) return;

            if (!window.categoryCodes || window.categoryCodes.length === 0) {
                container.innerHTML = '<div class="text-slate-400 italic text-[11px]">Belum ada kode baru buatan Admin. Menggunakan default (001 - 008).</div>';
                return;
            }

            container.innerHTML = window.categoryCodes.map(c => {
                return `<div class="bg-white p-2 rounded-xl border flex justify-between items-start gap-2">
                    <div class="min-w-0">
                        <div class="font-bold text-blue-600">[${c.code}] - Thn ${c.year}</div>
                        <div class="text-slate-600 text-[10px] leading-snug break-words">${c.desc}</div>
                    </div>
                    <button onclick="window.deleteCategoryCode('${c.code}')" class="text-red-500 hover:text-red-700 font-bold p-1 text-xs">🗑️</button>
                </div>`;
            }).join('');
        };

        window.adminDeleteArchive = function(archiveId) {
            if (confirm("[ADMIN] Hapus Arsip/Recall ini secara permanen dari Cloud?")) {
                window.manualRecall = window.manualRecall.filter(function(m) { return m.id !== archiveId; });
                window.tasks = window.tasks.filter(function(t) { return t.id !== archiveId; });
                window.saveData();
            }
        };

        window.openEditArchiveModal = function(archiveId) {
            var item = window.manualRecall.find(function(m) { return m.id === archiveId; });
            if (!item) return;
            document.getElementById('wrEditId').value = item.id;
            document.getElementById('wrTitle').value = item.title || '';
            if (item.taskType) document.getElementById('wrTaskType').value = item.taskType;
            document.getElementById('wrCategoryCode').value = item.code || '001';
            document.getElementById('wrLink').value = item.docLink || '';
            document.getElementById('wrSections').value = (item.sections || []).join('\n');
            document.getElementById('wrKeywords').value = (item.keywords || []).join(', ');
            document.getElementById('wrModalHeader').innerText = '✏️ Edit Indeks Archive Manual';
            window.openModal('workRecallModal');
        };

        window.submitManualWorkRecall = function(e) {
            e.preventDefault();
            var editId = document.getElementById('wrEditId').value;
            var code = document.getElementById('wrCategoryCode').value || '001';
            var selectedTaskType = document.getElementById('wrTaskType').value || '📄 Laporan / Resume';
            var rawSections = document.getElementById('wrSections').value;
            var sections = rawSections.split(/[\n,]+/).map(function(s) { return s.trim(); }).filter(Boolean);
            var keywords = document.getElementById('wrKeywords').value.split(',').map(function(k) { return k.trim(); }).filter(Boolean);

            if (editId) {
                var item = window.manualRecall.find(function(m) { return m.id === editId; });
                if (item) {
                    item.title = document.getElementById('wrTitle').value;
                    item.taskType = selectedTaskType;
                    item.code = code;
                    item.category = window.getCategoryCodeDesc(code);
                    item.docLink = document.getElementById('wrLink').value;
                    item.sections = sections;
                    item.keywords = keywords;
                }
            } else {
                window.manualRecall.unshift({
                    id: 'MREC-' + Date.now(),
                    code: code,
                    taskType: selectedTaskType,
                    category: window.getCategoryCodeDesc(code),
                    title: document.getElementById('wrTitle').value,
                    docLink: document.getElementById('wrLink').value,
                    sections: sections,
                    keywords: keywords,
                    date: new Date().toISOString().slice(0,10)
                });
            }

            document.getElementById('wrEditId').value = '';
            document.getElementById('wrModalHeader').innerText = 'Indeks Work Recall Manual';
            window.closeModal('workRecallModal');
            window.saveData();
        };

        window.renderHistory = function() {
            var staffContainer = document.getElementById('staffHistoryList');
            var discContainer = document.getElementById('discussionHistoryList');
            if (!staffContainer || !discContainer) return;

            var filterType = document.getElementById('histFilterType').value;
            var filterDetail = document.getElementById('histFilterDetail').value;

            var doneTasks = window.tasks.filter(function(t) { 
                return t.status === 'DONE' && window.isDateInFilter(t.completedAt || t.deadline, filterType, filterDetail); 
            });
            var staffList = window.USERS.filter(function(u) { return u.role === 'staff'; });

            staffContainer.innerHTML = staffList.map(function(s) {
                var leadDone = doneTasks.filter(function(t) { return t.leadId === s.id; });
                var supportDone = doneTasks.filter(function(t) { return t.supportIds && t.supportIds.indexOf(s.id) !== -1; });

                return '<div class="p-3 bg-slate-50 rounded-xl border text-xs space-y-1">' +
                    '<div class="font-bold text-slate-800 flex justify-between">' +
                        '<span>' + s.name + '</span>' +
                        '<span class="text-emerald-600 font-bold">' + (leadDone.length + supportDone.length) + ' Selesai</span>' +
                    '</div>' +
                    '<div class="text-[11px] text-slate-600">Peran: <b>' + leadDone.length + ' Lead</b> | <b>' + supportDone.length + ' Support</b></div>' +
                '</div>';
            }).join('');

            var completedDiscussions = window.discussions.filter(function(d) { 
                return d.completed && window.isDateInFilter(d.completedAt || d.date, filterType, filterDetail); 
            });

            if (completedDiscussions.length === 0) {
                discContainer.innerHTML = '<div class="text-slate-400 italic text-xs py-4 text-center">Belum ada histori rapat internal pada periode ini.</div>';
                return;
            }

            discContainer.innerHTML = completedDiscussions.map(function(d) {
                return '<div class="p-3 bg-slate-50 rounded-xl border text-xs space-y-1.5">' +
                    '<div class="font-bold text-indigo-700 flex justify-between">' +
                        '<span>' + d.topic + '</span>' +
                        '<span class="text-[10px] text-slate-400 font-normal">📅 ' + d.date + '</span>' +
                    '</div>' +
                    (d.summary ? '<div class="text-slate-700 bg-white p-2 rounded border"><b>MoM:</b> ' + d.summary + '</div>' : '') +
                '</div>';
            }).join('');
        };

        window.renderArchiveWorkRecall = function() {
            var container = document.getElementById('workRecallAccordionList');
            if (!container) return;

            var queryInput = document.getElementById('archiveSearchInput');
            var query = (queryInput ? queryInput.value : '').toLowerCase().trim();
            var filterType = document.getElementById('arcFilterType').value;
            var filterDetail = document.getElementById('arcFilterDetail').value;
            var sortOrder = document.getElementById('arcSortOrder').value;

            var isAdmin = window.currentUser && window.currentUser.role === 'admin';

            var completedTasksMap = window.tasks.filter(function(t) { return t.status === 'DONE'; }).map(function(t) {
                return {
                    id: t.id,
                    isFromTask: true,
                    title: t.title,
                    scope: t.scope || 'INTERNAL',
                    taskType: t.taskType || (t.outputs && t.outputs[0]) || '📄 Laporan / Resume',
                    code: t.code || '001',
                    category: window.getCategoryCodeDesc(t.code) || (t.outputs || []).join(', ') || 'Task Completed',
                    date: t.completedAt ? t.completedAt.slice(0,10) : (t.deadline ? t.deadline.slice(0,10) : '2026-01-01'),
                    docLink: t.docLink,
                    docLink2: t.docLink2,
                    desc: t.desc || '',
                    sections: t.sections || [],
                    keywords: t.keywords || t.outputs || [],
                    chats: t.chats || []
                };
            });

            var manualMapped = window.manualRecall.map(function(m) {
                return {
                    id: m.id,
                    isFromTask: false,
                    title: m.title,
                    scope: 'INTERNAL',
                    taskType: m.taskType || '📄 Laporan / Resume',
                    code: m.code || '001',
                    category: window.getCategoryCodeDesc(m.code) || m.category || 'Dokumen',
                    date: m.date || '2026-01-01',
                    docLink: m.docLink,
                    docLink2: '',
                    desc: m.desc || '',
                    sections: m.sections || [],
                    keywords: m.keywords || [],
                    chats: m.chats || []
                };
            });

            var allRecallData = completedTasksMap.concat(manualMapped);

            var filtered = allRecallData.filter(function(item) {
                var passDate = window.isDateInFilter(item.date, filterType, filterDetail);
                if (!passDate) return false;

                if (!query) return true;

                var matchTitle = (item.title || '').toLowerCase().indexOf(query) !== -1;
                var matchType = (item.taskType || '').toLowerCase().indexOf(query) !== -1;
                var matchCategory = (item.category || '').toLowerCase().indexOf(query) !== -1;
                var matchDesc = (item.desc || '').toLowerCase().indexOf(query) !== -1;
                var matchCode = (item.code || '').toLowerCase().indexOf(query) !== -1;
                
                var matchKw = (item.keywords || []).some(function(k) { return (k || '').toLowerCase().indexOf(query) !== -1; });
                var matchSection = (item.sections || []).some(function(sec) { return (sec || '').toLowerCase().indexOf(query) !== -1; });

                return matchTitle || matchType || matchCategory || matchDesc || matchCode || matchKw || matchSection;
            });

            filtered.sort(function(a, b) {
                var dateA = new Date(a.date).getTime();
                var dateB = new Date(b.date).getTime();
                return sortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
            });

            if (filtered.length === 0) {
                container.innerHTML = '<div class="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border">Tidak ada arsip dokumen yang cocok.</div>';
                return;
            }

            container.innerHTML = filtered.map(function(item, idx) {
                var chatCount = (item.chats) ? item.chats.length : 0;
                var isLintas = item.scope === 'LINTAS_TIM';

                return '<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">' +
                    '<div onclick="window.toggleAccordion(\'acc-' + idx + '\')" class="p-3 sm:p-3.5 flex flex-col gap-2 cursor-pointer hover:bg-slate-50 transition">' +
                        
                        '<div class="flex flex-wrap items-center gap-1.5 min-w-0">' +
                            '<span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 shrink-0">[' + item.code + '] ' + (item.category || 'Dokumen') + '</span>' +
                            '<span class="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border shrink-0">' + item.taskType + '</span>' +
                            (isLintas ? '<span class="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200 shrink-0">🌐 Lintas Tim</span>' : '') +
                        '</div>' +

                        '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">' +
                            '<h4 class="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-full sm:max-w-[45%]">' + item.title + '</h4>' +
                            
                            '<div class="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0 overflow-x-auto py-0.5">' +
                                '<span class="text-[10px] text-slate-400 whitespace-nowrap">📅 ' + item.date + '</span>' +
                                
                                '<button onclick="event.stopPropagation(); window.openChatModal(\'' + item.id + '\')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition whitespace-nowrap" title="Lihat Histori Chat">' +
                                    '💬 <span class="hidden sm:inline">Chat</span> <span class="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">' + chatCount + '</span>' +
                                '</button>' +

                                (item.docLink ? '<a href="' + item.docLink + '" target="_blank" onclick="event.stopPropagation()" class="text-xs text-blue-600 font-semibold hover:underline bg-slate-100 px-2 py-1 rounded-lg whitespace-nowrap">🔗 Link Utama ↗</a>' : '') +
                                (isLintas && item.docLink2 ? '<a href="' + item.docLink2 + '" target="_blank" onclick="event.stopPropagation()" class="text-xs text-purple-600 font-semibold hover:underline bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg whitespace-nowrap">🌐 Link Lintas ↗</a>' : '') +
                                
                                (item.isFromTask ? 
                                    '<button onclick="event.stopPropagation(); window.openStaffDetailModal(\'' + item.id + '\', true)" class="text-blue-600 hover:text-blue-800 text-xs font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 shrink-0" title="Edit Rincian">✏️</button>' : 
                                    '<button onclick="event.stopPropagation(); window.openEditArchiveModal(\'' + item.id + '\')" class="text-blue-600 hover:text-blue-800 text-xs font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 shrink-0" title="Edit Indeks">✏️</button>'
                                ) +

                                (item.isFromTask && isAdmin ? '<button onclick="event.stopPropagation(); window.openRecallToActiveModal(\'' + item.id + '\')" class="text-orange-600 hover:text-orange-800 text-xs font-bold px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 shrink-0" title="Kembalikan ke Task Aktif">↩️</button>' : '') +

                                (isAdmin ? '<button onclick="event.stopPropagation(); window.adminDeleteArchive(\'' + item.id + '\')" class="text-red-500 hover:text-red-700 text-xs font-bold px-1 shrink-0" title="Hapus Admin">🗑️</button>' : '') +
                                '<button class="text-slate-400 hover:text-slate-600 text-xs p-1 font-bold shrink-0">▼</button>' +
                            '</div>' +
                        '</div>' +

                    '</div>' +

                    '<div id="acc-' + idx + '" class="hidden border-t border-slate-100 bg-slate-50 p-3.5 sm:p-4 space-y-3 text-xs">' +
                        (item.desc ? '<div><b>Deskripsi:</b> <p class="text-slate-600 mt-0.5">' + item.desc + '</p></div>' : '') +
                        (item.sections && item.sections.length > 0 ? '<div><b>📌 Section Utama:</b><ul class="list-disc list-inside text-slate-700 mt-1 space-y-0.5">' + item.sections.map(function(s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>' : '') +
                        (item.keywords && item.keywords.length > 0 ? '<div class="flex flex-wrap gap-1 pt-1"><b>Kata Kunci:</b> ' + item.keywords.map(function(k) { return '<span class="bg-white border px-2 py-0.5 rounded text-[10px] text-slate-600">#' + k + '</span>'; }).join('') + '</div>' : '') +
                    '</div>' +
                '</div>';
            }).join('');
        };
