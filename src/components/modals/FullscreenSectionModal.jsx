import React from "react";
import { X } from "lucide-react";
import MaquinaCard from "@/components/watcher/MaquinaCard";

/**
 * Overlay de ecrã inteiro para ver uma secção (A Fazer / Concluída) em grelha.
 * Substitui o FullscreenSectionModal inline do Dashboard.
 */
export default function FullscreenSectionModal({
  isOpen,
  onClose,
  title,
  machines,
  icon: Icon,
  onOpenMachine,
  onAssign,
  userPermissions,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <div
        className="glass border-b border-slate-700 px-4 py-3 flex items-center justify-between shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-6 h-6 text-amber-400" />}
          <h2 className="page-title text-slate-100">{title}</h2>
          <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-500 text-slate-900">
            {machines.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {machines.map((machine) => (
            <MaquinaCard
              key={machine.id}
              machine={machine}
              onClick={onOpenMachine}
              onAssign={onAssign}
              showAssignButton={
                userPermissions?.canMoveAnyMachine ||
                userPermissions?.canMoveMachineToOwnColumn
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}