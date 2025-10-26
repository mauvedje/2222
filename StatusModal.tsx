import React, { useEffect, useRef, useState } from "react";
import {
  X,
  GripHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import cookies from "js-cookie";
import { API_URL, SOCKET_MAIN, SOCKET_FE } from "../../config/config";
import checkServiceStatusFast from "../../utils/checkCoreService";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SystemStatus {
  backend: boolean;
  pointOfAdjustment: boolean;
  sl: boolean;
  tp: boolean;
  placeOrder: boolean;
  portfolioTrailing: boolean;
  interactiveApi: boolean;
  marketDataApis: boolean;
}

const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [status, setStatus] = useState<SystemStatus>({
    backend: false,
    pointOfAdjustment: false,
    sl: false,
    tp: false,
    placeOrder: false,
    portfolioTrailing: false,
    interactiveApi: false,
    marketDataApis: false,
  });

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

  useEffect(() => {
    if (isOpen) {
      checkSystemStatus();
    }
  }, [isOpen]);

  const checkSystemStatus = async () => {
    setIsLoading(true);
    const auth = cookies.get("auth");

    try {
      // Check backend status
      const backendStatus = await axios
        .get(`${API_URL}/health`, {
          headers: { Authorization: `Bearer ${auth}` },
          timeout: 5000,
        })
        .then(() => true)
        .catch(() => false);

      // Check socket servers
      const mainSocketStatus = await fetch(`${SOCKET_MAIN}/api-status`)
        .then((res) => res.json())
        .then(() => true)
        .catch(() => false);

      const feSocketStatus = await fetch(`${SOCKET_FE}/api-status`)
        .then((res) => res.json())
        .then(() => true)
        .catch(() => false);

      // Check API keys status
      const interactiveKeyStatus = await axios
        .get(`${API_URL}/user/funds`, {
          headers: { Authorization: `Bearer ${auth}` },
        })
        .then(() => {
          return {
            interactive: true,
          };
        })
        .catch(() => ({ interactive: false }));

      const checkServices = await axios
        .get(`${API_URL}/user/servicesEvents`, {
          headers: { Authorization: `Bearer ${auth}` },
        })
        .then((res) => {
          console.log(res.data);
          return checkServiceStatusFast(res.data);
        })
        .catch(() => ({
          sl: false,
          tp: false,
          placeOrder: false,
          portfolioTrailing: false,
        }));

      setStatus({
        backend: backendStatus,
        pointOfAdjustment: false,
        sl: checkServices.sl,
        tp: checkServices.tp,
        placeOrder: checkServices.placeOrder,
        portfolioTrailing: checkServices.portfolioTrailing,
        interactiveApi: interactiveKeyStatus.interactive,
        marketDataApis: feSocketStatus && mainSocketStatus,
      });
    } catch (error) {
      console.error("Error checking system status:", error);
      // Set all to false on error
      setStatus({
        backend: false,
        pointOfAdjustment: false,
        sl: false,
        tp: false,
        placeOrder: false,
        portfolioTrailing: false,
        interactiveApi: false,
        marketDataApis: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (isWorking: boolean) => {
    if (isWorking) {
      return <CheckCircle className="text-green-400" size={20} />;
    }
    return <XCircle className="text-red-400" size={20} />;
  };

  const getOverallStatus = () => {
    const statusValues = Object.values(status);
    const workingCount = statusValues.filter(Boolean).length;
    const totalCount = statusValues.length;

    if (workingCount === totalCount) return "all-good";
    if (workingCount === 0) return "all-down";
    return "partial";
  };

  const statusItems = [
    { key: "backend", label: "Backend", value: status.backend },
    {
      key: "pointOfAdjustment",
      label: "Point of Adjustment",
      value: status.pointOfAdjustment,
    },
    { key: "sl", label: "Stop Loss", value: status.sl },
    { key: "tp", label: "Take Profit", value: status.tp },
    { key: "placeOrder", label: "Place Order", value: status.placeOrder },
    {
      key: "portfolioTrailing",
      label: "Portfolio Trailing",
      value: status.portfolioTrailing,
    },
    {
      key: "interactiveApi",
      label: "Interactive API",
      value: status.interactiveApi,
    },
    {
      key: "marketDataApis",
      label: "Market Data APIs",
      value: status.marketDataApis,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="fixed inset-0 bg-opacity-100" onClick={onClose} />
      <div
        ref={modalRef}
        className={`bg-gray-800 border border-gray-400 rounded-lg p-4 sm:p-6 w-full max-w-md cursor-move select-none max-h-[90vh] overflow-y-auto relative z-10 ${
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
            <h3 className="text-lg font-semibold text-white">System Status</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-300">Checking system status...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Overall Status Summary */}
            <div className="bg-gray-700 p-3 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Overall Status</span>
                <div className="flex items-center space-x-2">
                  {getOverallStatus() === "all-good" && (
                    <>
                      <CheckCircle className="text-green-400" size={20} />
                      <span className="text-green-400 text-sm">
                        All Systems Operational
                      </span>
                    </>
                  )}
                  {getOverallStatus() === "all-down" && (
                    <>
                      <XCircle className="text-red-400" size={20} />
                      <span className="text-red-400 text-sm">
                        All Systems Down
                      </span>
                    </>
                  )}
                  {getOverallStatus() === "partial" && (
                    <>
                      <AlertCircle className="text-yellow-400" size={20} />
                      <span className="text-yellow-400 text-sm">
                        Partial Outage
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Individual Status Items */}
            {statusItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <span className="text-white font-medium">{item.label}</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(item.value)}
                  <span
                    className={`text-sm ${
                      item.value ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {item.value ? "Working" : "Down"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={checkSystemStatus}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Refreshing..." : "Refresh Status"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
