import React, { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../ThemeContext";
import { surfaces } from "../../lib/theme";
import { findTech } from "../../lib/technicians";
import CompletedMachineRow from "./CompletedMachineRow";

/**
 * Lista recolhível das máquinas concluídas de um técnico.
 * Agrupa por dia para leitura rápida.
 */
export default function TechnicianCompletedSection({ machines, techId, onOpenMachine }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isDark, isGlass } = useTheme();
  const S = surfaces(isDark, isGlass);
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
    <div style={{ margin: '10px 8px 8px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 11px', borderRadius: isGlass ? '10px' : '6px',
          border: `1px solid ${S.border}`,
          background: S.card,
          backdropFilter: isGlass ? S.blur : 'none', WebkitBackdropFilter: isGlass ? S.blur : 'none',
          cursor: 'pointer',
        }}
      >
        <CheckCircle2 style={{ width: '13px', height: '13px', color: '#22C55E', flexShrink: 0 }} />
        <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, color: S.text, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Concluídas
        </span>
        <span style={{
          fontFamily: 'monospace', fontSize: '10px', fontWeight: 800, padding: '1px 7px',
          borderRadius: '20px', background: 'rgba(34,197,94,0.14)', color: '#22C55E',
          border: '1px solid rgba(34,197,94,0.3)',
        }}>{machines.length}</span>
        <span style={{ marginLeft: 'auto', display: 'flex' }}>
          {isExpanded
            ? <ChevronUp style={{ width: '14px', height: '14px', color: S.muted }} />
            : <ChevronDown style={{ width: '14px', height: '14px', color: S.muted }} />}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: '6px', maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {groups.map(g => (
                <div key={g.key}>
                  <div style={{
                    fontFamily: 'monospace', fontSize: '8px', fontWeight: 700,
                    color: S.muted, letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '5px 2px 3px',
                  }}>{g.key} · {g.items.length}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {g.items.map(m => (
                      <CompletedMachineRow key={m.id} machine={m} tech={tech} onClick={onOpenMachine} />
                    ))}
                  </div>
                </div>
              ))}
              {machines.length === 0 && (
                <div style={{ padding: '14px', textAlign: 'center', fontFamily: 'monospace', fontSize: '9px', color: S.muted, opacity: 0.6 }}>
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