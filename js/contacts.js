// WorkTrack — contacts.js : Contact Stakeholder (v2)
// Fitur: sanitasi nomor WA (+62 / "-"), Tim/Fokus, pengelompokan bertingkat
// (Jenis > Instansi > Unit Kerja > Tim/Fokus), pencarian luas + deteksi nomor
// ganda, dan ekspor kontak terpilih ke Excel.

window.contacts = window.contacts || [];

// State UI (bertahan antar-render)
window._contactSelected = window._contactSelected || {}; // { id: true }
window._contactExpanded = window._contactExpanded || {}; // { path: true }
window._contactDupOnly = window._contactDupOnly || false;
window._contactFiltered = window._contactFiltered || []; // hasil filter terakhir

/* ------------------------------------------------------------------ */
/* Util keamanan: escape HTML agar input user tidak merusak markup     */
/* ------------------------------------------------------------------ */
window.escHtml = function(s) {
    return ('' + (s == null ? '' : s))
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};
// Token aman untuk atribut data-* (mendukung karakter non-ASCII)
window._encKey = function(s) {
    try { return btoa(unescape(encodeURIComponent('' + s))); }
    catch (e) { return encodeURIComponent('' + s); }
};

/* ------------------------------------------------------------------ */
/* Normalisasi & sanitasi nomor                                        */
/* ------------------------------------------------------------------ */
// Ubah nomor apa pun ke format WhatsApp (62...):
//  "+62 812-3456" -> "628123456" ; "0812-3456" -> "628123456"
window.normalizeWaNumber = function(raw) {
    if (!raw) return '';
    var d = ('' + raw).replace(/[^0-9]/g, '');
    if (!d) return '';
    if (d.indexOf('62') === 0) return d;
    if (d.indexOf('0') === 0) return '62' + d.slice(1);
    return '62' + d;
};

// Bersihkan input nomor agar tersimpan rapi & tidak bikin crash link WA.
// - WA  : selalu disimpan sebagai 62xxxxxxxx (tanpa "+", spasi, "-", "()").
// - TELP: buang spasi/"-"/"()"/titik; pertahankan "+" internasional bila ada.
window.sanitizeContactNumber = function(raw, numberType) {
    if (!raw) return '';
    var s = ('' + raw).trim();
    if (numberType === 'WA') return window.normalizeWaNumber(s);
    var hasPlus = s.charAt(0) === '+';
    var digits = s.replace(/[^0-9]/g, '');
    if (!digits) return '';
    return hasPlus ? ('+' + digits) : digits;
};

// Ikon WhatsApp (SVG inline)
window.waSvg = function(cls) {
    cls = cls || 'w-4 h-4';
    return '<svg viewBox="0 0 24 24" fill="currentColor" class="' + cls + '"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.006c6.585 0 11.946-5.335 11.949-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
};

