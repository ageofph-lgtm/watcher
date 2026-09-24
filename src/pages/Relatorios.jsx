import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FrotaACP, OrdemServico } from '@/entities/all';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, BarChart2, Activity, Archive, Calendar, CheckCircle2, Package, Camera, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import ImageUploadModal from '../components/dashboard/ImageUploadModal';
import ThemeSwitcher from '../components/watcher/ThemeSwitcher';

const processUtilizationData = (machines) => {
  if (!machines || machines.length === 0) return { chartData: [], tableData: [] };

  const data = machines.map(machine => {
    let totalUtilizationDays = 0;

    if (machine.historico) {
      machine.historico.forEach(h => {
        if (h.tipo === 'retorno_cliente' && h.diasUtilizacao) {
          totalUtilizationDays += h.diasUtilizacao;
        }
      });
    }

    if (machine.estado === 'Em Aluguer' && machine.dataInicioAluguer) {
      const startDate = new Date(machine.dataInicioAluguer);
      const now = new Date();
      const diffDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
      totalUtilizationDays += diffDays;
    }

    return {
      name: `${machine.modelo} (${machine.serie.slice(-4)})`,
      utilizacao: totalUtilizationDays,
      manutencoes: machine.historico?.filter(h => h.tipo === 'manutencao').length || 0,
      estado: machine.estado,
      modelo: machine.modelo,
      serie: machine.serie
    };
  });

  return { chartData: data, tableData: data };
};

const CATEGORIES = [
  { key: 'Empilhador', label: 'Empilhador' },
  { key: 'Retrateis', label: 'Retrateis' },
  { key: 'Order Picker', label: 'Order Picker' },
  { key: 'Stacker', label: 'Stacker' },
  { key: 'Outros', label: 'Outros' },
];

const INPUT = 'bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-500/60 transition';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-2 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100">
      <div className="font-bold mb-1 text-slate-200">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-slate-300">{p.name}: <span className="num font-bold text-amber-400">{p.value}</span></div>
      ))}
    </div>
  );
}

