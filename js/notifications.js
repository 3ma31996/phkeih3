// WorkTrack — notifications.js : notifikasi & pengingat deadline
window.requestNotificationPermission = function(fromButton) {
            if (!("Notification" in window)) {
                if (fromButton) alert("Browser ini tidak mendukung notifikasi.");
                return;
            }
            if (Notification.permission === "granted") {
                if (fromButton) {
                    alert("Notifikasi sudah aktif ✅");
                    window.showSystemNotification("🔔 Notifikasi Aktif", "Anda akan menerima notifikasi WorkTrack meski tab tidak dibuka.", "✅");
                }
                window.updateNotifButton();
                return;
            }
            if (Notification.permission !== "denied") {
                Notification.requestPermission().then(function(p) {
                    window.updateNotifButton();
                    if (p === "granted") {
                        window.showSystemNotification("🔔 Notifikasi Aktif", "Anda akan menerima notifikasi WorkTrack meski tab tidak dibuka.", "✅");
                    }
                });
            } else if (fromButton) {
                alert("Notifikasi diblokir oleh browser. Aktifkan lewat ikon gembok/izin situs di address bar.");
            }
        };

        window.updateNotifButton = function() {
            var btn = document.getElementById('btnEnableNotif');
            if (!btn) return;
            if (("Notification" in window) && Notification.permission !== "granted") {
                btn.classList.remove('hidden');
                btn.classList.add('flex');
            } else {
                btn.classList.add('hidden');
                btn.classList.remove('flex');
            }
        };

        window.showSystemNotification = function(title, message, icon) {
            if (!icon) icon = '🔔';

            var container = document.getElementById('toastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toastContainer';
                container.className = 'fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex flex-col gap-2 max-w-[90vw] sm:max-w-sm w-full pointer-events-none';
                document.body.appendChild(container);
            }

            var toast = document.createElement('div');
            toast.className = 'bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 transform transition-all duration-300 translate-y-5 opacity-0 pointer-events-auto';
            toast.innerHTML = `
                <div class="text-xl sm:text-2xl">${icon}</div>
                <div class="flex-grow min-w-0">
                    <div class="font-bold text-xs text-blue-400">${title}</div>
                    <div class="text-xs text-slate-200 mt-0.5 leading-snug break-words">${message}</div>
                </div>
                <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white text-xs font-bold p-1">✕</button>
            `;

            container.appendChild(toast);

            setTimeout(function() {
                toast.classList.remove('translate-y-5', 'opacity-0');
            }, 50);

            setTimeout(function() {
                toast.classList.add('opacity-0', 'translate-y-2');
                setTimeout(function() { toast.remove(); }, 300);
            }, 6000);

            if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
                try {
                    new Notification(title, {
                        body: message,
                        icon: 'https://cdn-icons-png.flaticon.com/512/2523/2523197.png'
                    });
                } catch (e) {}
            }
        };

        window.checkAndTriggerNotifications = function(oldTasks, newTasks) {
            if (!window.currentUser) return;
            var myId = window.currentUser.id;
            var isKoor = window.currentUser.role === 'koordinator' || window.currentUser.role === 'admin';

            newTasks.forEach(function(nT) {
                var oT = oldTasks.find(function(x) { return x.id === nT.id; });
                var isMine = (nT.leadId === myId) || (nT.supportIds && nT.supportIds.includes(myId));

                if (!oT) {
                    if (nT.status === 'PROPOSED' && isKoor) {
                        window.showSystemNotification("💡 Usulan Task Baru!", `Staff mengajukan: "${nT.title}"`, "📝");
                    } else if (isMine) {
                        window.showSystemNotification("➕ Penugasan Baru!", `Anda ditugaskan pada: "${nT.title}"`, "📋");
                    }
                    return;
                }

                if (oT.status !== nT.status) {
                    if (nT.status === 'REVIEW' && isKoor) {
                        window.showSystemNotification("📩 Kirim Done dari Staff!", `Task "${nT.title}" siap diperiksa.`, "🔍");
                    } else if (nT.status === 'IN_PROGRESS' && oT.status === 'PENDING_STAFF_SETUP' && isKoor) {
                        window.showSystemNotification("🗂️ Rincian Task Diisi Staff", `Staff telah mengisi rincian & link untuk "${nT.title}".`, "📝");
                    } else if (nT.status === 'REVISION' && isMine) {
                        window.showSystemNotification("🔄 Perlu Revisi!", `Ada catatan revisi baru untuk task "${nT.title}".`, "⚠️");
                    } else if (nT.status === 'BACK_PROGRESS') {
                        if (isMine) {
                            window.showSystemNotification("↩️ Task Dikembalikan!", `Task "${nT.title}" dikembalikan ke aktif untuk diselesaikan ulang.`, "⚠️");
                        } else if (isKoor) {
                            window.showSystemNotification("↩️ Task Di-recall Admin", `Task "${nT.title}" dikembalikan dari arsip ke aktif.`, "⚠️");
                        }
                    } else if (nT.status === 'DONE' && isMine) {
                        window.showSystemNotification("🎉 Task Approved / Done!", `Task "${nT.title}" telah disetujui!`, "✅");
                    }
                }

                var oldChatsCount = oT.chats ? oT.chats.length : 0;
                var newChatsCount = nT.chats ? nT.chats.length : 0;

                if (newChatsCount > oldChatsCount) {
                    var latestChat = nT.chats[nT.chats.length - 1];
                    if (latestChat.senderName !== window.currentUser.name) {
                        var myNameClean = window.currentUser.name.toLowerCase().replace(/\s+/g, '');
                        var textClean = latestChat.text.toLowerCase().replace(/\s+/g, '');

                        if (textClean.includes('@' + myNameClean) || latestChat.text.toLowerCase().includes('@' + window.currentUser.name.toLowerCase())) {
                            window.showSystemNotification(`🏷️ Anda Di-tag oleh ${latestChat.senderName}!`, `"${latestChat.text}" (di ${nT.title})`, "💬");
                        } else if (isMine || isKoor) {
                            window.showSystemNotification(`💬 Pesan Baru dari ${latestChat.senderName}`, `"${latestChat.text}"`, "💬");
                        }
                    }
                }
            });
        };

        window.checkTodoNotifications = function(oldTodos, newTodos) {
            if (!window.currentUser) return;
            var myId = window.currentUser.id;

            newTodos.forEach(function(nTd) {
                var oTd = oldTodos.find(function(x) { return x.id === nTd.id; });
                if (!oTd) {
                    if (nTd.assigneeId === myId) {
                        var from = (nTd.fromDiscTopic && nTd.fromDiscTopic !== 'Direct') ? ` (dari rapat: ${nTd.fromDiscTopic})` : '';
                        window.showSystemNotification("🏷️ To-Do Baru untuk Anda!", `"${nTd.title}"${from}`, "☑️");
                    }
                } else if (oTd.assigneeId !== nTd.assigneeId && nTd.assigneeId === myId) {
                    window.showSystemNotification("🏷️ Anda Ditugaskan To-Do!", `"${nTd.title}"`, "☑️");
                }
            });
        };

        window.checkDeadlineReminders = function() {
            if (!window.currentUser) return;
            var myId = window.currentUser.id;
            var isKoor = window.currentUser.role === 'koordinator' || window.currentUser.role === 'admin';
            var now = Date.now();
            var dayMs = 24 * 60 * 60 * 1000;

            (window.tasks || []).forEach(function(t) {
                if (!t.deadline || t.status === 'DONE') return;
                var isMine = (t.leadId === myId) || (t.supportIds && t.supportIds.includes(myId));
                if (!isMine && !isKoor) return;

                var dl = new Date(t.deadline).getTime();
                if (isNaN(dl)) return;
                var diff = dl - now;

                if (diff > 0 && diff <= dayMs && !window.notifiedDeadlines[t.id + '_soon']) {
                    window.notifiedDeadlines[t.id + '_soon'] = true;
                    var hrs = Math.max(1, Math.round(diff / 3600000));
                    window.showSystemNotification("⏰ Deadline Mendekat!", `Task "${t.title}" jatuh tempo dalam ~${hrs} jam.`, "⏰");
                }
                if (diff <= 0 && !window.notifiedDeadlines[t.id + '_over']) {
                    window.notifiedDeadlines[t.id + '_over'] = true;
                    window.showSystemNotification("🚨 Deadline Terlewat!", `Task "${t.title}" sudah melewati deadline.`, "🚨");
                }
            });
        };
