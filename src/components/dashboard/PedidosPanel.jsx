
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
      className="rounded-lg shadow-md p-3 sm:p-4 border border-gray-200 relative overflow-hidden"
      style={panelStyle.background || panelStyle.backgroundColor ? panelStyle : { background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)' }}
    >
      {/* Logo ATLAS em baixo relevo */}
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dc340a4ed_LogoGeomtricoATLAScomOlhoCircular-Photoroom.png"
        alt="ATLAS"
        className="absolute bottom-2 right-2 w-16 h-16 sm:w-24 sm:h-24 opacity-[0.05] pointer-events-none"
      />
      
      <div className="flex items-center justify-between mb-3 relative z-10">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <span className="hidden sm:inline">Pedidos dos Técnicos</span>
          <span className="sm:hidden">Pedidos</span>
        </h2>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
          {pendentes.length}
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">A carregar...</div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <Clock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Nenhum pedido</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {/* Pending Orders */}
          {pendentes.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                Pendentes
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {pendentes.map(pedido => (
                  <motion.div
                    key={pedido.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3 flex items-center justify-between hover:shadow transition-shadow"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base sm:text-lg font-mono font-bold text-orange-700">
                          {pedido.numeroPedido}
                        </span>
                        <span className="bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold">
                          PENDENTE
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-700 space-y-0.5">
                        <p className="truncate"><span className="font-semibold">Máquina:</span> {pedido.maquinaModelo} - {pedido.maquinaSerie}</p>
                        <p><span className="font-semibold">Técnico:</span> <span className="capitalize">{pedido.tecnico}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleStatus(pedido.id, pedido.status)}
                        className="p-1 sm:p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        title="Marcar como concluído"
                      >
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pedido.id)}
                        className="p-1 sm:p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
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
              <summary className="cursor-pointer text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-2 hover:text-gray-900">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                Concluídos ({concluidos.length})
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-auto group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-2 space-y-1.5 pl-4 sm:pl-6">
                {concluidos.map(pedido => (
                  <motion.div
                    key={pedido.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-green-50 border border-green-200 rounded p-1.5 sm:p-2 flex items-center justify-between text-[10px] sm:text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-mono font-bold text-green-700 mr-2">{pedido.numeroPedido}</span>
                      <span className="text-gray-600 truncate">{pedido.maquinaModelo}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(pedido.id)}
                      className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors ml-2"
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
