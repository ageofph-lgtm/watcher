/**
 * countdown.js — Lógica central do sistema de countdown
 * Fase 1: constantes, helpers, detecção legacy
 * 
 * REGRA FUNDAMENTAL:
 *   - Máquinas com timer_accumulated_seconds > 0 E sem tempo_estimado_segundos → LEGACY (timer progressivo)
 *   - Máquinas com tempo_estimado_segundos definido → COUNTDOWN
 *   - Máquinas novas (sem acumulado, sem estimado) → COUNTDOWN quando tipo for atribuído
 */

// ─────────────────────────────────────────────────────────────────────────────
//  TABELA DE TEMPOS PADRÃO (em segundos)
// ─────────────────────────────────────────────────────────────────────────────
export const TEMPOS_PADRAO = {
  // ACP — por combinação de tarefas
  express:            2  * 3600,   // 2h
  express_vps:        4  * 3600,   // 4h
  geral_rev_vps:      8  * 3600,   // 8h

  // RECON — por categoria × família de modelo
  recon_rx_fmx: {
    ferro:  6  * 3600,   // 6h
    bronze: 15 * 3600,   // 15h  ← actualizado
    prata:  30 * 3600,   // 30h
    ouro:   40 * 3600,   // 40h
  },
  recon_opx_sf: {
    ferro:  4  * 3600,   // 4h
    bronze: 12 * 3600,   // 12h  ← actualizado
    prata:  21 * 3600,   // 21h
    ouro:   25 * 3600,   // 25h
  },
};

// Famílias de modelo RECON
const FAMILIA_RX_FMX = ["rx", "fmx"];
const FAMILIA_OPX_SF = ["opx", "exu-v", "exu", "sf"];

/** Detecta a família do modelo para RECON */
export function getReconFamilia(modelo = "") {
  const m = modelo.toLowerCase();
  if (FAMILIA_RX_FMX.some(f => m.includes(f))) return "rx_fmx";
  if (FAMILIA_OPX_SF.some(f => m.includes(f))) return "opx_sf";
  return null; // desconhecido → manual
}

/** Dado um modelo e categoria RECON, devolve os segundos estimados (ou null) */
export function getTempoRecon(modelo, categoria) {
  const familia = getReconFamilia(modelo);
  if (!familia || !categoria) return null;
  const tabela = familia === "rx_fmx" ? TEMPOS_PADRAO.recon_rx_fmx : TEMPOS_PADRAO.recon_opx_sf;
  return tabela[categoria] ?? null;
}

/**
 * Detecta se uma máquina está em modo LEGACY (timer progressivo)
 * ou COUNTDOWN (novo sistema)
 * 
 * LEGACY:  tem timer acumulado MAS não tem tempo_estimado_segundos
 * COUNTDOWN: tem tempo_estimado_segundos definido (> 0)
 * IDLE:    nova, sem nada ainda
 */
export function getModoTimer(machine) {
  const estimado = Number(machine?.tempo_estimado_segundos) || 0;
  const acumulado = Number(machine?.timer_accumulated_seconds) || 0;

  if (estimado > 0) return "countdown";
  if (acumulado > 0) return "legacy";
  return "idle";
}

/**
 * Calcula o elapsed actual (segundos já gastos, incluindo o que está a correr)
 */
export function calcElapsed(machine) {
  const acc = Number(machine?.timer_accumulated_seconds) || 0;
  if (machine?.timer_status !== "running" || !machine?.timer_started_at) return acc;
  const diff = (Date.now() - new Date(machine.timer_started_at).getTime()) / 1000;
  return acc + Math.max(0, diff);
}

/**
 * Calcula o tempo restante em segundos (countdown)
 * Pode ser negativo (em atraso)
 */
export function calcRestante(machine) {
  const estimado = Number(machine?.tempo_estimado_segundos) || 0;
  const elapsed  = calcElapsed(machine);
  return estimado - elapsed;
}

/**
 * Estado do countdown:
 *   "ok"      → > 20% do tempo restante
 *   "aviso"   → entre 0% e 20% restante (âmbar)
 *   "atraso"  → negativo (vermelho)
 */
export function getEstadoCountdown(machine) {
  const estimado = Number(machine?.tempo_estimado_segundos) || 0;
  if (estimado === 0) return null;
  const restante = calcRestante(machine);
  if (restante < 0) return "atraso";
  if (restante / estimado < 0.20) return "aviso";
  return "ok";
}

/** Formata segundos em HH:MM:SS */
export function fmtHMS(totalSecs) {
  const abs  = Math.abs(Math.round(totalSecs));
  const h    = Math.floor(abs / 3600);
  const m    = Math.floor((abs % 3600) / 60);
  const s    = abs % 60;
  const sign = totalSecs < 0 ? "-" : "";
  return `${sign}${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

/** Formata segundos em "2h 30min" (para exibição estática) */
export function fmtHuman(totalSecs) {
  const abs = Math.abs(Math.round(totalSecs));
  const h   = Math.floor(abs / 3600);
  const m   = Math.floor((abs % 3600) / 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAYLOAD helpers — usados no Dashboard ao criar/actualizar máquinas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dado o formData do CreateMachineModal, calcula o tempo_estimado_segundos
 * baseado nas tarefas seleccionadas e flags.
 * Devolve null se não conseguir determinar (ex: NTS manual).
 */
export function calcTempoEstimado({ tarefas = [], isExpress, isVps, recondicao, modelo }) {
  const textos = tarefas.map(t => (typeof t === "string" ? t : t.texto || "").toLowerCase());

  const temExpressTask  = textos.some(t => t.includes("express"));
  const temVps          = isVps || textos.some(t => t.includes("vps"));
  const temGeral        = textos.some(t => t.includes("geral") || t.includes("preparação geral"));
  const temRev3000      = textos.some(t => t.includes("3000") || t.includes("revisão"));
  const isRecon         = recondicao?.ferro || recondicao?.bronze || recondicao?.prata || recondicao?.ouro;

  // RECON tem prioridade
  if (isRecon) {
    const cat = recondicao?.ouro ? "ouro"
               : recondicao?.prata  ? "prata"
               : recondicao?.bronze ? "bronze"
               : "ferro";
    return getTempoRecon(modelo, cat);
  }

  // Express + VPS
  if (isExpress && temVps) return TEMPOS_PADRAO.express_vps;
  // Express simples
  if (isExpress) return TEMPOS_PADRAO.express;
  // Geral + Rev3000 + VPS
  if (temGeral && temRev3000 && temVps) return TEMPOS_PADRAO.geral_rev_vps;

  // Não conseguiu determinar → null (NTS ou manual)
  return null;
}

export default {
  TEMPOS_PADRAO,
  getModoTimer,
  calcElapsed,
  calcRestante,
  getEstadoCountdown,
  fmtHMS,
  fmtHuman,
  calcTempoEstimado,
  getReconFamilia,
  getTempoRecon,
};
