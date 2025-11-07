
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FrotaACP, Pedido } from "@/entities/all";
import { Plus, Camera, Search, Wrench, User as UserIcon, Package, Sparkles, Repeat, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/components/hooks/usePermissions";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import ImageUploadModal from "../components/dashboard/ImageUploadModal";
import PedidosPanel from "../components/dashboard/PedidosPanel";

const TECHNICIANS = [
  { id: 'raphael', name: 'Raphael', color: 'bg-blue-500' },
  { id: 'nuno', name: 'Nuno', color: 'bg-green-500' },
  { id: 'rogerio', name: 'Rogério', color: 'bg-purple-500' },
  { id: 'patrick', name: 'Patrick', color: 'bg-orange-500' }
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

const MachineCard = ({ machine, onOpenObservations, isCompact = false, onAssign, userPermissions, currentUser, techStyles }) => {
  const TipoIcon = TIPO_ICONS[machine.tipo]?.icon || Package;
  
  if (isCompact) {
    return (
      <button
        onClick={() => onOpenObservations(machine)}
        className="w-full text-left p-2 rounded transition-colors"
        style={{
          background: 'rgba(0, 102, 255, 0.05)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          color: '#1a1a2e'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 102, 255, 0.1)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 102, 255, 0.05)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span className="text-sm font-mono font-bold" style={{ color: '#0066ff' }}>{machine.serie}</span>
      </button>
    );
  }

  const canAssign = machine.estado === 'a-fazer' && (
    userPermissions?.canMoveAnyMachine || 
    (userPermissions?.canMoveMachineToOwnColumn && currentUser?.nome_tecnico)
  );
  
  const isCompleted = machine.estado?.includes('concluida');
  
  // CRITICAL FIX: Get customization from the techStyles (from database), NOT from currentUser
  const techCustomization = isCompleted && machine.tecnico && techStyles?.[machine.tecnico] ? 
    techStyles[machine.tecnico] : null;
  
  const cardStyle = {};
  let cardClassName = 'rounded-lg p-2 sm:p-3 shadow-sm border-2 transition-all cursor-pointer w-full';

  // Apply technician's customization to completed card (NOT prioritized ones)
  if (isCompleted && techCustomization && !machine.prioridade) {
    if (techCustomization.background) {
      cardStyle.background = techCustomization.background;
      cardClassName += ' border-transparent text-white hover:shadow-lg';
    } else if (techCustomization.backgroundColor) {
      cardStyle.backgroundColor = techCustomization.backgroundColor;
      cardClassName += ' border-transparent text-white hover:shadow-lg';
    } else {
      // Default FF4 style
      cardClassName += ' border-transparent hover:shadow-lg';
      cardStyle.background = 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(0, 212, 255, 0.05) 100%)';
      cardStyle.backdropFilter = 'blur(10px)';
      cardStyle.border = '1px solid rgba(0, 212, 255, 0.3)';
    }
  } else {
    // Default FF4 theme style
    cardClassName += ' border-transparent hover:shadow-lg';
    cardStyle.background = 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(0, 212, 255, 0.05) 100%)';
    cardStyle.backdropFilter = 'blur(10px)';
    cardStyle.border = '1px solid rgba(0, 212, 255, 0.3)';
    cardStyle.boxShadow = '0 4px 15px rgba(0, 102, 255, 0.15)';
  }
  
  const textColor = (isCompleted && techCustomization && !machine.prioridade) ? 'white' : '#1a1a2e';
  const iconBg = (isCompleted && techCustomization && !machine.prioridade) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 212, 255, 0.15)';
  const iconColor = (isCompleted && techCustomization && !machine.prioridade) ? 'white' : '#0066ff';
  
  return (
    <div 
      className={cardClassName}
      style={cardStyle}
      onClick={() => onOpenObservations(machine)}
    >
      {/* Compact single-line layout */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Type Icon */}
        <div className="p-1 rounded-full flex-shrink-0" style={{ background: iconBg }}>
          <TipoIcon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: iconColor }} />
        </div>
        
        {/* Serial Number - prominent */}
        <p className="text-sm sm:text-base font-mono font-bold flex-shrink-0 truncate max-w-[80px] sm:max-w-none" style={{ color: textColor }}>
          {machine.serie}
        </p>
        
        {/* Priority Icon */}
        {machine.prioridade && (
          <svg className="w-4 h-4 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--ff-red-accent)' }}>
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        
        {/* Badges - compact */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          {machine.recondicao?.bronze && (
            <span className="bg-amber-700 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              BRZ
            </span>
          )}
          {machine.recondicao?.prata && (
            <span className="bg-gray-400 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              PRT
            </span>
          )}
          {machine.observacoes && machine.observacoes.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ 
              background: 'rgba(0, 102, 255, 0.15)',
              color: '#0066ff'
            }}>
              {machine.observacoes.length}
            </span>
          )}
          {machine.tecnico && machine.estado?.includes('concluida') && (
            <span className="text-[10px] px-1.5 py-1 rounded-full font-semibold" style={{
              background: 'rgba(0, 212, 255, 0.2)',
              color: '#0066ff'
            }}>
              ✓
            </span>
          )}
          {canAssign && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssign(machine);
              }}
              className="p-1 rounded-full transition-colors"
              style={{
                background: 'var(--ff-blue-electric)',
                color: 'white'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ff-blue-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--ff-blue-electric)'}
              aria-label="Atribuir"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ObservationsModal = ({ isOpen, onClose, machine, onAddObservation, onToggleTask, onTogglePriority, onDelete, currentUser, userPermissions, onMarkComplete }) => {
  const [newObs, setNewObs] = useState('');
  const [numeroPedido, setNumeroPedido] = useState('');
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [isEditingTasks, setIsEditingTasks] = useState(false);
  const [editedTasks, setEditedTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [machinePedidos, setMachinePedidos] = useState([]);
  
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
    if (machine?.tarefas) {
      setEditedTasks([...machine.tarefas]);
    } else {
      setEditedTasks([]);
    }
    setIsEditingTasks(false); 
    setNewTaskText('');
  }, [machine, isOpen]);

  // Load pedidos for this machine
  React.useEffect(() => {
    const loadMachinePedidos = async () => {
      if (machine?.id) {
        try {
          const allPedidos = await base44.entities.Pedido.list();
          const filtered = allPedidos.filter(p => p.maquinaId === machine.id);
          setMachinePedidos(filtered);
        } catch (error) {
          console.error('Erro ao carregar pedidos:', error);
        }
      }
    };
    
    if (isOpen) {
      loadMachinePedidos();
    }
  }, [machine, isOpen]);
  
  if (!isOpen || !machine) return null;

  const handleSubmit = () => {
    if (newObs.trim()) {
      onAddObservation(machine.id, newObs);
      setNewObs('');
    }
  };

  const handleMarkComplete = async () => {
    if (window.confirm('Tem certeza que deseja marcar esta máquina como concluída?')) {
      await onMarkComplete(machine.id);
      onClose();
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
        maquinaId: machine.id,
        maquinaSerie: machine.serie,
        maquinaModelo: machine.modelo,
        tecnico: currentUser?.nome_tecnico || currentUser?.full_name,
        status: 'pendente'
      });

      setNumeroPedido('');
      setShowPedidoForm(false);
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
    
    if (window.confirm(`Deseja mover a máquina ${machine.serie} de volta para "A Fazer"?`)) {
      try {
        await FrotaACP.update(machine.id, {
          estado: 'a-fazer',
          tecnico: null,
          dataConclusao: null
        });
        
        onClose();
        window.location.reload();
      } catch (error) {
        console.error("Erro ao mover máquina:", error);
        alert("Erro ao mover máquina. Tente novamente.");
      }
    }
  };

  const handleSaveTasks = async () => {
    setIsUpdating(true);
    try {
      await FrotaACP.update(machine.id, {
        tarefas: editedTasks
      });
      
      setIsEditingTasks(false);
      onClose();
      window.location.reload();
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

  // FIXED: Simplified task toggle - remove all restrictions for responsible tech
  const handleToggleTaskLocal = async (taskIndex) => {
    if (isUpdating) return;
    
    // Check if user can edit this machine's tasks
    const isResponsibleTech = currentUser?.nome_tecnico && machine.tecnico === currentUser.nome_tecnico;
    const isAdmin = userPermissions?.canMoveAnyMachine;
    const canEdit = (isAdmin || isResponsibleTech) && machine.estado?.includes('em-preparacao');
    
    if (!canEdit) {
      return;
    }
    
    setIsUpdating(true);
    try {
      await onToggleTask(machine.id, taskIndex);
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      alert("Erro ao atualizar tarefa. Tente novamente.");
    }
    setIsUpdating(false);
  };

  const tarefasConcluidas = machine.tarefas?.filter(t => t.concluida).length || 0;
  const totalTarefas = machine.tarefas?.length || 0;
  
  const TipoIcon = TIPO_ICONS[machine.tipo]?.icon || Package;
  const tipoColor = TIPO_ICONS[machine.tipo]?.color || 'text-gray-600';

  // CRITICAL: Check if current user is the responsible technician or admin
  const isResponsibleTech = currentUser?.nome_tecnico && machine.tecnico === currentUser.nome_tecnico;
  const isAdmin = userPermissions?.canMoveAnyMachine;
  const canEditThisMachine = isAdmin || isResponsibleTech;

  const canEditTasks = machine.estado?.includes('em-preparacao') && canEditThisMachine;
  const canAdminEditTasks = userPermissions?.canMoveAnyMachine;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 rounded-xl shadow-2xl z-50 w-auto sm:w-[95%] sm:max-w-5xl h-auto sm:max-h-[95vh] flex flex-col overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(232, 238, 242, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          aria-label="Fechar"
          style={{
            background: 'rgba(0, 212, 255, 0.1)',
            color: '#0066ff'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 sm:p-6 flex-shrink-0 overflow-y-auto max-h-[40vh]" style={{ borderBottom: '1px solid rgba(0, 212, 255, 0.2)' }}>
          <div className="pr-8">
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <TipoIcon className={`w-5 h-5 sm:w-6 sm:h-6`} style={{ color: '#0066ff' }} />
                <h2 className="text-xl sm:text-3xl font-mono font-bold" style={{ color: '#1a1a2e' }}>{machine.serie}</h2>
                {machine.prioridade && (
                  <span className="text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-bold" style={{ background: 'var(--ff-red-accent)' }}>
                    PRIORITÁRIA
                  </span>
                )}
                {machine.recondicao?.bronze && (
                  <span className="bg-amber-700 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-bold">
                    BRZ
                  </span>
                )}
                {machine.recondicao?.prata && (
                  <span className="bg-gray-400 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-bold">
                    PRT
                  </span>
                )}
              </div>
              <p className="text-base sm:text-lg" style={{ color: '#666' }}>{machine.modelo}</p>
              {machine.ano && <p className="text-xs sm:text-sm" style={{ color: '#999' }}>Ano: {machine.ano}</p>}
              {machine.tecnico && (
                <p className="text-xs sm:text-sm mt-2" style={{ color: '#666' }}>
                  Responsável: <span className="font-semibold capitalize">{machine.tecnico}</span>
                </p>
              )}
            </div>
              
            <div className="flex gap-2 flex-wrap">
              {userPermissions?.canMoveAnyMachine && machine.estado !== 'a-fazer' && (
                <button
                  onClick={handleMoveToAFazer}
                  className="px-3 sm:px-4 py-2 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
                  style={{ background: 'rgba(102, 102, 102, 0.9)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 102, 102, 1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(102, 102, 102, 0.9)'}
                  title="Mover para A Fazer"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="hidden sm:inline">Mover para A Fazer</span>
                  <span className="sm:hidden">A Fazer</span>
                </button>
              )}

              {userPermissions?.canSetPriority && machine.estado === 'a-fazer' && (
                <button
                  onClick={() => onTogglePriority(machine.id, !machine.prioridade)}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors text-white`}
                  style={{
                    background: machine.prioridade ? 'rgba(200, 200, 200, 0.9)' : 'var(--ff-red-accent)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = machine.prioridade ? 'rgba(200, 200, 200, 1)' : 'var(--ff-orange-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = machine.prioridade ? 'rgba(200, 200, 200, 0.9)' : 'var(--ff-red-accent)';
                  }}
                >
                  {machine.prioridade ? 'Remover Prioridade' : 'Marcar Prioritária'}
                </button>
              )}
              
              {userPermissions?.canDeleteMachine && (
                <button
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja apagar a máquina ${machine.serie}?`)) {
                      onDelete(machine.id);
                    }
                  }}
                  className="px-3 sm:px-4 py-2 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors"
                  style={{ background: 'var(--ff-red-accent)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Apagar
                </button>
              )}

              {/* CRITICAL: Only show "Mark Complete" button if user is responsible tech or admin */}
              {machine.estado?.includes('em-preparacao') && !machine.estado?.includes('concluida') && canEditThisMachine && (
                <button
                  onClick={handleMarkComplete}
                  className="px-3 sm:px-4 py-2 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Marcar como Concluída</span>
                  <span className="sm:hidden">Concluir</span>
                </button>
              )}

              {/* CRITICAL: Only show "Create Order" button if user is responsible tech or admin */}
              {machine.estado?.includes('em-preparacao') && canEditThisMachine && (
                <button
                  onClick={() => setShowPedidoForm(!showPedidoForm)}
                  className="px-3 sm:px-4 py-2 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors"
                  style={{ background: 'var(--ff-blue-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ff-blue-electric)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--ff-blue-primary)'}
                >
                  {showPedidoForm ? 'Cancelar' : 'Criar Pedido'}
                </button>
              )}
            </div>

            {/* Show permission message if viewing another tech's machine */}
            {machine.estado?.includes('em-preparacao') && !canEditThisMachine && (
              <div className="mt-3 p-2 rounded-lg" style={{ 
                background: 'rgba(255, 107, 53, 0.1)',
                border: '1px solid rgba(255, 107, 53, 0.3)'
              }}>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--ff-orange-accent)' }}>
                  ⓘ Apenas visualização - Esta máquina está atribuída a outro técnico
                </p>
              </div>
            )}

            {showPedidoForm && canEditThisMachine && (
              <div className="mt-4 p-3 sm:p-4 rounded-lg border" style={{
                background: 'rgba(0, 102, 255, 0.05)',
                borderColor: 'rgba(0, 212, 255, 0.3)'
              }}>
                <h4 className="font-semibold mb-3 text-sm sm:text-base" style={{ color: '#0066ff' }}>Novo Pedido</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={numeroPedido}
                    onChange={(e) => setNumeroPedido(e.target.value)}
                    placeholder="Número do pedido..."
                    className="flex-1 px-3 py-2 text-sm sm:text-base rounded-lg outline-none transition-all"
                    style={{
                      background: 'white',
                      border: '1px solid rgba(0, 212, 255, 0.3)',
                      color: '#1a1a2e'
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitPedido()}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--ff-blue-electric)';
                      e.target.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    onClick={handleSubmitPedido}
                    className="px-4 py-2 text-white rounded-lg font-semibold text-sm sm:text-base whitespace-nowrap transition-all"
                    style={{ background: 'var(--ff-blue-primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ff-blue-electric)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--ff-blue-primary)'}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {/* Pedidos for this machine */}
            {machinePedidos.length > 0 && (
              <div className="mt-4 p-3 rounded-lg border" style={{
                background: 'rgba(0, 212, 255, 0.05)',
                borderColor: 'rgba(0, 212, 255, 0.3)'
              }}>
                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2" style={{ color: '#0066ff' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Pedidos desta Máquina
                </h4>
                <div className="space-y-2">
                  {machinePedidos.map(pedido => (
                    <div 
                      key={pedido.id}
                      className="flex items-center justify-between p-2 rounded"
                      style={{
                        background: pedido.status === 'concluido' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 107, 53, 0.1)',
                        border: `1px solid ${pedido.status === 'concluido' ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 107, 53, 0.3)'}`
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm" style={{ 
                          color: pedido.status === 'concluido' ? '#00d4ff' : 'var(--ff-orange-accent)' 
                        }}>
                          {pedido.numeroPedido}
                        </span>
                        {pedido.status === 'concluido' && (
                          <CheckCircle2 className="w-4 h-4" style={{ color: '#00d4ff' }} />
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{
                        background: pedido.status === 'concluido' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 107, 53, 0.2)',
                        color: pedido.status === 'concluido' ? '#0066ff' : 'var(--ff-orange-accent)'
                      }}>
                        {pedido.status === 'concluido' ? 'CONFIRMADO' : 'PENDENTE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {machine.estado?.includes('concluida') && machine.dataConclusao && (
              <div className="mt-4 text-white px-3 sm:px-4 py-2 rounded-lg inline-block" style={{
                background: 'linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%)'
              }}>
                <p className="text-xs font-semibold">CONCLUÍDA</p>
                <p className="text-xs">{new Date(machine.dataConclusao).toLocaleDateString('pt-PT')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Tasks Section */}
          {((machine.tarefas && machine.tarefas.length > 0) || canAdminEditTasks) && (
            <div>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-bold" style={{ color: '#1a1a2e' }}>Tarefas</h3>
                <div className="flex items-center gap-2">
                  {!isEditingTasks && (
                    <span className="text-xs sm:text-sm" style={{ color: '#666' }}>{tarefasConcluidas}/{totalTarefas} concluídas</span>
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
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors text-white`}
                      style={{
                        background: isEditingTasks ? 'var(--ff-blue-primary)' : 'rgba(0, 212, 255, 0.2)'
                      }}
                    >
                      {isEditingTasks ? 'Guardar' : 'Editar'}
                    </button>
                  )}
                </div>
              </div>

              {isEditingTasks ? (
                <div className="space-y-3">
                  {editedTasks.map((tarefa, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 sm:p-3 rounded-lg border" style={{
                      background: 'rgba(0, 102, 255, 0.05)',
                      borderColor: 'rgba(0, 212, 255, 0.2)'
                    }}>
                      <input
                        type="checkbox"
                        checked={tarefa.concluida}
                        onChange={() => handleToggleEditedTask(idx)}
                        className="mt-0.5 sm:mt-1 w-4 h-4 rounded"
                        style={{ accentColor: 'var(--ff-blue-primary)' }}
                      />
                      <span className={`flex-1 text-sm sm:text-base ${tarefa.concluida ? 'line-through' : ''}`} style={{ color: tarefa.concluida ? '#999' : '#1a1a2e' }}>
                        {tarefa.texto}
                      </span>
                      <button
                        onClick={() => handleRemoveTask(idx)}
                        className="p-1 transition-colors rounded"
                        style={{ color: 'var(--ff-red-accent)' }}
                        title="Remover tarefa"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Predefined tasks section */}
                  {TAREFAS_PREDEFINIDAS.length > 0 && (
                    <div className="space-y-2 mb-3 p-3 rounded-lg border" style={{
                      background: 'rgba(0, 102, 255, 0.05)',
                      borderColor: 'rgba(0, 212, 255, 0.2)'
                    }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#0066ff' }}>Tarefas Pré-definidas:</p>
                      {TAREFAS_PREDEFINIDAS.map((predefTarefa, idx) => {
                        const isChecked = editedTasks.some(t => t.texto === predefTarefa);
                        return (
                          <div key={`predef-${idx}`} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  // Remove it from editedTasks
                                  setEditedTasks(prev => prev.filter(t => t.texto !== predefTarefa));
                                } else {
                                  // Add it to editedTasks (as not concluded)
                                  setEditedTasks(prev => [...prev, { texto: predefTarefa, concluida: false }]);
                                }
                              }}
                              className="w-4 h-4 rounded"
                              style={{ accentColor: 'var(--ff-blue-primary)' }}
                            />
                            <label className="text-sm" style={{ color: '#666' }}>
                              {predefTarefa}
                            </label>
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
                      className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                      style={{
                        background: 'white',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                        color: '#1a1a2e'
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNewTask()}
                    />
                    <button
                      onClick={handleAddNewTask}
                      className="px-4 py-2 text-white rounded-lg font-semibold text-sm"
                      style={{ background: 'var(--ff-blue-primary)' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {machine.tarefas && machine.tarefas.map((tarefa, idx) => {
                    // Check if current user can toggle this specific task
                    const isResponsibleTech = currentUser?.nome_tecnico && machine.tecnico === currentUser.nome_tecnico;
                    const isAdmin = userPermissions?.canMoveAnyMachine;
                    const canToggleThisTask = (isAdmin || isResponsibleTech) && machine.estado?.includes('em-preparacao');
                    
                    return (
                      <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border" style={{
                        background: 'rgba(0, 102, 255, 0.05)',
                        borderColor: 'rgba(0, 212, 255, 0.2)'
                      }}>
                        <input
                          type="checkbox"
                          checked={tarefa.concluida}
                          onChange={() => canToggleThisTask && handleToggleTaskLocal(idx)}
                          disabled={!canToggleThisTask || isUpdating}
                          className="mt-0.5 sm:mt-1 w-4 h-4 rounded cursor-pointer disabled:cursor-not-allowed"
                          style={{ accentColor: 'var(--ff-blue-primary)' }}
                        />
                        <span className={`flex-1 text-sm sm:text-base ${tarefa.concluida ? 'line-through' : ''}`} style={{ color: tarefa.concluida ? '#999' : '#1a1a2e' }}>
                          {tarefa.texto}
                        </span>
                      </div>
                    );
                  })}
                  {!canEditTasks && !canAdminEditTasks && (
                    <p className="text-xs mt-2 italic" style={{ color: '#999' }}>
                      As tarefas só podem ser marcadas em preparação pelo técnico responsável (ou admin).
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#1a1a2e' }}>Observações</h3>
            {machine.observacoes && machine.observacoes.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {machine.observacoes.map((obs, idx) => (
                  <div key={idx} className="rounded-lg p-3 sm:p-4 border" style={{
                    background: 'rgba(0, 102, 255, 0.05)',
                    borderColor: 'rgba(0, 212, 255, 0.2)'
                  }}>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-semibold text-sm sm:text-base" style={{ color: '#1a1a2e' }}>{obs.autor}</span>
                      <span className="text-xs whitespace-nowrap" style={{ color: '#999' }}>
                        {new Date(obs.data).toLocaleString('pt-PT', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base" style={{ color: '#666' }}>{obs.texto}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm sm:text-base" style={{ color: '#999' }}>Nenhuma observação ainda</p>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-6 flex-shrink-0" style={{
          borderTop: '1px solid rgba(0, 212, 255, 0.2)',
          background: 'rgba(0, 102, 255, 0.03)'
        }}>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              value={newObs}
              onChange={(e) => setNewObs(e.target.value)}
              placeholder="Adicionar observação..."
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg outline-none transition-all"
              style={{
                background: 'white',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#1a1a2e'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--ff-blue-electric)';
                e.target.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleSubmit}
              className="px-4 sm:px-6 py-2 text-white rounded-lg font-semibold text-sm sm:text-base whitespace-nowrap transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--ff-orange-accent) 0%, var(--ff-red-accent) 100%)',
                boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.6)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)'}
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const CreateMachineModal = ({ isOpen, onClose, onSubmit, prefillData }) => {
  const [formData, setFormData] = useState({ 
    modelo: '', 
    serie: '', 
    ano: '', 
    tipo: 'nova', 
    tarefas: [],
    recondicao: { bronze: false, prata: false },
    prioridade: false
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
        prioridade: prefillData.prioridade || false
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
        prioridade: false
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
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl z-50 w-[90%] max-w-md p-6 max-h-[90vh] overflow-y-auto" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(232, 238, 242, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)'
      }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a1a2e' }}>Nova Máquina</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#666' }}>Modelo</label>
            <input
              type="text"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg outline-none transition-all"
              style={{
                background: 'white',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#1a1a2e'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--ff-blue-electric)';
                e.target.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#666' }}>Número de Série</label>
            <input
              type="text"
              value={formData.serie}
              onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg outline-none transition-all"
              style={{
                background: 'white',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#1a1a2e'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--ff-blue-electric)';
                e.target.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#666' }}>Ano</label>
            <input
              type="number"
              value={formData.ano}
              onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
              className="w-full px-4 py-2 rounded-lg outline-none transition-all"
              style={{
                background: 'white',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#1a1a2e'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--ff-blue-electric)';
                e.target.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#666' }}>Tipo de Máquina</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TIPO_ICONS).map(([tipo, { icon: Icon }]) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo })}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2`}
                  style={formData.tipo === tipo ? {
                    background: 'linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%)',
                    borderColor: 'transparent',
                    color: 'white'
                  } : {
                    background: 'rgba(0, 102, 255, 0.05)',
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    color: '#666'
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium capitalize">{tipo}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#666' }}>Recondicionamento</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recon-bronze"
                  checked={formData.recondicao?.bronze || false}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    recondicao: { ...formData.recondicao, bronze: e.target.checked }
                  })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#d97706' }}
                />
                <label htmlFor="recon-bronze" className="text-sm flex items-center gap-2" style={{ color: '#666' }}>
                  <span className="bg-amber-700 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    BRZ
                  </span>
                  Recon Bronze
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recon-prata"
                  checked={formData.recondicao?.prata || false}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    recondicao: { ...formData.recondicao, prata: e.target.checked }
                  })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#9ca3af' }}
                />
                <label htmlFor="recon-prata" className="text-sm flex items-center gap-2" style={{ color: '#666' }}>
                  <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    PRT
                  </span>
                  Recon Prata
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#666' }}>Prioridade</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="prioridade"
                checked={formData.prioridade || false}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--ff-red-accent)' }}
              />
              <label htmlFor="prioridade" className="text-sm flex items-center gap-2" style={{ color: '#666' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--ff-red-accent)' }}>
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Marcar como Prioritária
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: '#666' }}>Tarefas a Realizar</label>
            <div className="space-y-2 mb-3">
              {TAREFAS_PREDEFINIDAS.map(tarefa => (
                <div key={tarefa} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`tarefa-${tarefa}`}
                    checked={!!selectedTarefas[tarefa]}
                    onChange={() => handleTarefaToggle(tarefa)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--ff-blue-primary)' }}
                  />
                  <label htmlFor={`tarefa-${tarefa}`} className="text-sm" style={{ color: '#666' }}>
                    {tarefa}
                  </label>
                </div>
              ))}
            </div>
            
            {customTarefas.length > 0 && (
              <div className="space-y-2 mb-3 p-3 rounded-lg border" style={{
                background: 'rgba(0, 102, 255, 0.05)',
                borderColor: 'rgba(0, 212, 255, 0.2)'
              }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#0066ff' }}>Tarefas Personalizadas:</p>
                {customTarefas.map((tarefa, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded" style={{ background: 'white' }}>
                    <span className="text-sm" style={{ color: '#666' }}>{tarefa}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomTarefa(idx)}
                      className="text-xs font-semibold transition-colors"
                      style={{ color: 'var(--ff-red-accent)' }}
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
                className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                style={{
                  background: 'white',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  color: '#1a1a2e'
                }}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTarefa())}
              />
              <button
                type="button"
                onClick={handleAddCustomTarefa}
                className="px-4 py-2 text-white rounded-lg text-sm font-semibold"
                style={{ background: 'var(--ff-blue-primary)' }}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg transition-colors"
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                color: '#666',
                border: '1px solid rgba(0, 212, 255, 0.2)'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white rounded-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--ff-orange-accent) 0%, var(--ff-red-accent) 100%)',
                boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.6)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)'}
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

const TechnicianCompletedSection = ({ machines, techId, onOpenMachine, techStyles }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg border transition-colors"
        style={{
          background: 'rgba(0, 212, 255, 0.1)',
          borderColor: 'rgba(0, 212, 255, 0.3)',
          color: '#0066ff'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" style={{ color: '#00d4ff' }} />
          <span className="text-sm font-semibold" style={{ color: '#0066ff' }}>
            Concluídas: {machines.length}
          </span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: '#00d4ff' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#00d4ff' }} />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 max-h-60 overflow-y-auto rounded-lg border"
            style={{
              background: 'rgba(255, 255, 255, 0.5)',
              borderColor: 'rgba(0, 212, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {machines.map(machine => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onOpenObservations={onOpenMachine}
                isCompact={true}
                techStyles={techStyles}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Assign Modal Component - With Custom Colors
const AssignModal = ({ isOpen, onClose, machine, onAssign, techStyles }) => {
  if (!isOpen || !machine) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[70] w-[90%] max-w-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Atribuir Máquina {machine.serie}
        </h3>
        <p className="text-sm text-gray-600 mb-6">Selecione o técnico:</p>
        
        <div className="grid grid-cols-2 gap-3">
          {TECHNICIANS.map(tech => {
            const customStyle = techStyles?.[tech.id] || {};
            
            // Default FF4 style if no customization
            const defaultStyle = {
              background: 'linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%)',
              color: 'white'
            };
            
            const buttonStyle = (customStyle.background || customStyle.backgroundColor) ? customStyle : defaultStyle;
            
            return (
              <button
                key={tech.id}
                onClick={() => {
                  onAssign(tech.id);
                  onClose();
                }}
                className={`p-4 rounded-lg border-2 border-transparent transition-all hover:shadow-md text-white font-semibold`}
                style={buttonStyle}
              >
                <UserIcon className="w-6 h-6 mx-auto mb-2" />
                {tech.name}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Cancelar
        </button>
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
  const [techStyles, setTechStyles] = useState({});
  const [adminStyles, setAdminStyles] = useState({});
  const [techAvatars, setTechAvatars] = useState({});
  const [stylesLoaded, setStylesLoaded] = useState(false);

  const userPermissions = usePermissions(currentUser?.perfil, currentUser?.nome_tecnico);

  // OPTIMIZATION: Load all styles at once
  const loadAllStyles = useCallback(async () => {
    try {
      // Load all technician customizations in one query
      const allTechCustomizations = await base44.entities.TechnicianCustomization.list();
      
      const styles = {};
      const avatars = {};
      
      TECHNICIANS.forEach(tech => {
        const custom = allTechCustomizations.find(c => c.nome_tecnico === tech.id);
        if (custom) {
          if (custom.gradient) {
            styles[tech.id] = { background: custom.gradient };
          } else if (custom.cor) {
            styles[tech.id] = { backgroundColor: custom.cor };
          }
          if (custom.avatar) {
            avatars[tech.id] = custom.avatar;
          }
        }
      });
      
      setTechStyles(styles);
      setTechAvatars(avatars);

      // Load admin styles (only if user is admin)
      if (currentUser?.perfil === 'admin') {
        const allUsers = await base44.entities.User.list();
        const adminUsers = allUsers
          .filter(u => u.perfil === 'admin' && u.personalizacao?.areas)
          .sort((a, b) => {
            const dateA = a.ultimo_acesso ? new Date(a.ultimo_acesso).getTime() : 0;
            const dateB = b.ultimo_acesso ? new Date(b.ultimo_acesso).getTime() : 0;
            return dateB - dateA;
          });
        
        const adminS = {
          aFazer: null,
          concluida: null,
          pedidos: null
        };

        if (adminUsers.length > 0) {
          const mostRecentAdmin = adminUsers[0];
          if (mostRecentAdmin.personalizacao?.areas) {
            ['aFazer', 'concluida', 'pedidos'].forEach(area => {
              if (mostRecentAdmin.personalizacao.areas[area]) {
                const areaCustom = mostRecentAdmin.personalizacao.areas[area];
                if (areaCustom.gradient) {
                  adminS[area] = { background: areaCustom.gradient };
                } else if (areaCustom.cor) {
                  adminS[area] = { backgroundColor: areaCustom.cor };
                }
              }
            });
          }
        }
        
        setAdminStyles(adminS);
      }
      
      setStylesLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar estilos:", error);
      setStylesLoaded(true);
    }
  }, [currentUser?.perfil]);

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

  // Load machines only once on mount
  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  // Load styles when user is loaded
  useEffect(() => {
    if (currentUser) {
      loadAllStyles();
    }
  }, [currentUser, loadAllStyles]);

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
      await FrotaACP.update(machineId, {
        observacoes: [...(machine.observacoes || []), newObs]
      });
      await loadMachines();
    } catch (error) {
      console.error("Erro ao adicionar observação:", error);
    }
  };

  const handleToggleTask = useCallback(async (machineId, taskIndex) => {
    try {
      const machine = machines.find(m => m.id === machineId);
      const updatedTarefas = [...(machine.tarefas || [])];
      updatedTarefas[taskIndex].concluida = !updatedTarefas[taskIndex].concluida;
      
      await FrotaACP.update(machineId, {
        tarefas: updatedTarefas
      });
      
      // Update local state immediately
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
      await FrotaACP.update(machineId, {
        prioridade: newPriorityValue
      });
      await loadMachines();
    } catch (error) {
      console.error("Erro ao atualizar prioridade:", error);
    }
  };

  const handleDeleteMachine = async (machineId) => {
    // Admin can delete any machine, including completed ones
    if (!userPermissions?.canDeleteMachine) {
      alert("Você não tem permissão para apagar máquinas.");
      return;
    }
    
    try {
      await FrotaACP.delete(machineId);
      await loadMachines();
      setShowObsModal(false);
      setSelectedMachine(null);
    } catch (error) {
      console.error("Erro ao apagar máquina:", error);
      alert("Erro ao apagar máquina. Tente novamente.");
    }
  };

  const handleAssignMachine = async (machine) => {
    if (!currentUser) return;
    
    if (userPermissions?.canMoveAnyMachine) {
      // Admin: show modal to select technician
      setMachineToAssign(machine);
      setShowAssignModal(true);
    } else if (userPermissions?.canMoveMachineToOwnColumn && currentUser?.nome_tecnico) {
      // Technician: assign to self
      try {
        await FrotaACP.update(machine.id, {
          estado: `em-preparacao-${currentUser.nome_tecnico}`,
          tecnico: currentUser.nome_tecnico
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
        tecnico: techId
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
      await FrotaACP.update(machineId, {
        estado: `concluida-${machine.tecnico}`,
        dataConclusao: new Date().toISOString()
      });
      await loadMachines();
    } catch (error) {
      console.error("Erro ao marcar como concluída:", error);
      alert("Erro ao marcar como concluída. Tente novamente.");
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    let machineId = draggableId;
    let targetState = destination.droppableId; 

    // If draggableId comes from 'concluida-geral', extract the real machine ID
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

    // Determine new technician and new status
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
    } else if (targetState.startsWith('concluida-')) {
      newTechnician = targetState.replace('concluida-', '');
      newEstado = `concluida-${newTechnician}`;
      newConclusaoDate = new Date().toISOString();
    } else {
      console.error("Unknown droppableId:", targetState);
      return;
    }

    // Permission checks - ADMINS CAN MOVE ANYTHING, CHECK FIRST
    if (userPermissions?.canMoveAnyMachine) {
      // Admin can move anything - skip all permission checks
      try {
        updateData.estado = newEstado;
        updateData.tecnico = newTechnician;
        updateData.dataConclusao = newConclusaoDate;

        await FrotaACP.update(machineId, updateData);
        await loadMachines();
      } catch (error) {
        console.error("Erro ao mover máquina:", error);
        alert("Erro ao mover máquina. Tente novamente.");
      }
      return; // Exit if admin
    }

    // Technician permission checks
    if (targetState === 'a-fazer') {
      // A technician can only move their *own* machine from 'em-preparacao-{techId}' back to 'a-fazer'
      if (!(machineBeingMoved.tecnico === currentUser?.nome_tecnico && machineBeingMoved.estado?.startsWith('em-preparacao-'))) {
        alert("Você não tem permissão para mover esta máquina para 'A Fazer'.");
        return;
      }
    } else if (targetState.startsWith('em-preparacao-')) {
      const destTechId = targetState.replace('em-preparacao-', '');
      if (!userPermissions.canMoveMachineTo(destTechId, targetState)) {
        alert("Você não tem permissão para mover esta máquina para a coluna de 'Em Preparação' deste técnico.");
        return;
      }
    } else if (targetState.startsWith('concluida-')) {
      const destTechId = targetState.replace('concluida-', '');
      if (!userPermissions.canMoveMachineTo(destTechId, targetState)) {
        alert("Você não tem permissão para mover esta máquina para a coluna de 'Concluídas' deste técnico.");
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

      await FrotaACP.update(machineId, updateData);
      await loadMachines();
    } catch (error) {
      console.error("Erro ao mover máquina:", error);
      alert("Erro ao mover máquina. Tente novamente.");
    }
  };

  // OPTIMIZATION: Memoize filtered machines
  const filteredMachines = useMemo(() => {
    if (!searchQuery) return [];
    return machines.filter(m =>
      m.modelo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.serie?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [machines, searchQuery]);

  // OPTIMIZATION: Memoize machine lists
  const aFazerMachines = useMemo(() => {
    const filtered = machines.filter(m => m.estado === 'a-fazer');
    return filtered.sort((a, b) => {
      if (a.prioridade && !b.prioridade) return -1;
      if (!a.prioridade && b.prioridade) return 1;
      return 0;
    });
  }, [machines]);

  const allConcluidaMachines = useMemo(() => 
    machines.filter(m => m.estado?.includes('concluida')),
    [machines]
  );

  const aFazerStyle = adminStyles.aFazer || {};
  const concluidaStyle = adminStyles.concluida || {};

  // Don't render until styles are loaded
  if (!stylesLoaded && currentUser) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 mx-auto mb-4" style={{ borderColor: '#00d4ff' }}></div>
          <p className="text-sm" style={{ color: '#0066ff' }}>A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Header - FF4 Styled */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          {/* Search with FF4 style */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--ff-blue-electric)' }} />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base rounded-lg outline-none transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#1a1a2e',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--ff-blue-electric)';
                e.target.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Compact Pedidos Panel */}
          {userPermissions?.canDeleteMachine && (
            <PedidosPanel 
              userPermissions={userPermissions} 
              adminStyle={{ pedidos: adminStyles.pedidos || {} }}
              isCompact={true}
            />
          )}
        </div>

        {/* Action Buttons - FF4 Styled */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin Customization Button */}
          {userPermissions?.canDeleteMachine && (
            <button
              onClick={() => setShowCustomization(true)}
              className="px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-semibold"
              style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: 'var(--ff-blue-electric)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Personalizar</span>
            </button>
          )}

          {userPermissions?.canCreateMachine && (
            <>
              <button
                onClick={() => setShowImageModal(true)}
                className="px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all"
                style={{
                  background: 'linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(0, 212, 255, 0.4)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.4)'}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Criar com IA</span>
              </button>
              <button
                onClick={() => { setPrefillData(null); setShowCreateModal(true); }}
                className="px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all"
                style={{
                  background: 'linear-gradient(135deg, var(--ff-orange-accent) 0%, var(--ff-red-accent) 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)'}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nova Máquina</span>
              </button>
            </>
          )}
        </div>
      </div>

      {searchQuery ? (
        <div className="space-y-2">
          {filteredMachines.map(machine => (
            <MachineCard
              key={machine.id}
              machine={machine}
              onOpenObservations={(m) => { setSelectedMachine(m); setShowObsModal(true); }}
              onAssign={handleAssignMachine}
              userPermissions={userPermissions}
              currentUser={currentUser}
              techStyles={techStyles}
            />
          ))}
        </div>
      ) : (
        <>
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Top Section - A Fazer and Concluída - FF4 Styled */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div 
                className="rounded-xl p-4 sm:p-6 relative overflow-hidden border"
                style={aFazerStyle.background || aFazerStyle.backgroundColor ? { 
                  ...aFazerStyle, 
                  borderColor: 'rgba(0, 212, 255, 0.3)',
                  boxShadow: '0 0 30px rgba(0, 212, 255, 0.2), inset 0 0 50px rgba(0, 212, 255, 0.05)'
                } : { 
                  background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(0, 212, 255, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderColor: 'rgba(0, 212, 255, 0.3)',
                  boxShadow: '0 0 30px rgba(0, 212, 255, 0.2), inset 0 0 50px rgba(0, 212, 255, 0.05)'
                }}
              >
                {/* Retro grid pattern overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.5) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}></div>
                
                {/* Logo SYNAPSE em baixo relevo - MAIOR */}
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c7a2cb53713f70561ad65/9bd54dd17_syn.png"
                  alt="SYNAPSE"
                  className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-32 h-32 sm:w-48 sm:h-48 opacity-[0.08] pointer-events-none"
                />
                
                <h3 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 relative z-10" style={{ 
                  color: 'var(--ff-blue-primary)',
                  textShadow: '0 0 10px rgba(0, 212, 255, 0.6)'
                }}>
                  <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
                  A Fazer
                  <span className="ml-auto px-3 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base font-bold" style={{
                    background: 'rgba(0, 212, 255, 0.2)',
                    border: '1px solid rgba(0, 212, 255, 0.5)',
                    color: '#0066ff',
                    boxShadow: '0 0 15px rgba(0, 212, 255, 0.4)'
                  }}>
                    {aFazerMachines.length}
                  </span>
                </h3>
                
                <Droppable droppableId="a-fazer">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 sm:space-y-3 max-h-[350px] sm:max-h-[450px] overflow-y-auto relative z-10"
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
                              style={{
                                ...provided.draggableProps.style,
                              }}
                            >
                              <MachineCard
                                machine={machine}
                                onOpenObservations={(m) => { setSelectedMachine(m); setShowObsModal(true); }}
                                onAssign={handleAssignMachine}
                                userPermissions={userPermissions}
                                currentUser={currentUser}
                                techStyles={techStyles}
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

              <div 
                className="rounded-xl p-4 sm:p-6 relative overflow-hidden border"
                style={concluidaStyle.background || concluidaStyle.backgroundColor ? { 
                  ...concluidaStyle,
                  borderColor: 'rgba(0, 212, 255, 0.4)',
                  boxShadow: '0 0 30px rgba(0, 212, 255, 0.25)'
                } : { 
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(0, 102, 255, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderColor: 'rgba(0, 212, 255, 0.4)',
                  boxShadow: '0 0 30px rgba(0, 212, 255, 0.25)'
                }}
              >
                {/* Retro grid pattern overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.5) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}></div>
                
                {/* Logo SYNAPSE em baixo relevo - MAIOR */}
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c7a2cb53713f70561ad65/9bd54dd17_syn.png"
                  alt="SYNAPSE"
                  className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-32 h-32 sm:w-48 sm:h-48 opacity-[0.08] pointer-events-none"
                />
                
                <h3 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 relative z-10" style={{ 
                  color: '#00d4ff',
                  textShadow: '0 0 10px rgba(0, 212, 255, 0.8)'
                }}>
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  Concluída
                  <span className="ml-auto px-3 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base font-bold" style={{
                    background: 'rgba(0, 212, 255, 0.25)',
                    border: '1px solid rgba(0, 212, 255, 0.6)',
                    color: '#0066ff',
                    boxShadow: '0 0 15px rgba(0, 212, 255, 0.4)'
                  }}>
                    {allConcluidaMachines.length}
                  </span>
                </h3>
                
                <Droppable droppableId="concluida-geral">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 sm:space-y-3 max-h-[350px] sm:max-h-[450px] overflow-y-auto relative z-10"
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
                              style={{
                                ...provided.draggableProps.style,
                              }}
                            >
                              <MachineCard
                                machine={machine}
                                onOpenObservations={(m) => { setSelectedMachine(m); setShowObsModal(true); }}
                                userPermissions={userPermissions}
                                currentUser={currentUser}
                                techStyles={techStyles}
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
            </div>

            {/* Technician Columns - With FF4 Default Theme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {TECHNICIANS.map(tech => {
                const emPreparacao = machines.filter(m => m.estado === `em-preparacao-${tech.id}`);
                const concluidas = machines.filter(m => m.estado === `concluida-${tech.id}`);
                const customStyle = techStyles[tech.id] || {};
                const customAvatar = techAvatars[tech.id];
                const isCurrentUserTech = currentUser?.nome_tecnico === tech.id;
                
                // Default FF4 style if no customization
                const defaultStyle = {
                  background: 'linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%)',
                  color: 'white',
                  boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)'
                };
                
                const headerStyle = (customStyle.background || customStyle.backgroundColor) ? customStyle : defaultStyle;
                
                return (
                  <div key={tech.id} className="flex flex-col rounded-lg p-3 sm:p-4" style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    boxShadow: '0 4px 15px rgba(0, 102, 255, 0.1)'
                  }}>
                    <div 
                      className={`font-bold text-white mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg flex items-center gap-2 text-sm sm:text-base`}
                      style={headerStyle}
                    >
                      {customAvatar ? (
                        <img 
                          src={customAvatar} 
                          alt={tech.name}
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      <span className="flex-1">{tech.name}</span>
                      
                      {isCurrentUserTech && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCustomization(true);
                          }}
                          className="p-1 sm:p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                          title="Personalizar"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="text-xs sm:text-sm font-semibold mb-2" style={{ color: '#1a1a2e' }}>Em Preparação</h4>
                      <Droppable droppableId={`em-preparacao-${tech.id}`}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-2 min-h-[80px] sm:min-h-[100px] mb-3 sm:mb-4 p-2 rounded-lg transition-colors ${
                              snapshot.isDraggingOver ? 'bg-blue-100' : ''
                            }`}
                          >
                            {emPreparacao.map((machine, index) => (
                              <Draggable 
                                key={machine.id} 
                                draggableId={machine.id} 
                                index={index}
                                isDragDisabled={false}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity: snapshot.isDragging ? 0.5 : 1,
                                    }}
                                  >
                                    <MachineCard
                                      machine={machine}
                                      onOpenObservations={(m) => { setSelectedMachine(m); setShowObsModal(true); }}
                                      userPermissions={userPermissions}
                                      currentUser={currentUser}
                                      techStyles={techStyles}
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

                    {/* Hidden droppable for completed */}
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
                      techStyles={techStyles}
                    />
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

      <ObservationsModal
        isOpen={showObsModal}
        onClose={() => { setShowObsModal(false); setSelectedMachine(null); }}
        machine={selectedMachine}
        onAddObservation={handleAddObservation}
        onToggleTask={handleToggleTask}
        onTogglePriority={handleTogglePriority}
        onDelete={handleDeleteMachine}
        onMarkComplete={handleMarkComplete}
        currentUser={currentUser}
        userPermissions={userPermissions}
      />

      {/* Assign Modal */}
      <AssignModal
        isOpen={showAssignModal}
        onClose={() => { setShowAssignModal(false); setMachineToAssign(null); }}
        machine={machineToAssign}
        onAssign={handleAssignToTechnician}
        techStyles={techStyles}
      />

      {/* Customization Modal */}
      {showCustomization && (
        <CustomizationModal
          isOpen={showCustomization}
          onClose={() => setShowCustomization(false)}
          currentUser={currentUser}
          onUpdate={async () => {
            const user = await base44.auth.me(); // Reload current user to get updated personalizacao (for admin areas)
            setCurrentUser(user);
            await loadAllStyles(); // Reload all styles including tech and admin areas
          }}
          userPermissions={userPermissions}
        />
      )}
    </div>
  );
}

// Customization Modal Component
const CustomizationModal = ({ isOpen, onClose, currentUser, onUpdate, userPermissions }) => {
  const [customColor, setCustomColor] = useState('');
  const [gradientStart, setGradientStart] = useState('');
  const [gradientEnd, setGradientEnd] = useState('');
  const [useGradient, setUseGradient] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Admin customization for areas
  const [aFazerColor, setAFazerColor] = useState('');
  const [aFazerGradStart, setAFazerGradStart] = useState('');
  const [aFazerGradEnd, setAFazerGradEnd] = useState('');
  const [aFazerUseGrad, setAFazerUseGrad] = useState(false);
  
  const [concluidaColor, setConcluidaColor] = useState('');
  const [concluidaGradStart, setConcluidaGradStart] = useState('');
  const [concluidaGradEnd, setConcluidaGradEnd] = useState('');
  const [concluidaUseGrad, setConcluidaUseGrad] = useState(false);

  const [pedidosColor, setPedidosColor] = useState('');
  const [pedidosGradStart, setPedidosGradStart] = useState('');
  const [pedidosGradEnd, setPedidosGradEnd] = useState('');
  const [pedidosUseGrad, setPedidosUseGrad] = useState(false);


  React.useEffect(() => {
    const loadCustomization = async () => {
      // Reset all states first
      setCustomColor(''); setGradientStart(''); setGradientEnd(''); setUseGradient(false);
      setAvatarFile(null); setAvatarPreview('');
      setAFazerColor(''); setAFazerGradStart(''); setAFazerGradEnd(''); setAFazerUseGrad(false);
      setConcluidaColor(''); setConcluidaGradStart(''); setConcluidaGradEnd(''); setConcluidaUseGrad(false);
      setPedidosColor(''); setPedidosGradStart(''); setPedidosGradEnd(''); setPedidosUseGrad(false);

      // Load technician customization from TechnicianCustomization entity
      if (currentUser?.perfil === 'tecnico' && currentUser?.nome_tecnico) {
        try {
          const customizations = await base44.entities.TechnicianCustomization.filter({ 
            nome_tecnico: currentUser.nome_tecnico 
          });
          
          if (customizations && customizations.length > 0) {
            const custom = customizations[0];
            
            if (custom.gradient) {
              setUseGradient(true);
              const match = custom.gradient.match(/#[0-9a-f]{6}/gi);
              if (match && match.length >= 2) {
                setGradientStart(match[0]);
                setGradientEnd(match[1]);
              } else {
                setGradientStart('#3b82f6'); // Default fallback
                setGradientEnd('#1e40af'); // Default fallback
              }
            } else if (custom.cor) {
              setUseGradient(false);
              setCustomColor(custom.cor);
            }
            
            if (custom.avatar) {
              setAvatarPreview(custom.avatar);
            }
          }
        } catch (error) {
          console.error("Erro ao carregar personalização do técnico:", error);
        }
      }
      
      // Load admin areas customization from User entity
      if (userPermissions?.canDeleteMachine) { // Check admin permission
        const p = currentUser.personalizacao;
        
        if (p?.areas?.aFazer) {
          if (p.areas.aFazer.gradient) {
            setAFazerUseGrad(true);
            const match = p.areas.aFazer.gradient.match(/#[0-9a-f]{6}/gi);
            if (match && match.length >= 2) {
              setAFazerGradStart(match[0]);
              setAFazerGradEnd(match[1]);
            } else {
              setAFazerGradStart('#1f2937'); // Default fallback
              setAFazerGradEnd('#111827'); // Default fallback
            }
          } else if (p.areas.aFazer.cor) {
            setAFazerUseGrad(false);
            setAFazerColor(p.areas.aFazer.cor);
          } else {
            setAFazerUseGrad(false);
            setAFazerColor('');
          }
        }
        
        if (p?.areas?.concluida) {
          if (p.areas.concluida.gradient) {
            setConcluidaUseGrad(true);
            const match = p.areas.concluida.gradient.match(/#[0-9a-f]{6}/gi);
            if (match && match.length >= 2) {
              setConcluidaGradStart(match[0]);
              setConcluidaGradEnd(match[1]);
            } else {
              setConcluidaGradStart('#065f46'); // Default fallback
              setConcluidaGradEnd('#064e3b'); // Default fallback
            }
          } else if (p.areas.concluida.cor) {
            setConcluidaUseGrad(false);
            setConcluidaColor(p.areas.concluida.cor);
          } else {
            setConcluidaUseGrad(false);
            setConcluidaColor('');
          }
        }

        if (p?.areas?.pedidos) {
          if (p.areas.pedidos.gradient) {
            setPedidosUseGrad(true);
            const match = p.areas.pedidos.gradient.match(/#[0-9a-f]{6}/gi);
            if (match && match.length >= 2) {
              setPedidosGradStart(match[0]);
              setPedidosGradEnd(match[1]);
            } else {
              setPedidosGradStart('#4a5568'); // Default fallback
              setPedidosGradEnd('#2d3748'); // Default fallback
            }
          } else if (p.areas.pedidos.cor) {
            setPedidosUseGrad(false);
            setPedidosColor(p.areas.pedidos.cor);
          } else {
            setPedidosUseGrad(false);
            setPedidosColor('');
          }
        }
      }
    };

    if (isOpen) {
      loadCustomization();
    }
  }, [currentUser, isOpen, userPermissions]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    try {
      // Handle technician customization - save to TechnicianCustomization entity
      if (currentUser?.perfil === 'tecnico' && currentUser?.nome_tecnico) {
        const techData = { nome_tecnico: currentUser.nome_tecnico }; // Always include nome_tecnico
        
        if (useGradient && gradientStart && gradientEnd) {
          techData.gradient = `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`;
          techData.cor = null; // Clear solid color if gradient is used
        } else if (!useGradient && customColor) {
          techData.cor = customColor;
          techData.gradient = null; // Clear gradient if solid color is used
        } else {
          techData.cor = null; // Clear both if neither is set
          techData.gradient = null;
        }
        
        if (avatarFile) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
          techData.avatar = file_url;
        } else if (avatarPreview === '') { // If avatar was cleared
          techData.avatar = null;
        } else if (avatarPreview) { // Keep existing avatar if no new file and not cleared
          techData.avatar = avatarPreview;
        }
        
        // Check if customization already exists
        const existing = await base44.entities.TechnicianCustomization.filter({ 
          nome_tecnico: currentUser.nome_tecnico 
        });
        
        if (existing && existing.length > 0) {
          // Update existing
          await base44.entities.TechnicianCustomization.update(existing[0].id, techData);
        } else {
          // Create new
          await base44.entities.TechnicianCustomization.create(techData);
        }
      }
      
      // Handle admin areas customization - save to User entity
      if (userPermissions?.canDeleteMachine) { // Assuming canDeleteMachine indicates admin rights for this feature
        const updateData = { ...currentUser?.personalizacao };
        updateData.areas = updateData.areas || {};
        
        // A Fazer
        if (aFazerUseGrad && aFazerGradStart && aFazerGradEnd) {
          updateData.areas.aFazer = {
            gradient: `linear-gradient(135deg, ${aFazerGradStart} 0%, ${aFazerGradEnd} 100%)`
          };
        } else if (!aFazerUseGrad && aFazerColor) {
          updateData.areas.aFazer = { cor: aFazerColor };
        } else {
          delete updateData.areas.aFazer; // Clear if neither gradient nor solid color is set
        }
        
        // Concluída
        if (concluidaUseGrad && concluidaGradStart && concluidaGradEnd) {
          updateData.areas.concluida = {
            gradient: `linear-gradient(135deg, ${concluidaGradStart} 0%, ${concluidaGradEnd} 100%)`
          };
        } else if (!concluidaUseGrad && concluidaColor) {
          updateData.areas.concluida = { cor: concluidaColor };
        } else {
          delete updateData.areas.concluida; // Clear if neither gradient nor solid color is set
        }

        // Pedidos
        if (pedidosUseGrad && pedidosGradStart && pedidosGradEnd) {
          updateData.areas.pedidos = {
            gradient: `linear-gradient(135deg, ${pedidosGradStart} 0%, ${pedidosGradEnd} 100%)`
          };
        } else if (!pedidosUseGrad && pedidosColor) {
          updateData.areas.pedidos = { cor: pedidosColor };
        } else {
          delete updateData.areas.pedidos;
        }
        
        if (Object.keys(updateData.areas).length === 0) { // If no areas are customized, remove areas object
          delete updateData.areas;
        }
        
        await base44.auth.updateMe({ personalizacao: updateData });
      }
      
      await onUpdate();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar personalização:', error);
      alert('Erro ao salvar personalização');
    }
    setIsUploading(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Personalizar Perfil</h2>
        
        {currentUser?.perfil === 'tecnico' && (
          <div className="space-y-6 mb-6 pb-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Minha Área</h3>
            
            {/* Color/Gradient Toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!useGradient}
                  onChange={() => setUseGradient(false)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Cor Sólida</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={useGradient}
                  onChange={() => setUseGradient(true)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Gradiente</span>
              </label>
            </div>

            {/* Color Picker */}
            {!useGradient ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor da Área</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={customColor || '#3b82f6'}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                  />
                  <div 
                    className="flex-1 h-12 rounded border border-gray-300 flex items-center justify-center text-sm font-mono text-white"
                    style={{ backgroundColor: customColor || '#3b82f6' }}
                  >
                    {customColor || '#3b82f6'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor Início</label>
                  <input
                    type="color"
                    value={gradientStart || '#3b82f6'}
                    onChange={(e) => setGradientStart(e.target.value)}
                    className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor Fim</label>
                  <input
                    type="color"
                    value={gradientEnd || '#1e40af'}
                    onChange={(e) => setGradientEnd(e.target.value)}
                    className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
                <div 
                  className="h-16 rounded border border-gray-300"
                  style={{ 
                    background: `linear-gradient(135deg, ${gradientStart || '#3b82f6'} 0%, ${gradientEnd || '#1e40af'} 100%)` 
                  }}
                />
              </div>
            )}

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avatar / Foto</label>
              <div className="flex items-center gap-4">
                {avatarPreview && (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* Admin Areas Customization */}
        {userPermissions?.canDeleteMachine && ( // Assuming canDeleteMachine indicates admin rights for this feature
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Personalizar Áreas (Admin)</h3>
            
            {/* A Fazer Area */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-3">Área "A Fazer"</h4>
              
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!aFazerUseGrad}
                    onChange={() => setAFazerUseGrad(false)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Cor Sólida</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={aFazerUseGrad}
                    onChange={() => setAFazerUseGrad(true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Gradiente</span>
                </label>
              </div>

              {!aFazerUseGrad ? (
                <input
                  type="color"
                  value={aFazerColor || '#1f2937'}
                  onChange={(e) => setAFazerColor(e.target.value)}
                  className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={aFazerGradStart || '#1f2937'}
                    onChange={(e) => setAFazerGradStart(e.target.value)}
                    className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="color"
                    value={aFazerGradEnd || '#111827'}
                    onChange={(e) => setAFazerGradEnd(e.target.value)}
                    className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <div 
                    className="flex-1 h-12 rounded border border-gray-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${aFazerGradStart || '#1f2937'} 0%, ${aFazerGradEnd || '#111827'} 100%)` 
                    }}
                  />
                </div>
              )}
            </div>

            {/* Concluída Area */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-3">Área "Concluída"</h4>
              
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!concluidaUseGrad}
                    onChange={() => setConcluidaUseGrad(false)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Cor Sólida</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={concluidaUseGrad}
                    onChange={() => setConcluidaUseGrad(true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Gradiente</span>
                </label>
              </div>

              {!concluidaUseGrad ? (
                <input
                  type="color"
                  value={concluidaColor || '#065f46'}
                  onChange={(e) => setConcluidaColor(e.target.value)}
                  className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={concluidaGradStart || '#065f46'}
                    onChange={(e) => setConcluidaGradStart(e.target.value)}
                    className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="color"
                    value={concluidaGradEnd || '#064e3b'}
                    onChange={(e) => setConcluidaGradEnd(e.target.value)}
                    className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <div 
                    className="flex-1 h-12 rounded border border-gray-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${concluidaGradStart || '#065f46'} 0%, ${concluidaGradEnd || '#064e3b'} 100%)` 
                    }}
                  />
                </div>
              )}
            </div>

            {/* Pedidos Area */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-3">Área "Pedidos"</h4>
              
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!pedidosUseGrad}
                    onChange={() => setPedidosUseGrad(false)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Cor Sólida</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={pedidosUseGrad}
                    onChange={() => setPedidosUseGrad(true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Gradiente</span>
                </label>
              </div>

              {!pedidosUseGrad ? (
                <input
                  type="color"
                  value={pedidosColor || '#4a5568'}
                  onChange={(e) => setPedidosColor(e.target.value)}
                  className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={pedidosGradStart || '#4a5568'}
                    onChange={(e) => setPedidosGradStart(e.target.value)}
                    className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="color"
                    value={pedidosGradEnd || '#2d3748'}
                    onChange={(e) => setPedidosGradEnd(e.target.value)}
                    className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <div 
                    className="flex-1 h-12 rounded border border-gray-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${pedidosGradStart || '#4a5568'} 0%, ${pedidosGradEnd || '#2d3748'} 100%)` 
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isUploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  );
};
