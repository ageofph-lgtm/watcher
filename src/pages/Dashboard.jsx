import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FrotaACP, Pedido } from "@/entities/all";
import { Search, Wrench, Package, Sparkles, Repeat, CheckCircle2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/components/hooks/usePermissions";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import ImageUploadModal from "../components/dashboard/ImageUploadModal";
import BulkCreateModal from "../components/dashboard/BulkCreateModal";
import BackupManager from "../components/dashboard/BackupManager";
import EditMachineModal from "../components/dashboard/EditMachineModal";
import NotificationsHub from "../components/dashboard/NotificationsHub";
import ObservationsModal from "../components/dashboard/ObservationsModal";
import CreateMachineModal from "../components/dashboard/CreateMachineModal";
import MachineEditCard from "../components/dashboard/MachineEditCard";
import TimerButton, {
  useTimerElapsed,
  formatHMS,
  isTimerRunning,
  isTimerPaused,
  isTimerIdle,
  canControlTimer,
  getTimerElapsedSeconds,
  getPausaMotivo,
} from "../components/dashboard/TimerButton";
import { useTheme } from "../ThemeContext";
import MaquinaCard from "../components/watcher/MaquinaCard";
import MaquinaMiniCard from "../components/watcher/MaquinaMiniCard";
import AssignModal from "../components/modals/AssignModal";
import FullscreenSectionModal from "../components/modals/FullscreenSectionModal";
import { LayoutUserContext } from "../Layout";

import { TECHNICIANS } from "../lib/technicians";
import TechnicianCompletedSection from "../components/dashboard/TechnicianCompletedSection";

const TIPO_ICONS = {
  nova: { icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-100' },
  usada: { icon: Repeat, color: 'text-orange-600', bg: 'bg-orange-100' },
  aluguer: { icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
  'servico-interno': { icon: Wrench, color: 'text-slate-600', bg: 'bg-slate-200' }
};

// ── Tokens ATLAS por técnico (classes Tailwind literais) ──────────────────
const TECH_TOKEN = {
  raphael: { bar: 'bg-kv',   text: 'text-kv',   badge: 'text-kv bg-kv/15 border-kv/30' },
  nuno:    { bar: 'bg-ka',   text: 'text-ka',   badge: 'text-ka bg-ka/15 border-ka/30' },
  rogerio: { bar: 'bg-kz',   text: 'text-kz',   badge: 'text-kz bg-kz/15 border-kz/30' },
  yano:    { bar: 'bg-cpro', text: 'text-cpro', badge: 'text-cpro bg-cpro/15 border-cpro/30' },
};
const TK = (id) => TECH_TOKEN[id] || TECH_TOKEN.raphael;
const COL = 'glass border border-slate-700 rounded-lg overflow-hidden relative';
const COL_HDR = 'flex items-center justify-between px-3.5 py-2.5 border-b border-slate-700';
const AFAZER_BADGE = 'text-kv bg-kv/15 border-kv/30';
const CONCLUIDA_BADGE = 'text-cpro bg-cpro/15 border-cpro/30';

function CountBadge({ token, count }) {
  return <span className={`text-xs font-bold num px-2 py-0.5 rounded-full border ${token}`}>{count}</span>;
}


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

async function syncMachineToPortal(serie, novoEstado, forceStatus) {
  const novoStatus = forceStatus || watcherEstadoToPortalStatus(novoEstado);
  if (!novoStatus || !serie) return;
  try {
    // 1. Buscar todos os registos do Portal com este serial_number
    const resp = await fetch(`${PORTAL_API}?serial_number=${encodeURIComponent(serie)}&limit=50`, {
      headers: { "api_key": PORTAL_KEY }
    });
    const records = await resp.json();
    if (!Array.isArray(records) || records.length === 0) return;
    // 2. Actualizar cada registo encontrado
    await Promise.all(records.map(r =>
      fetch(`${PORTAL_API}/${r.id}`, {
        method: "PUT",
        headers: { "api_key": PORTAL_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus })
      })
    ));
    console.log(`[Portal sync] ${serie} → ${novoStatus} (${records.length} registo(s))`);
  } catch (e) {
    console.warn("[Portal sync] Falhou:", e.message);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// AssignModal e FullscreenSectionModal extraídos para src/components/modals/

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [prefillData, setPrefillData] = useState(null);
  // Auth: lê do localStorage directamente — não depende do contexto para renderizar
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('watcher_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.perfil) return parsed;
      }
    } catch {}
    return null;
  });

  // Sync bidirecional com LayoutUserContext (opcional, para logout centralizado)
  const layoutUser = React.useContext(LayoutUserContext);
  useEffect(() => {
    if (layoutUser?.user && layoutUser.user !== currentUser) {
      setCurrentUser(layoutUser.user);
    }
  }, [layoutUser?.user]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showObsModal, setShowObsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [machineToAssign, setMachineToAssign] = useState(null);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [machineToEdit, setMachineToEdit] = useState(null);
  const { isDark: isDarkMode } = useTheme();
  const [showAFazerFullscreen, setShowAFazerFullscreen] = useState(false);
  const [showConcluidaFullscreen, setShowConcluidaFullscreen] = useState(false);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [showMultiEditModal, setShowMultiEditModal] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [showPatrickLegacy, setShowPatrickLegacy] = useState(false);

  // ── Sistema de travão de horário ──────────────────────────────────────────
  const [clockBlock, setClockBlock] = useState(null); // null | "almoco" | "saida"
  const [confirmPresenca, setConfirmPresenca] = useState(null); // { machineId, resolve }

  const userPermissions = usePermissions(currentUser?.perfil, currentUser?.nome_tecnico);

  // ── Horários de saída por técnico ─────────────────────────────────────────
  const TECH_CUTOFF = {
    "rogerio": { h: 17, m: 0 },
    "yano":    { h: 17, m: 0 },
    "nuno":    { h: 17, m: 30 },
  };
  const DEFAULT_CUTOFF = { h: 17, m: 30 };

  // Pausa forçada de todos os timers a correr neste momento
  const forcarPausaGeral = React.useCallback(async (motivo) => {
    const running = machines.filter(m => isTimerRunning(m));
    for (const m of running) {
      const elapsed = getTimerElapsedSeconds(m);
      try {
        await base44.entities.FrotaACP.update(m.id, {
          timer_status: `paused:${motivo}`,
          timer_started_at: null,
          timer_accumulated_seconds: Math.round(elapsed),
        });
      } catch(e) { console.error("Erro pausa forçada:", e); }
    }
    if (running.length > 0) await loadMachines();
  }, [machines]);

  // Watchdog — corre a cada 30s e verifica horários
  useEffect(() => {
    const check = async () => {
      const now = new Date();
      const h = now.getHours();
      const min = now.getMinutes();
      const total = h * 60 + min;

      // Almoço: 12:30 → 13:30
      if (total >= 12 * 60 + 30 && total < 13 * 60 + 30) {
        if (clockBlock !== "almoco") {
          setClockBlock("almoco");
          await forcarPausaGeral("almoco");
        }
        return;
      }

      // Saída personalizada por técnico
      if (currentUser && !isAdminUser) {
        const nome = currentUser?.nome_tecnico?.toLowerCase();
        const cutoff = TECH_CUTOFF[nome] || DEFAULT_CUTOFF;
        const cutoffMin = cutoff.h * 60 + cutoff.m;
        if (total >= cutoffMin) {
          if (clockBlock !== "saida") {
            setClockBlock("saida");
            await forcarPausaGeral("fim_dia");
          }
          return;
        }
      }

      // Desbloquear almoço exactamente às 13:30 (timer NÃO reinicia — técnico fá-lo manualmente)
      if (clockBlock === "almoco" && total >= 13 * 60 + 30) {
        setClockBlock(null);
        // NÃO auto-iniciar timers — técnico pressiona Play quando estiver no posto
        return;
      }
    };

    check(); // executar imediatamente
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machines, clockBlock, currentUser]);

  // ── PendingWrites: evita que o polling sobrescreva escritas optimistas
  // recentes antes da DB ter tempo de confirmar (eventual consistency).
  // Map<machineId, expiresAt>
  const pendingWrites = useRef(new Map());

  const loadMachines = useCallback(async () => {
    try {
      const data = await FrotaACP.list('-created_date');
      setMachines(prev => {
        // Limpar entradas expiradas
        const now = Date.now();
        for (const [id, exp] of pendingWrites.current) {
          if (exp < now) pendingWrites.current.delete(id);
        }
        if (pendingWrites.current.size === 0) return data;
        // Manter o estado local (optimista) das máquinas com escrita em curso
        const prevById = new Map(prev.map(m => [m.id, m]));
        return data.map(serverM => {
          if (pendingWrites.current.has(serverM.id)) {
            return prevById.get(serverM.id) || serverM;
          }
          return serverM;
        });
      });
    } catch (error) { console.error("Erro ao carregar máquinas:", error); }
    setIsLoading(false);
  }, []);

  // ── writeAndConfirm: aplica update optimista + persiste na DB com guard
  // contra polling. O guard fica activo durante writeWindowMs (15s por
  // defeito) — tempo suficiente para a DB do Base44 propagar a alteração
  // para subsequentes reads. Não é encurtado após a confirmação para
  // evitar race com a eventual consistency.
  const writeAndConfirm = useCallback(async (machineId, data, writeWindowMs = 15000) => {
    pendingWrites.current.set(machineId, Date.now() + writeWindowMs);
    setMachines(prev => prev.map(m => m.id === machineId ? { ...m, ...data } : m));
    try {
      await base44.entities.FrotaACP.update(machineId, data);
    } catch (e) {
      pendingWrites.current.delete(machineId);
      throw e;
    }
  }, []);

  // loadUser removido — auth gerida pelo Layout via LayoutUserContext

  useEffect(() => { loadMachines(); }, [loadMachines]);

  // Polling: refrescar a lista a cada 15s (a subscrição real-time já cobre updates imediatos)
  useEffect(() => {
    const interval = setInterval(() => { loadMachines(); }, 15000);
    return () => clearInterval(interval);
  }, [loadMachines]);

  // Subscrição em tempo real para mudanças de máquinas — com debounce para evitar flood
  useEffect(() => {
    let unsubscribe = null;
    let debounceTimer = null;
    const debouncedLoad = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadMachines(), 1500);
    };
    const subscribe = async () => {
      try {
        unsubscribe = await base44.entities.FrotaACP.subscribe((event) => {
          if (event.type === 'update' || event.type === 'create' || event.type === 'delete') {
            debouncedLoad();
          }
        });
      } catch (e) {
        console.warn('Subscrição em tempo real indisponível:', e.message);
      }
    };
    subscribe();
    return () => {
      clearTimeout(debounceTimer);
      if (unsubscribe) unsubscribe();
    };
  }, [loadMachines]);

  const handleCreateMachine = async (machineData) => {
    try {
      // Usar o estado local em vez de fazer um novo list() para evitar rate limit
      const existingMachines = machines;
      const duplicates = existingMachines.filter(m => m.serie === machineData.serie);
      if (duplicates.length > 0 && !machineData.confirmedDuplicate) {
        // Lança erro com info dos duplicados — apanhado pelo CreateMachineModal
        const err = new Error('duplicate');
        err.duplicates = duplicates;
        throw err;
      }
      const newMachine = { ...machineData, ano: machineData.ano ? String(machineData.ano) : null, estado: 'a-fazer' };
      if (duplicates.length > 0) {
        newMachine.historicoCriacoes = duplicates.map(d => ({ dataCriacao: d.created_date, dataConclusao: d.dataConclusao, estado: d.estado }));
      }
      const created = await FrotaACP.create(newMachine);

      // ── Sync automático → Portal da Frota ACP2 ──────────────────────────
      try {
        // Determinar action baseado no recondicionamento
        let portalAction = "";
        if (newMachine.recondicao?.bronze && newMachine.recondicao?.prata) portalAction = "Recon Bronze + Prata";
        else if (newMachine.recondicao?.bronze) portalAction = "Recon Bronze";
        else if (newMachine.recondicao?.prata)  portalAction = "Recon Prata";
        // Verificar se já existe no Portal (evitar duplicado)
        // Verificar APENAS no ACP2 — pode existir no ACP1 com tarefa diferente
        const chkResp = await fetch(`${PORTAL_API}?serial_number=${encodeURIComponent(newMachine.serie)}&frota=acp2&limit=10`, {
          headers: { "api_key": PORTAL_KEY }
        });
        const existing = await chkResp.json();
        if (!Array.isArray(existing) || existing.length === 0) {
          await fetch(PORTAL_API, {
            method: "POST",
            headers: { "api_key": PORTAL_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({
              equipment:     newMachine.modelo,
              serial_number: newMachine.serie,
              status:        "A começar",
              action:        portalAction,
              frota:         "acp2"
            })
          });
          console.log(`[Portal sync] Criada no ACP2: ${newMachine.serie}`);
        }
      } catch(e) { console.warn("[Portal sync create]", e.message); }
      // ─────────────────────────────────────────────────────────────────────

      // Adicionar ao estado local imediatamente, sem re-fetch (evita 429)
      setMachines(prev => [created || { ...newMachine, id: Date.now().toString(), created_date: new Date().toISOString() }, ...prev]);
      setShowCreateModal(false);
      setPrefillData(null);
      setDuplicateWarning(null);
    } catch (error) { if (error.duplicates) throw error; console.error("Erro ao criar máquina:", error); }
  };

  const handleImageUploadSuccess = (extractedData) => {
    setShowImageModal(false);
    setPrefillData(extractedData);
    setShowCreateModal(true);
  };

  const handleAddObservation = async (machineId, texto) => {
    try {
      const machine = machines.find(m => m.id === machineId);
      const newObs = { texto, autor: currentUser?.full_name || 'Utilizador', data: new Date().toISOString() };
      setMachines(prevMachines => prevMachines.map(m => m.id === machineId ? { ...m, observacoes: [...(m.observacoes || []), newObs] } : m));
      await FrotaACP.update(machineId, { observacoes: [...(machine.observacoes || []), newObs] });
    } catch (error) { console.error("Erro ao adicionar observação:", error); await loadMachines(); }
  };

  const handleToggleTask = useCallback(async (machineId, taskIndex) => {
    try {
      const machine = machines.find(m => m.id === machineId);
      if (!machine || !machine.tarefas || !machine.tarefas[taskIndex]) throw new Error("Tarefa não encontrada");
      const updatedTarefas = machine.tarefas.map((t, i) => i === taskIndex ? { ...t, concluida: !t.concluida } : { ...t });
      await FrotaACP.update(machineId, { tarefas: updatedTarefas });
      setMachines(prevMachines => prevMachines.map(m => m.id === machineId ? { ...m, tarefas: updatedTarefas } : m));
    } catch (error) { console.error("Erro ao atualizar tarefa:", error); throw error; }
  }, [machines]);

  const handleTogglePriority = async (machineId, newPriorityValue) => {
    try {
      setMachines(prevMachines => prevMachines.map(m => m.id === machineId ? { ...m, prioridade: newPriorityValue } : m));
      await FrotaACP.update(machineId, { prioridade: newPriorityValue });
    } catch (error) { console.error("Erro ao atualizar prioridade:", error); await loadMachines(); }
  };

  const handleDeleteMachine = async (machineId) => {
    if (!userPermissions?.canDeleteMachine) { alert("Você não tem permissão para apagar máquinas."); return; }
    try {
      await FrotaACP.delete(machineId);
      setShowObsModal(false);
      setSelectedMachine(null);
      await loadMachines();
    } catch (error) { console.error("Erro ao apagar máquina:", error); alert("Erro ao apagar máquina. Tente novamente."); }
  };

  const handleAssignMachine = async (machine) => {
    if (!currentUser) return;
    if (userPermissions?.canMoveAnyMachine) {
      setMachineToAssign(machine);
      setShowAssignModal(true);
      } else if (userPermissions?.canMoveMachineToOwnColumn && currentUser?.nome_tecnico) {
      try {
        const novoEstadoSelf = `em-preparacao-${currentUser.nome_tecnico}`;
        await FrotaACP.update(machine.id, { 
          estado: novoEstadoSelf, 
          tecnico: currentUser.nome_tecnico, 
          dataAtribuicao: new Date().toISOString(),
          dataConclusao: null
        });
        await base44.entities.Notificacao.create({ userId: 'admin', message: `${currentUser.nome_tecnico.charAt(0).toUpperCase() + currentUser.nome_tecnico.slice(1)} atribuiu máquina ${machine.serie} - Abrir OS!`, machineId: machine.id, machineSerie: machine.serie, technicianName: currentUser.nome_tecnico, type: 'self_assigned', isRead: false });
        syncMachineToPortal(machine.serie, novoEstadoSelf);
        await loadMachines();
      } catch (error) { console.error("Erro ao atribuir máquina:", error); alert("Erro ao atribuir máquina. Tente novamente."); }
    }
  };

  const handleAssignToTechnician = async (techId) => {
    if (!machineToAssign) return;
    try {
      const novoEstadoAdmin = `em-preparacao-${techId}`;
      await FrotaACP.update(machineToAssign.id, { 
        estado: novoEstadoAdmin, 
        tecnico: techId, 
        dataAtribuicao: new Date().toISOString(),
        dataConclusao: null // Resetar data de conclusão para máquinas que voltam à preparação
      });
      await base44.entities.Notificacao.create({ userId: techId, message: `Nova máquina atribuída: ${machineToAssign.serie}`, machineId: machineToAssign.id, machineSerie: machineToAssign.serie, technicianName: currentUser?.full_name || 'Admin', type: 'os_assignment', isRead: false });
      syncMachineToPortal(machineToAssign.serie, novoEstadoAdmin);
      await loadMachines();
      setShowAssignModal(false);
      setMachineToAssign(null);
    } catch (error) { console.error("Erro ao atribuir máquina:", error); alert("Erro ao atribuir máquina. Tente novamente."); }
  };

  const handleMarkComplete = async (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    
    // Se não houver técnico, tentar derivar do estado (ex: em-preparacao-yano)
    let tech = machine.tecnico;
    if (!tech && machine.estado && machine.estado.includes('preparacao-')) {
      tech = machine.estado.split('-').pop();
    }
    
    if (!tech) return;

    try {
      // Auto-pausar timer ao concluir: preserva o tempo acumulado e desliga o "running"
      const elapsed = Math.round(getTimerElapsedSeconds(machine));
      const updateData = {
        estado: `concluida-${tech}`,
        tecnico: tech,
        dataConclusao: new Date().toISOString(),
        timer_status: "paused",
        timer_started_at: null,
        timer_accumulated_seconds: elapsed,
      };
      await writeAndConfirm(machineId, updateData);
      syncMachineToPortal(machine.serie, updateData.estado);
      await base44.entities.Notificacao.create({ userId: 'admin', message: `Máquina ${machine.serie} concluída`, machineId: machine.id, machineSerie: machine.serie, technicianName: machine.tecnico, type: 'machine_completed', isRead: false });
    } catch (error) { console.error("Erro ao marcar como concluída:", error); alert("Erro ao marcar como concluída. Tente novamente."); await loadMachines(); }
  };

  const handleToggleAguardaPecas = async (machineId, newValue) => {
    try {
      setMachines(prevMachines => prevMachines.map(m => m.id === machineId ? { ...m, aguardaPecas: newValue } : m));
      await FrotaACP.update(machineId, { aguardaPecas: newValue });
      // Sync Portal da Frota — "Aguarda material" quando ativo, "Em progresso" quando resolvido
      const machine = machines.find(m => m.id === machineId);
      if (machine?.serie) {
        const portalStatus = newValue ? "Aguarda material" : watcherEstadoToPortalStatus(machine.estado) || "Em progresso";
        syncMachineToPortal(machine.serie, null, portalStatus);
      }
    } catch (error) { console.error("Erro ao atualizar status de aguarda peças:", error); alert("Erro ao atualizar status. Tente novamente."); await loadMachines(); }
  };

  const handleArchivePatrickMachines = async () => {
    const patrickMachines = machines.filter(m => m.estado?.includes('patrick') && !m.arquivada);
    if (patrickMachines.length === 0) { alert('Não há máquinas do Patrick para arquivar.'); return; }
    if (!window.confirm(`Arquivar ${patrickMachines.length} máquina(s) do Patrick? Esta ação irá removê-las do painel principal.`)) return;
    try {
      await Promise.all(patrickMachines.map(m => FrotaACP.update(m.id, { arquivada: true })));
      await loadMachines();
      alert(`${patrickMachines.length} máquina(s) arquivada(s) com sucesso.`);
    } catch (error) { console.error('Erro ao arquivar máquinas:', error); alert('Erro ao arquivar máquinas. Tente novamente.'); }
  };


  const handleSelectMachine = (machine) => {
    if (!userPermissions?.canDeleteMachine) return;
    setSelectedMachines(prev => {
      const isAlreadySelected = prev.some(m => m.id === machine.id);
      return isAlreadySelected ? prev.filter(m => m.id !== machine.id) : [...prev, machine];
    });
  };

  const handleOpenMultiEdit = () => { if (selectedMachines.length > 0) setShowMultiEditModal(true); };
  const handleCloseMultiEdit = () => { setShowMultiEditModal(false); setSelectedMachines([]); };

  const handleMachineUpdate = async (machineId, updateData) => {
    try {
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, ...updateData } : m));
      await FrotaACP.update(machineId, updateData);
      if (updateData.estado && selectedMachine?.serie) {
        syncMachineToPortal(selectedMachine.serie, updateData.estado);
      }
    } catch (error) { console.error("Erro ao atualizar máquina:", error); await loadMachines(); }
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
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      throw error; // re-lança para o modal mostrar feedback
    }
  };


  // ── TIMER HANDLERS ────────────────────────────────────────────────────────
  // Modelo na DB (campos REAIS do schema FrotaACP):
  //   timer_status              "idle" | "running" | "paused"
  //   timer_started_at          (ISO | null)
  //   timer_accumulated_seconds (number)
  //   timer_started_by          (string)

  const isAdminUser = currentUser?.perfil === 'admin';

  const handleTimerPlay = async (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    if (!canControlTimer(machine, currentUser, isAdminUser)) return;
    if (isTimerRunning(machine)) return;

    // ── Bloquear se estiver em período de travão ──────────────────────────
    if (clockBlock === "almoco") {
      alert("⏸ Horário de almoço — timer bloqueado até às 13:30h.");
      return;
    }
    if (clockBlock === "saida") {
      alert("⏸ Horário de saída — timer bloqueado para hoje.");
      return;
    }

    // ── Verificar horário de saída personalizado antes de iniciar ─────────
    const now = new Date();
    const total = now.getHours() * 60 + now.getMinutes();
    const nome = currentUser?.nome_tecnico?.toLowerCase();
    const cutoff = TECH_CUTOFF[nome] || DEFAULT_CUTOFF;
    const cutoffMin = cutoff.h * 60 + cutoff.m;
    if (total >= cutoffMin && !isAdminUser) {
      alert(`⏸ O teu horário de saída (${cutoff.h}:${String(cutoff.m).padStart(2,"0")}h) já passou.`);
      return;
    }

    // ── Confirmação de presença (timer que foi pausado automaticamente) ───
    const foiPausadoAuto = machine.timer_status?.includes("almoco") || machine.timer_status?.includes("fim_dia");
    if (foiPausadoAuto) {
      const confirmado = window.confirm(
        `⚠ Este timer foi pausado automaticamente.\n\nEstás mesmo no posto de trabalho e a iniciar a máquina ${machine.serie}?`
      );
      if (!confirmado) return;
    }

    const data = {
      timer_status: "running",
      timer_started_at: new Date().toISOString(),
      timer_accumulated_seconds: Number(machine.timer_accumulated_seconds) || 0,
      timer_started_by: currentUser?.nome_tecnico || currentUser?.email || currentUser?.full_name || "unknown",
    };
    try {
      await writeAndConfirm(machineId, data);
    } catch (e) {
      console.error("Erro ao iniciar timer:", e);
      await loadMachines();
    }
  };

  const handleTimerPause = async (machineId, pausaMotivo = "outros") => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    if (!canControlTimer(machine, currentUser, isAdminUser)) return;
    if (!isTimerRunning(machine)) return;
    const elapsed = getTimerElapsedSeconds(machine);
    // Codificamos o motivo dentro do timer_status: "paused:aguarda_pecas"
    // Assim não precisamos de campo extra no schema da entidade FrotaACP
    const statusComMotivo = pausaMotivo && pausaMotivo !== "outros"
      ? `paused:${pausaMotivo}`
      : "paused";
    const data = {
      timer_status: statusComMotivo,
      timer_started_at: null,
      timer_accumulated_seconds: Math.round(elapsed),
    };
    try {
      await writeAndConfirm(machineId, data);
    } catch (e) {
      console.error("Erro ao pausar timer:", e);
      await loadMachines();
    }
  };

  const handleTimerReset = async (machineId) => {
    if (!isAdminUser) return;
    const data = {
      timer_status: "idle",
      timer_started_at: null,
      timer_accumulated_seconds: 0,
      timer_started_by: null,
    };
    try {
      await writeAndConfirm(machineId, data);
    } catch (e) {
      console.error("Erro ao resetar timer:", e);
      await loadMachines();
    }
  };

  const handleTimerImprevisto = async (machineId, imprevisto) => {
    const horasExtra = Number(imprevisto.horas_extra);
    if (!horasExtra || horasExtra <= 0) {
      console.warn("[IMPREVISTO] horas_extra inválido:", imprevisto);
      return;
    }
    const segsExtra = Math.round(horasExtra * 3600);

    // Buscar dados FRESCOS da DB — evitar stale state após polling
    let estimadoAtual = 0;
    let imprevistos   = [];
    try {
      const lista = await FrotaACP.filter({ id: machineId });
      const fresh  = lista?.[0];
      if (fresh) {
        estimadoAtual = Number(fresh.tempo_estimado_segundos) || 0;
        imprevistos   = Array.isArray(fresh.imprevistos) ? [...fresh.imprevistos] : [];
      }
    } catch (_) {
      // fallback: usar state local
      const stale = machines.find(m => m.id === machineId);
      if (stale) {
        estimadoAtual = Number(stale.tempo_estimado_segundos) || 0;
        imprevistos   = Array.isArray(stale.imprevistos) ? [...stale.imprevistos] : [];
      }
    }

    const novoEstimado = estimadoAtual + segsExtra;
    imprevistos.push({ ...imprevisto, horas_extra: horasExtra, data: new Date().toISOString() });

    console.log(`[IMPREVISTO] +${horasExtra}h (+${segsExtra}s) | ${estimadoAtual}s → ${novoEstimado}s (${(novoEstimado/3600).toFixed(1)}h total)`);

    // Update optimista no state local imediatamente
    setMachines(prev => prev.map(m => m.id === machineId
      ? { ...m, tempo_estimado_segundos: novoEstimado, imprevistos }
      : m));

    // Persistir na DB directamente (sem writeAndConfirm guard de 15s)
    try {
      await FrotaACP.update(machineId, { tempo_estimado_segundos: novoEstimado, imprevistos });
    } catch (e) {
      console.error("[IMPREVISTO] Erro ao persistir:", e);
      await loadMachines();
    }
  };

  const handleRemoveImprevisto = async (machineId, index) => {
    let estimadoAtual = 0;
    let imprevistos = [];
    try {
      const lista = await FrotaACP.filter({ id: machineId });
      const fresh = lista?.[0];
      if (fresh) {
        estimadoAtual = Number(fresh.tempo_estimado_segundos) || 0;
        imprevistos = Array.isArray(fresh.imprevistos) ? [...fresh.imprevistos] : [];
      }
    } catch (_) {
      const stale = machines.find(m => m.id === machineId);
      if (stale) {
        estimadoAtual = Number(stale.tempo_estimado_segundos) || 0;
        imprevistos = Array.isArray(stale.imprevistos) ? [...stale.imprevistos] : [];
      }
    }
    if (index < 0 || index >= imprevistos.length) return;
    const removed = imprevistos[index];
    const segsRemoved = Math.round(Number(removed.horas_extra || 0) * 3600);
    const novoEstimado = Math.max(0, estimadoAtual - segsRemoved);
    const newImprevistos = imprevistos.filter((_, i) => i !== index);
    setMachines(prev => prev.map(m => m.id === machineId
      ? { ...m, tempo_estimado_segundos: novoEstimado, imprevistos: newImprevistos }
      : m));
    try {
      await FrotaACP.update(machineId, { tempo_estimado_segundos: novoEstimado, imprevistos: newImprevistos });
    } catch (e) {
      console.error("[REMOVE_IMPREVISTO] Erro:", e);
      await loadMachines();
    }
  };

    const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    let machineId = draggableId;
    let targetState = destination.droppableId;
    if (draggableId.startsWith('concluida-')) machineId = draggableId.replace('concluida-', '');
    const machineBeingMoved = machines.find(m => m.id === machineId);
    if (!machineBeingMoved) return;

    let updateData = {};
    let newTechnician = null;
    let newEstado = targetState;
    let newConclusaoDate = null;
    let newAtribuicaoDate = null;

    if (targetState === 'a-fazer') { newTechnician = null; newEstado = 'a-fazer'; newConclusaoDate = null; }
    else if (targetState === 'concluida-geral') { newTechnician = null; newEstado = `concluida-geral`; newConclusaoDate = new Date().toISOString(); }
    else if (targetState.startsWith('em-preparacao-')) {
      newTechnician = targetState.replace('em-preparacao-', '');
      newEstado = `em-preparacao-${newTechnician}`;
      newConclusaoDate = null;
      if (!machineBeingMoved.dataAtribuicao) newAtribuicaoDate = new Date().toISOString();
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
      // 1º: prioritárias sempre primeiro
      if (a.prioridade && !b.prioridade) return -1;
      if (!a.prioridade && b.prioridade) return 1;
      // 2º: datas mais próximas primeiro (previsao_inicio)
      const dA = a.previsao_inicio ? new Date(a.previsao_inicio).getTime() : Infinity;
      const dB = b.previsao_inicio ? new Date(b.previsao_inicio).getTime() : Infinity;
      return dA - dB;
    });
  }, [machines]);

  const allConcluidaMachines = useMemo(() => {
    const concluidas = machines.filter(m => !m.arquivada && m.estado?.includes('concluida'));
    return concluidas.sort((a, b) => {
      // Usar APENAS dataConclusao para ordenar; se não existir, usar created_date como fallback
      // (NOT updated_date, pois essa muda a cada edição e causa subidas indevidas)
      const dateA = a.dataConclusao ? new Date(a.dataConclusao).getTime() : (a.created_date ? new Date(a.created_date).getTime() : 0);
      const dateB = b.dataConclusao ? new Date(b.dataConclusao).getTime() : (b.created_date ? new Date(b.created_date).getTime() : 0);
      return dateB - dateA;
    });
  }, [machines]);

  const patrickMachinesCount = useMemo(() => machines.filter(m => m.estado?.includes('patrick') && !m.arquivada).length, [machines]);
  const patrickConcluidaMachines = useMemo(() => machines.filter(m => m.estado?.startsWith('concluida-patrick')), [machines]);

  // ── Derived per-user ──────────────────────────────────────────────────────
  const myTechId   = currentUser?.nome_tecnico || null;
  const myTech     = TECHNICIANS.find(t => t.id === myTechId);
  const otherTechs = TECHNICIANS.filter(t => t.id !== myTechId);
  const isAdmin    = currentUser?.perfil === 'admin';

  // Máquinas por técnico - Filtragem resiliente (usa estado OU campo técnico)
  const myMachines = useMemo(() => {
    const filtered = machines.filter(m => 
      !m.arquivada && 
      (m.estado === `em-preparacao-${myTechId}` || (m.estado?.startsWith('em-preparacao') && m.tecnico === myTechId))
    );
    return filtered.sort((a, b) => {
      const aActive = isTimerRunning(a) || isTimerPaused(a) ? 0 : 1;
      const bActive = isTimerRunning(b) || isTimerPaused(b) ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      // running antes de paused
      if (isTimerRunning(a) && !isTimerRunning(b)) return -1;
      if (!isTimerRunning(a) && isTimerRunning(b)) return 1;
      return 0;
    });
  }, [machines, myTechId]);

  const myConc = useMemo(() => machines.filter(m => 
    !m.arquivada && 
    (m.estado === `concluida-${myTechId}` || (m.estado === 'concluida' && m.tecnico === myTechId))
  ), [machines, myTechId]);

  // ── Helpers de UI ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-16 overflow-x-hidden max-w-full box-border">
      {/* ══ TOOLBAR ADMIN ════════ */}
      {(userPermissions?.canCreateMachine || userPermissions?.canDeleteMachine) && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center px-4 py-2.5 border-b border-slate-700 glass-2 relative z-50">
          {userPermissions?.canDeleteMachine && (
            <button onClick={() => setShowBackupManager(true)} className="px-3.5 py-1.5 rounded bg-slate-700/40 text-slate-300 border border-slate-600 text-xs font-bold tracking-wide hover:bg-slate-700/60">◈ BACKUP</button>
          )}
          {userPermissions?.canCreateMachine && (<>
            <button onClick={() => setShowBulkCreateModal(true)} className="px-3.5 py-1.5 rounded bg-kz/10 text-kz border border-kz/35 text-xs font-bold tracking-wide hover:bg-kz/20">▦ MASSIVA</button>
            <button onClick={() => setShowImageModal(true)} className="px-3.5 py-1.5 rounded bg-caut/10 text-caut border border-caut/35 text-xs font-bold tracking-wide hover:bg-caut/20">◎ IA FOTO</button>
            <button onClick={() => { setPrefillData(null); setShowCreateModal(true); }} className="px-4 py-1.5 rounded bg-amber-500 text-slate-900 text-xs font-bold tracking-wide hover:bg-amber-500/90">＋ NOVA</button>
          </>)}
        </div>
      )}

      {/* ══ TOOLBAR SECUNDÁRIA ═══════════ */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5 relative z-10 px-4 pt-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <NotificationsHub currentUser={currentUser} userPermissions={userPermissions} />
          {selectedMachines.length > 0 && userPermissions?.canDeleteMachine && (
            <button onClick={handleOpenMultiEdit} className="px-3 py-1.5 rounded bg-kz text-white text-xs font-bold">EDITAR {selectedMachines.length}</button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-2.5 pb-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="BUSCAR SÉRIE / MODELO..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-2 pl-8 pr-8 glass border rounded-lg text-xs text-slate-100 outline-none transition ${searchQuery ? 'border-kv/60' : 'border-slate-600'}`} />
          {searchQuery && (
            <button onPointerDown={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm leading-none">×</button>
          )}
        </div>
      </div>

      {/* ══ SEARCH ══════════════════════════════════════════════════════════ */}
      {searchQuery ? (
        <div className="flex flex-col gap-1 px-4">
          {filteredMachines.map(m => <MaquinaCard key={m.id} machine={m} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} />)}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>

          {/* ═════ VISÃO TÉCNICO ═════ */}
          {!isAdmin && myTech && (<>

            {/* ROW 1 — MEU QUADRO + A FAZER */}
            <div className="kanban-grid grid grid-cols-2 gap-2.5 mb-2.5 px-4">

              {/* MEU QUADRO */}
              <div className={COL}>
                <div className={`h-0.5 w-full ${TK(myTechId).bar}`} />
                <div className={COL_HDR}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${TK(myTechId).bar}`}>
                      <span className="font-mono text-xs font-black text-white">{myTech.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-mono text-xs font-bold tracking-wide text-slate-100">{myTech.name}</div>
                      <div className={`font-mono text-[8px] tracking-wide ${TK(myTechId).text}`}>MEU QUADRO</div>
                    </div>
                    <CountBadge token={TK(myTechId).badge} count={myMachines.length} />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cpro shadow-[0_0_6px_rgb(var(--c-pro)/0.9)]" />
                    <span className="text-[8px] font-mono text-cpro">ONLINE</span>
                  </div>
                </div>
                <Droppable droppableId={`em-preparacao-${myTechId}`}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="p-1.5 overflow-y-auto max-h-[55vh] min-h-[40px]">
                      {myMachines.map((machine, index) => (
                        <Draggable key={machine.id} draggableId={machine.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                              <MaquinaCard machine={machine} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} isSelected={selectedMachines.some(sm => sm.id === machine.id)} onSelect={handleSelectMachine} onTimerPlay={handleTimerPlay} onTimerPause={handleTimerPause} onTimerReset={handleTimerReset} onTimerImprevisto={handleTimerImprevisto} onRemoveImprevisto={handleRemoveImprevisto} currentUser={currentUser} isAdmin={isAdmin} isDragging={snapshot.isDragging} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {myMachines.length === 0 && <div className="py-10 text-center text-slate-400 font-mono text-xs opacity-50"><div className="text-2xl mb-2">⚙</div>SEM MÁQUINAS</div>}
                    </div>
                  )}
                </Droppable>
                <Droppable droppableId={`concluida-${myTechId}`}>
                  {(provided) => <div ref={provided.innerRef} {...provided.droppableProps} className="hidden">{provided.placeholder}</div>}
                </Droppable>
                <TechnicianCompletedSection machines={myConc} techId={myTechId} onOpenMachine={(m) => { setSelectedMachine(m); setShowObsModal(true); }} isDark={isDarkMode} />
              </div>

              {/* A FAZER */}
              <div className={COL}>
                <div className="h-0.5 w-full bg-kv" />
                <div className={COL_HDR}>
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-kv" />
                    <span className="font-mono text-xs font-bold tracking-wide text-slate-100">A FAZER</span>
                    <CountBadge token={AFAZER_BADGE} count={aFazerMachines.length} />
                  </div>
                  <button onClick={() => setShowAFazerFullscreen(true)} className="text-slate-400 hover:text-slate-100"><Maximize2 className="w-3.5 h-3.5" /></button>
                </div>
                <Droppable droppableId="a-fazer">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="p-1.5 overflow-y-auto max-h-[55vh] min-h-[40px]">
                      {aFazerMachines.map((machine, index) => (
                        <Draggable key={machine.id} draggableId={machine.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                              <MaquinaCard machine={machine} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} onAssign={handleAssignMachine} showAssignButton={userPermissions?.canMoveAnyMachine || userPermissions?.canMoveMachineToOwnColumn} isSelected={selectedMachines.some(sm => sm.id === machine.id)} onSelect={handleSelectMachine} onTogglePriority={handleTogglePriority} canSetPriority={userPermissions?.canSetPriority} isDragging={snapshot.isDragging} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {aFazerMachines.length === 0 && <div className="py-8 text-center text-slate-400 font-mono text-xs opacity-50">FILA VAZIA</div>}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* ROW 2 — CONCLUÍDA */}
            <div className={`${COL} mb-4 mx-4`}>
              <div className="h-0.5 w-full bg-cpro" />
              <div className={COL_HDR}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cpro" />
                  <span className="font-mono text-xs font-bold tracking-wide text-slate-100">CONCLUÍDA</span>
                  <CountBadge token={CONCLUIDA_BADGE} count={allConcluidaMachines.length} />
                </div>
                <button onClick={() => setShowConcluidaFullscreen(true)} className="text-slate-400 hover:text-slate-100"><Maximize2 className="w-3.5 h-3.5" /></button>
              </div>
              <Droppable droppableId="concluida-geral">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2 p-2.5 max-h-[215px] overflow-y-auto">
                    {allConcluidaMachines.map((machine, index) => (
                      <Draggable key={machine.id} draggableId={`concluida-${machine.id}`} index={index} isDragDisabled={!userPermissions?.canMoveAnyMachine}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                            <MaquinaMiniCard machine={machine} tech={TECHNICIANS.find(t => t.id === machine.tecnico)} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* ROW 3 — OUTROS TÉCNICOS */}
            <div className="kanban-grid grid grid-cols-3 gap-3 px-4 pb-5">
              {otherTechs.map(tech => {
                const emPrepRaw = machines.filter(m => !m.arquivada && (m.estado === `em-preparacao-${tech.id}` || (m.estado?.startsWith('em-preparacao') && m.tecnico === tech.id)));
                const emPrep = [...emPrepRaw].sort((a, b) => {
                  const aA = isTimerRunning(a) || isTimerPaused(a) ? 0 : 1;
                  const bA = isTimerRunning(b) || isTimerPaused(b) ? 0 : 1;
                  if (aA !== bA) return aA - bA;
                  if (isTimerRunning(a) && !isTimerRunning(b)) return -1;
                  if (!isTimerRunning(a) && isTimerRunning(b)) return 1;
                  return 0;
                });
                const concl = machines.filter(m => !m.arquivada && (m.estado === `concluida-${tech.id}` || (m.estado === 'concluida' && m.tecnico === tech.id)));
                return (
                  <div key={tech.id} className={COL}>
                    <div className={`h-0.5 w-full ${TK(tech.id).bar}`} />
                    <div className={COL_HDR}>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${TK(tech.id).bar}`}>
                          <span className="font-mono text-[10px] font-black text-white">{tech.name.charAt(0)}</span>
                        </div>
                        <span className="font-mono text-xs font-bold tracking-wide text-slate-100 flex-1">{tech.name}</span>
                        <CountBadge token={TK(tech.id).badge} count={emPrep.length} />
                        {concl.length > 0 && <span className="text-[9px] text-slate-400 font-mono">✓{concl.length}</span>}
                      </div>
                    </div>
                    <Droppable droppableId={`em-preparacao-${tech.id}`}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="p-1.5 overflow-y-auto max-h-[150px] min-h-[32px]">
                          {emPrep.map((machine, index) => (
                            <Draggable key={machine.id} draggableId={machine.id} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                                  <MaquinaCard machine={machine} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} isSelected={selectedMachines.some(sm => sm.id === machine.id)} onSelect={handleSelectMachine} onTimerPlay={handleTimerPlay} onTimerPause={handleTimerPause} onTimerReset={handleTimerReset} onTimerImprevisto={handleTimerImprevisto} onRemoveImprevisto={handleRemoveImprevisto} currentUser={currentUser} isAdmin={isAdmin} isDragging={snapshot.isDragging} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {emPrep.length === 0 && <div className="py-2 text-center text-slate-400 font-mono text-[9px] opacity-50">em espera</div>}
                        </div>
                      )}
                    </Droppable>
                    <Droppable droppableId={`concluida-${tech.id}`}>
                      {(provided) => <div ref={provided.innerRef} {...provided.droppableProps} className="hidden">{provided.placeholder}</div>}
                    </Droppable>
                    <TechnicianCompletedSection machines={concl} techId={tech.id} onOpenMachine={(m) => { setSelectedMachine(m); setShowObsModal(true); }} isDark={isDarkMode} />
                  </div>
                );
              })}
            </div>
          </>)}

          {/* ═════ VISÃO ADMIN ═════ */}
          {isAdmin && (<>

            {/* ROW 1 — A FAZER + CONCLUÍDA */}
            <div className="kanban-grid grid grid-cols-2 gap-2.5 mb-2.5 px-4">

              <div className={COL}>
                <div className="h-0.5 w-full bg-kv" />
                <div className={COL_HDR}>
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-kv" />
                    <span className="font-mono text-xs font-bold tracking-wide text-slate-100">A FAZER</span>
                    <CountBadge token={AFAZER_BADGE} count={aFazerMachines.length} />
                  </div>
                  <button onClick={() => setShowAFazerFullscreen(true)} className="text-slate-400 hover:text-slate-100"><Maximize2 className="w-3.5 h-3.5" /></button>
                </div>
                <Droppable droppableId="a-fazer">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="p-1.5 overflow-y-auto max-h-[42vh] min-h-[40px]">
                      {aFazerMachines.map((machine, index) => (
                        <Draggable key={machine.id} draggableId={machine.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                              <MaquinaCard machine={machine} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} onAssign={handleAssignMachine} showAssignButton={true} isSelected={selectedMachines.some(sm => sm.id === machine.id)} onSelect={handleSelectMachine} onTogglePriority={handleTogglePriority} canSetPriority={userPermissions?.canSetPriority} isDragging={snapshot.isDragging} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <div className={COL}>
                <div className="h-0.5 w-full bg-cpro" />
                <div className={COL_HDR}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cpro" />
                    <span className="font-mono text-xs font-bold tracking-wide text-slate-100">CONCLUÍDA</span>
                    <CountBadge token={CONCLUIDA_BADGE} count={allConcluidaMachines.length} />
                  </div>
                  <button onClick={() => setShowConcluidaFullscreen(true)} className="text-slate-400 hover:text-slate-100"><Maximize2 className="w-3.5 h-3.5" /></button>
                </div>
                <Droppable droppableId="concluida-geral">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="p-1.5 overflow-y-auto max-h-[42vh] min-h-[40px]">
                      {allConcluidaMachines.map((machine, index) => (
                        <Draggable key={machine.id} draggableId={`concluida-${machine.id}`} index={index} isDragDisabled={!userPermissions?.canMoveAnyMachine}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style} className="mb-1.5">
                              <MaquinaMiniCard machine={machine} tech={TECHNICIANS.find(t => t.id === machine.tecnico)} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} />
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

            {/* ROW 2 — 4 Técnicos em 2x2 */}
            <div className="kanban-grid grid grid-cols-2 gap-2.5 px-4">
              {TECHNICIANS.map(tech => {
                const emPrepRaw = machines.filter(m => !m.arquivada && m.estado === `em-preparacao-${tech.id}`);
                const emPrep = [...emPrepRaw].sort((a, b) => {
                  const aA = isTimerRunning(a) || isTimerPaused(a) ? 0 : 1;
                  const bA = isTimerRunning(b) || isTimerPaused(b) ? 0 : 1;
                  if (aA !== bA) return aA - bA;
                  if (isTimerRunning(a) && !isTimerRunning(b)) return -1;
                  if (!isTimerRunning(a) && isTimerRunning(b)) return 1;
                  return 0;
                });
                const concl = machines.filter(m => !m.arquivada && m.estado === `concluida-${tech.id}`);
                return (
                  <div key={tech.id} className={COL}>
                    <div className={`h-0.5 w-full ${TK(tech.id).bar}`} />
                    <div className={COL_HDR}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${TK(tech.id).bar}`}>
                          <span className="font-mono text-xs font-black text-white">{tech.name.charAt(0)}</span>
                        </div>
                        <span className="font-mono text-xs font-bold tracking-wide text-slate-100">{tech.name}</span>
                        <CountBadge token={TK(tech.id).badge} count={emPrep.length} />
                        {concl.length > 0 && <span className="text-[9px] text-slate-400 font-mono ml-auto">✓{concl.length}</span>}
                      </div>
                    </div>
                    <Droppable droppableId={`em-preparacao-${tech.id}`}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="p-1.5 overflow-y-auto max-h-[30vh] min-h-[40px]">
                          {emPrep.map((machine, index) => (
                            <Draggable key={machine.id} draggableId={machine.id} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                                  <MaquinaCard machine={machine} onClick={(m) => { setSelectedMachine(m); setShowObsModal(true); }} isSelected={selectedMachines.some(sm => sm.id === machine.id)} onSelect={handleSelectMachine} onTimerPlay={handleTimerPlay} onTimerPause={handleTimerPause} onTimerReset={handleTimerReset} onTimerImprevisto={handleTimerImprevisto} onRemoveImprevisto={handleRemoveImprevisto} currentUser={currentUser} isAdmin={isAdmin} isDragging={snapshot.isDragging} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {emPrep.length === 0 && <div className="py-5 text-center text-slate-400 font-mono text-xs opacity-50">em espera</div>}
                        </div>
                      )}
                    </Droppable>
                    <Droppable droppableId={`concluida-${tech.id}`}>
                      {(provided) => <div ref={provided.innerRef} {...provided.droppableProps} className="hidden">{provided.placeholder}</div>}
                    </Droppable>
                    <TechnicianCompletedSection machines={concl} techId={tech.id} onOpenMachine={(m) => { setSelectedMachine(m); setShowObsModal(true); }} isDark={isDarkMode} />
                  </div>
                );
              })}
            </div>
          </>)}

          {showMultiEditModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
              <div className="glass border border-slate-700 rounded-xl p-5 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="page-title text-slate-100">EDITAR {selectedMachines.length} MÁQUINAS</h3>
                  <button onClick={() => setShowMultiEditModal(false)} className="text-slate-400 hover:text-slate-100 text-lg leading-none">✕</button>
                </div>
                {selectedMachines.map(machine => (
                  <MachineEditCard key={machine.id} machine={machine} isDark={isDarkMode}
                    onUpdate={async (field, value) => {
                      try {
                        const updateData = { [field]: value };
                        if (field === 'estado') {
                          let tecnico = null;
                          if (value.includes('preparacao-') || value.includes('concluida-')) {
                            const parts = value.split('-');
                            tecnico = parts[parts.length - 1];
                          }
                          updateData.tecnico = tecnico;
                        }
                        await FrotaACP.update(machine.id, updateData);
                        setSelectedMachines(prev => prev.map(m => m.id === machine.id ? { ...m, ...updateData } : m));
                        await loadMachines();
                      } catch (e) { console.error(e); }
                    }}
                    onRemove={() => handleSelectMachine(machine)}
                    onViewDetails={() => { setSelectedMachine(machine); setShowObsModal(true); }}
                  />
                ))}
              </div>
            </div>
          )}

        </DragDropContext>
      )}

      <FullscreenSectionModal isOpen={showAFazerFullscreen} onClose={() => setShowAFazerFullscreen(false)} title="A Fazer" machines={aFazerMachines} icon={Wrench} onOpenMachine={(m) => { setSelectedMachine(m); setShowObsModal(true); }} onAssign={handleAssignMachine} userPermissions={userPermissions} />
      <FullscreenSectionModal isOpen={showConcluidaFullscreen} onClose={() => setShowConcluidaFullscreen(false)} title="Concluída" machines={allConcluidaMachines} icon={CheckCircle2} onOpenMachine={(m) => { setSelectedMachine(m); setShowObsModal(true); }} userPermissions={userPermissions} />
      {showObsModal && selectedMachine && (
        <ObservationsModal
          isOpen={true}
          machine={selectedMachine}
          allMachines={machines}
          onOpenEdit={(m) => { setMachineToEdit(m); setShowEditModal(true); setShowObsModal(false); setSelectedMachine(null); }}
          onClose={() => { setShowObsModal(false); setSelectedMachine(null); }}
          onTimerPlay={handleTimerPlay}
          onTimerPause={handleTimerPause}
          onTimerReset={handleTimerReset}
          onTimerImprevisto={handleTimerImprevisto}
          isAdmin={isAdmin}
          onAddObservation={handleAddObservation}
          onToggleTask={async (taskIdx) => {
            const updated = [...(selectedMachine.tarefas || [])];
            updated[taskIdx] = { ...updated[taskIdx], concluida: !updated[taskIdx].concluida };
            await FrotaACP.update(selectedMachine.id, { tarefas: updated });
            await loadMachines();
          }}
          onTogglePriority={async () => {
            await FrotaACP.update(selectedMachine.id, { prioridade: !selectedMachine.prioridade });
            await loadMachines();
          }}
          onToggleAguardaPecas={async () => {
            await FrotaACP.update(selectedMachine.id, { aguardaPecas: !selectedMachine.aguardaPecas });
            await loadMachines();
          }}
          onMarkComplete={async () => {
            await handleMarkComplete(selectedMachine.id);
            setShowObsModal(false);
            setSelectedMachine(null);
            await loadMachines();
          }}
          onDelete={async () => {
            if (window.confirm('Apagar esta máquina?')) {
              await FrotaACP.delete(selectedMachine.id);
              setShowObsModal(false);
              setSelectedMachine(null);
              await loadMachines();
            }
          }}
          currentUser={currentUser}
          userPermissions={userPermissions}
          isDark={isDarkMode}
        />
      )}
      <AssignModal isOpen={showAssignModal} onClose={() => { setShowAssignModal(false); setMachineToAssign(null); }} machine={machineToAssign} onAssign={handleAssignToTechnician} />
      {showCreateModal && <CreateMachineModal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setPrefillData(null); }} onSubmit={handleCreateMachine} prefillData={prefillData} isDark={isDarkMode} />}
      {showImageModal && <ImageUploadModal isOpen={showImageModal} onClose={() => setShowImageModal(false)} onMachineDetected={(data) => { setPrefillData(data); setShowImageModal(false); setShowCreateModal(true); }} isDark={isDarkMode} />}
      {showBulkCreateModal && <BulkCreateModal isOpen={showBulkCreateModal} onClose={() => setShowBulkCreateModal(false)} onSuccess={() => { loadMachines(); setShowBulkCreateModal(false); }} isDark={isDarkMode} />}
      {showEditModal && machineToEdit && <EditMachineModal isOpen={showEditModal} machine={machineToEdit} onClose={() => { setShowEditModal(false); setMachineToEdit(null); }} onSave={(data) => handleEditSave(machineToEdit.id, data)} isDark={isDarkMode} isAdmin={isAdmin} />}
      {showBackupManager && <BackupManager isOpen={showBackupManager} onClose={() => setShowBackupManager(false)} onSuccess={() => loadMachines()} isDark={isDarkMode} />}
    </div>
  );
}