import React, { useState, useEffect } from 'react';
import { Pedido } from '@/entities/all';
import { CheckCircle2, Clock, Trash2, ChevronDown, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function PedidosPanel({ userPermissions, adminStyle, isCompact = false }) {
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadPedidos = async () => {
    try {
      const data = await Pedido.list('-created_date');
      setPedidos(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPedidos();
    const interval = setInterval(loadPedidos, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async (pedidoId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'pendente' ? 'concluido' : 'pendente';
      const pedido = pedidos.find(p => p.id === pedidoId);
      const updateData = { status: newStatus };
      
      if (newStatus === 'concluido') {
        updateData.dataConclusao = new Date().toISOString();
        
        // Notify technician that parts were released
        if (pedido?.tecnico) {
          try {
            await base44.entities.Notificacao.create({
              userId: pedido.tecnico,
              message: `Pedido de peças liberado: ${pedido.numeroPedido}`,
              machineId: pedido.maquinaId,
              machineSerie: pedido.maquinaSerie,
              technicianName: 'Admin',
              type: 'parts_released',
              isRead: false
            });
          } catch (notifError) {
            console.error('Erro ao criar notificação:', notifError);
          }
        }
      } else {
        updateData.dataConclusao = null;
      }
      
      await Pedido.update(pedidoId, updateData);
      await loadPedidos();
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
    }
  };

  const handleDelete = async (pedidoId) => {
    if (!window.confirm('Tem certeza que deseja eliminar este pedido?')) return;
    
    try {
      await Pedido.delete(pedidoId);
      await loadPedidos();
    } catch (error) {
      console.error('Erro ao eliminar pedido:', error);
    }
  };

  const pendentes = pedidos.filter(p => p.status === 'pendente');
  const concluidos = pedidos.filter(p => p.status === 'concluido');

  if (!userPermissions?.canDeleteMachine) {
    return null;
  }

  if (isCompact) {
    return (
      <>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-semibold text-white shadow-md"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            border: '1px solid rgba(139, 92, 246, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.6)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">Pedidos</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
            background: 'rgba(255, 255, 255, 0.3)',
            color: 'white'
          }}>
            {pendentes.length}
          </span>
          {pendentes.length > 0 && (
            <Bell className="w-3 h-3 animate-pulse" style={{ color: '#fbbf24' }} />
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
                className="fixed top-24 right-4 w-[95vw] sm:w-[500px] max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl z-50 p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(232, 238, 242, 0.98) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#0066ff' }}>
                    <Clock className="w-5 h-5" style={{ color: '#00d4ff' }} />
                    Pedidos dos Técnicos
                  </h2>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 rounded-full transition-colors"
                    style={{ background: 'rgba(0, 212, 255, 0.1)', color: '#0066ff' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {isLoading ? (
                  <div className="text-center py-4 text-sm" style={{ color: '#666' }}>A carregar...</div>
                ) : pedidos.length === 0 ? (
                  <div className="text-center py-8" style={{ color: '#666' }}>
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum pedido</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendentes.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#1a1a2e' }}>
                          <Clock className="w-4 h-4" style={{ color: 'var(--ff-orange-accent)' }} />
                          Pendentes
                        </h3>
                        <div className="space-y-2">
                          {pendentes.map(pedido => (
                            <motion.div
                              key={pedido.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-lg p-3 flex items-center justify-between hover:shadow transition-shadow"
                              style={{
                                background: 'rgba(255, 107, 53, 0.1)',
                                border: '1px solid rgba(255, 107, 53, 0.3)'
                              }}
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg font-mono font-bold" style={{ color: 'var(--ff-orange-accent)' }}>
                                    {pedido.numeroPedido}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{
                                    background: 'rgba(255, 107, 53, 0.2)',
                                    color: 'var(--ff-orange-accent)'
                                  }}>
                                    PENDENTE
                                  </span>
                                </div>
                                <div className="text-xs space-y-0.5" style={{ color: '#1a1a2e' }}>
                                  <p className="truncate"><span className="font-semibold">Máquina:</span> {pedido.maquinaModelo} - {pedido.maquinaSerie}</p>
                                  <p><span className="font-semibold">Técnico:</span> <span className="capitalize">{pedido.tecnico}</span></p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleToggleStatus(pedido.id, pedido.status)}
                                  className="p-1.5 text-white rounded transition-colors"
                                  style={{ background: 'var(--ff-blue-electric)' }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ff-blue-primary)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--ff-blue-electric)'}
                                  title="Marcar como concluído"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(pedido.id)}
                                  className="p-1.5 text-white rounded transition-colors"
                                  style={{ background: 'var(--ff-red-accent)' }}
                                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {concluidos.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-semibold flex items-center gap-2" style={{ color: '#1a1a2e' }}>
                          <CheckCircle2 className="w-4 h-4" style={{ color: '#00d4ff' }} />
                          Concluídos ({concluidos.length})
                          <ChevronDown className="w-4 h-4 ml-auto group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="mt-2 space-y-2 pl-6">
                          {concluidos.map(pedido => (
                            <motion.div
                              key={pedido.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="rounded p-2 flex items-center justify-between text-xs"
                              style={{
                                background: 'rgba(0, 212, 255, 0.1)',
                                border: '1px solid rgba(0, 212, 255, 0.3)'
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <span className="font-mono font-bold mr-2" style={{ color: '#00d4ff' }}>{pedido.numeroPedido}</span>
                                <span className="truncate" style={{ color: '#666' }}>{pedido.maquinaModelo}</span>
                              </div>
                              <button
                                onClick={() => handleDelete(pedido.id)}
                                className="p-1 text-white rounded transition-colors ml-2"
                                style={{ background: 'var(--ff-red-accent)' }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                title="Eliminar"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return null;
}