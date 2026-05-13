import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  number: string;
  total: number;
  itemsCount: number;
  status: string;
}

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOpenOrders() {
      try {
        const res = await fetch(`/api/orders?status=open`);
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data: Order[] = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchOpenOrders();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-8">Loading...</div>;
  if (error) return <div className="text-red-500 py-8">{error}</div>;
  if (orders.length === 0) return <div className="text-center py-8">No open orders</div>;

  const totalOrders = orders.reduce((sum, o) => sum + 1, 0);
  const totalAmount = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Open Orders</h2>
      <div className="mb-4 flex space-x-4">
        <span>Total Orders: {totalOrders}</span>
        <span>Total Amount: {totalAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
      </div>
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">Items</th>
            <th className="text-left p-2">Total</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{order.number}</td>
              <td className="p-2">{order.itemsCount}</td>
              <td className="p-2">{order.total.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
              <td className="p-2">{order.status}</td>
              <td className="p-2 flex space-x-2">
                <Link href={`/orders/${order.id}`} className="text-blue-600 hover:underline">
                  View
                </Link>
                <Link href={`/orders/${order.id}/edit`} className="text-yellow-600 hover:underline">
                  Edit
                </Link>
                <button
                  onClick={() => {
                    if (window.confirm(`Cancel order ${order.number}?`)) {
                      // Implement cancel logic here (e.g., API call)
                      alert('Cancel not implemented');
                    }
                  }}
                  className="text-red-600 hover:underline"
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}