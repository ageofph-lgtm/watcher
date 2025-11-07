
import React, { useState, useEffect } from 'react';
import { Pedido } from '@/entities/all';
import { CheckCircle2, Clock, Trash2, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PedidosPanel({ userPermissions, adminStyle }) {
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    const interval = setInterval(loadPedidos, 30000); // Reload every 30s
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async (pedidoId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'pendente' ? 'concluido' : 'pendente';
      const updateData = { status: newStatus };
      
      if (newStatus === 'concluido') {
        updateData.dataConclusao = new Date().toISOString();
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

  const panelStyle = adminStyle?.pedidos || {};

  return (
    <div 
      className="rounded-lg shadow-md p-3 sm:p-4 border relative overflow-hidden"
      style={panelStyle.background || panelStyle.backgroundColor ? panelStyle : { 
        background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(0, 212, 255, 0.05) 100%)', 
        backdropFilter: 'blur(10px)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        boxShadow: '0 4px 15px rgba(0, 102, 255, 0.15)'
      }}
    >
      {/* Logo ATLAS em baixo relevo */}
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dc340a4ed_LogoGeomtricoATLAScomOlhoCircular-Photoroom.png"
        alt="ATLAS"
        className="absolute bottom-2 right-2 w-16 h-16 sm:w-24 sm:h-24 opacity-[0.05] pointer-events-none"
      />
      
      <div className="flex items-center justify-between mb-3 relative z-10">
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2" style={{ color: '#0066ff' }}>
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00d4ff' }} />
          <span className="hidden sm:inline">Pedidos dos Técnicos</span>
          <span className="sm:hidden">Pedidos</span>
        </h2>
        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{
          background: 'rgba(0, 212, 255, 0.2)',
          color: '#0066ff'
        }}>
          {pendentes.length}
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-xs sm:text-sm" style={{ color: '#666' }}>A carregar...</div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-4" style={{ color: '#666' }}>
          <Clock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Nenhum pedido</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {/* Pending Orders */}
          {pendentes.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#1a1a2e' }}>
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--ff-orange-accent)' }} />
                Pendentes
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {pendentes.map(pedido => (
                  <motion.div
                    key={pedido.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg p-2 sm:p-3 flex items-center justify-between hover:shadow transition-shadow"
                    style={{
                      background: 'rgba(255, 107, 53, 0.1)',
                      border: '1px solid rgba(255, 107, 53, 0.3)'
                    }}
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base sm:text-lg font-mono font-bold" style={{ color: 'var(--ff-orange-accent)' }}>
                          {pedido.numeroPedido}
                        </span>
                        <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-semibold" style={{
                          background: 'rgba(255, 107, 53, 0.2)',
                          color: 'var(--ff-orange-accent)'
                        }}>
                          PENDENTE
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-xs space-y-0.5" style={{ color: '#1a1a2e' }}>
                        <p className="truncate"><span className="font-semibold">Máquina:</span> {pedido.maquinaModelo} - {pedido.maquinaSerie}</p>
                        <p><span className="font-semibold">Técnico:</span> <span className="capitalize">{pedido.tecnico}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleStatus(pedido.id, pedido.status)}
                        className="p-1 sm:p-1.5 text-white rounded transition-colors"
                        style={{ background: 'var(--ff-blue-electric)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ff-blue-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--ff-blue-electric)'}
                        title="Marcar como concluído"
                      >
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pedido.id)}
                        className="p-1 sm:p-1.5 text-white rounded transition-colors"
                        style={{ background: 'var(--ff-red-accent)' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Orders */}
          {concluidos.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs sm:text-sm font-semibold flex items-center gap-2" style={{ color: '#1a1a2e' }}>
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#00d4ff' }} />
                Concluídos ({concluidos.length})
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-auto group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-2 space-y-1.5 pl-4 sm:pl-6">
                {concluidos.map(pedido => (
                  <motion.div
                    key={pedido.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded p-1.5 sm:p-2 flex items-center justify-between text-[10px] sm:text-xs"
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
                      <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
