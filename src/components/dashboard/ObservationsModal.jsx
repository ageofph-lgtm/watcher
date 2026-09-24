import TimerButton from "./TimerButton";
import React, { useState, useEffect } from "react";
import { FrotaACP } from "@/entities/all";
import { Clock, AlertTriangle, CheckCircle2, Repeat, Package, Sparkles, Wrench, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ModalShell from "../modals/ModalShell";
import { INPUT, LABEL, SECTION } from "../modals/modalStyles";
import { getEstado, getTipo } from "../watcher/constants";

const TAREFAS_PREDEFINIDAS = ["Preparação geral", "Revisão 3000h", "VPS", "EXPRESS"];
const TIPO_ICONS = { nova: Sparkles, usada: Repeat, aluguer: Package, "servico-interno": Wrench };

const ACT_BTN =
  "px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700 text-slate-200 hover:bg-slate-600 transition disabled:opacity-50";

export default function ObservationsModal({
  isOpen, onClose, machine, onAddObservation, onToggleTask, onTogglePriority,
  onDelete, currentUser, userPermissions, onMarkComplete, onToggleAguardaPecas,
  allMachines, onOpenEdit, isDark, isAdmin: isAdminProp,
  onTimerPlay, onTimerPause, onTimerReset, onTimerImprevisto,
}) {
  const [newObs, setNewObs] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [isEditingTasks, setIsEditingTasks] = useState(false);
  const [editedTasks, setEditedTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [machinePedidos, setMachinePedidos] = useState([]);
  const [localMachine, setLocalMachine] = useState(machine);

  useEffect(() => {
    if (machine && allMachines) {
      const updated = allMachines.find((m) => m.id === machine.id) || machine;
      setLocalMachine(updated);
    } else {
      setLocalMachine(machine);
    }
  }, [machine, allMachines]);

  useEffect(() => {
    setEditedTasks(localMachine?.tarefas ? [...localMachine.tarefas] : []);
    setIsEditingTasks(false);
    setNewTaskText("");
  }, [localMachine?.id, isOpen]);

  useEffect(() => {
    const load = async () => {
      if (!localMachine?.id) return;
      try {
        const all = await base44.entities.Pedido.list();
        setMachinePedidos(all.filter((p) => p.maquinaId === localMachine.id));
      } catch (e) {}
    };
    if (isOpen) load();
  }, [localMachine?.id, isOpen]);

  if (!isOpen || !localMachine) return null;

  const handleSubmit = () => {
    if (newObs.trim()) {
      onAddObservation(localMachine.id, newObs);
      setNewObs("");
    }
  };

  const handleMarkComplete = async () => {
    if (window.confirm(`Marcar ${localMachine.serie} como CONCLUÍDA?`)) await onMarkComplete(localMachine.id);
  };

  const handleSubmitPedido = async () => {
    if (!numeroPedido.trim()) return;
    try {
      await base44.entities.Pedido.create({
        numeroPedido: numeroPedido.trim(),
        maquinaId: localMachine.id,
        maquinaSerie: localMachine.serie,
        maquinaModelo: localMachine.modelo,
        tecnico: currentUser?.nome_tecnico || currentUser?.full_name,
        status: "pendente",
      });
      await base44.entities.Notificacao.create({
        userId: "admin",
        message: `Novo pedido de peças: ${numeroPedido.trim()}`,
        machineId: localMachine.id,
        machineSerie: localMachine.serie,
        technicianName: currentUser?.nome_tecnico || currentUser?.full_name,
        type: "parts_requested",
        isRead: false,
      });
      setNumeroPedido("");
      setShowPedidoForm(false);
      const all = await base44.entities.Pedido.list();
      setMachinePedidos(all.filter((p) => p.maquinaId === localMachine.id));
    } catch (e) {
      alert("Erro ao enviar pedido.");
    }
  };

  const handleMoveToAFazer = async () => {
    if (!userPermissions?.canMoveAnyMachine) {
      alert("Sem permissão.");
      return;
    }
    if (window.confirm(`Mover ${localMachine.serie} para "A Fazer"?`)) {
      try {
        await FrotaACP.update(localMachine.id, { estado: "a-fazer", tecnico: null, dataConclusao: null });
        onClose();
      } catch (e) {
        alert("Erro ao mover máquina.");
      }
    }
  };

  const handleToggleEditedTask = (idx) => {
    setEditedTasks(editedTasks.map((t, i) => (i === idx ? { ...t, concluida: !t.concluida } : t)));
  };

  const handleSaveTasks = async () => {
    setIsUpdating(true);
    try {
      await FrotaACP.update(localMachine.id, { tarefas: editedTasks });
      setIsEditingTasks(false);
    } catch (e) {
      alert("Erro ao salvar tarefas.");
    }
    setIsUpdating(false);
  };

  const handleToggleTaskLocal = async (taskIndex) => {
    if (isUpdating) return;
    const canEdit =
      (userPermissions?.canMoveAnyMachine ||
        (currentUser?.nome_tecnico && localMachine.tecnico === currentUser.nome_tecnico)) &&
      localMachine.estado?.includes("em-preparacao");
    if (!canEdit) return;
    setIsUpdating(true);
    try {
      const updated = localMachine.tarefas.map((t, i) =>
        i === taskIndex ? { ...t, concluida: !t.concluida } : { ...t }
      );
      setLocalMachine({ ...localMachine, tarefas: updated });
      await onToggleTask(localMachine.id, taskIndex);
    } catch (e) {
      setLocalMachine(localMachine);
    }
    setIsUpdating(false);
  };

  const handleAguardaPecasClick = async () => {
    const nv = !localMachine.aguardaPecas;
    if (window.confirm(nv ? `Marcar ${localMachine.serie} como "AGUARDA PEÇAS"?` : `Confirmar peças chegaram?`)) {
      setLocalMachine({ ...localMachine, aguardaPecas: nv });
      await onToggleAguardaPecas(localMachine.id, nv);
    }
  };

  const tarefasConcluidas = localMachine.tarefas?.filter((t) => t.concluida).length || 0;
  const totalTarefas = localMachine.tarefas?.length || 0;
  const TipoIcon = TIPO_ICONS[localMachine.tipo] || Package;
  const isAdmin = userPermissions?.canMoveAnyMachine;
  const isMyMachine = currentUser?.nome_tecnico && localMachine.tecnico === currentUser.nome_tecnico;
  const canEditThisMachine = isAdmin || isMyMachine;
  const canEditTasks = localMachine.estado?.includes("em-preparacao") && canEditThisMachine;
  const estadoCfg = getEstado(localMachine.estado);
  const tipoCfg = getTipo(localMachine);

  const fmt = (s) => {
    if (!s) return "—";
    const [y, m, d] = String(s).slice(0, 10).split("-");
    return `${d}/${m}/${y.slice(2)}`;
  };

  const header = (
    <div className="shrink-0 p-4 border-b border-slate-700 relative">
      <div className="flex items-center gap-2 mb-1">
        <span className="ns-num text-xl text-slate-100">{localMachine.serie}</span>
        {localMachine.prioridade && <AlertTriangle className="w-4 h-4 text-amber-400" />}
        {localMachine.aguardaPecas && <Clock className="w-4 h-4 text-ccla" />}
        <TipoIcon className="w-4 h-4 text-slate-400" />
        {estadoCfg && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${estadoCfg.bg} ${estadoCfg.text} flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`} />
            {estadoCfg.label}
          </span>
        )}
        {totalTarefas > 0 && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              tarefasConcluidas === totalTarefas ? "bg-cpro/15 text-cpro" : "bg-kz/15 text-kz"
            }`}
          >
            {tarefasConcluidas}/{totalTarefas}
          </span>
        )}
        <button
          onClick={onClose}
          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="text-xs text-slate-400 mb-1">
        {localMachine.modelo} {localMachine.ano && `· ${localMachine.ano}`}{" "}
        {localMachine.tecnico && `· ${localMachine.tecnico}`}
      </div>
      <div className="flex gap-3 text-[11px] text-slate-400 flex-wrap">
        {localMachine.created_date && <span>📅 {new Date(localMachine.created_date).toLocaleDateString("pt-PT")}</span>}
        {localMachine.dataAtribuicao && <span>👤 {new Date(localMachine.dataAtribuicao).toLocaleDateString("pt-PT")}</span>}
        {localMachine.dataConclusao && <span>✅ {new Date(localMachine.dataConclusao).toLocaleDateString("pt-PT")}</span>}
        {(localMachine.previsao_inicio || localMachine.previsao_fim) && (
          <span className="text-kz font-bold">⏳ Previsão: {fmt(localMachine.previsao_inicio)} → {fmt(localMachine.previsao_fim)}</span>
        )}
      </div>

      {localMachine.historicoCriacoes?.length > 0 && (
        <div className="mt-2 px-3 py-1.5 rounded-lg bg-kz/10 border border-kz/30 text-xs text-kz">
          🔁 Esta máquina já foi registada {localMachine.historicoCriacoes.length}x anteriormente
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-1.5 flex-wrap mt-3">
        {isAdmin && localMachine.estado !== "a-fazer" && (
          <button onClick={handleMoveToAFazer} className={ACT_BTN}>
            ⬅ A Fazer
          </button>
        )}
        {userPermissions?.canSetPriority && localMachine.estado === "a-fazer" && (
          <button onClick={() => onTogglePriority(localMachine.id, !localMachine.prioridade)} className={ACT_BTN}>
            {localMachine.prioridade ? "⭐ Remover Prioridade" : "⭐ Prioritária"}
          </button>
        )}
        {isAdmin && (
          <>
            {onOpenEdit && (
              <button onClick={() => onOpenEdit(localMachine)} className={ACT_BTN}>
                ✏️ Editar
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm(`Apagar ${localMachine.serie}?`)) onDelete(localMachine.id);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-600/90 transition"
            >
              🗑 Apagar
            </button>
          </>
        )}
        {localMachine.estado?.includes("em-preparacao") && !localMachine.estado?.includes("concluida") && canEditThisMachine && (
          <button onClick={handleMarkComplete} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cpro text-white hover:bg-cpro/90 transition">
            ✅ Concluída
          </button>
        )}
        {localMachine.estado?.includes("em-preparacao") && canEditThisMachine && (
          <button onClick={handleAguardaPecasClick} disabled={isUpdating} className={ACT_BTN}>
            <Clock className="w-3 h-3 inline mr-1" />
            {localMachine.aguardaPecas ? "Peças Chegaram" : "Aguarda Peças"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} header={header} maxWidth="max-w-2xl">
      {/* Timer */}
      {(localMachine.estado?.startsWith("em-preparacao-") ||
        localMachine.timer_started_at ||
        (Number(localMachine.timer_accumulated_seconds) || 0) > 0) && (
        <div className={SECTION}>
          <span className={LABEL}>⏱ Timer de Trabalho</span>
          <TimerButton
            machine={localMachine}
            currentUser={currentUser}
            isAdmin={isAdminProp ?? userPermissions?.canMoveAnyMachine}
            onPlay={onTimerPlay}
            onPause={onTimerPause}
            onReset={onTimerReset}
            onImprevisto={onTimerImprevisto}
          />
        </div>
      )}

      {/* Tarefas */}
      {(localMachine.tarefas?.length > 0 || canEditTasks) && (
        <div className={SECTION}>
          <div className="flex items-center justify-between">
            <span className={LABEL}>📋 Tarefas</span>
            {canEditTasks && (
              <button
                onClick={() => (isEditingTasks ? handleSaveTasks() : setIsEditingTasks(true))}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  isEditingTasks ? "bg-cpro text-white" : "bg-kz text-white"
                }`}
              >
                {isEditingTasks ? "💾 Guardar" : "✏️ Editar"}
              </button>
            )}
          </div>

          {isEditingTasks ? (
            <div>
              <div className="flex gap-1 flex-wrap mb-2">
                {TAREFAS_PREDEFINIDAS.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      if (!editedTasks.find((e) => e.texto === t))
                        setEditedTasks([...editedTasks, { texto: t, concluida: false }]);
                    }}
                    className="px-2 py-1 rounded text-[10px] font-bold border border-slate-600 bg-slate-800/40 text-slate-400"
                  >
                    + {t}
                  </button>
                ))}
              </div>
              {editedTasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700 mb-1"
                >
                  <input type="checkbox" checked={task.concluida} onChange={() => handleToggleEditedTask(idx)} className="accent-amber-500" />
                  <span
                    className={`flex-1 text-sm ${
                      task.concluida ? "text-slate-500 line-through" : "text-slate-200"
                    }`}
                  >
                    {task.texto}
                  </span>
                  <button
                    onClick={() => setEditedTasks(editedTasks.filter((_, i) => i !== idx))}
                    className="text-red-400 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Nova tarefa..."
                  className={INPUT}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleToggleEditedTask())}
                />
                <button
                  onClick={() => {
                    if (newTaskText.trim()) {
                      setEditedTasks([...editedTasks, { texto: newTaskText.trim(), concluida: false }]);
                      setNewTaskText("");
                    }
                  }}
                  className="px-3 rounded-lg bg-kz text-white font-bold"
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            localMachine.tarefas?.map((task, idx) => (
              <div
                key={idx}
                onClick={() => handleToggleTaskLocal(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg mb-1 border transition ${
                  task.concluida ? "bg-cpro/10 border-cpro/30" : "bg-slate-800/40 border-slate-700"
                } ${canEditTasks ? "cursor-pointer" : ""}`}
              >
                <span className="text-sm">{task.concluida ? "✅" : "⬜"}</span>
                <span
                  className={`flex-1 text-sm font-semibold ${
                    task.concluida ? "text-slate-500 line-through" : "text-slate-200"
                  }`}
                >
                  {task.texto}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pedidos de peças */}
      <div className={SECTION}>
        <div className="flex items-center justify-between">
          <span className={LABEL}>🔧 Pedidos de Peças</span>
          <button onClick={() => setShowPedidoForm(!showPedidoForm)} className={ACT_BTN}>
            {showPedidoForm ? "✕ Fechar" : "+ Pedido"}
          </button>
        </div>
        {showPedidoForm && (
          <div className="flex gap-2 mb-2">
            <input
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value)}
              placeholder="Nº do pedido..."
              className={INPUT}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitPedido()}
            />
            <button onClick={handleSubmitPedido} className="px-3 rounded-lg bg-kv text-white font-bold">
              Enviar
            </button>
          </div>
        )}
        {machinePedidos.length === 0 ? (
          <p className="text-xs text-slate-400">Sem pedidos de peças.</p>
        ) : (
          machinePedidos.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700 mb-1"
            >
              <span className="num text-sm font-bold text-slate-200">{p.numeroPedido}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  p.status === "concluido" ? "bg-cpro/15 text-cpro" : "bg-ccla/15 text-ccla"
                }`}
              >
                {p.status === "concluido" ? "CONFIRMADO" : "PENDENTE"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Observações */}
      <div className={SECTION}>
        <span className={LABEL}>💬 Observações</span>
        {!localMachine.observacoes?.length && (
          <p className="text-xs text-slate-400 mb-2">Sem observações.</p>
        )}
        {(Array.isArray(localMachine.observacoes) ? localMachine.observacoes : []).map((obs, idx) => (
          <div key={idx} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700 mb-1.5">
            <p className="text-sm text-slate-200 leading-relaxed mb-1">{obs.texto}</p>
            <p className="text-[10px] text-slate-400">
              {obs.autor} · {obs.data && new Date(obs.data).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
      </div>

      {/* Adicionar observação */}
      <div className="glass-2 border border-slate-700 rounded-lg p-3 space-y-2">
        <span className={LABEL}>💬 Nova observação</span>
        <div className="flex gap-2">
          <textarea
            value={newObs}
            onChange={(e) => setNewObs(e.target.value)}
            rows={2}
            placeholder="Adicionar observação..."
            className={`${INPUT} resize-none`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) handleSubmit();
            }}
          />
          <button
            onClick={handleSubmit}
            className="self-end px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-bold whitespace-nowrap"
          >
            Adicionar
          </button>
        </div>
        <p className="text-[10px] text-slate-400">Ctrl+Enter para enviar</p>
      </div>
    </ModalShell>
  );
}