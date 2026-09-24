import React, { useState, useEffect, useCallback } from "react";
import { FrotaACP, OrdemServico, Notificacao } from "@/entities/all";
import { Truck, Star, Plus, Camera, Search, HardHat, Package2, Cog, Layers, CheckCircle2, CalendarX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import CreateACPModal from "../components/frota/CreateACPModal";
import MachineDetailsModal from "../components/frota/MachineDetailsModal";
import ImageUploadModal from "../components/dashboard/ImageUploadModal";
import CreateOSModal from "../components/dashboard/CreateOSModal";
import OriginSelectionModal from "../components/dashboard/OriginSelectionModal";
import MachineSpecsModal from "../components/frota/MachineSpecsModal";
import BackupManager from "../components/frota/BackupManager";
import ReserveMachineModal from "../components/frota/ReserveMachineModal";
import FilterScrollers from "../components/frota/FilterScrollers";
import ThemeSwitcher from "../components/watcher/ThemeSwitcher";
import ConeIcon from "../components/watcher/ConeIcon";
import { getEstado, getTipo } from "../components/watcher/constants";

// NOTE: The 'angled-clip' class used throughout this file is assumed to be defined externally in a global CSS file
// or via a Tailwind CSS plugin. For example, it's might use a `clip-path` property:
// .angled-clip {
//   clip-path: polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%);
//   // Adjust values for desired angle
// }

const STATUS_COLORS = {
  'Disponível': "bg-blue-100 text-blue-800 border-blue-200",
  'Preparada': "bg-green-100 text-green-800 border-green-200",
  // 'Reservada' status removed as it's now handled by a separate 'reserva' field
  'Em Aluguer': "bg-purple-100 text-purple-800 border-purple-200",
  'Em Manutenção': "bg-red-100 text-red-800 border-red-200"
};

const CATEGORY_ICONS = {
  'Empilhador': HardHat,
  'Retrateis': Layers,
  'Order Picker': Package2,
  'Stacker': Cog,
  'Outros': Truck
};

const getMachineCategory = (modelo) => {
  if (!modelo) return "Outros";
  const m = modelo.toUpperCase();

  if (m.startsWith('R')) {
    return "Empilhador";
  }
  if (m.startsWith('F')) {
    return "Retrateis";
  }
  if (m.startsWith('O') || m.startsWith('L')) {
    return "Order Picker";
  }
  if (m.startsWith('E')) {
    return "Stacker";
  }

  return "Outros";
};

const KpiTile = ({ label, value, accent = "text-slate-100" }) => (
  <div className="glass border border-slate-700 rounded-lg p-4">
    <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
    <div className={`kpi-num text-2xl font-bold ${accent}`}>{value}</div>
  </div>
);

export default function FrotaPage({ userPermissions }) {
  const [machines, setMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("novas");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals for MACHINE creation
  const [showCreateMachineModal, setShowCreateMachineModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [prefillData, setPrefillData] = useState(null);

  // MODIFIED state for specs modal
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [machineForSpecs, setMachineForSpecs] = useState(null);

  // Modals for ORDER creation
  const [showCreateOSModal, setShowCreateOSModal] = useState(false);
  const [osTargetMachine, setOsTargetMachine] = useState(null);

  // Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);

  // New state for origin selection flow
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [creationFlow, setCreationFlow] = useState(null);
  const [modalPurpose, setModalPurpose] = useState('create');

  // New state for reservation modal
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveTargetMachine, setReserveTargetMachine] = useState(null);

  const handleEditMachine = useCallback((machine) => {
    setPrefillData(null); 
    setEditingMachine(machine); 
    setShowCreateMachineModal(true);
  }, []);

  const loadMachines = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await FrotaACP.list('-created_date');

      const machinesWithCategories = data.map(m => {
        const categoria = m.categoria || getMachineCategory(m.modelo);
        return {
          ...m,
          categoria: categoria
        };
      });

      setMachines(machinesWithCategories);
    } catch (error) {
      console.error("Erro ao carregar frota:", error);
    }

    if (isManualRefresh) {
      setRefreshing(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const filterMachinesBySearch = useCallback(() => {
    if (!searchQuery) {
      setFilteredMachines([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = machines.filter(machine => {
      const basicMatch =
        machine.modelo?.toLowerCase().includes(query) ||
        machine.serie?.toLowerCase().includes(query) ||
        machine.estado?.toLowerCase().includes(query) ||
        machine.origem?.toLowerCase().includes(query) ||
        machine.categoria?.toLowerCase().includes(query);

      let specsMatch = false;
      if (machine.caracteristicas) {
        const specs = machine.caracteristicas;
        specsMatch =
          ((query.includes('rodas brancas') || query.includes('pneus brancos')) && specs.corPneus === 'branco') ||
          ((query.includes('rodas pretas') || query.includes('pneus pretos')) && specs.corPneus === 'preto') ||
          (query.includes('3 vias') && specs.viasMastro === 3) ||
          (query.includes('4 vias') && specs.viasMastro === 4) ||
          (query.includes('5 vias') && specs.viasMastro === 5) ||
          (query.includes('triplex') && specs.mastro === 'triplex') ||
          (query.includes('telescopico') && specs.mastro === 'telescopico') ||
          (query.includes('niho') && specs.mastro === 'niho') ||
          (query.includes('alavanca') && specs.joystick === 'alavanca') ||
          (query.includes('minilever') && specs.joystick === 'minilever') ||
          (query.includes('4plus') && specs.joystick === '4plus') ||
          (query.includes('fingertrip') && specs.joystick === 'fingertrip') ||
          (query.includes('posicionador') && specs.acessorio?.toLowerCase().includes('posicionador')) ||
          (query.includes('sideshift') && specs.acessorio?.toLowerCase().includes('sideshift')) ||
          (query.includes('pinca') && specs.acessorio?.toLowerCase().includes('pinca')) ||
          (query.includes('volteador') && specs.acessorio?.toLowerCase().includes('volteador'));
      }

      return basicMatch || specsMatch;
    });

    setFilteredMachines(filtered);
  }, [machines, searchQuery]);

  useEffect(() => {
    filterMachinesBySearch();
  }, [searchQuery, machines, filterMachinesBySearch]);

  useEffect(() => {
    loadMachines();
    const interval = setInterval(() => loadMachines(), 30000);
    return () => clearInterval(interval);
  }, [loadMachines]);

  useEffect(() => {
    let startY = 0;
    let isPulling = false;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      isPulling = window.scrollY === 0;
    };

    const handleTouchMove = (e) => {
      if (!isPulling) return;

      const currentY = e.touches[0].clientY;
      const diffY = currentY - startY;

      if (diffY > 100 && !refreshing) {
        setRefreshing(true);
        loadMachines(true);
        isPulling = false;
      }
    };

    const handleTouchEnd = () => {
      isPulling = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [loadMachines, refreshing]);

  const handleCreateOrUpdateMachine = async (machineData) => {
    setShowCreateMachineModal(false);
    setIsLoading(true);

    try {
      const categoria = getMachineCategory(machineData.modelo);
      let finalData = { ...machineData, categoria };
      
      if (editingMachine) {
        // Log status change to history
        if (finalData.estado !== editingMachine.estado) {
          let newHistoryEntry;
          
          // Se a máquina estava "Em Aluguer" e agora vai para outro estado - registar retorno
          if (editingMachine.estado === 'Em Aluguer' && finalData.estado !== 'Em Aluguer') {
            // Calcular dias alugada se possível
            let diasAlugada = null;
            if (editingMachine.dataInicioAluguer) {
              const dataInicio = new Date(editingMachine.dataInicioAluguer);
              const dataFim = new Date();
              diasAlugada = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
            }
            
            newHistoryEntry = {
              tipo: 'retorno_cliente',
              data: new Date().toISOString(),
              descricao: diasAlugada 
                ? `Retorno do aluguer registado. Esteve alugada ${diasAlugada} dias. Estado alterado para '${finalData.estado}'`
                : `Retorno do aluguer registado. Estado alterado para '${finalData.estado}'`,
              responsavel: userPermissions?.currentUser?.full_name || 'Sistema',
              diasUtilizacao: diasAlugada
            };
            
            // Limpar a data de início do aluguer
            finalData.dataInicioAluguer = null;
            
          } 
          // Se a máquina vai para "Em Aluguer" - registar saída
          else if (finalData.estado === 'Em Aluguer' && editingMachine.estado !== 'Em Aluguer') {
            newHistoryEntry = {
              tipo: 'saida_cliente',
              data: new Date().toISOString(),
              descricao: `Máquina saiu para aluguer. Estado alterado de '${editingMachine.estado || 'N/D'}' para 'Em Aluguer'`,
              responsavel: userPermissions?.currentUser?.full_name || 'Sistema'
            };
            
            // Registar a data de início do aluguer
            finalData.dataInicioAluguer = new Date().toISOString();
            
          }
          // Qualquer outra mudança de estado
          else {
            newHistoryEntry = {
              tipo: 'estado_change',
              data: new Date().toISOString(),
              descricao: `Estado alterado de '${editingMachine.estado || 'N/D'}' para '${finalData.estado}'`,
              responsavel: userPermissions?.currentUser?.full_name || 'Sistema'
            };
          }
          
          finalData.historico = [...(editingMachine.historico || []), newHistoryEntry];
        }

        await FrotaACP.update(editingMachine.id, finalData);
        
        // Após atualizar dados básicos, abrir modal de características para edição
        const updatedMachine = { ...editingMachine, ...finalData };
        setMachineForSpecs(updatedMachine);
        setShowSpecsModal(true);
        setEditingMachine(null);
      } else {
        // Para novas máquinas, se status é 'Em Aluguer', definir dataInicioAluguer
        if (finalData.estado === 'Em Aluguer') {
          finalData.dataInicioAluguer = new Date().toISOString();
        }

        const existingMachines = await FrotaACP.filter({ serie: finalData.serie });

        if (existingMachines.length > 0) {
          const existingMachine = existingMachines[0];

          if (existingMachine.estado === 'Em Aluguer') {
            const proceed = window.confirm(
              `Esta máquina (${existingMachine.modelo} - ${existingMachine.serie}) está "Em Aluguer".\n\nDeseja registar o seu retorno e alterar o estado para "Disponível"?`
            );

            if (proceed) {
              // Calcular dias alugada
              let diasAlugada = null;
              if (existingMachine.dataInicioAluguer) {
                const dataInicio = new Date(existingMachine.dataInicioAluguer);
                const dataFim = new Date();
                diasAlugada = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
              }

              const newHistoryEntry = {
                tipo: 'retorno_cliente',
                data: new Date().toISOString(),
                descricao: diasAlugada 
                  ? `Retorno de aluguer registado via novo registo. Esteve alugada ${diasAlugada} dias.`
                  : 'Retorno de aluguer registado via novo registo de máquina.',
                responsavel: userPermissions?.currentUser?.full_name || 'Sistema',
                diasUtilizacao: diasAlugada
              };
              
              await FrotaACP.update(existingMachine.id, {
                estado: 'Disponível',
                historico: [...(existingMachine.historico || []), newHistoryEntry],
                dataInicioAluguer: null // Limpar dataInicioAluguer upon return
              });
              alert(`Retorno da máquina ${existingMachine.serie} registado com sucesso!${diasAlugada ? ` (${diasAlugada} dias alugada)` : ''}`);
            } else {
              alert("Registo cancelado pelo utilizador.");
            }
          } else {
            alert(`Erro: Já existe uma máquina registada com o número de série "${finalData.serie}".\nNão é possível duplicar o registo.`);
          }
        } else {
          const newMachine = await FrotaACP.create(finalData);
          setMachineForSpecs(newMachine);
          setShowSpecsModal(true);
        }
      }
    } catch (error) {
      console.error("Erro ao guardar máquina:", error);
      alert("Ocorreu um erro ao guardar a máquina.");
    } finally {
      setIsLoading(false);
      setPrefillData(null);
      loadMachines(true); // Always reload after any create/update attempt
    }
  };

  const handleSpecsSubmit = async (specs) => {
    if (!machineForSpecs) return;
    
    setIsLoading(true);
    setShowSpecsModal(false);

    try {
      await FrotaACP.update(machineForSpecs.id, { caracteristicas: specs });
      await loadMachines();
    } catch (error) {
      console.error("Erro ao atualizar especificações:", error);
      alert("Ocorreu um erro ao guardar as especificações.");
    } finally {
      setIsLoading(false);
      setMachineForSpecs(null);
    }
  };


  const handleDeleteMachine = async (machineId) => {
    try {
      await FrotaACP.delete(machineId);
      await loadMachines();
    } catch (error) {
      console.error("Erro ao eliminar máquina:", error);
    }
  };

  const handleImageUploadSuccess = (extractedData) => {
    setShowImageModal(false);
    if (modalPurpose === 'search') {
      setSearchQuery(extractedData.serie || '');
      setModalPurpose('create'); // Reset purpose
    } else {
      setPrefillData({ ...extractedData, origem: selectedOrigin });
      setEditingMachine(null); // Ensure no editing machine is active
      setShowCreateMachineModal(true);
    }
  };

  const handleOriginSelected = (origin) => {
    setSelectedOrigin(origin);
    setShowOriginModal(false);

    if (creationFlow === 'manual') {
      setPrefillData({ origem: origin });
      setShowCreateMachineModal(true);
    } else if (creationFlow === 'ia') {
      setModalPurpose('create');
      setShowImageModal(true);
    }
  };

  const handleOpenOSModal = (machine) => {
    setOsTargetMachine(machine);
    setShowCreateOSModal(true);
  };

  const handleCreateOS = async (osData) => {
    if (!osTargetMachine) return;

    try {
      await FrotaACP.update(osTargetMachine.id, { estado: 'Em Manutenção' });

      const newOS = await OrdemServico.create({
        ...osData,
        modelo: osTargetMachine?.modelo,
        serie: osTargetMachine?.serie, 
        ano: osTargetMachine?.ano,
        acpMachineId: osTargetMachine?.id,
        origemMaquina: osTargetMachine?.origem,
        caracteristicasMaquina: osTargetMachine?.caracteristicas,
        status: 'a-fazer',
        historico: [{
          acao: 'O.S. criada a partir da frota',
          data: new Date().toISOString(),
          usuario: userPermissions?.currentUser?.full_name || 'Sistema',
          detalhes: `Ordem de serviço criada para a máquina ${osTargetMachine?.modelo} - ${osTargetMachine?.serie}`
        }]
      });

      await Notificacao.create({
        userId: 'all',
        message: `Nova O.S. criada para ${newOS.modelo} (a partir da frota)`,
        osId: newOS.id,
        type: 'new_os'
      });

      setShowCreateOSModal(false);
      setOsTargetMachine(null);
      await loadMachines();

    } catch (error) {
      console.error("Erro ao criar Ordem de Serviço a partir da frota:", error);
    }
  };

  const handleBackupComplete = (message) => {
    console.log('Backup operation completed:', message);
  };

  const handleManualRefresh = () => {
    loadMachines(true);
  };

  const handleReserveMachine = (machine) => {
    setReserveTargetMachine(machine);
    setShowReserveModal(true);
  };

  const handleConfirmReservation = async (machineId, reservationData) => {
    try {
      // Find the machine by ID to get its current data, especially existing history.
      const machine = machines.find(m => m.id === machineId);
      if (!machine) {
        throw new Error("Máquina não encontrada para reserva.");
      }

      // The reservation details are expected to be nested under a 'reserva' key in the incoming reservationData
      const reservationDetails = reservationData.reserva;
      
      const newHistoryEntry = {
        tipo: 'reserva',
        data: new Date().toISOString(),
        descricao: `Máquina reservada para ${reservationDetails.cliente} por ${reservationDetails.comercial}. De ${reservationDetails.dataInicio} a ${reservationDetails.dataFim}.`,
        cliente: reservationDetails.cliente,
        comercial: reservationDetails.comercial,
        dataInicio: reservationDetails.dataInicio,
        dataFim: reservationDetails.dataFim,
        responsavel: userPermissions?.currentUser?.full_name || 'Sistema'
      };
      
      // Update the machine with the new reservation data and history.
      // Crucially, the 'estado' field is NOT modified here; it remains independent of the reservation.
      await FrotaACP.update(machineId, {
        reserva: reservationDetails, // Store the reservation details directly in the 'reserva' field
        historico: [...(machine.historico || []), newHistoryEntry]
      });

      await loadMachines(); // Reload all machines to reflect the change
      setShowReserveModal(false);
      setReserveTargetMachine(null);
    } catch (error) {
      console.error("Erro ao reservar máquina:", error);
      alert("Ocorreu um erro ao reservar a máquina.");
    }
  };

  const handleCancelReservation = async (machineId) => {
    if (!window.confirm("Tem a certeza de que deseja cancelar a reserva desta máquina?")) {
      return;
    }

    try {
      const machine = machines.find(m => m.id === machineId);
      if (!machine) throw new Error("Máquina não encontrada.");

      const newHistoryEntry = {
        tipo: 'cancelar_reserva',
        data: new Date().toISOString(),
        descricao: `Reserva para o cliente ${machine.reserva.cliente} foi cancelada.`,
        responsavel: userPermissions?.currentUser?.full_name || 'Sistema'
      };

      await FrotaACP.update(machineId, {
        reserva: null, // Remove the reservation object
        historico: [...(machine.historico || []), newHistoryEntry]
      });

      await loadMachines(true);
      alert("Reserva cancelada com sucesso!");
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error);
      alert("Ocorreu um erro ao cancelar a reserva.");
    }
  };


  const novasMachines = machines.filter(m => m.origem === 'nova');
  const stsMachines = machines.filter(m => m.origem === 'sts');
  const utsMachines = machines.filter(m => m.origem === 'uts');

  const handleMainTabChange = (newTab) => {
    setActiveTab(newTab);
    setSelectedCategory('all');
    setSelectedStatus('all'); 
  };
  
  const getCurrentTabMachines = useCallback(() => {
    switch(activeTab) {
      case 'novas': return novasMachines;
      case 'sts': return stsMachines;
      case 'uts': return utsMachines;
      default: return [];
    }
  }, [activeTab, novasMachines, stsMachines, utsMachines]);

  const getFinalFilteredMachines = useCallback(() => {
    let currentMachines = getCurrentTabMachines();

    if (selectedCategory !== 'all') {
      currentMachines = currentMachines.filter(m => (m.categoria || 'Outros') === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      if (selectedStatus === 'Reservada') {
        currentMachines = currentMachines.filter(m => m.reserva && m.reserva.cliente);
      } else {
        currentMachines = currentMachines.filter(m => m.estado === selectedStatus);
      }
    }
    
    return currentMachines;
  }, [getCurrentTabMachines, selectedCategory, selectedStatus]);

  const kpiExec = machines.filter((m) => m.estado?.startsWith("em-preparacao")).length;
  const kpiAFazer = machines.filter((m) => m.estado === "a-fazer").length;
  const kpiConcluidas = machines.filter((m) => m.estado?.startsWith("concluida")).length;
  const displayMachines = searchQuery ? filteredMachines : getFinalFilteredMachines();

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="page-title text-slate-100">Frota</h1>
          <div className="ml-auto">
            <ThemeSwitcher compact />
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiTile label="Total de máquinas" value={machines.length} />
          <KpiTile label="Em execução" value={kpiExec} accent="text-cexe" />
          <KpiTile label="A fazer" value={kpiAFazer} accent="text-kn" />
          <KpiTile label="Concluídas" value={kpiConcluidas} accent="text-cpro" />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar NS, modelo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-900/70 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {userPermissions?.hasPermission?.("canManageUsers") && (
            <BackupManager onBackupComplete={handleBackupComplete} />
          )}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="bg-slate-700 text-slate-200 hover:bg-slate-600 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {refreshing ? "Atualizando..." : "Atualizar"}
          </button>
          {userPermissions?.canCreateMachine && (
            <>
              <button
                onClick={() => { setCreationFlow("ia"); setShowOriginModal(true); }}
                className="bg-slate-700 text-slate-200 hover:bg-slate-600 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Criar com IA</span>
                <span className="sm:hidden">IA</span>
              </button>
              <button
                onClick={() => { setCreationFlow("manual"); setPrefillData(null); setEditingMachine(null); setShowOriginModal(true); }}
                className="bg-amber-500 text-slate-900 hover:bg-amber-500/90 rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar Manualmente</span>
                <span className="sm:hidden">Adicionar</span>
              </button>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {[["novas", "Novas", novasMachines.length], ["sts", "STS", stsMachines.length], ["uts", "UTS", utsMachines.length]].map(([key, lbl, count]) => (
            <button
              key={key}
              onClick={() => handleMainTabChange(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === key ? "bg-amber-500 text-slate-900" : "bg-slate-700 text-slate-200 hover:bg-slate-600"}`}
            >
              {lbl}
              <span className={`px-1.5 py-0.5 rounded text-xs ${activeTab === key ? "bg-slate-900/20" : "bg-slate-600"}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <FilterScrollers
          machines={getCurrentTabMachines()}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
        />

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="glass border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-400 uppercase border-b border-slate-700">
                  <tr>
                    <th className="px-3 py-2">NS</th>
                    <th className="px-3 py-2">Modelo</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Cone</th>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {displayMachines.map((m) => {
                    const estadoCfg = getEstado(m.estado);
                    const tipoCfg = getTipo(m);
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-slate-700/50 hover:bg-slate-800/40 transition cursor-pointer"
                        onClick={() => { setSelectedMachine(m); setShowDetailsModal(true); }}
                      >
                        <td className="px-3 py-2 num font-bold text-slate-100">{m.serie}</td>
                        <td className="px-3 py-2 text-slate-300">{m.modelo}</td>
                        <td className="px-3 py-2">
                          {estadoCfg ? (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${estadoCfg.text}`}>
                              <span className={`w-2 h-2 rounded-full ${estadoCfg.dot}`} />
                              {estadoCfg.label}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">{m.estado}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {tipoCfg ? (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${tipoCfg.bg} ${tipoCfg.text}`}>{tipoCfg.label}</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {m.cone_cor ? (
                            <div className="flex items-center gap-1">
                              <ConeIcon color={m.cone_cor} size={16} />
                              {m.cone_numero && <span className="num text-xs text-slate-200">{m.cone_numero}</span>}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 num text-slate-400">{m.created_date ? new Date(m.created_date).toLocaleDateString("pt-PT") : "—"}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {userPermissions?.canEditMachine && (
                              <button onClick={() => handleEditMachine(m)} className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-200 hover:bg-slate-600">Editar</button>
                            )}
                            {userPermissions?.canCreateOS && (
                              <button onClick={() => handleOpenOSModal(m)} className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-200 hover:bg-slate-600">OS</button>
                            )}
                            {userPermissions?.canReserveMachine && (
                              <button onClick={() => handleReserveMachine(m)} className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-200 hover:bg-slate-600">Reservar</button>
                            )}
                            {userPermissions?.canDeleteMachine && (
                              <button onClick={() => handleDeleteMachine(m.id)} className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-600/90">Apagar</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {displayMachines.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-400">Sem máquinas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <CreateACPModal
          isOpen={showCreateMachineModal}
          onClose={() => {setShowCreateMachineModal(false); setEditingMachine(null); setPrefillData(null);}}
          onSubmit={handleCreateOrUpdateMachine}
          editingMachine={editingMachine}
          prefillData={prefillData}
        />

        <MachineDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          machine={selectedMachine}
          onUpdate={loadMachines}
        />

        <ImageUploadModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          onSuccess={handleImageUploadSuccess}
          purpose={modalPurpose}
        />

        <CreateOSModal
          isOpen={showCreateOSModal}
          onClose={() => {setShowCreateOSModal(false); setOsTargetMachine(null);}}
          onSubmit={handleCreateOS}
          prefillData={{
            modelo: osTargetMachine?.modelo,
            serie: osTargetMachine?.serie,
            ano: osTargetMachine?.ano,
          }}
        />

        <OriginSelectionModal
          isOpen={showOriginModal}
          onClose={() => setShowOriginModal(false)}
          onSelectOrigin={handleOriginSelected}
          title="Qual a origem da máquina?"
        />

        <MachineSpecsModal
          isOpen={showSpecsModal}
          onClose={() => {setShowSpecsModal(false); setMachineForSpecs(null);}}
          onSubmit={handleSpecsSubmit}
          machineData={machineForSpecs}
        />

        <ReserveMachineModal
          isOpen={showReserveModal}
          onClose={() => {setShowReserveModal(false); setReserveTargetMachine(null);}}
          onSubmit={handleConfirmReservation}
          machine={reserveTargetMachine}
        />
      </div>
    </div>
  );
}