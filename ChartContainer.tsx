import React, { useState, useEffect } from "react";
import { Plus, X, Grid3X3, Grid2X2, LayoutGrid, Eye } from "lucide-react";
import TradingViewChart from "./TradingViewChart";
import useStore from "../../store/store";
import { API_URL } from "../../config/config";
import axios from "axios";
import cookies from "js-cookie";
import { toast } from "sonner";

import TradePopupWindow from "./TradePopupWindow";

interface ChartTab {
  id: string;
  instanceId: string;
  indexName: string;
  expiry: string;
  range: number;
  timeframe: string;
  chartType: "line" | "candlestick";
}

type LayoutType = "single" | "2x2" | "3x1" | "2x2-grid";

interface ChartData {
  [instanceId: string]: any[];
}

const ChartContainer: React.FC = () => {
  const { instances } = useStore();

  // Chart data state
  const [chartData, setChartData] = useState<ChartData>({});
  const [isLoading, setIsLoading] = useState<{ [instanceId: string]: boolean }>(
    {}
  );

  // Initialize tabs with the first instance if available
  const [tabs, setTabs] = useState<ChartTab[]>(() => {
    if (instances.length > 0) {
      const firstInstance = instances[0];
      return [
        {
          id: "1",
          instanceId: firstInstance.id,
          indexName: firstInstance.indexName,
          expiry: firstInstance.expiry,
          range: firstInstance.ltpRange,
          timeframe: "1m",
          chartType: "candlestick",
        },
      ];
    }
    return [
      {
        id: "1",
        instanceId: "",
        indexName: "select",
        expiry: "",
        range: 0,
        timeframe: "1m",
        chartType: "candlestick",
      },
    ];
  });

  const [activeTab, setActiveTab] = useState("1");
  const [layout, setLayout] = useState<LayoutType>("single");
  const [showTradePopup, setShowTradePopup] = useState(false);

  // Function to fetch candle data for a specific instance

  const fetchCandleData = async (instanceId: string): Promise<any[]> => {
    const instance = instances.find((i) => i.id === instanceId);
    if (!instance) return [];

    // Validate instance parameters before making API call
    if (
      !instance.indexName ||
      instance.indexName.trim() === "" ||
      instance.indexName === "select" ||
      !instance.expiry ||
      instance.expiry.trim() === "" ||
      !instance.ltpRange ||
      instance.ltpRange <= 0
    ) {
      console.warn("Invalid instance parameters, skipping API call:", {
        indexName: instance.indexName,
        expiry: instance.expiry,
        ltpRange: instance.ltpRange,
      });
      return [];
    }

    try {
      setIsLoading((prev) => ({ ...prev, [instanceId]: true }));

      const auth = cookies.get("auth");
      const response = await axios.get(`${API_URL}/user/candle`, {
        params: {
          indexName: instance.indexName,
          expiryDate: instance.expiry,
          range: instance.ltpRange,
        },
        headers: { Authorization: `Bearer ${auth}` },
        timeout: 30000,
      });

      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching chart data:", error);
      toast.error("Failed to fetch chart data");
      return [];
    } finally {
      setIsLoading((prev) => ({ ...prev, [instanceId]: false }));
    }
  };

  // Function to update chart data for a specific instance
  const updateChartData = async (instanceId: string) => {
    if (!instanceId) return;

    const data = await fetchCandleData(instanceId);
    setChartData((prev) => ({
      ...prev,
      [instanceId]: data,
    }));
  };

  // Update tabs when instances change
  useEffect(() => {
    if (instances.length > 0 && tabs.length > 0 && tabs[0].instanceId === "") {
      const firstInstance = instances[0];
      const newTab = {
        id: "1",
        instanceId: firstInstance.id,
        indexName: firstInstance.indexName,
        expiry: firstInstance.expiry,
        range: firstInstance.ltpRange,
        timeframe: "1m",
        chartType: "candlestick" as const,
      };
      setTabs([newTab]);
      // Fetch data for the new instance
      updateChartData(firstInstance.id);
    }
  }, [instances]);

  // Initial data fetch when tabs change
  useEffect(() => {
    const visibleTabs = getVisibleTabs();
    const uniqueInstanceIds = [
      ...new Set(visibleTabs.map((tab) => tab.instanceId).filter((id) => id)),
    ];

    uniqueInstanceIds.forEach((instanceId) => {
      if (!chartData[instanceId]) {
        updateChartData(instanceId);
      }
    });
  }, [tabs, layout]);

  const addNewTab = () => {
    const newTab: ChartTab = {
      id: Date.now().toString(),
      instanceId: instances.length > 0 ? instances[0].id : "",
      indexName: instances.length > 0 ? instances[0].indexName : "select",
      expiry: instances.length > 0 ? instances[0].expiry : "",
      range: instances.length > 0 ? instances[0].ltpRange : 0,
      timeframe: "1m",
      chartType: "candlestick",
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);

    // Fetch data for the new tab if it has a valid instance
    if (newTab.instanceId) {
      updateChartData(newTab.instanceId);
    }
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return;

    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTab === tabId) {
      setActiveTab(newTabs[0].id);
    }
  };

  const updateTab = (tabId: string, updates: Partial<ChartTab>) => {
    setTabs(
      tabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab))
    );
  };

  const handleInstanceChange = (tabId: string, instanceId: string) => {
    const selectedInstance = instances.find(
      (instance) => instance.id === instanceId
    );
    if (selectedInstance) {
      updateTab(tabId, {
        instanceId: selectedInstance.id,
        indexName: selectedInstance.indexName,
        expiry: selectedInstance.expiry,
        range: selectedInstance.ltpRange,
      });

      // Fetch data for the newly selected instance
      updateChartData(selectedInstance.id);
    }
  };

  const getVisibleTabs = () => {
    switch (layout) {
      case "single":
        return tabs.filter((tab) => tab.id === activeTab);
      case "2x2":
        return tabs.slice(0, 2);
      case "3x1":
        return tabs.slice(0, 3);
      case "2x2-grid":
        return tabs.slice(0, 4);
      default:
        return tabs.filter((tab) => tab.id === activeTab);
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case "single":
        return "grid grid-cols-1 gap-1";
      case "2x2":
        return "grid grid-cols-2 gap-1";
      case "3x1":
        return "grid grid-cols-3 gap-1";
      case "2x2-grid":
        return "grid grid-cols-2 grid-rows-2 gap-1";
      default:
        return "grid grid-cols-1 gap-1";
    }
  };

  const formatInstanceOption = (instance: any) => {
    return `${instance.indexName} - ${instance.expiry} - ${instance.ltpRange}`;
  };

  const getTabTitle = (tab: ChartTab) => {
    if (!tab.indexName || tab.indexName === "select") return "Select Instance";
    return `${tab.indexName} - ${tab.expiry} - ${tab.range}`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <div className="flex-1 flex items-center overflow-x-auto">
          {layout === "single" &&
            tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center space-x-2 px-3 py-2 border-r border-gray-700 cursor-pointer min-w-0 ${
                  activeTab === tab.id
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-750"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="text-sm font-medium truncate">
                  {getTabTitle(tab)}
                </span>
                {isLoading[tab.instanceId] && (
                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="text-gray-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
        </div>

        <div className="flex items-center space-x-1 px-2">
          {/* Layout Options */}
          <div className="flex bg-gray-700 rounded">
            <button
              onClick={() => setLayout("single")}
              className={`p-1 rounded-l ${
                layout === "single"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              title="Single Chart"
            >
              <div className="w-4 h-4 border border-current"></div>
            </button>
            <button
              onClick={() => setLayout("2x2")}
              className={`p-1 ${
                layout === "2x2"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              title="2 Charts"
            >
              <Grid2X2 size={16} />
            </button>
            <button
              onClick={() => setLayout("3x1")}
              className={`p-1 ${
                layout === "3x1"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              title="3 Charts"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setLayout("2x2-grid")}
              className={`p-1 rounded-r ${
                layout === "2x2-grid"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              title="4 Charts Grid"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button
            onClick={addNewTab}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="Add new chart"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Chart Controls - Only show for single layout */}
      {layout === "single" && tabs.find((tab) => tab.id === activeTab) && (
        <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <select
              value={tabs.find((tab) => tab.id === activeTab)?.instanceId || ""}
              onChange={(e) => handleInstanceChange(activeTab, e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Instance</option>
              {instances.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {formatInstanceOption(instance)}
                </option>
              ))}
            </select>

            <select
              value={tabs.find((tab) => tab.id === activeTab)?.timeframe || ""}
              onChange={(e) =>
                updateTab(activeTab, { timeframe: e.target.value })
              }
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1m">1m</option>
            </select>

            <div className="flex bg-gray-700 rounded">
              <button
                onClick={() =>
                  updateTab(activeTab, { chartType: "candlestick" })
                }
                className={`px-3 py-1 text-sm rounded-l ${
                  tabs.find((tab) => tab.id === activeTab)?.chartType ===
                  "candlestick"
                    ? "bg-blue-500 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                }`}
              >
                Candles
              </button>
              <button
                onClick={() => updateTab(activeTab, { chartType: "line" })}
                className={`px-3 py-1 text-sm rounded-r ${
                  tabs.find((tab) => tab.id === activeTab)?.chartType === "line"
                    ? "bg-blue-500 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                }`}
              >
                Line
              </button>
            </div>

            <button
              onClick={() => {
                const currentTab = tabs.find((tab) => tab.id === activeTab);
                if (currentTab?.instanceId) {
                  updateChartData(currentTab.instanceId);
                }
              }}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              disabled={
                isLoading[
                  tabs.find((tab) => tab.id === activeTab)?.instanceId || ""
                ]
              }
            >
              {isLoading[
                tabs.find((tab) => tab.id === activeTab)?.instanceId || ""
              ]
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              onClick={() => setShowTradePopup(true)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <Eye size={14} />
              <span>Show</span>
            </button>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 p-1 ${getLayoutClasses()}`}>
          {getVisibleTabs().map((tab) => (
            <div key={tab.id} className="relative">
              {layout !== "single" && (
                <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs text-white flex items-center space-x-2">
                  {isLoading[tab.instanceId] && (
                    <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              )}
              <TradingViewChart
                symbol="test"
                timeframe={tab.timeframe}
                chartType={tab.chartType}
                tradeId={tab.instanceId}
                chartData={chartData[tab.instanceId] || []}
                isLoading={isLoading[tab.instanceId] || false}
                onRefreshData={() => updateChartData(tab.instanceId)}
              />
            </div>
          ))}
        </div>
      </div>

      <TradePopupWindow
        isOpen={showTradePopup}
        onClose={() => setShowTradePopup(false)}
      />
    </div>
  );
};

export default ChartContainer;
