import React, { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { type Instance } from "../../types/trade";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import TradeDetailRow from "./TradeDetailRow";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "../../config/config";
import cookies from "js-cookie";
import useStore from "../../store/store";
import {
  type InstanceColumn,
  type TradeDetailColumn,
} from "../../types/instanceColumns";

interface InstanceTableProps {
  instances: Instance[];
  instanceColumns: InstanceColumn[];
  tradeDetailColumns: TradeDetailColumn[];
  onInstanceColumnsChange: (columns: InstanceColumn[]) => void;
  onTradeDetailColumnsChange: (columns: TradeDetailColumn[]) => void;
}

const InstanceTable: React.FC<InstanceTableProps> = ({
  instances,
  instanceColumns,
  tradeDetailColumns,
}) => {
  const [expandedInstances, setExpandedInstances] = useState<Set<string>>(
    new Set()
  );
  const [addingPositionToInstance, setAddingPositionToInstance] = useState<
    string | null
  >(null);
  const [newPositionData, setNewPositionData] = useState({
    pointOfAdjustment: 0,
    legCount: 1,
  });

  const { indexPrice, optionValues, setInstances } = useStore();

  const toggleExpanded = (instanceId: string) => {
    const newExpanded = new Set(expandedInstances);
    if (newExpanded.has(instanceId)) {
      newExpanded.delete(instanceId);
    } else {
      newExpanded.add(instanceId);
    }
    setExpandedInstances(newExpanded);
  };

  const handleAddPosition = (instanceId: string) => {
    setAddingPositionToInstance(instanceId);
    setNewPositionData({
      pointOfAdjustment: 0,
      legCount: 1,
    });
  };

  const handleCancelAddPosition = () => {
    setAddingPositionToInstance(null);
    setNewPositionData({
      pointOfAdjustment: 0,
      legCount: 1,
    });
  };

  const handleSavePosition = async (instanceId: string) => {
    const auth = cookies.get("auth");

    const postData = { ...newPositionData, instanceId };

    try {
      await axios.post(`${API_URL}/user/tradeInfo`, postData, {
        headers: { Authorization: `Bearer ${auth}` },
      });

      handleCancelAddPosition();
      toast.success("Position added successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to add position");
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    const auth = cookies.get("auth");

    toast.warning("Are you sure you want to delete this instance?", {
      action: {
        label: "Yes, Delete",
        onClick: async () => {
          try {
            await axios.delete(`${API_URL}/user/instances?id=${instanceId}`, {
              headers: { Authorization: `Bearer ${auth}` },
            });
            toast.success("Instance deleted successfully");
            const res = await axios.get(`${API_URL}/user/instances`, {
              headers: { Authorization: `Bearer ${auth}` },
            });
            setInstances(res.data.data);
          } catch (error) {
            console.log(error);
            toast.error("Failed to delete instance");
          }
        },
      },
    });
  };

  // Get current values for instances
  const getInstanceValues = (instance: Instance) => {
    const indexName: Record<string, number> = {
      NIFTY: 26000,
      BANKNIFTY: 26001,
      FINNIFTY: 26034,
      MIDCPNIFTY: 26121,
      SENSEX: 26065,
      BANKEX: 26118,
    };

    const currentIndexPrice = indexPrice.find(
      (each) => each.id === indexName[instance.indexName]
    );

    const currentOptionValue = optionValues.find(
      (each) => each.id === instance.id
    );

    return {
      ltpSpot: currentIndexPrice?.price || 0,
      lowestValue: currentOptionValue?.lowestCombinedPremium || 0,
    };
  };

  const getCellValue = (columnId: string, instance: Instance) => {
    const values = getInstanceValues(instance);

    switch (columnId) {
      case "indexName":
        return instance.indexName;
      case "ltpSpot":
        return formatNumber(values.ltpSpot);
      case "expiry":
        return instance.expiry;
      case "ltpRange":
        return formatNumber(instance.ltpRange);
      case "lowestValue":
        return formatNumber(values.lowestValue);
      default:
        return "-";
    }
  };

  const visibleInstanceColumns = instanceColumns.filter((col) => col.visible);
  const visibleTradeDetailColumns = tradeDetailColumns.filter(
    (col) => col.visible
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        {/* Desktop Table View */}
        <div className="hidden lg:block h-full">
          <div className="h-full overflow-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-300 border-b border-gray-700 w-8"></th>
                  {visibleInstanceColumns.map((column) => (
                    <th
                      key={column.id}
                      className="px-2 py-1 text-left text-xs font-medium text-gray-300 border-b border-gray-700"
                      style={{ width: column.width }}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-300 border-b border-gray-700 w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {instances.length > 0 ? (
                  instances.map((instance) => (
                    <React.Fragment key={instance.id}>
                      {/* Main Instance Row */}
                      <tr className="hover:bg-gray-800/50 transition-colors border-b border-gray-800">
                        <td className="px-2 py-1">
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
                        </td>
                        {visibleInstanceColumns.map((column) => (
                          <td
                            key={column.id}
                            className="px-2 py-1 text-xs text-white"
                          >
                            {getCellValue(column.id, instance)}
                          </td>
                        ))}
                        <td className="px-2 py-1">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleAddPosition(instance.id)}
                              className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              title="Add Position"
                            >
                              <Plus size={10} />
                            </button>
                            <button
                              onClick={() => handleDeleteInstance(instance.id)}
                              className="p-1 bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors"
                              title="Delete Instance"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Add Position Form Row */}
                      {addingPositionToInstance === instance.id && (
                        <tr>
                          <td
                            colSpan={visibleInstanceColumns.length + 2}
                            className="px-0 py-0"
                          >
                            <div className="bg-blue-900/20 border-l-4 border-blue-500 p-2">
                              <div className="grid grid-cols-4 gap-6">
                                <div>
                                  <label className="block text-xs text-gray-300 mb-0">
                                    POA
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={newPositionData.pointOfAdjustment}
                                    onChange={(e) =>
                                      setNewPositionData({
                                        ...newPositionData,
                                        pointOfAdjustment:
                                          parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-300 mb-0">
                                    Legs
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={newPositionData.legCount}
                                    onChange={(e) =>
                                      setNewPositionData({
                                        ...newPositionData,
                                        legCount: parseInt(e.target.value) || 1,
                                      })
                                    }
                                    className="w-full px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <div className="flex justify-end space-x-1 mt-4">
                                    <button
                                      onClick={handleCancelAddPosition}
                                      className="px-2 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleSavePosition(instance.id)
                                      }
                                      className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {/* Expanded Trade Details */}
                      {expandedInstances.has(instance.id) &&
                        instance.tradeDetails && (
                          <tr>
                            <td
                              colSpan={visibleInstanceColumns.length + 2}
                              className="px-0 py-0"
                            >
                              <div className="bg-gray-800/30 border-l-4 border-blue-500">
                                <div className="p-2">
                                  <h4 className="text-xs font-medium text-white mb-2">
                                    Trade Details (
                                    {instance.tradeDetails.length})
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="bg-gray-700">
                                          {visibleTradeDetailColumns.map(
                                            (column) => (
                                              <th
                                                key={column.id}
                                                className="px-2 py-1 text-xs font-medium text-gray-300 text-left"
                                                style={{ width: column.width }}
                                              >
                                                {column.label}
                                              </th>
                                            )
                                          )}
                                          <th className="px-2 py-1 text-xs font-medium text-gray-300 text-left w-24">
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {instance.tradeDetails.map((detail) => (
                                          <TradeDetailRow
                                            key={detail.id}
                                            tradeDetail={detail}
                                            instanceId={instance.id}
                                            visibleColumns={
                                              visibleTradeDetailColumns
                                            }
                                          />
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={visibleInstanceColumns.length + 2}
                      className="text-center py-8 text-gray-400"
                    >
                      No instances to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          <div className="space-y-3 p-3 h-full overflow-auto">
            {instances.length > 0 ? (
              instances.map((instance) => {
                const values = getInstanceValues(instance);
                return (
                  <div
                    key={instance.id}
                    className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
                  >
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-white">
                            {instance.indexName}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {instance.expiry} • Range:{" "}
                            {formatNumber(instance.ltpRange)}
                          </p>
                          <p className="text-xs text-gray-400">
                            LTP: {formatNumber(values.ltpSpot)} • Lowest:{" "}
                            {formatNumber(values.lowestValue)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleAddPosition(instance.id)}
                            className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            title="Add Position"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteInstance(instance.id)}
                            className="p-1.5 bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors"
                            title="Delete Instance"
                          >
                            <Trash2 size={12} />
                          </button>
                          <button
                            onClick={() => toggleExpanded(instance.id)}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                          >
                            {expandedInstances.has(instance.id) ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )}
                          </button>
                        </div>
                      </div>

                      {addingPositionToInstance === instance.id && (
                        <div className="mt-2 pt-2 border-t border-gray-700 bg-blue-900/20 p-2 rounded">
                          <h4 className="text-xs font-medium text-white mb-1">
                            Add Position
                          </h4>
                          <div className="grid grid-cols-2 gap-1 mb-1">
                            <div>
                              <label className="block text-xs text-gray-300 mb-0.5">
                                POA
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={newPositionData.pointOfAdjustment}
                                onChange={(e) =>
                                  setNewPositionData({
                                    ...newPositionData,
                                    pointOfAdjustment:
                                      parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-300 mb-0.5">
                                Legs
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={newPositionData.legCount}
                                onChange={(e) =>
                                  setNewPositionData({
                                    ...newPositionData,
                                    legCount: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-full px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={handleCancelAddPosition}
                              className="px-2 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSavePosition(instance.id)}
                              className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                      {expandedInstances.has(instance.id) &&
                        instance.tradeDetails && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <h4 className="text-xs font-medium text-white mb-2">
                              Trade Details ({instance.tradeDetails.length})
                            </h4>
                            <div className="space-y-2">
                              {instance.tradeDetails.map((detail) => (
                                <div
                                  key={detail.id}
                                  className="bg-gray-700 p-2 rounded-lg"
                                >
                                  <div className="grid grid-cols-2 gap-1 text-xs">
                                    <div>
                                      <span className="text-gray-400">
                                        Qty:
                                      </span>
                                      <span className="text-white ml-1">
                                        {detail.qty}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">
                                        Current:
                                      </span>
                                      <span className="text-white ml-1">
                                        {detail.currentQty}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">
                                        Side:
                                      </span>
                                      <span className="text-white ml-1">
                                        {detail.entrySide}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">
                                        Type:
                                      </span>
                                      <span className="text-white ml-1">
                                        {detail.entryType}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">
                                        Entry:
                                      </span>
                                      <span className="text-white ml-1">
                                        {formatNumber(detail.entryPrice)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">
                                        MTM:
                                      </span>
                                      <span
                                        className={`ml-1 ${
                                          detail.mtm >= 0
                                            ? "text-green-400"
                                            : "text-red-400"
                                        }`}
                                      >
                                        {formatCurrency(detail.mtm)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex justify-end mt-2 space-x-1">
                                    <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                                      Place Order
                                    </button>
                                    <button className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500">
                                      Update
                                    </button>
                                    <button className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                No instances to display
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstanceTable;
