import React, { useState, useMemo } from "react";
import { type Trade } from "../../types/trade";

import { type Column } from "./ColumnManager";
import TradeCard from "./TradeCard";
import HedgeModal from "../modals/HedgeModal";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "../../config/config";
import cookies from "js-cookie";
import getTradeData from "../../utils/getTradeData";
import useStore from "../../store/store";

interface TradeTableProps {
  trades: Trade[];
  columns: Column[];
}

const TradeTable: React.FC<TradeTableProps> = ({ trades, columns }) => {
  const [isHedgeModalOpen, setIsHedgeModalOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  const { setTrades, filters } = useStore();

  // Filter trades based on current filters
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // Show closed trades filter
      if (!filters.showClosed && !trade.alive) {
        return false;
      }

      // Index filter
      if (filters.indexName && trade.indexName !== filters.indexName) {
        return false;
      }

      // Entry side filter
      if (filters.entrySide && trade.entrySide !== filters.entrySide) {
        return false;
      }

      // Entry type filter
      if (filters.entryType && trade.entryType !== filters.entryType) {
        return false;
      }

      // Entry triggered filter
      if (filters.entryTriggered) {
        const isTriggered = filters.entryTriggered === "true";
        if (trade.entryTriggered !== isTriggered) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const tradeDate = new Date(trade.createdAt);

        const fromDate = filters.dateRange.from
          ? new Date(filters.dateRange.from)
          : null;
        const toDate = filters.dateRange.to
          ? new Date(filters.dateRange.to)
          : null;

        if (fromDate) {
          fromDate.setHours(0, 0, 0, 0); // Start of day
          if (tradeDate < fromDate) {
            return false;
          }
        }

        if (toDate) {
          toDate.setHours(23, 59, 59, 999); // End of day
          if (tradeDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [trades, filters]);

  const handleHedge = (tradeId: string) => {
    setSelectedTradeId(tradeId);
    setIsHedgeModalOpen(true);
  };

  const handleDelete = (tradeId: string) => {
    const auth = cookies.get("auth");
    const deleteReq = axios.delete(API_URL + "/user/tradeInfo?id=" + tradeId, {
      headers: { Authorization: "Bearer " + auth },
    });
    toast.promise(deleteReq, {
      loading: "Deleting ....",
      success: async () => {
        const result = await getTradeData();
        if (result.status === "ok") {
          setTrades(result.tradeInfo);
        }
        return "Deleted successfully!";
      },
      error: "Deletion failed.",
    });
  };

  const handleDeleteOrder = (tradeId: string) => {
    toast.warning("Do you want to delete ?", {
      action: {
        label: "Yes",
        onClick: () => handleDelete(tradeId),
      },
    });
  };

  const cancelOrder = (tradeId: string) => {
    const auth = cookies.get("auth");
    const deleteReq = axios.delete(
      API_URL + "/user/cancelOrder?id=" + tradeId,
      {
        headers: { Authorization: "Bearer " + auth },
      }
    );
    toast.promise(deleteReq, {
      loading: "Cancelling Order ....",
      success: async () => {
        const result = await getTradeData();
        if (result.status === "ok") {
          setTrades(result.tradeInfo);
        }
        return "Cancelled successfully!";
      },
      error: "Cancellation failed.",
    });
  };

  const handleCancelOrder = (tradeId: string) => {
    toast.warning("Do you want to Cancel Order ?", {
      action: {
        label: "Yes",
        onClick: () => cancelOrder(tradeId),
      },
    });
  };

  function canExitPosition(currentQty: number, userExit: number): boolean {
    if (currentQty <= 0 || userExit <= 0 || userExit > 100) {
      return false; // Invalid data
    }

    const lotsToClose = (currentQty * userExit) / 100;

    return lotsToClose >= 1 && Number.isInteger(lotsToClose);
  }

  const handleClosePartialExecution = (id: string, percent: number) => {
    const findObj = filteredTrades.find((each) => each.id === id);
    if (!findObj) {
      toast.error("Something Went Wrong");
      return;
    }
    const canExit = canExitPosition(findObj.currentQty, percent);
    if (canExit === false) {
      toast.error(`Cannot exit ${percent}%. You can only exit whole lots.`);
      return;
    }

    const auth = cookies.get("auth");
    const closeReq = axios.get(API_URL + "/user/userExit", {
      params: { id, exit: percent },
      headers: { Authorization: "Bearer " + auth },
    });

    toast.promise(closeReq, {
      loading: `Closing ${percent}%...`,
      success: async () => {
        return `${percent}% closed successfully!`;
      },
      error: "Partial close failed.",
    });
  };

  const handleClosePartial = (id: string, percent: number) => {
    toast.warning(
      `Are you sure you want to close ${percent}% of this position?`,
      {
        action: {
          label: "Yes, Close",
          onClick: () => handleClosePartialExecution(id, percent),
        },
      }
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filter Summary */}
      {(filters.indexName ||
        filters.entrySide ||
        filters.entryType ||
        filters.entryTriggered ||
        filters.dateRange.from ||
        filters.dateRange.to ||
        filters.showClosed) && (
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-xs text-gray-300">
          <span className="font-medium">Active Filters: </span>
          {filters.showClosed && (
            <span className="bg-blue-500 px-2 py-1 rounded mr-2">
              Show Closed
            </span>
          )}
          {filters.indexName && (
            <span className="bg-blue-500 px-2 py-1 rounded mr-2">
              Index: {filters.indexName}
            </span>
          )}
          {filters.entrySide && (
            <span className="bg-blue-500 px-2 py-1 rounded mr-2">
              Side: {filters.entrySide}
            </span>
          )}
          {filters.entryType && (
            <span className="bg-blue-500 px-2 py-1 rounded mr-2">
              Type: {filters.entryType}
            </span>
          )}
          {filters.entryTriggered && (
            <span className="bg-blue-500 px-2 py-1 rounded mr-2">
              Triggered: {filters.entryTriggered}
            </span>
          )}
          <span className="text-gray-400">
            ({filteredTrades.length} of {trades.length} trades)
          </span>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {/* Desktop Table View */}
        <div className="hidden lg:block h-full">
          <div className="h-full overflow-auto">
            <table className="w-full border-collapse">
              {/* @ts-expect-error cannot  */}
              <TableHeader columns={columns} />
              <tbody>
                {filteredTrades.length > 0 ? (
                  filteredTrades.map((trade) => (
                    // @ts-expect-error cannot
                    <TableRow
                      key={trade.id}
                      trade={trade}
                      columns={columns}
                      onDeleteOrder={() => handleDeleteOrder(trade.id)}
                      onCancelOrder={() => handleCancelOrder(trade.id)}
                      onHedge={() => handleHedge(trade.id)}
                      // @ts-expect-error cannot
                      onClosePartial={(percent) =>
                        handleClosePartial(trade.id, percent)
                      }
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.filter((col) => col.visible).length + 1}
                      className="text-center py-8 text-gray-400"
                    >
                      {trades.length === 0
                        ? "No trades to display"
                        : "No trades match the current filters"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 h-full overflow-auto">
            {filteredTrades.length > 0 ? (
              filteredTrades.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  onDeleteOrder={() => handleDeleteOrder(trade.id)}
                  onCancelOrder={() => handleCancelOrder(trade.id)}
                  onHedge={() => handleHedge(trade.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 col-span-full">
                {trades.length === 0
                  ? "No trades to display"
                  : "No trades match the current filters"}
              </div>
            )}
          </div>
        </div>
      </div>

      <HedgeModal
        isOpen={isHedgeModalOpen}
        onClose={() => setIsHedgeModalOpen(false)}
        tradeId={selectedTradeId || ""}
      />
    </div>
  );
};

export default TradeTable;
