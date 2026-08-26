import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { surfaces } from "../../lib/theme";

const fmtDur = (secs) => {
  const s = Number(secs) || 0;
  if (!s) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h === 0 ? `${m}min` : m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
};

/**
 * Linha compacta e legível de uma máquina concluída.
 * Hierarquia clara: série (destaque) → modelo → técnico + data + duração.
 */
export default function CompletedMachineRow({ machine, tech, onClick }) {
  const { isDark, isGlass } = useTheme();
  const S = surfaces(isDark, isGlass);
  const accent = tech?.borderColor || '#22C55E';
  const dur = fmtDur(machine.timer_accumulated_seconds);
  const date = machine.dataConclusao
    ? new Date(machine.dataConclusao).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
    : null;

  return (
    <button
      onClick={() => onClick?.(machine)}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 10px',
        background: S.card,
        backdropFilter: S.blur, WebkitBackdropFilter: S.blur,
        border: `1px solid ${S.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: isGlass ? '10px' : '6px',
        boxShadow: isGlass ? S.shadow : 'none',
      }}
    >
      {/* Avatar técnico */}
      <div style={{
        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
        background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontSize: '10px', fontWeight: 900, color: '#fff',
      }}>
        {(tech?.name || '?').charAt(0)}
      </div>

      {/* Série + modelo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'monospace', fontSize: '13px', fontWeight: 900,
          color: S.text, letterSpacing: '0.06em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{machine.serie}</div>
        <div style={{
          fontFamily: 'monospace', fontSize: '9px', color: S.muted,
          textTransform: 'uppercase', letterSpacing: '0.05em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{machine.modelo}</div>
      </div>

      {/* Meta à direita */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
        {dur && (
          <span style={{
            fontFamily: 'monospace', fontSize: '9px', fontWeight: 800,
            padding: '1px 6px', borderRadius: '4px',
            background: 'rgba(34,197,94,0.14)', color: '#22C55E',
            border: '1px solid rgba(34,197,94,0.3)', letterSpacing: '0.04em',
          }}>{dur}</span>
        )}
        {date && (
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: S.muted }}>{date}</span>
        )}
      </div>

      <CheckCircle2 style={{ width: '14px', height: '14px', color: '#22C55E', flexShrink: 0 }} />
    </button>
  );
}