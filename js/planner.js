// WorkTrack — planner.js : diskusi, to-do, kalender, presensi
window.adminDeleteDiscussion = function(discId) {
            if (confirm("[ADMIN] Hapus Agenda Diskusi ini secara permanen dari Cloud?")) {
                window.discussions = window.discussions.filter(function(d) { return d.id !== discId; });
                window.saveData();
            }
        };

        window.adminDeleteTodo = function(todoId) {
            if (confirm("[ADMIN] Hapus item To-Do ini secara permanen dari Cloud?")) {
                window.todoList = window.todoList.filter(function(td) { return td.id !== todoId; });
                window.saveData();
            }
        };

        window.openFinishDiscussionModal = function(discId) {
            document.getElementById('finDiscId').value = discId;
            window.openModal('finishDiscussionModal');
        };

        window.submitFinishDiscussion = function(e) {
            e.preventDefault();
            var id = document.getElementById('finDiscId').value;
            var d = window.discussions.find(function(x) { return x.id === id; });
            var assigneeId = document.getElementById('finDiscAssignee').value;
            var rawTodos = document.getElementById('finDiscTodoList').value;

            if (d) {
                d.completed = true;
                d.summary = document.getElementById('finDiscSummary').value;
                d.completedAt = new Date().toISOString();

                if (rawTodos.trim()) {
                    var items = rawTodos.split(',').map(function(s){return s.trim();}).filter(Boolean);
                    items.forEach(function(item) {
                        window.todoList.unshift({
                            id: 'TODO-' + Date.now() + Math.random().toString(36).substr(2, 4),
                            title: item,
                            assigneeId: assigneeId,
                            status: 'PROCESS',
                            fromDiscTopic: d.topic
                        });
                    });
                }

                window.saveData();
            }
            window.closeModal('finishDiscussionModal');
        };

        window.submitNewDiscussion = function(e) {
            e.preventDefault();
            window.discussions.unshift({
                id: 'DSC-' + Date.now(),
                topic: document.getElementById('discTopic').value,
                date: document.getElementById('discDate').value || new Date().toISOString().slice(0,10),
                time: document.getElementById('discTime').value || 'Fleksibel',
                completed: false,
                summary: ''
            });
            window.closeModal('discussionModal');
            window.saveData();
        };

        window.submitNewTodo = function(e) {
            e.preventDefault();
            window.todoList.unshift({
                id: 'TODO-' + Date.now(),
                title: document.getElementById('todoTitle').value,
                date: document.getElementById('todoDate').value || new Date().toISOString().slice(0, 10),
                assigneeId: document.getElementById('todoAssignee').value,
                status: 'PROCESS',
                fromDiscTopic: 'Direct'
            });
            window.closeModal('addTodoModal');
            window.saveData();
        };

        // --- ENGINE RECURRENCE & PRESENCE ---
        window.handleRecurrenceSelectChange = function() {
            var val = document.getElementById('presRecurring').value;
            var summaryEl = document.getElementById('customRecurrenceSummary');

            if (val === 'CUSTOM') {
                window.openModal('customRecurrenceModal');
            } else {
                window.tempCustomRecurrence = null;
                if (summaryEl) summaryEl.classList.add('hidden');
            }
        };

        window.toggleDaysSelection = function() {
            var freq = document.getElementById('customRepeatFreq').value;
            var group = document.getElementById('customDaysGroup');
            if (freq === 'WEEK') {
                group.classList.remove('hidden');
            } else {
                group.classList.add('hidden');
            }
        };

        window.toggleDayBtn = function(btn, dayNum) {
            btn.classList.toggle('day-btn-active');
        };

        window.toggleEndInputs = function() {
            var endType = document.querySelector('input[name="customEndType"]:checked').value;
            document.getElementById('customEndDate').disabled = (endType !== 'ON');
            document.getElementById('customEndOccurrences').disabled = (endType !== 'AFTER');
        };

        window.closeCustomRecurrenceModal = function(isDone) {
            window.closeModal('customRecurrenceModal');
            var selectEl = document.getElementById('presRecurring');
            var summaryEl = document.getElementById('customRecurrenceSummary');

            if (!isDone) {
                if (!window.tempCustomRecurrence) {
                    selectEl.value = 'NONE';
                    if (summaryEl) summaryEl.classList.add('hidden');
                }
                return;
            }

            var interval = parseInt(document.getElementById('customRepeatInterval').value) || 1;
            var freq = document.getElementById('customRepeatFreq').value;
            
            var selectedDays = [];
            if (freq === 'WEEK') {
                var btns = document.querySelectorAll('#customDaysGroup button');
                var dayValues = [1, 2, 3, 4, 5, 6, 0];
                btns.forEach((b, idx) => {
                    if (b.classList.contains('day-btn-active')) {
                        selectedDays.push(dayValues[idx]);
                    }
                });
            }

            var endType = document.querySelector('input[name="customEndType"]:checked').value;
            var endDate = document.getElementById('customEndDate').value;
            var endOccurrences = parseInt(document.getElementById('customEndOccurrences').value) || 1;

            window.tempCustomRecurrence = {
                interval: interval,
                freq: freq,
                days: selectedDays,
                endType: endType,
                endDate: endDate,
                endOccurrences: endOccurrences
            };

            if (summaryEl) {
                summaryEl.innerText = `⚙️ Custom: Repeat every ${interval} ${freq.toLowerCase()}(s)`;
                summaryEl.classList.remove('hidden');
            }
        };

        window.submitNewPresence = function(e) {
            e.preventDefault();
            var category = document.getElementById('presCategory').value;
            var title = document.getElementById('presTitle').value.trim();
            var userId = document.getElementById('presUser').value;
            var startDate = document.getElementById('presStartDate').value;
            var endDate = document.getElementById('presEndDate').value;
            var recurring = document.getElementById('presRecurring').value;

            if (!startDate || !endDate) {
                alert("Harap pilih tanggal mulai dan tanggal selesai.");
                return;
            }

            if (!window.presences) window.presences = [];

            window.presences.unshift({
                id: 'PRES-' + Date.now(),
                category: category,
                title: title,
                userId: userId,
                startDate: startDate,
                endDate: endDate,
                recurring: recurring,
                customRecurrence: (recurring === 'CUSTOM') ? JSON.parse(JSON.stringify(window.tempCustomRecurrence || {})) : null,
                createdAt: new Date().toISOString()
            });

            window.tempCustomRecurrence = null;
            document.getElementById('customRecurrenceSummary').classList.add('hidden');

            window.closeModal('presenceModal');
            window.saveData();
            window.renderCalendar();
        };

        window.deletePresence = function(presId) {
            if (confirm("Hapus catatan presensi/aktivitas ini?")) {
                window.presences = window.presences.filter(p => p.id !== presId);
                window.saveData();
                window.renderCalendar();
            }
        };

        window.isPresenceActiveOnDate = function(p, dateStr) {
            var target = new Date(dateStr + 'T00:00:00');
            var start = new Date(p.startDate + 'T00:00:00');
            var end = new Date(p.endDate + 'T00:00:00');

            if (target < start) return false;

            var diffTime = target.getTime() - start.getTime();
            var diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

            var rec = p.recurring || 'NONE';

            if (rec === 'NONE') {
                return target >= start && target <= end;
            }

            if (rec === 'DAILY') return true;

            if (rec === 'WEEKLY') {
                return target.getDay() === start.getDay();
            }

            if (rec === 'MONTHLY') {
                return target.getDate() === start.getDate();
            }

            if (rec === 'ANNUALLY') {
                return target.getMonth() === start.getMonth() && target.getDate() === start.getDate();
            }

            if (rec === 'WEEKDAYS') {
                var day = target.getDay();
                return day >= 1 && day <= 5;
            }

            if (rec === 'CUSTOM' && p.customRecurrence) {
                var cr = p.customRecurrence;
                
                if (cr.endType === 'ON' && cr.endDate) {
                    if (target > new Date(cr.endDate + 'T23:59:59')) return false;
                }

                if (cr.freq === 'DAY') {
                    if (diffDays % cr.interval !== 0) return false;
                } else if (cr.freq === 'WEEK') {
                    var diffWeeks = Math.floor(diffDays / 7);
                    if (diffWeeks % cr.interval !== 0) return false;
                    if (cr.days && cr.days.length > 0) {
                        if (!cr.days.includes(target.getDay())) return false;
                    }
                } else if (cr.freq === 'MONTH') {
                    var mDiff = (target.getFullYear() - start.getFullYear()) * 12 + (target.getMonth() - start.getMonth());
                    if (mDiff % cr.interval !== 0) return false;
                    if (target.getDate() !== start.getDate()) return false;
                } else if (cr.freq === 'YEAR') {
                    var yDiff = target.getFullYear() - start.getFullYear();
                    if (yDiff % cr.interval !== 0) return false;
                    if (target.getMonth() !== start.getMonth() || target.getDate() !== start.getDate()) return false;
                }

                return true;
            }

            return false;
        };

        window.toggleTodoDone = function(todoId) {
            var td = window.todoList.find(function(x) { return x.id === todoId; });
            if (td) {
                td.status = (td.status === 'DONE') ? 'PROCESS' : 'DONE';
                window.saveData();
            }
        };

        window.convertTodoToTask = function(todoId) {
            var td = window.todoList.find(function(x) { return x.id === todoId; });
            if (!td) return;
            document.getElementById('editTaskId').value = '';
            document.getElementById('taskTitle').value = td.title;
            document.getElementById('taskLead').value = td.assigneeId || '';
            document.getElementById('taskDesc').value = 'Task dikonversi dari To-Do List: ' + td.title;
            window.openModal('taskModal');
        };

        window.deleteTodo = function(todoId) {
            if (confirm("Hapus item To-Do ini?")) {
                window.todoList = window.todoList.filter(function(x) { return x.id !== todoId; });
                window.saveData();
            }
        };

        window.renderDiscussions = function() {
            var container = document.getElementById('discussionList');
            if (!container) return;

            var activeDisc = window.discussions.filter(function(d) { return !d.completed; });

            if (activeDisc.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border">Belum ada plan diskusi.</div>';
                return;
            }

            var isAdmin = window.currentUser && window.currentUser.role === 'admin';

            container.innerHTML = activeDisc.map(function(d) {
                return '<div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2 relative">' +
                    (isAdmin ? '<button onclick="window.adminDeleteDiscussion(\'' + d.id + '\')" class="absolute top-3 right-3 text-red-500 hover:bg-red-50 p-1 rounded-lg text-xs font-bold" title="Hapus Admin">🗑️</button>' : '') +
                    '<div class="text-xs font-bold text-indigo-600 pr-10">' + d.topic + '</div>' +
                    '<div class="text-[11px] text-slate-500">📅 ' + d.date + ' (' + d.time + ')</div>' +
                    '<button onclick="window.openFinishDiscussionModal(\'' + d.id + '\')" class="w-full mt-2 bg-emerald-600 text-white text-xs py-2 rounded-xl hover:bg-emerald-700 transition font-bold shadow-sm">✓ Selesaikan (Isi MoM)</button>' +
                '</div>';
            }).join('');
        };

        window.renderTodoList = function() {
            var container = document.getElementById('todoContainer');
            if (!container) return;

            if (window.todoList.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border">Belum ada item To-Do List.</div>';
                return;
            }

            var isKoor = window.currentUser && (window.currentUser.role === 'koordinator' || window.currentUser.role === 'admin');
            var isAdmin = window.currentUser && window.currentUser.role === 'admin';

            container.innerHTML = window.todoList.map(function(td) {
                var assignee = window.USERS.find(function(u) { return u.id === td.assigneeId; });
                var isMyTodo = window.currentUser && window.currentUser.id === td.assigneeId;
                var isDone = td.status === 'DONE';

                return '<div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 relative">' +
                    '<div class="flex justify-between items-start">' +
                        '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full ' + (isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700') + '">' +
                            (isDone ? 'DONE' : 'PROCESS') +
                        '</span>' +
                        '<div class="flex items-center gap-1">' +
                            (isAdmin ? '<button onclick="window.adminDeleteTodo(\'' + td.id + '\')" class="text-red-500 hover:text-red-700 text-xs font-bold px-1">🗑️</button>' : '') +
                            '<button onclick="window.deleteTodo(\'' + td.id + '\')" class="text-slate-300 hover:text-red-500 text-xs font-bold">✕</button>' +
                        '</div>' +
                    '</div>' +

                    '<div class="font-bold text-xs text-slate-800 ' + (isDone ? 'line-through text-slate-400' : '') + '">' +
                        td.title +
                    '</div>' +

                    '<div class="text-[11px] text-slate-500 flex justify-between items-center border-t pt-2">' +
                        '<span>👤 Tag: <b>' + (assignee ? assignee.name : 'Unassigned') + '</b></span>' +
                        '<span class="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">' + (td.fromDiscTopic || 'Direct') + '</span>' +
                    '</div>' +

                    '<div class="flex justify-between items-center pt-1 border-t gap-1">' +
                        '<div>' +
                            ((isMyTodo || isKoor) ? '<button onclick="window.toggleTodoDone(\'' + td.id + '\')" class="text-xs px-2.5 py-1 rounded-lg font-bold ' + (isDone ? 'bg-slate-100 text-slate-600' : 'bg-emerald-600 text-white') + '">' + (isDone ? '↩ Undo' : '✓ Mark Done') + '</button>' : '') +
                        '</div>' +
                        '<div>' +
                            (isKoor ? '<button onclick="window.convertTodoToTask(\'' + td.id + '\')" class="bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] px-2 py-1 rounded-lg font-semibold">➕ Assign Task</button>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        };

        // --- ENGINE KALENDER INTERAKTIF ---
        window.changeCalMonth = function(delta) {
            window.calState.month += delta;
            if (window.calState.month < 0) { window.calState.month = 11; window.calState.year--; }
            else if (window.calState.month > 11) { window.calState.month = 0; window.calState.year++; }
            window.calState.selectedDate = null;
            window.renderCalendar();
        };

        window.goCalToday = function() {
            var now = new Date();
            window.calState.month = now.getMonth();
            window.calState.year = now.getFullYear();
            
            var yyyy = now.getFullYear();
            var mm = String(now.getMonth() + 1).padStart(2, '0');
            var dd = String(now.getDate()).padStart(2, '0');
            window.calState.selectedDate = yyyy + '-' + mm + '-' + dd;
            window.renderCalendar();
        };

        window.selectCalDateOnly = function(ds) {
            window.calState.selectedDate = ds;
            window.renderCalendar();
        };

        window.openAddActivityModalForDate = function(ds) {
            window.calState.selectedDate = ds;
            window.renderCalendar();
            
            document.getElementById('calActionDateTitle').innerText = 'Tanggal: ' + new Date(ds + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            window.openModal('calActionModal');
        };

        window.calCreateTaskChoice = function() {
            window.closeModal('calActionModal');
            var ds = window.calState.selectedDate;
            
            if (window.currentUser && window.currentUser.role === 'staff') {
                document.getElementById('propTitle').value = '';
                document.getElementById('propDesc').value = '';
                document.getElementById('propDocLink').value = '';
                window.openModal('proposeTaskModal');
            } else {
                document.getElementById('editTaskId').value = '';
                document.getElementById('taskTitle').value = '';
                document.getElementById('taskDesc').value = '';
                document.getElementById('taskDocLink').value = '';
                document.getElementById('taskDocLink2').value = '';
                if (ds) {
                    document.getElementById('taskDeadline').value = ds + 'T17:00';
                }
                window.toggleScopeLinks();
                window.openModal('taskModal');
            }
        };

        window.calCreateDiscussionChoice = function() {
            window.closeModal('calActionModal');
            var ds = window.calState.selectedDate;
            document.getElementById('discTopic').value = '';
            if (ds) document.getElementById('discDate').value = ds;
            window.openModal('discussionModal');
        };

        window.calCreateTodoChoice = function() {
            window.closeModal('calActionModal');
            var ds = window.calState.selectedDate;
            document.getElementById('todoTitle').value = '';
            if (ds) document.getElementById('todoDate').value = ds;
            window.openModal('addTodoModal');
        };

        window.calCreatePresenceChoice = function() {
            window.closeModal('calActionModal');
            var ds = window.calState.selectedDate;
            document.getElementById('presTitle').value = '';
            if (ds) {
                document.getElementById('presStartDate').value = ds;
                document.getElementById('presEndDate').value = ds;
            }
            if (window.currentUser) {
                document.getElementById('presUser').value = window.currentUser.id;
            }
            document.getElementById('presRecurring').value = 'NONE';
            document.getElementById('customRecurrenceSummary').classList.add('hidden');
            window.openModal('presenceModal');
        };

        window.getCalendarEvents = function(selectedUser) {
            var ev = {};
            function ensure(ds) { if (!ev[ds]) ev[ds] = { tasks: [], discs: [], todos: [], presences: [] }; return ev[ds]; }

            (window.tasks || []).forEach(function(t) {
                if (!t.deadline || t.status === 'DONE') return;
                if (selectedUser !== 'ALL') {
                    var isMine = (t.leadId === selectedUser) || (t.supportIds && t.supportIds.includes(selectedUser));
                    if (!isMine) return;
                }
                ensure(t.deadline.slice(0, 10)).tasks.push(t);
            });

            (window.discussions || []).forEach(function(d) {
                if (!d.date || d.completed) return;
                ensure(d.date).discs.push(d);
            });

            (window.todoList || []).forEach(function(td) {
                if (td.status === 'DONE') return;
                if (selectedUser !== 'ALL' && td.assigneeId !== selectedUser) return;
                
                var now = new Date();
                var yyyy = now.getFullYear();
                var mm = String(now.getMonth() + 1).padStart(2, '0');
                var dd = String(now.getDate()).padStart(2, '0');
                var ds = td.date || (yyyy + '-' + mm + '-' + dd);
                
                ensure(ds).todos.push(td);
            });

            var month = window.calState.month;
            var year = window.calState.year;
            var daysInMonth = new Date(year, month + 1, 0).getDate();

            for (var day = 1; day <= daysInMonth; day++) {
                var ds = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
                
                (window.presences || []).forEach(function(p) {
                    if (selectedUser !== 'ALL' && p.userId !== 'ALL_TEAM' && p.userId !== selectedUser) return;
                    if (window.isPresenceActiveOnDate(p, ds)) {
                        ensure(ds).presences.push(p);
                    }
                });
            }

            return ev;
        };

        window.renderCalendar = function() {
            var grid = document.getElementById('calendarGrid');
            if (!grid) return;

            var selectedUser = document.getElementById('calUserFilter') ? document.getElementById('calUserFilter').value : 'ALL';

            var month = window.calState.month, year = window.calState.year;
            var monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
            var label = document.getElementById('calMonthLabel');
            if (label) label.innerText = monthNames[month] + ' ' + year;

            var events = window.getCalendarEvents(selectedUser);
            var firstDay = new Date(year, month, 1).getDay();
            var daysInMonth = new Date(year, month + 1, 0).getDate();
            
            var nD = new Date();
            var todayStr = nD.getFullYear() + '-' + String(nD.getMonth() + 1).padStart(2, '0') + '-' + String(nD.getDate()).padStart(2, '0');

            var dayHeaders = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
            var html = '<div class="grid grid-cols-7 gap-1 mb-1">';
            html += dayHeaders.map(function(d, i) { return '<div class="text-center text-[10px] font-bold py-1 ' + (i === 0 ? 'text-red-500' : 'text-slate-500') + '">' + d + '</div>'; }).join('');
            html += '</div><div class="grid grid-cols-7 gap-1">';

            for (var i = 0; i < firstDay; i++) { html += '<div></div>'; }

            for (var day = 1; day <= daysInMonth; day++) {
                var ds = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
                var e = events[ds] || { tasks: [], discs: [], todos: [], presences: [] };

                var isToday = ds === todayStr;
                var isSel = ds === window.calState.selectedDate;

                var hasTeamWFH = e.presences.some(p => p.category === 'WFH' && (p.userId === 'ALL_TEAM' || p.title.toLowerCase().includes('tim')));
                var hasTeamPerjadin = e.presences.some(p => p.category === 'PERJADIN_TIM' || p.userId === 'ALL_TEAM');

                var cellBgClass = 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700';
                if (isSel) {
                    cellBgClass = 'bg-blue-600 text-white border-blue-600 shadow-md';
                } else if (isToday) {
                    cellBgClass = 'bg-blue-50/90 border-blue-400 text-blue-800 font-bold';
                } else if (hasTeamWFH) {
                    cellBgClass = 'cal-bg-wfh-team text-slate-800';
                } else if (hasTeamPerjadin) {
                    cellBgClass = 'cal-bg-perjadin-team text-slate-800';
                }

                var activitiesHtml = '';
                if (e.tasks.length > 0) {
                    activitiesHtml += `<div class="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold truncate shadow-xs">📋 ${e.tasks.length} Task</div>`;
                }
                if (e.discs.length > 0) {
                    activitiesHtml += `<div class="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold truncate shadow-xs">💬 ${e.discs.length} Diskusi</div>`;
                }
                if (e.todos.length > 0) {
                    activitiesHtml += `<div class="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold truncate shadow-xs">☑️ ${e.todos.length} To-Do</div>`;
                }

                var avatarsHtml = '';
                var indivPresences = e.presences.filter(p => p.userId !== 'ALL_TEAM');
                if (indivPresences.length > 0) {
                    avatarsHtml = '<div class="flex flex-wrap gap-0.5 mt-auto pt-1">';
                    indivPresences.forEach(p => {
                        var u = window.USERS.find(x => x.id === p.userId);
                        var initial = u ? u.name.charAt(0) : '?';
                        var badgeClass = 'badge-avatar-other';
                        if (p.category === 'CUTI') badgeClass = 'badge-avatar-cuti';
                        else if (p.category === 'PERJADIN_INDIVIDU' || p.category === 'PERJADIN_TIM') badgeClass = 'badge-avatar-perjadin';
                        else if (p.category === 'WFH') badgeClass = 'badge-avatar-wfh';

                        avatarsHtml += `<span class="w-3.5 h-3.5 rounded-full text-[8px] font-black flex items-center justify-center ${badgeClass}" title="${u ? u.name : 'Staff'}: ${p.title}">${initial}</span>`;
                    });
                    avatarsHtml += '</div>';
                }

                html += '<div onclick="window.selectCalDateOnly(\'' + ds + '\')" ondblclick="window.openAddActivityModalForDate(\'' + ds + '\')" class="min-h-[72px] sm:min-h-[80px] p-1.5 rounded-xl border text-xs flex flex-col justify-between transition cursor-pointer relative overflow-hidden group ' + cellBgClass + '">' +
                    '<div class="flex justify-between items-center w-full">' +
                        '<span class="font-bold text-[11px]">' + day + '</span>' +
                        '<button onclick="event.stopPropagation(); window.openAddActivityModalForDate(\'' + ds + '\')" class="text-slate-400 hover:text-blue-600 font-bold text-sm leading-none p-0.5 opacity-60 group-hover:opacity-100 transition" title="Tambah Aktivitas">+</button>' +
                    '</div>' +
                    '<div class="w-full space-y-0.5 my-1">' + activitiesHtml + '</div>' +
                    avatarsHtml +
                '</div>';
            }
            html += '</div>';
            grid.innerHTML = html;

            window.renderTodayPresences();
            window.renderCalendarDetail(events);
        };

        window.renderTodayPresences = function() {
            var container = document.getElementById('todayPresenceContainer');
            var badge = document.getElementById('todayPresenceBadge');
            if (!container) return;

            var nD = new Date();
            var todayStr = nD.getFullYear() + '-' + String(nD.getMonth() + 1).padStart(2, '0') + '-' + String(nD.getDate()).padStart(2, '0');
            
            var todayItems = (window.presences || []).filter(p => window.isPresenceActiveOnDate(p, todayStr));

            if (badge) badge.innerText = todayItems.length + ' Tim Off-Site';

            if (todayItems.length === 0) {
                container.innerHTML = '<div class="text-slate-400 italic text-[11px] py-2 text-center">Semua tim WFO / Normal hari ini.</div>';
                return;
            }

            container.innerHTML = todayItems.map(p => {
                var uName = 'Semua Tim';
                if (p.userId !== 'ALL_TEAM') {
                    var u = window.USERS.find(x => x.id === p.userId);
                    uName = u ? u.name : 'Staff';
                }
                
                var badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                if (p.category === 'CUTI') badgeColor = 'bg-orange-100 text-orange-800 border-orange-200';
                else if (p.category === 'PERJADIN_TIM') badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
                else if (p.category === 'PERJADIN_INDIVIDU') badgeColor = 'bg-sky-100 text-sky-800 border-sky-200';
                else if (p.category === 'WFH') badgeColor = 'bg-teal-100 text-teal-800 border-teal-200';

                return `<div class="p-2 rounded-xl border text-[11px] flex justify-between items-start gap-2 bg-white">
                    <div class="min-w-0">
                        <div class="font-bold text-slate-800 truncate">${uName}</div>
                        <div class="text-slate-600 truncate">${p.title}</div>
                        <div class="text-[9px] text-slate-400">${p.startDate} s/d ${p.endDate}</div>
                    </div>
                    <div class="flex items-center gap-1">
                        <span class="px-2 py-0.5 rounded-md border text-[9px] font-bold ${badgeColor}">${p.category}</span>
                        <button onclick="window.deletePresence('${p.id}')" class="text-slate-300 hover:text-red-500 font-bold text-xs p-0.5">✕</button>
                    </div>
                </div>`;
            }).join('');
        };

        window.renderCalendarDetail = function(events) {
            var panel = document.getElementById('calendarDetail');
            if (!panel) return;

            var ds = window.calState.selectedDate;
            var html = '';

            if (ds) {
                var e = events[ds] || { tasks: [], discs: [], todos: [], presences: [] };
                var dObj = new Date(ds + 'T00:00:00');
                html += '<div class="font-bold text-slate-800 text-xs border-b pb-2 mb-2 flex justify-between items-center">' +
                    '<span>📅 ' + dObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</span>' +
                    '<button onclick="window.openAddActivityModalForDate(\'' + ds + '\')" class="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1 rounded-lg font-bold">+ Aktivitas</button>' +
                '</div>';

                if (e.tasks.length === 0 && e.discs.length === 0 && e.todos.length === 0 && e.presences.length === 0) {
                    html += '<div class="text-slate-400 italic text-xs py-4 text-center">Tidak ada agenda / aktivitas di tanggal ini.</div>';
                } else {
                    if (e.presences.length > 0) {
                        html += '<div class="text-[11px] font-bold text-purple-700 mb-1">✈️ Status Kehadiran / Agenda Tim (' + e.presences.length + ')</div>';
                        html += e.presences.map(function(p) {
                            var personName = (p.userId === 'ALL_TEAM') ? 'Semua Tim' : ((window.USERS.find(x => x.id === p.userId) || {}).name || 'Staff');
                            return '<div class="bg-purple-50 border border-purple-100 rounded-xl p-2 mb-1.5 flex justify-between items-center"><div><div class="font-semibold text-slate-800 text-[11px]">' + personName + ': ' + p.title + '</div><div class="text-[10px] text-slate-500">' + p.startDate + ' s/d ' + p.endDate + ' (' + p.category + ')</div></div><button onclick="window.deletePresence(\'' + p.id + '\')" class="text-red-400 font-bold p-1">🗑️</button></div>';
                        }).join('');
                    }

                    if (e.tasks.length > 0) {
                        html += '<div class="text-[11px] font-bold text-blue-600 mb-1 mt-2">🎯 Deadline Task (' + e.tasks.length + ')</div>';
                        html += e.tasks.map(function(t) {
                            var lead = window.USERS.find(function(u) { return u.id === t.leadId; });
                            var tm = t.deadline.length > 10 ? t.deadline.slice(11, 16) : '';
                            return '<div class="bg-blue-50 border border-blue-100 rounded-xl p-2 mb-1.5"><div class="font-semibold text-slate-800 text-[11px]">' + t.title + '</div><div class="text-[10px] text-slate-500 mt-0.5">[' + (t.code || '001') + '] • ' + t.status + (tm ? ' • ⏰ ' + tm : '') + ' • Lead: ' + (lead ? lead.name : '-') + '</div></div>';
                        }).join('');
                    }

                    if (e.discs.length > 0) {
                        html += '<div class="text-[11px] font-bold text-indigo-600 mb-1 mt-2">💬 Diskusi (' + e.discs.length + ')</div>';
                        html += e.discs.map(function(d) {
                            return '<div class="bg-indigo-50 border border-indigo-100 rounded-xl p-2 mb-1.5"><div class="font-semibold text-slate-800 text-[11px]">' + d.topic + '</div><div class="text-[10px] text-slate-500 mt-0.5">⏰ ' + (d.time || '-') + (d.completed ? ' • ✓ Selesai' : '') + '</div></div>';
                        }).join('');
                    }

                    if (e.todos.length > 0) {
                        html += '<div class="text-[11px] font-bold text-amber-600 mb-1 mt-2">☑️ To-Do List (' + e.todos.length + ')</div>';
                        html += e.todos.map(function(td) {
                            var a = window.USERS.find(function(u) { return u.id === td.assigneeId; });
                            return '<div class="bg-amber-50 border border-amber-100 rounded-xl p-2 mb-1.5"><div class="font-semibold text-slate-800 text-[11px]">' + td.title + '</div><div class="text-[10px] text-slate-500 mt-0.5">👤 Tag: ' + (a ? a.name : 'Unassigned') + '</div></div>';
                        }).join('');
                    }
                }
            } else {
                html += '<div class="text-slate-400 italic text-xs py-4 text-center">Klik tanggal di kalender untuk melihat agenda. Klik 2x atau tekan tombol + untuk menambah agenda.</div>';
            }

            panel.innerHTML = html;
        };