window.contactOrgMeta = function(type) {
    switch (type) {
        case 'PEMERINTAH': return { label: '🏛️ Pemerintah / K/L', short: 'Pemerintah / K/L', badge: 'bg-blue-100 text-blue-700 border-blue-200' };
        case 'BADAN_USAHA': return { label: '🏢 Badan Usaha', short: 'Badan Usaha', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        case 'AKADEMISI': return { label: '🎓 Akademisi', short: 'Akademisi', badge: 'bg-amber-100 text-amber-700 border-amber-200' };
        default: return { label: '📌 Other', short: 'Other', badge: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
};

// Nama organisasi utama menurut jenisnya
window._contactOrgName = function(c) {
    return (c.orgType === 'PEMERINTAH') ? (c.instansi || '(Tanpa Instansi)') : (c.organisasi || '(Tanpa Organisasi)');
};

/* ------------------------------------------------------------------ */
/* Modal tambah/edit                                                   */
/* ------------------------------------------------------------------ */
window.onContactOrgTypeChange = function() {
    var type = document.getElementById('contactOrgType').value;
    var gov = document.getElementById('contactGovFields');
    var org = document.getElementById('contactOrgFields');
    if (type === 'PEMERINTAH') { gov.classList.remove('hidden'); org.classList.add('hidden'); }
    else { gov.classList.add('hidden'); org.classList.remove('hidden'); }
};

window.openContactModal = function(id) {
    var header = document.getElementById('contactModalHeader');
    document.getElementById('contactEditId').value = id || '';

    if (id) {
        var c = (window.contacts || []).find(function(x) { return x.id === id; });
        if (!c) return;
        header.innerText = '✏️ Edit Kontak Stakeholder';
        document.getElementById('contactOrgType').value = c.orgType || 'PEMERINTAH';
        document.getElementById('contactInstansi').value = c.instansi || '';
        document.getElementById('contactUnitKerja').value = c.unitKerja || '';
        document.getElementById('contactOrganisasi').value = c.organisasi || '';
        document.getElementById('contactTimFokus').value = c.timFokus || '';
        document.getElementById('contactPerson').value = c.personName || '';
        document.getElementById('contactJabatan').value = c.jabatan || '';
        document.getElementById('contactNumberType').value = c.numberType || 'WA';
        document.getElementById('contactNumber').value = c.number || '';
    } else {
        header.innerText = '➕ Tambah Kontak Stakeholder';
        document.getElementById('contactOrgType').value = 'PEMERINTAH';
        document.getElementById('contactInstansi').value = '';
        document.getElementById('contactUnitKerja').value = '';
        document.getElementById('contactOrganisasi').value = '';
        document.getElementById('contactTimFokus').value = '';
        document.getElementById('contactPerson').value = '';
        document.getElementById('contactJabatan').value = '';
        document.getElementById('contactNumberType').value = 'WA';
        document.getElementById('contactNumber').value = '';
    }

    window.onContactOrgTypeChange();
    window.openModal('contactModal');
};

window.submitContact = function(e) {
    e.preventDefault();
    var id = document.getElementById('contactEditId').value;
    var orgType = document.getElementById('contactOrgType').value;
    var instansi = document.getElementById('contactInstansi').value.trim();
    var unitKerja = document.getElementById('contactUnitKerja').value.trim();
    var organisasi = document.getElementById('contactOrganisasi').value.trim();
    var timFokus = document.getElementById('contactTimFokus').value.trim();
    var personName = document.getElementById('contactPerson').value.trim();
    var jabatan = document.getElementById('contactJabatan').value.trim();
    var numberType = document.getElementById('contactNumberType').value;
    var numberRaw = document.getElementById('contactNumber').value.trim();

    if (!personName) { alert('Nama orang wajib diisi.'); return; }
    if (!numberRaw) { alert('Nomor wajib diisi.'); return; }
    if (orgType === 'PEMERINTAH' && !instansi) { alert('Nama Instansi wajib diisi untuk Pemerintah / K/L.'); return; }
    if (orgType !== 'PEMERINTAH' && !organisasi) { alert('Nama Organisasi wajib diisi.'); return; }

    // Sanitasi nomor: buang "-", spasi, "()", dan "+" (WA jadi 62...).
    var number = window.sanitizeContactNumber(numberRaw, numberType);
    if (!number) { alert('Format nomor tidak valid.'); return; }
    var waNumber = (numberType === 'WA') ? window.normalizeWaNumber(number) : '';

    // Peringatan nomor ganda (tidak memblokir, hanya konfirmasi)
    var dupWith = (window.contacts || []).find(function(x) {
        if (id && x.id === id) return false;
        return (x.number || '').replace(/[^0-9]/g, '') === number.replace(/[^0-9]/g, '');
    });
    if (dupWith) {
        var ok = confirm('⚠️ Nomor ini sudah terdaftar atas nama "' + dupWith.personName +
            '" (' + window._contactOrgName(dupWith) + ').\nTetap simpan sebagai kontak terpisah?');
        if (!ok) return;
    }

    if (!window.contacts) window.contacts = [];

    if (id) {
        var c = window.contacts.find(function(x) { return x.id === id; });
        if (c) {
            c.orgType = orgType;
            c.instansi = (orgType === 'PEMERINTAH') ? instansi : '';
            c.unitKerja = (orgType === 'PEMERINTAH') ? unitKerja : '';
            c.organisasi = (orgType !== 'PEMERINTAH') ? organisasi : '';
            c.timFokus = timFokus;
            c.personName = personName;
            c.jabatan = jabatan;
            c.numberType = numberType;
            c.number = number;
            c.waNumber = waNumber;
        }
    } else {
        window.contacts.unshift({
            id: 'CT-' + Date.now(),
            orgType: orgType,
            instansi: (orgType === 'PEMERINTAH') ? instansi : '',
            unitKerja: (orgType === 'PEMERINTAH') ? unitKerja : '',
            organisasi: (orgType !== 'PEMERINTAH') ? organisasi : '',
            timFokus: timFokus,
            personName: personName,
            jabatan: jabatan,
            numberType: numberType,
            number: number,
            waNumber: waNumber,
            createdBy: window.currentUser ? window.currentUser.name : '',
            createdAt: new Date().toISOString()
        });
    }

    window.closeModal('contactModal');
    window.saveData();
    window.renderContacts();
};

window.deleteContact = function(id) {
    if (!confirm('Hapus kontak ini?')) return;
    window.contacts = (window.contacts || []).filter(function(x) { return x.id !== id; });
    if (window._contactSelected) delete window._contactSelected[id];
    window.saveData();
    window.renderContacts();
};

/* ------------------------------------------------------------------ */
/* Deteksi nomor ganda                                                 */
/* ------------------------------------------------------------------ */
window._contactDupSet = function() {
    var counts = {}, dup = {};
    (window.contacts || []).forEach(function(c) {
        var k = (c.number || '').replace(/[^0-9]/g, '');
        if (!k) return;
        counts[k] = (counts[k] || 0) + 1;
    });
    (window.contacts || []).forEach(function(c) {
        var k = (c.number || '').replace(/[^0-9]/g, '');
        if (k && counts[k] > 1) dup[c.id] = true;
    });
    return dup;
};

/* ------------------------------------------------------------------ */
/* Seleksi & toggle grup                                               */
/* ------------------------------------------------------------------ */
window.toggleContactSelect = function(id, checked) {
    if (!window._contactSelected) window._contactSelected = {};
    if (checked) window._contactSelected[id] = true; else delete window._contactSelected[id];
    window._updateContactSelBar();
};
window.selectAllFiltered = function(checked) {
    (window._contactFiltered || []).forEach(function(c) {
        if (checked) window._contactSelected[c.id] = true; else delete window._contactSelected[c.id];
    });
    window.renderContacts();
};
window.clearContactSelection = function() {
    window._contactSelected = {};
    window.renderContacts();
};
window.toggleContactDupOnly = function() {
    window._contactDupOnly = !window._contactDupOnly;
    window.renderContacts();
};
window.expandAllContacts = function(open) {
    if (!open) { window._contactExpanded = {}; window.renderContacts(); return; }
    // Tandai semua node yang muncul di hasil filter agar terbuka
    window._contactExpandAllFlag = true;
    window.renderContacts();
    window._contactExpandAllFlag = false;
};

window._updateContactSelBar = function() {
    var n = Object.keys(window._contactSelected || {}).filter(function(k) { return window._contactSelected[k]; }).length;
    var el = document.getElementById('contactSelCount');
    if (el) el.innerText = n;
    var btn = document.getElementById('contactExportBtn');
    if (btn) btn.disabled = (n === 0);
};

/* ------------------------------------------------------------------ */
/* Pengelompokan bertingkat (rekursif)                                 */
/* ------------------------------------------------------------------ */
function _groupList(items, keyFns) {
    if (!keyFns.length) return items.slice();
    var fn = keyFns[0], rest = keyFns.slice(1), map = {};
    items.forEach(function(it) {
        var k = fn(it) || '—';
        (map[k] = map[k] || []).push(it);
    });
    var out = {};
    Object.keys(map).sort(function(a, b) { return a.localeCompare(b, 'id'); })
        .forEach(function(k) { out[k] = _groupList(map[k], rest); });
    return out;
}
function _countLeaves(node) {
    if (Array.isArray(node)) return node.length;
    return Object.keys(node).reduce(function(s, k) { return s + _countLeaves(node[k]); }, 0);
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
window.renderContacts = function() {
    var container = document.getElementById('contactList');
    if (!container) return;

    var qEl = document.getElementById('contactSearchInput');
    var fEl = document.getElementById('contactFilterType');
    var query = (qEl ? qEl.value : '').toLowerCase().trim();
    var filterType = fEl ? fEl.value : 'ALL';
    var dupSet = window._contactDupSet();

    var list = (window.contacts || []).filter(function(c) {
        if (filterType !== 'ALL' && c.orgType !== filterType) return false;
        if (window._contactDupOnly && !dupSet[c.id]) return false;
        if (!query) return true;
        var numDigits = (c.number || '').replace(/[^0-9]/g, '');
        var hay = [c.personName, c.organisasi, c.instansi, c.unitKerja, c.timFokus,
                   c.jabatan, c.number, numDigits, c.waNumber]
            .map(function(x) { return ('' + (x || '')).toLowerCase(); }).join(' ');
        return hay.indexOf(query) !== -1;
    });

    window._contactFiltered = list;

    // Update bar ringkasan
    var dupCount = Object.keys(dupSet).length;
    var dupBtn = document.getElementById('contactDupBtn');
    if (dupBtn) {
        dupBtn.innerText = (window._contactDupOnly ? '✓ ' : '⚠️ ') + 'Nomor Ganda (' + dupCount + ')';
        dupBtn.className = 'text-xs font-semibold px-3 py-2 rounded-xl border transition ' +
            (window._contactDupOnly ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-200 hover:bg-red-50');
    }
    var totalEl = document.getElementById('contactTotalInfo');
    if (totalEl) totalEl.innerText = list.length + ' kontak tampil dari ' + (window.contacts || []).length + ' total';

    if (list.length === 0) {
        container.innerHTML = '<div class="text-center py-10 text-slate-400 text-xs bg-white rounded-2xl border">Tidak ada kontak yang cocok. Ubah kata kunci/filter, atau klik "➕ Tambah Kontak".</div>';
        window._updateContactSelBar();
        return;
    }

    var autoExpand = !!query || window._contactDupOnly || !!window._contactExpandAllFlag;

    var tree = _groupList(list, [
        function(c) { return window.contactOrgMeta(c.orgType).label; },
        function(c) { return window._contactOrgName(c); },
        function(c) { return c.unitKerja || '(Tanpa Unit Kerja)'; },
        function(c) { return c.timFokus || '(Tanpa Tim/Fokus)'; }
    ]);

    container.innerHTML = renderNode(tree, 0, '', autoExpand, dupSet);
    window._bindContactEvents();
    window._updateContactSelBar();
};

var LEVEL_ICON = ['🗂️', '🏢', '🧩', '🎯'];
function renderNode(node, depth, prefix, autoExpand, dupSet) {
    if (Array.isArray(node)) {
        return '<div class="space-y-2 pt-1">' + node.map(function(c) { return contactRow(c, dupSet); }).join('') + '</div>';
    }
    return Object.keys(node).map(function(k) {
        var path = prefix + '›' + k;
        var expanded = autoExpand || !!window._contactExpanded[path];
        if (autoExpand) window._contactExpanded[path] = true;
        var count = _countLeaves(node[k]);
        var pad = 'padding-left:' + (depth * 10) + 'px';
        var headCls = depth === 0
            ? 'bg-slate-900 text-white'
            : (depth === 1 ? 'bg-slate-100 text-slate-800' : 'bg-slate-50 text-slate-700');
        var textSize = depth === 0 ? 'text-sm font-bold' : (depth === 1 ? 'text-xs font-bold' : 'text-xs font-semibold');
        var wrap = depth === 0 ? 'rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-3' : 'border-t border-slate-100';

        return '<div class="' + wrap + '" style="' + (depth > 0 ? pad : '') + '">' +
            '<button type="button" data-toggle="1" data-key="' + window._encKey(path) + '" ' +
                'class="w-full flex items-center justify-between gap-2 px-3 py-2.5 ' + headCls + ' hover:opacity-95 transition text-left">' +
                '<span class="flex items-center gap-2 min-w-0 ' + textSize + '">' +
                    '<span>' + LEVEL_ICON[depth] + '</span>' +
                    '<span class="truncate">' + window.escHtml(k) + '</span>' +
                '</span>' +
                '<span class="flex items-center gap-2 flex-shrink-0">' +
                    '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full ' + (depth === 0 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600') + '">' + count + '</span>' +
                    '<span class="text-[10px] transition-transform ' + (expanded ? 'rotate-90' : '') + '">▶</span>' +
                '</span>' +
            '</button>' +
            '<div class="' + (expanded ? '' : 'hidden') + ' px-2 pb-2">' +
                renderNode(node[k], depth + 1, path, autoExpand, dupSet) +
            '</div>' +
        '</div>';
    }).join('');
}

function contactRow(c, dupSet) {
    var isDup = dupSet[c.id];
    var checked = !!(window._contactSelected && window._contactSelected[c.id]);
    var numDigits = (c.number || '').replace(/[^0-9]/g, '');
    var numberAction;
    if (c.numberType === 'WA') {
        var wa = c.waNumber || window.normalizeWaNumber(c.number);
        numberAction = '<a href="https://wa.me/' + encodeURIComponent(wa) + '" target="_blank" rel="noopener noreferrer" ' +
            'class="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition">' +
            window.waSvg('w-3.5 h-3.5') + '<span>WA</span></a>' +
            '<span class="text-[11px] text-slate-500">' + window.escHtml(c.number) + '</span>';
    } else {
        numberAction = '<a href="tel:' + encodeURIComponent(numDigits) + '" ' +
            'class="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition border border-slate-200">' +
            '📞 <span>' + window.escHtml(c.number) + '</span></a>';
    }

    return '<div class="bg-white border ' + (isDup ? 'border-red-300' : 'border-slate-200') + ' rounded-xl p-3 flex items-center gap-3">' +
        '<input type="checkbox" data-cid="' + window.escHtml(c.id) + '" ' + (checked ? 'checked' : '') + ' ' +
            'class="contact-cb w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 flex-shrink-0">' +
        '<div class="min-w-0 flex-1">' +
            '<div class="flex items-center gap-2 flex-wrap">' +
                '<span class="font-semibold text-slate-800 text-xs truncate">👤 ' + window.escHtml(c.personName || '-') + '</span>' +
                (isDup ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">⚠️ Nomor ganda</span>' : '') +
            '</div>' +
            (c.jabatan ? '<div class="text-[11px] text-slate-500 truncate">' + window.escHtml(c.jabatan) + '</div>' : '') +
            '<div class="flex items-center gap-2 flex-wrap mt-1.5">' + numberAction + '</div>' +
        '</div>' +
        '<div class="flex items-center gap-1 flex-shrink-0">' +
            '<button type="button" data-edit="' + window.escHtml(c.id) + '" class="text-blue-600 hover:bg-blue-50 p-1 rounded-lg text-xs border border-blue-200" title="Edit">✏️</button>' +
            '<button type="button" data-del="' + window.escHtml(c.id) + '" class="text-red-500 hover:bg-red-50 p-1 rounded-lg text-xs border border-red-200" title="Hapus">🗑️</button>' +
        '</div>' +
    '</div>';
}

// Event delegation (aman, tanpa inline onclick pada data user)
window._bindContactEvents = function() {
    var container = document.getElementById('contactList');
    if (!container) return;

    container.onclick = function(e) {
        var tgl = e.target.closest('[data-toggle]');
        if (tgl) {
            var path;
            try { path = decodeURIComponent(escape(atob(tgl.getAttribute('data-key')))); }
            catch (err) { path = decodeURIComponent(tgl.getAttribute('data-key')); }
            window._contactExpanded[path] = !window._contactExpanded[path];
            window.renderContacts();
            return;
        }
        var ed = e.target.closest('[data-edit]');
        if (ed) { window.openContactModal(ed.getAttribute('data-edit')); return; }
        var dl = e.target.closest('[data-del]');
        if (dl) { window.deleteContact(dl.getAttribute('data-del')); return; }
    };

    container.onchange = function(e) {
        var cb = e.target.closest('.contact-cb');
        if (cb) window.toggleContactSelect(cb.getAttribute('data-cid'), cb.checked);
    };
};

/* ------------------------------------------------------------------ */
/* Ekspor kontak terpilih ke Excel (.xlsx via SheetJS, fallback CSV)   */
/* ------------------------------------------------------------------ */
window.exportContactsExcel = function() {
    var ids = Object.keys(window._contactSelected || {}).filter(function(k) { return window._contactSelected[k]; });
    var source = (window.contacts || []).filter(function(c) { return ids.indexOf(c.id) !== -1; });

    if (source.length === 0) {
        alert('Belum ada kontak yang dipilih. Centang kontak yang ingin diekspor terlebih dahulu.');
        return;
    }

    var headers = ['Jenis Kontak', 'Instansi / Organisasi', 'Unit Kerja', 'Tim / Fokus',
                   'Nama', 'Jabatan', 'Jenis Nomor', 'Nomor', 'Nomor WA (62)', 'Dibuat Oleh', 'Tanggal Dibuat'];
    var rows = source.map(function(c) {
        return [
            window.contactOrgMeta(c.orgType).short,
            window._contactOrgName(c),
            c.unitKerja || '',
            c.timFokus || '',
            c.personName || '',
            c.jabatan || '',
            c.numberType === 'WA' ? 'WhatsApp' : 'Telepon',
            c.number || '',
            c.numberType === 'WA' ? (c.waNumber || window.normalizeWaNumber(c.number)) : '',
            c.createdBy || '',
            c.createdAt ? new Date(c.createdAt).toLocaleString('id-ID') : ''
        ];
    });

    var stamp = new Date().toISOString().slice(0, 10);
    var fname = 'Kontak_Stakeholder_' + stamp;

    // Utama: SheetJS -> .xlsx asli
    if (typeof XLSX !== 'undefined') {
        var aoa = [headers].concat(rows);
        var ws = XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = headers.map(function(h, i) {
            var max = h.length;
            rows.forEach(function(r) { max = Math.max(max, ('' + (r[i] || '')).length); });
            return { wch: Math.min(max + 2, 45) };
        });
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Kontak');
        XLSX.writeFile(wb, fname + '.xlsx');
        return;
    }

    // Fallback: CSV (tetap terbuka di Excel) bila library belum termuat
    var csv = [headers].concat(rows).map(function(r) {
        return r.map(function(v) { return '"' + ('' + (v == null ? '' : v)).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\r\n');
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    if (typeof saveAs === 'function') saveAs(blob, fname + '.csv');
    else {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = fname + '.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    alert('Library Excel belum termuat, file diekspor sebagai CSV (tetap bisa dibuka di Excel).');
};
