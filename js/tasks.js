// WorkTrack — tasks.js : task, chat, revisi, workload
window.adminDeleteTask = function(taskId) {
            if (confirm("[ADMIN] Hapus Task ini secara permanen dari Cloud?")) {
                window.tasks = window.tasks.filter(function(t) { return t.id !== taskId; });
                window.saveData();
            }
        };

        window.openRecallToActiveModal = function(taskId) {
            if (!window.currentUser || window.currentUser.role !== 'admin') {
                alert("Akses ditolak. Hanya Admin yang dapat mengembalikan task ke aktif.");
                return;
            }
            document.getElementById('recallTaskId').value = taskId;
            document.getElementById('recallReason').value = '';
            window.openModal('recallToActiveModal');
        };

        window.submitRecallToActive = function(e) {
            e.preventDefault();
            if (!window.currentUser || window.currentUser.role !== 'admin') {
                alert("Akses ditolak. Hanya Admin.");
                return;
            }
            var id = document.getElementById('recallTaskId').value;
            var reason = document.getElementById('recallReason').value.trim();
            var t = window.tasks.find(function(x) { return x.id === id; });
            if (t) {
                t.status = 'BACK_PROGRESS';
                t.completedAt = null;
                if (!t.recalls) t.recalls = [];
                t.recalls.unshift({
                    reason: reason,
                    by: window.currentUser.name,
                    date: new Date().toLocaleString('id-ID')
                });
                window.saveData();
            }
            window.closeModal('recallToActiveModal');
            window.switchTab('tasks');
        };

        window.toggleScopeLinks = function() {
            var scope = document.getElementById('taskScope').value;
            var link2Container = document.getElementById('link2Container');
            if (scope === 'LINTAS_TIM') {
                link2Container.classList.remove('hidden');
            } else {
                link2Container.classList.add('hidden');
            }
        };

        window.toggleStScopeLinks = function() {
            var scope = document.getElementById('stScope').value;
            var container = document.getElementById('stLink2Container');
            if (scope === 'LINTAS_TIM') {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        };

        window.submitProposeTask = function(e) {
            e.preventDefault();
            window.tasks.unshift({
                id: 'TSK-' + Date.now(),
                title: document.getElementById('propTitle').value,
                scope: document.getElementById('propScope').value || 'INTERNAL',
                taskType: document.getElementById('propTaskType').value || '📄 Laporan / Resume',
                code: document.getElementById('propCategoryCode').value || '001',
                leadId: window.currentUser.id,
                supportIds: [],
                outputs: [document.getElementById('propTaskType').value || '📄 Laporan / Resume'],
                deadline: '',
                desc: document.getElementById('propDesc').value,
                status: 'PROPOSED',
                docLink: document.getElementById('propDocLink').value.trim(),
                docLink2: '',
                sections: [],
                keywords: [],
                chats: [],
                revisions: [],
                recalls: [],
                completedAt: null,
                createdAt: new Date().toISOString()
            });
            window.closeModal('proposeTaskModal');
            window.saveData();
        };

        window.openEditOrAssignModal = function(taskId) {
            var t = window.tasks.find(function(x) { return x.id === taskId; });
            if (!t) return;
            document.getElementById('editTaskId').value = t.id;
            document.getElementById('taskModalHeader').innerText = 'Atur Tim & Assign Task';
            document.getElementById('taskTitle').value = t.title;
            document.getElementById('taskScope').value = t.scope || 'INTERNAL';
            if (t.taskType) document.getElementById('taskTaskType').value = t.taskType;
            document.getElementById('taskCategoryCode').value = t.code || '001';
            document.getElementById('taskLead').value = t.leadId || '';
            document.getElementById('taskDesc').value = t.desc || '';
            document.getElementById('taskDeadline').value = t.deadline || '';
            document.getElementById('taskDocLink').value = t.docLink || '';
            document.getElementById('taskDocLink2').value = t.docLink2 || '';

            var checkboxes = document.querySelectorAll('input[name="taskSupport"]');
            checkboxes.forEach(function(cb) {
                cb.checked = t.supportIds && t.supportIds.indexOf(cb.value) !== -1;
            });

            window.toggleScopeLinks();
            window.openModal('taskModal');
        };

        window.submitNewTask = function(e) {
            e.preventDefault();
            var taskId = document.getElementById('editTaskId').value;
            var supports = Array.from(document.querySelectorAll('input[name="taskSupport"]:checked')).map(function(cb) { return cb.value; });
            var selectedTaskType = document.getElementById('taskTaskType').value || '📄 Laporan / Resume';
            var scope = document.getElementById('taskScope').value || 'INTERNAL';

            if (taskId) {
                var t = window.tasks.find(function(x) { return x.id === taskId; });
                if (t) {
                    t.title = document.getElementById('taskTitle').value;
                    t.scope = scope;
                    t.taskType = selectedTaskType;
                    t.code = document.getElementById('taskCategoryCode').value || '001';
                    t.leadId = document.getElementById('taskLead').value;
                    t.supportIds = supports;
                    t.deadline = document.getElementById('taskDeadline').value;
                    t.desc = document.getElementById('taskDesc').value;
                    t.docLink = document.getElementById('taskDocLink').value.trim();
                    t.docLink2 = (scope === 'LINTAS_TIM') ? document.getElementById('taskDocLink2').value.trim() : '';
                    if (t.status === 'PROPOSED') t.status = 'PENDING_STAFF_SETUP';
                }
            } else {
                window.tasks.unshift({
                    id: 'TSK-' + Date.now(),
                    title: document.getElementById('taskTitle').value,
                    scope: scope,
                    taskType: selectedTaskType,
                    code: document.getElementById('taskCategoryCode').value || '001',
                    leadId: document.getElementById('taskLead').value,
                    supportIds: supports,
                    outputs: [selectedTaskType],
                    deadline: document.getElementById('taskDeadline').value,
                    desc: document.getElementById('taskDesc').value,
                    status: 'PENDING_STAFF_SETUP',
                    docLink: document.getElementById('taskDocLink').value.trim(),
                    docLink2: (scope === 'LINTAS_TIM') ? document.getElementById('taskDocLink2').value.trim() : '',
                    sections: [],
                    keywords: [],
                    chats: [],
                    revisions: [],
                    recalls: [],
                    completedAt: null,
                    createdAt: new Date().toISOString()
                });
            }

            document.getElementById('editTaskId').value = '';
            window.closeModal('taskModal');
            window.saveData();
        };

        window.openStaffDetailModal = function(taskId, isEditMode) {
            var t = window.tasks.find(function(x) { return x.id === taskId; });
            if (!t) return;
            document.getElementById('stDetailTaskId').value = t.id;
            document.getElementById('stTitle').value = t.title || '';
            document.getElementById('stScope').value = t.scope || 'INTERNAL';
            if (t.taskType) document.getElementById('stTaskType').value = t.taskType;
            document.getElementById('stCategoryCode').value = t.code || '001';
            document.getElementById('stLink').value = t.docLink || '';
            document.getElementById('stLink2').value = t.docLink2 || '';
            document.getElementById('stSections').value = (t.sections || []).join('\n');
            document.getElementById('stKeywords').value = (t.keywords || []).join(', ');

            window.toggleStScopeLinks();

            if (isEditMode) {
                document.getElementById('stModalHeader').innerHTML = '<span>✏️</span> Edit Rincian & Link Task';
                document.getElementById('stSubmitBtn').innerText = 'Simpan Perubahan';
                document.getElementById('stSubmitBtn').className = 'w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow transition text-xs mt-2';
            } else {
                document.getElementById('stModalHeader').innerHTML = '<span>📝</span> Detailkan Pengerjaan & Arsip';
                document.getElementById('stSubmitBtn').innerText = 'Simpan & Mulai "In Progress"';
                document.getElementById('stSubmitBtn').className = 'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow transition text-xs mt-2';
            }

            window.openModal('staffDetailModal');
        };

        window.submitStaffTaskDetails = function(e) {
            e.preventDefault();
            var id = document.getElementById('stDetailTaskId').value;
            var t = window.tasks.find(function(x) { return x.id === id; });
            if (t) {
                t.title = document.getElementById('stTitle').value;
                t.scope = document.getElementById('stScope').value || 'INTERNAL';
                t.taskType = document.getElementById('stTaskType').value || '📄 Laporan / Resume';
                t.code = document.getElementById('stCategoryCode').value || '001';
                t.outputs = [t.taskType, window.getCategoryCodeDesc(t.code)];
                t.docLink = document.getElementById('stLink').value.trim();
                t.docLink2 = (t.scope === 'LINTAS_TIM') ? document.getElementById('stLink2').value.trim() : '';
                
                var rawSections = document.getElementById('stSections').value;
                t.sections = rawSections.split(/[\n,]+/).map(function(s){return s.trim();}).filter(Boolean);
                
                t.keywords = document.getElementById('stKeywords').value.split(',').map(function(k){return k.trim();}).filter(Boolean);
                
                if (t.status === 'PENDING_STAFF_SETUP') {
                    t.status = 'IN_PROGRESS';
                }
                window.saveData();
            }
            window.closeModal('staffDetailModal');
        };

        window.submitDoneByStaff = function(id) {
            var t = window.tasks.find(function(x) { return x.id === id; });
            if (t) {
                t.status = 'REVIEW';
                window.saveData();
            }
        };

        window.approveTaskDone = function(id) {
            var t = window.tasks.find(function(x) { return x.id === id; });
            if (t) {
                t.status = 'DONE';
                t.completedAt = new Date().toISOString();
                window.saveData();
            }
        };

        window.openChatModal = function(taskId) {
            var t = window.tasks.find(function(x) { return x.id === taskId; });
            if (!t && typeof window.manualRecall !== 'undefined') {
                t = window.manualRecall.find(function(x) { return x.id === taskId; });
            }
            if (!t) return;

            document.getElementById('chatTaskId').value = t.id;
            var isDone = t.status === 'DONE' || !t.status;
            
            document.getElementById('chatTaskTitle').innerText = '💬 ' + t.title + (isDone ? ' (Arsip Selesai)' : '');

            var formContainer = document.getElementById('chatFormContainer');
            var readOnlyNotice = document.getElementById('chatReadOnlyNotice');

            if (isDone) {
                if (formContainer) formContainer.classList.add('hidden');
                if (readOnlyNotice) readOnlyNotice.classList.remove('hidden');
            } else {
                if (formContainer) formContainer.classList.remove('hidden');
                if (readOnlyNotice) readOnlyNotice.classList.add('hidden');
            }

            window.renderChatMessages(t);
            window.openModal('chatModal');
        };

        window.sendMessage = function(e) {
            e.preventDefault();
            var taskId = document.getElementById('chatTaskId').value;
            var textInput = document.getElementById('chatInputText');
            var t = window.tasks.find(function(x) { return x.id === taskId; });
            if (t && textInput.value.trim()) {
                if (!t.chats) t.chats = [];
                t.chats.push({
                    senderName: window.currentUser.name,
                    text: textInput.value.trim(),
                    time: new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})
                });
                textInput.value = '';
                window.renderChatMessages(t);
                window.saveData();
            }
        };

        window.deleteChatMessage = function(taskId, chatIndex) {
            if (!confirm("Hapus pesan ini dari ruang chat?")) return;
            var t = window.tasks.find(function(x) { return x.id === taskId; });
            if (t && t.chats && t.chats[chatIndex]) {
                if (t.chats[chatIndex].senderName !== window.currentUser.name && window.currentUser.role !== 'admin') {
                    alert("Anda hanya bisa menghapus pesan milik Anda sendiri.");
                    return;
                }
                t.chats.splice(chatIndex, 1);
                window.renderChatMessages(t);
                window.saveData();
            }
        };

        window.renderChatMessages = function(task) {
            var container = document.getElementById('chatMessageList');
            if (!task.chats || task.chats.length === 0) {
                container.innerHTML = '<div class="text-center py-10 text-slate-400 text-xs">Belum ada percakapan. Tuliskan @nama untuk men-tag teman...</div>';
                return;
            }

            var isTaskDone = (task.status === 'DONE' || !task.status);

            container.innerHTML = task.chats.map(function(c, idx) {
                var isMe = window.currentUser && window.currentUser.name === c.senderName;
                
                var urlRegex = /(https?:\/\/[^\s]+)/g;
                var textWithLinks = c.text.replace(urlRegex, function(url) {
                    return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 break-all font-semibold ' + (isMe ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800') + '">' + url + '↗</a>';
                });

                var formattedText = textWithLinks.replace(/@([a-zA-Z0-9_\s]+)/g, function(match, name) {
                    return '<span class="font-bold underline decoration-amber-300 bg-amber-400/30 px-1 rounded">@' + name.trim() + '</span>';
                });

                return '<div class="flex flex-col ' + (isMe ? 'items-end' : 'items-start') + ' w-full my-1">' +
                    '<div class="text-[9px] text-slate-400 mb-0.5 px-1 flex items-center gap-1.5">' + 
                        '<span>' + c.senderName + ' • ' + c.time + '</span>' +
                        (isMe && !isTaskDone ? '<button onclick="window.deleteChatMessage(\'' + task.id + '\', ' + idx + ')" class="text-slate-400 hover:text-red-500 font-bold p-0.5 transition" title="Hapus Pesan">🗑️</button>' : '') +
                    '</div>' +
                    '<div class="px-3 py-2 rounded-2xl max-w-[85%] sm:max-w-[80%] chat-bubble-content leading-relaxed shadow-sm text-xs ' + 
                        (isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none') + '">' +
                        formattedText +
                    '</div>' +
                '</div>';
            }).join('');

            setTimeout(function() {
                container.scrollTop = container.scrollHeight;
            }, 50);
        };

        window.openRevisionModal = function(taskId) {
            var t = window.tasks.find(function(x) { return x.id === taskId; });
            if (!t) return;
            document.getElementById('revTaskId').value = t.id;
            document.getElementById('revNotes').value = '';
            window.openModal('revisionModal');
        };

        window.submitRevision = function(e) {
            e.preventDefault();
            var taskId = document.getElementById('revTaskId').value;
            var t = window.tasks.find(function(x) { return x.id === taskId; });
            if (t) {
                if (!t.revisions) t.revisions = [];
                t.revisions.unshift({
                    notes: document.getElementById('revNotes').value,
                    date: new Date().toLocaleString('id-ID')
                });
                t.status = 'REVISION';
                window.saveData();
            }
            window.closeModal('revisionModal');
        };

        window.renderTaskSections = function(t) {
            if (!t.sections || t.sections.length === 0) return '';
            var secId = 'tasksec-' + t.id;
            var listHtml = t.sections.map(function(sec){ return '<li>' + sec + '</li>'; }).join('');
            var joined = t.sections.join(' ');
            var isLong = t.sections.length > 3 || joined.length > 160;

            if (!isLong) {
                return '<div class="text-xs bg-slate-50 p-2 rounded-xl border space-y-1">' +
                    '<div class="font-semibold text-slate-700">📌 Section/Poin Utama:</div>' +
                    '<ul class="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">' + listHtml + '</ul>' +
                '</div>';
            }

            return '<div class="text-xs bg-slate-50 rounded-xl border overflow-hidden">' +
                '<button type="button" onclick="window.toggleAccordion(\'' + secId + '\')" class="w-full flex items-center justify-between gap-2 p-2 text-left font-semibold text-slate-700 hover:bg-slate-100 transition">' +
                    '<span>📌 Section/Poin Utama (' + t.sections.length + ')</span>' +
                    '<span class="text-[10px] text-blue-600 font-bold whitespace-nowrap">Lihat Detail ▼</span>' +
                '</button>' +
                '<div id="' + secId + '" class="hidden px-2 pb-2 border-t border-slate-200 pt-2">' +
                    '<ul class="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">' + listHtml + '</ul>' +
                '</div>' +
            '</div>';
        };

        window.renderTasks = function() {
            var container = document.getElementById('taskList');
            if (!container) return;

            var activeTasks = window.tasks.filter(function(t) { return t.status !== 'DONE'; });

            if (activeTasks.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border">Belum ada tugas aktif.</div>';
                return;
            }

            container.innerHTML = activeTasks.map(function(t) {
                var lead = window.USERS.find(function(u) { return u.id === t.leadId; });
                var supportNames = (t.supportIds || []).map(function(sid) { 
                    var u = window.USERS.find(function(x) { return x.id === sid; });
                    return u ? u.name : '';
                }).filter(Boolean).join(', ');
                
                var isKoor = window.currentUser && (window.currentUser.role === 'koordinator' || window.currentUser.role === 'admin');
                var isStaffLead = window.currentUser && (window.currentUser.id === t.leadId);
                var isAdmin = window.currentUser && window.currentUser.role === 'admin';

                var canStaffUpdate = isStaffLead || isAdmin;
                var latestRevision = (t.revisions && t.revisions.length > 0) ? t.revisions[0] : null;
                var latestRecall = (t.recalls && t.recalls.length > 0) ? t.recalls[0] : null;

                var displayTaskType = t.taskType || (t.outputs && t.outputs[0]) || '📄 Laporan / Resume';
                var isLintas = t.scope === 'LINTAS_TIM';

                return '<div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 relative h-full flex flex-col">' +
                    (isAdmin ? '<button onclick="window.adminDeleteTask(\'' + t.id + '\')" class="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-red-200 z-10" title="Hapus Admin">🗑️</button>' : '') +
                    
                    '<div class="grid grid-cols-4 items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100 text-[10px] sm:text-xs font-medium">' +
                        '<div class="text-left font-bold text-slate-700 truncate">' +
                            '<span class="px-2 py-0.5 rounded-full inline-block truncate max-w-full ' + window.getStatusBadgeClass(t.status) + '">' + t.status + '</span>' +
                        '</div>' +
                        '<div class="text-center font-bold text-blue-600 truncate">' +
                            '[' + (t.code || '001') + ']' +
                        '</div>' +
                        '<div class="text-center text-slate-600 truncate font-semibold">' +
                            displayTaskType +
                        '</div>' +
                        '<div class="text-right text-slate-400 font-semibold truncate">' +
                            'DL: ' + (t.deadline ? new Date(t.deadline).toLocaleDateString('id-ID') : '-') +
                        '</div>' +
                    '</div>' +

                    '<div class="flex items-center gap-2">' +
                        '<h3 class="font-bold text-slate-900 text-xs sm:text-sm flex-grow">' + t.title + '</h3>' +
                        '<span class="px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ' + (isLintas ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200') + '">' + (isLintas ? '🌐 Lintas Tim' : '🏠 Internal') + '</span>' +
                    '</div>' +

                    '<p class="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border">' + t.desc + '</p>' +
                    
                    (t.status === 'BACK_PROGRESS' && latestRecall ? '<div class="bg-orange-50 border border-orange-300 p-2.5 rounded-xl text-xs space-y-1"><div class="font-bold text-orange-700">↩️ Dikembalikan dari Arsip oleh ' + (latestRecall.by || 'Admin') + ':</div><div class="text-slate-700">' + latestRecall.reason + '</div><div class="text-[10px] text-slate-400">' + (latestRecall.date || '') + '</div></div>' : '') +

                    (latestRevision ? '<div class="bg-red-50 border border-red-200 p-2.5 rounded-xl text-xs space-y-1"><div class="font-bold text-red-700">⚠️ Arahan Revisi Terakhir:</div><div class="text-slate-700">' + latestRevision.notes + '</div></div>' : '') +

                    '<div class="text-xs text-slate-500 space-y-0.5">' +
                        '<div>👤 <b>Lead:</b> ' + (lead ? lead.name : '-') + '</div>' +
                        '<div>👥 <b>Support:</b> ' + (supportNames || '<span class="italic text-slate-400">Belum ada</span>') + '</div>' +
                    '</div>' +

                    '<div class="space-y-1">' +
                        (t.docLink ? '<a href="' + t.docLink + '" target="_blank" class="text-xs text-blue-600 font-medium block hover:underline truncate">🔗 Link Dokumen Utama ↗</a>' : '') +
                        (isLintas && t.docLink2 ? '<a href="' + t.docLink2 + '" target="_blank" class="text-xs text-purple-600 font-medium block hover:underline truncate">🌐 Link Dokumen Lintas Tim ↗</a>' : '') +
                    '</div>' +

                    window.renderTaskSections(t) +

                    '<div class="border-t pt-2 mt-auto flex flex-wrap justify-between items-center gap-1.5">' +
                        '<div class="flex gap-1">' +
                            '<button onclick="window.openChatModal(\'' + t.id + '\')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-lg font-medium">💬 Ask (' + (t.chats ? t.chats.length : 0) + ')</button>' +
                            (canStaffUpdate && t.status !== 'PENDING_STAFF_SETUP' && t.status !== 'PROPOSED' ? '<button onclick="window.openStaffDetailModal(\'' + t.id + '\', true)" class="bg-slate-100 hover:bg-slate-200 text-blue-600 text-xs px-2 py-1 rounded-lg font-medium" title="Edit Rincian">✏️ Edit</button>' : '') +
                            (isKoor ? '<button onclick="window.openEditOrAssignModal(\'' + t.id + '\')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-lg font-medium" title="Atur Tim">👥 Tim</button>' : '') +
                        '</div>' +

                        '<div class="flex gap-1.5">' +
                            (t.status === 'PROPOSED' && isKoor ? '<button onclick="window.openEditOrAssignModal(\'' + t.id + '\')" class="bg-amber-600 text-white text-xs px-3 py-1 rounded-lg font-bold">Review</button>' : '') +
                            (t.status === 'REVIEW' && isKoor ? '<button onclick="window.openRevisionModal(\'' + t.id + '\')" class="bg-red-600 text-white text-xs px-2 py-1 rounded-lg font-bold">🔄 Revisi</button><button onclick="window.approveTaskDone(\'' + t.id + '\')" class="bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-lg font-bold">✓ Done</button>' : '') +

                            (t.status === 'PENDING_STAFF_SETUP' && canStaffUpdate ? '<button onclick="window.openStaffDetailModal(\'' + t.id + '\', false)" class="bg-blue-600 text-white text-xs px-3 py-1 rounded-lg font-bold">📝 Detailkan</button>' : '') +
                            ((t.status === 'IN_PROGRESS' || t.status === 'REVISION' || t.status === 'BACK_PROGRESS') && canStaffUpdate ? '<button onclick="window.submitDoneByStaff(\'' + t.id + '\')" class="bg-emerald-600 text-white text-xs px-3 py-1 rounded-lg font-bold">✓ Kirim Done</button>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        };

        window.getStatusBadgeClass = function(status) {
            switch(status) {
                case 'PROPOSED': return 'bg-amber-100 text-amber-700';
                case 'PENDING_STAFF_SETUP': return 'bg-purple-100 text-purple-700';
                case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
                case 'REVIEW': return 'bg-indigo-100 text-indigo-700';
                case 'REVISION': return 'bg-red-100 text-red-700';
                case 'BACK_PROGRESS': return 'bg-orange-100 text-orange-700';
                default: return 'bg-emerald-100 text-emerald-700';
            }
        };

        window.renderWorkload = function() {
            var container = document.getElementById('workloadGrid');
            if (!container) return;

            var staffList = window.USERS.filter(function(u) { return u.role === 'staff'; });

            container.innerHTML = staffList.map(function(u) {
                var asLead = window.tasks.filter(function(t) { return t.leadId === u.id && t.status !== 'DONE'; });
                var asSupport = window.tasks.filter(function(t) { return t.supportIds && t.supportIds.indexOf(u.id) !== -1 && t.status !== 'DONE'; });

                return '<div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">' +
                    '<div class="font-bold text-sm text-slate-800 pb-2 border-b flex justify-between items-center">' +
                        '<span>' + u.name + '</span>' +
                        '<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">' + (asLead.length + asSupport.length) + ' Task</span>' +
                    '</div>' +
                    
                    '<div class="space-y-2 text-xs">' +
                        '<div class="bg-blue-50 p-2 rounded-xl border border-blue-100">' +
                            '<div class="font-bold text-blue-800 mb-1">👤 Lead (' + asLead.length + '):</div>' +
                            (asLead.length > 0 ? asLead.map(function(t){ return '<div class="text-[11px] text-slate-700 truncate">• ' + t.title + '</div>'; }).join('') : '<div class="text-[10px] text-slate-400 italic">Tidak ada</div>') +
                        '</div>' +

                        '<div class="bg-slate-50 p-2 rounded-xl border border-slate-200">' +
                            '<div class="font-bold text-slate-700 mb-1">👥 Support (' + asSupport.length + '):</div>' +
                            (asSupport.length > 0 ? asSupport.map(function(t){ return '<div class="text-[11px] text-slate-700 truncate">• ' + t.title + '</div>'; }).join('') : '<div class="text-[10px] text-slate-400 italic">Tidak ada</div>') +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        };
