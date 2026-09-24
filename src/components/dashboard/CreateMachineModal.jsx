import React, { useState, useEffect } from "react";
import { Sparkles, Repeat, Package, Clock, AlertTriangle, Timer, Wrench } from "lucide-react";
import { calcTempoEstimado, getReconFamilia, fmtHuman } from "../../lib/countdown";
import ModalShell from "../modals/ModalShell";
import { INPUT, LABEL, SECTION, BTN_PRIMARY, BTN_SECONDARY } from "../modals/modalStyles";

// Avança data para o próximo dia útil (salta sábado e domingo)
function nextWorkDay(dateStr) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  if (dow === 6) d.setDate(d.getDate() + 2);
  if (dow === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const TAREFAS_PREDEFINIDAS = ["Preparação geral", "Revisão 3000h", "VPS", "EXPRESS"];

const TIPO_ICONS = {
  nova: { icon: Sparkles },
  usada: { icon: Repeat },
  aluguer: { icon: Package },
  "servico-interno": { icon: Wrench },
};

const TIPO_LABELS = {
  nova: "Nova",
  usada: "Usada",
  aluguer: "Aluguer",
  "servico-interno": "Serviço Interno",
};

const ESTADO_LABEL = {
  "a-fazer": "A Fazer",
  "em-preparacao-raphael": "Em Preparação — Raphael",
  "em-preparacao-nuno": "Em Preparação — Nuno",
  "em-preparacao-rogerio": "Em Preparação — Rogério",
  "em-preparacao-yano": "Em Preparação — Yano",
  "em-preparacao-patrick": "Em Preparação — Patrick",
  "concluida-raphael": "Concluída — Raphael",
  "concluida-nuno": "Concluída — Nuno",
  "concluida-rogerio": "Concluída — Rogério",
  "concluida-yano": "Concluída — Yano",
  "concluida-patrick": "Concluída — Patrick",
};

export default function CreateMachineModal({ isOpen, onClose, onSubmit, prefillData, isDark }) {
  const [formData, setFormData] = useState({
    modelo: "", serie: "", ano: "", tipo: "nova", tarefas: [],
    recondicao: { ferro: false, bronze: false, prata: false, ouro: false },
    isExpress: false, isVps: false,
    prioridade: false, aguardaPecas: false,
    previsao_inicio: "", previsao_fim: "",
    tempo_estimado_segundos: null,
  });
  const [selectedTarefas, setSelectedTarefas] = useState({});
  const [customTarefas, setCustomTarefas] = useState([]);
  const [newTarefaText, setNewTarefaText] = useState("");
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDuplicateInfo(null);
    setIsSubmitting(false);
    if (prefillData) {
      setFormData({
        ...prefillData,
        tipo: prefillData.tipo || "nova",
        tarefas: prefillData.tarefas || [],
        recondicao: prefillData.recondicao || { ferro: false, bronze: false, prata: false, ouro: false },
        isExpress: prefillData.isExpress || false,
        isVps: prefillData.isVps || false,
        tempo_estimado_segundos: prefillData.tempo_estimado_segundos || null,
        prioridade: prefillData.prioridade || false,
        aguardaPecas: prefillData.aguardaPecas || false,
        previsao_inicio: prefillData.previsao_inicio || "",
        previsao_fim: prefillData.previsao_fim || "",
      });
      if (prefillData.tarefas) {
        const preSelected = {};
        const custom = [];
        prefillData.tarefas.forEach((t) => {
          if (typeof t === "string") {
            if (TAREFAS_PREDEFINIDAS.includes(t)) preSelected[t] = true;
            else custom.push(t);
          } else if (t?.texto) {
            if (TAREFAS_PREDEFINIDAS.includes(t.texto)) preSelected[t.texto] = true;
            else custom.push(t.texto);
          }
        });
        setSelectedTarefas(preSelected);
        setCustomTarefas(custom);
      }
    } else {
      setFormData({
        modelo: "", serie: "", ano: "", tipo: "nova", tarefas: [],
        recondicao: { ferro: false, bronze: false, prata: false, ouro: false },
        isExpress: false, isVps: false,
        prioridade: false, aguardaPecas: false,
        previsao_inicio: "", previsao_fim: "",
        tempo_estimado_segundos: null,
      });
      setSelectedTarefas({});
      setCustomTarefas([]);
    }
  }, [prefillData, isOpen]);

  const buildPayload = (confirmed = false) => {
    const tarefas = [
      ...TAREFAS_PREDEFINIDAS.filter((t) => selectedTarefas[t]).map((texto) => ({ texto, concluida: false })),
      ...customTarefas.map((texto) => ({ texto, concluida: false })),
    ];
    const tempoAuto = calcTempoEstimado({
      tarefas,
      isExpress: formData.isExpress,
      isVps: formData.isVps,
      recondicao: formData.recondicao,
      modelo: formData.modelo,
    });
    return {
      ...formData,
      tarefas,
      previsao_inicio: formData.previsao_inicio || null,
      previsao_fim: formData.previsao_fim || null,
      tempo_estimado_segundos: tempoAuto,
      imprevistos: [],
      ...(confirmed ? { confirmedDuplicate: true } : {}),
    };
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(buildPayload(false));
    } catch (err) {
      if (err?.duplicates) setDuplicateInfo(err.duplicates);
    }
    setIsSubmitting(false);
  };

  const handleConfirmDuplicate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setDuplicateInfo(null);
    try {
      await onSubmit(buildPayload(true));
    } catch {}
    setIsSubmitting(false);
  };

  const handleTarefaToggle = (tarefa) =>
    setSelectedTarefas((prev) => ({ ...prev, [tarefa]: !prev[tarefa] }));
  const handleAddCustomTarefa = () => {
    if (newTarefaText.trim()) {
      setCustomTarefas((prev) => [...prev, newTarefaText.trim()]);
      setNewTarefaText("");
    }
  };
  const handleRemoveCustomTarefa = (index) =>
    setCustomTarefas((prev) => prev.filter((_, i) => i !== index));

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Máquina"
      maxWidth="max-w-md"
    >
      {/* ── AVISO DE DUPLICADO ── */}
      {duplicateInfo && (
        <div className="p-4 rounded-lg border border-amber-500/50 bg-amber-500/10 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-sm font-bold text-amber-300">Série já existe no sistema!</span>
          </div>
          <div className="space-y-1">
            {duplicateInfo.map((d) => (
              <div key={d.id} className="text-xs text-amber-200 bg-amber-500/10 rounded px-2 py-1">
                <span className="num font-bold">{d.serie}</span>
                {" · "}
                <span>{ESTADO_LABEL[d.estado] || d.estado}</span>
                {d.tecnico && <span className="ml-1 text-amber-400">({d.tecnico})</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-200">Quer criar mesmo assim? O histórico anterior ficará registado.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setDuplicateInfo(null)} className={`${BTN_SECONDARY} flex-1`}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDuplicate}
              disabled={isSubmitting}
              className={`${BTN_PRIMARY} flex-1`}
            >
              {isSubmitting ? "A criar..." : "Criar mesmo assim"}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Modelo</label>
          <input
            type="text"
            value={formData.modelo}
            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
            required
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>Número de Série</label>
          <input
            type="text"
            value={formData.serie}
            onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
            required
            className={`${INPUT} num font-bold tracking-wider text-lg`}
          />
        </div>
        <div>
          <label className={LABEL}>Ano</label>
          <input
            type="number"
            value={formData.ano}
            onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
            className={INPUT}
          />
        </div>
        <div>
          <label className={`${LABEL} mb-2`}>Tipo de Máquina</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TIPO_ICONS).map(([tipo, { icon: Icon }]) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setFormData({ ...formData, tipo })}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition ${
                  formData.tipo === tipo
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{TIPO_LABELS[tipo] || tipo}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Previsão */}
        <div className={`${SECTION} border-kz/30`}>
          <div className="flex items-center gap-2 text-xs font-semibold text-kz">
            <Clock className="w-3.5 h-3.5" /> PREVISÃO (refletido no Portal da Frota)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Início previsto</label>
              <input
                type="date"
                value={formData.previsao_inicio || ""}
                onChange={(e) => {
                  const wd = nextWorkDay(e.target.value);
                  setFormData({
                    ...formData,
                    previsao_inicio: wd,
                    previsao_fim: formData.previsao_fim && formData.previsao_fim < wd ? wd : formData.previsao_fim,
                  });
                }}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Entrega prevista</label>
              <input
                type="date"
                value={formData.previsao_fim || ""}
                onChange={(e) => setFormData({ ...formData, previsao_fim: nextWorkDay(e.target.value) })}
                min={formData.previsao_inicio || undefined}
                className={INPUT}
              />
            </div>
          </div>
        </div>

        {/* Serviço: Express / VPS */}
        <div className={SECTION}>
          <div className="flex items-center gap-2 text-xs font-semibold text-cexe">
            <Timer className="w-3.5 h-3.5" /> TIPO DE SERVIÇO
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isExpress || false}
                onChange={(e) => setFormData({ ...formData, isExpress: e.target.checked })}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm font-semibold text-cexe">EXPRESS</span>
              <span className="text-xs text-slate-400">(2h)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVps || false}
                onChange={(e) => setFormData({ ...formData, isVps: e.target.checked })}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm font-semibold text-kz">VPS</span>
              <span className="text-xs text-slate-400">(+2h se express)</span>
            </label>
          </div>
        </div>

        {/* Recondicionamento */}
        <div className={SECTION}>
          <div className="text-xs font-semibold text-ka">RECONDICIONAMENTO</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: "ferro", label: "Ferro", horas: { rx: "6h", opx: "4h" } },
              { key: "bronze", label: "Bronze", horas: { rx: "15h", opx: "12h" } },
              { key: "prata", label: "Prata", horas: { rx: "30h", opx: "21h" } },
              { key: "ouro", label: "Ouro", horas: { rx: "40h", opx: "25h" } },
            ].map((cat) => {
              const familia = getReconFamilia(formData.modelo);
              const hLabel =
                familia === "rx_fmx" ? cat.horas.rx : familia === "opx_sf" ? cat.horas.opx : `${cat.horas.rx}/${cat.horas.opx}`;
              const active = formData.recondicao?.[cat.key];
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => {
                      const isActive = !!prev.recondicao?.[cat.key];
                      return {
                        ...prev,
                        recondicao: isActive
                          ? { ferro: false, bronze: false, prata: false, ouro: false }
                          : { ferro: false, bronze: false, prata: false, ouro: false, [cat.key]: true },
                      };
                    })
                  }
                  className={`p-2 rounded-lg border-2 text-center transition ${
                    active
                      ? "border-ka bg-ka/10 text-ka"
                      : "border-slate-600 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <div className="text-xs font-bold">{cat.label}</div>
                  <div className="text-xs opacity-75">{hLabel}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tempo estimado preview */}
        {(() => {
          const t = calcTempoEstimado({
            tarefas: [
              ...TAREFAS_PREDEFINIDAS.filter((t) => selectedTarefas[t]).map((texto) => ({ texto })),
              ...customTarefas.map((texto) => ({ texto })),
            ],
            isExpress: formData.isExpress,
            isVps: formData.isVps,
            recondicao: formData.recondicao,
            modelo: formData.modelo,
          });
          if (!t) return null;
          return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cpro/10 border border-cpro/30">
              <Timer className="w-4 h-4 text-cpro" />
              <span className="text-sm font-bold text-cpro">
                Tempo estimado: <span className="num">{fmtHuman(t)}</span>
              </span>
            </div>
          );
        })()}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="prioridade"
            checked={formData.prioridade || false}
            onChange={(e) => setFormData({ ...formData, prioridade: e.target.checked })}
            className="w-4 h-4 rounded accent-amber-500"
          />
          <label htmlFor="prioridade" className="text-sm text-slate-300">
            Marcar como Prioritária
          </label>
        </div>

        <div>
          <label className={`${LABEL} mb-2`}>Tarefas a Realizar</label>
          <div className="space-y-2 mb-3">
            {TAREFAS_PREDEFINIDAS.map((tarefa) => (
              <div key={tarefa} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`tarefa-${tarefa}`}
                  checked={!!selectedTarefas[tarefa]}
                  onChange={() => handleTarefaToggle(tarefa)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <label htmlFor={`tarefa-${tarefa}`} className="text-sm text-slate-300">
                  {tarefa}
                </label>
              </div>
            ))}
          </div>
          {customTarefas.length > 0 && (
            <div className="space-y-2 mb-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700">
              <p className="text-xs font-semibold text-slate-400">Tarefas Personalizadas:</p>
              {customTarefas.map((tarefa, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900/40">
                  <span className="text-sm text-slate-200">{tarefa}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomTarefa(idx)}
                    className="text-xs font-semibold text-red-400 hover:text-red-300"
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
              className={INPUT}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddCustomTarefa())
              }
            />
            <button
              type="button"
              onClick={handleAddCustomTarefa}
              className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-bold hover:bg-amber-500/90"
            >
              +
            </button>
          </div>
        </div>

        {!duplicateInfo && (
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={`${BTN_SECONDARY} flex-1`}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className={`${BTN_PRIMARY} flex-1`}>
              {isSubmitting ? "A criar..." : "Criar"}
            </button>
          </div>
        )}
      </form>
    </ModalShell>
  );
}