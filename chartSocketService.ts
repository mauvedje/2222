import { io, Socket } from "socket.io-client";
import { SOCKET_MAIN } from "./config";
import cookies from "js-cookie";

interface CandleUpdate {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartSubscription {
  instanceId: string;
  indexName: string;
  expiry: string;
  ltpRange: number;
}

class ChartSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, (data: CandleUpdate) => void> = new Map();
  private subscriptions: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      return true;
    }

    const token = cookies.get("auth");
    if (!token) {
      console.error("No auth token found");
      return false;
    }

    try {
      const healthRes = await fetch(`${SOCKET_MAIN}/health`);
      if (!healthRes.ok) {
        throw new Error("Health check failed");
      }

      const health = await healthRes.json();
      if (!health.brokerWSConnected || !health.redisConnected) {
        console.error("Socket server not ready");
        return false;
      }

      this.socket = io(SOCKET_MAIN, {
        auth: { token: `Bearer ${token}` },
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventHandlers();

      return new Promise((resolve) => {
        this.socket!.on("connect", () => {
          console.log("Chart socket connected");
          this.reconnectAttempts = 0;
          this.resubscribeAll();
          resolve(true);
        });

        this.socket!.on("connect_error", (error) => {
          console.error("Chart socket connection error:", error);
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error("Failed to connect chart socket:", error);
      return false;
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("disconnect", () => {
      console.log("Chart socket disconnected");
    });

    this.socket.on("candleUpdate", (data: { instanceId: string; candle: CandleUpdate }) => {
      const listener = this.listeners.get(data.instanceId);
      if (listener) {
        listener(data.candle);
      }
    });

    this.socket.on("lastPrice", (data: any) => {
      if (data.optionsData && Array.isArray(data.optionsData)) {
        data.optionsData.forEach((option: any) => {
          const listener = this.listeners.get(option.id);
          if (listener && option.lowestCombinedPremium) {
            listener({
              time: Math.floor(Date.now() / 1000),
              open: option.lowestCombinedPremium,
              high: option.lowestCombinedPremium,
              low: option.lowestCombinedPremium,
              close: option.lowestCombinedPremium,
            });
          }
        });
      }
    });

    this.socket.on("error", (error: Error) => {
      console.error("Chart socket error:", error);
    });
  }

  subscribe(subscription: ChartSubscription, callback: (data: CandleUpdate) => void) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, attempting to connect...");
      this.connect().then((success) => {
        if (success) {
          this.performSubscription(subscription, callback);
        }
      });
      return;
    }

    this.performSubscription(subscription, callback);
  }

  private performSubscription(subscription: ChartSubscription, callback: (data: CandleUpdate) => void) {
    const key = subscription.instanceId;

    if (this.subscriptions.has(key)) {
      this.listeners.set(key, callback);
      return;
    }

    this.listeners.set(key, callback);
    this.subscriptions.add(key);

    this.socket?.emit("subscribeChart", {
      instanceId: subscription.instanceId,
      indexName: subscription.indexName,
      expiry: subscription.expiry,
      ltpRange: subscription.ltpRange,
    });

    console.log(`Subscribed to chart updates for ${key}`);
  }

  unsubscribe(instanceId: string) {
    const key = instanceId;

    if (!this.subscriptions.has(key)) {
      return;
    }

    this.listeners.delete(key);
    this.subscriptions.delete(key);

    this.socket?.emit("unsubscribeChart", { instanceId });

    console.log(`Unsubscribed from chart updates for ${key}`);
  }

  private resubscribeAll() {
    const currentSubscriptions = Array.from(this.subscriptions);
    this.subscriptions.clear();

    currentSubscriptions.forEach((instanceId) => {
      const listener = this.listeners.get(instanceId);
      if (listener) {
        this.socket?.emit("resubscribeChart", { instanceId });
        this.subscriptions.add(instanceId);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.subscriptions.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const chartSocketService = new ChartSocketService();
