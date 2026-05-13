export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${params.id}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch order');
  }

  const order = await res.json();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Order #{order.id}</h1>
      <div className="space-y-4">
        {order.items.map((item: any) => (
          <div key={item.id} className="border p-4 rounded-lg">
            <h2 className="text-lg font-medium">{item.name} × {item.quantity}</h2>
            {item.modifiers && item.modifiers.length > 0 ? (
              <div className="mt-2">
                <h3 className="font-semibold">Modifiers:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {item.modifiers.map((mod: any) => (
                    <li key={mod.id}>
                      {mod.name} {mod.price ? `(+${mod.price})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-3 flex items-center">
              <span className="mr-2">KDS Status:</span>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  item.kdsStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : item.kdsStatus === 'preparing'
                    ? 'bg-blue-100 text-blue-800'
                    : item.kdsStatus === 'ready'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {item.kdsStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}