/** eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type Time,
} from "lightweight-charts";
import useStore from "./store";
import { DraggablePriceLinePlugin } from "./DraggablePriceLinePlugin";
import ChartTableOverlay from "./ChartTableOverlay";
import OrderPanel from "./OrderPanel";
import type { OrderData } from "./OrderPanel";
import { getPositionsByTradeId, updatePosition as updatePositionAPI } from "./orderService";
import { chartSocketService } from "./chartSocketService";

interface TradingViewChartProps {
  symbol: string;
  timeframe: string;
  chartType: "line" | "candlestick";
  tradeId: string;
  chartData: CandlestickData[];
  isLoading: boolean;
  onRefreshData: () => void;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  tradeId,
  chartType = "candlestick",
  chartData,
  isLoading,
  onRefreshData,
}) => {
  const { optionValues, positions, setPositions, updatePosition: updatePositionStore, tradeInfo, updateTradeInfoPrice } = useStore();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);


  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const lastCandleDataRef = useRef<CandlestickData | null>(null);
  const [showOrderPanel] = useState(true);
  const draggablePluginsRef = useRef<Map<string, DraggablePriceLinePlugin>>(new Map());
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);

  const transformDataForChartType = (
    rawData: CandlestickData[]
  ): CandlestickData[] | LineData[] => {
    const newData = removeIfNotEndingWith59(rawData);
    if (chartType === "line") {
      return newData.map((candle) => ({
        time: candle.time,
        value: candle.close,
      }));
    }
    return newData;
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    let chart: IChartApi | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          chart = createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: { background: { color: "#1f2937" }, textColor: "#d1d5db" },
            grid: {
              vertLines: { visible: false, color: "#374151" },
              horzLines: { visible: false, color: "#374151" },
            },
            timeScale: { timeVisible: true },
            crosshair: { mode: 0 },
            handleScale: {
              axisPressedMouseMove: { time: true, price: true },
              mouseWheel: true,
              pinch: true,
            },
            handleScroll: {
              mouseWheel: true,
              horzTouchDrag: true,
              vertTouchDrag: true,
            },
          });

          if (!chart) return;
          chartRef.current = chart;
          setChartReady(true);

          // Responsive chart resize
          const resizeChart = () => {
            if (chartRef.current && chartContainerRef.current) {
              const rect = chartContainerRef.current.getBoundingClientRect();
              chartRef.current.applyOptions({
                width: rect.width,
                height: rect.height,
              });
              chartRef.current.timeScale().fitContent();
            }
          };
          resizeObserverRef.current = new ResizeObserver(() =>
            requestAnimationFrame(resizeChart)
          );
          resizeObserverRef.current.observe(container);
          setTimeout(resizeChart, 100);
          observer.unobserve(container);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      resizeObserverRef.current?.disconnect();

      if (chart) {
        try {
          chart.remove();
        } catch (error) {
          console.warn("Chart disposal error:", error);
        }
      }

      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
      setChartReady(false);
    };
  }, [chartContainerRef.current]);

  // Update chart when chartData or type changes
  useEffect(() => {
    if (!chartRef.current || !chartReady || !chartData.length) return;

    const transformedData = transformDataForChartType(chartData);

    // Remove existing series
    if (candleSeriesRef.current) {
      chartRef.current.removeSeries(candleSeriesRef.current);
      candleSeriesRef.current = null;
    }
    if (lineSeriesRef.current) {
      chartRef.current.removeSeries(lineSeriesRef.current);
      lineSeriesRef.current = null;
    }

    // Create series
    if (chartType === "candlestick") {
      const candleSeries = chartRef.current.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#ef4444",
        borderDownColor: "#ef4444",
        borderUpColor: "#10b981",
        wickDownColor: "#ef4444",
        wickUpColor: "#10b981",
      });
      candleSeries.setData(transformedData as CandlestickData[]);
      candleSeriesRef.current = candleSeries;
    } else {
      const lineSeries = chartRef.current.addLineSeries({
        color: "#3b82f6",
        lineWidth: 2,
      });
      lineSeries.setData(transformedData as LineData[]);
      lineSeriesRef.current = lineSeries;
    }


    chartRef.current.timeScale().fitContent();
  }, [chartData, chartType, chartReady]);

  useEffect(() => {
    const loadPositions = async () => {
      const fetchedPositions = await getPositionsByTradeId(tradeId);
      setPositions(tradeId, fetchedPositions);
    };
    loadPositions();
  }, [tradeId, setPositions]);

  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || !chartReady) return;

    const currentTradeInfo = tradeInfo[tradeId];

    draggablePluginsRef.current.forEach((plugin) => plugin.destroy());
    draggablePluginsRef.current.clear();

    if (currentTradeInfo) {
      const tradePositions = positions[tradeId] || [];

      const lineConfigs: Array<{
        type: 'entry' | 'stopLoss' | 'takeProfit';
        price: number | null;
        color: string;
        positionType: string;
      }> = [
        { type: 'entry', price: currentTradeInfo.entry, color: '#0096FF', positionType: 'entry' },
        { type: 'stopLoss', price: currentTradeInfo.stopLoss, color: '#FF0000', positionType: 'stop_loss' },
        { type: 'takeProfit', price: currentTradeInfo.takeProfit, color: '#00FF00', positionType: 'take_profit' },
      ];

      lineConfigs.forEach(({ type, price, color, positionType }) => {
        if (price !== null && price > 0) {
          const matchingPosition = tradePositions.find((p) => p.position_type === positionType);
          const humanLabel = matchingPosition?.position_id || type;

          const plugin = new DraggablePriceLinePlugin(
            chartRef.current!,
            candleSeriesRef.current!,
            {
              price,
              color,
              lineWidth: 2,
              label: humanLabel,
              onPriceChange: (newPrice) => {
                updateTradeInfoPrice(tradeId, type, newPrice);
              },
              onDragEnd: async (newPrice) => {
                if (matchingPosition?.id) {
                  await updatePositionAPI(matchingPosition.id, { price: newPrice });
                  updatePositionStore(tradeId, matchingPosition.id, { price: newPrice });
                }
              },
            }
          );

          draggablePluginsRef.current.set(`${tradeId}-${type}`, plugin);
        }
      });
    }

    return () => {
      draggablePluginsRef.current.forEach((plugin) => plugin.destroy());
      draggablePluginsRef.current.clear();
    };
  }, [tradeInfo, tradeId, chartReady, updateTradeInfoPrice, positions, updatePositionStore]);

  // Live updates
  useEffect(() => {
    if (!chartReady) return;

    const series = candleSeriesRef.current || lineSeriesRef.current;
    if (!series) return;

    const option = optionValues.find((t) => t.id === tradeId);
    if (!option?.lowestCombinedPremium) return;

    const liveValue = option.lowestCombinedPremium;
    const candleTime = getISTAlignedTimeInSeconds();

    if (chartType === "candlestick") {
      if (
        !lastCandleDataRef.current ||
        lastCandleDataRef.current.time !== candleTime
      ) {
        lastCandleDataRef.current = {
          time: candleTime as Time,
          open: liveValue,
          high: liveValue,
          low: liveValue,
          close: liveValue,
        };
      } else {
        lastCandleDataRef.current.high = Math.max(
          lastCandleDataRef.current.high,
          liveValue
        );
        lastCandleDataRef.current.low = Math.min(
          lastCandleDataRef.current.low,
          liveValue
        );
        lastCandleDataRef.current.close = liveValue;
      }
      (series as ISeriesApi<"Candlestick">).update(lastCandleDataRef.current);
    } else {
      (series as ISeriesApi<"Line">).update({
        time: candleTime as Time,
        value: liveValue,
      });
    }
  }, [chartReady, optionValues, tradeId, chartType]);

  useEffect(() => {
    if (!chartReady || !tradeId) return;

    const instances = useStore.getState().instances;
    const instance = instances.find((i) => i.id === tradeId);

    if (!instance) return;

    chartSocketService.connect().then((connected) => {
      setIsRealTimeConnected(connected);

      if (connected) {
        chartSocketService.subscribe(
          {
            instanceId: tradeId,
            indexName: instance.indexName,
            expiry: instance.expiry,
            ltpRange: instance.ltpRange,
          },
          (candleData) => {
            const series = candleSeriesRef.current || lineSeriesRef.current;
            if (!series) return;

            if (chartType === "candlestick" && candleSeriesRef.current) {
              const candleTime = candleData.time as Time;

              if (
                !lastCandleDataRef.current ||
                lastCandleDataRef.current.time !== candleTime
              ) {
                lastCandleDataRef.current = {
                  time: candleTime,
                  open: candleData.open,
                  high: candleData.high,
                  low: candleData.low,
                  close: candleData.close,
                };
              } else {
                lastCandleDataRef.current.high = Math.max(
                  lastCandleDataRef.current.high,
                  candleData.high
                );
                lastCandleDataRef.current.low = Math.min(
                  lastCandleDataRef.current.low,
                  candleData.low
                );
                lastCandleDataRef.current.close = candleData.close;
              }

              candleSeriesRef.current.update(lastCandleDataRef.current);
            } else if (chartType === "line" && lineSeriesRef.current) {
              lineSeriesRef.current.update({
                time: candleData.time as Time,
                value: candleData.close,
              });
            }
          }
        );
      }
    });

    return () => {
      chartSocketService.unsubscribe(tradeId);
      setIsRealTimeConnected(false);
    };
  }, [chartReady, tradeId, chartType]);

  if (isLoading && !chartData.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p>No chart data available</p>
          <button
            onClick={onRefreshData}
            className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = (orderData: OrderData) => {
    console.log("Order placed:", orderData);
  };

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-full relative chart-container-wrapper"
      style={{ cursor: "default" }}
    >
      <ChartTableOverlay tradeId={tradeId} />

      {showOrderPanel && (
        <div className="absolute top-4 left-4 z-20">
          <OrderPanel onPlaceOrder={handlePlaceOrder} tradeId={tradeId} />
        </div>
      )}

      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-gray-700">
        <div className={`w-2 h-2 rounded-full ${isRealTimeConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-xs text-gray-300">
          {isRealTimeConnected ? 'Live' : 'Offline'}
        </span>
      </div>
    </div>
  );
};

function removeIfNotEndingWith59(
  chartData: CandlestickData<Time>[]
): CandlestickData<Time>[] {
  if (chartData.length === 0) return chartData;
  const last = chartData[chartData.length - 1];
  const timestamp = typeof last.time === "number" ? last.time : undefined;
  if (timestamp !== undefined) {
    const lastSeconds = timestamp % 60;
    if (lastSeconds !== 59) chartData.pop();
  }
  return chartData;
}

const getISTAlignedTimeInSeconds = () => {
  const istOffsetMinutes = 5.5 * 60;
  const currentTimeIST = Date.now() + istOffsetMinutes * 60 * 1000 + 50;
  const currentTimeGMTSeconds = Math.floor(currentTimeIST / 1000);
  return currentTimeGMTSeconds - (currentTimeGMTSeconds % 60);
};

export default TradingViewChart;
