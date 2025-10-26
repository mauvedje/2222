import React, { useEffect, useState, useRef } from "react";
import { X, GripHorizontal } from "lucide-react";
import { type TradeFormData } from "../../types/trade";
import cookies from "js-cookie";
import { API_URL } from "../../config/config";
import axios from "axios";
import { toast } from "sonner";
import getTradeData from "../../utils/getTradeData";
import useStore from "../../store/store";

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTradeModal: React.FC<AddTradeModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<TradeFormData>({
    index: "",
    legCount: 1,
    expiry: "",
    ltpRange: 0,
    pointOfAdjustment: 0,
    entrySide: "SELL",
    narration: "",
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const { setTrades, setIndexData, indexData } = useStore();

  useEffect(() => {
    const auth = cookies.get("auth");
    if (auth) {
      axios
        .get(API_URL + "/user/optionData", {
          headers: { Authorization: "Bearer " + auth },
        })
        .then((data) => {
          setIndexData(data.data.data);
        })
        .catch((err) => {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to fetch option data";
          toast.error(errorMessage);
        });
    }
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const auth = cookies.get("auth");

    if (!formData.index.trim()) {
      return toast.warning("Select Index");
    }
    if (!formData.expiry.trim()) {
      return toast.warning("Select Expiry");
    }
    if (formData.legCount <= 0) {
      return toast.warning("Enter valid straddle count");
    }
    if (formData.ltpRange <= 0) {
      return toast.warning("Enter valid LTP Range");
    }
    if (formData.pointOfAdjustment < 0) {
      return toast.warning("Enter valid Point of Adjustment");
    }
    if (formData.entrySide !== "BUY" && formData.entrySide !== "SELL") {
      return toast.warning("Select side");
    }

    const addTradeRequest = axios.post(
      API_URL + "/user/tradeInfo",
      {
        indexName: formData.index,
        expiry: formData.expiry,
        legCount: formData.legCount,
        ltpRange: formData.ltpRange,
        pointOfAdjustment: formData.pointOfAdjustment,
        entrySide: formData.entrySide,
        narration: formData.narration,
      },
      { headers: { Authorization: "Bearer " + auth } }
    );
    toast.promise(addTradeRequest, {
      loading: "Adding Trade Info ...",
      success: async () => {
        onClose();
        setFormData({
          index: "",
          legCount: 1,
          expiry: "",
          ltpRange: 0,
          pointOfAdjustment: 0,
          entrySide: "BUY",
          narration: "",
        });
        const result = await getTradeData();
        if (result.status === "ok") {
          setTrades(result.tradeInfo);
        }
        return "Trade Info Has been Successfully Added ...";
      },
      error: (res) => {
        onClose();
        const errorMessage =
          res.response?.data?.message || res.message || "Failed to add trade";
        return errorMessage;
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className={`bg-gray-800 border border-gray-400 rounded-lg p-4 sm:p-6 w-full max-w-md cursor-move select-none ${
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
            <h3 className="text-lg font-semibold text-white">Add New Trade</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Index
            </label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.index}
              onChange={(e) =>
                setFormData({ ...formData, index: e.target.value })
              }
            >
              <option value="" disabled hidden>
                Select Index
              </option>
              {indexData.indices.length > 0
                ? indexData.indices.map((each) => (
                    <option key={each} value={each.toUpperCase()}>
                      {each.toUpperCase()}
                    </option>
                  ))
                : null}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Side
              </label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.entrySide}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    entrySide: e.target.value,
                  })
                }
              >
                <option value="SELL">SELL</option>
                <option value="BUY">BUY</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Straddle Count
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.legCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    legCount: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Expiry
            </label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.expiry}
              onChange={(e) =>
                setFormData({ ...formData, expiry: e.target.value })
              }
            >
              <option value="" disabled hidden>
                Select Expiry
              </option>
              {indexData.expiry[formData.index.toLowerCase()]?.length > 0 &&
                indexData.expiry[formData.index.toLowerCase()].map((each) => (
                  <option key={each} value={each.toUpperCase()}>
                    {each.toUpperCase()}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              LTP Range
            </label>
            <input
              type="number"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.ltpRange}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ltpRange: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Point of Adjustment
            </label>
            <input
              type="number"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.pointOfAdjustment}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pointOfAdjustment: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Narration
            </label>
            <input
              type="text"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.narration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  narration: e.target.value,
                })
              }
              placeholder="Enter narration"
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
              Add Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTradeModal;
