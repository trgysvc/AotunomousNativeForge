"use client";
import { useEffect, useState } from 'react';

type Order = {
  id: string;
  items: { name: string; quantity: number }[];
  station: 'kitchen' | 'bar' | 'cold_buffet';
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

interface OrderListProps {
  station?: 'kitchen' | 'bar' | 'cold_buffet' | 'all';
}

export default function OrderList({ station = 'all' }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'kitchen' | 'bar' | 'cold_buffet' | 'all'>(
    station as any
  );

  useEffect(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL ?? ''}/orders?station=${filter}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected to', wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'order_added') {
          setOrders((prev) => {
            const exists = prev.some((o) => o.id === data.order.id);
            return exists ? prev : [...prev, data.order];
          });
        } else if (data.type === 'order_updated') {
          setOrders((prev) =>
            prev.map((o) => (o.id === data.order.id ? data.order : o))
          );
        } else if (data.type === 'order_removed') {
          setOrders((prev) => prev.filter((o) => o.id !== data.order.id));
        }
      } catch (e) {
        console.error('Invalid WS message', event.data, e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      ws.close();
    };
  }, [filter]);

  const filteredOrders =
    filter === 'all'
      ? orders
      : orders.filter((o) => o.station === filter);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        {filter === 'all' ? 'Tüm Siparişler' : `${filter} Siparişleri`}
      </h2>
      {filteredOrders.length === 0 ? (
        <p className="text-gray-500">Sipariş bulunamadı.</p>
      ) : (
        <ul className="space-y-2">
          {filteredOrders.map((order) => (
            <li
              key={order.id}
              className={`p-3 border rounded ${
                order.status === 'completed'
                  ? 'bg-green-50'
                  : order.status === 'cancelled'
                  ? 'bg-red-50'
                  : order.status === 'ready'
                  ? 'bg-yellow-50'
                  : ''
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">{order.items.map((i) => i.name).join(', ')}</h3>
                  <p className="text-sm text-gray-500">
                    {order.station} • {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  order.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : order.status === 'ready'
                    ? 'bg-yellow-100 text-yellow-800'
                    : order.status === 'preparing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}