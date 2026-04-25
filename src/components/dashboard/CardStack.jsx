import React from "react";
import OSCard from "./OSCard";
import { Draggable } from "@hello-pangea/dnd";

export default function CardStack({
  orders, onOpenDetails, onEdit, onDelete,
  onStatusChange, userPermissions, allStatuses, isDark
}) {
  return (
    <div className="flex flex-col gap-2">
      {orders.map((os, index) => {
        if (userPermissions?.canMoveOSCards) {
          return (
            <Draggable key={os.id} draggableId={os.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={{
                    ...provided.draggableProps.style,
                    opacity: snapshot.isDragging ? 0.95 : 1,
                  }}
                >
                  <OSCard
                    os={os}
                    onOpenDetails={onOpenDetails}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                    userPermissions={userPermissions}
                    allStatuses={allStatuses}
                    isTop={true}
                    isDragging={snapshot.isDragging}
                    isDark={isDark}
                  />
                </div>
              )}
            </Draggable>
          );
        }

        return (
          <div key={os.id}>
            <OSCard
              os={os}
              onOpenDetails={onOpenDetails}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              userPermissions={userPermissions}
              allStatuses={allStatuses}
              isTop={true}
              isDragging={false}
              isDark={isDark}
            />
          </div>
        );
      })}
    </div>
  );
}
