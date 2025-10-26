import React, { useEffect, useRef, useState } from "react";
import { X, GripHorizontal, Filter, RotateCcw } from "lucide-react";
import useStore from "../../store/store";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface TradeFilters {
  showClosed: boolean;
  indexName: string;
  entrySide: string;
  entryType: string;
  expiry: string;
  entryTriggered: string;
  dateRange: {
    from: string;
    to: string;
  };
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const { filters, setFilters, indexData } = useStore();

  const [localFilters, setLocalFilters] = useState<TradeFilters>(filters);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleApplyFilters = () => {
    setFilters(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters: TradeFilters = {
      showClosed: false,
      indexName: "",
      entrySide: "",
      entryType: "",
      expiry: "",
      entryTriggered: "",
      dateRange: {
        from: "",
        to: "",
      },
    };
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="fixed inset-0  " onClick={onClose} />
      <div
        ref={modalRef}
        className={`bg-gray-800 border border-gray-400 rounded-lg p-4 sm:p-6 w-full max-w-md cursor-move select-none max-h-[90vh] overflow-y-auto relative z-10 ${
          isDragging ? "opacity-90" : ""
        }`}
        style={{
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div
            className="flex items-center space-x-2 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <GripHorizontal size={16} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Filter Trades</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Show Closed Trades Toggle */}
          <div className="flex items-center space-x-3">
            <Filter className="text-blue-400" size={20} />
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localFilters.showClosed}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    showClosed: e.target.checked,
                  })
                }
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-white">
                Show Closed Trades
              </span>
            </label>
          </div>

          {/* Index Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Index
            </label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={localFilters.indexName}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, indexName: e.target.value })
              }
            >
              <option value="">All Indices</option>
              {indexData.indices.map((index) => (
                <option key={index} value={index.toUpperCase()}>
                  {index.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Entry Side Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Entry Side
            </label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={localFilters.entrySide}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, entrySide: e.target.value })
              }
            >
              <option value="">All Sides</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          {/* Entry Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Order Type
            </label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={localFilters.entryType}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, entryType: e.target.value })
              }
            >
              <option value="">All Types</option>
              <option value="MARKET">MARKET</option>
              <option value="LIMIT">LIMIT</option>
              <option value="UNDEFINED">UNDEFINED</option>
            </select>
          </div>

          {/* Entry Triggered Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Entry Triggered
            </label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={localFilters.entryTriggered}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  entryTriggered: e.target.value,
                })
              }
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={localFilters.dateRange.from}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    dateRange: {
                      ...localFilters.dateRange,
                      from: e.target.value,
                    },
                  })
                }
              />
              <input
                type="date"
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={localFilters.dateRange.to}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    dateRange: {
                      ...localFilters.dateRange,
                      to: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between space-x-3 mt-6">
          <button
            onClick={handleResetFilters}
            className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
