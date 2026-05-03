import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

// ─── Modelo de dados na DB ───────────────────────────────────────────────────
// Apenas DOIS campos persistidos em FrotaACP:
//   - timer_running_since      (ISO string | null)  →  marco do play actual
//   - timer_accumulated_seconds (number    | null)  →  segundos somados de
//                                                     sessões anteriores
// A partir destes derivam-se: idle, em curso, pausado, e o tempo total.

export function getTimerElapsedSeconds(m) {
  if (!m) return 0;
  const acc = Number(m.timer_accumulated_seconds) || 0;
  const since = m.timer_running_since;
  if (!since) return acc;
  const diff = (Date.now() - new Date(since).getTime()) / 1000;
  return acc + Math.max(0, diff);
}

export function isTimerRunning(m) {
  return !!m?.timer_running_since;
}

export function isTimerPaused(m) {
  return !m?.timer_running_since && (Number(m?.timer_accumulated_seconds) || 0) > 0;
}

export function isTimerIdle(m) {
  return !m?.timer_running_since && !(Number(m?.timer_accumulated_seconds) || 0);
}

// ─── Permissões ──────────────────────────────────────────────────────────────
// Só dá para mexer no timer se a máquina estiver "em-preparacao-*".
//   - admin → pode tudo
//   - técnico → só nos seus próprios cards
export function canControlTimer(machine, currentUser, isAdmin) {
  if (!machine?.estado?.startsWith("em-preparacao-")) return false;
  if (isAdmin) return true;
  const tech = currentUser?.nome_tecnico;
  return !!tech && machine.tecnico === tech;
}

// ─── Formatador HH:MM:SS ─────────────────────────────────────────────────────
export function formatHMS(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return "00:00:00";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = n => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

// ─── Hook: ticker em tempo real ──────────────────────────────────────────────
// Retorna o nº de segundos decorridos. Se o timer está a correr, faz tick a 1s.
export function useTimerElapsed(machine) {
  const ref = useRef(machine);
  const [elapsed, setElapsed] = useState(() => getTimerElapsedSeconds(machine));

  useEffect(() => { ref.current = machine; });

  useEffect(() => {
    setElapsed(getTimerElapsedSeconds(machine));
    if (!isTimerRunning(machine)) return;
    const id = setInterval(() => {
      setElapsed(getTimerElapsedSeconds(ref.current));
    }, 1000);
    return () => clearInterval(id);
  }, [machine?.timer_running_since, machine?.timer_accumulated_seconds]);

  return elapsed;
}

// ─── Componente: contador + botões ───────────────────────────────────────────
// Props:
//   machine, currentUser, isAdmin, onPlay(id), onPause(id), onReset(id),
//   compact?: boolean — versão pequena para usar dentro do card
export default function TimerButton({
  machine, currentUser, isAdmin,
  onPlay, onPause, onReset,
  compact = false,
}) {
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const elapsed = useTimerElapsed(machine);
  const running = isTimerRunning(machine);
  const paused  = isTimerPaused(machine);
  const idle    = isTimerIdle(machine);
  const allowed = canControlTimer(machine, currentUser, isAdmin);

  const wrap = (fn) => async (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (busy) return;
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const dotColor   = running ? "#22C55E" : paused ? "#F59E0B" : "#64748B";
  const labelColor = running ? "#22C55E" : paused ? "#F59E0B" : "#94A3B8";
  const fontSize   = compact ? 12 : 14;

  return (
    <div onClick={(e) => e.stopPropagation()}
         className="flex items-center gap-2 flex-wrap">
      {/* contador ao vivo */}
      <div className="flex items-center gap-1.5">
        <span style={{
          width: 8, height: 8, borderRadius: 999,
          background: dotColor,
          boxShadow: running ? `0 0 8px ${dotColor}` : "none",
          animation: running ? "pulse 1.5s ease-in-out infinite" : "none",
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "monospace", fontWeight: 800, fontSize,
          color: labelColor, letterSpacing: "0.04em",
          fontVariantNumeric: "tabular-nums",
        }}>
          {formatHMS(elapsed)}
        </span>
      </div>

      {/* PLAY / RETOMAR */}
      {allowed && !running && (
        <button
          onPointerDown={wrap(() => onPlay(machine.id))}
          disabled={busy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono text-emerald-500 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 transition"
        >
          <Play className="w-3 h-3 fill-current" />
          {idle ? "INICIAR" : "RETOMAR"}
        </button>
      )}

      {/* PAUSAR */}
      {allowed && running && (
        <button
          onPointerDown={wrap(() => onPause(machine.id))}
          disabled={busy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono text-amber-500 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 transition"
        >
          <Pause className="w-3 h-3 fill-current" />
          PAUSAR
        </button>
      )}

      {/* RESET — só admin, com confirmação */}
      {isAdmin && !idle && (
        <button
          onPointerDown={wrap(async () => {
            if (!confirmReset) {
              setConfirmReset(true);
              setTimeout(() => setConfirmReset(false), 3000);
              return;
            }
            setConfirmReset(false);
            await onReset(machine.id);
          })}
          disabled={busy}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold font-mono border disabled:opacity-50 transition ${
            confirmReset
              ? "bg-red-600 text-white border-red-700 animate-pulse"
              : "bg-slate-500/10 text-slate-400 border-slate-500/30 hover:bg-slate-500/20"
          }`}
        >
          <RotateCcw className="w-3 h-3" />
          {confirmReset ? "CONFIRMAR?" : "RESET"}
        </button>
      )}
    </div>
  );
}
