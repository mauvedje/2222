import React, { useState } from "react";
import { toast } from "sonner";
import { createOrder, createPosition } from "../../services/orderService";
import useStore from "../../store/store";
import axios from "axios";
import { API_URL } from "../../config/config";

interface OrderPanelProps {
  onPlaceOrder: (orderData: OrderData) => void;
  tradeId?: string;
}

export interface OrderData {
  poa: number;
  legs: number;
  orderType: "market" | "limit";
  limitPrice: string;
  stopLoss: string;
  takeProfit: string;
  stopLossPoint: string;
  takeProfitPoint: string;
}

const OrderPanel: React.FC<OrderPanelProps> = ({ onPlaceOrder, tradeId }) => {
  const { addPosition, setTradeInfo } = useStore();
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderData, setOrderData] = useState<OrderData>({
    poa: 100,
    legs: 2,
    orderType: "market",
    limitPrice: "",
    stopLoss: "",
    takeProfit: "",
    stopLossPoint: "",
    takeProfitPoint: "",
  });

  const handleChange = (field: keyof OrderData, value: string | number) => {
    setOrderData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsPlacing(true);
    try {
      const numericData = {
        poa: orderData.poa,
        legs: orderData.legs,
        order_type: orderData.orderType,
        limit_price: orderData.limitPrice ? parseFloat(orderData.limitPrice) : undefined,
        stop_loss: orderData.stopLoss ? parseFloat(orderData.stopLoss) : undefined,
        take_profit: orderData.takeProfit ? parseFloat(orderData.takeProfit) : undefined,
        stop_loss_point: orderData.stopLossPoint ? parseFloat(orderData.stopLossPoint) : undefined,
        take_profit_point: orderData.takeProfitPoint ? parseFloat(orderData.takeProfitPoint) : undefined,
      };

      const currentTradeId = tradeId || "trade-" + Date.now();

      try {
        await axios.put(`${API_URL}/user/tradeInfo`, {
          trade_id: currentTradeId,
          entry: numericData.limit_price || null,
          stop_loss: numericData.stop_loss || null,
          take_profit: numericData.take_profit || null,
          quantity: orderData.poa,
          poa: numericData.poa,
          legs: numericData.legs,
          order_type: numericData.order_type,
          stop_loss_point: numericData.stop_loss_point,
          take_profit_point: numericData.take_profit_point,
        });

        setTradeInfo(currentTradeId, {
          entry: numericData.limit_price || null,
          stopLoss: numericData.stop_loss || null,
          takeProfit: numericData.take_profit || null,
        });

        toast.success("Order placed successfully");
      } catch (apiError) {
        console.error("API error:", apiError);
        toast.error("Failed to send order to API");
      }

      const order = await createOrder({
        trade_id: currentTradeId,
        ...numericData,
      });

      if (!order) {
        toast.error("Failed to create order");
        return;
      }

      const positions = [];

      if (numericData.limit_price) {
        const entryPosition = await createPosition({
          order_id: order.id!,
          trade_id: currentTradeId,
          position_type: "entry",
          price: numericData.limit_price,
        });
        if (entryPosition) {
          positions.push(entryPosition);
          addPosition(currentTradeId, entryPosition);
        }
      }

      if (numericData.stop_loss) {
        const slPosition = await createPosition({
          order_id: order.id!,
          trade_id: currentTradeId,
          position_type: "stop_loss",
          price: numericData.stop_loss,
        });
        if (slPosition) {
          positions.push(slPosition);
          addPosition(currentTradeId, slPosition);
        }
      }

      if (numericData.take_profit) {
        const tpPosition = await createPosition({
          order_id: order.id!,
          trade_id: currentTradeId,
          position_type: "take_profit",
          price: numericData.take_profit,
        });
        if (tpPosition) {
          positions.push(tpPosition);
          addPosition(currentTradeId, tpPosition);
        }
      }

      onPlaceOrder(orderData);

    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="order-panel">
      <div className="order-panel-header">
        Order Window
      </div>

      <div className="order-panel-content">
        <div className="order-field">
          <label>POA</label>
          <input
            type="number"
            value={orderData.poa}
            onChange={(e) => handleChange("poa", parseInt(e.target.value) || 0)}
            className="order-input"
          />
        </div>

        <div className="order-field">
          <label>Legs</label>
          <input
            type="number"
            value={orderData.legs}
            onChange={(e) => handleChange("legs", parseInt(e.target.value) || 0)}
            className="order-input"
          />
        </div>

        <div className="order-field">
          <label>Order Type</label>
          <select
            value={orderData.orderType}
            onChange={(e) => handleChange("orderType", e.target.value)}
            className="order-input"
          >
            <option value="market">Market</option>
            <option value="limit">Limit</option>
          </select>
        </div>

        <div className="order-field">
          <label>Limit Price</label>
          <input
            type="text"
            value={orderData.limitPrice}
            onChange={(e) => handleChange("limitPrice", e.target.value)}
            className="order-input"
            placeholder="0.00"
          />
        </div>

        <div className="order-field">
          <label>Stop Loss</label>
          <input
            type="text"
            value={orderData.stopLoss}
            onChange={(e) => handleChange("stopLoss", e.target.value)}
            className="order-input"
            placeholder="0.00"
          />
        </div>

        <div className="order-field">
          <label>Take Profit</label>
          <input
            type="text"
            value={orderData.takeProfit}
            onChange={(e) => handleChange("takeProfit", e.target.value)}
            className="order-input"
            placeholder="0.00"
          />
        </div>

        <div className="order-field">
          <label>Stop Loss Point</label>
          <input
            type="text"
            value={orderData.stopLossPoint}
            onChange={(e) => handleChange("stopLossPoint", e.target.value)}
            className="order-input"
            placeholder="0"
          />
        </div>

        <div className="order-field">
          <label>Take Profit Point</label>
          <input
            type="text"
            value={orderData.takeProfitPoint}
            onChange={(e) => handleChange("takeProfitPoint", e.target.value)}
            className="order-input"
            placeholder="0"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="place-button"
          disabled={isPlacing}
        >
          {isPlacing ? "Placing..." : "Place"}
        </button>
      </div>
    </div>
  );
};

export default OrderPanel;
