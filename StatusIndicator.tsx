import React, { useState, useEffect } from "react";
import axios from "axios";
import cookies from "js-cookie";
import { API_URL, SOCKET_MAIN, SOCKET_FE } from "../../config/config";
import checkServiceStatusFast from "../../utils/checkCoreService";

interface StatusIndicatorProps {
  onClick: () => void;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ onClick }) => {
  const [overallStatus, setOverallStatus] = useState<
    "good" | "warning" | "error"
  >("error");
  const [isChecking, setIsChecking] = useState(false);

  const checkQuickStatus = async () => {
    setIsChecking(true);
    const auth = cookies.get("auth");

    try {
      // Quick health checks
      const backendPromise = axios
        .get(`${API_URL}/health`, {
          headers: { Authorization: `Bearer ${auth}` },
          timeout: 3000,
        })
        .then(() => true)
        .catch(() => false);

      const mainSocketPromise = fetch(`${SOCKET_MAIN}/api-status`, {
        signal: AbortSignal.timeout(3000),
      })
        .then((res) => res.json())
        .then(() => true)
        .catch(() => false);

      const feSocketPromise = fetch(`${SOCKET_FE}/api-status`, {
        signal: AbortSignal.timeout(3000),
      })
        .then((res) => res.json())
        .then(() => true)
        .catch(() => false);

      const checkServicesPromise = axios
        .get(`${API_URL}/user/servicesEvents`, {
          headers: { Authorization: `Bearer ${auth}` },
        })
        .then((res) => {
          return checkServiceStatusFast(res.data);
        })
        .catch(() => ({
          sl: false,
          tp: false,
          placeOrder: false,
          portfolioTrailing: false,
        }));

      const [backendStatus, mainSocketStatus, feSocketStatus, checkServices] =
        await Promise.all([
          backendPromise,
          mainSocketPromise,
          feSocketPromise,
          checkServicesPromise,
        ]);

      const workingServices = [
        backendStatus,
        mainSocketStatus,
        feSocketStatus,
        checkServices.sl,
        checkServices.tp,
        checkServices.placeOrder,
        checkServices.portfolioTrailing,
      ].filter(Boolean).length;

      if (workingServices === 6) {
        setOverallStatus("good");
      } else if (workingServices > 0) {
        setOverallStatus("warning");
      } else {
        setOverallStatus("error");
      }
    } catch (error) {
      console.error("Error checking quick status:", error);
      setOverallStatus("error");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkQuickStatus();

    // Check every 30 seconds
    const interval = setInterval(checkQuickStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isChecking) return "bg-blue-400 animate-pulse";

    switch (overallStatus) {
      case "good":
        return "bg-green-400";
      case "warning":
        return "bg-yellow-400";
      case "error":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusTitle = () => {
    if (isChecking) return "Checking system status...";

    switch (overallStatus) {
      case "good":
        return "All systems operational";
      case "warning":
        return "Some services experiencing issues";
      case "error":
        return "System issues detected";
      default:
        return "Unknown status";
    }
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-700 transition-colors group"
      title={getStatusTitle()}
    >
      <div className={`w-3 h-3 rounded-full ${getStatusColor()} shadow-sm`} />
      <span className="text-xs text-gray-400 group-hover:text-white hidden sm:inline">
        Status
      </span>
    </button>
  );
};

export default StatusIndicator;
