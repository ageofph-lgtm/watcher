import React, { useState } from "react";
import OSCard from "./OSCard";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";

export default function CardStack({ orders, onOpenDetails, onEdit, onDelete, onStatusChange, userPermissions, allStatuses, isDark }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < orders.length - 1 ? prev + 1 : prev));
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };
  
  const displayedOrders = orders.slice(0, 5);

  return (
    <div className="relative">
      {/* Card Stack */}
      <div className="relative h-[380px] w-full flex items-center justify-center mb-4">
        <AnimatePresence>
          {displayedOrders.map((os, index) => {
            const isTop = index === activeIndex;
            const offset = index - activeIndex;

            if (offset < 0 || offset > 3) return null;

            // Only the top card should be draggable
            if (isTop && userPermissions?.canMoveOSCards) {
              return (
                <Draggable key={os.id} draggableId={os.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="absolute w-64"
                      style={{
                        ...provided.draggableProps.style,
                        zIndex: displayedOrders.length - offset + (snapshot.isDragging ? 1000 : 0),
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
                        isTop={isTop}
                        isDragging={snapshot.isDragging}
                        isDark={isDark}
                      />
                    </div>
                  )}
                </Draggable>
              );
            } else {
              return (
                <motion.div
                  key={os.id}
                  className="absolute w-64"
                  initial={{ 
                      x: offset * 30,
                      scale: 1 - offset * 0.1,
                      opacity: 0,
                  }}
                  animate={{
                    x: offset * 30,
                    scale: 1 - offset * 0.1,
                    zIndex: displayedOrders.length - offset,
                    opacity: 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <OSCard
                    os={os}
                    onOpenDetails={onOpenDetails}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                    userPermissions={userPermissions}
                    allStatuses={allStatuses}
                    isTop={isTop}
                  isDark={isDark}
                />
                </motion.div>
              );
            }
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Controls - Cyber Style */}
      {displayedOrders.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-2">
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="w-8 h-8 flex items-center justify-center transition-all clip-cyber-sm disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ background: 'rgba(255,45,120,0.15)', border: '1px solid rgba(255,45,120,0.35)', color: '#FF2D78' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="font-mono text-xs tracking-widest px-3 py-1 clip-cyber-sm"
            style={{ background: 'rgba(255,45,120,0.08)', border: '1px solid rgba(255,45,120,0.2)', color: '#FF2D78' }}>
            {activeIndex + 1}/{displayedOrders.length}
          </span>
          
          <button
            onClick={handleNext}
            disabled={activeIndex === displayedOrders.length - 1}
            className="w-8 h-8 flex items-center justify-center transition-all clip-cyber-sm disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ background: 'rgba(255,45,120,0.15)', border: '1px solid rgba(255,45,120,0.35)', color: '#FF2D78' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}