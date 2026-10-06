import crypto from 'crypto';

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  userId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

const orders = new Map<string, Order>();

export function createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
  const id = `AUREN-${Math.floor(100000 + Math.random() * 900000)}`;
  const order: Order = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.set(id, order);
  return order;
}

export function updateOrder(id: string, updates: Partial<Order>): Order | undefined {
  const order = orders.get(id);
  if (!order) return undefined;
  const updated = { ...order, ...updates, updatedAt: new Date().toISOString() };
  orders.set(id, updated);
  return updated;
}

export function getOrder(id: string): Order | undefined {
  return orders.get(id);
}

export function getOrdersByUserId(userId: string): Order[] {
  return Array.from(orders.values())
    .filter(o => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getOrderByRazorpayOrderId(rpOrderId: string): Order | undefined {
  return Array.from(orders.values()).find(o => o.razorpayOrderId === rpOrderId);
}
