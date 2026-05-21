import React, { useState, useEffect } from "react";
import { Sparkles, Repeat, Package, Clock, Trash2, Timer, Plus, Minus, Flag, AlertTriangle } from "lucide-react";
import { calcTempoEstimado, getReconFamilia, fmtHuman, getTempoRecon, TEMPOS_PADRAO } from "../../lib/countdown";

function nextWorkDay(dateStr) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  if (dow === 6) d.setDate(d.getDate() + 2);
  if (dow === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const TIPO_ICONS = { nova: Sparkles, usada: Repeat, aluguer: Package };

const TAREFAS_PREDEFINIDAS = ["Preparação geral", "Revisão 3000h", "VPS", "EXPRESS"];

const ESTADOS = [
  { value: "a-fazer",               label: "A Fazer" },
  { value: "em-preparacao-raphael", label: "Em Preparação - Raphael" },
  { value: "em-preparacao-nuno",    label: "Em Preparação - Nuno" },
  { value: "em-preparacao-rogerio", label: "Em Preparação - Rogério" },
  { value: "em-preparacao-yano",    label: "Em Preparação - Yano" },
  { value: "em-preparacao-patrick", label: "Em Preparação - Patrick" },
  { value: "concluida-raphael",     label: "Concluída - Raphael" },
  { value: "concluida-nuno",        label: "Concluída - Nuno" },
  { value: "concluida-rogerio",     label: "Concluída - Rogério" },
  { value: "concluida-yano",        label: "Concluída - Yano" },
  { value: "concluida-patrick",     label: "Concluída - Patrick" },
];

const RECON_CATS = [
  { key: "ferro",  label: "Ferro",  horas: { rx: "6h",  opx: "4h"  } },
  { key: "bronze", label: "Bronze", horas: { rx: "15h", opx: "12h" } },
  { key: "prata",  label: "Prata",  horas: { rx: "30h", opx: "21h" } },
  { key: "ouro",   label: "Ouro",   horas: { rx: "40h", opx: "25h" } },
];

// ─── Helpers cores (tema escuro consistente com Watcher) ───────────────────
const C = {
  bg:      "linear-gradient(135deg, #0D0D1A 0%, #121228 100%)",
  card:    "rgba(255,255,255,0.04)",
  border:  "rgba(77,159,255,0.20)",
  borderH: "rgba(77,159,255,0.50)",
  text:    "#E8E8FF",
  sub:     "#7070A0",
  blue:    "#4D9FFF",
  pink:    "#FF2D78",
  green:   "#22C55E",
  amber:   "#F59E0B",
  purple:  "#A855F7",
  line:    "rgba(77,159,255,0.12)",
};

const inputStyle = {
  background: "rgba(0,0,0,0.25)",
  border: `1px solid ${C.border}`,
  borderRadius: "8px",
  color: C.text,
  padding: "8px 12px",
  width: "100%",
  outline: "none",
  fontSize: "13px",
  fontFamily: "monospace",
};

const labelStyle = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: C.sub,
  marginBottom: "6px",
  display: "block",
};

