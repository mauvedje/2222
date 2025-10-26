import React, { useState } from "react";
import { ChevronDown, ChevronRight, Play, Edit, Trash2, X, Shield } from "lucide-react";
import { type Trade } from "../../types/trade";
import { formatNumber, formatCurrency } from "../../utils/formatters";

interface TradeCardProps {
  trade: Trade;
  onDeleteOrder: () => void;
  onCancelOrder: () => void;
  onHedge: () => void;
}

const TradeCard: React.FC<TradeCardProps> = ({
  trade,
  onDeleteOrder,
  onCancelOrder,
  onHedge,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-medium text-white truncate">
              {trade.indexName}
            </h3>
            <p className="text-xs text-gray-400">
              {trade.entrySide} • {trade.expiry}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded ${
                trade.entryType === "MARKET" ? "bg-green-500/20 text-green-400" :
                trade.entryType === "LIMIT" ? "bg-blue-500/20 text-blue-400" :
                "bg-gray-500/20 text-gray-400"
              }`}>
                {trade.entryType}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                trade.entryTriggered ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              }`}>
                {trade.entryTriggered ? "Triggered" : "Pending"}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 ml-2">
            {trade.entryType === "UNDEFINED" ? (
              <>
                <button
                  className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  title="Place Order"
                >
                  <Play size={12} />
                </button>
                <button
                  className="p-1.5 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                  title="Edit"
                >
                  <Edit size={12} />
                </button>
                <button
                  onClick={onHedge}
                  className="p-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                  title="Hedge"
                >
                  <Shield size={12} />
                </button>
                <button
                  onClick={onDeleteOrder}
                  className="p-1.5 bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </>
            ) : (
              <>
                {trade.entryTriggered === false && trade.entryType === "LIMIT" && (
                  <button
                    onClick={onCancelOrder}
                    className="p-1.5 bg-red-500/80 rounded hover:bg-red-400 transition-colors"
                    title="Cancel Order"
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  className="p-1.5 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                  title="Edit"
                >
                  <Edit size={12} />
                </button>
                <button
                  onClick={onHedge}
                  className="p-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                  title="Hedge"
                >
                  <Shield size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-400">LTP Spot</p>
            <p className="text-xs sm:text-sm font-medium text-white">{formatNumber(0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Leg Count</p>
            <p className="text-xs sm:text-sm font-medium text-white">{trade.legCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">LTP Range</p>
            <p className="text-xs sm:text-sm font-medium text-white">
              {formatNumber(trade.ltpRange)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">MTM</p>
            <p className={`text-xs sm:text-sm font-medium ${
              trade.mtm >= 0 ? "text-green-400" : "text-red-400"
            }`}>
              {formatCurrency(trade.mtm)}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-xs sm:text-sm text-gray-400 hover:text-white transition-colors w-full"
        >
          <span>View Details</span>
          {isExpanded ? (
            <ChevronDown size={16} className="ml-1" />
          ) : (
            <ChevronRight size={16} className="ml-1" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <p className="text-xs text-gray-400">Lowest Value</p>
              <p className="text-xs sm:text-sm font-medium text-white">
                {formatNumber(0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Entry</p>
              <p className="text-xs sm:text-sm font-medium text-white">
                {trade.entryPrice ? formatNumber(trade.entryPrice) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Quantity</p>
              <p className="text-xs sm:text-sm font-medium text-white">
                {trade.qty || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Stop Loss</p>
              <p className="text-xs sm:text-sm font-medium text-red-400">
                {trade.stopLossPremium
                  ? formatNumber(trade.stopLossPremium)
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Target</p>
              <p className="text-xs sm:text-sm font-medium text-green-400">
                {trade.takeProfitPremium
                  ? formatNumber(trade.takeProfitPremium)
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Strategy SL</p>
              <p className="text-xs sm:text-sm font-medium text-red-400">
                {trade.strategySl ? formatNumber(trade.strategySl) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Strategy Trailing</p>
              <p className="text-xs sm:text-sm font-medium text-green-400">
                {trade.strategyTrailing ? formatNumber(trade.strategyTrailing) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Created</p>
              <p className="text-xs sm:text-sm font-medium text-white">
                {new Date(trade.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-2">Exit Percentages</p>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <button className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors">25%</button>
                <button className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors">50%</button>
                <button className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors">100%</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeCard;