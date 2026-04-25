import React from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon, CheckCircle2, Circle, ArrowUpCircle,
  Pencil, Trash2, MoreVertical, User, AlertTriangle, Clock, Zap
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LOGO_URL = "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/18bcaeee6_Gemini_Generated_Image_nunysxnunysxnuny.png";

const PRIORITY_STYLES = {
  'normal':  { bg: 'rgba(77,159,255,0.15)', color: '#4D9FFF', border: 'rgba(77,159,255,0.35)', label: 'NORMAL' },
  'alta':    { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: 'rgba(245,158,11,0.35)', label: 'ALTA' },
  'urgente': { bg: 'rgba(255,45,120,0.2)',  color: '#FF2D78', border: 'rgba(255,45,120,0.5)',  label: 'URGENTE', glow: true },
};

const getOriginLabel = (origem) => {
  switch(origem) {
    case 'nova': return { label: 'NOVA', color: '#4D9FFF' };
    case 'sts':  return { label: 'STS',  color: '#22C55E' };
    case 'uts':  return { label: 'UTS',  color: '#F59E0B' };
    default:     return { label: origem?.toUpperCase() || '?', color: '#6B7090' };
  }
};

export default function OSCard({ 
  os, onOpenDetails, onEdit, onDelete, onStatusChange,
  allStatuses, userPermissions, isTop = false, isDragging = false, isDark = true
}) {
  const completedTasks = os.tasks?.filter(t => t.completed).length || 0;
  const totalTasks = os.tasks?.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const isOverdue = () => {
    if (!os.dataEntrega || os.status === 'concluido') return false;
    const d = new Date(os.dataEntrega); const t = new Date();
    d.setHours(0,0,0,0); t.setHours(0,0,0,0);
    return d < t;
  };

  const priorityStyle = PRIORITY_STYLES[os.prioridade] || PRIORITY_STYLES.normal;
  const originInfo = os.origemMaquina ? getOriginLabel(os.origemMaquina) : null;
  const hasReservation = os.caracteristicasMaquina?.reserva || os.reserva;
  const overdue = isOverdue();

  // Card surface colors
  const cardBg = isDark
    ? 'linear-gradient(160deg, #131320 0%, #0f0f1c 60%, #12101e 100%)'
    : 'linear-gradient(160deg, #ffffff 0%, #f8f9ff 60%, #f2f3fc 100%)';
  const textPrimary = isDark ? '#E8E9F5' : '#0D0E1A';
  const textMuted = isDark ? '#6B7090' : '#8B8FA8';
  const borderColor = isDragging ? '#4D9FFF' : isDark ? '#1E1E2E' : '#D8DAE8';

  return (
    <div
      className={`w-full select-none ${isTop ? 'cursor-grab' : 'pointer-events-none'} ${isDragging ? 'cursor-grabbing' : ''}`}
      onClick={isTop && !isDragging ? () => onOpenDetails(os) : undefined}
    >
      <div
        className="relative overflow-hidden flex flex-col transition-all duration-200"
        style={{
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '6px',
          minHeight: '360px',
          boxShadow: isDragging
            ? '0 20px 60px rgba(77,159,255,0.4), 0 8px 24px rgba(0,0,0,0.5)'
            : isDark
              ? '0 4px 24px rgba(0,0,0,0.4)'
              : '0 4px 16px rgba(0,0,0,0.08)',
        }}>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: priorityStyle.glow
            ? `linear-gradient(90deg, transparent, ${priorityStyle.color}, transparent)`
            : `linear-gradient(90deg, transparent, rgba(255,45,120,0.4), transparent)` }} />

        {/* Corner cut (clip top-right) */}
        <div className="absolute top-0 right-0 w-6 h-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-0 h-0"
            style={{ borderLeft: '24px solid transparent', borderTop: `24px solid ${isDark ? '#0D0D14' : '#F2F3F7'}` }} />
        </div>

        {/* Watermark logo */}
        <img src={LOGO_URL} alt=""
          className="absolute bottom-0 right-0 w-40 h-40 object-contain pointer-events-none select-none"
          style={{ opacity: 0.04, transform: 'translate(20%, 15%)' }} />

        {/* ── Header ── */}
        <div className="relative z-10 p-4 pb-2">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-display font-bold text-lg leading-tight" style={{ color: textPrimary }}>
                  {os.modelo}
                </h3>
                {originInfo && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: `${originInfo.color}18`, color: originInfo.color, border: `1px solid ${originInfo.color}35` }}>
                    {originInfo.label}
                  </span>
                )}
                {overdue && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded animate-cyber-pulse"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.4)' }}>
                    ATRASO
                  </span>
                )}
              </div>
              {os.ano && (
                <p className="font-mono text-xs" style={{ color: textMuted }}>ANO {os.ano}</p>
              )}
            </div>

            {isTop && !isDragging && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button className="p-1.5 rounded transition-colors hover:bg-white/10" style={{ color: textMuted }}>
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48"
                  style={{ background: isDark ? '#111118' : '#FFFFFF', border: '1px solid rgba(255,45,120,0.2)' }}>
                  {Object.entries(allStatuses || {}).map(([statusKey, statusConfig]) => {
                    if (statusKey === os.status) return null;
                    if (!userPermissions?.canAccessOSStatus?.(statusKey)) return null;
                    const StatusIcon = statusConfig.icon;
                    return (
                      <DropdownMenuItem key={statusKey}
                        onClick={(e) => { e.stopPropagation(); if (userPermissions?.canAccessOSStatus?.(statusKey)) onStatusChange(os.id, statusKey); }}
                        className="cursor-pointer" style={{ color: isDark ? '#E8E9F5' : '#0D0E1A' }}>
                        <StatusIcon className="w-4 h-4 mr-2" style={{ color: '#FF2D78' }} />
                        {statusConfig.title}
                      </DropdownMenuItem>
                    );
                  })}
                  {userPermissions?.canEditOS && onEdit && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(os); }}
                      className="cursor-pointer" style={{ color: isDark ? '#E8E9F5' : '#0D0E1A' }}>
                      <Pencil className="w-4 h-4 mr-2" style={{ color: '#4D9FFF' }} /> Editar O.S.
                    </DropdownMenuItem>
                  )}
                  {userPermissions?.canDeleteOS && onDelete && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(os.id); }}
                      className="cursor-pointer text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Serial Number */}
          <div className="p-2.5 rounded clip-cyber-sm"
            style={{ background: isDark ? 'rgba(255,45,120,0.06)' : 'rgba(255,45,120,0.04)', border: '1px solid rgba(255,45,120,0.2)' }}>
            <p className="font-mono text-sm font-bold text-center tracking-widest" style={{ color: '#FF2D78' }}>
              {os.serie}
            </p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="relative z-10 px-4 pb-4 flex-grow flex flex-col justify-end gap-3">

          {/* Priority badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] px-2 py-1 rounded tracking-wider flex items-center gap-1"
              style={{
                background: priorityStyle.bg,
                color: priorityStyle.color,
                border: `1px solid ${priorityStyle.border}`,
                boxShadow: priorityStyle.glow ? `0 0 10px ${priorityStyle.color}40` : 'none',
              }}>
              {priorityStyle.glow && <Zap className="w-3 h-3" />}
              {priorityStyle.label}
            </span>
            {hasReservation && (
              <span className="font-mono text-[10px] px-2 py-1 rounded tracking-wider"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                RESERVADA
              </span>
            )}
          </div>

          {/* Client / Delivery */}
          <div className="space-y-2">
            {os.cliente && (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4D9FFF' }} />
                <p className="text-sm truncate" style={{ color: textMuted }}>{os.cliente}</p>
              </div>
            )}
            {os.dataEntrega && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: overdue ? '#EF4444' : '#4D9FFF' }} />
                <p className="text-sm font-mono" style={{ color: overdue ? '#EF4444' : textMuted }}>
                  {format(new Date(os.dataEntrega), 'dd/MM/yyyy')}
                </p>
              </div>
            )}
          </div>

          {/* Task Progress */}
          {totalTasks > 0 && (
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] tracking-wider" style={{ color: textMuted }}>TAREFAS</span>
                <span className="font-mono text-[10px] font-bold"
                  style={{ color: progress === 100 ? '#22C55E' : '#FF2D78' }}>
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ background: isDark ? '#1E1E2E' : '#E0E1F0' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: progress === 100
                      ? 'linear-gradient(90deg, #22C55E, #16a34a)'
                      : 'linear-gradient(90deg, #FF2D78, #4D9FFF)',
                    boxShadow: progress > 0 ? '0 0 6px rgba(255,45,120,0.5)' : 'none',
                  }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
