export interface Order {
  id?: string;
  order_id: string;
  trade_id: string;
  user_id?: string;
  poa: number;
  legs: number;
  order_type: 'market' | 'limit';
  limit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  stop_loss_point?: number;
  take_profit_point?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Position {
  id?: string;
  position_id: string;
  order_id: string;
  trade_id: string;
  user_id?: string;
  position_type: 'entry' | 'stop_loss' | 'take_profit';
  price: number;
  quantity?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

let orderCounter = 1;
const positionCounter = {
  entry: 1,
  stop_loss: 1,
  take_profit: 1,
};

export const generateOrderId = (): string => {
  return `Order-${String(orderCounter++).padStart(3, '0')}`;
};

export const generatePositionId = (type: 'entry' | 'stop_loss' | 'take_profit'): string => {
  const typePrefix = type === 'entry' ? 'Entry' : type === 'stop_loss' ? 'SL' : 'TP';
  return `${typePrefix}-${String(positionCounter[type]++).padStart(3, '0')}`;
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'order_id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Order | null> => {
  const order_id = generateOrderId();

  const order: Order = {
    order_id,
    ...orderData,
  };

  console.log('Order created (in-memory):', order);
  return order;
};

export const createPosition = async (positionData: Omit<Position, 'id' | 'position_id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Position | null> => {
  const position_id = generatePositionId(positionData.position_type);

  const position: Position = {
    position_id,
    ...positionData,
  };

  console.log('Position created (in-memory):', position);
  return position;
};

export const updatePosition = async (positionId: string, updates: Partial<Position>): Promise<Position | null> => {
  console.log('Position updated (in-memory):', positionId, updates);
  return { ...updates, id: positionId } as Position;
};

export const getPositionsByTradeId = async (tradeId: string): Promise<Position[]> => {
  console.log('Fetching positions for trade (in-memory):', tradeId);
  return [];
};

export const getOrdersByTradeId = async (tradeId: string): Promise<Order[]> => {
  console.log('Fetching orders for trade (in-memory):', tradeId);
  return [];
};

export const deletePosition = async (positionId: string): Promise<boolean> => {
  console.log('Position deleted (in-memory):', positionId);
  return true;
};
