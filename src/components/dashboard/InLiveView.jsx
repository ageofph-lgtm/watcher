/**
 * InLiveView.jsx — Modo "Ao Vivo" do WATCHER
 * 
 * Preserva:
 *   - Barra KPI exacta (ANDAMENTO · STANDBY · PRIORITÁRIAS · TIMELINE · PRÓXIMAS · NTS · RECON · ESTA SEMANA · HOJE · MED.H/MÁQ · TOTAL 2026)
 *   - Sequência de slides original
 *   - ESC fecha o modo
 *   - TimerButton + lógica de countdown existente
 * 
 * Adiciona (redesign v2):
 *   - Template de card único com anatomia fixa
 *   - Barra de progresso regressiva (RESTAM) como co-protagonista do NS
 *   - Spine esquerda = cor do técnico
 *   - Badge de tipo: NTS · RECON · ACP
 *   - Pulsação APENAS no card atrasado
 *   - Layout adaptativo por contagem de cards
 *   - Placa preta sob o NS
 *   - HUD corners em risco/atrasado
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTimerElapsed, formatHMS, isTimerRunning, isTimerPaused, getTimerElapsedSeconds } from "../components/dashboard/TimerButton";
import { calcTempoEstimado } from "../lib/countdown";

// ══════════════════════════════════════════════
//  TOKENS — sistema semântico de cor
// ══════════════════════════════════════════════
const T = {
  bg:       '#0D0D0F',
  surface:  '#141416',
  plate:    '#07070a',
  brand:    '#C8102E',
  ok:       '#2BE564',
  risk:     '#FFB200',
  late:     '#FF3344',
  reconC:   '#9B7BFF',
  cyan:     '#5CFFFF',
  ntsC:     '#FF3344',
  acpC:     '#4D9FFF',
  text:     '#ECECEC',
  muted:    '#7C7C82',
  dim:      '#3a3a42',
  line:     'rgba(210,210,210,0.08)',
};

// Cor por técnico — fora da família ok/risk/late para nunca confundir com estado
const TECH_COLORS = {
  raphael: '#FFD166',
  nuno:    '#B68BFF',
  rogerio: '#FF8C69',
  yano:    '#5CFFFF',
  patrick: '#90EE90',
};
const TECH_DEFAULT = 'rgba(150,150,150,0.5)';

// Tipo da máquina → badge + cor
function getTipoBadge(machine) {
  const tipo = machine.tipo_origem || machine.tipoOrigem || '';
  if (tipo === 'nova' || tipo === 'nts')    return { label: 'NTS',  color: T.ntsC,  bg: 'rgba(255,51,68,.09)',  border: 'rgba(255,51,68,.3)' };
  if (tipo === 'usada' || tipo === 'recon') return { label: 'RECON', color: T.reconC, bg: 'rgba(155,123,255,.09)', border: 'rgba(155,123,255,.3)' };
  if (tipo === 'aluguer' || tipo === 'acp') return { label: 'ACP',  color: T.acpC,  bg: 'rgba(77,159,255,.09)', border: 'rgba(77,159,255,.3)' };
  // fallback: tenta inferir pelo estado
  if (machine.estado?.includes('recon')) return { label: 'RECON', color: T.reconC, bg: 'rgba(155,123,255,.09)', border: 'rgba(155,123,255,.3)' };
  return null;
}

function getTechId(machine) {
  const e = machine.estado || '';
  const match = e.match(/(?:em-preparacao|concluida)-(.+)/);
  if (match) return match[1];
  return machine.tecnico || null;
}

function fmt(s) {
  if (s <= 0) s = 0;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}

function stateColor(ratio) {
  if (ratio >= 1) return T.late;
  if (ratio >= 0.75) return T.risk;
  return T.ok;
}

// ══════════════════════════════════════════════
//  CARD INDIVIDUAL — template único InLive v2
// ══════════════════════════════════════════════
function InLiveCard({ machine, density }) {
  const elapsed   = useTimerElapsed(machine);
  const running   = isTimerRunning(machine);
  const paused    = isTimerPaused(machine);
  const meta      = Number(machine.tempo_estimado_segundos) || 0;
  const techId    = getTechId(machine);
  const techColor = TECH_COLORS[techId] || TECH_DEFAULT;
  const tipoBadge = getTipoBadge(machine);
  const isPrio    = !!machine.prioridade;
  const isExpress = machine.tarefas?.some(t => t.texto === 'EXPRESS');
  const tasks     = machine.tarefas?.filter(t => t.texto !== 'EXPRESS' && !t.concluida) || [];
  const isLate    = meta > 0 && elapsed > meta;
  const isRisk    = meta > 0 && !isLate && (elapsed / meta) >= 0.75;
  const stColor   = meta > 0 ? stateColor(elapsed / meta) : (running ? T.ok : T.muted);
  const pct       = meta > 0 ? Math.min((elapsed / meta) * 100, 100) : 0;
  const restam    = Math.max(meta - elapsed, 0);
  const atraso    = elapsed - meta;

  // Modo lista densa (9+) — linha horizontal compacta
  if (density === 'list') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '9px 14px',
        background: `linear-gradient(90deg, color-mix(in srgb, ${stColor} 6%, ${T.surface}), ${T.surface})`,
        border: `1px solid color-mix(in srgb, ${stColor} 22%, transparent)`,
        borderLeft: `3px solid ${techColor}`,
        borderRadius: 5,
        position: 'relative',
        animation: isLate ? 'pulseCard 1.4s ease-in-out infinite' : 'none',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${stColor}, transparent 80%)` }} />
        {/* NS */}
        <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 800, fontSize: 15,
          letterSpacing: '.04em', color: '#fff', flexShrink: 0, minWidth: 180 }}>
          {machine.serie}
        </div>
        {/* modelo */}
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 11,
          letterSpacing: '.12em', color: T.muted, flexShrink: 0 }}>
          {machine.modelo}
        </div>
        {/* tipo badge */}
        {tipoBadge && (
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 9,
            letterSpacing: '.1em', padding: '2px 6px', borderRadius: 3,
            color: tipoBadge.color, background: tipoBadge.bg,
            border: `1px solid ${tipoBadge.border}`, flexShrink: 0 }}>
            {tipoBadge.label}
          </span>
        )}
        {/* barra */}
        {meta > 0 && (
          <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`,
              background: isLate
                ? 'repeating-linear-gradient(45deg,#FF3344 0 4px,#8b1520 4px 8px)'
                : stColor,
              boxShadow: `0 0 6px ${stColor}`,
              borderRadius: 3 }} />
          </div>
        )}
        {/* timer */}
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
          fontSize: 13, color: stColor, flexShrink: 0 }}>
          {fmt(elapsed)}
          {meta > 0 && <span style={{ color: T.muted, fontSize: 10, marginLeft: 4 }}>/{fmt(meta)}</span>}
        </div>
        {/* dot técnico */}
        <div style={{ width: 8, height: 8, borderRadius: '50%',
          background: techColor, boxShadow: `0 0 6px ${techColor}`, flexShrink: 0 }} />
      </div>
    );
  }

  // Modo normal — card vertical
  const compact = density === 'compact'; // 5-8 máquinas

  return (
    <div style={{
      position: 'relative',
      borderRadius: 7,
      overflow: 'hidden',
      background: `linear-gradient(180deg, color-mix(in srgb, ${stColor} 8%, ${T.surface}), ${T.surface} 44%)`,
      border: `1px solid color-mix(in srgb, ${stColor} 26%, transparent)`,
      boxShadow: `0 0 0 1px rgba(0,0,0,.45), 0 18px 48px -28px color-mix(in srgb, ${stColor} 60%, transparent)`,
      animation: isLate ? 'pulseCard 1.4s ease-in-out infinite' : 'none',
    }}>
      {/* Linha de topo = ESTADO */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${stColor} 0, transparent 88%)`,
        boxShadow: `0 0 12px ${stColor}`, zIndex: 3 }} />
      {/* Spine esquerda = TÉCNICO */}
      <div style={{ position: 'absolute', top: 12, bottom: 12, left: 0, width: 3,
        borderRadius: '0 3px 3px 0', background: techColor, zIndex: 3 }} />
      {/* HUD corners em risco ou atrasado */}
      {(isRisk || isLate) && (<>
        <div style={{ position: 'absolute', top: 6, right: 6, width: 9, height: 9,
          borderTop: `1.5px solid ${stColor}`, borderRight: `1.5px solid ${stColor}`, opacity: .65, zIndex: 4 }} />
        <div style={{ position: 'absolute', bottom: 6, left: 6, width: 9, height: 9,
          borderBottom: `1.5px solid ${stColor}`, borderLeft: `1.5px solid ${stColor}`, opacity: .65, zIndex: 4 }} />
      </>)}

      <div style={{ padding: compact ? '11px 14px 10px' : '13px 15px 12px' }}>

        {/* ROW 1: badges + timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {/* estado badge */}
          {isLate  && <BadgePill color={T.late}  bg="rgba(255,51,68,.1)"   border="rgba(255,51,68,.35)">✕ ATRASADO</BadgePill>}
          {isRisk  && !isLate && <BadgePill color={T.risk}  bg="rgba(255,178,0,.1)"  border="rgba(255,178,0,.28)">⚠ RISCO</BadgePill>}
          {!isRisk && !isLate && running && (
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 9.5,
              letterSpacing: '.1em', padding: '2px 7px', borderRadius: 3,
              color: T.ok, background: 'rgba(43,229,100,.1)', border: '1px solid rgba(43,229,100,.28)',
              display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.ok,
                boxShadow: `0 0 5px ${T.ok}`, animation: 'blink 1.6s infinite' }} />
              RUN
            </span>
          )}
          {paused && !running && (
            <BadgePill color={T.risk} bg="rgba(255,178,0,.1)" border="rgba(255,178,0,.28)">⏸ PAUSA</BadgePill>
          )}
          {isPrio    && <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 9.5,
            letterSpacing: '.1em', padding: '2px 7px', borderRadius: 3,
            color: '#0a0a0a', background: T.risk }}>PRIO</span>}
          {tipoBadge && <BadgePill color={tipoBadge.color} bg={tipoBadge.bg} border={tipoBadge.border}>{tipoBadge.label}</BadgePill>}

          {/* TIMER — direita, JetBrains Mono */}
          <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
              fontSize: compact ? 17 : 20, letterSpacing: '.02em', color: stColor, lineHeight: 1 }}>
              {fmt(elapsed)}
            </div>
            {meta > 0 && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5,
                color: T.muted, letterSpacing: '.06em', marginTop: 2 }}>
                / {fmt(meta)} meta
              </div>
            )}
          </div>
        </div>

        {/* NS — herói sobre placa preta */}
        <div style={{
          background: T.plate, border: `1px solid ${T.line}`, borderRadius: 5,
          padding: compact ? '11px 8px 8px' : '13px 8px 10px',
          marginBottom: compact ? 8 : 9, textAlign: 'center'
        }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 800,
            letterSpacing: '.04em', fontSize: compact ? 18 : 22, lineHeight: 1.05,
            color: '#fff', textShadow: '0 0 18px rgba(255,255,255,.09)' }}>
            {machine.serie}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: compact ? 11 : 12,
            letterSpacing: '.14em', color: T.muted, marginTop: compact ? 4 : 5 }}>
            {machine.modelo}
          </div>
        </div>

        {/* Tasks */}
        {!compact && tasks.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            {tasks.slice(0, 3).map((t, i) => (
              <span key={i} style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 10,
                letterSpacing: '.03em', color: '#cfcfd4',
                background: 'rgba(255,255,255,.04)', border: `1px solid ${T.line}`,
                padding: '2px 8px', borderRadius: 3 }}>
                <span style={{ color: stColor }}>▸ </span>{t.texto}
              </span>
            ))}
          </div>
        )}

        {/* BARRA DE PROGRESSO — elemento-assinatura */}
        {meta > 0 && (
          <div style={{ marginBottom: compact ? 8 : 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                fontSize: 12, letterSpacing: '.04em', color: stColor }}>
                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 9,
                  color: T.muted, letterSpacing: '.18em', marginRight: 5 }}>
                  {isLate ? '+ATRASO' : 'RESTAM'}
                </span>
                {isLate ? fmt(atraso) : fmt(restam)}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted }}>
                {isLate ? `+${Math.round(((elapsed/meta)-1)*100)}% acima` : `${Math.round(pct)}%`}
              </div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`, borderRadius: 3,
                background: isLate
                  ? 'repeating-linear-gradient(45deg,#FF3344 0 5px,#8b1520 5px 10px)'
                  : stColor,
                boxShadow: `0 0 8px ${stColor}`,
                transition: 'width .6s ease',
              }} />
            </div>
          </div>
        )}

        {/* RODAPÉ: dot técnico + datas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.muted }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%',
              background: techColor, boxShadow: `0 0 6px ${techColor}`, flexShrink: 0 }} />
            TÉC
          </div>
          {(machine.dataInicioPrevista || machine.dataEntrada) && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, color: '#b0b0ba', fontSize: 10 }}>
              {machine.dataEntrada && (
                <span>► <b style={{ color: '#6FC3FF' }}>
                  {new Date(machine.dataEntrada).toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit' })}
                </b></span>
              )}
              {machine.dataInicioPrevista && (
                <span>✓ <b style={{ color: isLate ? T.late : isRisk ? T.risk : T.ok }}>
                  {new Date(machine.dataInicioPrevista).toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit' })}
                </b></span>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Pill badge reutilizável
function BadgePill({ color, bg, border, children }) {
  return (
    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 9.5,
      letterSpacing: '.1em', padding: '2px 7px', borderRadius: 3,
      color, background: bg, border: `1px solid ${border}`,
      display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

// ══════════════════════════════════════════════
//  GRID ADAPTATIVO por nº de máquinas
// ══════════════════════════════════════════════
function getGridConfig(n) {
  if (n === 1)  return { cols: '1fr',                density: 'normal'  };
  if (n === 2)  return { cols: '1fr 1fr',            density: 'normal'  };
  if (n <= 4)   return { cols: 'repeat(3, 1fr)',     density: 'normal'  };
  if (n <= 8)   return { cols: 'repeat(3, 1fr)',     density: 'compact' };
  return              { cols: '1fr',                 density: 'list'    };
}

// ══════════════════════════════════════════════
//  SLIDE — wrapper genérico com header
// ══════════════════════════════════════════════
function Slide({ title, icon, color, count, children, emptyMsg }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header do slide */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14,
        borderBottom: `1px solid ${T.line}`, paddingBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 4, display: 'grid', placeItems: 'center',
          fontSize: 14, border: `1.5px solid ${color}`, color, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 800,
          letterSpacing: '.16em', fontSize: 22, lineHeight: 1 }}>
          {title}
        </div>
        <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: 700,
          color, fontSize: 13,
          background: `color-mix(in srgb, ${color} 9%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
          padding: '2px 10px', borderRadius: 4 }}>
          ×{String(count).padStart(2,'0')}
        </span>
        <div style={{ flex: 1, height: 1,
          background: `linear-gradient(90deg, color-mix(in srgb, ${color} 35%, transparent), transparent)` }} />
        {/* legenda tipos */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {[['NTS',T.ntsC],['RECON',T.reconC],['ACP',T.acpC]].map(([lbl,c]) => (
            <span key={lbl} style={{ display:'flex', alignItems:'center', gap:5,
              fontFamily:'Rajdhani, sans-serif', fontWeight:600, fontSize:10, letterSpacing:'.1em', color:c }}>
              <span style={{ width:8,height:8,borderRadius:2,background:c,flexShrink:0 }}/>
              {lbl}
            </span>
          ))}
        </div>
      </div>
      {/* Grid de cards */}
      {count === 0
        ? <div style={{ flex:1, display:'grid', placeItems:'center', color:T.dim,
            fontFamily:"'Orbitron', monospace", fontSize:13, letterSpacing:'.2em', opacity:.5 }}>
            {emptyMsg || '— SEM MÁQUINAS —'}
          </div>
        : children
      }
    </div>
  );
}

