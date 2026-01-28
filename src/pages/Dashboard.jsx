import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FrotaACP, Pedido } from "@/entities/all";
import { Plus, Camera, Search, Wrench, User as UserIcon, Package, Sparkles, Repeat, CheckCircle2, ChevronDown, ChevronUp, Clock, Maximize2, Minimize2, HardDrive, AlertTriangle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/components/hooks/usePermissions";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import ImageUploadModal from "../components/dashboard/ImageUploadModal";
import PedidosPanel from "../components/dashboard/PedidosPanel";
import BulkCreateModal from "../components/dashboard/BulkCreateModal";
import BackupManager from "../components/dashboard/BackupManager";
import EditMachineModal from "../components/dashboard/EditMachineModal";
import OSNotificationsPanel from "../components/dashboard/OSNotificationsPanel";

const TECHNICIANS = [
  { id: 'raphael', name: 'RAPHAEL', color: 'bg-red-500', borderColor: '#ef4444', lightBg: '#fee2e2' },
  { id: 'nuno', name: 'NUNO', color: 'bg-yellow-500', borderColor: '#eab308', lightBg: '#fef3c7' },
  { id: 'rogerio', name: 'ROGÉRIO', color: 'bg-cyan-500', borderColor: '#06b6d4', lightBg: '#cffafe' },
  { id: 'patrick', name: 'PATRICK', color: 'bg-green-500', borderColor: '#10b981', lightBg: '#d1fae5' }
];

const TAREFAS_PREDEFINIDAS = [
  'Preparação geral',
  'Revisão 3000h',
  'VPS'
];

const TIPO_ICONS = {
  nova: { icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-100' },
  usada: { icon: Repeat, color: 'text-orange-600', bg: 'bg-orange-100' },
  aluguer: { icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' }
};

const MachineCardCompact = ({ machine, onClick }) => {
        return (
          <button
            onClick={() => onClick(machine)}
            className="w-full text-left p-3 sm:p-4 bg-white hover:bg-gray-50 border-2 border-black transition-all group clip-corner-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full bg-black"></div>
                <span className="text-sm font-mono font-bold text-black flex-1 truncate">{machine.serie}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {machine.prioridade && (
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                )}
                {machine.aguardaPecas && (
                  <Clock className="w-4 h-4 text-yellow-500" />
                )}
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
              </div>
            </div>
          </button>
        );
      };

const MachineCardTechnician = ({ machine, onClick, techColor }) => {
        return (
          <button
            onClick={() => onClick(machine)}
            className="w-full text-left p-3 bg-white hover:bg-gray-50 border-l-4 transition-all mb-2 clip-corner"
            style={{ borderLeftColor: techColor }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-bold text-black">{machine.serie}</span>
              <div className="flex items-center gap-2">
                {machine.prioridade && (
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                )}
                {machine.aguardaPecas && (
                  <Clock className="w-4 h-4 text-yellow-500" />
                )}
              </div>
            </div>
          </button>
        );
      };

const ObservationsModal = ({ isOpen, onClose, machine, onAddObservation, onToggleTask, onTogglePriority, onDelete, currentUser, userPermissions, onMarkComplete, onToggleAguardaPecas, allMachines, onOpenEdit }) => {
  const [newObs, setNewObs] = useState('');
  const [numeroPedido, setNumeroPedido] = useState('');
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [isEditingTasks, setIsEditingTasks] = useState(false);
  const [editedTasks, setEditedTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [machinePedidos, setMachinePedidos] = useState([]);
  const [localMachine, setLocalMachine] = useState(machine);
  
  React.useEffect(() => {
    if (machine && allMachines) {
      const updated = allMachines.find(m => m.id === machine.id);
      if (updated) {
        setLocalMachine(updated);
      } else {
        setLocalMachine(machine);
      }
    } else {
      setLocalMachine(machine);
    }
  }, [machine, allMachines]);
  
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (localMachine?.tarefas) {
      setEditedTasks([...localMachine.tarefas]);
    } else {
      setEditedTasks([]);
    }
    setIsEditingTasks(false); 
    setNewTaskText('');
  }, [localMachine, isOpen]);

  React.useEffect(() => {
    const loadMachinePedidos = async () => {
      if (localMachine?.id) {
        try {
          const allPedidos = await base44.entities.Pedido.list();
          const filtered = allPedidos.filter(p => p.maquinaId === localMachine.id);
          setMachinePedidos(filtered);
        } catch (error) {
          console.error('Erro ao carregar pedidos:', error);
        }
      }
    };
    
    if (isOpen) {
      loadMachinePedidos();
    }
  }, [localMachine, isOpen]);
  
  if (!isOpen || !localMachine) return null;

  const handleSubmit = () => {
    if (newObs.trim()) {
      onAddObservation(localMachine.id, newObs);
      setNewObs('');
    }
  };

  const handleMarkComplete = async () => {
    if (window.confirm(`Tem certeza que deseja marcar a máquina ${localMachine.serie} como CONCLUÍDA?`)) {
      await onMarkComplete(localMachine.id);
    }
  };

  const handleSubmitPedido = async () => {
    if (!numeroPedido.trim()) {
      alert('Por favor, insira o número do pedido');
      return;
    }

    try {
      await Pedido.create({
        numeroPedido: numeroPedido.trim(),
        maquinaId: localMachine.id,
        maquinaSerie: localMachine.serie,
        maquinaModelo: localMachine.modelo,
        tecnico: currentUser?.nome_tecnico || currentUser?.full_name,
        status: 'pendente'
      });

      setNumeroPedido('');
      setShowPedidoForm(false);
      
      const allPedidos = await base44.entities.Pedido.list();
      const filtered = allPedidos.filter(p => p.maquinaId === localMachine.id);
      setMachinePedidos(filtered);
      
      alert('Pedido enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      alert('Erro ao enviar pedido. Tente novamente.');
    }
  };

  const handleMoveToAFazer = async () => {
    if (!userPermissions?.canMoveAnyMachine) {
      alert("Você não tem permissão para mover esta máquina.");
      return;
    }
    
    if (window.confirm(`Deseja mover a máquina ${localMachine.serie} de volta para "A Fazer"?`)) {
      try {
        await FrotaACP.update(localMachine.id, {
          estado: 'a-fazer',
          tecnico: null,
          dataConclusao: null
        });
        
        onClose();
      } catch (error) {
        console.error("Erro ao mover máquina:", error);
        alert("Erro ao mover máquina. Tente novamente.");
      }
    }
  };

  const handleSaveTasks = async () => {
    setIsUpdating(true);
    try {
      await FrotaACP.update(localMachine.id, {
        tarefas: editedTasks
      });
      
      setIsEditingTasks(false);
    } catch (error) {
      console.error("Erro ao salvar tarefas:", error);
      alert("Erro ao salvar tarefas. Tente novamente.");
    }
    setIsUpdating(false);
  };

  const handleAddNewTask = () => {
    if (newTaskText.trim()) {
      setEditedTasks([...editedTasks, { texto: newTaskText.trim(), concluida: false }]);
      setNewTaskText('');
    }
  };

  const handleRemoveTask = (index) => {
    setEditedTasks(editedTasks.filter((_, i) => i !== index));
  };

  const handleToggleEditedTask = (index) => {
    const updated = [...editedTasks];
    updated[index].concluida = !updated[index].concluida;
    setEditedTasks(updated);
  };

  const handleToggleTaskLocal = async (taskIndex) => {
    if (isUpdating) return;
    
    const isResponsibleTech = currentUser?.nome_tecnico && localMachine.tecnico === currentUser.nome_tecnico;
    const isAdmin = userPermissions?.canMoveAnyMachine;
    const canEdit = (isAdmin || isResponsibleTech) && localMachine.estado?.includes('em-preparacao');
    
    if (!canEdit) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const updatedTasks = localMachine.tarefas.map((t, i) => 
        i === taskIndex ? { ...t, concluida: !t.concluida } : { ...t }
      );
      
      setLocalMachine({ ...localMachine, tarefas: updatedTasks });
      await onToggleTask(localMachine.id, taskIndex);
      
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      alert("Erro ao atualizar tarefa. Tente novamente.");
      setLocalMachine(localMachine);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAguardaPecasClick = async () => {
    const newValue = !localMachine.aguardaPecas;
    const confirmMessage = newValue 
      ? `Marcar máquina ${localMachine.serie} como "AGUARDA PEÇAS"?`
      : `Confirmar que as peças da máquina ${localMachine.serie} CHEGARAM?`;
    
    if (window.confirm(confirmMessage)) {
      setLocalMachine({ ...localMachine, aguardaPecas: newValue });
      await onToggleAguardaPecas(localMachine.id, newValue);
    }
  };

  const tarefasConcluidas = localMachine.tarefas?.filter(t => t.concluida).length || 0;
  const totalTarefas = localMachine.tarefas?.length || 0;
  
  const TipoIcon = TIPO_ICONS[localMachine.tipo]?.icon || Package;

  const isResponsibleTech = currentUser?.nome_tecnico && localMachine.tecnico === currentUser.nome_tecnico;
  const isAdmin = userPermissions?.canMoveAnyMachine;
  const canEditThisMachine = isAdmin || isResponsibleTech;
  const canEditTasks = localMachine.estado?.includes('em-preparacao') && canEditThisMachine;
  const canAdminEditTasks = userPermissions?.canMoveAnyMachine;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />
      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 rounded-xl shadow-2xl z-[9999] w-[95%] sm:w-[90%] max-w-4xl flex flex-col bg-white" style={{
        maxHeight: 'calc(100vh - 120px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
      }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-5 flex-shrink-0 border-b border-gray-200">
          <div className="pr-8">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-mono font-bold text-black">{localMachine.serie}</h2>
              {localMachine.prioridade && (
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              )}
              {localMachine.aguardaPecas && (
                <Clock className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <p className="text-sm text-gray-600">{localMachine.modelo}</p>
            {localMachine.ano && <p className="text-sm text-gray-500">Ano: {localMachine.ano}</p>}
            {localMachine.tecnico && (
              <p className="text-sm text-gray-600 mt-1">
                Responsável: <span className="font-semibold capitalize">{localMachine.tecnico}</span>
              </p>
            )}
            
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              {localMachine.created_date && (
                <p>📅 Criada: {new Date(localMachine.created_date).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              )}
              {localMachine.dataAtribuicao && (
                <p>👤 Atribuída: {new Date(localMachine.dataAtribuicao).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              )}
              {localMachine.dataConclusao && (
                <p>✅ Concluída: {new Date(localMachine.dataConclusao).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {userPermissions?.canMoveAnyMachine && localMachine.estado !== 'a-fazer' && (
              <button
                onClick={handleMoveToAFazer}
                className="px-3 py-1.5 text-white rounded font-semibold text-xs bg-gray-600 hover:bg-gray-700"
              >
                Mover para A Fazer
              </button>
            )}

            {userPermissions?.canSetPriority && localMachine.estado === 'a-fazer' && (
              <button
                onClick={() => onTogglePriority(localMachine.id, !localMachine.prioridade)}
                className="px-3 py-1.5 rounded font-semibold text-xs text-white bg-orange-500 hover:bg-orange-600"
              >
                {localMachine.prioridade ? 'Remover Prioridade' : 'Marcar Prioritária'}
              </button>
            )}
              
            {userPermissions?.canDeleteMachine && (
              <>
                <button
                  onClick={() => onOpenEdit(localMachine)}
                  className="px-3 py-1.5 text-white rounded font-semibold text-xs bg-blue-600 hover:bg-blue-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja apagar a máquina ${localMachine.serie}?`)) {
                      onDelete(localMachine.id);
                    }
                  }}
                  className="px-3 py-1.5 text-white rounded font-semibold text-xs bg-red-500 hover:bg-red-600"
                >
                  Apagar
                </button>
              </>
            )}

            {localMachine.estado?.includes('em-preparacao') && !localMachine.estado?.includes('concluida') && canEditThisMachine && (
              <button
                onClick={handleMarkComplete}
                className="px-3 py-1.5 text-white rounded font-semibold text-xs bg-green-600 hover:bg-green-700 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Marcar como Concluída
              </button>
            )}

            {localMachine.estado?.includes('em-preparacao') && canEditThisMachine && (
              <button
                onClick={handleAguardaPecasClick}
                disabled={isUpdating}
                className="px-3 py-1.5 text-white rounded font-semibold text-xs bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1 disabled:opacity-50"
              >
                <Clock className="w-3 h-3" />
                {localMachine.aguardaPecas ? 'Peças Chegaram' : 'Aguarda Peças'}
              </button>
            )}
          </div>

          {localMachine.estado?.includes('em-preparacao') && !canEditThisMachine && (
            <div className="p-2 rounded bg-red-50 border border-red-200">
              <p className="text-xs text-red-600">
                ⓘ Apenas visualização - Esta máquina está atribuída a outro técnico
              </p>
            </div>
          )}

          {localMachine.estado?.includes('em-preparacao') && canEditThisMachine && (
            <div className="p-3 rounded bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-black">Pedidos</h4>
                <button
                  onClick={() => setShowPedidoForm(!showPedidoForm)}
                  className="px-3 py-1 text-white rounded text-xs font-semibold bg-black hover:bg-gray-800"
                >
                  {showPedidoForm ? 'Cancelar' : '+ Novo'}
                </button>
              </div>

              {showPedidoForm && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={numeroPedido}
                    onChange={(e) => setNumeroPedido(e.target.value)}
                    placeholder="Número do pedido..."
                    className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 focus:border-black focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitPedido()}
                  />
                  <button
                    onClick={handleSubmitPedido}
                    className="px-4 py-2 text-white rounded text-sm font-semibold bg-black hover:bg-gray-800"
                  >
                    Enviar
                  </button>
                </div>
              )}

              {machinePedidos.length > 0 && (
                <div className="space-y-2">
                  {machinePedidos.map(pedido => (
                    <div 
                      key={pedido.id}
                      className="flex items-center justify-between p-2 rounded bg-white border"
                    >
                      <span className="font-mono font-bold text-sm text-black">{pedido.numeroPedido}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-700">
                        {pedido.status === 'concluido' ? 'CONFIRMADO' : 'PENDENTE'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {((localMachine.tarefas && localMachine.tarefas.length > 0) || canAdminEditTasks) && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-black">Tarefas</h3>
                <div className="flex items-center gap-2">
                  {!isEditingTasks && (
                    <span className="text-xs text-gray-600">{tarefasConcluidas}/{totalTarefas} concluídas</span>
                  )}
                  {canAdminEditTasks && (
                    <button
                      onClick={() => {
                        if (isEditingTasks) {
                          handleSaveTasks();
                        } else {
                          setIsEditingTasks(true);
                        }
                      }}
                      className="px-3 py-1 rounded text-xs font-semibold text-white bg-black hover:bg-gray-800"
                    >
                      {isEditingTasks ? 'Guardar' : 'Editar'}
                    </button>
                  )}
                </div>
              </div>

              {isEditingTasks ? (
                <div className="space-y-3">
                  {editedTasks.map((tarefa, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded bg-gray-50 border border-gray-200">
                      <input
                        type="checkbox"
                        checked={tarefa.concluida}
                        onChange={() => handleToggleEditedTask(idx)}
                        className="mt-1 w-4 h-4 rounded"
                      />
                      <span className={`flex-1 text-sm ${tarefa.concluida ? 'line-through text-gray-500' : 'text-black'}`}>
                        {tarefa.texto}
                      </span>
                      <button
                        onClick={() => handleRemoveTask(idx)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {TAREFAS_PREDEFINIDAS.length > 0 && (
                    <div className="space-y-2 p-3 rounded bg-gray-50 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700">Tarefas Pré-definidas:</p>
                      {TAREFAS_PREDEFINIDAS.map((predefTarefa, idx) => {
                        const isChecked = editedTasks.some(t => t.texto === predefTarefa);
                        return (
                          <div key={`predef-${idx}`} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setEditedTasks(prev => prev.filter(t => t.texto !== predefTarefa));
                                } else {
                                  setEditedTasks(prev => [...prev, { texto: predefTarefa, concluida: false }]);
                                }
                              }}
                              className="w-4 h-4 rounded"
                            />
                            <label className="text-sm text-black">{predefTarefa}</label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      placeholder="Nova tarefa..."
                      className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 focus:border-black focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNewTask()}
                    />
                    <button
                      onClick={handleAddNewTask}
                      className="px-4 py-2 text-white rounded text-sm bg-black hover:bg-gray-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {localMachine.tarefas && localMachine.tarefas.map((tarefa, idx) => {
                    const canToggleThisTask = (isAdmin || isResponsibleTech) && localMachine.estado?.includes('em-preparacao');
                    
                    return (
                      <div key={idx} className="flex items-start gap-3 p-2 rounded bg-gray-50 border border-gray-200">
                        <input
                          type="checkbox"
                          checked={tarefa.concluida}
                          onChange={() => canToggleThisTask && !isUpdating && handleToggleTaskLocal(idx)}
                          disabled={!canToggleThisTask || isUpdating}
                          className="mt-1 w-5 h-5 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className={`flex-1 text-sm ${tarefa.concluida ? 'line-through text-gray-500' : 'text-black'}`}>
                          {tarefa.texto}
                        </span>
                        {isUpdating && (
                          <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="text-base font-bold mb-3 text-black">Observações</h3>
            {localMachine.observacoes && localMachine.observacoes.length > 0 ? (
              <div className="space-y-2">
                {localMachine.observacoes.map((obs, idx) => (
                  <div key={idx} className="rounded p-3 bg-gray-50 border border-gray-200">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-semibold text-sm text-black">{obs.autor}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(obs.data).toLocaleString('pt-PT', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{obs.texto}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500">Nenhuma observação ainda</p>
            )}
          </div>
        </div>

        <div className="p-5 flex-shrink-0 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <input
              type="text"
              value={newObs}
              onChange={(e) => setNewObs(e.target.value)}
              placeholder="Adicionar observação..."
              className="flex-1 px-4 py-2 text-sm rounded border border-gray-300 focus:border-black focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              className="px-6 py-2 text-white rounded font-semibold text-sm bg-black hover:bg-gray-800"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Continue with CreateMachineModal and other components...
const CreateMachineModal = ({ isOpen, onClose, onSubmit, prefillData }) => {
  const [formData, setFormData] = useState({ 
    modelo: '', 
    serie: '', 
    ano: '', 
    tipo: 'nova', 
    tarefas: [],
    recondicao: { bronze: false, prata: false },
    prioridade: false,
    aguardaPecas: false 
  });
  const [selectedTarefas, setSelectedTarefas] = useState({});
  const [customTarefas, setCustomTarefas] = useState([]);
  const [newTarefaText, setNewTarefaText] = useState('');

  useEffect(() => {
    if (prefillData) {
      setFormData({ 
        ...prefillData, 
        tipo: prefillData.tipo || 'nova', 
        tarefas: prefillData.tarefas || [],
        recondicao: prefillData.recondicao || { bronze: false, prata: false },
        prioridade: prefillData.prioridade || false,
        aguardaPecas: prefillData.aguardaPecas || false 
      });
      if (prefillData.tarefas) {
        const preSelected = {};
        const custom = [];
        prefillData.tarefas.forEach(t => {
          if (TAREFAS_PREDEFINIDAS.includes(t.texto)) {
            preSelected[t.texto] = true;
          } else {
            custom.push(t.texto);
          }
        });
        setSelectedTarefas(preSelected);
        setCustomTarefas(custom);
      }
    } else {
      setFormData({ 
        modelo: '', 
        serie: '', 
        ano: '', 
        tipo: 'nova', 
        tarefas: [],
        recondicao: { bronze: false, prata: false },
        prioridade: false,
        aguardaPecas: false 
      });
      setSelectedTarefas({});
      setCustomTarefas([]);
    }
  }, [prefillData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const tarefas = [
      ...TAREFAS_PREDEFINIDAS.filter(tarefa => selectedTarefas[tarefa]).map(texto => ({ texto, concluida: false })),
      ...customTarefas.map(texto => ({ texto, concluida: false }))
    ];
    
    onSubmit({ ...formData, tarefas });
  };

  const handleTarefaToggle = (tarefa) => {
    setSelectedTarefas(prev => ({ ...prev, [tarefa]: !prev[tarefa] }));
  };

  const handleAddCustomTarefa = () => {
    if (newTarefaText.trim()) {
      setCustomTarefas(prev => [...prev, newTarefaText.trim()]);
      setNewTarefaText('');
    }
  };

  const handleRemoveCustomTarefa = (index) => {
    setCustomTarefas(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl z-50 w-[90%] max-w-md p-6 max-h-[90vh] overflow-y-auto bg-white">
        <h2 className="text-2xl font-bold mb-6 text-black">Nova Máquina</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Modelo</label>
            <input
              type="text"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              required
              className="w-full px-4 py-2 rounded border border-gray-300 focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Número de Série</label>
            <input
              type="text"
              value={formData.serie}
              onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
              required
              className="w-full px-4 py-2 rounded border border-gray-300 focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Ano</label>
            <input
              type="number"
              value={formData.ano}
              onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:border-black focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Tipo de Máquina</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TIPO_ICONS).map(([tipo, { icon: Icon }]) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo })}
                  className={`p-3 rounded border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.tipo === tipo ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium capitalize">{tipo}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="prioridade"
                checked={formData.prioridade || false}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="prioridade" className="text-sm text-gray-700">
                Marcar como Prioritária
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700">Tarefas a Realizar</label>
            <div className="space-y-2 mb-3">
              {TAREFAS_PREDEFINIDAS.map(tarefa => (
                <div key={tarefa} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`tarefa-${tarefa}`}
                    checked={!!selectedTarefas[tarefa]}
                    onChange={() => handleTarefaToggle(tarefa)}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor={`tarefa-${tarefa}`} className="text-sm text-gray-700">
                    {tarefa}
                  </label>
                </div>
              ))}
            </div>
            
            {customTarefas.length > 0 && (
              <div className="space-y-2 mb-3 p-3 rounded bg-gray-50 border border-gray-200">
                <p className="text-xs font-semibold text-gray-700">Tarefas Personalizadas:</p>
                {customTarefas.map((tarefa, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-white">
                    <span className="text-sm text-gray-700">{tarefa}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomTarefa(idx)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newTarefaText}
                onChange={(e) => setNewTarefaText(e.target.value)}
                placeholder="Adicionar tarefa personalizada..."
                className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 focus:border-black focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTarefa())}
              />
              <button
                type="button"
                onClick={handleAddCustomTarefa}
                className="px-4 py-2 text-white rounded text-sm font-semibold bg-black hover:bg-gray-800"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white rounded bg-black hover:bg-gray-800"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

const TechnicianCompletedSection = ({ machines, techId, onOpenMachine }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
      >
        <span className="text-xs font-semibold">
          Concluídas: {machines.length}
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 space-y-1 max-h-48 overflow-y-auto"
          >
            {machines.map(machine => (
              <button
                key={machine.id}
                onClick={() => onOpenMachine(machine)}
                className="w-full text-left p-2 rounded bg-white hover:bg-gray-50 border border-gray-200"
              >
                <span className="text-xs font-mono text-black">{machine.serie}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AssignModal = ({ isOpen, onClose, machine, onAssign }) => {
  if (!isOpen || !machine) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl z-[70] w-[90%] max-w-md p-6 bg-white">
        <h3 className="text-xl font-bold mb-4 text-black">
          Atribuir Máquina {machine.serie}
        </h3>
        <p className="text-sm mb-6 text-gray-600">Selecione o técnico:</p>
        
        <div className="grid grid-cols-2 gap-3">
          {TECHNICIANS.map(tech => (
            <button
              key={tech.id}
              onClick={() => {
                onAssign(tech.id);
                onClose();
              }}
              className="p-4 rounded border-2 transition-all hover:shadow-md bg-white text-black font-semibold"
              style={{ borderColor: tech.borderColor }}
            >
              <UserIcon className="w-6 h-6 mx-auto mb-2" />
              {tech.name}
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 rounded border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </>
  );
};

const FullscreenSectionModal = ({ isOpen, onClose, title, machines, icon: Icon, onOpenMachine, userPermissions, currentUser, onAssign }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-[120]" onClick={onClose} />
      <div className="fixed z-[130] flex flex-col bg-white" style={{
        top: '0',
        left: '0', 
        right: '0',
        bottom: '0'
      }}>
        <div className="p-6 border-b flex-shrink-0 mt-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="w-8 h-8 text-black" />
              <h2 className="text-3xl font-bold text-black">{title}</h2>
              <span className="px-4 py-1 rounded-full text-sm font-bold bg-black text-white">
                {machines.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {machines.map(machine => (
              <MachineCardCompact key={machine.id} machine={machine} onClick={onOpenMachine} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [prefillData, setPrefillData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showObsModal, setShowObsModal] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [machineToAssign, setMachineToAssign] = useState(null);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [machineToEdit, setMachineToEdit] = useState(null);

  const [showAFazerFullscreen, setShowAFazerFullscreen] = useState(false);
  const [showConcluidaFullscreen, setShowConcluidaFullscreen] = useState(false);

  const userPermissions = usePermissions(currentUser?.perfil, currentUser?.nome_tecnico);

  const loadMachines = useCallback(async () => {
    try {
      const data = await FrotaACP.list('-created_date');
      setMachines(data);
    } catch (error) {
      console.error("Erro ao carregar máquinas:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        console.error("Erro ao carregar usuário", e);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh: Atualizando dados...');
      loadMachines();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadMachines]);

  const handleCreateMachine = async (machineData) => {
    try {
      await FrotaACP.create({
        ...machineData,
        ano: machineData.ano ? parseInt(machineData.ano) : null,
        estado: 'a-fazer'
      });
      await loadMachines();
      setShowCreateModal(false);
      setPrefillData(null);
    } catch (error) {
      console.error("Erro ao criar máquina:", error);
    }
  };

  const handleImageUploadSuccess = (extractedData) => {
    setShowImageModal(false);
    setPrefillData(extractedData);
    setShowCreateModal(true);
  };

  const handleAddObservation = async (machineId, texto) => {
    try {
      const machine = machines.find(m => m.id === machineId);
      const newObs = {
        texto,
        autor: currentUser?.full_name || 'Utilizador',
        data: new Date().toISOString()
      };
      
      setMachines(prevMachines => 
        prevMachines.map(m => 
          m.id === machineId 
            ? { ...m, observacoes: [...(m.observacoes || []), newObs] }
            : m
        )
      );
      
      await FrotaACP.update(machineId, {
        observacoes: [...(machine.observacoes || []), newObs]
      });
      
    } catch (error) {
      console.error("Erro ao adicionar observação:", error);
      await loadMachines();
    }
  };

  const handleToggleTask = useCallback(async (machineId, taskIndex) => {
    try {
      const machine = machines.find(m => m.id === machineId);
      if (!machine || !machine.tarefas || !machine.tarefas[taskIndex]) {
        throw new Error("Tarefa não encontrada");
      }
      
      const updatedTarefas = machine.tarefas.map((t, i) => 
        i === taskIndex ? { ...t, concluida: !t.concluida } : { ...t }
      );
      
      await FrotaACP.update(machineId, {
        tarefas: updatedTarefas
      });
      
      setMachines(prevMachines => 
        prevMachines.map(m => 
          m.id === machineId 
            ? { ...m, tarefas: updatedTarefas }
            : m
        )
      );
      
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      throw error;
    }
  }, [machines]);

  const handleTogglePriority = async (machineId, newPriorityValue) => {
    try {
      setMachines(prevMachines => 
        prevMachines.map(m => 
          m.id === machineId 
            ? { ...m, prioridade: newPriorityValue }
            : m
        )
      );
      
      await FrotaACP.update(machineId, {
        prioridade: newPriorityValue
      });
    } catch (error) {
      console.error("Erro ao atualizar prioridade:", error);
      await loadMachines();
    }
  };

  const handleDeleteMachine = async (machineId) => {
    if (!userPermissions?.canDeleteMachine) {
      alert("Você não tem permissão para apagar máquinas.");
      return;
    }
    
    try {
      await FrotaACP.delete(machineId);
      setShowObsModal(false);
      setSelectedMachine(null);
      await loadMachines();
    } catch (error) {
      console.error("Erro ao apagar máquina:", error);
      alert("Erro ao apagar máquina. Tente novamente.");
    }
  };

  const handleAssignMachine = async (machine) => {
    if (!currentUser) return;
    
    if (userPermissions?.canMoveAnyMachine) {
      setMachineToAssign(machine);
      setShowAssignModal(true);
    } else if (userPermissions?.canMoveMachineToOwnColumn && currentUser?.nome_tecnico) {
      try {
        await FrotaACP.update(machine.id, {
          estado: `em-preparacao-${currentUser.nome_tecnico}`,
          tecnico: currentUser.nome_tecnico,
          dataAtribuicao: new Date().toISOString()
        });
        
        await base44.entities.Notificacao.create({
          userId: 'admin',
          message: `${currentUser.nome_tecnico.charAt(0).toUpperCase() + currentUser.nome_tecnico.slice(1)} atribuiu a máquina ${machine.serie} - Abrir OS!`,
          machineId: machine.id,
          machineSerie: machine.serie,
          technicianName: currentUser.nome_tecnico,
          type: 'os_assignment',
          isRead: false
        });
        
        await loadMachines();
      } catch (error) {
        console.error("Erro ao atribuir máquina:", error);
        alert("Erro ao atribuir máquina. Tente novamente.");
      }
    }
  };

  const handleAssignToTechnician = async (techId) => {
    if (!machineToAssign) return;
    
    try {
      await FrotaACP.update(machineToAssign.id, {
        estado: `em-preparacao-${techId}`,
        tecnico: techId,
        dataAtribuicao: new Date().toISOString()
      });
      await loadMachines();
      setShowAssignModal(false);
      setMachineToAssign(null);
    } catch (error) {
      console.error("Erro ao atribuir máquina:", error);
      alert("Erro ao atribuir máquina. Tente novamente.");
    }
  };

  const handleMarkComplete = async (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine || !machine.tecnico) return;

    try {
      const updateData = {
        estado: `concluida-${machine.tecnico}`,
        dataConclusao: new Date().toISOString()
      };
      
      setMachines(prevMachines => 
        prevMachines.map(m => 
          m.id === machineId 
            ? { ...m, ...updateData }
            : m
        )
      );
      
      await FrotaACP.update(machineId, updateData);
    } catch (error) {
      console.error("Erro ao marcar como concluída:", error);
      alert("Erro ao marcar como concluída. Tente novamente.");
      await loadMachines();
    }
  };
  
  const handleToggleAguardaPecas = async (machineId, newValue) => {
    try {
      setMachines(prevMachines => 
        prevMachines.map(m => 
          m.id === machineId 
            ? { ...m, aguardaPecas: newValue }
            : m
        )
      );
      
      await FrotaACP.update(machineId, {
        aguardaPecas: newValue
      });
    } catch (error) {
      console.error("Erro ao atualizar status de aguarda peças:", error);
      alert("Erro ao atualizar status. Tente novamente.");
      await loadMachines();
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    let machineId = draggableId;
    let targetState = destination.droppableId; 

    if (draggableId.startsWith('concluida-')) {
      machineId = draggableId.replace('concluida-', '');
    }

    const machineBeingMoved = machines.find(m => m.id === machineId);
    if (!machineBeingMoved) {
      console.error("Machine not found for draggableId:", draggableId);
      return;
    }

    let updateData = {};
    let newTechnician = null;
    let newEstado = targetState;
    let newConclusaoDate = null;
    let newAtribuicaoDate = null;

    if (targetState === 'a-fazer') {
      newTechnician = null;
      newEstado = 'a-fazer';
      newConclusaoDate = null;
    } else if (targetState === 'concluida-geral') {
      newTechnician = null;
      newEstado = `concluida-geral`;
      newConclusaoDate = new Date().toISOString();
    } else if (targetState.startsWith('em-preparacao-')) {
      newTechnician = targetState.replace('em-preparacao-', '');
      newEstado = `em-preparacao-${newTechnician}`;
      newConclusaoDate = null;
      if (!machineBeingMoved.dataAtribuicao) {
        newAtribuicaoDate = new Date().toISOString();
      }
    } else if (targetState.startsWith('concluida-')) {
      newTechnician = targetState.replace('concluida-', '');
      newEstado = `concluida-${newTechnician}`;
      newConclusaoDate = new Date().toISOString();
    } else {
      console.error("Unknown droppableId:", targetState);
      return;
    }

    if (userPermissions?.canMoveAnyMachine) {
      try {
        updateData.estado = newEstado;
        updateData.tecnico = newTechnician;
        updateData.dataConclusao = newConclusaoDate;
        if (newAtribuicaoDate) {
          updateData.dataAtribuicao = newAtribuicaoDate;
        }

        await FrotaACP.update(machineId, updateData);
        await loadMachines();
      } catch (error) {
        console.error("Erro ao mover máquina:", error);
        alert("Erro ao mover máquina. Tente novamente.");
      }
      return;
    }

    if (targetState === 'a-fazer') {
      if (!(machineBeingMoved.tecnico === currentUser?.nome_tecnico && machineBeingMoved.estado?.startsWith('em-preparacao-'))) {
        alert("Você não tem permissão para mover esta máquina para 'A Fazer'.");
        return;
      }
    } else if (targetState.startsWith('em-preparacao-')) {
      const destTechId = targetState.replace('em-preparacao-', '');
      if (!userPermissions.canMoveMachineTo(destTechId, targetState)) {
        alert("Você não tem permissão para mover esta máquina.");
        return;
      }
    } else if (targetState.startsWith('concluida-')) {
      const destTechId = targetState.replace('concluida-', '');
      if (!userPermissions.canMoveMachineTo(destTechId, targetState)) {
        alert("Você não tem permissão para mover esta máquina.");
        return;
      }
    } else if (targetState === 'concluida-geral') {
      alert("Você não tem permissão para mover máquinas para a área geral de concluídas.");
      return;
    }

    try {
      updateData.estado = newEstado;
      updateData.tecnico = newTechnician;
      updateData.dataConclusao = newConclusaoDate;
      if (newAtribuicaoDate) {
        updateData.dataAtribuicao = newAtribuicaoDate;
      }

      await FrotaACP.update(machineId, updateData);
      await loadMachines();
    } catch (error) {
      console.error("Erro ao mover máquina:", error);
      alert("Erro ao mover máquina. Tente novamente.");
    }
  };

  const filteredMachines = useMemo(() => {
    if (!searchQuery) return [];
    return machines.filter(m =>
      m.modelo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.serie?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [machines, searchQuery]);

  const aFazerMachines = useMemo(() => {
    const filtered = machines.filter(m => m.estado === 'a-fazer');
    return filtered.sort((a, b) => {
      if (a.prioridade && !b.prioridade) return -1;
      if (!a.prioridade && b.prioridade) return 1;
      return 0;
    });
  }, [machines]);

  const allConcluidaMachines = useMemo(() => {
    const concluidas = machines.filter(m => m.estado?.includes('concluida'));
    return concluidas.sort((a, b) => {
      const dateA = a.dataConclusao ? new Date(a.dataConclusao).getTime() : 0;
      const dateB = b.dataConclusao ? new Date(b.dataConclusao).getTime() : 0;
      return dateB - dateA;
    });
  }, [machines]);

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Header Section */}
      <div className="mb-6">
        {/* Top Action Buttons */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <PedidosPanel userPermissions={userPermissions} isCompact={true} />
            {userPermissions?.canDeleteMachine && <OSNotificationsPanel userPermissions={userPermissions} />}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {userPermissions?.canDeleteMachine && (
              <button
                onClick={() => setShowBackupManager(true)}
                className="px-4 py-2 bg-gray-600 text-white text-xs font-bold tracking-wider hover:bg-gray-700 active:scale-95 transition-all clip-corner"
              >
                <HardDrive className="w-4 h-4 inline mr-2" />
                BACKUP
              </button>
            )}

            {userPermissions?.canCreateMachine && (
              <>
                <button
                  onClick={() => setShowBulkCreateModal(true)}
                  className="px-4 py-2 bg-green-600 text-white text-xs font-bold tracking-wider hover:bg-green-700 active:scale-95 transition-all clip-corner"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CRIAÇÃO MASSIVA IA
                </button>

                <button
                  onClick={() => setShowImageModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-bold tracking-wider hover:bg-purple-700 active:scale-95 transition-all clip-corner"
                >
                  <Camera className="w-4 h-4 inline mr-2" />
                  CRIAR COM IA
                </button>

                <button
                  onClick={() => { setPrefillData(null); setShowCreateModal(true); }}
                  className="px-4 py-2 bg-pink-600 text-white text-xs font-bold tracking-wider hover:bg-pink-700 active:scale-95 transition-all clip-corner"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  NOVA MÁQUINA
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="SISTEMA DE BUSCA"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-gray-300 outline-none text-gray-700 placeholder-gray-400 focus:border-black clip-corner"
          />
        </div>
      </div>

      {searchQuery ? (
        <div className="space-y-2">
          {filteredMachines.map(machine => (
            <MachineCardCompact
              key={machine.id}
              machine={machine}
              onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }}
            />
          ))}
        </div>
      ) : (
        <>
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Top Section - A Fazer and Concluída */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* A FAZER */}
              <div className="overflow-hidden bg-black clip-corner-top border-2 border-black">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wrench className="w-5 h-5 text-white" />
                      <h3 className="text-base font-bold text-white tracking-wide">A FAZER</h3>
                      <span className="px-2.5 py-0.5 bg-white text-black text-xs font-bold clip-corner">
                        {aFazerMachines.length} ATIVOS
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAFazerFullscreen(true)}
                        className="p-1.5 bg-white/10 hover:bg-white/20 clip-corner"
                      >
                        <Maximize2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                <Droppable droppableId="a-fazer">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-4 space-y-2 max-h-[400px] overflow-y-auto"
                    >
                      {aFazerMachines.map((machine, index) => (
                        <Draggable 
                          key={machine.id} 
                          draggableId={machine.id} 
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <MachineCardCompact
                                machine={machine}
                                onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* CONCLUÍDA */}
              <div className="overflow-hidden bg-black clip-corner-top border-2 border-black">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <h3 className="text-base font-bold text-white tracking-wide">CONCLUÍDA</h3>
                      <span className="px-2.5 py-0.5 bg-white text-black text-xs font-bold clip-corner">
                        TOTAL: {allConcluidaMachines.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowConcluidaFullscreen(true)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 clip-corner"
                    >
                      <Maximize2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <Droppable droppableId="concluida-geral">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-4 space-y-2 min-h-[100px] max-h-[400px] overflow-y-auto"
                    >
                      {allConcluidaMachines.map((machine, index) => (
                        <Draggable 
                          key={machine.id} 
                          draggableId={`concluida-${machine.id}`} 
                          index={index}
                          isDragDisabled={!userPermissions?.canMoveAnyMachine}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <button
                                onClick={() => { setSelectedMachine(machine); setShowObsModal(true); }}
                                className="w-full text-left p-3 rounded bg-white hover:bg-gray-50 border-l-4 transition-all"
                                style={{ borderLeftColor: machine.tecnico ? TECHNICIANS.find(t => t.id === machine.tecnico)?.borderColor : '#10b981' }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-mono font-bold text-black">{machine.serie}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 uppercase">
                                      {machine.tecnico ? `CONCLUÍDO ${machine.tecnico}`.toUpperCase() : 'CONCLUÍDO'}
                                    </span>
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* STATUS DE OPERADORES */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-black tracking-wider mb-4">STATUS DE OPERADORES</h2>
            </div>

            {/* Technician Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TECHNICIANS.map(tech => {
                const emPreparacao = machines.filter(m => m.estado === `em-preparacao-${tech.id}`);
                const concluidas = machines.filter(m => m.estado === `concluida-${tech.id}`);
                const isCurrentUserTech = currentUser?.nome_tecnico === tech.id;
                
                const statusLabel = emPreparacao.length === 0 ? 'EM ESPERA' :
                                   emPreparacao.some(m => m.estado.includes('em-preparacao')) ? 'PROCESSANDO' :
                                   'ATIVO';
                const statusColor = emPreparacao.length === 0 ? 'text-gray-500' :
                                   emPreparacao.some(m => m.estado.includes('em-preparacao')) ? 'text-cyan-600' :
                                   'text-yellow-600';
                
                return (
                  <div 
                    key={tech.id} 
                    className="overflow-hidden bg-white border-2 border-black clip-corner-top"
                  >
                    <div className="h-2" style={{ backgroundColor: tech.borderColor }}></div>
                    {/* Header */}
                    <div className="p-4 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <UserIcon className="w-5 h-5" style={{ color: tech.borderColor }} />
                        <h4 className="text-sm font-bold text-black tracking-wide">{tech.name}</h4>
                      </div>
                    </div>

                    {/* Em Preparação */}
                    <Droppable droppableId={`em-preparacao-${tech.id}`}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="px-4 pb-3 min-h-[120px] max-h-[280px] overflow-y-auto"
                        >
                          {emPreparacao.map((machine, index) => (
                            <Draggable 
                              key={machine.id} 
                              draggableId={machine.id} 
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{ ...provided.draggableProps.style }}
                                >
                                  <MachineCardTechnician
                                    machine={machine}
                                    onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }}
                                    techColor={tech.borderColor}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          
                          {emPreparacao.length === 0 && (
                            <div className="flex items-center justify-center py-8 text-gray-400">
                              <svg className="w-16 h-16 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>

                    <Droppable droppableId={`concluida-${tech.id}`}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="hidden"
                        >
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    <TechnicianCompletedSection
                      machines={concluidas}
                      techId={tech.id}
                      onOpenMachine={(m) => { setSelectedMachine(m); setShowObsModal(true); }}
                    />

                    {/* Footer Status */}
                    <div className="p-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                      <span className={`text-xs font-bold tracking-wider ${statusColor}`}>
                        {statusLabel}
                      </span>
                      <span className="text-xs font-bold text-black">
                        {concluidas.length} DONE
                      </span>
                    </div>

                    {emPreparacao.length > 0 && emPreparacao.some(m => m.estado.includes('em-preparacao')) && (
                      <div className="px-3 pb-3">
                        <button className="w-full py-2.5 text-white text-xs font-bold tracking-wide clip-corner" style={{ background: tech.borderColor }}>
                          EM EXECUÇÃO
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </>
      )}

      {/* Modals */}
      <CreateMachineModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setPrefillData(null); }}
        onSubmit={handleCreateMachine}
        prefillData={prefillData}
      />

      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onSuccess={handleImageUploadSuccess}
        purpose="create"
      />

      <BulkCreateModal
        isOpen={showBulkCreateModal}
        onClose={() => setShowBulkCreateModal(false)}
        onSuccess={async () => {
          await loadMachines();
          setShowBulkCreateModal(false);
        }}
      />

      <ObservationsModal
        isOpen={showObsModal}
        onClose={() => { setShowObsModal(false); setSelectedMachine(null); }}
        machine={selectedMachine}
        allMachines={machines}
        onAddObservation={handleAddObservation}
        onToggleTask={handleToggleTask}
        onTogglePriority={handleTogglePriority}
        onDelete={handleDeleteMachine}
        onMarkComplete={handleMarkComplete}
        onToggleAguardaPecas={handleToggleAguardaPecas}
        currentUser={currentUser}
        userPermissions={userPermissions}
        onOpenEdit={(machine) => {
          setMachineToEdit(machine);
          setShowEditModal(true);
        }}
      />

      <EditMachineModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setMachineToEdit(null); }}
        machine={machineToEdit}
        onSave={async (updatedData) => {
          try {
            await FrotaACP.update(machineToEdit.id, updatedData);
            await loadMachines();
            setShowEditModal(false);
            setMachineToEdit(null);
            setShowObsModal(false);
            setSelectedMachine(null);
          } catch (error) {
            console.error("Erro ao atualizar máquina:", error);
            alert("Erro ao atualizar máquina. Tente novamente.");
          }
        }}
      />

      <AssignModal
        isOpen={showAssignModal}
        onClose={() => { setShowAssignModal(false); setMachineToAssign(null); }}
        machine={machineToAssign}
        onAssign={handleAssignToTechnician}
      />

      <BackupManager
        isOpen={showBackupManager}
        onClose={() => setShowBackupManager(false)}
        onSuccess={async () => {
          await loadMachines();
        }}
      />

      <FullscreenSectionModal
        isOpen={showAFazerFullscreen}
        onClose={() => setShowAFazerFullscreen(false)}
        title="A Fazer"
        machines={aFazerMachines}
        icon={Wrench}
        onOpenMachine={(m) => { setSelectedMachine(m); setShowObsModal(true); }}
        onAssign={handleAssignMachine}
        userPermissions={userPermissions}
        currentUser={currentUser}
      />

      <FullscreenSectionModal
        isOpen={showConcluidaFullscreen}
        onClose={() => setShowConcluidaFullscreen(false)}
        title="Concluída"
        machines={allConcluidaMachines}
        icon={CheckCircle2}
        onOpenMachine={(m) => { setSelectedMachine(m); setShowObsModal(true); }}
        userPermissions={userPermissions}
        currentUser={currentUser}
      />
    </div>
  );
}