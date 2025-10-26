import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import cookies from "js-cookie";
import { toast } from "sonner";
import useStore, { useDraggableStore } from "../../store/store";
import { SOCKET_FE } from "../../config/config";
import throttle from "lodash/throttle";

interface PriceUpdate {
  name: string;
  segment: number;
  id: number;
  price: number;
}

interface Instrument {
  exchangeSegment: number;
  exchangeInstrumentID: number;
}

interface optionSubscribeArr {
  id: string;
  index: string;
  expiry: string;
  ltpRange: string;
}

interface LowestValueData {
  id: number;
  lowestCombinedPremium: number;
}

const indexName: Record<number, string> = {
  26000: "NIFTY",
  26001: "BANKNIFTY",
  26034: "FINNIFTY",
  26121: "MIDCPNIFTY",
  26065: "SENSEX",
  26118: "BANKEX",
};

const MarketDataComponent = () => {
  // ✅ Use selectors for stable function references
  const setIndexPrice = useStore((state) => state.setIndexPrice);
  const {
    draggableData1,
    draggableData2,
    draggableData3,
    updateLowestValue1,
    updateLowestValue2,
    updateLowestValue3,
  } = useDraggableStore();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const optionSubscribedArrRef = useRef<optionSubscribeArr[]>([]);
  const listenersAttached = useRef(false);

  const throttledSetIndexPrice = useRef(
    throttle((data: PriceUpdate) => {
      // console.log(data);
      setIndexPrice(data);
    }, 1)
  ).current;

  const throttledUpdateLowestValue = useRef(
    throttle((id: string, lowestValue: string) => {
      updateLowestValue1(id, lowestValue);
      updateLowestValue2(id, lowestValue);
      updateLowestValue3(id, lowestValue);
    }, 1)
  ).current;

  const handlePriceUpdate = useCallback(
    (data: PriceUpdate) => {
      const getName = indexName[data.id];
      if (getName) {
        throttledSetIndexPrice({ ...data, name: getName });
      }
    },
    [throttledSetIndexPrice]
  );

  const handleOptionPremium = useCallback(
    (data: { data: LowestValueData[] }) => {
      if (data.data.length === 0) return;
      const result = data.data;

      result.forEach((each) => {
        throttledUpdateLowestValue(
          String(each.id),
          String(each.lowestCombinedPremium)
        );
      });
    },
    [throttledUpdateLowestValue]
  );

  const subscribeToInstruments = useCallback(
    (instruments: Instrument[]) => {
      if (!socketRef.current || !isConnected) {
        toast.error("Socket not connected");
        return;
      }

      socketRef.current.emit("subscribe", {
        instruments: instruments.map((instrument) => ({
          exchangeSegment: instrument.exchangeSegment,
          exchangeInstrumentID: instrument.exchangeInstrumentID,
        })),
      });
    },
    [isConnected]
  );

  const subscribeToOptionInfo = useCallback(
    (data: optionSubscribeArr) => {
      if (!socketRef.current || !isConnected) {
        toast.error("Socket not connected");
        return;
      }

      socketRef.current.emit("subscribe-options-data", {
        data: {
          id: data.id,
          indexName: data.index,
          expiry: data.expiry,
          ltpRange: parseInt(data.ltpRange),
        },
      });
    },
    [isConnected]
  );

  const instrumentsToSubscribe: Instrument[] = [
    { exchangeSegment: 1, exchangeInstrumentID: 26000 },
    { exchangeSegment: 1, exchangeInstrumentID: 26001 },
    { exchangeSegment: 1, exchangeInstrumentID: 26034 },
    { exchangeSegment: 1, exchangeInstrumentID: 26121 }, // midcap
    { exchangeSegment: 11, exchangeInstrumentID: 26065 },
    { exchangeSegment: 11, exchangeInstrumentID: 26118 },
  ];

  useEffect(() => {
    const token = cookies.get("auth");
    if (!token) {
      toast.error("Session not found");
      return;
    }

    const checkHealthAndConnect = async () => {
      try {
        const res = await fetch(`${SOCKET_FE}/health`);
        if (!res.ok) throw new Error("Health check failed");

        const health = await res.json();

        if (health.brokerWSConnected && health.redisConnected) {
          socketRef.current = io(SOCKET_FE, {
            auth: {
              token: `Bearer ${token}`,
            },
            transports: ["websocket"],
          });

          socketRef.current.on("connect", () => {
            setIsConnected(true);
            toast.info("Connected to Socket.IO server");
          });

          socketRef.current.on("disconnect", () => {
            setIsConnected(false);
            toast.info("Disconnected from Socket.IO server");
          });

          socketRef.current.on("error", (err: Error) => {
            toast.error("Socket error: " + err.message);
          });

          if (!listenersAttached.current) {
            socketRef.current.on("feLowest", handleOptionPremium);
            socketRef.current.on("priceUpdate", handlePriceUpdate);
            socketRef.current.on("lastPrice", (data) => console.log(data));
            listenersAttached.current = true;
          }

          socketRef.current.on("subscribed", (subs: string[]) => {
            toast.info("Subscribed to: " + subs.join(", "));
          });
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
        socketRef.current.off("optionPremium", handleOptionPremium);
        socketRef.current.off("priceUpdate", handlePriceUpdate);
        socketRef.current.disconnect();
      }
      listenersAttached.current = false;
    };
  }, [handleOptionPremium, handlePriceUpdate]);

  useEffect(() => {
    if (isConnected) {
      subscribeToInstruments(instrumentsToSubscribe);
    }
  }, [isConnected, subscribeToInstruments]);

  useEffect(() => {
    const allDraggableData = [
      ...draggableData1,
      ...draggableData2,
      ...draggableData3,
    ];

    if (allDraggableData.length > 0 && isConnected) {
      const notSubscribedArr = allDraggableData.filter(
        (data) =>
          !optionSubscribedArrRef.current.some((each) => each.id === data.id)
      );

      if (notSubscribedArr.length > 0) {
        notSubscribedArr.forEach((data) => {
          subscribeToOptionInfo(data);
          optionSubscribedArrRef.current.push(data);
        });
      }
    }
  }, [
    draggableData1,
    draggableData2,
    draggableData3,
    isConnected,
    subscribeToOptionInfo,
  ]);

  return <></>;
};

export default MarketDataComponent;
