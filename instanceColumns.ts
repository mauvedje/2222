export interface InstanceColumn {
  id: string;
  label: string;
  visible: boolean;
  width?: string;
}

export interface TradeDetailColumn {
  id: string;
  label: string;
  visible: boolean;
  width?: string;
}

export const defaultInstanceColumns: InstanceColumn[] = [
  { id: "indexName", label: "Index Name", visible: true, width: "120px" },
  { id: "ltpSpot", label: "LTP Spot", visible: true, width: "100px" },
  { id: "expiry", label: "Expiry", visible: true, width: "100px" },
  { id: "ltpRange", label: "LTP Range", visible: true, width: "100px" },
  { id: "lowestValue", label: "Lowest Value", visible: true, width: "120px" },
];

export const defaultTradeDetailColumns: TradeDetailColumn[] = [
  { id: "humanId", label: "Id", visible: true, width: "100px" },
  { id: "legCount", label: "LegCount", visible: true, width: "100px" },
  { id: "qty", label: "Qty ( In Lots)", visible: true, width: "100px" },
  { id: "currentQty", label: "Current Qty", visible: true, width: "100px" },
  { id: "entrySide", label: "Entry Side", visible: true, width: "100px" },
  { id: "entryType", label: "Entry Type", visible: true, width: "100px" },
  { id: "entryPrice", label: "Entry Price", visible: true, width: "100px" },
  {
    id: "entrySpotPrice",
    label: "Entry Spot Price",
    visible: true,
    width: "130px",
  },
  { id: "stopLossPoints", label: "SL Points", visible: true, width: "90px" },
  { id: "stopLossPremium", label: "SL Premium", visible: true, width: "100px" },
  { id: "takeProfitPoints", label: "TP Points", visible: true, width: "90px" },
  {
    id: "takeProfitPremium",
    label: "TP Premium",
    visible: true,
    width: "100px",
  },
  { id: "pointOfAdjustment", label: "POA", visible: true, width: "80px" },
  {
    id: "pointOfAdjustmentLowerLimit",
    label: "POA Lower",
    visible: true,
    width: "100px",
  },
  {
    id: "pointOfAdjustmentUpperLimit",
    label: "POA Upper",
    visible: true,
    width: "100px",
  },
  {
    id: "entryTriggered",
    label: "Entry Triggered",
    visible: true,
    width: "120px",
  },
  { id: "slTriggered", label: "SL Triggered", visible: true, width: "110px" },
  { id: "tpTriggered", label: "TP Triggered", visible: true, width: "110px" },
  { id: "reason", label: "Reason", visible: true, width: "100px" },
  { id: "userExit", label: "User Exit", visible: true, width: "100px" },
  { id: "mtm", label: "MTM", visible: true, width: "100px" },
  { id: "position", label: "Position", visible: true, width: "100px" },
  { id: "updatedAt", label: "Updated At", visible: true, width: "140px" },
];
