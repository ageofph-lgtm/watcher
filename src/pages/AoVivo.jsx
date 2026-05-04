import React, { useState, useEffect, useRef, useCallback } from "react";
import { FrotaACP } from "@/entities/all";
import { useTheme } from "../ThemeContext";
import { Sun, Moon, AlertTriangle, CheckCircle2, ListOrdered, Activity } from "lucide-react";

const useDT = (isDark) => ({
  bg:      isDark ? '#06060d' : '#f0f0f5',
  surface: isDark ? '#0e0e1a' : '#ffffff',
  card:    isDark ? '#111120' : '#f7f7fc',
  border:  isDark ? 'rgba(255,45,120,0.18)' : 'rgba(255,45,120,0.15)',
  pink:    '#FF2D78',
  blue:    '#4D9FFF',
  green:   '#00E5A0',
  yellow:  '#FFD600',
  red:     '#FF3B3B',
  text:    isDark ? '#e4e6ff' : '#1a1a2e',
  muted:   isDark ? 'rgba(228,230,255,0.45)' : 'rgba(26,26,46,0.5)',
  glow:    (c) => `0 0 18px ${c}88, 0 0 40px ${c}30`,
});

function useLiveTimer(machine) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const acc = machine.timer_accumulated_seconds || 0;
    const running = machine.timer_status === 'running';
    const startedAt = machine.timer_started_at ? new Date(machine.timer_started_at).getTime() : null;
    if (running && startedAt) {
      const update = () => setElapsed(acc + Math.floor((Date.now() - startedAt) / 1000));
      update();
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    } else {
      setElapsed(acc);
    }
  }, [machine.timer_status, machine.timer_started_at, machine.timer_accumulated_seconds]);
  return elapsed;
}

function fmtHMS(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

const TECH_COLORS = { raphael:'#ef4444', nuno:'#eab308', rogerio:'#06b6d4', yano:'#10b981', patrick:'#a855f7' };
const tc = (t) => TECH_COLORS[t?.toLowerCase()] || '#888';
const tl = (t) => t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '—';

// ── Card de máquina EM ANDAMENTO ─────────────────────────────────────────────
function CardAndamento({ m, D }) {
  const elapsed = useLiveTimer(m);
  const running = m.timer_status === 'running';
  const tasks = m.tarefas || [];
  const done = tasks.filter(t => t.concluida).length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  const color = tc(m.tecnico);

  return (
    <div style={{ background: D.card, border: '1.5px solid ' + color + '55', borderRadius: '16px', padding: '22px 24px', boxShadow: '0 0 24px ' + color + '22', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '18px', fontWeight: 800, color: D.text, letterSpacing: '0.06em' }}>{m.modelo || '—'}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: D.muted, marginTop: '2px', letterSpacing: '0.08em' }}>{m.serie}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: running ? D.green : D.yellow, textShadow: running ? D.glow(D.green) : 'none', letterSpacing: '0.04em' }}>{fmtHMS(elapsed)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: running ? D.green : D.yellow, animation: running ? 'dot-blink 1.2s ease-in-out infinite' : 'none' }} />
            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: D.muted, letterSpacing: '0.1em' }}>{running ? 'RUNNING' : 'PAUSED'}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#fff' }}>{(m.tecnico || '?')[0].toUpperCase()}</div>
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: D.text, letterSpacing: '0.08em' }}>{tl(m.tecnico)}</span>
        {m.tipo && <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '9px', padding: '2px 8px', borderRadius: '20px', background: D.blue + '22', color: D.blue, border: '1px solid ' + D.blue + '44', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.tipo}</span>}
      </div>
      {tasks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tasks.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: '1.5px solid ' + (t.concluida ? D.green : D.muted), background: t.concluida ? D.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {t.concluida && <span style={{ color: '#000', fontSize: '9px', fontWeight: 800 }}>✓</span>}
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: t.concluida ? D.muted : D.text, textDecoration: t.concluida ? 'line-through' : 'none', letterSpacing: '0.05em' }}>{t.texto}</span>
            </div>
          ))}
          <div style={{ marginTop: '4px' }}>
            <div style={{ height: '4px', borderRadius: '2px', background: D.muted + '33', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, ' + D.pink + ', ' + D.blue + ')', borderRadius: '2px', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: D.muted, marginTop: '3px', textAlign: 'right' }}>{done}/{tasks.length} TAREFAS</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card URGÊNCIA ─────────────────────────────────────────────────────────────
function CardUrgencia({ m, D }) {
  const elapsed = useLiveTimer(m);
  const tasks = m.tarefas || [];
  return (
    <div style={{ background: D.card, border: '2px solid ' + D.red, borderRadius: '16px', padding: '22px 24px', boxShadow: '0 0 32px ' + D.red + '44', animation: 'urgencia-pulse 2s ease-in-out infinite', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color={D.red} />
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '18px', fontWeight: 800, color: D.red }}>{m.modelo}</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: D.muted, marginTop: '2px' }}>{m.serie}</div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '20px', color: D.red, fontWeight: 700 }}>{fmtHMS(elapsed)}</div>
      </div>
      {tasks.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {tasks.map((t, i) => <span key={i} style={{ fontFamily: 'monospace', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: D.red + '22', color: D.red, border: '1px solid ' + D.red + '44' }}>{t.texto}</span>)}
        </div>
      )}
    </div>
  );
}

