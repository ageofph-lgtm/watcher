export const TECHNICIANS = [
  { id: 'raphael', name: 'RAPHAEL', color: 'bg-red-500', borderColor: '#ef4444', lightBg: '#fee2e2' },
  { id: 'nuno', name: 'NUNO', color: 'bg-yellow-500', borderColor: '#eab308', lightBg: '#fef3c7' },
  { id: 'rogerio', name: 'ROGÉRIO', color: 'bg-cyan-500', borderColor: '#06b6d4', lightBg: '#cffafe' },
  { id: 'yano', name: 'YANO', color: 'bg-green-500', borderColor: '#10b981', lightBg: '#d1fae5' }
];

export const findTech = (id) => TECHNICIANS.find(t => t.id === id) || null;
/** Apoios (ids) de uma máquina, sempre array limpo e sem o principal. */
export const getApoios = (machine) => {
  const arr = Array.isArray(machine?.tecnicos_apoio) ? machine.tecnicos_apoio : [];
  return [...new Set(arr.filter(Boolean).filter(id => id !== machine?.tecnico))];
};
/** Principal + apoios, sem duplicados. */
export const getTecnicosDaMaquina = (machine) =>
  [...new Set([machine?.tecnico, ...getApoios(machine)].filter(Boolean))];
/** O técnico (id) participa na máquina, como principal ou apoio? */
export const isTecnicoDaMaquina = (machine, techId) =>
  !!techId && getTecnicosDaMaquina(machine).includes(techId);
