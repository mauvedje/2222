import React, { useState } from "react";
import {
  BarChart2,
  Plus,
  Menu,
  Shield,
  Filter,
  TrendingUp,
  Power,
  Target,
  Eye,
  Wallet,
  TrendingDown,
} from "lucide-react";
import { type Column } from "../TradeTable/ColumnManager";
import InstanceColumnManager from "../TradeTable/InstanceColumnManager";
import TradeDetailColumnManager from "../TradeTable/TradeDetailColumnManager";
import AddInstanceModal from "../modals/AddInstanceModal";
import DraggableBoxColumnManager from "../draggable/DraggableBoxColumnManager";
import PortfolioModal from "../modals/PortfolioModal";
import FilterModal from "../modals/FilterModal";
import useStore, { useDraggableStore } from "../../store/store";
import { type DraggableBoxColumn } from "../../types/draggableBox";
import {
  type InstanceColumn,
  type TradeDetailColumn,
} from "../../types/instanceColumns";
import { API_URL } from "../../config/config";
import axios from "axios";
import cookies from "js-cookie";
import { toast } from "sonner";
import StatusIndicator from "./StatusIndicator";
import StatusModal from "../modals/StatusModal";

interface HeaderProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  instanceColumns: InstanceColumn[];
  onInstanceColumnsChange: (columns: InstanceColumn[]) => void;
  tradeDetailColumns: TradeDetailColumn[];
  onTradeDetailColumnsChange: (columns: TradeDetailColumn[]) => void;
  onMenuToggle: () => void;
  draggableColumns: DraggableBoxColumn[];
  onDraggableColumnsChange: (columns: DraggableBoxColumn[]) => void;
}

interface Params {
  isEnabled?: boolean;
  stopLossAmount?: number;
  stopLossTrailing?: number;
  targetAmount?: number;
}

