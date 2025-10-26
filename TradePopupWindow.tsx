import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, GripHorizontal, ChevronDown, ChevronRight } from "lucide-react";
import { formatNumber } from "../../utils/formatters";
import useStore from "../../store/store";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "../../config/config";
import cookies from "js-cookie";

interface TradePopupWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const TradePopupWindow: React.FC<TradePopupWindowProps> = ({
  isOpen,
  onClose,
}) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [expandedInstances, setExpandedInstances] = useState<Set<string>>(
    new Set()
  );
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [editingTrade, setEditingTrade] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    entryPrice: number;
    stopLossPremium: number;
    takeProfitPremium: number;
    stopLossPoints: number;
    takeProfitPoints: number;
    qty: number;
  }>({
    entryPrice: 0,
    stopLossPremium: 0,
    takeProfitPremium: 0,
    stopLossPoints: 0,
    takeProfitPoints: 0,
    qty: 0,
  });

  const windowRef = useRef<HTMLDivElement>(null);
  const { instances, setInstances } = useStore();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  }, []);

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

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const toggleExpanded = (instanceId: string) => {
    const newExpanded = new Set(expandedInstances);
    if (newExpanded.has(instanceId)) {
      newExpanded.delete(instanceId);
    } else {
      newExpanded.add(instanceId);
    }
    setExpandedInstances(newExpanded);
  };

  const toggleTradeSelection = (tradeId: string) => {
    const newSelected = new Set(selectedTrades);
    if (newSelected.has(tradeId)) {
      newSelected.delete(tradeId);
    } else {
      newSelected.add(tradeId);
    }
    setSelectedTrades(newSelected);
  };

  const startEditing = (trade: any) => {
    setEditingTrade(trade.id);
    setEditValues({
      entryPrice: trade.entryPrice || 0,
      stopLossPremium: trade.stopLossPremium || 0,
      takeProfitPremium: trade.takeProfitPremium || 0,
      stopLossPoints: trade.stopLossPoints || 0,
      takeProfitPoints: trade.takeProfitPoints || 0,
      qty: trade.qty || 0,
    });
  };

  const cancelEditing = () => {
    setEditingTrade(null);
    setEditValues({
      entryPrice: 0,
      stopLossPremium: 0,
      takeProfitPremium: 0,
      stopLossPoints: 0,
      takeProfitPoints: 0,
      qty: 0,
    });
  };

  const saveChanges = async (tradeId: string) => {
    const auth = cookies.get("auth");

    try {
      await axios.put(
        `${API_URL}/user/tradeInfo?id=${tradeId}`,
        {
          entryPrice: editValues.entryPrice,
          stopLossPremium: editValues.stopLossPremium,
          takeProfitPremium: editValues.takeProfitPremium,
          stopLossPoints: editValues.stopLossPoints,
          takeProfitPoints: editValues.takeProfitPoints,
          qty: editValues.qty,
          currentQty: editValues.qty,
        },
        {
          headers: { Authorization: `Bearer ${auth}` },
        }
      );

      // Refresh instances data
      const response = await axios.get(`${API_URL}/user/instances`, {
        headers: { Authorization: `Bearer ${auth}` },
      });
      setInstances(response.data.data);

      toast.success("Trade updated successfully");
      setEditingTrade(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update trade");
    }
  };

  const handleCloseAllInstance = async (instanceId: string) => {
    const auth = cookies.get("auth");

    toast.warning(
      "Are you sure you want to close all positions in this instance?",
      {
        action: {
          label: "Yes, Close All",
          onClick: async () => {
            try {
              await axios.post(
                `${API_URL}/user/instances/${instanceId}/closeAll`,
                {},
                {
                  headers: { Authorization: `Bearer ${auth}` },
                }
              );

              // Refresh instances data
              const response = await axios.get(`${API_URL}/user/instances`, {
                headers: { Authorization: `Bearer ${auth}` },
              });
              setInstances(response.data.data);

              toast.success("All positions in instance closed successfully");
            } catch (error) {
              console.error(error);
              toast.error("Failed to close all positions");
            }
          },
        },
      }
    );
  };

  const handleCloseTrade = async (tradeId: string) => {
    const auth = cookies.get("auth");

    toast.warning("Are you sure you want to close this trade?", {
      action: {
        label: "Yes, Close",
        onClick: async () => {
          try {
            await axios.post(
              `${API_URL}/user/tradeInfo/${tradeId}/close`,
              {},
              {
                headers: { Authorization: `Bearer ${auth}` },
              }
            );

            // Refresh instances data
            const response = await axios.get(`${API_URL}/user/instances`, {
              headers: { Authorization: `Bearer ${auth}` },
            });
            setInstances(response.data.data);

            toast.success("Trade closed successfully");
          } catch (error) {
            console.error(error);
            toast.error("Failed to close trade");
          }
        },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      className={`fixed z-[10001] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl cursor-move select-none ${
        isDragging ? "opacity-90" : ""
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "500px",
        maxHeight: "70vh",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700 rounded-t-lg cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <GripHorizontal size={14} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Trade Manager</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {instances.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No instances found
          </div>
        ) : (
          <div className="space-y-1">
            {instances.map((instance) => (
              <div
                key={instance.id}
                className="border-b border-gray-800 last:border-b-0"
              >
                {/* Instance Header */}
                <div className="flex items-center justify-between p-2 bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
                  <div className="flex items-center space-x-2 flex-1">
                    <button
                      onClick={() => toggleExpanded(instance.id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {expandedInstances.has(instance.id) ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-white">
                        {instance.indexName} - {instance.expiry} -{" "}
                        {instance.ltpRange}
                      </div>
                      <div className="text-xs text-gray-400">
                        {instance.tradeDetails.length} trades
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCloseAllInstance(instance.id)}
                    className="px-2 py-1 text-xs bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Close All
                  </button>
                </div>

                {/* Expanded Trade Details */}
                {expandedInstances.has(instance.id) &&
                  instance.tradeDetails.length > 0 && (
                    <div className="bg-gray-900/50">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-700">
                            <tr>
                              <th className="px-1 py-1 text-left text-xs font-medium text-gray-300 w-8">
                                Select
                              </th>
                              <th className="px-1 py-1 text-left text-xs font-medium text-gray-300">
                                Entry/Qty
                              </th>
                              <th className="px-1 py-1 text-left text-xs font-medium text-gray-300">
                                TP Premium
                              </th>
                              <th className="px-1 py-1 text-left text-xs font-medium text-gray-300">
                                TP Points
                              </th>
                              <th className="px-1 py-1 text-left text-xs font-medium text-gray-300">
                                SL Premium
                              </th>
                              <th className="px-1 py-1 text-left text-xs font-medium text-gray-300">
                                SL Points
                              </th>
                              <th className="px-1 py-1 text-left text-xs font-medium text-gray-300 w-12">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {instance.tradeDetails.map((trade) => (
                              <tr
                                key={trade.id}
                                className="hover:bg-gray-800/30 transition-colors border-b border-gray-800"
                              >
                                <td className="px-1 py-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedTrades.has(trade.id)}
                                    onChange={() =>
                                      toggleTradeSelection(trade.id)
                                    }
                                    className="w-3 h-3 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-1 py-1">
                                  <div className="text-white">
                                    <p className="text-xs">
                                      Entry: {formatNumber(trade.entryPrice)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      Qty: {trade.qty}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-1 py-1">
                                  {editingTrade === trade.id ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editValues.takeProfitPremium}
                                      onChange={(e) =>
                                        setEditValues({
                                          ...editValues,
                                          takeProfitPremium:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-16 px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                                    />
                                  ) : (
                                    <span className="text-green-400 text-xs">
                                      {formatNumber(trade.takeProfitPremium)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-1 py-1">
                                  {editingTrade === trade.id ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editValues.takeProfitPoints}
                                      onChange={(e) =>
                                        setEditValues({
                                          ...editValues,
                                          takeProfitPoints:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-16 px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                                    />
                                  ) : (
                                    <span className="text-green-400 text-xs">
                                      {formatNumber(trade.takeProfitPoints)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-1 py-1">
                                  {editingTrade === trade.id ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editValues.stopLossPremium}
                                      onChange={(e) =>
                                        setEditValues({
                                          ...editValues,
                                          stopLossPremium:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-16 px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                                    />
                                  ) : (
                                    <span className="text-red-400 text-xs">
                                      {formatNumber(trade.stopLossPremium)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-1 py-1">
                                  {editingTrade === trade.id ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editValues.stopLossPoints}
                                      onChange={(e) =>
                                        setEditValues({
                                          ...editValues,
                                          stopLossPoints:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-16 px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                                    />
                                  ) : (
                                    <span className="text-red-400 text-xs">
                                      {formatNumber(trade.stopLossPoints)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-1 py-1">
                                  <div className="flex space-x-1">
                                    {editingTrade === trade.id ? (
                                      <>
                                        <button
                                          onClick={() => saveChanges(trade.id)}
                                          className="px-1 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={cancelEditing}
                                          className="px-1 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => startEditing(trade)}
                                          className="px-1 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleCloseTrade(trade.id)
                                          }
                                          className="px-1 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                        >
                                          Close
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with selected trades info */}
      {selectedTrades.size > 0 && (
        <div className="p-2 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {selectedTrades.size} trade(s) selected
            </span>
            <button
              onClick={() => setSelectedTrades(new Set())}
              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradePopupWindow;