// ── Card FILA ─────────────────────────────────────────────────────────────────
function CardFila({ m, idx, color, D }) {
  const tasks = m.tarefas || [];
  return (
    <div style={{ background: D.card, border: '1.5px solid ' + color + '33', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid ' + color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron', monospace", fontSize: '14px', fontWeight: 800, color, flexShrink: 0 }}>{idx + 1}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '15px', fontWeight: 700, color: D.text }}>{m.modelo}</span>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: D.muted }}>{m.serie}</span>
        </div>
        {tasks.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
            {tasks.map((t, i) => <span key={i} style={{ fontFamily: 'monospace', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: color + '18', color, border: '1px solid ' + color + '33' }}>{t.texto}</span>)}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {m.previsao_inicio ? (
          <>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: D.green, fontWeight: 700 }}>{fmtDate(m.previsao_inicio)}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: D.muted, marginTop: '2px' }}>até {fmtDate(m.previsao_fim)}</div>
          </>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: D.muted }}>A agendar</div>
        )}
      </div>
    </div>
  );
}

// ── Wrapper de slide ──────────────────────────────────────────────────────────
function SlideWrapper({ title, icon, color, D, pulse, children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ color, filter: 'drop-shadow(0 0 8px ' + color + ')' }}>{icon}</div>
        <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: 900, letterSpacing: '0.15em', color, textShadow: '0 0 20px ' + color + '88', margin: 0 }}>{title}</h2>
        {pulse && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: '0 0 12px ' + color, animation: 'dot-blink 1s ease-in-out infinite', marginLeft: '4px' }} />}
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, ' + color + '66, transparent)' }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>{children}</div>
    </div>
  );
}

function EmptyState({ label, D }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: D.muted, fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.1em' }}>{label}</div>;
}

function LiveClock({ D }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '16px', fontWeight: 700, color: D.text, letterSpacing: '0.08em' }}>{now.toLocaleTimeString('pt-PT')}</div>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: D.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{now.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
    </div>
  );
}

