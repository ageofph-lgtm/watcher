import React from "react";
import { CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import ConeIcon from "./ConeIcon";
import { getTipo } from "./constants";

const fmtDur = (secs) => {
  const s = Number(secs) || 0;
  if (!s) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h === 0 ? `${m}min` : m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
};

const fmtDate = (s) => {
  if (!s) return null;
  try { return format(parseISO(String(s).slice(0, 10)), "dd/MM"); } catch { return null; }
};

/**
 * Linha compacta de uma máquina concluída (substitui CompletedMachineRow).
 * Mesmo molde do MaquinaCard: glass + cat-* + cone + tempo total.
 */
export default function MaquinaMiniCard({ machine, tech, onClick }) {
  const tipo = getTipo(machine);
  const dur = fmtDur(machine.timer_accumulated_seconds);
  const date = fmtDate(machine.dataConclusao);

  return (
    <button
      onClick={() => onClick?.(machine)}
      className={`w-full text-left glass ${tipo?.cat || ""} border border-slate-700 rounded-lg p-2 flex items-center gap-3 cursor-pointer hover:scale-[1.01] hover:shadow-lg transition`}
    >
      <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black text-white ${tech?.color || "bg-slate-500"}`}>
        {(tech?.name || "?").charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="ns-num text-sm text-slate-100 truncate">{machine.serie}</div>
        <div className="text-[9px] text-slate-400 uppercase truncate">{machine.modelo}</div>
      </div>

      {machine.cone_cor && (
        <div className="flex items-center gap-1 shrink-0">
          <ConeIcon color={machine.cone_cor} size={18} />
          {machine.cone_numero && <span className="num text-xs text-slate-200">{machine.cone_numero}</span>}
        </div>
      )}

      {dur && <span className="num text-cpro text-xs shrink-0">{dur}</span>}
      {date && <span className="text-[9px] text-slate-400 shrink-0">{date}</span>}
      <CheckCircle2 className="w-3.5 h-3.5 text-cpro shrink-0" />
    </button>
  );
}