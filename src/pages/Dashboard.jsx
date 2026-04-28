import { FrotaACP, Pedido } from "@/entities/all";
import { Plus, Camera, Search, Wrench, User as UserIcon, Package, Sparkles, Repeat, CheckCircle2, ChevronDown, ChevronUp, Clock, Maximize2, Minimize2, HardDrive, AlertTriangle, ChevronRight, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/components/hooks/usePermissions";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

import ImageUploadModal from "../components/dashboard/ImageUploadModal";
import PedidosPanel from "../components/dashboard/PedidosPanel";
import BulkCreateModal from "../components/dashboard/BulkCreateModal";
import BackupManager from "../components/dashboard/BackupManager";
import EditMachineModal from "../components/dashboard/EditMachineModal";
import UnifiedNotifications from "../components/dashboard/UnifiedNotifications";
import OSNotificationsPanel from "../components/dashboard/OSNotificationsPanel";
import ObservationsModal from "../components/dashboard/ObservationsModal";
import CreateMachineModal from "../components/dashboard/CreateMachineModal";
import MachineEditCard from "../components/dashboard/MachineEditCard";
import TimerButton, { useElapsedTimer, formatDuration } from "../components/dashboard/TimerButton";
import { useTheme } from "../ThemeContext";
import ProfileSelector from "../components/auth/ProfileSelector";
import { LayoutUserContext } from "../Layout";

const TECHNICIANS = [
  { id: 'raphael', name: 'RAPHAEL', color: 'bg-red-500', borderColor: '#ef4444', lightBg: '#fee2e2' },
  { id: 'nuno', name: 'NUNO', color: 'bg-yellow-500', borderColor: '#eab308', lightBg: '#fef3c7' },
  { id: 'rogerio', name: 'ROGÉRIO', color: 'bg-cyan-500', borderColor: '#06b6d4', lightBg: '#cffafe' },
  { id: 'yano', name: 'YANO', color: 'bg-green-500', borderColor: '#10b981', lightBg: '#d1fae5' }
];

const TIPO_ICONS = {
  nova: { icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-100' },
  usada: { icon: Repeat, color: 'text-orange-600', bg: 'bg-orange-100' },
  aluguer: { icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' }
};


// ── Sync Watcher → Portal da Frota ACP ──────────────────────────────────────
// Mapeia o estado do Watcher para o status do Portal e actualiza TODOS os
// registos do Portal que tenham o mesmo serial_number da máquina.
const PORTAL_API = "https://base44.app/api/apps/699ee6a6c0541069d0066cc1/entities/Equipment";
const PORTAL_KEY = "f8517554492e492090b62dd501ad7e14";

function watcherEstadoToPortalStatus(estado) {
  if (!estado) return null;
  if (estado.startsWith("em-preparacao")) return "Em progresso";
  if (estado.startsWith("concluida"))     return "Pronta";
  if (estado === "a-fazer")               return "A começar";
  return null;
}

async function syncMachineToPortal(serialNumber, watcherEstado) {
  if (!serialNumber) return;
  const status = watcherEstadoToPortalStatus(watcherEstado);
  if (!status) return;

  try {
    const res = await fetch(`${PORTAL_API}/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sagan-secret': PORTAL_KEY },
      body: JSON.stringify({ filter: { serial_number: serialNumber } })
    });
    const equipments = await res.json();
    if (!Array.isArray(equipments) || equipments.length === 0) return;

    await Promise.all(equipments.map(eq =>
      fetch(`${PORTAL_API}/update/${eq.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-sagan-secret': PORTAL_KEY },
        body: JSON.stringify({ payload: { status } })
      })
    ));
  } catch (err) { console.error("Erro ao sincronizar com Portal:", err); }
}


// ── COMPONENTES INTERNOS ─────────────────────────────────────────────────────

const MachineCardCompact = ({ machine, onClick, isDark, onAssign, showAssignButton, isSelected, onSelect }) => {
  const Icon = TIPO_ICONS[machine.tipo]?.icon || Package;
  const iconColor = TIPO_ICONS[machine.tipo]?.color || 'text-slate-400';
  const iconBg = TIPO_ICONS[machine.tipo]?.bg || (isDark ? 'bg-slate-800' : 'bg-slate-100');

  return (
    <div onClick={() => onClick(machine)} className={`group relative mb-2 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'ring-2 ring-pink-500 border-pink-500' : 'hover:border-pink-500/50'} ${isDark ? 'bg-[#0D0D1C] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-1.5 rounded-lg ${iconBg} ${iconColor}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{machine.modelo}</span>
          </div>
          <h3 className={`text-lg font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{machine.serie}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <input type="checkbox" checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={() => onSelect(machine)} className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500" />
          {machine.prioridade && <AlertTriangle className="w-4 h-4 text-orange-500 animate-pulse" />}
        </div>
      </div>
      {showAssignButton && (
        <button onClick={(e) => { e.stopPropagation(); onAssign(machine.id); }} className="mt-3 w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-pink-900/20">Atribuir a Mim</button>
      )}
    </div>
  );
};

const MachineCardTechnician = ({ machine, onClick, techColor, isDark, isSelected, onSelect, onTimerStart, onTimerPause, onTimerResume }) => {
  const Icon = TIPO_ICONS[machine.tipo]?.icon || Package;
  const iconColor = TIPO_ICONS[machine.tipo]?.color || 'text-slate-400';
  const iconBg = TIPO_ICONS[machine.tipo]?.bg || (isDark ? 'bg-slate-800' : 'bg-slate-100');

  return (
    <div onClick={() => onClick(machine)} className={`group relative mb-2 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'ring-2 ring-pink-500 border-pink-500' : 'hover:border-pink-500/50'} ${isDark ? 'bg-[#0D0D1C] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-1.5 rounded-lg ${iconBg} ${iconColor}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{machine.modelo}</span>
          </div>
          <h3 className={`text-lg font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{machine.serie}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <input type="checkbox" checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={() => onSelect(machine)} className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500" />
          {machine.prioridade && <AlertTriangle className="w-4 h-4 text-orange-500 animate-pulse" />}
          {machine.aguardaPecas && <Clock className="w-4 h-4 text-yellow-500" />}
        </div>
      </div>
      <TimerButton machine={machine} onStart={onTimerStart} onPause={onTimerPause} onResume={onTimerResume} onStop={() => {}} onReset={() => {}} isAdmin={false} />
    </div>
  );
};

const TechnicianCompletedSection = ({ machines, techId, onOpenMachine, isDark }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (machines.length === 0) return null;

  return (
    <div className="mt-2 border-t border-slate-800/50 pt-2 px-2">
      <button onClick={() => setIsExpanded(!isExpanded)} className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800/50 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Concluídas</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>{machines.length}</span>
        </div>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-1 space-y-1">
            {machines.map(m => (
              <div key={m.id} onClick={() => onOpenMachine(m)} className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all hover:translate-x-1 ${isDark ? 'bg-slate-900/50 border-slate-800 hover:border-emerald-500/30' : 'bg-slate-50 border-slate-200 hover:border-emerald-500/30'}`}>
                <div className="flex flex-col">
                  <span className={`text-[9px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{m.modelo}</span>
                  <span className={`text-xs font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{m.serie}</span>
                </div>
                <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ── DASHBOARD PRINCIPAL ──────────────────────────────────────────────────────

export default function Dashboard() {
  const { user: currentUser } = React.useContext(LayoutUserContext);
  const userPermissions = usePermissions(currentUser);
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showObsModal, setShowObsModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [machineToEdit, setMachineToEdit] = useState(null);
  const [showAFazerFullscreen, setShowAFazerFullscreen] = useState(false);
  const [showConcluidaFullscreen, setShowConcluidaFullscreen] = useState(false);
  const [machineToAssign, setMachineToAssign] = useState(null);
  const heroRef = useRef(null);


  const TIMER_FIELDS = ['timer_ativo','timer_pausado','timer_inicio','timer_fim','timer_duracao_minutos','timer_acumulado'];

  const loadMachines = useCallback(async () => {
    try {
      const data = await FrotaACP.list('-created_date');
      setMachines(data);
    } catch (error) { console.error("Erro ao carregar máquinas:", error); }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadMachines(); }, [loadMachines]);

  useEffect(() => {
    const interval = setInterval(() => { loadMachines(); }, 30000);
    return () => clearInterval(interval);
  }, [loadMachines]);

  // Subscrição em tempo real para mudanças de máquinas
  useEffect(() => {
    let unsubscribe = null;
    const subscribe = async () => {
      try {
        unsubscribe = await base44.entities.FrotaACP.subscribe((event) => {
          if (event.type === 'update' || event.type === 'create' || event.type === 'delete') {
            loadMachines();
          }
        });
      } catch (e) {
        console.warn('Subscrição em tempo real indisponível:', e.message);
      }
    };
    subscribe();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [loadMachines]);

  const handleCreateMachine = async (machineData) => {
    try {
      const existingMachines = await FrotaACP.list();
      const isDuplicate = existingMachines.some(m => m.serie === machineData.serie && !m.arquivada);
      if (isDuplicate) { alert(`A máquina com série ${machineData.serie} já está registada.`); return; }
      await FrotaACP.create({ ...machineData, estado: 'a-fazer' });
      await loadMachines();
      setShowCreateModal(false);
    } catch (error) { console.error("Erro ao criar máquina:", error); }
  };

  const handleBulkCreate = async (machinesData) => {
    try {
      await Promise.all(machinesData.map(m => FrotaACP.create({ ...m, estado: 'a-fazer' })));
      await loadMachines();
      setShowBulkCreateModal(false);
    } catch (error) { console.error("Erro ao criar máquinas em massa:", error); }
  };

  const handleEditSave = async (machineId, updateData) => {
    try {
      await FrotaACP.update(machineId, updateData);
      await loadMachines();
      setShowEditModal(false);
      setMachineToEdit(null);
    } catch (error) { console.error("Erro ao salvar edição:", error); }
  };


  // ── TIMER HANDLERS ──
  const handleTimerStart = async (machineId) => {
    try {
      const now = new Date().toISOString();
      const data = { timer_inicio: now, timer_ativo: true, timer_pausado: false, timer_fim: null, timer_duracao_minutos: null, timer_acumulado: 0 };
      await base44.entities.FrotaACP.update(machineId, data);
    } catch (e) { console.error("Erro ao iniciar timer:", e); await loadMachines(); }
  };

  const handleTimerPause = async (machineId, acumuladoMinutos) => {
    try {
      const data = { timer_ativo: true, timer_pausado: true, timer_acumulado: acumuladoMinutos };
      await base44.entities.FrotaACP.update(machineId, data);
    } catch (e) { console.error("Erro ao pausar timer:", e); await loadMachines(); }
  };

  const handleTimerResume = async (machineId) => {
    try {
      const now = new Date().toISOString();
      const machine = machines.find(m => m.id === machineId);
      const data = { timer_pausado: false, timer_ativo: true, timer_inicio: now, timer_acumulado: machine?.timer_acumulado || 0 };
      await base44.entities.FrotaACP.update(machineId, data);
    } catch (e) { console.error("Erro ao retomar timer:", e); await loadMachines(); }
  };

  const handleTimerStop = async (machineId, duracaoTotal) => {
    try {
      const machine = machines.find(m => m.id === machineId);
      const fim = new Date().toISOString();
      const duracaoMinutos = Math.round(duracaoTotal);
      const data = { 
        timer_ativo: false, 
        timer_pausado: false, 
        timer_fim: fim, 
        timer_duracao_minutos: duracaoMinutos 
      };
      
      await base44.entities.FrotaACP.update(machineId, data);

      if (machine?.serie && machine?.tecnico) {
        try {
          await base44.entities.TimeLog.create({
            machineId: machine.id,
            machineSerie: machine.serie,
            technician: machine.tecnico,
            startTime: machine.timer_inicio,
            endTime: fim,
            durationMinutes: duracaoMinutos,
            type: 'frota_acp'
          });
        } catch (logErr) { console.warn("Erro ao arquivar log de tempo:", logErr); }
      }
    } catch (e) { console.error("Erro ao parar timer:", e); await loadMachines(); }
  };

  const handleTimerReset = async (machineId) => {
    try {
      const data = { timer_ativo: false, timer_pausado: false, timer_inicio: null, timer_fim: null, timer_duracao_minutos: null, timer_acumulado: 0 };
      await base44.entities.FrotaACP.update(machineId, data);
    } catch (e) { console.error("Erro ao resetar timer:", e); await loadMachines(); }
  };


  const handleAssignMachine = async (machineId) => {
    if (!currentUser?.nome_tecnico) { alert("Perfil de técnico não configurado."); return; }
    try {
      const updateData = { estado: `em-preparacao-${currentUser.nome_tecnico}`, tecnico: currentUser.nome_tecnico, dataAtribuicao: new Date().toISOString() };
      setMachines(prevMachines => prevMachines.map(m => m.id === machineId ? { ...m, ...updateData } : m));
      await FrotaACP.update(machineId, updateData);
      syncMachineToPortal(machines.find(m => m.id === machineId)?.serie, updateData.estado);
      setMachineToAssign(null);
    } catch (error) { console.error("Erro ao atribuir máquina:", error); alert("Erro ao atribuir máquina. Tente novamente."); }
  };

  const handleMarkComplete = async (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine || !machine.tecnico) return;
    try {
      const updateData = { 
        estado: `concluida-${machine.tecnico}`, 
        dataConclusao: new Date().toISOString(),
        timer_ativo: false,
        timer_pausado: false
      };
      setMachines(prevMachines => prevMachines.map(m => m.id === machineId ? { ...m, ...updateData } : m));
      await FrotaACP.update(machineId, updateData);
      syncMachineToPortal(machine.serie, updateData.estado);
      await base44.entities.Notificacao.create({ userId: 'admin', message: `Máquina ${machine.serie} concluída`, machineId: machine.id, machineSerie: machine.serie, technicianName: machine.tecnico, type: 'machine_completed', isRead: false });
    } catch (error) { console.error("Erro ao marcar como concluída:", error); alert("Erro ao marcar como concluída. Tente novamente."); await loadMachines(); }
  };

  const handleToggleAguardaPecas = async (machineId, newValue) => {
    try {
      setMachines(prevMachines => prevMachines.map(m => m.id === machineId ? { ...m, aguardaPecas: newValue } : m));
      await FrotaACP.update(machineId, { aguardaPecas: newValue });
    } catch (error) { console.error("Erro ao alternar aguarda peças:", error); await loadMachines(); }
  };

  const handleAddObservation = async (machineId, texto) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    try {
      const newObs = { texto, autor: currentUser?.nome_tecnico || currentUser?.full_name || 'Anónimo', data: new Date().toISOString() };
      const updatedObs = [...(machine.observacoes || []), newObs];
      setMachines(prevMachines => prevMachines.map(m => m.id === machineId ? { ...m, observacoes: updatedObs } : m));
      await FrotaACP.update(machineId, { observacoes: updatedObs });
    } catch (error) { console.error("Erro ao adicionar observação:", error); await loadMachines(); }
  };

  const handleToggleTask = async (machineId, taskIndex) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    try {
      const updatedTasks = machine.tarefas.map((t, i) => i === taskIndex ? { ...t, concluida: !t.concluida } : t);
      setMachines(prevMachines => prevMachines.map(m => m.id === machineId ? { ...m, tarefas: updatedTasks } : m));
      await FrotaACP.update(machineId, { tarefas: updatedTasks });
    } catch (error) { console.error("Erro ao alternar tarefa:", error); await loadMachines(); }
  };

  const handleSelectMachine = (machine) => {
    setSelectedMachines(prev => prev.some(m => m.id === machine.id) ? prev.filter(m => m.id !== machine.id) : [...prev, machine]);
  };

  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const machineId = draggableId.replace('concluida-', '');
    const targetState = destination.droppableId;
    const machineBeingMoved = machines.find(m => m.id === machineId);
    if (!machineBeingMoved) return;

    let newEstado = targetState;
    let newTechnician = machineBeingMoved.tecnico;
    let newConclusaoDate = machineBeingMoved.dataConclusao;
    let newAtribuicaoDate = machineBeingMoved.dataAtribuicao;
    let updateData = {};

    if (targetState === 'a-fazer') {
      newTechnician = null;
      newConclusaoDate = null;
      newAtribuicaoDate = null;
    } else if (targetState.startsWith('em-preparacao-')) {
      newTechnician = targetState.replace('em-preparacao-', '');
      if (machineBeingMoved.tecnico !== newTechnician) newAtribuicaoDate = new Date().toISOString();
      newConclusaoDate = null;
    } else if (targetState.startsWith('concluida-')) {
      newTechnician = targetState.replace('concluida-', '');
      newEstado = `concluida-${newTechnician}`;
      newConclusaoDate = new Date().toISOString();
    } else return;

    if (userPermissions?.canMoveAnyMachine) {
      try {
        updateData = { estado: newEstado, tecnico: newTechnician, dataConclusao: newConclusaoDate };
        if (newAtribuicaoDate) updateData.dataAtribuicao = newAtribuicaoDate;
        await FrotaACP.update(machineId, updateData);
        await loadMachines();
      } catch (error) { console.error("Erro ao mover máquina:", error); alert("Erro ao mover máquina. Tente novamente."); }
      return;
    }

    if (targetState === 'a-fazer') {
      if (!(machineBeingMoved.tecnico === currentUser?.nome_tecnico && machineBeingMoved.estado?.startsWith('em-preparacao-'))) { alert("Você não tem permissão para mover esta máquina para 'A Fazer'."); return; }
    } else if (targetState.startsWith('em-preparacao-')) {
      const destTechId = targetState.replace('em-preparacao-', '');
      if (!userPermissions.canMoveMachineTo(destTechId, targetState)) { alert("Você não tem permissão para mover esta máquina."); return; }
    } else if (targetState.startsWith('concluida-')) {
      const destTechId = targetState.replace('concluida-', '');
      if (!userPermissions.canMoveMachineTo(destTechId, targetState)) { alert("Você não tem permissão para mover esta máquina."); return; }
    } else if (targetState === 'concluida-geral') { alert("Você não tem permissão para mover máquinas para a área geral de concluídas."); return; }

    try {
      updateData = { estado: newEstado, tecnico: newTechnician, dataConclusao: newConclusaoDate };
      if (newAtribuicaoDate) updateData.dataAtribuicao = newAtribuicaoDate;
      await FrotaACP.update(machineId, updateData);
      await loadMachines();
    } catch (error) { console.error("Erro ao mover máquina:", error); alert("Erro ao mover máquina. Tente novamente."); }
  };

  const filteredMachines = useMemo(() => {
    if (!searchQuery) return [];
    return machines.filter(m =>
      !m.arquivada &&
      (m.modelo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       m.serie?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [machines, searchQuery]);

  const aFazerMachines = useMemo(() => {
    const filtered = machines.filter(m => !m.arquivada && m.estado === 'a-fazer');
    return filtered.sort((a, b) => {
      if (a.prioridade && !b.prioridade) return -1;
      if (!a.prioridade && b.prioridade) return 1;
      return 0;
    });
  }, [machines]);

  const allConcluidaMachines = useMemo(() => {
    const concluidas = machines.filter(m => !m.arquivada && m.estado?.includes('concluida'));
    return concluidas.sort((a, b) => {
      const dateA = a.dataConclusao ? new Date(a.dataConclusao).getTime() : (a.updated_date ? new Date(a.updated_date).getTime() : 0);
      const dateB = b.dataConclusao ? new Date(b.dataConclusao).getTime() : (b.updated_date ? new Date(b.updated_date).getTime() : 0);
      return dateB - dateA;
    });
  }, [machines]);

  const myTechId   = currentUser?.nome_tecnico || null;
  const myTech     = TECHNICIANS.find(t => t.id === myTechId);
  const otherTechs = TECHNICIANS.filter(t => t.id !== myTechId);
  const isAdmin    = currentUser?.perfil === 'admin';

  const myMachines = useMemo(() => machines.filter(m => !m.arquivada && m.estado === `em-preparacao-${myTechId}`), [machines, myTechId]);
  const myConc     = useMemo(() => machines.filter(m => !m.arquivada && m.estado === `concluida-${myTechId}`), [machines, myTechId]);

  const D = {
    panel:  isDarkMode ? '#08080F' : '#F2F3F8',
    panel2: isDarkMode ? '#0D0D1C' : '#EAECF4',
    border: isDarkMode ? '#16162A' : '#C8CADC',
    borderHi: isDarkMode ? 'rgba(255,45,120,0.45)' : 'rgba(255,45,120,0.3)',
    text:   isDarkMode ? '#E4E6FF' : '#0B0C18',
    muted:  isDarkMode ? '#4A4A80' : '#666888',
    pink:   '#FF2D78',
    blue:   '#4D9FFF',
    purple: '#9B5CF6',
    green:  '#22C55E',
    amber:  '#F59E0B',
    navBg:  isDarkMode ? 'rgba(6,6,13,0.98)' : 'rgba(232,234,245,0.97)',
  };

  const panel = (accent, glow = false) => ({
    background: isDarkMode ? `linear-gradient(160deg, #09091500 0%, #0D0D1E 100%)` : D.panel,
    border: `1px solid ${isDarkMode ? accent + '28' : D.border}`,
    borderTop: `2px solid ${accent}`,
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: isDarkMode ? `0 0 ${glow ? '40px' : '18px'} ${accent}${glow ? '28' : '12'}, 0 4px 32px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.02)` : `0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)`,
  });

  const hdr = (accent) => ({
    padding: '10px 14px',
    borderBottom: `1px solid ${isDarkMode ? accent + '20' : D.border}`,
    background: isDarkMode ? `linear-gradient(90deg, ${accent}14 0%, transparent 80%)` : `linear-gradient(90deg, ${accent}08 0%, transparent 80%)`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'relative',
  });

  const badge = (color, val) => (
    <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', padding: '1px 8px', borderRadius: '20px', background: `${color}18`, color, border: `1px solid ${color}35` }}>{val}</span>
  );

  const scroll = (maxH) => ({ padding: '6px 8px', overflowY: 'auto', maxHeight: maxH, minHeight: '40px' });

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 60px', overflowX: 'hidden', maxWidth: '100vw', boxSizing: 'border-box' }}>
      <style>{`
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,45,120,0.5); border-radius: 2px; }
        .mini-scroll::-webkit-scrollbar { width: 2px; }
        .mini-scroll::-webkit-scrollbar-thumb { background: rgba(74,74,130,0.5); }
        @media (max-width: 600px) {
          .kanban-grid { grid-template-columns: 1fr !important; }
          .kanban-row { flex-direction: column !important; }
        }
      `}</style>

      <div ref={heroRef} style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '18px 16px 14px',
        background: isDarkMode ? 'linear-gradient(180deg, rgba(6,6,13,0.99) 0%, rgba(8,8,15,0.96) 100%)' : 'linear-gradient(180deg, rgba(228,230,240,0.99) 0%, rgba(232,234,245,0.96) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDarkMode ? 'rgba(255,45,120,0.2)' : 'rgba(255,45,120,0.15)'}`,
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent 0%, ${D.pink} 25%, ${D.blue} 75%, transparent 100%)`, opacity: isDarkMode ? 1 : 0.6 }} />
        <div style={{ position: 'relative' }}>
          <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/a35751fd9_Gemini_Generated_Image_scmohbscmohbscmo1.png" alt="WATCHER" style={{ width: '80px', height: '80px', objectFit: 'contain', filter: isDarkMode ? 'drop-shadow(0 0 18px rgba(255,45,120,0.8)) drop-shadow(0 0 32px rgba(77,159,255,0.3))' : 'drop-shadow(0 0 8px rgba(255,45,120,0.5))' }} />
          {isDarkMode && <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '1px solid rgba(255,45,120,0.25)', animation: 'cyber-pulse 2s ease-in-out infinite', pointerEvents: 'none' }} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '20px', fontWeight: 900, color: D.pink }}>[</span>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '20px', fontWeight: 900, letterSpacing: '0.2em', color: D.text }}>WATCHER</span>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '20px', fontWeight: 900, color: D.pink }}>]</span>
        </div>
        <div style={{ marginTop: '10px', width: '200px', height: '1px', background: `linear-gradient(90deg, transparent, ${D.pink} 30%, ${D.blue} 70%, transparent)`, opacity: isDarkMode ? 0.7 : 0.4 }} />
      </div>

      <div id="hero-spacer" style={{ height: 'var(--hero-height, 165px)', flexShrink: 0 }} />

      <DragDropContext onDragEnd={handleOnDragEnd}>
        {isLoading ? (
          <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: D.pink, fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em' }}>CARREGANDO SISTEMA...</div>
        ) : (
          <div style={{ padding: '0 10px' }}>
            {!isAdmin && myTech && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ ...panel(myTech.borderColor, true) }}>
                  <div style={{ ...hdr(myTech.borderColor) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: myTech.borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 12px ${myTech.borderColor}60` }}>
                        <UserIcon style={{ width: '12px', height: '12px', color: '#fff' }} />
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 900, letterSpacing: '0.1em', color: D.text }}>MINHA FILA: {myTech.name}</span>
                      {badge(myTech.borderColor, myMachines.length)}
                    </div>
                  </div>
                  <Droppable droppableId={`em-preparacao-${myTechId}`}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} style={{ ...scroll('60vh') }}>
                        {myMachines.map((machine, index) => (
                          <Draggable key={machine.id} draggableId={machine.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style }}>
                                <MachineCardTechnician machine={machine} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} techColor={myTech.borderColor} isDark={isDarkMode} isSelected={selectedMachines.some(sm => sm.id === machine.id)} onSelect={handleSelectMachine} onTimerStart={handleTimerStart} onTimerPause={handleTimerPause} onTimerResume={handleTimerResume} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {myMachines.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: D.muted, fontFamily: 'monospace', fontSize: '11px', opacity: 0.5 }}>SEM MÁQUINAS</div>}
                      </div>
                    )}
                  </Droppable>
                  <TechnicianCompletedSection machines={myConc} techId={myTechId} onOpenMachine={(m) => { setSelectedMachine(m); setShowObsModal(true); }} isDark={isDarkMode} />
                </div>
                <div style={{ ...panel(D.pink) }}>
                  <div style={{ ...hdr(D.pink) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wrench style={{ width: '13px', height: '13px', color: D.pink }} />
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: D.text }}>A FAZER</span>
                      {badge(D.pink, aFazerMachines.length)}
                    </div>
                  </div>
                  <Droppable droppableId="a-fazer">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} style={{ ...scroll('55vh') }}>
                        {aFazerMachines.map((machine, index) => (
                          <Draggable key={machine.id} draggableId={machine.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style }}>
                                <MachineCardCompact machine={machine} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} isDark={isDarkMode} onAssign={handleAssignMachine} showAssignButton={true} isSelected={selectedMachines.some(sm => sm.id === machine.id)} onSelect={handleSelectMachine} />
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
            )}

            {isAdmin && (
              <div className="kanban-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                <div style={{ ...panel(D.pink) }}>
                  <div style={{ ...hdr(D.pink) }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: D.text }}>A FAZER</span>
                    {badge(D.pink, aFazerMachines.length)}
                  </div>
                  <Droppable droppableId="a-fazer">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} style={{ ...scroll('70vh') }}>
                        {aFazerMachines.map((machine, index) => (
                          <Draggable key={machine.id} draggableId={machine.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style }}>
                                <MachineCardCompact machine={machine} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} isDark={isDarkMode} onAssign={() => {}} showAssignButton={false} isSelected={selectedMachines.some(sm => sm.id === machine.id)} onSelect={handleSelectMachine} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
                {TECHNICIANS.map(tech => {
                  const techMachines = machines.filter(m => !m.arquivada && m.estado === `em-preparacao-${tech.id}`);
                  return (
                    <div key={tech.id} style={{ ...panel(tech.borderColor) }}>
                      <div style={{ ...hdr(tech.borderColor) }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: D.text }}>{tech.name}</span>
                        {badge(tech.borderColor, techMachines.length)}
                      </div>
                      <Droppable droppableId={`em-preparacao-${tech.id}`}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} style={{ ...scroll('70vh') }}>
                            {techMachines.map((machine, index) => (
                              <Draggable key={machine.id} draggableId={machine.id} index={index}>
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style }}>
                                    <MachineCardTechnician machine={machine} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} techColor={tech.borderColor} isDark={isDarkMode} isSelected={selectedMachines.some(sm => sm.id === machine.id)} onSelect={handleSelectMachine} onTimerStart={handleTimerStart} onTimerPause={handleTimerPause} onTimerResume={handleTimerResume} />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DragDropContext>

      <ObservationsModal isOpen={showObsModal} onClose={() => setShowObsModal(false)} machine={selectedMachine} onAddObservation={handleAddObservation} onToggleTask={handleToggleTask} onTogglePriority={() => {}} onDelete={() => {}} currentUser={currentUser} userPermissions={userPermissions} onMarkComplete={handleMarkComplete} onToggleAguardaPecas={handleToggleAguardaPecas} allMachines={machines} onOpenEdit={() => {}} isDark={isDarkMode} onTimerStart={handleTimerStart} onTimerPause={handleTimerPause} onTimerResume={handleTimerResume} onTimerStop={handleTimerStop} onTimerReset={handleTimerReset} />
    </div>
  );
}
