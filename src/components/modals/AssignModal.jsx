import React from "react";
import ModalShell from "./ModalShell";
import { BTN_SECONDARY } from "./modalStyles";
import { TECHNICIANS } from "@/lib/technicians";
import { User as UserIcon } from "lucide-react";

/**
 * Modal de atribuição de técnico a uma máquina.
 * Mantém o handler onAssign(techId) do original.
 */
export default function AssignModal({ isOpen, onClose, machine, onAssign }) {
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
              onAssign(tech.id);
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
    </ModalShell>
  );
}