// WorkTrack — contacts.js : Contact Stakeholder (direktori kontak + WhatsApp/Telepon)

window.contacts = window.contacts || [];

// Ubah nomor apa pun ke format WhatsApp (62...). Contoh:
//  "0812-3456"  -> "628123456"
//  "8123456"    -> "628123456"
//  "+62 812..." -> "62812..."
//  "62812..."   -> "62812..."
window.normalizeWaNumber = function(raw) {
    if (!raw) return '';
    var d = ('' + raw).replace(/[^0-9]/g, '');
    if (!d) return '';
    if (d.indexOf('62') === 0) return d;
    if (d.indexOf('0') === 0) return '62' + d.slice(1);
    return '62' + d;
};

// Ikon WhatsApp (SVG inline, tidak butuh internet)
window.waSvg = function(cls) {
    cls = cls || 'w-4 h-4';
    return '<svg viewBox="0 0 24 24" fill="currentColor" class="' + cls + '"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.006c6.585 0 11.946-5.335 11.949-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
};

window.contactOrgMeta = function(type) {
    switch (type) {
        case 'PEMERINTAH': return { label: '🏛️ Pemerintah / K/L', badge: 'bg-blue-100 text-blue-700 border-blue-200' };
        case 'BADAN_USAHA': return { label: '🏢 Badan Usaha', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        case 'AKADEMISI': return { label: '🎓 Akademisi', badge: 'bg-amber-100 text-amber-700 border-amber-200' };
        default: return { label: '📌 Other', badge: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
};

// Tampilkan/sembunyikan field sesuai jenis organisasi
window.onContactOrgTypeChange = function() {
    var type = document.getElementById('contactOrgType').value;
    var gov = document.getElementById('contactGovFields');
    var org = document.getElementById('contactOrgFields');
    if (type === 'PEMERINTAH') {
        gov.classList.remove('hidden');
        org.classList.add('hidden');
    } else {
        gov.classList.add('hidden');
        org.classList.remove('hidden');
    }
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
    var personName = document.getElementById('contactPerson').value.trim();
    var jabatan = document.getElementById('contactJabatan').value.trim();
    var numberType = document.getElementById('contactNumberType').value;
    var number = document.getElementById('contactNumber').value.trim();

    if (!personName) { alert('Nama orang wajib diisi.'); return; }
    if (!number) { alert('Nomor wajib diisi.'); return; }
    if (orgType === 'PEMERINTAH' && !instansi) { alert('Nama Instansi wajib diisi untuk Pemerintah / K/L.'); return; }
    if (orgType !== 'PEMERINTAH' && !organisasi) { alert('Nama Organisasi wajib diisi.'); return; }

    var waNumber = (numberType === 'WA') ? window.normalizeWaNumber(number) : '';

    if (!window.contacts) window.contacts = [];

    if (id) {
        var c = window.contacts.find(function(x) { return x.id === id; });
        if (c) {
            c.orgType = orgType;
            c.instansi = (orgType === 'PEMERINTAH') ? instansi : '';
            c.unitKerja = (orgType === 'PEMERINTAH') ? unitKerja : '';
            c.organisasi = (orgType !== 'PEMERINTAH') ? organisasi : '';
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
    window.saveData();
    window.renderContacts();
};

window.renderContacts = function() {
    var container = document.getElementById('contactList');
    if (!container) return;

    var qEl = document.getElementById('contactSearchInput');
    var fEl = document.getElementById('contactFilterType');
    var query = (qEl ? qEl.value : '').toLowerCase().trim();
    var filterType = fEl ? fEl.value : 'ALL';

    var list = (window.contacts || []).filter(function(c) {
        if (filterType !== 'ALL' && c.orgType !== filterType) return false;
        if (!query) return true;
        var hay = [c.personName, c.organisasi, c.instansi, c.unitKerja, c.jabatan]
            .map(function(x) { return (x || '').toLowerCase(); }).join(' ');
        return hay.indexOf(query) !== -1;
    });

    if (list.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border">Belum ada kontak yang cocok. Klik "➕ Tambah Kontak" untuk menambah.</div>';
        return;
    }

    container.innerHTML = list.map(function(c) {
        var meta = window.contactOrgMeta(c.orgType);
        var isGov = c.orgType === 'PEMERINTAH';

        var orgTitle = isGov ? (c.instansi || '-') : (c.organisasi || '-');
        var orgSub = isGov && c.unitKerja ? '<div class="text-[11px] text-slate-500">' + c.unitKerja + '</div>' : '';

        var numDigits = (c.number || '').replace(/[^0-9]/g, '');
        var numberAction;
        if (c.numberType === 'WA') {
            var wa = c.waNumber || window.normalizeWaNumber(c.number);
            numberAction = '<a href="https://wa.me/' + wa + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">' +
                window.waSvg('w-4 h-4') + '<span>WhatsApp</span></a>' +
                '<span class="text-[11px] text-slate-500">' + (c.number || '') + '</span>';
        } else {
            numberAction = '<a href="tel:' + numDigits + '" class="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition border border-slate-200">' +
                '📞 <span>' + (c.number || '') + '</span></a>';
        }

        return '<div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5 relative flex flex-col">' +
            '<div class="flex justify-between items-start gap-2">' +
                '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ' + meta.badge + '">' + meta.label + '</span>' +
                '<div class="flex items-center gap-1">' +
                    '<button onclick="window.openContactModal(\'' + c.id + '\')" class="text-blue-600 hover:bg-blue-50 p-1 rounded-lg text-xs font-bold border border-blue-200" title="Edit">✏️</button>' +
                    '<button onclick="window.deleteContact(\'' + c.id + '\')" class="text-red-500 hover:bg-red-50 p-1 rounded-lg text-xs font-bold border border-red-200" title="Hapus">🗑️</button>' +
                '</div>' +
            '</div>' +

            '<div>' +
                '<div class="font-bold text-slate-900 text-sm leading-snug">' + orgTitle + '</div>' +
                orgSub +
            '</div>' +

            '<div class="border-t pt-2">' +
                '<div class="font-semibold text-slate-800 text-xs">👤 ' + (c.personName || '-') + '</div>' +
                (c.jabatan ? '<div class="text-[11px] text-slate-500">' + c.jabatan + '</div>' : '') +
            '</div>' +

            '<div class="flex items-center gap-2 flex-wrap mt-auto pt-1">' + numberAction + '</div>' +
        '</div>';
    }).join('');
};
