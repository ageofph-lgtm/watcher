import React, { useState, useEffect } from "react";
import ModalShell from "./ModalShell";
import { BTN_SECONDARY } from "./modalStyles";
import { TECHNICIANS, getApoios } from "@/lib/technicians";
import { User as UserIcon } from "lucide-react";

/**
 * Modal de atribuição de técnico a uma máquina.
 * Mantém o handler onAssign(techId) do original.
 */
export default function AssignModal({ isOpen, onClose, machine, onAssign }) {
  const [apoios, setApoios] = useState([]);
  useEffect(() => { setApoios(getApoios(machine)); }, [machine?.id, isOpen]);
  const toggleApoio = (id) => setApoios(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={machine ? `Atribuir ${machine.serie}` : "Atribuir Máquina"}
      subtitle="Selecione o técnico responsável"
      maxWidth="max-w-md"
      footer={
        <button onClick={onClose} className={BTN_SECONDARY}>
          Cancelar
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {TECHNICIANS.map((tech) => (
          <button
            key={tech.id}
            onClick={() => {
              onAssign(tech.id, apoios.filter(a => a !== tech.id));
              onClose();
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-600 hover:border-amber-500 hover:bg-slate-700/40 transition active:scale-95"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${tech.color}`}
            >
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-100">{tech.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Apoio (opcional)</div>
        <div className="flex flex-wrap gap-1.5">
          {TECHNICIANS.map((t) => {
            const ativo = apoios.includes(t.id);
            return (
              <button key={t.id} type="button" onClick={() => toggleApoio(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${ativo ? "border-slate-300 bg-slate-100/10 text-slate-100" : "border-slate-700 text-slate-400 hover:text-slate-100"}`}>
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: t.borderColor }} />
                {t.name}{ativo ? " ✓" : ""}
              </button>
            );
          })}
        </div>
        <div className="text-[10px] text-slate-400 mt-1.5">Escolhe o responsável acima; os apoios ficam atribuídos em simultâneo (o próprio responsável é ignorado na lista de apoio).</div>
      </div>
    </ModalShell>
  );
}