const Header: React.FC<HeaderProps> = ({
  instanceColumns,
  onInstanceColumnsChange,
  tradeDetailColumns,
  onTradeDetailColumnsChange,
  onMenuToggle,
  draggableColumns,
  onDraggableColumnsChange,
}) => {
  const [isAddInstanceModalOpen, setIsAddInstanceModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [portfolioSL, setPortfolioSL] = useState(0);
  const [portfolioTrail, setPortfolioTrail] = useState(0);
  const [portfolioTarget, setPortfolioTarget] = useState(0);
  const [portfolioEnabled, setPortfolioEnabled] = useState(false);
  const [fundsAvailable, setFundsAvailable] = useState(0);
  const [fundsUsed, setFundsUsed] = useState(0);
  const { filters, setFilters } = useStore();
  const { showDraggable1, showDraggable2, showDraggable3 } =
    useDraggableStore();

  React.useEffect(() => {
    const getFunds = () => {
      const auth = cookies.get("auth");
      axios
        .get(`${API_URL}/user/funds`, {
          headers: { Authorization: `Bearer ${auth}` },
        })
        .then((res) => {
          const response = res.data.data;
          setFundsAvailable(response.marginAvailable);
          setFundsUsed(response.marginUtilized);
        })
        .catch((error) => {
          console.log("Error fetching funds:", error);
        });
    };

    getFunds();
    const interval = setInterval(getFunds, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  const updatePortfolioSettings = async (
    enabled?: boolean,
    slValue?: number,
    trailValue?: number,
    targetValue?: number
  ) => {
    const auth = cookies.get("auth");
    const params: Params = {};

    if (enabled !== undefined) {
      params.isEnabled = enabled;
    }
    if (slValue !== undefined) params.stopLossAmount = slValue;
    if (trailValue !== undefined) params.stopLossTrailing = trailValue;
    if (targetValue !== undefined) params.targetAmount = targetValue;

    try {
      await axios.put(`${API_URL}/user/portfolio`, null, {
        params,
        headers: { Authorization: `Bearer ${auth}` },
      });

      if (enabled !== undefined) {
        // toast.success(`Portfolio controls ${enabled ? "enabled" : "disabled"}`);
        toast.error("Failed to update portfolio settings");
      } else {
        // toast.success("Portfolio settings updated");
        toast.error("Failed to update portfolio settings");
      }
    } catch {
      toast.error("Failed to update portfolio settings");
    }
  };

  const handlePortfolioToggle = () => {
    const newEnabled = !portfolioEnabled;
    setPortfolioEnabled(newEnabled);
    updatePortfolioSettings(newEnabled);
  };

  const handleSLChange = (value: number) => {
    setPortfolioSL(value);
    if (portfolioEnabled) {
      updatePortfolioSettings(undefined, value);
    }
  };

  const handleTrailChange = (value: number) => {
    setPortfolioTrail(value);
    if (portfolioEnabled) {
      updatePortfolioSettings(undefined, undefined, value);
    }
  };

  const handleTargetChange = (value: number) => {
    setPortfolioTarget(value);
    if (portfolioEnabled) {
      updatePortfolioSettings(undefined, undefined, undefined, value);
    }
  };

  const toggleClosedTrades = () => {
    setFilters({
      ...filters,
      showClosed: !filters.showClosed,
    });
  };

  return (
    <>
      <header className="bg-gray-900  text-white py-2 px-2 sm:py-3 sm:px-4 flex items-center justify-between border-b border-gray-800 min-h-[60px]">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <StatusIndicator onClick={() => setIsStatusModalOpen(true)} />
          <BarChart2 className="text-blue-500 flex-shrink-0" size={20} />
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold truncate">
            TradeDeck
          </h1>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-2 py-1 bg-gray-800 rounded-md">
                <div className="flex items-center space-x-1">
                  <Wallet className="text-green-400" size={14} />
                  <span className="text-xs text-gray-300">Available:</span>
                  <span className="text-xs text-green-400 font-medium">
                    ₹
                    {Number(fundsAvailable).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingDown className="text-red-400" size={14} />
                  <span className="text-xs text-gray-300">Used:</span>
                  <span className="text-xs text-red-400 font-medium">
                    ₹
                    {Number(fundsUsed).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
                  totalMtm >= 0 ? "bg-green-600/20" : "bg-red-600/20"
                }`}
              >
                <span className="text-xs text-gray-300">MTM:</span>
                <span
                  className={`text-xs pl-2 font-medium ${
                    totalMtm >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(totalMtm || 0)}
                </span>
              </div> */}

              <button
                onClick={handlePortfolioToggle}
                className={`p-1 rounded ${
                  portfolioEnabled
                    ? "text-green-400 hover:text-green-300"
                    : "text-gray-400 hover:text-gray-300"
                }`}
                title={`${
                  portfolioEnabled ? "Disable" : "Enable"
                } Portfolio Controls`}
              >
                <Power size={16} />
              </button>

              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
                  portfolioEnabled ? "bg-red-600/20" : "bg-gray-600/20"
                }`}
              >
                <Shield size={14} className="text-red-400" />
                <span className="text-xs text-red-400">SL:</span>
                <input
                  type="number"
                  value={portfolioSL}
                  onChange={(e) => handleSLChange(Number(e.target.value))}
                  disabled={!portfolioEnabled}
                  className={`w-16 px-1 py-0.5 text-xs border border-gray-600 rounded ${
                    portfolioEnabled
                      ? "bg-gray-700 text-white"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                  placeholder="0"
                />
              </div>

              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
                  portfolioEnabled ? "bg-blue-600/20" : "bg-gray-600/20"
                }`}
              >
                <TrendingUp size={14} className="text-blue-400" />
                <span className="text-xs text-blue-400">Trail:</span>
                <input
                  type="number"
                  value={portfolioTrail}
                  onChange={(e) => handleTrailChange(Number(e.target.value))}
                  disabled={!portfolioEnabled}
                  className={`w-16 px-1 py-0.5 text-xs border border-gray-600 rounded ${
                    portfolioEnabled
                      ? "bg-gray-700 text-white"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                  placeholder="0"
                />
              </div>

              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
                  portfolioEnabled ? "bg-green-600/20" : "bg-gray-600/20"
                }`}
              >
                <Target size={14} className="text-green-400" />
                <span className="text-xs text-green-400">Trgt:</span>
                <input
                  type="number"
                  value={portfolioTarget}
                  onChange={(e) => handleTargetChange(Number(e.target.value))}
                  disabled={!portfolioEnabled}
                  className={`w-16 px-1 py-0.5 text-xs border border-gray-600 rounded ${
                    portfolioEnabled
                      ? "bg-gray-700 text-white"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                  placeholder="0"
                />
              </div>
            </div>

            <InstanceColumnManager
              columns={instanceColumns}
              onColumnsChange={onInstanceColumnsChange}
            />

            <TradeDetailColumnManager
              columns={tradeDetailColumns}
              onColumnsChange={onTradeDetailColumnsChange}
            />
            {(showDraggable1 || showDraggable2 || showDraggable3) && (
              <DraggableBoxColumnManager
                columns={draggableColumns}
                onColumnsChange={onDraggableColumnsChange}
              />
            )}

            {/* <ColumnManager
              columns={columns}
              onColumnsChange={onColumnsChange}
            /> */}

            {/* <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Filter size={16} />
            </button> */}

            <button
              onClick={toggleClosedTrades}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                filters.showClosed
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-600 text-white hover:bg-gray-700"
              }`}
              title={
                filters.showClosed ? "Hide Closed Trades" : "Show Closed Trades"
              }
            >
              <Eye size={16} />
            </button>

            <button
              onClick={() => setIsAddInstanceModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Mobile/Tablet Controls */}
          <div className="flex lg:hidden items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center space-x-1 px-2 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
            >
              <Filter size={14} />
              <span className="hidden sm:inline">Filter</span>
            </button>

            <button
              onClick={toggleClosedTrades}
              className={`flex items-center space-x-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
                filters.showClosed
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-600 text-white hover:bg-gray-700"
              }`}
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Closed</span>
            </button>

            <button
              onClick={() => setIsAddInstanceModalOpen(true)}
              className="flex items-center space-x-1 px-2 py-1.5 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <AddInstanceModal
        isOpen={isAddInstanceModalOpen}
        onClose={() => setIsAddInstanceModalOpen(false)}
      />

      <PortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />
      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />
    </>
  );
};

export default Header;
