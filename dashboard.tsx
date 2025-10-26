import { useCallback, useEffect, useState } from "react";
import cookies from "js-cookie";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Header from "../components/core/Header";
import SideNav from "../components/core/SideNav";
import InstanceTable from "../components/TradeTable/InstanceTable";
import { jwtDecode } from "jwt-decode";
import { type Column } from "../components/TradeTable/ColumnManager";
import {
  type InstanceColumn,
  type TradeDetailColumn,
  defaultInstanceColumns,
  defaultTradeDetailColumns,
} from "../types/instanceColumns";
import { loadInstanceColumnsFromStorage } from "../components/TradeTable/InstanceColumnManager";
import { loadTradeDetailColumnsFromStorage } from "../components/TradeTable/TradeDetailColumnManager";
import MarketDataComponent from "../components/wss/marketData";
import GetValues from "../components/wss/getValues";
import ResizablePanel from "../components/core/ResizablePanel";
import ChartContainer from "../components/Chart/ChartContainer";
import PositionTracker from "../components/PositionTracker/PositionTracker";
import DraggableBoxManager from "../components/draggable/DraggableBoxManager";
import DraggableBox from "../components/draggable/DraggableBox";
import {
  defaultDraggableColumns,
  type DraggableBoxColumn,
} from "../types/draggableBox";

import { API_URL } from "../config/config";
import useStore from "../store/store";
import LatestSocket from "../components/wss/latestSocket";

interface MyJwtPayload {
  updatePassword: boolean;
}

const defaultColumns: Column[] = [
  { id: "index", label: "Index", visible: true, width: "120px" },
  { id: "side", label: "Side", visible: true, width: "100px" },
  { id: "ltpSpot", label: "LTP Spot", visible: true, width: "100px" },
  { id: "legCount", label: "Leg Count", visible: true, width: "100px" },
  { id: "expiry", label: "Expiry", visible: true, width: "120px" },
  { id: "ltpRange", label: "LTP Range", visible: true, width: "100px" },
  { id: "lowestValue", label: "Lowest Value", visible: true, width: "120px" },
  { id: "orderType", label: "Order Type", visible: true, width: "120px" },
  { id: "entry", label: "Entry", visible: true, width: "100px" },
  { id: "qty", label: "Quantity", visible: true, width: "100px" },
  { id: "sl", label: "Stop Loss", visible: true, width: "100px" },
  { id: "target", label: "Target", visible: true, width: "100px" },
  {
    id: "entrySpot",
    label: "Entry Spot Price",
    visible: true,
    width: "140px",
  },
  { id: "mtm", label: "MTM", visible: true, width: "120px" },
  {
    id: "pointOfAdjustment",
    label: "Point of Adjustment",
    visible: true,
    width: "160px",
  },
  {
    id: "adjustmentUpperLimit",
    label: "Adjustment Upper Limit",
    visible: true,
    width: "180px",
  },
  {
    id: "adjustmentLowerLimit",
    label: "Adjustment Lower Limit",
    visible: true,
    width: "180px",
  },

  {
    id: "entryTriggered",
    label: "Entry Triggered",
    visible: true,
    width: "140px",
  },
  // {
  //   id: "strategySl",
  //   label: "Strategy SL(in ₹)",
  //   visible: true,
  //   width: "120px",
  // },
  // {
  //   id: "strategyTrailing",
  //   label: "Strategy Trailing(in ₹)",
  //   visible: true,
  //   width: "140px",
  // },
  { id: "exitPercentages", label: "Exit %", visible: true, width: "150px" },
];

