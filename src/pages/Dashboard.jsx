
import React, { useState, useEffect, useCallback } from "react";
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

const MachineCard = ({ machine, onOpenObservations, isCompact = false, onAssign, userPermissions, currentUser }) => {
  const [showAssignTooltip, setShowAssignTooltip] = useState(false);
  const TipoIcon = TIPO_ICONS[machine.tipo]?.icon || Package;
  const tipoColor = TIPO_ICONS[machine.tipo]?.color || 'text-gray-600';
  const tipoBg = TIPO_ICONS[machine.tipo]?.bg || 'bg-gray-100';
  
  if (isCompact) {
    return (
      <button
        onClick={() => onOpenObservations(machine)}
        className="w-full text-left p-2 hover:bg-gray-100 rounded transition-colors"
      >
        <span className="text-sm font-mono font-bold text-gray-900">{machine.serie}</span>
      </button>
    );
  }

  const canAssign = machine.estado === 'a-fazer' && (
    userPermissions?.canMoveAnyMachine || 
    (userPermissions?.canMoveMachineToOwnColumn && currentUser?.nome_tecnico)
  );
  
  // Check if machine is completed and has technician with customization
  const isCompleted = machine.estado?.includes('concluida');
  const techCustomization = isCompleted && machine.tecnico && currentUser?.nome_tecnico === machine.tecnico ? 
    currentUser?.personalizacao : null;
  
  const cardStyle = {};
  let cardClassName = 'bg-white rounded-lg p-2 sm:p-3 shadow-sm border-2 transition-all cursor-pointer w-full';
  
  // Apply technician's customization to completed card (NOT prioritized ones)
  if (isCompleted && techCustomization && !machine.prioridade) {
    if (techCustomization.gradient) {
      cardStyle.background = techCustomization.gradient;
      cardClassName += ' border-transparent text-white hover:shadow-lg';
    } else if (techCustomization.cor) {
      cardStyle.backgroundColor = techCustomization.cor;
      cardClassName += ' border-transparent text-white hover:shadow-lg';
    } else {
      cardClassName += ' border-gray-200 hover:shadow-md';
    }
  } else {
    cardClassName += ' border-gray-200 hover:shadow-md';
  }
  
  const textColor = (isCompleted && techCustomization && !machine.prioridade) ? 'text-white' : 'text-gray-600';
  const textColorDark = (isCompleted && techCustomization && !machine.prioridade) ? 'text-white' : 'text-gray-900';
  
  return (
    <div 
      className={cardClassName}
      style={cardStyle}
      onClick={() => onOpenObservations(machine)}
    >
      {/* Compact single-line layout */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Type Icon */}
        <div className={`${(isCompleted && techCustomization && !machine.prioridade) ? 'bg-white/20' : tipoBg} ${(isCompleted && techCustomization && !machine.prioridade) ? 'text-white' : tipoColor} p-1 rounded-full flex-shrink-0`}>
          <TipoIcon className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
        
        {/* Serial Number - prominent */}
        <p className={`text-sm sm:text-base font-mono font-bold ${textColorDark} flex-shrink-0 truncate max-w-[80px] sm:max-w-none`}>{machine.serie}</p>
        
        {/* Priority Icon */}
        {machine.prioridade && (
          <svg className="w-4 h-4 text-red-600 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        
        {/* Badges - compact */}
        <div className="flex items-center gap-1 flex-wrap ml-auto">
          {machine.recondicao?.bronze && (
            <span className="bg-amber-700 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
              BRZ
            </span>
          )}
          {machine.recondicao?.prata && (
            <span className="bg-gray-400 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
              PRT
            </span>
          )}
          {machine.observacoes && machine.observacoes.length > 0 && (
            <span className={`${(isCompleted && techCustomization && !machine.prioridade) ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'} text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0`}>
              {machine.observacoes.length}
            </span>
          )}
          {machine.tecnico && machine.estado?.includes('concluida') && (
            <span className={`${(isCompleted && techCustomization && !machine.prioridade) ? 'bg-white/20 text-white' : 'bg-green-100 text-green-800'} text-[10px] px-1.5 py-1 rounded-full font-semibold flex-shrink-0`}>
              ✓
            </span>
          )}
          {canAssign && (
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign(machine);
                }}
                onMouseEnter={() => setShowAssignTooltip(true)}
                onMouseLeave={() => setShowAssignTooltip(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full transition-colors"
                title="Atribuir"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              {showAssignTooltip && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  Atribuir
                </div>
              )}
            </div>
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
  
  // Handle ESC key to close
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);
  
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

  const tarefasConcluidas = machine.tarefas?.filter(t => t.concluida).length || 0;
  const totalTarefas = machine.tarefas?.length || 0;
  
  const TipoIcon = TIPO_ICONS[machine.tipo]?.icon || Package;
  const tipoColor = TIPO_ICONS[machine.tipo]?.color || 'text-gray-600';

  // Check if user can edit tasks (only in em-preparacao and is their machine or admin)
  const canEditTasks = machine.estado?.includes('em-preparacao') && (
    userPermissions?.canMoveAnyMachine || 
    (currentUser?.nome_tecnico && machine.tecnico === currentUser.nome_tecnico)
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white sm:rounded-xl shadow-2xl z-50 w-full h-full sm:h-auto sm:w-[95%] sm:max-w-5xl sm:max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Fechar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 sm:p-6 border-b overflow-y-auto flex-shrink-0">
          <div className="pr-8">
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <TipoIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${tipoColor}`} />
                <h2 className="text-xl sm:text-3xl font-mono font-bold text-gray-900">{machine.serie}</h2>
                {machine.prioridade && (
                  <span className="bg-red-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-bold">
                    PRIORITÁRIA
                  </span>
                )}
                {machine.recondicao?.bronze && (
                  <span className="bg-amber-700 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-bold">
                    BRONZE
                  </span>
                )}
                {machine.recondicao?.prata && (
                  <span className="bg-gray-400 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-bold">
                    PRATA
                  </span>
                )}
              </div>
              <p className="text-base sm:text-lg text-gray-600">{machine.modelo}</p>
              {machine.ano && <p className="text-xs sm:text-sm text-gray-500">Ano: {machine.ano}</p>}
              {machine.tecnico && (
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  Responsável: <span className="font-semibold capitalize">{machine.tecnico}</span>
                </p>
              )}
            </div>
              
            <div className="flex gap-2 flex-wrap">
              {userPermissions?.canSetPriority && machine.estado === 'a-fazer' && (
                <button
                  onClick={() => onTogglePriority(machine.id, !machine.prioridade)}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                    machine.prioridade
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
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
                  className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-xs sm:text-sm transition-colors"
                >
                  Apagar
                </button>
              )}

              {machine.estado?.includes('em-preparacao') && !machine.estado?.includes('concluida') && (
                <button
                  onClick={handleMarkComplete}
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Marcar como Concluída</span>
                  <span className="sm:hidden">Concluir</span>
                </button>
              )}

              {machine.estado?.includes('em-preparacao') && (
                <button
                  onClick={() => setShowPedidoForm(!showPedidoForm)}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xs sm:text-sm transition-colors"
                >
                  {showPedidoForm ? 'Cancelar' : 'Criar Pedido'}
                </button>
              )}
            </div>

            {showPedidoForm && (
              <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">Novo Pedido</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={numeroPedido}
                    onChange={(e) => setNumeroPedido(e.target.value)}
                    placeholder="Número do pedido..."
                    className="flex-1 px-3 py-2 text-sm sm:text-base border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitPedido()}
                  />
                  <button
                    onClick={handleSubmitPedido}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm sm:text-base whitespace-nowrap"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {machine.estado?.includes('concluida') && machine.dataConclusao && (
              <div className="mt-4 bg-green-100 text-green-800 px-3 sm:px-4 py-2 rounded-lg inline-block">
                <p className="text-xs font-semibold">CONCLUÍDA</p>
                <p className="text-xs">{new Date(machine.dataConclusao).toLocaleDateString('pt-PT')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Tasks Section */}
          {machine.tarefas && machine.tarefas.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Tarefas</h3>
                <span className="text-xs sm:text-sm text-gray-600">{tarefasConcluidas}/{totalTarefas} concluídas</span>
              </div>
              <div className="space-y-2">
                {machine.tarefas.map((tarefa, idx) => (
                  <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      checked={tarefa.concluida}
                      onChange={() => canEditTasks && onToggleTask(machine.id, idx)}
                      disabled={!canEditTasks}
                      className="mt-0.5 sm:mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`flex-1 text-sm sm:text-base ${tarefa.concluida ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                      {tarefa.texto}
                    </span>
                  </div>
                ))}
              </div>
              {!canEditTasks && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  As tarefas só podem ser marcadas em preparação pelo responsável (ou admin).
                </p>
              )}
            </div>
          )}

          {/* Observations Section */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Observações</h3>
            {machine.observacoes && machine.observacoes.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {machine.observacoes.map((obs, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">{obs.autor}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(obs.data).toLocaleString('pt-PT', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm sm:text-base">{obs.texto}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm sm:text-base">Nenhuma observação ainda</p>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              value={newObs}
              onChange={(e) => setNewObs(e.target.value)}
              placeholder="Adicionar observação..."
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              className="px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm sm:text-base whitespace-nowrap"
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
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-[90%] max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Nova Máquina</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
            <input
              type="text"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Série</label>
            <input
              type="text"
              value={formData.serie}
              onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <input
              type="number"
              value={formData.ano}
              onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Máquina</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TIPO_ICONS).map(([tipo, { icon: Icon, color, bg }]) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo })}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.tipo === tipo 
                      ? `${bg} border-current` 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${formData.tipo === tipo ? color : 'text-gray-400'}`} />
                  <span className="text-xs font-medium capitalize">{tipo}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recondicionamento</label>
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
                  className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                />
                <label htmlFor="recon-bronze" className="text-sm text-gray-700 flex items-center gap-2">
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
                  className="w-4 h-4 text-gray-600 rounded focus:ring-2 focus:ring-gray-500"
                />
                <label htmlFor="recon-prata" className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    PRT
                  </span>
                  Recon Prata
                </label>
              </div>
            </div>
          </div>

          {/* New: Priority Checkbox */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="prioridade"
                checked={formData.prioridade || false}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
              />
              <label htmlFor="prioridade" className="text-sm text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Marcar como Prioritária
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tarefas a Realizar</label>
            <div className="space-y-2 mb-3">
              {TAREFAS_PREDEFINIDAS.map(tarefa => (
                <div key={tarefa} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`tarefa-${tarefa}`}
                    checked={!!selectedTarefas[tarefa]}
                    onChange={() => handleTarefaToggle(tarefa)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                  />
                  <label htmlFor={`tarefa-${tarefa}`} className="text-sm text-gray-700">
                    {tarefa}
                  </label>
                </div>
              ))}
            </div>
            
            {customTarefas.length > 0 && (
              <div className="space-y-2 mb-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-2">Tarefas Personalizadas:</p>
                {customTarefas.map((tarefa, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded">
                    <span className="text-sm text-gray-700">{tarefa}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomTarefa(idx)}
                      className="text-red-600 hover:text-red-700 text-xs font-semibold"
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
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTarefa())}
              />
              <button
                type="button"
                onClick={handleAddCustomTarefa}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
    <div className="mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-semibold text-green-800">
            Concluídas: {machines.length}
          </span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 max-h-60 overflow-y-auto bg-white rounded-lg border border-gray-200"
          >
            {machines.map(machine => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onOpenObservations={onOpenMachine}
                isCompact={true}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Assign Modal Component - With Custom Colors
const AssignModal = ({ isOpen, onClose, machine, onAssign, currentUser }) => {
  // Get technician styles
  const getTechStyle = (techId) => {
    const tech = TECHNICIANS.find(t => t.id === techId);
    
    // If current user is this tech and has customization, use it
    if (currentUser?.nome_tecnico === techId && currentUser?.personalizacao) {
      const custom = currentUser.personalizacao;
      if (custom.gradient) {
        return { background: custom.gradient, color: 'white' };
      }
      if (custom.cor) {
        return { backgroundColor: custom.cor, color: 'white' };
      }
    }
    
    // Fallback to default tech color
    return { className: tech?.color || 'bg-gray-500', color: 'white' };
  };

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
            const style = getTechStyle(tech.id);
            
            return (
              <button
                key={tech.id}
                onClick={() => {
                  onAssign(tech.id);
                  onClose();
                }}
                className={`p-4 rounded-lg border-2 border-transparent transition-all hover:shadow-md text-white font-semibold ${style.className || ''}`}
                style={style.background || style.backgroundColor ? style : {}}
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

  const userPermissions = usePermissions(currentUser?.perfil, currentUser?.nome_tecnico);

  const loadMachines = useCallback(async () => {
    setIsLoading(true);
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
    loadMachines();
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
      await FrotaACP.update(machineId, {
        observacoes: [...(machine.observacoes || []), newObs]
      });
      await loadMachines();
    } catch (error) {
      console.error("Erro ao adicionar observação:", error);
    }
  };

  const handleToggleTask = async (machineId, taskIndex) => {
    try {
      const machine = machines.find(m => m.id === machineId);
      const updatedTarefas = [...(machine.tarefas || [])];
      updatedTarefas[taskIndex].concluida = !updatedTarefas[taskIndex].concluida;
      
      await FrotaACP.update(machineId, {
        tarefas: updatedTarefas
      });
      await loadMachines();
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
    }
  };

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

  const getMachinesForState = (state) => {
    const filtered = machines.filter(m => m.estado === state);
    
    // Se for "a-fazer", ordenar por prioridade (prioritárias primeiro)
    if (state === 'a-fazer') {
      return filtered.sort((a, b) => {
        if (a.prioridade && !b.prioridade) return -1; // a is prioritized, b is not, a comes first
        if (!a.prioridade && b.prioridade) return 1;  // b is prioritized, a is not, b comes first (a comes after)
        return 0; // maintain original order for same priority status
      });
    }
    
    return filtered;
  };

  const filteredMachines = searchQuery
    ? machines.filter(m =>
        m.modelo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.serie?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const aFazerMachines = getMachinesForState('a-fazer');
  const allConcluidaMachines = machines.filter(m => m.estado?.includes('concluida'));

  // Get technician or admin customization
  const getTechnicianStyle = useCallback((techId) => {
    // Check if current user has customization for this tech
    if (currentUser?.nome_tecnico === techId && currentUser?.personalizacao) {
      const custom = currentUser.personalizacao;
      if (custom.gradient) {
        return { background: custom.gradient };
      }
      if (custom.cor) {
        return { backgroundColor: custom.cor };
      }
    }
    
    // Fallback to default
    const tech = TECHNICIANS.find(t => t.id === techId);
    return { className: tech?.color || 'bg-gray-500' };
  }, [currentUser]);

  const getAdminAreaStyle = useCallback((area) => {
    if (!currentUser?.personalizacao?.areas) return null;
    const areaCustom = currentUser.personalizacao.areas[area];
    if (!areaCustom) return null;
    
    if (areaCustom.gradient) {
      return { background: areaCustom.gradient };
    }
    if (areaCustom.cor) {
      return { backgroundColor: areaCustom.cor };
    }
    return null;
  }, [currentUser]);

  const getTechnicianAvatar = useCallback((techId) => {
    if (currentUser?.nome_tecnico === techId && currentUser?.personalizacao?.avatar) {
      return currentUser.personalizacao.avatar;
    }
    return null;
  }, [currentUser]);

  const aFazerStyle = getAdminAreaStyle('aFazer') || {};
  const concluidaStyle = getAdminAreaStyle('concluida') || {};

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin Customization Button */}
          {userPermissions?.canDeleteMachine && (
            <button
              onClick={() => setShowCustomization(true)}
              className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors text-sm"
              title="Personalizar Painéis"
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
                className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Criar com IA</span>
              </button>
              <button
                onClick={() => { setPrefillData(null); setShowCreateModal(true); }}
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nova Máquina</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Admin Pedidos Panel */}
      {userPermissions?.canDeleteMachine && !searchQuery && (
        <div className="mb-4">
          <PedidosPanel 
            userPermissions={userPermissions} 
            adminStyle={{ pedidos: getAdminAreaStyle('pedidos') || {} }}
          />
        </div>
      )}

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
            />
          ))}
        </div>
      ) : (
        <>
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Top Section - A Fazer and Concluída - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div 
                className="rounded-xl shadow-2xl p-4 sm:p-6 relative overflow-hidden"
                style={aFazerStyle.background || aFazerStyle.backgroundColor ? aFazerStyle : { background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }}
              >
                {/* Logo ATLAS em baixo relevo */}
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dc340a4ed_LogoGeomtricoATLAScomOlhoCircular-Photoroom.png"
                  alt="ATLAS"
                  className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-20 h-20 sm:w-32 sm:h-32 opacity-[0.08] pointer-events-none"
                />
                
                <h3 className="font-bold text-white text-lg sm:text-xl mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 relative z-10">
                  <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
                  A Fazer
                  <span className="ml-auto bg-white/20 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base">
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
                className="rounded-xl shadow-2xl p-4 sm:p-6 relative overflow-hidden"
                style={concluidaStyle.background || concluidaStyle.backgroundColor ? concluidaStyle : { background: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)' }}
              >
                {/* Logo ATLAS em baixo relevo */}
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dc340a4ed_LogoGeomtricoATLAScomOlhoCircular-Photoroom.png"
                  alt="ATLAS"
                  className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-20 h-20 sm:w-32 sm:h-32 opacity-[0.08] pointer-events-none"
                />
                
                <h3 className="font-bold text-white text-lg sm:text-xl mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 relative z-10">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  Concluída
                  <span className="ml-auto bg-white/20 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base">
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

            {/* Technician Columns - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {TECHNICIANS.map(tech => {
                const emPreparacao = getMachinesForState(`em-preparacao-${tech.id}`);
                const concluidas = getMachinesForState(`concluida-${tech.id}`);
                const customStyle = getTechnicianStyle(tech.id);
                const customAvatar = getTechnicianAvatar(tech.id);
                const isCurrentUserTech = currentUser?.nome_tecnico === tech.id;
                
                return (
                  <div key={tech.id} className="flex flex-col bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div 
                      className={`font-bold text-white mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg flex items-center gap-2 text-sm sm:text-base ${customStyle.className || ''}`}
                      style={customStyle.background || customStyle.backgroundColor ? customStyle : {}}
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
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Em Preparação</h4>
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
        currentUser={currentUser}
      />

      {/* Customization Modal */}
      {showCustomization && (
        <CustomizationModal
          isOpen={showCustomization}
          onClose={() => setShowCustomization(false)}
          currentUser={currentUser}
          onUpdate={async () => {
            const user = await base44.auth.me();
            setCurrentUser(user);
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
    if (currentUser?.personalizacao) {
      const p = currentUser.personalizacao;
      
      if (p.gradient) {
        setUseGradient(true);
        // Try to extract colors from gradient
        const match = p.gradient.match(/#[0-9a-f]{6}/gi);
        if (match && match.length >= 2) {
          setGradientStart(match[0]);
          setGradientEnd(match[1]);
        } else {
          // Fallback if gradient string is not standard hex format
          setGradientStart('#3b82f6');
          setGradientEnd('#1e40af');
        }
      } else if (p.cor) {
        setUseGradient(false);
        setCustomColor(p.cor);
      } else {
        setUseGradient(false);
        setCustomColor('');
      }
      
      if (p.avatar) {
        setAvatarPreview(p.avatar);
      } else {
        setAvatarPreview('');
      }
      
      // Load admin areas
      if (p.areas) {
        if (p.areas.aFazer) {
          if (p.areas.aFazer.gradient) {
            setAFazerUseGrad(true);
            const match = p.areas.aFazer.gradient.match(/#[0-9a-f]{6}/gi);
            if (match && match.length >= 2) {
              setAFazerGradStart(match[0]);
              setAFazerGradEnd(match[1]);
            } else {
              setAFazerGradStart('#1f2937');
              setAFazerGradEnd('#111827');
            }
          } else if (p.areas.aFazer.cor) {
            setAFazerUseGrad(false);
            setAFazerColor(p.areas.aFazer.cor);
          } else {
            setAFazerUseGrad(false);
            setAFazerColor('');
          }
        } else {
          setAFazerColor('');
          setAFazerGradStart('');
          setAFazerGradEnd('');
          setAFazerUseGrad(false);
        }
        
        if (p.areas.concluida) {
          if (p.areas.concluida.gradient) {
            setConcluidaUseGrad(true);
            const match = p.areas.concluida.gradient.match(/#[0-9a-f]{6}/gi);
            if (match && match.length >= 2) {
              setConcluidaGradStart(match[0]);
              setConcluidaGradEnd(match[1]);
            } else {
              setConcluidaGradStart('#065f46');
              setConcluidaGradEnd('#064e3b');
            }
          } else if (p.areas.concluida.cor) {
            setConcluidaUseGrad(false);
            setConcluidaColor(p.areas.concluida.cor);
          } else {
            setConcluidaUseGrad(false);
            setConcluidaColor('');
          }
        } else {
          setConcluidaColor('');
          setConcluidaGradStart('');
          setConcluidaGradEnd('');
          setConcluidaUseGrad(false);
        }

        if (p.areas.pedidos) {
          if (p.areas.pedidos.gradient) {
            setPedidosUseGrad(true);
            const match = p.areas.pedidos.gradient.match(/#[0-9a-f]{6}/gi);
            if (match && match.length >= 2) {
              setPedidosGradStart(match[0]);
              setPedidosGradEnd(match[1]);
            } else {
              setPedidosGradStart('#4a5568'); 
              setPedidosGradEnd('#2d3748');
            }
          } else if (p.areas.pedidos.cor) {
            setPedidosUseGrad(false);
            setPedidosColor(p.areas.pedidos.cor);
          } else {
            setPedidosUseGrad(false);
            setPedidosColor('');
          }
        } else {
          setPedidosColor('');
          setPedidosGradStart('');
          setPedidosGradEnd('');
          setPedidosUseGrad(false);
        }
      } else {
        setAFazerColor(''); setAFazerGradStart(''); setAFazerGradEnd(''); setAFazerUseGrad(false);
        setConcluidaColor(''); setConcluidaGradStart(''); setConcluidaGradEnd(''); setConcluidaUseGrad(false);
        setPedidosColor(''); setPedidosGradStart(''); setPedidosGradEnd(''); setPedidosUseGrad(false);
      }
    } else {
      // Reset all if no personalization exists
      setCustomColor(''); setGradientStart(''); setGradientEnd(''); setUseGradient(false);
      setAvatarFile(null); setAvatarPreview('');
      setAFazerColor(''); setAFazerGradStart(''); setAFazerGradEnd(''); setAFazerUseGrad(false);
      setConcluidaColor(''); setConcluidaGradStart(''); setConcluidaGradEnd(''); setConcluidaUseGrad(false);
      setPedidosColor(''); setPedidosGradStart(''); setPedidosGradEnd(''); setPedidosUseGrad(false);
    }
  }, [currentUser, isOpen]);

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
      const updateData = { ...currentUser?.personalizacao };
      
      // Handle tech customization
      if (currentUser?.perfil === 'tecnico') {
        if (useGradient && gradientStart && gradientEnd) {
          updateData.gradient = `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`;
          delete updateData.cor;
        } else if (!useGradient && customColor) { // Save solid color if not using gradient and color is set
          updateData.cor = customColor;
          delete updateData.gradient;
        } else { // Neither gradient nor solid color is selected/set, clear both
          delete updateData.gradient;
          delete updateData.cor;
        }
        
        if (avatarFile) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
          updateData.avatar = file_url;
        } else if (avatarPreview === '' && updateData.avatar) { // If avatar was cleared
          delete updateData.avatar;
        }
      }
      
      // Handle admin areas customization
      if (userPermissions?.canDeleteMachine) { // Assuming canDeleteMachine indicates admin rights for this feature
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
      }
      
      await base44.auth.updateMe({ personalizacao: updateData });
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
