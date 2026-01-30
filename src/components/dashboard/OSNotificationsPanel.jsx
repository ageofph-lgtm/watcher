import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function OSNotificationsPanel({ userPermissions }) {
  const [notifications, setNotifications] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await base44.entities.Notificacao.filter({ 
        type: 'os_assignment',
        isRead: false 
      }, '-created_date');
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações de OS:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId, machineId, machineSerie, technicianName) => {
    try {
      await base44.entities.Notificacao.update(notificationId, { isRead: true });
      
      // Notify technician that OS was confirmed
      if (technicianName) {
        await base44.entities.Notificacao.create({
          userId: technicianName,
          message: `OS confirmada para máquina ${machineSerie}`,
          machineId: machineId,
          machineSerie: machineSerie,
          technicianName: 'Admin',
          type: 'os_confirmation',
          isRead: false
        });
      }
      
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(notifications.map(n => 
        base44.entities.Notificacao.update(n.id, { isRead: true })
      ));
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  if (!userPermissions?.canDeleteMachine) {
    return null;
  }

  const pendingCount = notifications.length;

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-semibold text-white shadow-md"
        style={{
          background: pendingCount > 0 
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(245, 158, 11, 0.5)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <FileText className="w-4 h-4" />
        <span className="hidden sm:inline">OS</span>
        {pendingCount > 0 && (
          <>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
              background: 'rgba(255, 255, 255, 0.3)',
              color: 'white'
            }}>
              {pendingCount}
            </span>
            <Bell className="w-3 h-3 animate-pulse" />
          </>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-50" 
              onClick={() => setIsExpanded(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-4 w-[95vw] sm:w-[450px] max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl z-50 p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(232, 238, 242, 0.98) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                boxShadow: '0 0 40px rgba(245, 158, 11, 0.3)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#d97706' }}>
                  <FileText className="w-5 h-5" />
                  Lembretes de OS
                </h2>
                <div className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs px-2 py-1 rounded transition-colors"
                      style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}
                    >
                      Limpar Todas
                    </button>
                  )}
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 rounded-full transition-colors"
                    style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-4 text-sm text-gray-500">A carregar...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum lembrete pendente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notification => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-lg p-3 border"
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderColor: 'rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.created_date).toLocaleString('pt-PT', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleMarkAsRead(notification.id, notification.machineId, notification.machineSerie, notification.technicianName)}
                          className="p-1.5 rounded-full transition-colors"
                          style={{ background: '#10b981', color: 'white' }}
                          title="Marcar como lido (OS aberta)"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}