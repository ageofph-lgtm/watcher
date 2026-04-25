import React from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import CardStack from "./CardStack";

// Status accent colors
const STATUS_ACCENTS = {
  'a-fazer':      { bar: '#64748B', badge: 'rgba(100,116,139,0.12)', badgeText: '#94A3B8' },
  'em-progresso': { bar: '#3B82F6', badge: 'rgba(59,130,246,0.12)',  badgeText: '#60A5FA' },
  'aguarda':      { bar: '#F59E0B', badge: 'rgba(245,158,11,0.12)',  badgeText: '#FCD34D' },
  'concluido':    { bar: '#22C55E', badge: 'rgba(34,197,94,0.12)',   badgeText: '#4ADE80' },
  'cancelado':    { bar: '#EF4444', badge: 'rgba(239,68,68,0.12)',   badgeText: '#F87171' },
};

const getAccent = (status) => {
  for (const [key, val] of Object.entries(STATUS_ACCENTS)) {
    if (status?.includes(key)) return val;
  }
  return { bar: '#6B7280', badge: 'rgba(107,114,128,0.12)', badgeText: '#9CA3AF' };
};

export default function KanbanBoard({
  ordensServico,
  onStatusChange,
  onOpenDetails,
  onEditOS,
  onDeleteOS,
  isLoading,
  columns,
  userPermissions,
  onUpdate,
  isDark,
}) {
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    if (!userPermissions?.canAccessOSStatus(newStatus)) return;
    await onStatusChange(draggableId, newStatus);
    if (onUpdate) setTimeout(() => onUpdate(true), 500);
  };

  const getColumnOrders = (status) =>
    ordensServico.filter(
      (os) => os.status === status || (!os.status && status === "a-fazer")
    );

  const getVisibleColumns = () => {
    if (userPermissions?.canViewAllColumns) return Object.entries(columns);
    if (!userPermissions || userPermissions.allowedOSStatuses.length === 0)
      return Object.entries(columns);
    return Object.entries(columns).filter(([status]) =>
      userPermissions.allowedOSStatuses.includes(status)
    );
  };

  const visibleColumns = getVisibleColumns();

  // Theme tokens
  const colBg      = isDark ? '#0F172A' : '#F8FAFC';
  const colBorder  = isDark ? '#1E293B' : '#E2E8F0';
  const headerBg   = isDark ? '#0F172A' : '#F8FAFC';
  const textMain   = isDark ? '#F1F5F9' : '#0F172A';
  const textMuted  = isDark ? '#475569' : '#94A3B8';

  return (
    <DragDropContext
      onDragEnd={userPermissions?.canMoveOSCards ? handleDragEnd : () => {}}
    >
      <div className="flex gap-3 items-start overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {isLoading
          ? visibleColumns.map(([status]) => (
              <div
                key={status}
                className="flex flex-col gap-2 flex-shrink-0"
                style={{ width: '260px' }}
              >
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ))
          : visibleColumns.map(([status, config]) => {
              const columnOrders = getColumnOrders(status);
              const accent = getAccent(status);
              const Icon = config.icon;

              return (
                <div
                  key={status}
                  className="flex flex-col flex-shrink-0"
                  style={{ width: '260px' }}
                >
                  {/* ── Column Header ───────────────────────── */}
                  <div
                    className="flex items-center justify-between px-3 py-2.5 mb-2 rounded-lg"
                    style={{
                      background: headerBg,
                      border: `1px solid ${colBorder}`,
                      borderTop: `2px solid ${accent.bar}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: accent.bar }}
                      />
                      <span
                        className="text-xs font-semibold tracking-wide uppercase"
                        style={{ color: textMain, letterSpacing: '0.06em' }}
                      >
                        {config.title}
                      </span>
                    </div>

                    <span
                      className="text-xs font-bold font-mono px-2 py-0.5 rounded-full"
                      style={{
                        background: accent.badge,
                        color: accent.badgeText,
                      }}
                    >
                      {columnOrders.length}
                    </span>
                  </div>

                  {/* ── Droppable Zone ──────────────────────── */}
                  <Droppable
                    droppableId={status}
                    isDropDisabled={!userPermissions?.canMoveOSCards}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 rounded-lg transition-all duration-150 min-h-[400px]"
                        style={{
                          padding: '2px',
                          background: snapshot.isDraggingOver
                            ? isDark
                              ? `${accent.bar}10`
                              : `${accent.bar}08`
                            : 'transparent',
                          border: snapshot.isDraggingOver
                            ? `1px dashed ${accent.bar}50`
                            : '1px dashed transparent',
                          borderRadius: '8px',
                        }}
                      >
                        {columnOrders.length > 0 ? (
                          <CardStack
                            orders={columnOrders}
                            onOpenDetails={onOpenDetails}
                            onEdit={userPermissions?.canEditOS ? onEditOS : null}
                            onDelete={userPermissions?.canDeleteOS ? onDeleteOS : null}
                            onStatusChange={onStatusChange}
                            userPermissions={userPermissions}
                            allStatuses={columns}
                            isDark={isDark}
                          />
                        ) : (
                          <div
                            className="flex flex-col items-center justify-center h-32 rounded-lg"
                            style={{
                              border: `1px dashed ${colBorder}`,
                              borderRadius: '8px',
                            }}
                          >
                            <Icon
                              className="w-6 h-6 mb-1.5"
                              style={{ color: textMuted, opacity: 0.4 }}
                            />
                            <p
                              className="text-xs font-mono tracking-wider"
                              style={{ color: textMuted, opacity: 0.5 }}
                            >
                              vazio
                            </p>
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
      </div>
    </DragDropContext>
  );
}
