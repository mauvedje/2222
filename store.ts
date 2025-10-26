import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Trade, type Instance } from "../types/trade";
import { type Position } from "../services/orderService";

interface indexData {
  indices: string[];
  expiry: { [index: string]: string[] };
}

interface draggableData {
  id: string;
  index: string;
  ltpRange: string;
  lowestValue?: string;
  myValue1?: string;
  myValue2?: string;
  expiry: string;
}

interface IndexPriceData {
  name: string;
  segment: number;
  id: number;
  price: number;
}

interface optionValuesData {
  id: string;
  lowestCombinedPremium: number;
}

interface optionLotSizeType {
  optionName: string;
  lotSize: number;
}

export interface TradeFilters {
  showClosed: boolean;
  indexName: string;
  entrySide: string;
  entryType: string;
  expiry: string;
  entryTriggered: string;
  dateRange: {
    from: string;
    to: string;
  };
}

interface OptionPrice {
  segment: number;
  id: number;
  optionName: string;
  price: number;
}

export interface TradeInfo {
  tradeId: string;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
}

interface TradeStoreState {
  trades: Trade[];
  instances: Instance[];
  indexData: indexData;
  indexPrice: IndexPriceData[];
  optionPrice: OptionPrice[];
  optionValues: optionValuesData[];
  optionLotSize: optionLotSizeType[];
  filters: TradeFilters;
  positionMtm: { [tradeId: string]: number };
  positions: { [tradeId: string]: Position[] };
  tradeInfo: { [tradeId: string]: TradeInfo };
  setTrades: (data: Trade[]) => void;
  setInstances: (data: Instance[]) => void;
  setIndexData: (data: indexData) => void;
  setIndexPrice: (data: IndexPriceData) => void;
  setOptionPrice: (data: OptionPrice) => void;
  setOptionValues: (data: optionValuesData[]) => void;
  setOptionLotSize: (data: optionLotSizeType[]) => void;
  setFilters: (filters: TradeFilters) => void;
  setPositionMtm: (tradeId: string, mtm: number) => void;
  setPositions: (tradeId: string, positions: Position[]) => void;
  addPosition: (tradeId: string, position: Position) => void;
  updatePosition: (tradeId: string, positionId: string, updates: Partial<Position>) => void;
  removePosition: (tradeId: string, positionId: string) => void;
  setTradeInfo: (tradeId: string, info: Partial<TradeInfo>) => void;
  updateTradeInfoPrice: (tradeId: string, priceType: 'entry' | 'stopLoss' | 'takeProfit', price: number) => void;
}

interface DraggableStoreState {
  draggableData1: draggableData[];
  draggableData2: draggableData[];
  draggableData3: draggableData[];
  showDraggable1: boolean;
  showDraggable2: boolean;
  showDraggable3: boolean;
  setDraggableData1: (data: draggableData[]) => void;
  setDraggableData2: (data: draggableData[]) => void;
  setDraggableData3: (data: draggableData[]) => void;
  removeDraggableData1: (id: string) => void;
  removeDraggableData2: (id: string) => void;
  removeDraggableData3: (id: string) => void;
  setShowDraggable1: () => void;
  setShowDraggable2: () => void;
  setShowDraggable3: () => void;
  updateDraggableData1: (
    id: string,
    updatedData: Partial<draggableData>
  ) => void;
  updateDraggableData2: (
    id: string,
    updatedData: Partial<draggableData>
  ) => void;
  updateDraggableData3: (
    id: string,
    updatedData: Partial<draggableData>
  ) => void;
  updateLowestValue1: (id: string, lowestValue: string) => void;
  updateLowestValue2: (id: string, lowestValue: string) => void;
  updateLowestValue3: (id: string, lowestValue: string) => void;
}

