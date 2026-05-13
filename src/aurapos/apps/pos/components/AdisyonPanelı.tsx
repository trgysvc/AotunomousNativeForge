import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  portionOptions: { label: string; multiplier: number }[];
  optionGroups: OptionGroup[];
}

interface OptionGroup {
  id: string;
  name: string;
  options: Option[];
}

interface Option {
  id: string;
  name: string;
  price: number;
}

interface AdisyonPanelıProps {
  products: Product[];
  onAdd: (order: Order) => void;
}

interface OrderItem {
  productId: string;
  quantity: number;
  portionMultiplier: number;
  selectedOptions: string[]; // option ids
  notes: string;
  unitPrice: number;
}

interface Order {
  items: OrderItem[];
  total: number;
}

export default function AdisyonPanelı({ products, onAdd }: AdisyonPanelıProps) {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [total, setTotal] = useState(0);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (selectedProduct) {
      // reset portion to first option
      const first = selectedProduct.portionOptions[0];
      setPortionMultiplier(first ? first.multiplier : 1);
      setSelectedOptions([]);
      setNotes('');
      calculateTotal();
    } else {
      setTotal(0);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) calculateTotal();
  }, [quantity, portionMultiplier, selectedOptions, selectedProduct]);

  const calculateTotal = () => {
    if (!selectedProduct) {
      setTotal(0);
      return;
    }
    const base = selectedProduct.price * quantity * portionMultiplier;
    const optionsPrice = selectedOptions.reduce((sum, optId) => {
      const opt = selectedProduct.optionGroups
        .flatMap(g => g.options)
        .find(o => o.id === optId);
      return sum + (opt ? opt.price : 0);
    }, 0);
    setTotal(base + optionsPrice);
  };

  const handleAdd = () => {
    if (!selectedProduct) return;
    const item: OrderItem = {
      productId: selectedProduct.id,
      quantity,
      portionMultiplier,
      selectedOptions: [...selectedOptions],
      notes,
      unitPrice: selectedProduct.price,
    };
    const order: Order = {
      items: [item],
      total,
    };
    onAdd(order);
    // reset form after add
    setSelectedProduct(null);
    setQuantity(1);
    setNotes('');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Adisyon Paneli</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Ürün ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <select
          value={selectedProduct ? selectedProduct.id : ''}
          onChange={e => {
            const id = e.target.value;
            setSelectedProduct(products.find(p => p.id === id) ?? null);
          }}
          className="w-full p-2 border rounded"
        >
          <option value="">Ürün seçiniz</option>
          {filteredProducts.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <>
          <div className="mb-4">
            <label className="block mb-1">Adet</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value) || 1)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1">Porsiyon</label>
            <select
              value={portionMultiplier}
              onChange={e => setPortionMultiplier(Number(e.target.value))}
              className="w-full p-2 border rounded"
            >
              {selectedProduct.portionOptions.map(opt => (
                <option key={opt.label} value={opt.multiplier}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct.optionGroups.length > 0 && (
            <>
              <div className="mb-4 font-medium">Seçenekler</div>
              {selectedProduct.optionGroups.map(group => (
                <div key={group.id} className="mb-2">
                  <div className="font-semibold mb-1">{group.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map(opt => (
                      <label key={opt.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes(opt.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedOptions(prev => [...prev, opt.id]);
                            } else {
                              setSelectedOptions(prev =>
                                prev.filter(id => id !== opt.id)
                              );
                            }
                          }}
                          className="mr-1"
                        />
                        <span>{opt.name} (+{opt.price}₺)</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="mb-4">
            <label className="block mb-1">Notlar</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between">
              <span>Toplam:</span>
              <span className="font-bold">{total.toFixed(2)}₺</span>
            </div>
            <button
              onClick={handleAdd}
              disabled={!selectedProduct}
              className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Sipariş Ekle
            </button>
          </div>
        </>
      )}
    </div>
  );
}