// WorkTrack — eperformance.js : report ePerformance (.docx)
window.getArtiKodeUser = function(userId, code, month) {
            month = parseInt(month);
            var isMike = (userId === 'u2');

            var komoditas = isMike ? 
                'Komoditas TCT (Tuna-Cakalang-Tongkol), Rajungan, dan Tilapia' : 
                'Komoditas Rumput Laut, Garam, dan Udang';

            if (code === '001') {
                if (month >= 1 && month <= 3) return 'Draft Rancangan Awal RKP lingkup Hilirisasi Kelautan dan Perikanan ' + komoditas;
                if (month >= 4 && month <= 6) return 'Draft Rancangan RKP dalam Permen lingkup Hilirisasi Kelautan dan Perikanan ' + komoditas;
                if (month >= 7 && month <= 9) return 'Draft RKP dalam Perpres lingkup Hilirisasi Kelautan dan Perikanan ' + komoditas;
                return 'Draft Pemutakhiran RKP dalam Perpres lingkup Hilirisasi Kelautan dan Perikanan ' + komoditas;
            } else if (code === '002') {
                if (month >= 1 && month <= 4) return 'Konsep Pengembangan Kerangka Ekonomi Makro yang Terkait dengan Hilirisasi Bidang Kelautan dan Perikanan ' + komoditas;
                if (month >= 5 && month <= 8) return 'Data Pendukung untuk Penyusunan Kerangka/Model Hilirisasi Bidang Kelautan dan Perikanan ' + komoditas;
                return 'Skenario Proyeksi Pada Model Hilirisasi Bidang Kelautan dan Perikanan ' + komoditas;
            } else if (code === '003') {
                if (month >= 1 && month <= 4) return 'Input Bahan dan Data Isu Strategis Lingkup Hilirisasi Bidang Kelautan dan Perikanan ' + komoditas;
                if (month >= 5 && month <= 8) return 'Laporan Analisis Penyusunan Rekomendasi Isu Percepatan dan Penyelesaian Isu Strategis lingkup Hilirisasi Kelautan dan Perikanan ' + komoditas;
                return 'Laporan Koordinasi dan Diseminasi Rekomendasi Isu Strategis Lingkup Hilirisasi Bidang Kelautan dan Perikanan ' + komoditas;
            } else if (code === '004') {
                if (month >= 1 && month <= 6) return 'Laporan Analisis Data Evaluasi Rencana Pembangunan Lingkup Hilirisasi Bidang Kelautan dan Perikanan ' + komoditas;
                return 'Laporan Analisis Data Pemantauan Rencana Pembangunan Lingkup Hilirisasi Bidang Kelautan dan Perikanan ' + komoditas;
            } else if (code === '005') {
                return 'Bahan dan Data Penugasan Lain-Lain Lingkup Hilirisasi Bidang Kelautan dan Perikanan Komoditas ' + komoditas;
            }

            return window.getCategoryCodeDesc(code);
        };

        window.getFullSupportNames = function(supportIds) {
            if (!supportIds || supportIds.length === 0) return '';
            var nameMap = {
                'u1': 'Indra M',
                'u2': 'Mikhael Andreas',
                'u3': 'Admiral Athallah Darmawan',
                'u4': 'Rifqi Muammar'
            };
            return supportIds.map(function(id) {
                if (nameMap[id]) return nameMap[id];
                var u = (window.USERS || []).find(function(x) { return x.id === id; });
                return u ? u.name : '';
            }).filter(Boolean).join(', ');
        };

        window.getEPerfData = function() {
            var userIdEl = document.getElementById('ePerfUser');
            var codeEl = document.getElementById('ePerfCode');
            var monthEl = document.getElementById('ePerfMonth');

            var userId = userIdEl ? userIdEl.value : 'u2';
            var code = codeEl ? codeEl.value : '001';
            var monthVal = monthEl ? monthEl.value : 'ALL';
            var isAll = (monthVal === 'ALL');
            var month = parseInt(monthVal);

            function matchMonth(dateRef) {
                if (isAll) return true;
                var d = new Date(dateRef);
                if (isNaN(d.getTime())) return false;
                return (d.getMonth() + 1) === month;
            }

            var scopeEl = document.getElementById('ePerfScope');
            var scope = scopeEl ? scopeEl.value : 'INVOLVED';

            var matchingTasks = (window.tasks || []).filter(function(t) {
                if (t.code !== code) return false;
                if (scope === 'INVOLVED') {
                    // Hanya task di mana user adalah Lead ATAU Support/anggota
                    var involved = (t.leadId === userId) || (t.supportIds && t.supportIds.indexOf(userId) !== -1);
                    if (!involved) return false;
                }
                // scope === 'ALL' -> semua task berkode ini, tanpa peduli peran
                var dateRef = t.completedAt || t.deadline || t.createdAt || new Date().toISOString();
                return matchMonth(dateRef);
            });

            var matchingManual = (window.manualRecall || []).filter(function(m) {
                if (m.code !== code) return false;
                return matchMonth(m.date || new Date().toISOString());
            });

            var allItems = matchingTasks.concat(matchingManual);

            var artiKodeUtama = window.getCategoryCodeDesc(code);
            var artiKodeUser = isAll ? window.getCategoryCodeDesc(code) : window.getArtiKodeUser(userId, code, month);

            // Nama rekan penyusun: kumpulkan semua orang yang terlibat (lead + support)
            // di seluruh task yang cocok, kecuali pemilik laporan itu sendiri.
            var collab = {};
            matchingTasks.forEach(function(t) {
                if (t.leadId && t.leadId !== userId) collab[t.leadId] = true;
                (t.supportIds || []).forEach(function(sid) { if (sid !== userId) collab[sid] = true; });
            });
            var collabIds = Object.keys(collab);
            var supportNames = collabIds.length ? window.getFullSupportNames(collabIds) : 'tim pendukung';
            if (!supportNames) supportNames = 'tim pendukung';

            return {
                userId: userId, code: code, monthVal: monthVal, isAll: isAll,
                allItems: allItems, matchingTasks: matchingTasks, matchingManual: matchingManual,
                artiKodeUtama: artiKodeUtama, artiKodeUser: artiKodeUser, supportNames: supportNames
            };
        };

        window.updateEPerfOptions = function() {
            if (!document.getElementById('ePerfUser')) return;
            var data = window.getEPerfData();

            var countBadge = document.getElementById('ePerfTaskCountBadge');
            if (countBadge) countBadge.innerText = data.allItems.length + ' Dokumen/Task Cocok';

            var judulList = data.allItems.length > 0
                ? data.allItems.map(function(t, idx) { return (idx + 1) + '. ' + (t.title || 'Tanpa Judul') + (t.taskType ? ' (' + t.taskType + ')' : ''); }).join('\n')
                : '- (Belum ada task/dokumen yang dikategorikan pada kode & periode ini)';

            var linkList = data.allItems.length > 0
                ? data.allItems.map(function(t, idx) { 
                    var links = [];
                    if (t.docLink && t.docLink.trim() !== '') links.push(t.docLink);
                    if (t.scope === 'LINTAS_TIM' && t.docLink2 && t.docLink2.trim() !== '') links.push(t.docLink2 + ' [Lintas]');
                    return (idx + 1) + '. ' + (links.length > 0 ? links.join(' | ') : '(Belum ada link dokumen)');
                  }).join('\n')
                : '- (Belum ada link dokumen)';

            var templateStr = `Yth Mas Indra.
Tasking ${data.artiKodeUtama}:
Judul :
${judulList}

Untuk ${data.artiKodeUser}

Link Dokumen :
${linkList}

Dokumen penugasan disusun bersama dengan ${data.supportNames}. Terima kasih`;

            var previewEl = document.getElementById('ePerfPreviewText');
            if (previewEl) previewEl.innerText = templateStr;
        };

        window.downloadReportWord = function() {
            if (!window.docx) {
                alert("Library docx belum selesai dimuat. Silakan coba beberapa detik lagi.");
                return;
            }

            var data = window.getEPerfData();
            const { Document, Packer, Paragraph, TextRun } = window.docx;

            function P(text, bold) {
                return new Paragraph({
                    children: [ new TextRun({ text: text || '', bold: !!bold, size: 24, font: "Calibri" }) ],
                    spacing: { after: 120 }
                });
            }

            var children = [];
            children.push(P('Yth Mas Indra.'));
            children.push(P('Tasking ' + data.artiKodeUtama + ':', true));
            children.push(P('Judul :', true));

            if (data.allItems.length > 0) {
                data.allItems.forEach(function(t, idx) {
                    children.push(P((idx + 1) + '. ' + (t.title || 'Tanpa Judul') + (t.taskType ? ' (' + t.taskType + ')' : '')));
                });
            } else {
                children.push(P('- (Belum ada task/dokumen yang dikategorikan pada kode & periode ini)'));
            }

            children.push(P(''));
            children.push(P('Untuk ' + data.artiKodeUser, true));
            children.push(P(''));
            children.push(P('Link Dokumen :', true));

            if (data.allItems.length > 0) {
                data.allItems.forEach(function(t, idx) {
                    var links = [];
                    if (t.docLink && t.docLink.trim() !== '') links.push(t.docLink);
                    if (t.scope === 'LINTAS_TIM' && t.docLink2 && t.docLink2.trim() !== '') links.push(t.docLink2 + ' [Lintas]');
                    children.push(P((idx + 1) + '. ' + (links.length > 0 ? links.join(' | ') : '(Belum ada link dokumen)')));
                });
            } else {
                children.push(P('- (Belum ada link dokumen)'));
            }

            children.push(P(''));
            children.push(P('Dokumen penugasan disusun bersama dengan ' + data.supportNames + '. Terima kasih'));

            const doc = new Document({ sections: [{ properties: {}, children: children }] });
            var periodLabel = data.isAll ? 'SemuaBulan' : ('Bulan_' + data.monthVal);

            Packer.toBlob(doc).then(blob => {
                saveAs(blob, `Laporan_ePerformance_Kode_${data.code}_${periodLabel}.docx`);
            });
        };