export default function RelatoriosPage() {
  const [utilization, setUtilization] = useState({ chartData: [], tableData: [] });
  const [historicOS, setHistoricOS] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistoric, setFilteredHistoric] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('utilizacao');
  const [selectedMachineForChart, setSelectedMachineForChart] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [allSTSMachines, setAllSTSMachines] = useState([]);

  const [utilizationSearchQuery, setUtilizationSearchQuery] = useState('');
  const [filteredUtilization, setFilteredUtilization] = useState({ chartData: [], tableData: [] });
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalPurpose, setModalPurpose] = useState('search');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const machines = await FrotaACP.filter({ origem: 'sts' }, '-created_date');
      setAllSTSMachines(machines);

      const completedOrders = await OrdemServico.filter({ status: 'concluido' }, '-updated_date');
      setHistoricOS(completedOrders);
      setFilteredHistoric(completedOrders);
    } catch (error) {
      console.error("Erro ao carregar dados para relatórios:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh 30s (padrão ATLAS)
  useEffect(() => {
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  useEffect(() => {
    if (selectedCategory && allSTSMachines.length > 0) {
      const filteredMachines = allSTSMachines.filter(m => (m.categoria || 'Outros') === selectedCategory);
      const processedData = processUtilizationData(filteredMachines);
      setUtilization(processedData);
      setFilteredUtilization(processedData);
    } else {
      setUtilization({ chartData: [], tableData: [] });
      setFilteredUtilization({ chartData: [], tableData: [] });
    }
  }, [selectedCategory, allSTSMachines]);

  useEffect(() => {
    if (!utilizationSearchQuery) {
      setFilteredUtilization(utilization);
      return;
    }
    const query = utilizationSearchQuery.toLowerCase();
    const filteredTableData = utilization.tableData.filter(m =>
      m.modelo?.toLowerCase().includes(query) || m.serie?.toLowerCase().includes(query)
    );
    const filteredChartData = utilization.chartData.filter(c =>
      c.serie?.toLowerCase().includes(query) || c.modelo?.toLowerCase().includes(query)
    );
    setFilteredUtilization({ chartData: filteredChartData, tableData: filteredTableData });
  }, [utilizationSearchQuery, utilization]);

  useEffect(() => {
    if (!searchQuery) { setFilteredHistoric(historicOS); return; }
    const filtered = historicOS.filter(os =>
      os.modelo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      os.serie?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      os.cliente?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredHistoric(filtered);
  }, [searchQuery, historicOS]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setUtilizationSearchQuery('');
    setSelectedMachineForChart(null);
  };

  const getCategoryCount = (category) =>
    allSTSMachines.filter(m => (m.categoria || 'Outros') === category).length;

  const handleImageUploadSuccess = (extractedData) => {
    setShowImageModal(false);
    if (modalPurpose === 'search') setUtilizationSearchQuery(extractedData.serie || '');
  };

  // KPIs derivados dos dados que a página já calcula
  const kpis = useMemo(() => {
    const totalDias = utilization.tableData.reduce((s, m) => s + (m.utilizacao || 0), 0);
    const totalManut = utilization.tableData.reduce((s, m) => s + (m.manutencoes || 0), 0);
    return {
      sts: allSTSMachines.length,
      os: historicOS.length,
      dias: totalDias,
      manut: totalManut,
    };
  }, [utilization, allSTSMachines, historicOS]);

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap mb-6">
          <h1 className="page-title text-slate-100">Relatórios</h1>
          <div className="ml-auto"><ThemeSwitcher compact /></div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Máquinas STS', value: kpis.sts },
            { label: 'O.S. Concluídas', value: kpis.os },
            { label: 'Dias Utilização', value: kpis.dias },
            { label: 'Manutenções', value: kpis.manut },
          ].map(k => (
            <div key={k.label} className="glass border border-slate-700 rounded-lg p-4">
              <div className="text-xs text-slate-400 uppercase tracking-wide">{k.label}</div>
              <div className="kpi-num text-2xl font-bold text-slate-100 mt-1">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('utilizacao')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'utilizacao' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}>
            <BarChart2 className="w-4 h-4" /> Utilização da Frota
          </button>
          <button onClick={() => setActiveTab('historico')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'historico' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}>
            <Archive className="w-4 h-4" /> Histórico de O.S.
          </button>
        </div>

        {/* Utilização */}
        {activeTab === 'utilizacao' && (
          <div className="space-y-6">
            {!selectedCategory ? (
              <div className="glass border border-slate-700 rounded-lg p-6">
                <h2 className="page-title text-slate-100 mb-2 flex items-center gap-2"><Package className="w-5 h-5" /> Selecione o Tipo de Máquina</h2>
                <p className="text-sm text-slate-400 mb-6">Escolha um tipo de máquina para ver os dados de utilização detalhados.</p>
                {isLoading ? (
                  <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-600 border-t-amber-500 rounded-full animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CATEGORIES.map(category => {
                      const count = getCategoryCount(category.key);
                      return (
                        <button key={category.key} onClick={() => handleCategorySelect(category.key)} disabled={count === 0}
                          className={`p-5 rounded-lg border text-left transition ${count === 0 ? 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed' : 'glass-2 border-slate-600 text-slate-100 hover:border-amber-500/50'}`}>
                          <h3 className="text-lg font-semibold">{category.label}</h3>
                          <p className="text-sm text-slate-400">{count} {count === 1 ? 'máquina' : 'máquinas'}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedCategory(null)} className={`${INPUT} flex items-center gap-2`}><ArrowLeft className="w-4 h-4" /> Voltar</button>
                    <h2 className="page-title text-slate-100">Relatório: {CATEGORIES.find(c => c.key === selectedCategory)?.label}</h2>
                  </div>
                  <div className="relative flex gap-2 w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <input type="text" placeholder="Pesquisar por modelo ou série..." value={utilizationSearchQuery} onChange={(e) => setUtilizationSearchQuery(e.target.value)}
                      className={`${INPUT} flex-1 w-full sm:w-64 pl-9`} />
                    <button onClick={() => { setModalPurpose('search'); setShowImageModal(true); }} className="px-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Chart */}
                <div className="glass border border-slate-700 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="page-title text-slate-100 flex items-center gap-2"><BarChart2 className="w-5 h-5" />
                      {selectedMachineForChart ? `Desempenho: ${selectedMachineForChart.modelo} (${selectedMachineForChart.serie.slice(-4)})` : 'Utilização da Frota (Dias em Aluguer)'}
                    </h3>
                    {selectedMachineForChart && (
                      <button onClick={() => setSelectedMachineForChart(null)} className={`${INPUT}`}>Mostrar Todas</button>
                    )}
                  </div>
                  {filteredUtilization.chartData.length === 0 ? (
                    <div className="h-96 flex items-center justify-center text-slate-400">
                      <div className="text-center"><Search className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nenhuma máquina encontrada</p></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={selectedMachineForChart ? [filteredUtilization.chartData.find(c => c.serie === selectedMachineForChart.serie)].filter(Boolean) : filteredUtilization.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                        <XAxis dataKey="name" stroke="rgb(var(--mu2))" tick={{ fontSize: 11 }} />
                        <YAxis stroke="rgb(var(--mu2))" tick={{ fontSize: 11 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="utilizacao" fill="rgb(var(--pribg))" name="Dias em Utilização" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Table */}
                {filteredUtilization.tableData.length > 0 && (
                  <div className="glass border border-slate-700 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700"><h3 className="page-title text-slate-100 flex items-center gap-2"><Activity className="w-5 h-5" /> Resumo Detalhado</h3></div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs text-slate-400 uppercase border-b border-slate-700">
                          <tr>
                            <th className="px-6 py-3">Modelo</th>
                            <th className="px-6 py-3">Série</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3">Manutenções</th>
                            <th className="px-6 py-3">Dias Utilização</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUtilization.tableData.map((machine, index) => (
                            <tr key={index} className={`cursor-pointer border-b border-slate-700/50 hover:bg-slate-800/40 ${selectedMachineForChart?.serie === machine.serie ? 'bg-amber-500/10' : ''}`} onClick={() => setSelectedMachineForChart(machine)}>
                              <td className="px-6 py-3 text-slate-100 font-medium">{machine.modelo}</td>
                              <td className="px-6 py-3 num font-bold text-slate-100">{machine.serie}</td>
                              <td className="px-6 py-3 text-slate-300">{machine.estado}</td>
                              <td className="px-6 py-3 num tabular-nums text-slate-300">{machine.manutencoes}</td>
                              <td className="px-6 py-3 num tabular-nums font-bold text-amber-400">{machine.utilizacao}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Histórico */}
        {activeTab === 'historico' && (
          <div className="glass border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="page-title text-slate-100 flex items-center gap-2"><Archive className="w-5 h-5" /> Histórico de Ordens Concluídas</h2>
              <span className="text-sm text-slate-400">{filteredHistoric.length} ordens</span>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Pesquisar por modelo, série ou cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${INPUT} w-full pl-9`} />
            </div>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400">A carregar histórico...</div>
            ) : filteredHistoric.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400"><Archive className="w-12 h-12 mb-3 opacity-30" /><p>Nenhuma ordem encontrada</p></div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredHistoric.map((os) => (
                  <div key={os.id} className="glass-2 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-100">{os.modelo} {os.ano && `(${os.ano})`}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${os.prioridade === 'urgente' ? 'bg-red-500/20 text-red-400' : os.prioridade === 'alta' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600/40 text-slate-300'}`}>{os.prioridade}</span>
                        </div>
                        <p className="text-sm text-slate-300">NS: <span className="num font-bold text-slate-100">{os.serie}</span></p>
                        {os.cliente && <p className="text-sm text-slate-400">Cliente: {os.cliente}</p>}
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(os.created_date), 'dd/MM/yyyy')}</span>
                          {os.dataConlusao && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-cpro" /> {format(new Date(os.dataConlusao), 'dd/MM/yyyy')}</span>}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-cpro/15 text-cpro border border-cpro/30 whitespace-nowrap">Concluída</span>
                    </div>
                    {os.tasks?.length > 0 && (
                      <div className="mt-3 p-2 rounded glass-2 border border-slate-700 text-sm flex items-center justify-between">
                        <span className="text-slate-400">Tarefas concluídas:</span>
                        <span className="num font-bold text-slate-100">{os.tasks.filter(t => t.completed).length}/{os.tasks.length}</span>
                      </div>
                    )}
                    {os.observacoes && (
                      <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                        <p className="text-xs font-medium text-amber-400 mb-1">Observações:</p>
                        <p className="text-sm text-slate-300">{os.observacoes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <ImageUploadModal isOpen={showImageModal} onClose={() => setShowImageModal(false)} onSuccess={handleImageUploadSuccess} purpose={modalPurpose} />
    </div>
  );
}