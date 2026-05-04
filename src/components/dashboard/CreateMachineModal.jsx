import React, { useState, useEffect } from "react";
import { Sparkles, Repeat, Package, Clock } from "lucide-react";


// Avança data para o próximo dia útil (salta sábado e domingo)
function nextWorkDay(dateStr) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay();
  if (dow === 6) d.setDate(d.getDate() + 2);
  if (dow === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const TAREFAS_PREDEFINIDAS = ['Preparação geral', 'Revisão 3000h', 'VPS', 'EXPRESS'];

const TIPO_ICONS = {
  nova: { icon: Sparkles },
  usada: { icon: Repeat },
  aluguer: { icon: Package }
};

export default function CreateMachineModal({ isOpen, onClose, onSubmit, prefillData }) {
  const [formData, setFormData] = useState({
    modelo: '', serie: '', ano: '', tipo: 'nova', tarefas: [],
    recondicao: { bronze: false, prata: false }, prioridade: false, aguardaPecas: false,
    previsao_inicio: '', previsao_fim: ''
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
        aguardaPecas: prefillData.aguardaPecas || false,
        previsao_inicio: prefillData.previsao_inicio || '',
        previsao_fim: prefillData.previsao_fim || ''
      });
      if (prefillData.tarefas) {
        const preSelected = {};
        const custom = [];
        prefillData.tarefas.forEach(t => {
          if (TAREFAS_PREDEFINIDAS.includes(t.texto)) preSelected[t.texto] = true;
          else custom.push(t.texto);
        });
        setSelectedTarefas(preSelected);
        setCustomTarefas(custom);
      }
    } else {
      setFormData({
        modelo: '', serie: '', ano: '', tipo: 'nova', tarefas: [],
        recondicao: { bronze: false, prata: false }, prioridade: false, aguardaPecas: false,
        previsao_inicio: '', previsao_fim: ''
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
    onSubmit({
      ...formData,
      tarefas,
      previsao_inicio: formData.previsao_inicio || null,
      previsao_fim: formData.previsao_fim || null,
    });
  };

  const handleTarefaToggle = (tarefa) => setSelectedTarefas(prev => ({ ...prev, [tarefa]: !prev[tarefa] }));

  const handleAddCustomTarefa = () => {
    if (newTarefaText.trim()) { setCustomTarefas(prev => [...prev, newTarefaText.trim()]); setNewTarefaText(''); }
  };

  const handleRemoveCustomTarefa = (index) => setCustomTarefas(prev => prev.filter((_, i) => i !== index));

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[200]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl z-[201] w-[90%] max-w-md p-6 max-h-[90vh] overflow-y-auto bg-white">
        <h2 className="text-2xl font-bold mb-6 text-black">Nova Máquina</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Modelo</label>
            <input type="text" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} required className="w-full px-4 py-2 rounded border border-gray-300 focus:border-black focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Número de Série</label>
            <input type="text" value={formData.serie} onChange={(e) => setFormData({ ...formData, serie: e.target.value })} required className="w-full px-4 py-2 rounded border border-gray-300 focus:border-black focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Ano</label>
            <input type="number" value={formData.ano} onChange={(e) => setFormData({ ...formData, ano: e.target.value })} className="w-full px-4 py-2 rounded border border-gray-300 focus:border-black focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Tipo de Máquina</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TIPO_ICONS).map(([tipo, { icon: Icon }]) => (
                <button key={tipo} type="button" onClick={() => setFormData({ ...formData, tipo })} className={`p-3 rounded border-2 transition-all flex flex-col items-center gap-2 ${formData.tipo === tipo ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium capitalize">{tipo}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Previsão de Início e Entrega (em dias) */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded border border-pink-200 bg-pink-50/40">
            <div className="col-span-2 flex items-center gap-2 text-xs font-semibold text-pink-700">
              <Clock className="w-3.5 h-3.5" /> PREVISÃO (refletido no Portal da Frota)
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">Início previsto</label>
              <input
                type="date"
                value={formData.previsao_inicio || ''}
                onChange={(e) => { const wd = nextWorkDay(e.target.value); setFormData({ ...formData, previsao_inicio: wd, previsao_fim: formData.previsao_fim && formData.previsao_fim < wd ? wd : formData.previsao_fim }); }}
                className="w-full px-3 py-2 rounded border border-gray-300 focus:border-pink-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">Entrega prevista</label>
              <input
                type="date"
                value={formData.previsao_fim || ''}
                onChange={(e) => setFormData({ ...formData, previsao_fim: nextWorkDay(e.target.value) })}
                min={formData.previsao_inicio || undefined}
                className="w-full px-3 py-2 rounded border border-gray-300 focus:border-pink-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="prioridade" checked={formData.prioridade || false} onChange={(e) => setFormData({ ...formData, prioridade: e.target.checked })} className="w-4 h-4 rounded" />
            <label htmlFor="prioridade" className="text-sm text-gray-700">Marcar como Prioritária</label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700">Tarefas a Realizar</label>
            <div className="space-y-2 mb-3">
              {TAREFAS_PREDEFINIDAS.map(tarefa => (
                <div key={tarefa} className="flex items-center gap-2">
                  <input type="checkbox" id={`tarefa-${tarefa}`} checked={!!selectedTarefas[tarefa]} onChange={() => handleTarefaToggle(tarefa)} className="w-4 h-4 rounded" />
                  <label htmlFor={`tarefa-${tarefa}`} className="text-sm text-gray-700">{tarefa}</label>
                </div>
              ))}
            </div>
            {customTarefas.length > 0 && (
              <div className="space-y-2 mb-3 p-3 rounded bg-gray-50 border border-gray-200">
                <p className="text-xs font-semibold text-gray-700">Tarefas Personalizadas:</p>
                {customTarefas.map((tarefa, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-white">
                    <span className="text-sm text-gray-700">{tarefa}</span>
                    <button type="button" onClick={() => handleRemoveCustomTarefa(idx)} className="text-xs font-semibold text-red-600 hover:text-red-800">Remover</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={newTarefaText} onChange={(e) => setNewTarefaText(e.target.value)} placeholder="Adicionar tarefa personalizada..." className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 focus:border-black focus:outline-none" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTarefa())} />
              <button type="button" onClick={handleAddCustomTarefa} className="px-4 py-2 text-white rounded text-sm font-semibold bg-black hover:bg-gray-800">+</button>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded border-2 border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2 text-white rounded bg-black hover:bg-gray-800">Criar</button>
          </div>
        </form>
      </div>
    </>
  );
}