import type { Order, OrderCreateInput, OrderUpdateInput } from '@aurapos/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export const orderService = {
  getOrder: async (id: string): Promise<Order> => {
    return fetchApi<Order>(`/orders/${id}`);
  },

  createOrder: async (orderData: OrderCreateInput): Promise<Order> => {
    return fetchApi<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  updateOrder: async (id: string, orderData: OrderUpdateInput): Promise<Order> => {
    return fetchApi<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  deleteOrder: async (id: string): Promise<void> => {
    await fetchApi<void>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },
};