import React, { useState } from "react";
import { Timer, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";

import ConeIcon from "./ConeIcon";
import { getTipo, getEstado } from "./constants";
import MaquinaCardDetails from "./MaquinaCardDetails";
import TimerButton, {
  useTimerElapsed,
  formatHMS,
  isTimerRunning,
  isTimerPaused,
} from "../dashboard/TimerButton";
import { calcTempoEstimado, fmtHuman } from "../../lib/countdown";
import { findTech } from "../../lib/technicians";

const PROGRESS_SEGMENTS = 20;

export default function MaquinaCard({
  machine,
  onClick,
  isSelected,
  onSelect,
  // compact (a-fazer)
  onAssign,
  showAssignButton,
  // technician (em-preparacao)
  onTimerPlay,
  onTimerPause,
  onTimerReset,
  onTimerImprevisto,
  onRemoveImprevisto,
  currentUser,
  isAdmin,
  // PRI chip clicável
  onTogglePriority,
  canSetPriority,
  isDragging,
}) {
  const [open, setOpen] = useState(false);
  const isTechnician = !!onTimerPlay;

  const tipo = getTipo(machine);
  const estado = getEstado(machine.estado);
  const tech = findTech(machine.tecnico);

  const hasExpress = machine.isExpress || machine.tarefas?.some(t => t.texto === "EXPRESS");
  const hasVps = machine.isVps || machine.tarefas?.some(t => t.texto === "VPS");
  const impCount = (Array.isArray(machine.imprevistos) ? machine.imprevistos : []).length;
  const isPrio = !!machine.prioridade;

  // ── Timer (hero) ──
  const elapsed = useTimerElapsed(machine);
  const running = isTimerRunning(machine);
  const paused = isTimerPaused(machine);
  const stored = Number(machine.tempo_estimado_segundos) || 0;
  const derived = stored > 0 ? 0 : (calcTempoEstimado({
    tarefas: machine.tarefas || [],
    isExpress: machine.isExpress,
    isVps: machine.isVps,
    recondicao: machine.recondicao,
    modelo: machine.modelo,
  }) || 0);
  const isCountdown = stored > 0;
  const over = isCountdown && elapsed > stored;
  const pct = isCountdown ? Math.min(100, (elapsed / stored) * 100) : 0;
  const litSegs = Math.round((pct / 100) * PROGRESS_SEGMENTS);
  const estDisplay = stored || derived;

  const timerColor = over ? "text-kv" : running ? "text-cpro" : paused ? "text-ccla" : "text-slate-500";
  const barColor = over ? "bg-kv" : "bg-cpro";

  // ── Tarefas (specs) ──
  const tarefas = Array.isArray(machine.tarefas) ? machine.tarefas : [];
  const tarefasDone = tarefas.filter(t => t.concluida).length;
  const tarefasTotal = tarefas.length;
  const tarefasText = tarefas.slice(0, 3).map(t => t.texto).join(", ");

  // ── Previsão ──
  const previsao = machine.previsao_fim
    ? (() => { try { return format(parseISO(String(machine.previsao_fim).slice(0, 10)), "dd/MM"); } catch { return null; } })()
    : null;

  const priClickable = !!(canSetPriority && onTogglePriority && machine.estado === "a-fazer");

  const containerCls = [
    "relative glass", tipo?.cat || "", "border border-slate-700 rounded-lg p-4 cursor-pointer transition hover:scale-[1.01] hover:shadow-lg",
    isPrio ? "ring-2 ring-amber-500" : "",
    isSelected ? "ring-2 ring-blue-400" : "",
    isDragging ? "ring-2 ring-amber-500 opacity-75 rotate-[1deg]" : "",
  ].join(" ");

  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); onSelect?.(machine); }
    else { onClick?.(machine); }
  };
  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(machine); }
  };

  return (
    <div role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKey} className={containerCls}>
      {/* PRI chip */}
      {isPrio && (priClickable ? (
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onTogglePriority(machine.id, !machine.prioridade); }}
          title="Alternar prioridade"
          className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg hover:bg-red-600"
        >PRI</button>
      ) : (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">PRI</span>
      ))}

      {/* HERO: NS + dot + foto */}
      <div className="flex items-center gap-3">
        <h3 className="ns-num tracking-wider text-slate-100 leading-none break-all flex-1 min-w-0">{machine.serie}</h3>
        {tech && <div className={`w-2 h-2 rounded-full shrink-0 ${tech.color}`} title={tech.name} />}
        {machine.imageUrl && <img src={machine.imageUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />}
      </div>

      {/* modelo · ano */}
      <div className="text-sm text-slate-400 truncate mt-1">
        {machine.modelo}{machine.ano ? ` · ${machine.ano}` : ""}
      </div>

      {/* BLOCO PROTAGONISTA — TIMER + CONE */}
      <div className="flex items-center gap-3 mt-2">
        <div className="flex-1 min-w-0">
          {isCountdown ? (
            <>
              <div className="flex items-center gap-3 py-1">
                <Timer className="w-5 h-5 text-slate-400" />
                <span className={`num text-2xl font-black tabular-nums ${timerColor}`}>{formatHMS(elapsed)}</span>
              </div>
              <div className="flex gap-0.5 h-1">
                {Array.from({ length: PROGRESS_SEGMENTS }).map((_, i) => (
                  <div key={i} className={`flex-1 rounded-sm ${i < litSegs ? barColor : "bg-slate-700"}`} />
                ))}
              </div>
            </>
          ) : (
            <div className="py-1">
              <span className="text-[10px] text-slate-500">SEM ESTIMATIVA</span>
            </div>
          )}
        </div>

        {machine.cone_cor && (
          <div className="flex flex-col items-center shrink-0">
            <ConeIcon color={machine.cone_cor} size={30} />
            {machine.cone_numero && <span className="num text-lg font-bold text-slate-200 leading-none">{machine.cone_numero}</span>}
          </div>
        )}
      </div>

      {/* BADGES */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {tipo && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tipo.bg} ${tipo.text} ${tipo.border}`}>{tipo.label}</span>
        )}
        {estado && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${estado.bg} ${estado.text}`}>
            <span className={`state-dot w-2 h-2 rounded-full inline-block ${estado.dot}`} />
            {estado.label}
          </span>
        )}
        {hasExpress && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">EXPRESS</span>}
        {hasVps && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">VPS</span>}
        {machine.aguardaPecas && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ccla/15 text-ccla border border-ccla/30">AGUARDA PEÇAS</span>}
        {impCount > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">IMPREVISTOS ×{impCount}</span>}
      </div>

      {/* SPECS */}
      {(tarefasTotal > 0 || previsao || estDisplay > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tarefasTotal > 0 && (
            <span className="text-[10px] text-slate-400 bg-slate-900/50 rounded px-1.5 py-0.5">
              {tarefasDone}/{tarefasTotal}{tarefasText ? ` · ${tarefasText}` : ""}
            </span>
          )}
          {previsao && <span className="text-[10px] text-slate-400 bg-slate-900/50 rounded px-1.5 py-0.5">→ {previsao}</span>}
          {estDisplay > 0 && (
            <span className="text-[10px] text-slate-400 bg-slate-900/50 rounded px-1.5 py-0.5">⏱ {fmtHuman(estDisplay)}{derived ? " ~" : ""}</span>
          )}
        </div>
      )}

      {/* BARRA DE AÇÕES */}
      {(isTechnician || (showAssignButton && onAssign)) && (
        <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
          {isTechnician ? (
            <TimerButton
              machine={machine}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onPlay={onTimerPlay}
              onPause={onTimerPause}
              onReset={onTimerReset}
              onImprevisto={onTimerImprevisto}
              compact
            />
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAssign(machine); }}
              className="flex-1 py-1.5 rounded text-xs font-bold transition bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center gap-1"
            >
              <ChevronRight className="w-3 h-3" /> ATRIBUIR
            </button>
          )}
        </div>
      )}

      {/* DETALHES */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-full flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 mt-3 pt-2 border-t border-slate-700"
      >
        <span>detalhes</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <MaquinaCardDetails machine={machine} onRemoveImprevisto={onRemoveImprevisto} currentUser={currentUser} isAdmin={isAdmin} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}