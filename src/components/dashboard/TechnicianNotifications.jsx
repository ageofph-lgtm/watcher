import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X, CheckCircle2, Wrench, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NOTIFICATION_ICONS = {
  os_assignment: Wrench,
  os_confirmation: CheckCircle2,
  parts_released: Package
};

export default function TechnicianNotifications({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [popupNotification, setPopupNotification] = useState(null);

  // Play notification sound
  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Load initial notifications
  const loadNotifications = async () => {
    if (!currentUser?.nome_tecnico) return;
    
    try {
      const allNotifications = await base44.entities.Notificacao.list('-created_date');
      const myNotifications = allNotifications.filter(
        n => n.userId === currentUser.nome_tecnico && !n.isRead
      );
      setNotifications(myNotifications);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  };

  useEffect(() => {
    if (!currentUser?.nome_tecnico) return;
    
    loadNotifications();

    // Subscribe to real-time notifications
    const unsubscribe = base44.entities.Notificacao.subscribe((event) => {
      if (event.type === 'create' && event.data.userId === currentUser.nome_tecnico) {
        // New notification for this technician
        setNotifications(prev => [event.data, ...prev]);
        
        // Show popup
        setPopupNotification(event.data);
        setTimeout(() => setPopupNotification(null), 5000);
        
        // Play sound
        playNotificationSound();
      } else if (event.type === 'update' && event.data.userId === currentUser.nome_tecnico) {
        // Update notification
        setNotifications(prev => 
          prev.map(n => n.id === event.data.id ? event.data : n).filter(n => !n.isRead)
        );
      }
    });

    return unsubscribe;
  }, [currentUser]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await base44.entities.Notificacao.update(notificationId, { isRead: true });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(notifications.map(n => 
        base44.entities.Notificacao.update(n.id, { isRead: true })
      ));
      setNotifications([]);
      setShowPanel(false);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  const unreadCount = notifications.length;

  return (
    <>
      {/* Notification Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative px-4 py-2 bg-purple-600 text-white text-xs font-bold tracking-wider hover:bg-purple-700 active:scale-95 transition-all clip-corner"
      >
        <Bell className="w-4 h-4 inline mr-2" />
        NOTIFICAÇÕES
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {showPanel && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-[100]" 
              onClick={() => setShowPanel(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-[101] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b bg-purple-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">Notificações</h3>
                  <button
                    onClick={() => setShowPanel(false)}
                    className="p-1 hover:bg-purple-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs underline hover:text-purple-200"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sem notificações</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
                    return (
                      <div
                        key={notif.id}
                        className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-purple-600 text-white">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800 mb-1">
                              {notif.message}
                            </p>
                            {notif.machineSerie && (
                              <p className="text-xs text-gray-600 font-mono">
                                Máquina: {notif.machineSerie}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notif.created_date).toLocaleString('pt-PT')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1 hover:bg-purple-200 rounded"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Popup Notification */}
      <AnimatePresence>
        {popupNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            className="fixed top-24 right-4 z-[200] w-80 sm:w-96 p-4 rounded-xl shadow-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/20">
                {React.createElement(NOTIFICATION_ICONS[popupNotification.type] || Bell, {
                  className: "w-6 h-6"
                })}
              </div>
              <div className="flex-1">
                <p className="font-bold mb-1">Nova Notificação!</p>
                <p className="text-sm opacity-90">{popupNotification.message}</p>
                {popupNotification.machineSerie && (
                  <p className="text-xs font-mono mt-1 opacity-80">
                    Máquina: {popupNotification.machineSerie}
                  </p>
                )}
              </div>
              <button
                onClick={() => setPopupNotification(null)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}