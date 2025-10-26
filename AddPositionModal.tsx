import React, { useState, useRef, useEffect } from "react";
import { X, GripHorizontal } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "../../config/config";
import cookies from "js-cookie";
import useStore from "../../store/store";

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string;
}

interface PositionFormData {
  legCount: number;
  qty: number;
  entrySide: "BUY" | "SELL";
  entryType: "MARKET" | "LIMIT";
  entryPrice: number;
  stopLossPoints: number;
  stopLossPremium: number;
  takeProfitPoints: number;
  takeProfitPremium: number;
  pointOfAdjustment: number;
  pointOfAdjustmentLowerLimit: number;
  pointOfAdjustmentUpperLimit: number;
}

const AddPositionModal: React.FC<AddPositionModalProps> = ({
  isOpen,
  onClose,
  instanceId,
}) => {
  const [formData, setFormData] = useState<PositionFormData>({
    legCount: 1,
    qty: 1,
    entrySide: "SELL",
    entryType: "LIMIT",
    entryPrice: 0,
    stopLossPoints: 0,
    stopLossPremium: 0,
    takeProfitPoints: 0,
    takeProfitPremium: 0,
    pointOfAdjustment: 0,
    pointOfAdjustmentLowerLimit: 0,
    pointOfAdjustmentUpperLimit: 0,
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const { setInstances } = useStore();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = cookies.get("auth");

    try {
      await axios.post(
        `${API_URL}/user/instances/${instanceId}/positions`,
        formData,
        {
          headers: { Authorization: `Bearer ${auth}` },
        }
      );

      // Refresh instances data
      const response = await axios.get(`${API_URL}/user/instances`, {
        headers: { Authorization: `Bearer ${auth}` },
      });
      setInstances(response.data.data);

      onClose();
      setFormData({
        legCount: 1,
        qty: 1,
        entrySide: "SELL",
        entryType: "LIMIT",
        entryPrice: 0,
        stopLossPoints: 0,
        stopLossPremium: 0,
        takeProfitPoints: 0,
        takeProfitPremium: 0,
        pointOfAdjustment: 0,
        pointOfAdjustmentLowerLimit: 0,
        pointOfAdjustmentUpperLimit: 0,
      });

      toast.success("Position added successfully!");
    } catch {
      toast.error("Failed to add position");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div
        ref={modalRef}
        className={`bg-gray-800 border border-gray-400 rounded-lg p-4 w-full max-w-md cursor-move select-none ${
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
            <h3 className="text-lg font-semibold text-white">Add Position</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Leg Count
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.legCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    legCount: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.qty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    qty: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Entry Side
              </label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.entrySide}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    entrySide: e.target.value as "BUY" | "SELL",
                  })
                }
              >
                <option value="SELL">SELL</option>
                <option value="BUY">BUY</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Entry Type
              </label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.entryType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    entryType: e.target.value as "MARKET" | "LIMIT",
                  })
                }
              >
                <option value="LIMIT">LIMIT</option>
                <option value="MARKET">MARKET</option>
              </select>
            </div>
          </div>

          {formData.entryType === "LIMIT" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Entry Price
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.entryPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    entryPrice: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Stop Loss Points
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.stopLossPoints}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stopLossPoints: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Take Profit Points
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.takeProfitPoints}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    takeProfitPoints: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Point of Adjustment
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.pointOfAdjustment}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pointOfAdjustment: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Position
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPositionModal;
