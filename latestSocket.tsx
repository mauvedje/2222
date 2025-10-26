import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import cookies from "js-cookie";
import { toast } from "sonner";
import useStore from "../../store/store";
import { SOCKET_INFO } from "../../config/config";
import { type Instance } from "../../types/trade";

interface WsTradeInfo {
  data: Instance[];
}

interface OrderInfo {
  OrderStatus: string;
  CancelRejectReason: string;
}

interface OrderData {
  OrderStatus: string;
  CancelRejectReason: string;
}

const LatestSocket = () => {
  const { setInstances } = useStore();
  const socketRef = useRef<Socket | null>(null);
  const listenersAttached = useRef(false);

  const handleUpdateTradeInfo = (data: WsTradeInfo) => {
    setInstances(data.data);
    // toast.success("Trade information updated successfully");
  };

  const handleOrder = (data: OrderInfo) => {
    // console.log(data);
    if (data.OrderStatus === "PendingNew") {
      toast.info("Order is pending", {
        position: "top-center",
      });
    }

    if (data.OrderStatus === "Rejected") {
      toast.error("Order rejected : " + data.CancelRejectReason, {
        position: "top-center",
      });
    }
  };
  const handleTradeData = (data: OrderData) => {
    console.log(data);
    if (data.OrderStatus === "Filled") {
      toast.success("Order Filled", {
        position: "top-center",
      });
    }
  };
  // @ts-expect-error cannot
  const handlePositionData = (data) => {
    console.log(data);
  };
  // @ts-expect-error cannot
  const handleLogout = (data) => {
    console.log(data);
  };

  useEffect(() => {
    const token = cookies.get("auth");
    if (!token) {
      toast.error("Session not found");
      return;
    }

    const checkHealthAndConnect = async () => {
      try {
        const res = await fetch(`${SOCKET_INFO}/health`);
        if (!res.ok) throw new Error("Health check failed");

        const health = await res.json();

        if (health.brokerWSConnected && health.redisConnected) {
          socketRef.current = io(SOCKET_INFO, {
            auth: {
              token: `Bearer ${token}`,
            },
            transports: ["websocket"],
          });

          socketRef.current.on("connect", () => {
            toast.info("Connected to Socket.IO server");
          });

          socketRef.current.on("disconnect", () => {
            toast.info("Disconnected from Socket.IO server");
          });

          socketRef.current.on("error", (err: Error) => {
            toast.error("Socket error: " + err.message);
          });

          if (!listenersAttached.current) {
            socketRef.current.on("tradeInfo", handleUpdateTradeInfo);

            socketRef.current.on("order", handleOrder);

            socketRef.current.on("tradeData", handleTradeData);

            socketRef.current.on("positionData", handlePositionData);

            socketRef.current.on("logout", handleLogout);

            listenersAttached.current = true;
          }
        } else {
          toast.error("Socket server not ready: Broker or Redis disconnected");
        }
      } catch (err) {
        toast.error("Health check failed: " + err);
      }
    };

    checkHealthAndConnect();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("tradeInfo", handleUpdateTradeInfo);

        socketRef.current.off("order", handleOrder);

        socketRef.current.off("tradeData", handleTradeData);

        socketRef.current.off("positionData", handlePositionData);

        socketRef.current.off("logout", handleLogout);

        socketRef.current.disconnect();
      }
      listenersAttached.current = false;
    };
  }, []);

  return <></>;
};

export default LatestSocket;
