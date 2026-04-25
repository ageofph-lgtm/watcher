import React from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import CardStack from "./CardStack";

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
  isDark
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
    ordensServico.filter(os => (os.status === status) || (!os.status && status === 'a-fazer'));

  const getVisibleColumns = () => {
    if (userPermissions?.canViewAllColumns) return Object.entries(columns);
    if (!userPermissions || userPermissions.allowedOSStatuses.length === 0) return Object.entries(columns);
    return Object.entries(columns).filter(([status]) => userPermissions.allowedOSStatuses.includes(status));
  };

  const visibleColumns = getVisibleColumns();

  // Column accent colors
  const columnAccents = {
    'a-fazer':       { color: '#6B7090', glow: 'rgba(107,112,144,0.3)' },
    'em-progresso':  { color: '#4D9FFF', glow: 'rgba(77,159,255,0.4)' },
    'aguarda':       { color: '#F59E0B', glow: 'rgba(245,158,11,0.4)' },
    'concluido':     { color: '#22C55E', glow: 'rgba(34,197,94,0.4)' },
    'cancelado':     { color: '#EF4444', glow: 'rgba(239,68,68,0.3)' },
  };

  const getAccent = (status) => {
    for (const [key, val] of Object.entries(columnAccents)) {
      if (status.includes(key)) return val;
    }
    return { color: '#FF2D78', glow: 'rgba(255,45,120,0.4)' };
  };

  return (
    <DragDropContext onDragEnd={userPermissions?.canMoveOSCards ? handleDragEnd : () => {}}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading
          ? visibleColumns.map(([status]) => (
              <div key={status} className="flex flex-col gap-3">
                <Skeleton className="h-12 w-full rounded" />
                <Skeleton className="h-72 w-full rounded" />
              </div>
            ))
          : visibleColumns.map(([status, config]) => {
              const columnOrders = getColumnOrders(status);
              const accent = getAccent(status);

              return (
                <div key={status} className="flex flex-col gap-3">
                  {/* ── Column Header ── */}
                  <div className="relative overflow-hidden clip-corner-tr px-3 py-2.5 flex items-center justify-between"
                    style={{
                      background: isDark
                        ? `linear-gradient(135deg, rgba(17,17,24,0.95) 0%, rgba(22,22,32,0.9) 100%)`
                        : `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,241,248,0.9) 100%)`,
                      border: `1px solid ${accent.color}40`,
                      boxShadow: `0 0 12px ${accent.glow}`,
                    }}>
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l"
                      style={{ background: accent.color, boxShadow: `0 0 8px ${accent.glow}` }} />

                    <div className="flex items-center gap-2 pl-2">
                      <config.icon className="w-4 h-4" style={{ color: accent.color }} />
                      <span className="col-header-cyber text-xs" style={{ color: isDark ? '#E8E9F5' : '#0D0E1A' }}>
                        {config.title}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        background: `${accent.color}20`,
                        color: accent.color,
                        border: `1px solid ${accent.color}40`,
                      }}>
                      {columnOrders.length}
                    </span>
                  </div>

                  {/* ── Droppable zone ── */}
                  <Droppable droppableId={status} isDropDisabled={!userPermissions?.canMoveOSCards}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className="min-h-[350px] transition-all duration-200 rounded p-1.5"
                        style={{
                          background: snapshot.isDraggingOver
                            ? isDark ? `${accent.color}10` : `${accent.color}08`
                            : 'transparent',
                          border: snapshot.isDraggingOver
                            ? `1px dashed ${accent.color}60`
                            : '1px dashed transparent',
                        }}>
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
                          <div className="flex flex-col items-center justify-center text-center pt-16 select-none">
                            <config.icon className="w-10 h-10 mb-3 opacity-20" style={{ color: accent.color }} />
                            <p className="font-mono text-xs tracking-wider opacity-30"
                              style={{ color: isDark ? '#E8E9F5' : '#0D0E1A' }}>
                              [ VAZIO ]
                            </p>
                          </div>
                        )}
                        <div style={{ display: 'none' }}>{provided.placeholder}</div>
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
