import React, { useState, useCallback, memo } from "react";
import {
  Settings,
  Eye,
  EyeOff,
  GripVertical,
  X,
  GripHorizontal,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { type TradeDetailColumn } from "../../types/instanceColumns";

interface TradeDetailColumnManagerProps {
  columns: TradeDetailColumn[];
  onColumnsChange: (columns: TradeDetailColumn[]) => void;
}

// Save columns to localStorage
const saveColumnsToStorage = (columns: TradeDetailColumn[]) => {
  localStorage.setItem("tradeDetailColumns", JSON.stringify(columns));
};

// Load columns from localStorage
export const loadTradeDetailColumnsFromStorage = ():
  | TradeDetailColumn[]
  | null => {
  const saved = localStorage.getItem("tradeDetailColumns");
  return saved ? JSON.parse(saved) : null;
};
const TradeDetailColumnManager: React.FC<TradeDetailColumnManagerProps> = ({
  columns,
  onColumnsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const items = Array.from(columns);
      const [moved] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, moved);
      saveColumnsToStorage(items);
      onColumnsChange(items);
    },
    [columns, onColumnsChange]
  );

  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      const updated = columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      );
      saveColumnsToStorage(updated);
      onColumnsChange(updated);
    },
    [columns, onColumnsChange]
  );

  const showAll = useCallback(() => {
    const updated = columns.map((col) => ({ ...col, visible: true }));
    saveColumnsToStorage(updated);
    onColumnsChange(updated);
  }, [columns, onColumnsChange]);

  const hideAll = useCallback(() => {
    const updated = columns.map((col) => ({ ...col, visible: false }));
    saveColumnsToStorage(updated);
    onColumnsChange(updated);
  }, [columns, onColumnsChange]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1 px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors"
      >
        <Settings size={12} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed z-50 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 flex flex-col"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
          >
            <div
              className="p-3 border-b border-gray-700 cursor-move flex justify-between items-center"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center space-x-2">
                <GripHorizontal size={14} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-white">
                  Trade Detail Columns
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 max-h-64">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="trade-detail-column-list">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {columns.map((col, index) => (
                        <Draggable
                          key={col.id}
                          draggableId={col.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center justify-between p-2 mb-1 bg-gray-700 rounded transition-all select-none ${
                                snapshot.isDragging
                                  ? "opacity-75 shadow-lg transform rotate-1 scale-105 z-50"
                                  : "hover:bg-gray-600"
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white transition-colors"
                                >
                                  <GripVertical size={14} />
                                </div>
                                <span className="text-white text-xs">
                                  {col.label}
                                </span>
                              </div>
                              <button
                                onClick={() => toggleColumnVisibility(col.id)}
                                className={`p-1 rounded transition-colors ${
                                  col.visible
                                    ? "text-green-400 hover:text-green-300"
                                    : "text-gray-400 hover:text-gray-300"
                                }`}
                              >
                                {col.visible ? (
                                  <Eye size={14} />
                                ) : (
                                  <EyeOff size={14} />
                                )}
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            <div className="p-3 border-t border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">
                  {columns.filter((c) => c.visible).length} of {columns.length}{" "}
                  visible
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={showAll}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                  >
                    Show All
                  </button>
                  <button
                    onClick={hideAll}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                  >
                    Hide All
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(TradeDetailColumnManager);