// ══════════════════════════════════════════════
//  BARRA KPI (preservada 100% da imagem)
// ══════════════════════════════════════════════
function KpiBar({ machines, slides, currentSlide, onSlideClick }) {
  const now = new Date();

  const andamento   = machines.filter(m => m.estado?.startsWith('em-preparacao') && !m.arquivada);
  const standby     = machines.filter(m => m.estado === 'standby' && !m.arquivada);
  const prio        = andamento.filter(m => m.prioridade);
  const nts         = machines.filter(m => (m.tipo_origem === 'nova' || m.tipoOrigem === 'nova') && !m.arquivada && m.estado?.startsWith('em-preparacao'));
  const recon       = machines.filter(m => (m.tipo_origem === 'usada' || m.tipoOrigem === 'usada') && !m.arquivada && m.estado?.startsWith('em-preparacao'));
  const proximas    = machines.filter(m => m.estado === 'a-fazer' && !m.arquivada);
  const startWeek   = new Date(now); startWeek.setDate(now.getDate() - now.getDay() + 1); startWeek.setHours(0,0,0,0);
  const estaSemana  = machines.filter(m => m.estado?.startsWith('concluida') && m.dataConclusao && new Date(m.dataConclusao) >= startWeek);
  const hoje        = machines.filter(m => m.estado?.startsWith('concluida') && m.dataConclusao && new Date(m.dataConclusao).toDateString() === now.toDateString());
  const total2026   = machines.filter(m => m.estado?.startsWith('concluida') && m.dataConclusao && new Date(m.dataConclusao).getFullYear() === 2026);

  // média h/máquina
  const comTimer = machines.filter(m => m.timer_accumulated_seconds > 60);
  const medHoras = comTimer.length > 0
    ? (comTimer.reduce((s,m) => s + (m.timer_accumulated_seconds||0), 0) / comTimer.length / 3600).toFixed(1)
    : '—';

  // Mapa slide → cor de destaque na barra
  const slideActive = slides[currentSlide];

  const kpis = [
    { label: 'ANDAMENTO',  val: andamento.length,   color: T.ok,    slideKey: 'andamento'  },
    { label: 'STANDBY',    val: standby.length,     color: T.risk,  slideKey: 'standby'    },
    { label: 'PRIORITÁRIAS',val: prio.length,        color: T.brand, slideKey: 'prioritarias' },
    { label: 'TIMELINE',   val: andamento.length,   color: T.muted, slideKey: 'timeline'   },
    { label: 'PRÓXIMAS',   val: proximas.length,    color: T.muted, slideKey: 'proximas'   },
    { label: 'NTS',        val: nts.length,         color: T.ntsC,  slideKey: 'nts'        },
    { label: 'RECON',      val: recon.length,       color: T.reconC,slideKey: 'recon'      },
    { label: 'ESTA SEMANA',val: estaSemana.length,  color: T.ok,    slideKey: null         },
    { label: 'HOJE',       val: hoje.length,        color: T.ok,    slideKey: null         },
    { label: 'MED.H/MÁQ', val: medHoras,           color: T.muted, slideKey: null         },
    { label: 'TOTAL 2026', val: total2026.length,   color: T.acpC,  slideKey: null         },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 0,
      borderBottom: `1px solid ${T.line}`,
      borderTop: `1px solid ${T.line}`,
      background: 'rgba(0,0,0,.35)',
    }}>
      {kpis.map((k, i) => {
        const isActive = slideActive?.key === k.slideKey;
        return (
          <button
            key={i}
            onClick={() => k.slideKey && onSlideClick(k.slideKey)}
            style={{
              flex: 1, border: 'none', cursor: k.slideKey ? 'pointer' : 'default',
              background: isActive ? `color-mix(in srgb, ${k.color} 12%, transparent)` : 'transparent',
              borderBottom: isActive ? `2px solid ${k.color}` : '2px solid transparent',
              padding: '8px 6px', textAlign: 'center',
              transition: 'all .15s',
              borderRight: i < kpis.length - 1 ? `1px solid ${T.line}` : 'none',
            }}
          >
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              fontSize: 16, letterSpacing: '.03em',
              color: isActive ? k.color : (String(k.val) === '0' ? T.dim : k.color),
              textShadow: isActive ? `0 0 12px ${k.color}` : 'none',
              lineHeight: 1,
            }}>
              {String(k.val).padStart(2, '0')}
            </div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
              fontSize: 8.5, letterSpacing: '.16em',
              color: isActive ? k.color : T.muted,
              marginTop: 3, textTransform: 'uppercase',
            }}>
              {k.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════
//  RELÓGIO
// ══════════════════════════════════════════════
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const dias = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const s = String(now.getSeconds()).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  const mo = String(now.getMonth()+1).padStart(2,'0');
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
        fontSize: 16, letterSpacing: '.08em', lineHeight: 1 }}>
        {h}:{m}:{s}
      </div>
      <div style={{ fontSize: 8.5, color: T.muted, letterSpacing: '.2em', marginTop: 2 }}>
        {dias[now.getDay()]} · {d}/{mo}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  COMPONENTE PRINCIPAL — InLiveView
