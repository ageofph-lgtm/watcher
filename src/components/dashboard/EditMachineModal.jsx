import React, { useState, useEffect } from "react";
import { Sparkles, Repeat, Package, Clock, Trash2, Timer, Wrench } from "lucide-react";
import { calcTempoEstimado, getReconFamilia, fmtHuman } from "../../lib/countdown";
import ModalShell from "../modals/ModalShell";
import { INPUT, LABEL, SECTION, BTN_PRIMARY, BTN_SECONDARY } from "../modals/modalStyles";

function nextWorkDay(dateStr) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  if (dow === 6) d.setDate(d.getDate() + 2);
  if (dow === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const TIPO_ICONS = { nova: Sparkles, usada: Repeat, aluguer: Package, "servico-interno": Wrench };
const TAREFAS_PREDEFINIDAS = ["Preparação geral", "Revisão 3000h", "VPS", "EXPRESS"];

const ESTADOS = [
  { value: "a-fazer", label: "A Fazer" },
  { value: "em-preparacao-raphael", label: "Em Preparação - Raphael" },
  { value: "em-preparacao-nuno", label: "Em Preparação - Nuno" },
  { value: "em-preparacao-rogerio", label: "Em Preparação - Rogério" },
  { value: "em-preparacao-yano", label: "Em Preparação - Yano" },
  { value: "em-preparacao-patrick", label: "Em Preparação - Patrick" },
  { value: "concluida-raphael", label: "Concluída - Raphael" },
  { value: "concluida-nuno", label: "Concluída - Nuno" },
  { value: "concluida-rogerio", label: "Concluída - Rogério" },
  { value: "concluida-yano", label: "Concluída - Yano" },
  { value: "concluida-patrick", label: "Concluída - Patrick" },
];

const RECON_CATS = [
  { key: "ferro", label: "Ferro", horas: { rx: "6h", opx: "4h" } },
  { key: "bronze", label: "Bronze", horas: { rx: "15h", opx: "12h" } },
  { key: "prata", label: "Prata", horas: { rx: "30h", opx: "21h" } },
  { key: "ouro", label: "Ouro", horas: { rx: "40h", opx: "25h" } },
];

export default function EditMachineModal({ isOpen, onClose, machine, onSave, isAdmin = true }) {
  const [formData, setFormData] = useState({
    modelo: "", serie: "", ano: "", tipo: "nova", estado: "a-fazer",
    tecnico: null, prioridade: false, aguardaPecas: false,
    previsao_inicio: "", previsao_fim: "",
    isExpress: false, isVps: false,
    recondicao: { ferro: false, bronze: false, prata: false, ouro: false },
    tempo_estimado_segundos: null,
  });
  const [selectedTarefas, setSelectedTarefas] = useState({});
  const [customTarefas, setCustomTarefas] = useState([]);
  const [newTarefaText, setNewTarefaText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [tempoHoras, setTempoHoras] = useState(0);
  const [tempoMinutos, setTempoMinutos] = useState(0);

  useEffect(() => {
    if (!machine || !isOpen) return;
    setSaveError(null);

    const est = Number(machine.tempo_estimado_segundos) || 0;
    let hh = Math.floor(est / 3600);
    let mm = Math.floor((est % 3600) / 60);
    if (est === 0) {
      const tarefasInit = (machine.tarefas || []).map((t) => ({ texto: t.texto }));
      const autoInit = calcTempoEstimado({
        tarefas: tarefasInit,
        isExpress: machine.isExpress,
        isVps: machine.isVps,
        recondicao: machine.recondicao,
        modelo: machine.modelo,
      });
      if (autoInit) {
        hh = Math.floor(autoInit / 3600);
        mm = Math.floor((autoInit % 3600) / 60);
      }
    }

    setFormData({
      modelo: machine.modelo || "",
      serie: machine.serie || "",
      ano: machine.ano || "",
      tipo: machine.tipo || "nova",
      estado: machine.estado || "a-fazer",
      tecnico: machine.tecnico || null,
      prioridade: machine.prioridade || false,
      aguardaPecas: machine.aguardaPecas || false,
      previsao_inicio: machine.previsao_inicio ? String(machine.previsao_inicio).slice(0, 10) : "",
      previsao_fim: machine.previsao_fim ? String(machine.previsao_fim).slice(0, 10) : "",
      isExpress: machine.isExpress || false,
      isVps: machine.isVps || false,
      recondicao: machine.recondicao || { ferro: false, bronze: false, prata: false, ouro: false },
      tempo_estimado_segundos: est || null,
    });

    const preSelected = {};
    const custom = [];
    (machine.tarefas || []).forEach((t) => {
      if (TAREFAS_PREDEFINIDAS.includes(t.texto)) preSelected[t.texto] = true;
      else custom.push({ texto: t.texto, concluida: t.concluida });
    });
    setSelectedTarefas(preSelected);
    setCustomTarefas(custom);
    setTempoHoras(hh);
    setTempoMinutos(mm);
  }, [machine, isOpen]);

  const tarefasActuais = [
    ...TAREFAS_PREDEFINIDAS.filter((t) => selectedTarefas[t]).map((texto) => ({ texto })),
    ...customTarefas.map((texto) => ({ texto: typeof texto === "string" ? texto : texto.texto })),
  ];

  const tempoAuto = calcTempoEstimado({
    tarefas: tarefasActuais,
    isExpress: formData.isExpress,
    isVps: formData.isVps,
    recondicao: formData.recondicao,
    modelo: formData.modelo,
  });

  const tempoEfetivo =
    tempoHoras > 0 || tempoMinutos > 0
      ? tempoHoras * 3600 + tempoMinutos * 60
      : tempoAuto || null;

  const handleEstadoChange = (novoEstado) => {
    let tecnico = null;
    if (novoEstado.includes("preparacao-") || novoEstado.includes("concluida-")) {
      const parts = novoEstado.split("-");
      tecnico = parts[parts.length - 1];
    }
    setFormData((prev) => ({ ...prev, estado: novoEstado, tecnico }));
  };

  const handleReconToggle = (key) => {
    setFormData((prev) => {
      const isActive = !!prev.recondicao?.[key];
      return {
        ...prev,
        recondicao: isActive
          ? { ferro: false, bronze: false, prata: false, ouro: false }
          : { ferro: false, bronze: false, prata: false, ouro: false, [key]: true },
      };
    });
  };

  const handleTempoAjuste = (delta) => {
    const total = Math.max(0, tempoHoras * 3600 + tempoMinutos * 60 + delta * 3600);
    setTempoHoras(Math.floor(total / 3600));
    setTempoMinutos(Math.floor((total % 3600) / 60));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveError(null);

    const tarefas = [
      ...TAREFAS_PREDEFINIDAS.filter((t) => selectedTarefas[t]).map((texto) => {
        const existing = machine.tarefas?.find((t2) => t2.texto === texto);
        return { texto, concluida: existing?.concluida || false };
      }),
      ...customTarefas,
    ];

    try {
      await onSave({
        ...formData,
        ano: formData.ano ? String(formData.ano) : null,
        tarefas,
        previsao_inicio: formData.previsao_inicio || null,
        previsao_fim: formData.previsao_fim || null,
        tempo_estimado_segundos: tempoEfetivo,
      });
    } catch (err) {
      setSaveError("Erro ao guardar. Tente novamente.");
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const familia = getReconFamilia(formData.modelo);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={machine ? `Editar ${machine.serie}` : "Editar Máquina"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Tipo */}
        <div className={SECTION}>
          <label className={LABEL}>Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TIPO_ICONS).map(([tipo, Icon]) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, tipo }))}
                className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition ${
                  formData.tipo === tipo
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold capitalize">{tipo}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modelo + Série + Ano */}
        <div className={SECTION}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Modelo</label>
              <input
                className={INPUT}
                value={formData.modelo}
                onChange={(e) => setFormData((prev) => ({ ...prev, modelo: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={LABEL}>Número de Série</label>
              <input
                className={`${INPUT} num font-bold tracking-wider text-lg`}
                value={formData.serie}
                onChange={(e) => setFormData((prev) => ({ ...prev, serie: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className={LABEL}>Ano de Fabrico</label>
            <input
              className={`${INPUT} max-w-[140px]`}
              type="number"
              value={formData.ano}
              onChange={(e) => setFormData((prev) => ({ ...prev, ano: e.target.value }))}
            />
          </div>
        </div>

        {/* Estado */}
        <div className={SECTION}>
          <label className={LABEL}>Estado</label>
          <select
            className={INPUT}
            value={formData.estado}
            onChange={(e) => handleEstadoChange(e.target.value)}
          >
            {ESTADOS.map((s) => (
              <option key={s.value} value={s.value} className="bg-slate-900">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tarefas */}
        <div className={SECTION}>
          <label className={LABEL}>Tarefas</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {TAREFAS_PREDEFINIDAS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTarefas((prev) => ({ ...prev, [t]: !prev[t] }))}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold text-left transition ${
                  selectedTarefas[t]
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-2">
            {[["isExpress", "⚡ EXPRESS"], ["isVps", "🔧 VPS"]].map(([key, lbl]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                  formData[key]
                    ? "border-cexe bg-cexe/10 text-cexe"
                    : "border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          {customTarefas.map((t, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="flex-1 text-sm text-slate-200 px-2 py-1 rounded bg-slate-800/40">
                {t.texto}
              </span>
              <button
                type="button"
                onClick={() => setCustomTarefas((prev) => prev.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              className={INPUT}
              placeholder="Nova tarefa..."
              value={newTarefaText}
              onChange={(e) => setNewTarefaText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newTarefaText.trim()) {
                    setCustomTarefas((p) => [...p, { texto: newTarefaText.trim(), concluida: false }]);
                    setNewTarefaText("");
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (newTarefaText.trim()) {
                  setCustomTarefas((p) => [...p, { texto: newTarefaText.trim(), concluida: false }]);
                  setNewTarefaText("");
                }
              }}
              className="px-3 rounded-lg bg-amber-500/20 border border-amber-500 text-amber-400 font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Recondicionamento */}
        <div className={SECTION}>
          <label className={LABEL}>Recondicionamento</label>
          <div className="grid grid-cols-4 gap-2">
            {RECON_CATS.map((cat) => {
              const hLabel =
                familia === "rx_fmx" ? cat.horas.rx : familia === "opx_sf" ? cat.horas.opx : `${cat.horas.rx}/${cat.horas.opx}`;
              const active = !!formData.recondicao?.[cat.key];
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleReconToggle(cat.key)}
                  className={`p-2 rounded-lg border-2 text-center transition ${
                    active
                      ? "border-ka bg-ka/10 text-ka"
                      : "border-slate-600 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <div className="text-xs font-bold">{cat.label}</div>
                  <div className="text-[9px] opacity-75">{hLabel}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tempo estimado */}
        <div className={`${SECTION} border-amber-500/30`}>
          <div className="flex items-center justify-between">
            <label className={`${LABEL} !mb-0 text-amber-400`}>⏱ Tempo Estimado</label>
            {tempoAuto && (
              <span className="text-xs num text-cpro px-2 py-0.5 rounded border border-cpro/40">
                AUTO: {fmtHuman(tempoAuto)}
              </span>
            )}
          </div>
          {isAdmin && (
            <div className="space-y-3">
              <div className="num text-2xl font-bold text-amber-400 text-center">
                {String(tempoHoras).padStart(2, "0")}h {String(tempoMinutos).padStart(2, "0")}m
              </div>
              <div className="flex items-center justify-center gap-2">
                {[-4, -2, -1].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleTempoAjuste(d)}
                    className="px-3 py-1 rounded-lg num text-xs font-bold bg-kv/15 border border-kv/40 text-kv"
                  >
                    {d}h
                  </button>
                ))}
                <div className="w-px h-5 bg-slate-600" />
                {[1, 2, 4].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleTempoAjuste(d)}
                    className="px-3 py-1 rounded-lg num text-xs font-bold bg-cpro/15 border border-cpro/40 text-cpro"
                  >
                    +{d}h
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-center">
                  <label className={`${LABEL} !mb-1`}>Horas</label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={tempoHoras}
                    onChange={(e) => setTempoHoras(Math.max(0, Number(e.target.value) || 0))}
                    className={`${INPUT} w-20 text-center font-bold`}
                  />
                </div>
                <span className="text-slate-500 text-xl font-bold mt-4">:</span>
                <div className="text-center">
                  <label className={`${LABEL} !mb-1`}>Min</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={tempoMinutos}
                    onChange={(e) => setTempoMinutos(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                    className={`${INPUT} w-20 text-center font-bold`}
                  />
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap justify-center">
                {[["2h", 2, 0], ["4h", 4, 0], ["6h", 6, 0], ["8h", 8, 0], ["12h", 12, 0], ["15h", 15, 0], ["21h", 21, 0], ["30h", 30, 0]].map(
                  ([lbl, h, m]) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => {
                        setTempoHoras(h);
                        setTempoMinutos(m);
                      }}
                      className={`px-2.5 py-1 rounded num text-[10px] font-bold border transition ${
                        tempoHoras === h && tempoMinutos === m
                          ? "border-amber-500 bg-amber-500/20 text-amber-400"
                          : "border-slate-600 bg-slate-800/40 text-slate-400"
                      }`}
                    >
                      {lbl}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Datas */}
        <div className={`${SECTION} border-kz/30`}>
          <label className={`${LABEL} text-kz`}>📅 Previsão (Portal da Frota)</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Início previsto</label>
              <input
                type="date"
                className={INPUT}
                value={formData.previsao_inicio || ""}
                onChange={(e) => {
                  const wd = nextWorkDay(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    previsao_inicio: wd,
                    previsao_fim: prev.previsao_fim && prev.previsao_fim < wd ? wd : prev.previsao_fim,
                  }));
                }}
              />
            </div>
            <div>
              <label className={LABEL}>Entrega prevista</label>
              <input
                type="date"
                className={INPUT}
                min={formData.previsao_inicio || undefined}
                value={formData.previsao_fim || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, previsao_fim: nextWorkDay(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className={`${SECTION} !flex-row gap-2`}>
          {[["prioridade", "🚨 Prioritária"], ["aguardaPecas", "📦 Aguarda Peças"]].map(([key, lbl]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, [key]: !prev[key] }))}
              className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold transition ${
                formData[key]
                  ? "border-amber-500 bg-amber-500/15 text-amber-400"
                  : "border-slate-600 text-slate-400 hover:border-slate-500"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Preview tempo efectivo */}
        {tempoEfetivo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cpro/10 border border-cpro/30">
            <Timer className="w-3.5 h-3.5 text-cpro" />
            <span className="num text-xs text-cpro font-bold">Tempo a guardar: {fmtHuman(tempoEfetivo)}</span>
          </div>
        )}

        {/* Erro */}
        {saveError && (
          <div className="px-3 py-2 rounded-lg bg-kv/10 border border-kv/30 text-kv text-xs">⚠ {saveError}</div>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={`${BTN_SECONDARY} flex-1`}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className={`${BTN_PRIMARY} flex-[2]`}>
            {isSubmitting ? "A guardar…" : "✓ Guardar Alterações"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}