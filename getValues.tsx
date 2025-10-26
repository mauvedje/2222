import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import cookies from "js-cookie";
import { toast } from "sonner";
import useStore from "../../store/store";
import { SOCKET_MAIN } from "../../config/config";
import throttle from "lodash/throttle";

const GetValues = () => {
  const setOptionValues = useStore((s) => s.setOptionValues);
  const setOptionPrice = useStore((s) => s.setOptionPrice);

  const socketRef = useRef<Socket | null>(null);
  const listenersAttached = useRef(false);

  const throttledSetOptionValues = useRef(
    throttle((data: any) => {
      setOptionValues(data);
    }, 1)
  ).current;

  const throttledSetOptionPrice = useRef(
    throttle((data: any) => {
      setOptionPrice(data);
    }, 1)
  ).current;

  const handleOptionPremium = useCallback(
    (data: any) => {
      throttledSetOptionValues(data.data || []);
    },
    [throttledSetOptionValues]
  );

  const handleLastPrice = useCallback(
    (data: any) => {
      throttledSetOptionValues(data.optionsData || []);
      // throttledSetOptionPrice(data.optionPrice);
    },
    [throttledSetOptionValues, throttledSetOptionPrice]
  );

  const handleOptionPrice = useCallback(
    (data: any) => {
      throttledSetOptionPrice(data);
    },
    [throttledSetOptionPrice]
  );

  useEffect(() => {
    const token = cookies.get("auth");
    if (!token) {
      toast.error("Session not found");
      return;
    }

    const checkHealthAndConnect = async () => {
      try {
        const res = await fetch(`${SOCKET_MAIN}/health`);
        if (!res.ok) throw new Error("Health check failed");

        const health = await res.json();

        if (health.brokerWSConnected && health.redisConnected) {
          socketRef.current = io(SOCKET_MAIN, {
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
            socketRef.current.on("optionPriceUpdate", handleOptionPrice);
            socketRef.current.on("lastPrice", handleLastPrice);
            socketRef.current.on("feLowest", handleOptionPremium);

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
        socketRef.current.off("feLowest", handleOptionPremium);
        socketRef.current.off("lastPrice", handleLastPrice);
        socketRef.current.disconnect();
      }
      listenersAttached.current = false;
    };
  }, [handleOptionPremium, handleLastPrice, handleOptionPrice]);

  return <></>;
};

export default GetValues;
