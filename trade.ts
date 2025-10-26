export interface Instance {
  id: string;
  indexName: string;
  expiry: string;
  ltpRange: number;
  lowestValue?: number;
  ltpSpot?: number;
  tradeDetails: TradeDetail[];
}

export interface TradeDetail {
  humanId: string;
  legCount: number;
  id: string;
  qty: number;
  currentQty: number;
  qtyInLots: number;
  entrySide: string;
  entryType: string;
  entryPrice: number;
  entrySpotPrice: number;
  stopLossPoints: number;
  stopLossPremium: number;
  takeProfitPoints: number;
  takeProfitPremium: number;
  pointOfAdjustment: number;
  pointOfAdjustmentLowerLimit: number;
  pointOfAdjustmentUpperLimit: number;
  entryTriggered: boolean;
  slTriggered: boolean;
  tpTriggered: boolean;
  reason: string;
  userExit: number;
  mtm: number;
  updatedAt: string;
  liveTradePositions: liveTradePositions[];
}

export interface Trade {
  id: string;
  indexName: string;
  entrySide: string;
  legCount: number;
  expiry: string;
  ltpRange: number;
  entryType: string;
  entryPrice: number;
  qty: number;
  currentQty: number;
  stopLossPremium: number;
  takeProfitPremium: number;
  stopLossPoints: number;
  takeProfitPoints: number;
  entrySpotPrice: number;
  lastPointOfAdjustment: number;
  pointOfAdjustment: number;
  pointOfAdjustmentLowerLimit: number;
  pointOfAdjustmentUpperLimit: number;
  entryTriggered: boolean;
  slTriggered: boolean;
  tpTriggered: boolean;
  alive: boolean;
  isDeleted: boolean;
  isDummy: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  mtm: number;
  isActive: boolean;
  strategySl?: number;
  strategyTrailing?: number;
  narration?: string;
  liveTradePositions: liveTradePositions[];
}

export interface liveTradePositions {
  id: string;
  optionName: string;
  initialQty: string;
  currentQty: string;
  entryPrice: number;
  closePrice: number;
  exchangeId: string;
  tradeDetailsId: string;
  closed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TradeFormData {
  index: string;
  legCount: number;
  expiry: string;
  ltpRange: number;
  entrySide: string;
  pointOfAdjustment: number;
  narration: string;
}

export interface OrderFormData {
  entry: number;
  qty: number;
  sl: number;
  target: number;
  slPoints: number;
  tpPoints: number;
  orderType: "LIMIT" | "MARKET";
}

export interface EditFormData {
  pointOfAdjustment: number;
  pointOfAdjustmentUpperLimit: number;
  pointOfAdjustmentLowerLimit: number;
  entryPrice: number;
  stopLossPoints: number;
  stopLossPremium: number;
  takeProfitPoints: number;
  takeProfitPremium: number;
  strategySl: number;
  strategyTrailing: number;
}
