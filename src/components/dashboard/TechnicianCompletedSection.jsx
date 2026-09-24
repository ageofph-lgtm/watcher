import React, { useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { findTech } from "../../lib/technicians";
import MaquinaMiniCard from "../watcher/MaquinaMiniCard";

// Tokens ATLAS por técnico — classes Tailwind literais (purge-safe)
const TECH_DOT = {
  raphael: "bg-kv",
  nuno:    "bg-ka",
  rogerio: "bg-kz",
  patrick: "bg-kn",
  yano:    "bg-cpro",
};
const dotClass = (id) => TECH_DOT[id] || "bg-slate-500";

/**
 * Lista recolhível das máquinas concluídas de um técnico.
 * Agrupa por dia para leitura rápida. Molde ATLAS (zero style={{}}).
 */
export default function TechnicianCompletedSection({ machines, techId, onOpenMachine }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const tech = findTech(techId);

  const sorted = [...machines].sort((a, b) => {
    const da = a.dataConclusao ? new Date(a.dataConclusao).getTime() : 0;
    const db = b.dataConclusao ? new Date(b.dataConclusao).getTime() : 0;
    return db - da;
  });

  // Agrupar por dia
  const groups = [];
  sorted.forEach(m => {
    const key = m.dataConclusao
      ? new Date(m.dataConclusao).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'sem data';
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(m);
    else groups.push({ key, items: [m] });
  });

  return (
    <div className="mx-2 my-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg glass border border-slate-700 cursor-pointer hover:bg-slate-700/30 transition"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass(techId)}`} />
        <CheckCircle2 className="w-3 h-3 text-cpro shrink-0" />
        <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-slate-200">Concluídas</span>
        <span className="num text-[10px] font-bold px-2 py-0.5 rounded-full text-cpro bg-cpro/15 border border-cpro/30">
          {machines.length}
        </span>
        <span className="ml-auto">
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 max-h-[260px] overflow-y-auto flex flex-col gap-1.5">
              {groups.map(g => (
                <div key={g.key}>
                  <div className="font-mono text-[8px] font-bold tracking-wider uppercase text-slate-400 px-1 py-1">
                    {g.key} · {g.items.length}
                  </div>
                  <div className="flex flex-col gap-1">
                    {g.items.map(m => (
                      <MaquinaMiniCard key={m.id} machine={m} tech={tech} onClick={onOpenMachine} />
                    ))}
                  </div>
                </div>
              ))}
              {machines.length === 0 && (
                <div className="py-3.5 text-center font-mono text-[9px] text-slate-400 opacity-60">
                  nenhuma concluída
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}