// ══════════════════════════════════════════════
export default function InLiveView({ machines = [], onClose }) {

  // Sequência de slides (PRESERVADA)
  const SLIDES = useMemo(() => [
    { key: 'andamento',    label: 'EM ANDAMENTO',  icon: '◢', color: T.ok    },
    { key: 'standby',      label: 'STANDBY',       icon: '⏸', color: T.risk  },
    { key: 'prioritarias', label: 'PRIORITÁRIAS',  icon: '⚡', color: T.brand },
    { key: 'timeline',     label: 'TIMELINE',      icon: '⟳', color: T.muted },
    { key: 'proximas',     label: 'PRÓXIMAS',      icon: '▷', color: T.muted },
    { key: 'nts',          label: 'NTS',           icon: '✦', color: T.ntsC  },
    { key: 'recon',        label: 'RECON',         icon: '◈', color: T.reconC},
  ], []);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Auto-avanço a cada 12s (pausável)
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(s => (s + 1) % SLIDES.length);
      }, 12000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPaused, SLIDES.length]);

  // ESC fecha
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Navegar por click na KPI bar
  const handleSlideClick = useCallback((key) => {
    const idx = SLIDES.findIndex(s => s.key === key);
    if (idx >= 0) { setCurrentSlide(idx); setIsPaused(true); }
  }, [SLIDES]);

  // Máquinas filtradas por slide
  const slideData = useMemo(() => {
    const active = machines.filter(m => !m.arquivada);
    const inWork  = active.filter(m => m.estado?.startsWith('em-preparacao'));
    const standby = active.filter(m => m.estado === 'standby');
    const prio    = inWork.filter(m => m.prioridade).sort((a,b) => {
      const ar = isTimerRunning(a)?0:1, br = isTimerRunning(b)?0:1;
      return ar !== br ? ar - br : 0;
    });
    const nts   = inWork.filter(m => (m.tipo_origem||m.tipoOrigem) === 'nova');
    const recon = inWork.filter(m => (m.tipo_origem||m.tipoOrigem) === 'usada');
    const prox  = active.filter(m => m.estado === 'a-fazer');
    return { andamento: inWork, standby, prioritarias: prio, timeline: inWork, proximas: prox, nts, recon };
  }, [machines]);

  const slide = SLIDES[currentSlide];
  const maquinas = slideData[slide.key] || [];
  const { cols, density } = getGridConfig(maquinas.length);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: T.bg, color: T.text,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Rajdhani, system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Scanlines */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'repeating-linear-gradient(0deg,transparent 0 2px,rgba(200,16,46,.011) 2px 3px)' }} />
      {/* Hex grid */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: .16,
        backgroundImage: 'linear-gradient(60deg,transparent 49%,rgba(200,16,46,.03) 49% 51%,transparent 51%),linear-gradient(-60deg,transparent 49%,rgba(200,16,46,.03) 49% 51%,transparent 51%)',
        backgroundSize: '40px 70px' }} />

      {/* CSS global */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes blink { 50% { opacity: .22; } }
        @keyframes pulseCard {
          0%,100% { box-shadow: 0 0 0 1px rgba(0,0,0,.45), 0 18px 48px -28px rgba(255,51,68,.35); }
          50%      { box-shadow: 0 0 0 1px rgba(0,0,0,.45), 0 0 38px -5px rgba(255,51,68,.65), 0 18px 48px -28px rgba(255,51,68,.5); }
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(200,16,46,.4); border-radius: 2px; }
      `}</style>

      {/* ── TOP STRIP ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '12px 24px 11px',
        borderBottom: `1px solid rgba(200,16,46,.22)`,
        background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(10px)',
        flexShrink: 0,
      }}>
        {/* Logo + nome */}
        <img
          src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/a35751fd9_Gemini_Generated_Image_scmohbscmohbscmo1.png"
          alt="WATCHER" style={{ width: 36, height: 36, objectFit: 'contain',
            filter: 'drop-shadow(0 0 10px rgba(255,45,120,.7))' }} />
        <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900,
          letterSpacing: '.18em', color: T.brand, fontSize: 17,
          textShadow: '0 0 18px rgba(200,16,46,.65)' }}>
          WATCHER
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '.16em',
          color: T.ok, border: '1px solid rgba(43,229,100,.35)', padding: '3px 9px', borderRadius: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.ok,
            boxShadow: `0 0 8px ${T.ok}`, animation: 'blink 1.6s infinite' }} />
          LIVE
        </div>

        {/* controles */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
          <button onClick={() => setCurrentSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)}
            style={ctrlBtn}>‹ PREV</button>
          <button onClick={() => setIsPaused(p => !p)}
            style={{ ...ctrlBtn, color: isPaused ? T.risk : T.ok,
              borderColor: isPaused ? 'rgba(255,178,0,.35)' : 'rgba(43,229,100,.35)' }}>
            {isPaused ? '▶ RETOMAR' : '⏸ PAUSAR'}
          </button>
          <button onClick={() => setCurrentSlide(s => (s + 1) % SLIDES.length)}
            style={ctrlBtn}>NEXT ›</button>
        </div>

        {/* indicadores de slide */}
        <div style={{ display: 'flex', gap: 5, marginLeft: 8 }}>
          {SLIDES.map((s, i) => (
            <button key={i} onClick={() => { setCurrentSlide(i); setIsPaused(true); }}
              style={{
                width: i === currentSlide ? 18 : 6, height: 6, borderRadius: 3,
                background: i === currentSlide ? slide.color : T.dim,
                boxShadow: i === currentSlide ? `0 0 8px ${slide.color}` : 'none',
                border: 'none', cursor: 'pointer', transition: 'all .25s', padding: 0,
              }} />
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <LiveClock />
        </div>

        {/* ESC */}
        <button onClick={onClose} style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.15em',
          color: T.muted, background: 'transparent',
          border: `1px solid ${T.line}`, padding: '4px 10px', borderRadius: 3, cursor: 'pointer',
        }}>ESC ✕</button>
      </div>

      {/* ── KPI BAR ── */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <KpiBar machines={machines} slides={SLIDES} currentSlide={currentSlide} onSlideClick={handleSlideClick} />
      </div>

      {/* ── CONTENT AREA ── */}
      <div style={{
        position: 'relative', zIndex: 1, flex: 1, overflow: 'auto',
        padding: '20px 24px',
      }}>
        <Slide
          title={slide.label}
          icon={slide.icon}
          color={slide.color}
          count={maquinas.length}
          emptyMsg={`— SEM ${slide.label} —`}
        >
          <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 16 }}>
            {maquinas.map(m => (
              <InLiveCard key={m.id} machine={m} density={density} />
            ))}
          </div>
        </Slide>
      </div>
    </div>
  );
}

const ctrlBtn = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.12em',
  color: 'rgba(200,216,255,.6)', background: 'transparent',
  border: '1px solid rgba(200,216,255,.12)', padding: '4px 10px',
  borderRadius: 3, cursor: 'pointer',
};