const useStore = create<TradeStoreState>((set, get) => ({
  trades: [],
  instances: [],
  indexData: {
    indices: [],
    expiry: {},
  },
  indexPrice: [],
  optionPrice: [],
  optionValues: [],
  optionLotSize: [],
  filters: {
    showClosed: false,
    indexName: "",
    entrySide: "",
    entryType: "",
    expiry: "",
    entryTriggered: "",
    dateRange: {
      from: "",
      to: "",
    },
  },
  positionMtm: {},
  positions: {},
  tradeInfo: {},
  setTrades: (data: Trade[]) => set({ trades: data }),
  setInstances: (data: Instance[]) => set({ instances: data }),
  setIndexData: (data: indexData) => set({ indexData: data }),
  setIndexPrice: (data) => {
    const state = get();
    const existingIndex = state.indexPrice.findIndex(
      (item) => item.id === data.id
    );

    if (
      existingIndex !== -1 &&
      state.indexPrice[existingIndex].price === data.price
    ) {
      return;
    }

    set((state) => {
      if (existingIndex !== -1) {
        const updated = [...state.indexPrice];
        updated[existingIndex] = {
          ...updated[existingIndex],
          price: data.price,
        };
        return { indexPrice: updated };
      } else {
        return { indexPrice: [...state.indexPrice, data] };
      }
    });
  },

  setOptionPrice: (data) => {
    const state = get();
    const existingIndex = state.optionPrice.findIndex(
      (item) => item.id === data.id
    );

    if (
      existingIndex !== -1 &&
      state.optionPrice[existingIndex].price === data.price
    ) {
      return;
    }

    set((state) => {
      if (existingIndex !== -1) {
        const updatedPrices = [...state.optionPrice];
        updatedPrices[existingIndex] = {
          ...updatedPrices[existingIndex],
          price: data.price,
        };
        return { optionPrice: updatedPrices };
      } else {
        return { optionPrice: [...state.optionPrice, data] };
      }
    });
  },

  setOptionValues: (data: optionValuesData[]) => {
    const state = get();
    const hasChanges =
      data.length !== state.optionValues.length ||
      data.some((newItem) => {
        const existingItem = state.optionValues.find(
          (item) => item.id === newItem.id
        );
        return (
          !existingItem ||
          existingItem.lowestCombinedPremium !== newItem.lowestCombinedPremium
        );
      });

    if (!hasChanges) {
      return;
    }

    set({ optionValues: data });
  },
  setOptionLotSize: (data: optionLotSizeType[]) => {
    set({ optionLotSize: data });
  },

  setFilters: (filters: TradeFilters) => set({ filters }),
  setPositionMtm: (tradeId: string, mtm: number) =>
    set((state) => ({
      positionMtm: { ...state.positionMtm, [tradeId]: mtm },
    })),
  setPositions: (tradeId: string, positions: Position[]) =>
    set((state) => ({
      positions: { ...state.positions, [tradeId]: positions },
    })),
  addPosition: (tradeId: string, position: Position) =>
    set((state) => ({
      positions: {
        ...state.positions,
        [tradeId]: [...(state.positions[tradeId] || []), position],
      },
    })),
  updatePosition: (tradeId: string, positionId: string, updates: Partial<Position>) =>
    set((state) => ({
      positions: {
        ...state.positions,
        [tradeId]: (state.positions[tradeId] || []).map((p) =>
          p.id === positionId ? { ...p, ...updates } : p
        ),
      },
    })),
  removePosition: (tradeId: string, positionId: string) =>
    set((state) => ({
      positions: {
        ...state.positions,
        [tradeId]: (state.positions[tradeId] || []).filter((p) => p.id !== positionId),
      },
    })),
  setTradeInfo: (tradeId: string, info: Partial<TradeInfo>) =>
    set((state) => {
      const existingInfo = state.tradeInfo[tradeId] || {
        tradeId,
        entry: null,
        stopLoss: null,
        takeProfit: null,
      };
      return {
        tradeInfo: {
          ...state.tradeInfo,
          [tradeId]: {
            ...existingInfo,
            ...info,
          },
        },
      };
    }),
  updateTradeInfoPrice: (tradeId: string, priceType: 'entry' | 'stopLoss' | 'takeProfit', price: number) =>
    set((state) => {
      const existingInfo = state.tradeInfo[tradeId] || {
        tradeId,
        entry: null,
        stopLoss: null,
        takeProfit: null,
      };
      return {
        tradeInfo: {
          ...state.tradeInfo,
          [tradeId]: {
            ...existingInfo,
            [priceType]: price,
          },
        },
      };
    }),
}));

export const useDraggableStore = create<DraggableStoreState>()(
  persist(
    (set) => ({
      draggableData1: [],
      draggableData2: [],
      draggableData3: [],
      showDraggable1: false,
      showDraggable2: false,
      showDraggable3: false,
      setDraggableData1: (data: draggableData[]) =>
        set((state) => ({
          draggableData1: [...state.draggableData1, ...data],
        })),
      setDraggableData2: (data: draggableData[]) =>
        set((state) => ({
          draggableData2: [...state.draggableData2, ...data],
        })),
      setDraggableData3: (data: draggableData[]) =>
        set((state) => ({
          draggableData3: [...state.draggableData3, ...data],
        })), // ✅ FIXED: replaced `;` with `,`
      removeDraggableData1: (id) =>
        set((state) => ({
          draggableData1: state.draggableData1.filter((item) => item.id !== id),
        })),
      removeDraggableData2: (id) =>
        set((state) => ({
          draggableData2: state.draggableData2.filter((item) => item.id !== id),
        })),
      removeDraggableData3: (id) =>
        set((state) => ({
          draggableData3: state.draggableData3.filter((item) => item.id !== id),
        })),
      setShowDraggable1: () => {
        set((state) => ({
          showDraggable1: !state.showDraggable1,
        }));
      },
      setShowDraggable2: () => {
        set((state) => ({
          showDraggable2: !state.showDraggable2,
        }));
      },
      setShowDraggable3: () => {
        set((state) => ({
          showDraggable3: !state.showDraggable3,
        }));
      },
      updateDraggableData1: (id, updatedData) =>
        set((state) => ({
          draggableData1: state.draggableData1.map((item) =>
            item.id === id ? { ...item, ...updatedData } : item
          ),
        })),
      updateDraggableData2: (id, updatedData) =>
        set((state) => ({
          draggableData2: state.draggableData2.map((item) =>
            item.id === id ? { ...item, ...updatedData } : item
          ),
        })),
      updateDraggableData3: (id, updatedData) =>
        set((state) => ({
          draggableData3: state.draggableData3.map((item) =>
            item.id === id ? { ...item, ...updatedData } : item
          ),
        })),
      updateLowestValue1: (id, lowestValue) =>
        set((state) => ({
          draggableData1: state.draggableData1.map((item) =>
            item.id === id ? { ...item, lowestValue } : item
          ),
        })),
      updateLowestValue2: (id, lowestValue) =>
        set((state) => ({
          draggableData2: state.draggableData2.map((item) =>
            item.id === id ? { ...item, lowestValue } : item
          ),
        })),
      updateLowestValue3: (id, lowestValue) =>
        set((state) => ({
          draggableData3: state.draggableData3.map((item) =>
            item.id === id ? { ...item, lowestValue } : item
          ),
        })),
    }),
    {
      name: "draggable-storage",
    }
  )
);

export default useStore;
