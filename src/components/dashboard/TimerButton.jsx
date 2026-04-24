import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Clock, Trash2 } from "lucide-react";

/**
 * TimerButton — botão de timer para máquinas no Watcher
 *
 * Campos no FrotaACP usados:
 *   timer_inicio          string ISO — quando o timer foi iniciado pela 1ª vez
 *   timer_fim             string ISO — quando foi parado definitivamente
 *   timer_duracao_minutos number     — tempo total acumulado (exclui pausas)
 *   timer_ativo           boolean    — está a correr agora?
 *   timer_pausado         boolean    — está pausado?
 *   timer_acumulado       number     — minutos acumulados antes da pausa atual
 *
 * Props:
 *   machine   — objeto FrotaACP
 *   onStart   — async (id) => void
 *   onPause   — async (id, acumuladoMinutos) => void
 *   onResume  — async (id) => void
 *   onStop    — async (id, duracaoTotal) => void
 *   onReset   — async (id) => void  [só admin]
 *   isAdmin   — boolean
 */

export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return null;
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}min`;
  return `${h}h${m > 0 ? ` ${m}min` : ""}`;
}

export function formatDateTime(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleString("pt-PT", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

/**
 * Hook que devolve os minutos decorridos em tempo real (tick a cada segundo).
 * Soma o acumulado anterior (timer_acumulado) ao tempo desde o último início.
 */
export function useElapsedTimer(machine) {
  const [elapsed, setElapsed] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    clearInterval(ref.current);

    const ativo = machine?.timer_ativo === true;
    const pausado = machine?.timer_pausado === true;
    const inicio = machine?.timer_inicio || null;
    const acumulado = machine?.timer_acumulado || 0;

    if (ativo && !pausado && inicio) {
      const update = () => {
        const diff = (Date.now() - new Date(inicio).getTime()) / 1000 / 60;
        setElapsed(acumulado + diff);
      };
      update();
      ref.current = setInterval(update, 1000);
    } else if (pausado) {
      setElapsed(acumulado);
    } else if (!ativo && machine?.timer_duracao_minutos != null) {
      setElapsed(machine.timer_duracao_minutos);
    } else {
      setElapsed(null);
    }

    return () => clearInterval(ref.current);
  }, [
    machine?.timer_ativo,
    machine?.timer_pausado,
    machine?.timer_inicio,
    machine?.timer_acumulado,
    machine?.timer_duracao_minutos
  ]);

  return elapsed;
}

export default function TimerButton({ machine, onStart, onPause, onResume, onStop, onReset, isAdmin }) {
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);

  const ativo   = machine?.timer_ativo === true;
  const pausado = machine?.timer_pausado === true;
  const done    = !ativo && machine?.timer_fim;
  const idle    = !ativo && !machine?.timer_inicio;

  const elapsed = useElapsedTimer(machine);

  const wrap = (fn) => async (e) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full" onClick={e => e.stopPropagation()}>

      {/* ── Linha de botões ── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* INICIAR */}
        {idle && (
          <button onClick={wrap(() => onStart(machine.id))} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 shadow">
            <Play className="w-3.5 h-3.5" />
            Iniciar
          </button>
        )}

        {/* Em curso — PAUSAR + PARAR */}
        {ativo && !pausado && (
          <>
            <button onClick={wrap(() => onPause(machine.id, elapsed ?? 0))} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 shadow">
              <Pause className="w-3.5 h-3.5" />
              Pausar
            </button>

            <button onClick={wrap(async () => {
              if (!confirmStop) { setConfirmStop(true); setTimeout(() => setConfirmStop(false), 3000); return; }
              setConfirmStop(false);
              await onStop(machine.id, elapsed ?? 0);
            })} disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all disabled:opacity-50 shadow ${confirmStop ? "bg-red-700 animate-pulse" : "bg-red-600 hover:bg-red-500"}`}>
              <Square className="w-3.5 h-3.5 fill-current" />
              {confirmStop ? "Confirmar?" : "Concluir"}
            </button>
          </>
        )}

        {/* Pausado — RETOMAR + PARAR */}
        {pausado && (
          <>
            <button onClick={wrap(() => onResume(machine.id))} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 shadow">
              <Play className="w-3.5 h-3.5" />
              Retomar
            </button>

            <button onClick={wrap(async () => {
              if (!confirmStop) { setConfirmStop(true); setTimeout(() => setConfirmStop(false), 3000); return; }
              setConfirmStop(false);
              await onStop(machine.id, elapsed ?? 0);
            })} disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all disabled:opacity-50 shadow ${confirmStop ? "bg-red-700 animate-pulse" : "bg-red-600 hover:bg-red-500"}`}>
              <Square className="w-3.5 h-3.5 fill-current" />
              {confirmStop ? "Confirmar?" : "Concluir"}
            </button>
          </>
        )}

        {/* Concluído — mostrar duração */}
        {done && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(machine.timer_duracao_minutos)}
          </span>
        )}

        {/* RESET — só admin */}
        {isAdmin && machine?.timer_inicio && (
          <button onClick={wrap(async () => {
            if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); return; }
            setConfirmReset(false);
            await onReset(machine.id);
          })} disabled={loading}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ml-auto ${
              confirmReset ? "bg-orange-600 text-white animate-pulse" : "bg-slate-200 hover:bg-slate-300 text-slate-600"
            }`}>
            <Trash2 className="w-3 h-3" />
            {confirmReset ? "Confirmar?" : "Reset"}
          </button>
        )}
      </div>

      {/* ── Cronómetro em tempo real ── */}
      {ativo && !pausado && elapsed !== null && (
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          {formatDuration(elapsed)}
          <span className="font-normal text-slate-400 text-[10px]">em curso</span>
        </div>
      )}

      {pausado && elapsed !== null && (
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-yellow-500">
          <Pause className="w-3 h-3" />
          {formatDuration(elapsed)}
          <span className="font-normal text-slate-400 text-[10px]">pausado</span>
        </div>
      )}

      {/* ── Metadados ── */}
      {machine?.timer_inicio && (
        <div className="text-[10px] text-slate-400 leading-tight space-y-0.5">
          <p>▶ Início: {formatDateTime(machine.timer_inicio)}</p>
          {machine?.timer_fim && <p>⏹ Fim: {formatDateTime(machine.timer_fim)}</p>}
        </div>
      )}
    </div>
  );
}