// ── SLIDES CONFIG ─────────────────────────────────────────────────────────────
const SLIDES = [
  { id: 'andamento',  label: 'EM ANDAMENTO', duration: 10000 },
  { id: 'urgencias',  label: 'URGÊNCIAS',    duration: 8000  },
  { id: 'fila_acp',   label: 'FILA ACP',     duration: 10000 },
  { id: 'fila_nts',   label: 'FILA NTS',     duration: 10000 },
  { id: 'concluidas', label: 'CONCLUÍDAS',   duration: 10000 },
];

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function AoVivo() {
  const { isDark, toggleTheme } = useTheme();
  const D = useDT(isDark);

  const [machines, setMachines] = useState([]);
  const [slide, setSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const progRef = useRef(null);
  const startRef = useRef(Date.now());
  const pausedAtRef = useRef(null);

  const fetchMachines = useCallback(async () => {
    try { const data = await FrotaACP.list(); setMachines(data.filter(m => !m.arquivada)); }
    catch(e) { console.warn('fetch', e); }
  }, []);

  useEffect(() => { fetchMachines(); const id = setInterval(fetchMachines, 30000); return () => clearInterval(id); }, [fetchMachines]);

  const advance = useCallback(() => { setSlide(s => (s + 1) % SLIDES.length); setProgress(0); startRef.current = Date.now(); }, []);

  useEffect(() => {
    if (paused) { clearTimeout(timerRef.current); clearInterval(progRef.current); pausedAtRef.current = Date.now(); return; }
    if (pausedAtRef.current) { startRef.current += Date.now() - pausedAtRef.current; pausedAtRef.current = null; }
    const dur = SLIDES[slide].duration;
    const remaining = dur - (Date.now() - startRef.current);
    timerRef.current = setTimeout(advance, Math.max(remaining, 0));
    progRef.current = setInterval(() => setProgress(Math.min((Date.now() - startRef.current) / dur, 1)), 50);
    return () => { clearTimeout(timerRef.current); clearInterval(progRef.current); };
  }, [slide, paused, advance]);

  // Dados
  const andamento  = machines.filter(m => m.estado?.startsWith('em-preparacao'));
  const urgentes   = machines.filter(m => m.prioridade === true);
  const aFazer     = machines.filter(m => m.estado === 'a-fazer');
  const filaACP    = aFazer.filter(m => m.tipo !== 'nova');
  const filaNTS    = aFazer.filter(m => m.tipo === 'nova');
  const concluidas = machines.filter(m => m.estado?.startsWith('concluida') || m.estado === 'concluida');
  const weekAgo    = Date.now() - 7*24*3600*1000;
  const semana     = concluidas.filter(m => new Date(m.dataConclusao || m.updated_date).getTime() > weekAgo);

  const slideContent = {
    andamento: (
      <SlideWrapper title="EM ANDAMENTO" icon={<Activity size={22}/>} color={D.blue} D={D}>
        {andamento.length === 0 ? <EmptyState label="Nenhuma máquina em produção" D={D}/> :
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
            {andamento.map(m => <CardAndamento key={m.id} m={m} D={D}/>)}
          </div>}
      </SlideWrapper>
    ),
    urgencias: (
      <SlideWrapper title="URGÊNCIAS" icon={<AlertTriangle size={22}/>} color={D.red} D={D} pulse>
        {urgentes.length === 0 ? <EmptyState label="Sem urgências activas ✓" D={D}/> :
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
            {urgentes.map(m => <CardUrgencia key={m.id} m={m} D={D}/>)}
          </div>}
      </SlideWrapper>
    ),
    fila_acp: (
      <SlideWrapper title="PRÓXIMAS — ACP" icon={<ListOrdered size={22}/>} color={D.blue} D={D}>
        {filaACP.length === 0 ? <EmptyState label="Fila ACP vazia" D={D}/> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filaACP.map((m, i) => <CardFila key={m.id} m={m} idx={i} color={D.blue} D={D}/>)}
          </div>}
      </SlideWrapper>
    ),
    fila_nts: (
      <SlideWrapper title="PRÓXIMAS — NTS" icon={<ListOrdered size={22}/>} color={D.pink} D={D}>
        {filaNTS.length === 0 ? <EmptyState label="Fila NTS vazia" D={D}/> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filaNTS.map((m, i) => <CardFila key={m.id} m={m} idx={i} color={D.pink} D={D}/>)}
          </div>}
      </SlideWrapper>
    ),
    concluidas: (
      <SlideWrapper title="CONCLUÍDAS — ESTA SEMANA" icon={<CheckCircle2 size={22}/>} color={D.green} D={D}>
        {semana.length === 0 ? <EmptyState label="Sem conclusões esta semana" D={D}/> : (
          <div>
            {(() => {
              const byTech = {};
              semana.forEach(m => { const t = m.tecnico || 'outros'; if (!byTech[t]) byTech[t] = []; byTech[t].push(m); });
              return Object.entries(byTech).sort((a,b) => b[1].length - a[1].length).map(([tec, macs]) => (
                <div key={tec} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: tc(tec), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#fff' }}>{tec[0].toUpperCase()}</div>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', color: D.text, fontWeight: 700, letterSpacing: '0.08em' }}>{tl(tec)}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: "'Orbitron', monospace", fontSize: '20px', fontWeight: 800, color: D.green }}>{macs.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {macs.map(m => (
                      <div key={m.id} style={{ background: D.card, border: '1px solid ' + D.green + '33', borderRadius: '10px', padding: '10px 14px' }}>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '12px', fontWeight: 700, color: D.text }}>{m.modelo}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: D.muted, marginTop: '2px' }}>{m.serie}</div>
                        {m.timer_accumulated_seconds > 0 && <div style={{ fontFamily: 'monospace', fontSize: '10px', color: D.green, marginTop: '4px' }}>{fmtHMS(m.timer_accumulated_seconds)}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
            <div style={{ textAlign: 'right', fontFamily: "'Orbitron', monospace", fontSize: '13px', color: D.muted, marginTop: '8px' }}>
              TOTAL: <span style={{ color: D.green, fontWeight: 800 }}>{semana.length}</span> MÁQUINAS
            </div>
          </div>
        )}
      </SlideWrapper>
    ),
  };

  return (
    <div style={{ minHeight: '100vh', background: D.bg, color: D.text, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', userSelect: 'none' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        @keyframes dot-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes urgencia-pulse { 0%,100%{box-shadow:0 0 32px #FF3B3B44} 50%{box-shadow:0 0 52px #FF3B3B88} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#ffffff22;border-radius:2px}
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', background: D.surface, borderBottom: '1px solid ' + D.border, flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/a35751fd9_Gemini_Generated_Image_scmohbscmohbscmo1.png" alt="WATCHER" style={{ width: '44px', height: '44px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px ' + D.pink + '99)' }} />
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '18px', fontWeight: 900, letterSpacing: '0.15em', color: D.pink }}>WATCHER <span style={{ color: D.muted, fontSize: '11px', fontWeight: 400 }}>/ AO VIVO</span></div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: D.muted, letterSpacing: '0.12em' }}>MONITOR DE OFICINA · ACTUALIZAÇÃO A CADA 30s</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SLIDES.map((s, i) => (
            <button key={s.id} onClick={() => { setSlide(i); setProgress(0); startRef.current = Date.now(); }} style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.08em', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', border: 'none', background: i === slide ? 'linear-gradient(135deg, ' + D.pink + ', ' + D.blue + ')' : D.muted + '22', color: i === slide ? '#fff' : D.muted, fontWeight: i === slide ? 700 : 400, transition: 'all 0.2s' }}>{s.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LiveClock D={D} />
          <button onClick={() => setPaused(p => !p)} style={{ background: paused ? D.yellow + '22' : 'transparent', border: '1px solid ' + (paused ? D.yellow : D.muted + '44'), borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', color: paused ? D.yellow : D.muted, letterSpacing: '0.08em' }}>{paused ? '▶ RETOMAR' : '⏸ PAUSAR'}</button>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: '1px solid ' + D.muted + '44', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: D.muted }}>{isDark ? <Sun size={14}/> : <Moon size={14}/>}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: D.green, animation: 'dot-blink 1.5s ease-in-out infinite' }} />
            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: D.muted }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ height: '3px', background: D.muted + '22' }}>
        <div style={{ height: '100%', width: (progress * 100) + '%', background: 'linear-gradient(90deg, ' + D.pink + ', ' + D.blue + ')', transition: 'width 0.05s linear' }} />
      </div>

      {/* KPI BAR */}
      <div style={{ display: 'flex', gap: '1px', background: D.border, borderBottom: '1px solid ' + D.border }}>
        {[
          { label: 'EM PRODUÇÃO', value: andamento.length, color: D.blue },
          { label: 'URGÊNCIAS',   value: urgentes.length,  color: D.red  },
          { label: 'NA FILA',     value: aFazer.length,    color: D.yellow },
          { label: 'ESTA SEMANA', value: semana.length,    color: D.green },
          { label: 'TOTAL 2026',  value: concluidas.length, color: D.pink },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: D.surface, padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '24px', fontWeight: 900, color: s.color, textShadow: isDark ? '0 0 16px ' + s.color + '66' : 'none' }}>{s.value}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: D.muted, letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* SLIDE CONTENT */}
      <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={() => setPaused(p => !p)}>
        {slideContent[SLIDES[slide].id]}
      </div>

      {/* FOOTER */}
      <div style={{ padding: '8px 28px', background: D.surface, borderTop: '1px solid ' + D.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {SLIDES.map((_, i) => <div key={i} style={{ width: i === slide ? '24px' : '8px', height: '4px', borderRadius: '2px', background: i === slide ? 'linear-gradient(90deg, ' + D.pink + ', ' + D.blue + ')' : D.muted + '44', transition: 'width 0.3s ease' }} />)}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: D.muted, letterSpacing: '0.1em' }}>{SLIDES[slide].label} · {slide + 1}/{SLIDES.length} · CLIQUE PARA {paused ? 'RETOMAR' : 'PAUSAR'}</div>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: D.muted }}>STILL OFICINA · WATCHER v2.0</div>
      </div>
    </div>
  );
}
