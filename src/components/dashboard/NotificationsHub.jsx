import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle2, FileText, Clock, Trash2, Package, Wrench, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Pedido } from '@/entities/all';

// ─── Coluna 1: OS Assignments (Lembretes de OS) ────────────────────────────
function ColOS({ notifications, onMarkRead, onMarkAllRead }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)' }}>
            <FileText className="w-4 h-4" style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: '#f59e0b', fontFamily: 'monospace' }}>Lembretes OS</div>
            <div className="text-xs" style={{ color: '#888', fontFamily: 'monospace' }}>{notifications.length} pendente{notifications.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        {notifications.length > 0 && (
          <button onClick={onMarkAllRead} className="text-xs px-2 py-1 rounded transition-colors" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontFamily: 'monospace', border: '1px solid rgba(245,158,11,0.25)' }}>
            limpar
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-2" style={{ maxHeight: '380px' }}>
        {notifications.length === 0 ? (
          <div className="text-center py-8 opacity-40">
            <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: '#f59e0b' }} />
            <p className="text-xs" style={{ fontFamily: 'monospace', color: '#888' }}>Nenhum lembrete</p>
          </div>
        ) : notifications.map(n => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-lg p-3 flex items-start gap-2"
            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-snug" style={{ color: '#1a1a1a' }}>{n.message}</p>
              <p className="text-xs mt-1" style={{ color: '#aaa', fontFamily: 'monospace' }}>
                {new Date(n.created_date).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button onClick={() => onMarkRead(n.id, n.machineId, n.machineSerie, n.technicianName)}
              className="flex-shrink-0 p-1.5 rounded-lg text-white transition-all"
              style={{ background: '#10b981' }} title="OS aberta">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Coluna 2: Pedidos de Peças ────────────────────────────────────────────
function ColPedidos({ pedidos, onToggle, onDelete, onDeleteAll }) {
  const pendentes = pedidos.filter(p => p.status === 'pendente');
  const concluidos = pedidos.filter(p => p.status === 'concluido');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)' }}>
            <Package className="w-4 h-4" style={{ color: '#8b5cf6' }} />
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: '#8b5cf6', fontFamily: 'monospace' }}>Pedidos Peças</div>
            <div className="text-xs" style={{ color: '#888', fontFamily: 'monospace' }}>{pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        {pedidos.length > 0 && (
          <button onClick={onDeleteAll} className="text-xs px-2 py-1 rounded transition-colors" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontFamily: 'monospace', border: '1px solid rgba(139,92,246,0.25)' }}>
            limpar
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-2" style={{ maxHeight: '380px' }}>
        {pedidos.length === 0 ? (
          <div className="text-center py-8 opacity-40">
            <Package className="w-8 h-8 mx-auto mb-2" style={{ color: '#8b5cf6' }} />
            <p className="text-xs" style={{ fontFamily: 'monospace', color: '#888' }}>Nenhum pedido</p>
          </div>
        ) : (
          <>
            {pendentes.map(p => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-lg p-3 flex items-start gap-2"
                style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-sm" style={{ color: '#8b5cf6' }}>{p.numeroPedido}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontFamily: 'monospace' }}>PEND</span>
                  </div>
                  <p className="text-xs truncate" style={{ color: '#555', fontFamily: 'monospace' }}>{p.maquinaModelo} — {p.maquinaSerie}</p>
                  <p className="text-xs capitalize" style={{ color: '#888', fontFamily: 'monospace' }}>{p.tecnico}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => onToggle(p.id, p.status)} className="p-1.5 rounded text-white" style={{ background: '#10b981' }} title="Concluir">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(p.id)} className="p-1.5 rounded text-white" style={{ background: '#ef4444' }} title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
            {concluidos.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-bold mb-1 tracking-wider" style={{ color: '#10b981', fontFamily: 'monospace' }}>✓ CONCLUÍDOS ({concluidos.length})</div>
                {concluidos.map(p => (
                  <div key={p.id} className="rounded p-2 flex items-center justify-between mb-1.5"
                    style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <span className="font-mono text-xs font-bold" style={{ color: '#10b981' }}>{p.numeroPedido}</span>
                    <span className="text-xs truncate flex-1 mx-2" style={{ color: '#888', fontFamily: 'monospace' }}>{p.maquinaSerie}</span>
                    <button onClick={() => onDelete(p.id)} className="p-1 rounded text-white" style={{ background: '#ef4444' }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Coluna 3: Notificações Gerais ─────────────────────────────────────────
function ColNotificacoes({ notifications, onMarkRead, onMarkAll }) {
  const getColor = (type) => {
    if (type === 'os_assignment' || type === 'self_assigned') return { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', color: '#8b5cf6' };
    if (type === 'os_confirmation') return { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#10b981' };
    if (type === 'parts_released') return { bg: 'rgba(77,159,255,0.1)', border: 'rgba(77,159,255,0.3)', color: '#4d9fff' };
    if (type === 'machine_completed') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#22c55e' };
    return { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', color: '#6b7280' };
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(77,159,255,0.15)', border: '1px solid rgba(77,159,255,0.4)' }}>
            <Bell className="w-4 h-4" style={{ color: '#4d9fff' }} />
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: '#4d9fff', fontFamily: 'monospace' }}>Notificações</div>
            <div className="text-xs" style={{ color: '#888', fontFamily: 'monospace' }}>{notifications.length} não lida{notifications.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        {notifications.length > 0 && (
          <button onClick={onMarkAll} className="text-xs px-2 py-1 rounded transition-colors" style={{ background: 'rgba(77,159,255,0.1)', color: '#4d9fff', fontFamily: 'monospace', border: '1px solid rgba(77,159,255,0.25)' }}>
            limpar
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-2" style={{ maxHeight: '380px' }}>
        {notifications.length === 0 ? (
          <div className="text-center py-8 opacity-40">
            <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: '#4d9fff' }} />
            <p className="text-xs" style={{ fontFamily: 'monospace', color: '#888' }}>Sem notificações</p>
          </div>
        ) : notifications.map(n => {
          const c = getColor(n.type);
          return (
            <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-3 flex items-start gap-2"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-snug" style={{ color: '#1a1a1a' }}>{n.message}</p>
                {n.machineSerie && <p className="text-xs mt-0.5 font-mono" style={{ color: '#666' }}>Máq: {n.machineSerie}</p>}
                <p className="text-xs mt-1" style={{ color: '#aaa', fontFamily: 'monospace' }}>
                  {new Date(n.created_date).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={() => onMarkRead(n.id)} className="flex-shrink-0 p-1 rounded transition-colors hover:opacity-70">
                <X className="w-3.5 h-3.5" style={{ color: c.color }} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hub Principal ─────────────────────────────────────────────────────────
export default function NotificationsHub({ currentUser, userPermissions }) {
  const [open, setOpen] = useState(false);
  const [osNotifs, setOsNotifs] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [generalNotifs, setGeneralNotifs] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const btnRef = useRef(null);

  const isAdmin = userPermissions?.canDeleteMachine;

  // ── Permission de browser notifs ──
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') { setPermissionGranted(true); return; }
    if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => setPermissionGranted(p === 'granted'));
    }
  }, []);

  // ── Load & subscribe: OS notifs ──
  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      const all = await base44.entities.Notificacao.list('-created_date');
      setOsNotifs(all.filter(n => (n.type === 'os_assignment' || n.type === 'self_assigned') && !n.isRead));
    };
    load();
    const unsub = base44.entities.Notificacao.subscribe(ev => {
      if (ev.type === 'create' && ev.data && (ev.data.type === 'os_assignment' || ev.data.type === 'self_assigned') && !ev.data.isRead) {
        setOsNotifs(prev => [ev.data, ...prev.filter(n => n.id !== ev.data.id)]);
      } else if (ev.type === 'update' && ev.data?.isRead) {
        setOsNotifs(prev => prev.filter(n => n.id !== ev.data.id));
      } else if (ev.type === 'delete') {
        setOsNotifs(prev => prev.filter(n => n.id !== ev.id));
      }
    });
    return () => { if (unsub) unsub(); };
  }, [isAdmin]);

  // ── Load & subscribe: Pedidos ──
  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => { const d = await Pedido.list('-created_date'); setPedidos(d); };
    load();
    const unsub = base44.entities.Pedido.subscribe(ev => {
      if (ev.type === 'create' && ev.data) setPedidos(prev => [ev.data, ...prev.filter(p => p.id !== ev.data.id)]);
      else if (ev.type === 'update' && ev.data) setPedidos(prev => prev.map(p => p.id === ev.data.id ? ev.data : p));
      else if (ev.type === 'delete') setPedidos(prev => prev.filter(p => p.id !== ev.id));
    });
    return () => { if (unsub) unsub(); };
  }, [isAdmin]);

  // ── Load & subscribe: General notifs (per user) ──
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      const all = await base44.entities.Notificacao.list('-created_date');
      let mine;
      if (isAdmin) {
        mine = all.filter(n => n.userId === 'admin' && !n.isRead && n.type !== 'os_assignment' && n.type !== 'self_assigned' && n.type !== 'parts_requested');
      } else if (currentUser?.nome_tecnico) {
        mine = all.filter(n => n.userId === currentUser.nome_tecnico && !n.isRead);
      } else {
        mine = [];
      }
      setGeneralNotifs(mine);
    };
    load();
    const unsub = base44.entities.Notificacao.subscribe(ev => {
      const forMe = (isAdmin && ev.data?.userId === 'admin') || (currentUser?.nome_tecnico && ev.data?.userId === currentUser.nome_tecnico);
      if (ev.type === 'create' && ev.data && forMe && !ev.data.isRead) {
        const skip = isAdmin && (ev.data.type === 'os_assignment' || ev.data.type === 'self_assigned' || ev.data.type === 'parts_requested');
        if (!skip) setGeneralNotifs(prev => [ev.data, ...prev.filter(n => n.id !== ev.data.id)]);
      } else if (ev.type === 'update' && ev.data?.isRead) {
        setGeneralNotifs(prev => prev.filter(n => n.id !== ev.data.id));
      } else if (ev.type === 'delete') {
        setGeneralNotifs(prev => prev.filter(n => n.id !== ev.id));
      }
    });
    return () => { if (unsub) unsub(); };
  }, [currentUser?.email, currentUser?.nome_tecnico, isAdmin]);

  const totalBadge = isAdmin
    ? osNotifs.length + pedidos.filter(p => p.status === 'pendente').length + generalNotifs.length
    : generalNotifs.length;

  // ── Handlers OS ──
  const handleOSRead = async (id, machineId, machineSerie, techName) => {
    await base44.entities.Notificacao.update(id, { isRead: true });
    if (techName) {
      await base44.entities.Notificacao.create({ userId: techName, message: `OS confirmada para máquina ${machineSerie}`, machineId, machineSerie, technicianName: 'Admin', type: 'os_confirmation', isRead: false });
    }
    setOsNotifs(prev => prev.filter(n => n.id !== id));
  };

  const handleOSReadAll = async () => {
    await Promise.all(osNotifs.map(n => base44.entities.Notificacao.update(n.id, { isRead: true })));
    setOsNotifs([]);
  };

  // ── Handlers Pedidos ──
  const handleTogglePedido = async (pedidoId, currentStatus) => {
    const newStatus = currentStatus === 'pendente' ? 'concluido' : 'pendente';
    const pedido = pedidos.find(p => p.id === pedidoId);
    const updateData = { status: newStatus, dataConclusao: newStatus === 'concluido' ? new Date().toISOString() : null };
    if (newStatus === 'concluido' && pedido?.tecnico) {
      await base44.entities.Notificacao.create({ userId: pedido.tecnico, message: `Pedido de peças liberado: ${pedido.numeroPedido}`, machineId: pedido.maquinaId, machineSerie: pedido.maquinaSerie, technicianName: 'Admin', type: 'parts_released', isRead: false });
    }
    await Pedido.update(pedidoId, updateData);
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, ...updateData } : p));
  };

  const handleDeletePedido = async (pedidoId) => {
    if (!window.confirm('Eliminar este pedido?')) return;
    await Pedido.delete(pedidoId);
    setPedidos(prev => prev.filter(p => p.id !== pedidoId));
  };

  const handleDeleteAllPedidos = async () => {
    if (!window.confirm(`Eliminar todos os ${pedidos.length} pedidos?`)) return;
    await Promise.all(pedidos.map(p => Pedido.delete(p.id)));
    setPedidos([]);
  };

  // ── Handlers General ──
  const handleGeneralRead = async (id) => {
    await base44.entities.Notificacao.update(id, { isRead: true });
    setGeneralNotifs(prev => prev.filter(n => n.id !== id));
  };

  const handleGeneralReadAll = async () => {
    await Promise.all(generalNotifs.map(n => base44.entities.Notificacao.update(n.id, { isRead: true })));
    setGeneralNotifs([]);
  };

  return (
    <>
      {/* ── Trigger Button ── */}
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center gap-2 px-4 py-2 text-white font-bold text-xs tracking-wider transition-all active:scale-95"
        style={{
          background: totalBadge > 0 ? 'linear-gradient(135deg, #FF2D78 0%, #9B5CF6 100%)' : 'linear-gradient(135deg, #4a4a6a 0%, #2a2a4a 100%)',
          border: `1px solid ${totalBadge > 0 ? 'rgba(255,45,120,0.5)' : 'rgba(100,100,160,0.4)'}`,
          borderRadius: '8px',
          boxShadow: totalBadge > 0 ? '0 0 16px rgba(255,45,120,0.3)' : 'none',
          fontFamily: 'monospace',
        }}
      >
        <Bell className={`w-4 h-4 ${totalBadge > 0 ? 'animate-pulse' : ''}`} />
        <span>ALERTAS</span>
        {totalBadge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
            style={{ background: '#FF2D78', boxShadow: '0 0 8px rgba(255,45,120,0.8)', fontFamily: 'monospace' }}>
            {totalBadge > 9 ? '9+' : totalBadge}
          </span>
        )}
      </button>

      {/* ── Modal ── */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[150]" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed z-[200]"
              style={{
                top: '120px', left: '50%', transform: 'translateX(-50%)',
                width: 'min(95vw, 900px)',
                maxHeight: 'calc(100vh - 140px)',
                background: 'linear-gradient(160deg, #fafafa 0%, #f0f2f8 100%)',
                border: '1px solid rgba(255,45,120,0.25)',
                borderRadius: '16px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 0 60px rgba(255,45,120,0.1)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'linear-gradient(90deg, rgba(255,45,120,0.06) 0%, rgba(77,159,255,0.04) 100%)' }}>
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5" style={{ color: '#FF2D78' }} />
                  <span className="font-bold tracking-widest text-sm uppercase" style={{ fontFamily: 'monospace', color: '#1a1a2e' }}>Central de Alertas</span>
                  {totalBadge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255,45,120,0.12)', color: '#FF2D78', fontFamily: 'monospace' }}>{totalBadge}</span>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-black/10 transition-colors">
                  <X className="w-4 h-4" style={{ color: '#666' }} />
                </button>
              </div>

              {/* 3 Colunas */}
              <div className="flex-1 overflow-hidden" style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr 1fr' : '1fr', gap: 0 }}>

                {/* Col 1: OS (admin only) */}
                {isAdmin && (
                  <div className="p-5 overflow-y-auto" style={{ borderRight: '1px solid rgba(0,0,0,0.07)' }}>
                    <ColOS notifications={osNotifs} onMarkRead={handleOSRead} onMarkAllRead={handleOSReadAll} />
                  </div>
                )}

                {/* Col 2: Pedidos (admin only) */}
                {isAdmin && (
                  <div className="p-5 overflow-y-auto" style={{ borderRight: '1px solid rgba(0,0,0,0.07)' }}>
                    <ColPedidos pedidos={pedidos} onToggle={handleTogglePedido} onDelete={handleDeletePedido} onDeleteAll={handleDeleteAllPedidos} />
                  </div>
                )}

                {/* Col 3: Notificações gerais (todos) */}
                <div className="p-5 overflow-y-auto">
                  <ColNotificacoes notifications={generalNotifs} onMarkRead={handleGeneralRead} onMarkAll={handleGeneralReadAll} />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 flex-shrink-0 flex items-center gap-2 text-xs" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.02)', fontFamily: 'monospace', color: '#999' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                <span>Sistema em tempo real</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}