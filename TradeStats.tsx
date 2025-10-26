import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { type Trade } from "../../types/trade";
import { formatCurrency, formatNumber } from "../../utils/formatters";

interface TradeStatsProps {
  trades: Trade[];
}

const TradeStats: React.FC<TradeStatsProps> = ({ trades }) => {
  const activeTrades = trades.filter((trade) => trade.isActive);
  const totalMtm = trades.reduce((sum, trade) => sum + trade.mtm, 0);
  const activeMtm = activeTrades.reduce((sum, trade) => sum + trade.mtm, 0);

  const winningTrades = trades.filter((trade) => trade.mtm > 0);
  const winRate =
    trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 mb-6">
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm">Total P&L</p>
            <p
              className={`text-2xl font-semibold mt-1 ${
                totalMtm >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {formatCurrency(totalMtm)}
            </p>
          </div>
          <div
            className={`p-2 rounded-md ${
              totalMtm >= 0 ? "bg-green-500/10" : "bg-red-500/10"
            }`}
          >
            {totalMtm >= 0 ? (
              <ArrowUpRight className="text-green-500" size={20} />
            ) : (
              <ArrowDownRight className="text-red-500" size={20} />
            )}
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs text-gray-400">From {trades.length} trades</p>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm">Active P&L</p>
            <p
              className={`text-2xl font-semibold mt-1 ${
                activeMtm >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {formatCurrency(activeMtm)}
            </p>
          </div>
          <div className="p-2 rounded-md bg-blue-500/10">
            <DollarSign className="text-blue-500" size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs text-gray-400">
            {activeTrades.length} active positions
          </p>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm">Win Rate</p>
            <p className="text-2xl font-semibold mt-1 text-blue-400">
              {formatNumber(winRate)}%
            </p>
          </div>
          <div className="p-2 rounded-md bg-blue-500/10">
            <TrendingUp className="text-blue-500" size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs text-gray-400">
            {winningTrades.length} winning trades
          </p>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm">Average Trade</p>
            <p
              className={`text-2xl font-semibold mt-1 ${
                totalMtm / (trades.length || 1) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {formatCurrency(totalMtm / (trades.length || 1))}
            </p>
          </div>
          <div className="p-2 rounded-md bg-gray-700">
            <TrendingUp className="text-gray-400" size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs text-gray-400">Per completed trade</p>
        </div>
      </div>
    </div>
  );
};

export default TradeStats;