const sectionStyle = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: "10px",
  padding: "14px",
};

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
  const [customTarefas, setCustomTarefas]     = useState([]);
  const [newTarefaText, setNewTarefaText]     = useState("");
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [saveError, setSaveError]             = useState(null);
  // Gestão de tempo manual
  const [tempoManual, setTempoManual]         = useState(false);  // admin escolheu tempo manual?
  const [tempoHoras, setTempoHoras]           = useState(0);
  const [tempoMinutos, setTempoMinutos]       = useState(0);
  const [ajusteHoras, setAjusteHoras]         = useState(1);      // para +/- rápido

  // ── Inicializar com dados da máquina ──────────────────────────────────────
  useEffect(() => {
    if (!machine || !isOpen) return;
    setSaveError(null);

    const est = Number(machine.tempo_estimado_segundos) || 0;
    const hh  = Math.floor(est / 3600);
    const mm  = Math.floor((est % 3600) / 60);

    setFormData({
      modelo:        machine.modelo || "",
      serie:         machine.serie  || "",
      ano:           machine.ano    || "",
      tipo:          machine.tipo   || "nova",
      estado:        machine.estado || "a-fazer",
      tecnico:       machine.tecnico || null,
      prioridade:    machine.prioridade    || false,
      aguardaPecas:  machine.aguardaPecas  || false,
      previsao_inicio: machine.previsao_inicio ? String(machine.previsao_inicio).slice(0,10) : "",
      previsao_fim:    machine.previsao_fim   ? String(machine.previsao_fim).slice(0,10)   : "",
      isExpress:     machine.isExpress || false,
      isVps:         machine.isVps    || false,
      recondicao:    machine.recondicao || { ferro: false, bronze: false, prata: false, ouro: false },
      tempo_estimado_segundos: est || null,
    });

    const preSelected = {};
    const custom = [];
    (machine.tarefas || []).forEach(t => {
      if (TAREFAS_PREDEFINIDAS.includes(t.texto)) preSelected[t.texto] = true;
      else custom.push({ texto: t.texto, concluida: t.concluida });
    });
    setSelectedTarefas(preSelected);
    setCustomTarefas(custom);
    setTempoHoras(hh);
    setTempoMinutos(mm);
    setTempoManual(est > 0); // se já tinha tempo, começa com tempo manual visível
  }, [machine, isOpen]);

  // ── Tempo automático (recalcular sempre que tarefas/recon mudam) ──────────
  const tarefasActuais = [
    ...TAREFAS_PREDEFINIDAS.filter(t => selectedTarefas[t]).map(texto => ({ texto })),
    ...customTarefas.map(texto => ({ texto: typeof texto === "string" ? texto : texto.texto })),
  ];

  const tempoAuto = calcTempoEstimado({
    tarefas:    tarefasActuais,
    isExpress:  formData.isExpress,
    isVps:      formData.isVps,
    recondicao: formData.recondicao,
    modelo:     formData.modelo,
  });

  // Tempo efectivo: se manual e tempoHoras+tempoMinutos definidos → manual, senão auto
  const tempoEfetivo = tempoManual
    ? (tempoHoras * 3600 + tempoMinutos * 60) || null
    : (tempoAuto || null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEstadoChange = (novoEstado) => {
    let tecnico = null;
    if (novoEstado.includes("preparacao-") || novoEstado.includes("concluida-")) {
      const parts = novoEstado.split("-");
      tecnico = parts[parts.length - 1];
    }
    setFormData(prev => ({ ...prev, estado: novoEstado, tecnico }));
  };

  const handleReconToggle = (key) => {
    setFormData(prev => ({
      ...prev,
      recondicao: {
        ferro: false, bronze: false, prata: false, ouro: false,
        [key]: !prev.recondicao?.[key],
      },
    }));
  };

  const handleTempoAjuste = (delta) => {
    const total = Math.max(0, tempoHoras * 3600 + tempoMinutos * 60 + delta * 3600);
    setTempoHoras(Math.floor(total / 3600));
    setTempoMinutos(Math.floor((total % 3600) / 60));
    setTempoManual(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveError(null);

    const tarefas = [
      ...TAREFAS_PREDEFINIDAS.filter(t => selectedTarefas[t]).map(texto => {
        const existing = machine.tarefas?.find(t2 => t2.texto === texto);
        return { texto, concluida: existing?.concluida || false };
      }),
      ...customTarefas,
    ];

    try {
      await onSave({
        ...formData,
        ano:                    formData.ano ? String(formData.ano) : null,
        tarefas,
        previsao_inicio:        formData.previsao_inicio || null,
        previsao_fim:           formData.previsao_fim    || null,
        tempo_estimado_segundos: tempoEfetivo,
      });
    } catch (err) {
      setSaveError("Erro ao guardar. Tente novamente.");
      console.error(err);
    }
    setIsSubmitting(false);
  };

  if (!isOpen || !machine) return null;

  const familia = getReconFamilia(formData.modelo);
  const isRecon = Object.values(formData.recondicao || {}).some(Boolean);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9998, backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "95%", maxWidth: "560px",
        maxHeight: "90vh", overflowY: "auto",
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: "16px",
        boxShadow: `0 0 60px rgba(77,159,255,0.18), 0 0 120px rgba(255,45,120,0.08)`,
        zIndex: 9999,
        padding: "24px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "11px", color: C.blue, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>
              ✏ EDITAR MÁQUINA
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 900, color: C.text, letterSpacing: "0.08em" }}>
              {machine.serie}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.line}`, borderRadius: "8px", color: C.sub, cursor: "pointer", padding: "6px 10px", fontSize: "16px" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* ── Tipo de máquina ─────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <span style={labelStyle}>Tipo</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
              {Object.entries(TIPO_ICONS).map(([tipo, Icon]) => (
                <button key={tipo} type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo }))}
                  style={{
                    padding: "10px 8px", borderRadius: "8px", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                    background: formData.tipo === tipo ? `${C.blue}22` : "transparent",
                    border: `2px solid ${formData.tipo === tipo ? C.blue : C.line}`,
                    color: formData.tipo === tipo ? C.blue : C.sub,
                    transition: "all 0.15s",
                  }}>
                  <Icon size={16}/>
                  <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "capitalize", fontFamily: "monospace" }}>{tipo}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Modelo + Série + Ano ────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={labelStyle}>Modelo</label>
                <input style={inputStyle} value={formData.modelo}
                  onChange={e => setFormData(prev => ({ ...prev, modelo: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Número de Série</label>
                <input style={inputStyle} value={formData.serie}
                  onChange={e => setFormData(prev => ({ ...prev, serie: e.target.value }))} required />
              </div>
            </div>
            <div style={{ marginTop: "10px" }}>
              <label style={labelStyle}>Ano de Fabrico</label>
              <input style={{ ...inputStyle, width: "120px" }} type="number" value={formData.ano}
                onChange={e => setFormData(prev => ({ ...prev, ano: e.target.value }))} />
            </div>
          </div>

          {/* ── Estado ──────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Estado</label>
            <select style={{ ...inputStyle, colorScheme: "dark" }}
              value={formData.estado} onChange={e => handleEstadoChange(e.target.value)}>
              {ESTADOS.map(s => (
                <option key={s.value} value={s.value} style={{ background: "#0D0D1A" }}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* ── Tarefas ─────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Tarefas</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "6px", marginBottom: "10px" }}>
              {TAREFAS_PREDEFINIDAS.map(t => (
                <button key={t} type="button"
                  onClick={() => setSelectedTarefas(prev => ({ ...prev, [t]: !prev[t] }))}
                  style={{
                    padding: "7px 10px", borderRadius: "6px", cursor: "pointer",
                    background: selectedTarefas[t] ? `${C.blue}20` : "transparent",
                    border: `1.5px solid ${selectedTarefas[t] ? C.blue : C.line}`,
                    color: selectedTarefas[t] ? C.blue : C.sub,
                    fontSize: "11px", fontWeight: 700, fontFamily: "monospace",
                    textAlign: "left", letterSpacing: "0.04em",
                  }}>{t}</button>
              ))}
            </div>
            {/* Flags EXPRESS / VPS */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              {[["isExpress","⚡ EXPRESS", C.amber], ["isVps","🔧 VPS", C.blue]].map(([key, lbl, col]) => (
                <button key={key} type="button"
                  onClick={() => setFormData(prev => ({ ...prev, [key]: !prev[key] }))}
                  style={{
                    flex: 1, padding: "7px", borderRadius: "6px", cursor: "pointer",
                    background: formData[key] ? `${col}20` : "transparent",
                    border: `1.5px solid ${formData[key] ? col : C.line}`,
                    color: formData[key] ? col : C.sub,
                    fontSize: "11px", fontWeight: 700, fontFamily: "monospace",
                  }}>{lbl}</button>
              ))}
            </div>
            {/* Custom */}
            {customTarefas.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ flex: 1, fontFamily: "monospace", fontSize: "11px", color: C.text, padding: "5px 8px", background: "rgba(255,255,255,0.04)", borderRadius: "5px" }}>{t.texto}</span>
                <button type="button" onClick={() => setCustomTarefas(prev => prev.filter((_,j)=>j!==i))}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: C.pink }}><Trash2 size={12}/></button>
              </div>
            ))}
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Nova tarefa..." value={newTarefaText}
                onChange={e => setNewTarefaText(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter"){e.preventDefault(); if(newTarefaText.trim()){setCustomTarefas(p=>[...p,{texto:newTarefaText.trim(),concluida:false}]);setNewTarefaText("");}}} }/>
              <button type="button"
                onClick={() => { if(newTarefaText.trim()){setCustomTarefas(p=>[...p,{texto:newTarefaText.trim(),concluida:false}]);setNewTarefaText("");} }}
                style={{ padding: "8px 12px", borderRadius: "8px", background: `${C.blue}22`, border: `1px solid ${C.blue}`, color: C.blue, cursor: "pointer", fontSize: "13px" }}>+</button>
            </div>
          </div>

          {/* ── Recondicionamento ───────────────────────────────────────── */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Recondicionamento</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }}>
              {RECON_CATS.map(cat => {
                const hLabel = familia === "rx_fmx" ? cat.horas.rx : familia === "opx_sf" ? cat.horas.opx : `${cat.horas.rx}/${cat.horas.opx}`;
                const active = !!formData.recondicao?.[cat.key];
                return (
                  <button key={cat.key} type="button"
                    onClick={() => handleReconToggle(cat.key)}
                    style={{
                      padding: "8px 4px", borderRadius: "7px", cursor: "pointer",
                      background: active ? `${C.purple}22` : "transparent",
                      border: `2px solid ${active ? C.purple : C.line}`,
                      color: active ? C.purple : C.sub,
                      textAlign: "center",
                    }}>
                    <div style={{ fontSize: "11px", fontWeight: 800, fontFamily: "monospace" }}>{cat.label}</div>
                    <div style={{ fontSize: "9px", opacity: 0.7, fontFamily: "monospace", marginTop: "2px" }}>{hLabel}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Tempo estimado ──────────────────────────────────────────── */}
          <div style={{ ...sectionStyle, border: `1px solid rgba(245,158,11,0.25)` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <label style={{ ...labelStyle, color: C.amber, marginBottom: 0 }}>⏱ Tempo Estimado</label>
              {isAdmin && (
                <button type="button"
                  onClick={() => {
                    setTempoManual(prev => {
                      if (!prev) {
                        // Activar manual: iniciar com o auto ou com o actual
                        const base = tempoAuto || (Number(machine.tempo_estimado_segundos)||0);
                        setTempoHoras(Math.floor(base/3600));
                        setTempoMinutos(Math.floor((base%3600)/60));
                      }
                      return !prev;
                    });
                  }}
                  style={{
                    fontSize: "9px", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.08em",
                    padding: "3px 8px", borderRadius: "4px", cursor: "pointer",
                    background: tempoManual ? `${C.amber}20` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${tempoManual ? C.amber : C.line}`,
                    color: tempoManual ? C.amber : C.sub,
                  }}>
                  {tempoManual ? "MANUAL ✓" : "AUTO"}
                </button>
              )}
            </div>

            {/* Preview do tempo automático */}
            {!tempoManual && (
              <div style={{ fontFamily: "monospace", fontSize: "13px", color: tempoAuto ? C.green : C.sub, marginBottom: tempoAuto ? "0" : "4px" }}>
                {tempoAuto ? `✓ Calculado automaticamente: ${fmtHuman(tempoAuto)}` : "— Não determinado pelas tarefas actuais"}
              </div>
            )}

            {/* Editor manual */}
            {tempoManual && isAdmin && (
              <div>
                {/* Display HH:MM */}
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "28px", fontWeight: 900, color: C.amber, letterSpacing: "0.06em", marginBottom: "12px", textAlign: "center", textShadow: `0 0 20px rgba(245,158,11,0.4)` }}>
                  {String(tempoHoras).padStart(2,"0")}h {String(tempoMinutos).padStart(2,"0")}m
                </div>

                {/* Botões ± rápidos */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
                  {[-4,-2,-1].map(d => (
                    <button key={d} type="button" onClick={() => handleTempoAjuste(d)}
                      style={{ padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontFamily: "monospace", fontSize: "12px", fontWeight: 700,
                        background: `rgba(255,45,120,0.12)`, border: `1px solid rgba(255,45,120,0.3)`, color: C.pink }}>
                      {d}h
                    </button>
                  ))}
                  <div style={{ width: "1px", height: "24px", background: C.line }}/>
                  {[1,2,4].map(d => (
                    <button key={d} type="button" onClick={() => handleTempoAjuste(d)}
                      style={{ padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontFamily: "monospace", fontSize: "12px", fontWeight: 700,
                        background: `rgba(34,197,94,0.12)`, border: `1px solid rgba(34,197,94,0.3)`, color: C.green }}>
                      +{d}h
                    </button>
                  ))}
                </div>

                {/* Input fino HH e MM separados */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <label style={{ ...labelStyle, marginBottom: "4px" }}>Horas</label>
                    <input type="number" min="0" max="999" value={tempoHoras}
                      onChange={e => setTempoHoras(Math.max(0, Number(e.target.value) || 0))}
                      style={{ ...inputStyle, width: "70px", textAlign: "center", fontSize: "16px", fontWeight: 700 }}/>
                  </div>
                  <span style={{ color: C.sub, fontSize: "20px", fontWeight: 700, marginTop: "14px" }}>:</span>
                  <div style={{ textAlign: "center" }}>
                    <label style={{ ...labelStyle, marginBottom: "4px" }}>Min</label>
                    <input type="number" min="0" max="59" value={tempoMinutos}
                      onChange={e => setTempoMinutos(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                      style={{ ...inputStyle, width: "70px", textAlign: "center", fontSize: "16px", fontWeight: 700 }}/>
                  </div>
                </div>

                {/* Atalhos de tempo rápido */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px", justifyContent: "center" }}>
                  {[["2h", 2,0], ["4h", 4,0], ["6h", 6,0], ["8h", 8,0], ["12h", 12,0], ["15h", 15,0], ["21h", 21,0], ["30h", 30,0]].map(([lbl,h,m]) => (
                    <button key={lbl} type="button"
                      onClick={() => { setTempoHoras(h); setTempoMinutos(m); }}
                      style={{ padding: "4px 10px", borderRadius: "5px", cursor: "pointer", fontFamily: "monospace", fontSize: "10px", fontWeight: 700,
                        background: tempoHoras===h && tempoMinutos===m ? `${C.amber}25` : "rgba(255,255,255,0.05)",
                        border: `1px solid ${tempoHoras===h && tempoMinutos===m ? C.amber : C.line}`,
                        color: tempoHoras===h && tempoMinutos===m ? C.amber : C.sub }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Datas ───────────────────────────────────────────────────── */}
          <div style={{ ...sectionStyle, border: `1px solid rgba(255,45,120,0.20)` }}>
            <label style={{ ...labelStyle, color: C.pink }}>📅 Previsão (Portal da Frota)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={labelStyle}>Início previsto</label>
                <input type="date" style={{ ...inputStyle, colorScheme: "dark" }}
                  value={formData.previsao_inicio || ""}
                  onChange={e => { const wd = nextWorkDay(e.target.value); setFormData(prev => ({ ...prev, previsao_inicio: wd, previsao_fim: prev.previsao_fim && prev.previsao_fim < wd ? wd : prev.previsao_fim })); }} />
              </div>
              <div>
                <label style={labelStyle}>Entrega prevista</label>
                <input type="date" style={{ ...inputStyle, colorScheme: "dark" }}
                  min={formData.previsao_inicio || undefined}
                  value={formData.previsao_fim || ""}
                  onChange={e => setFormData(prev => ({ ...prev, previsao_fim: nextWorkDay(e.target.value) }))} />
              </div>
            </div>
          </div>

          {/* ── Flags ───────────────────────────────────────────────────── */}
          <div style={{ ...sectionStyle, display: "flex", gap: "10px" }}>
            {[["prioridade","🚨 Prioritária", C.pink], ["aguardaPecas","📦 Aguarda Peças", C.amber]].map(([key,lbl,col]) => (
              <button key={key} type="button"
                onClick={() => setFormData(prev => ({ ...prev, [key]: !prev[key] }))}
                style={{ flex: 1, padding: "9px", borderRadius: "8px", cursor: "pointer",
                  background: formData[key] ? `${col}18` : "transparent",
                  border: `1.5px solid ${formData[key] ? col : C.line}`,
                  color: formData[key] ? col : C.sub,
                  fontSize: "11px", fontWeight: 700, fontFamily: "monospace",
                }}>{lbl}</button>
            ))}
          </div>

          {/* ── Preview tempo efectivo ──────────────────────────────────── */}
          {tempoEfetivo && (
            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Timer size={14} color={C.green}/>
              <span style={{ fontFamily: "monospace", fontSize: "12px", color: C.green, fontWeight: 700 }}>
                Tempo a guardar: {fmtHuman(tempoEfetivo)}
                {tempoManual ? " (definido manualmente)" : " (calculado auto)"}
              </span>
            </div>
          )}

          {/* ── Erro ────────────────────────────────────────────────────── */}
          {saveError && (
            <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.3)", color: C.pink, fontSize: "12px", fontFamily: "monospace" }}>
              ⚠ {saveError}
            </div>
          )}

          {/* ── Botões ──────────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "11px", borderRadius: "8px", cursor: "pointer", fontFamily: "monospace", fontSize: "12px", fontWeight: 700,
                background: "transparent", border: `1px solid ${C.line}`, color: C.sub }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              style={{ flex: 2, padding: "11px", borderRadius: "8px", cursor: isSubmitting ? "not-allowed" : "pointer", fontFamily: "monospace", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em",
                background: isSubmitting ? "rgba(77,159,255,0.2)" : `linear-gradient(135deg, ${C.blue}, #2563EB)`,
                border: "none", color: "white", boxShadow: isSubmitting ? "none" : `0 0 20px rgba(77,159,255,0.35)` }}>
              {isSubmitting ? "A guardar…" : "✓ Guardar Alterações"}
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
