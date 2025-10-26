import React, { useEffect, useRef, useState } from "react";
import { X, GripHorizontal, Shield } from "lucide-react";

import useStore from "../../store/store";

interface HedgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
}

interface HedgeRow {
  id: string;
  hedgeBuy: "CE" | "PE";
  side: string;
  expiry: string;
  strike: number;
  premium: number;
  multiplier: number;
}

const HedgeModal: React.FC<HedgeModalProps> = ({
  isOpen,
  onClose,
  tradeId,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const [indexName, setIndexName] = useState("");

  const { trades, indexData } = useStore();

  // console.log(tradeId);

  useEffect(() => {
    const currentTrade = trades.filter((each) => each.id === tradeId);
    if (currentTrade.length > 0) {
      setIndexName(currentTrade[0].indexName);
    }
  }, [trades, tradeId]);

  const [hedgeRows, setHedgeRows] = useState<HedgeRow[]>([
    {
      id: "1",
      hedgeBuy: "CE",
      side: "BUY",
      expiry: "",
      strike: 0,
      premium: 0,
      multiplier: 1,
    },
    {
      id: "2",
      hedgeBuy: "PE",
      side: "BUY",
      expiry: "",
      strike: 0,
      premium: 0,
      multiplier: 1,
    },
  ]);

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

  const updateRow = (id: string, field: keyof HedgeRow, value: any) => {
    setHedgeRows(
      hedgeRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Hedge settings:", hedgeRows);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="fixed inset-0 " onClick={onClose} />
      <div
        ref={modalRef}
        className={`bg-gray-800 border border-gray-400 rounded-lg p-4 sm:p-6 w-full max-w-6xl cursor-move select-none max-h-[90vh] overflow-hidden relative z-10 ${
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
            <h3 className="text-lg font-semibold text-white">
              Hedge Management
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Shield className="text-orange-400" size={20} />
              <span className="text-white font-medium">Hedge Positions</span>
            </div>
          </div>

          {/* Table Container with Horizontal Scroll */}
          <div className="overflow-x-auto border border-gray-600 rounded-lg max-h-96 overflow-y-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-300">
                    Hedge Buy
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-300">
                    Side
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-300">
                    Expiry
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-300">
                    Strike
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-300">
                    Premium Value
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-300">
                    Multiplier
                  </th>
                </tr>
              </thead>
              <tbody>
                {hedgeRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-600 hover:bg-gray-750"
                  >
                    <td className="px-2 sm:px-4 py-2">
                      <p>{row.hedgeBuy}</p>
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      <select
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={row.side}
                        onChange={(e) =>
                          updateRow(row.id, "side", e.target.value)
                        }
                      >
                        <option value="BUY">Buy</option>
                        <option value="SELL">Sell</option>
                      </select>
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      <select
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={row.expiry}
                        onChange={(e) =>
                          updateRow(row.id, "expiry", e.target.value)
                        }
                      >
                        <option value="" disabled hidden>
                          Select Expiry
                        </option>
                        {indexData.expiry[indexName.toLowerCase()]?.length >
                          0 &&
                          indexData.expiry[indexName.toLowerCase()].map(
                            (each) => (
                              <option key={each} value={each.toUpperCase()}>
                                {each.toUpperCase()}
                              </option>
                            )
                          )}
                      </select>
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      <input
                        type="text"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={row.strike}
                        onChange={(e) =>
                          updateRow(row.id, "strike", e.target.value)
                        }
                        placeholder="Strike"
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={row.premium}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "premium",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="Premium"
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      <input
                        type="number"
                        step="0.1"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={row.multiplier}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "multiplier",
                            parseFloat(e.target.value) || 1
                          )
                        }
                        placeholder="Multiplier"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              Apply Hedge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HedgeModal;
