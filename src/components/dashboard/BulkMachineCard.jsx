import React, { useState } from "react";
import { Sparkles, Repeat, Package, Wrench, Trash2, Timer } from "lucide-react";
import { calcTempoEstimado, getReconFamilia, fmtHuman } from "../../lib/countdown";

const TAREFAS_PREDEFINIDAS = ['Preparação geral', 'Revisão 3000h', 'VPS', 'EXPRESS'];
const TIPOS = [
  { key: 'nova', label: 'Nova', icon: Sparkles },
  { key: 'usada', label: 'Usada', icon: Repeat },
  { key: 'aluguer', label: 'Aluguer', icon: Package },
  { key: 'servico-interno', label: 'Interno', icon: Wrench },
];
const RECON = [
  { key: "ferro",  label: "Ferro",  horas: { rx: "6h",  opx: "4h"  } },
  { key: "bronze", label: "Bronze", horas: { rx: "15h", opx: "12h" } },
  { key: "prata",  label: "Prata",  horas: { rx: "30h", opx: "21h" } },
  { key: "ouro",   label: "Ouro",   horas: { rx: "40h", opx: "25h" } },
];

export default function BulkMachineCard({ machine, onChange, onRemove }) {
  const [customTask, setCustomTask] = useState('');

  const toggleTarefa = (texto) => {
    const has = machine.tarefas.some(t => t.texto === texto);
    onChange('tarefas', has
      ? machine.tarefas.filter(t => t.texto !== texto)
      : [...machine.tarefas, { texto, concluida: false }]);
  };

  const addCustom = () => {
    if (!customTask.trim()) return;
    onChange('tarefas', [...machine.tarefas, { texto: customTask.trim(), concluida: false }]);
    setCustomTask('');
  };

  const toggleRecon = (key) => {
    const isActive = !!machine.recondicao?.[key];
    onChange('recondicao', isActive
      ? { ferro: false, bronze: false, prata: false, ouro: false }
      : { ferro: false, bronze: false, prata: false, ouro: false, [key]: true });
  };

  const tempoEst = calcTempoEstimado({
    tarefas: machine.tarefas,
    isExpress: machine.isExpress,
    isVps: machine.isVps,
    recondicao: machine.recondicao,
    modelo: machine.modelo,
  });

  const familia = getReconFamilia(machine.modelo);

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      {/* Dados base */}
      <div className="flex items-start gap-2">
        <div className="flex-1 grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Modelo</label>
            <input type="text" value={machine.modelo || ''} onChange={(e) => onChange('modelo', e.target.value)} className="w-full px-2 py-1 text-sm border rounded" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Série</label>
            <input type="text" value={machine.serie || ''} onChange={(e) => onChange('serie', e.target.value)} className="w-full px-2 py-1 text-sm border rounded font-mono" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Ano</label>
            <input type="number" value={machine.ano || ''} onChange={(e) => onChange('ano', parseInt(e.target.value) || null)} className="w-full px-2 py-1 text-sm border rounded" />
          </div>
        </div>
        <button onClick={onRemove} className="mt-5 p-1 text-red-600 hover:bg-red-50 rounded" title="Remover">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Tipo */}
      <div className="flex gap-2 flex-wrap">
        {TIPOS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => onChange('tipo', key)}
            className={`px-3 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 transition-all ${machine.tipo === key ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Serviço + Prioridade */}
      <div className="flex gap-4 flex-wrap items-center text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={machine.isExpress || false} onChange={e => onChange('isExpress', e.target.checked)} className="w-3.5 h-3.5 rounded accent-blue-600" />
          <span className="font-semibold text-blue-800">EXPRESS</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={machine.isVps || false} onChange={e => onChange('isVps', e.target.checked)} className="w-3.5 h-3.5 rounded accent-blue-600" />
          <span className="font-semibold text-blue-800">VPS</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={machine.prioridade || false} onChange={e => onChange('prioridade', e.target.checked)} className="w-3.5 h-3.5 rounded accent-pink-600" />
          <span className="font-semibold text-pink-700">Prioritária</span>
        </label>
      </div>

      {/* Recondicionamento */}
      <div className="grid grid-cols-4 gap-1.5">
        {RECON.map(cat => {
          const hLabel = familia === "rx_fmx" ? cat.horas.rx : familia === "opx_sf" ? cat.horas.opx : `${cat.horas.rx}/${cat.horas.opx}`;
          const active = machine.recondicao?.[cat.key];
          return (
            <button key={cat.key} type="button" onClick={() => toggleRecon(cat.key)}
              className={`p-1.5 rounded border text-center transition-all ${active ? "bg-purple-600 border-purple-600 text-white" : "border-purple-200 text-purple-700 hover:border-purple-400"}`}>
              <div className="text-[10px] font-bold">{cat.label}</div>
              <div className="text-[9px] opacity-75">{hLabel}</div>
            </button>
          );
        })}
      </div>

      {/* Previsão */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 font-medium mb-0.5 block">Início previsto</label>
          <input type="date" value={machine.previsao_inicio || ''} onChange={(e) => onChange('previsao_inicio', e.target.value)} className="w-full px-2 py-1 text-xs border rounded" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 font-medium mb-0.5 block">Entrega prevista</label>
          <input type="date" value={machine.previsao_fim || ''} min={machine.previsao_inicio || undefined} onChange={(e) => onChange('previsao_fim', e.target.value)} className="w-full px-2 py-1 text-xs border rounded" />
        </div>
      </div>

      {/* Tarefas */}
      <div className="pt-2 border-t space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          {TAREFAS_PREDEFINIDAS.map((task) => (
            <label key={task} className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input type="checkbox" checked={machine.tarefas.some(t => t.texto === task)} onChange={() => toggleTarefa(task)} className="w-3.5 h-3.5 rounded" />
              {task}
            </label>
          ))}
        </div>
        {machine.tarefas.filter(t => !TAREFAS_PREDEFINIDAS.includes(t.texto)).map((t, i) => (
          <div key={i} className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded text-xs">
            <span>{t.texto}</span>
            <button type="button" onClick={() => onChange('tarefas', machine.tarefas.filter(x => x.texto !== t.texto))} className="text-red-600 font-semibold">×</button>
          </div>
        ))}
        <div className="flex gap-1.5">
          <input type="text" value={customTask} onChange={(e) => setCustomTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            placeholder="Tarefa personalizada..." className="flex-1 px-2 py-1 text-xs border rounded" />
          <button type="button" onClick={addCustom} disabled={!customTask.trim()} className="px-2.5 py-1 text-xs bg-black text-white rounded disabled:opacity-40">+</button>
        </div>
      </div>

      {/* Tempo estimado */}
      {tempoEst > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 border border-green-200 text-xs font-semibold text-green-800">
          <Timer className="w-3.5 h-3.5 text-green-600" /> Tempo estimado: <span className="font-mono">{fmtHuman(tempoEst)}</span>
        </div>
      )}
    </div>
  );
}