function Dashboard() {
  const { instances, setTrades, setInstances, setOptionLotSize } = useStore();
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [instanceColumns, setInstanceColumns] = useState<InstanceColumn[]>(
    () => {
      const saved = loadInstanceColumnsFromStorage();
      return saved || defaultInstanceColumns;
    }
  );
  const [tradeDetailColumns, setTradeDetailColumns] = useState<
    TradeDetailColumn[]
  >(() => {
    const saved = loadTradeDetailColumnsFromStorage();
    return saved || defaultTradeDetailColumns;
  });
  const [draggableColumns, setDraggableColumns] = useState<
    DraggableBoxColumn[]
  >(defaultDraggableColumns);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const navigate = useNavigate();

  const getTradeData = useCallback(() => {
    const auth = cookies.get("auth");

    // Fetch instances data
    const instancesPromise = axios.get(API_URL + "/user/instances", {
      headers: { Authorization: "Bearer " + auth },
    });

    // Keep the original trades fetch for backward compatibility
    const tradesPromise = axios.get(API_URL + "/user/tradeInfo", {
      headers: { Authorization: "Bearer " + auth },
    });

    toast.promise(Promise.all([instancesPromise, tradesPromise]), {
      loading: "Checking session & fetching latest data...",
      success: ([instancesData, tradesData]) => {
        setInstances(instancesData.data.data);
        setTrades(tradesData.data.data);
        return "Data updated successfully!";
      },
      error: () => {
        navigate("/login");
        return "Session expired / Server Down . Please log in again.";
      },
    });
  }, [navigate, setTrades, setInstances]);

  useEffect(() => {
    const auth = cookies.get("auth");

    if (auth) {
      try {
        const decoded = jwtDecode<MyJwtPayload>(auth);
        if (decoded.updatePassword === true) {
          navigate("/onboarding");
          return;
        }
      } catch {
        navigate("/login");
      }
    }

    getTradeData();
  }, [navigate, getTradeData]);

  useEffect(() => {
    // const interval = setInterval(() => {
    //   const auth = cookies.get("auth");

    //   // Update instances
    //   axios
    //     .get(API_URL + "/user/instances", {
    //       headers: { Authorization: "Bearer " + auth },
    //     })
    //     .then((data) => {
    //       setInstances(data.data.data);
    //     })
    //     .catch(() => {
    //       toast.error("Cannot update the Instance Data, Refresh the page");
    //     });

    //   // Keep updating trades for backward compatibility
    //   axios
    //     .get(API_URL + "/user/tradeInfo", {
    //       headers: { Authorization: "Bearer " + auth },
    //     })
    //     .then((data) => {
    //       setTrades(data.data.data);
    //     })
    //     .catch(() => {
    //       // Silent fail for trades as instances is primary now
    //     });
    // }, 2 * 1000);

    const auth = cookies.get("auth");
    axios
      .get(API_URL + "/user/lotSize", {
        headers: { Authorization: "Bearer " + auth },
      })
      .then((data) => {
        setOptionLotSize(data.data.data);
      })
      .catch(() => {
        toast.error("Cannot get Option Lot Size, Refresh the page");
      });

    return () => {
      // clearInterval(interval);
    };
  }, [getTradeData, setTrades, setInstances, setOptionLotSize]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      <Header
        columns={columns}
        onColumnsChange={setColumns}
        instanceColumns={instanceColumns}
        onInstanceColumnsChange={setInstanceColumns}
        tradeDetailColumns={tradeDetailColumns}
        onTradeDetailColumnsChange={setTradeDetailColumns}
        draggableColumns={draggableColumns}
        onDraggableColumnsChange={setDraggableColumns}
        onMenuToggle={() => setIsSideNavOpen(!isSideNavOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden relative">
          {/* Mobile Layout */}
          <div className="lg:hidden h-full flex flex-col">
            <div className="flex-1 min-h-0">
              <InstanceTable
                instances={instances}
                instanceColumns={instanceColumns}
                tradeDetailColumns={tradeDetailColumns}
                onInstanceColumnsChange={setInstanceColumns}
                onTradeDetailColumnsChange={setTradeDetailColumns}
              />
            </div>
            <div className="h-48 sm:h-64 border-t border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 h-full gap-1 p-1">
                <div className="bg-gray-900">
                  <ChartContainer />
                </div>
                <div className="bg-gray-900">
                  <PositionTracker />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block h-full">
            <ResizablePanel
              direction="vertical"
              initialSize={30}
              minSize={5}
              maxSize={95}
            >
              {/* Top section - Trade Table */}
              <div className="h-full bg-gray-900 border-b border-gray-700">
                <InstanceTable
                  instances={instances}
                  instanceColumns={instanceColumns}
                  tradeDetailColumns={tradeDetailColumns}
                  onInstanceColumnsChange={setInstanceColumns}
                  onTradeDetailColumnsChange={setTradeDetailColumns}
                />
              </div>

              {/* Bottom section - Chart and Position Tracker */}
              <ResizablePanel
                direction="horizontal"
                initialSize={65}
                minSize={5}
                maxSize={95}
              >
                {/* Chart section */}
                <div className="h-full p-2">
                  <ChartContainer />
                </div>

                {/* Position Tracker section */}
                <div className="h-full p-2">
                  <PositionTracker />
                </div>
              </ResizablePanel>
            </ResizablePanel>
          </div>

          <DraggableBoxManager />
          <DraggableBox columns={draggableColumns} boxNumber={1} />
          <DraggableBox columns={draggableColumns} boxNumber={2} />
          <DraggableBox columns={draggableColumns} boxNumber={3} />

          <MarketDataComponent />
          <GetValues />
          <LatestSocket />
        </main>

        <SideNav
          isOpen={isSideNavOpen}
          onToggle={() => setIsSideNavOpen(!isSideNavOpen)}
        />
      </div>
    </div>
  );
}

export default Dashboard;
