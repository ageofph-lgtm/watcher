// Mapas de cor do card de máquina (design system ATLAS)
// As classes cat-* (borda esquerda) estão definidas em src/index.css

export const TIPO_CONFIG = {
  aluguer:           { label: 'ACP',          cat: 'cat-acp',          text: 'text-ka', bg: 'bg-ka/15', border: 'border-ka/40' },
  nova:              { label: 'NTS',          cat: 'cat-nts',          text: 'text-kz', bg: 'bg-kz/15', border: 'border-kz/40' },
  usada:             { label: 'UTS',          cat: 'cat-recon-bronze', text: 'text-kv', bg: 'bg-kv/15', border: 'border-kv/40' },
  recon_bronze:      { label: 'RECON BRONZE', cat: 'cat-recon-bronze', text: 'text-kv', bg: 'bg-kv/15', border: 'border-kv/40' },
  recon_prata:       { label: 'RECON PRATA',  cat: 'cat-recon-prata',  text: 'text-kz', bg: 'bg-kz/15', border: 'border-kz/40' },
  'servico-interno': { label: 'INTERNO',     cat: '',                 text: 'text-kn', bg: 'bg-kn/10', border: 'border-kn/30' },
};

export const ESTADO_CONFIG = {
  'a-fazer':       { label: 'POR FAZER', dot: 'bg-kn',   text: 'text-kn',   bg: 'bg-kn/10'   },
  'em-preparacao': { label: 'PREP',      dot: 'bg-cexe', text: 'text-cexe', bg: 'bg-cexe/10' },
  'aguarda':       { label: 'AGUARDA',   dot: 'bg-ccla', text: 'text-ccla', bg: 'bg-ccla/10' },
  'concluida':     { label: 'OK',        dot: 'bg-cpro', text: 'text-cpro', bg: 'bg-cpro/10' },
};

// Recon tem prioridade sobre o tipo base
export function getTipo(machine) {
  if (machine?.recondicao?.bronze) return TIPO_CONFIG.recon_bronze;
  if (machine?.recondicao?.prata)  return TIPO_CONFIG.recon_prata;
  if (machine?.tipo && TIPO_CONFIG[machine.tipo]) return TIPO_CONFIG[machine.tipo];
  return null;
}

export function getEstado(estado) {
  if (!estado) return null;
  if (estado === 'a-fazer')                       return ESTADO_CONFIG['a-fazer'];
  if (estado.startsWith('em-preparacao'))         return ESTADO_CONFIG['em-preparacao'];
  if (estado.startsWith('concluida'))             return ESTADO_CONFIG['concluida'];
  if (estado.startsWith('aguarda'))               return ESTADO_CONFIG['aguarda'];
  return null;
}