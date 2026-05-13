import React, { useState } from 'react';

type PaymentMethod = 'cash' | 'card' | 'mealVoucher' | 'mobile';

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethod) => void;
  defaultSelected?: PaymentMethod;
}

export default function PaymentMethodSelector({ onSelect, defaultSelected }: PaymentMethodSelectorProps) {
  const [selected, setSelected] = useState<PaymentMethod | null>(defaultSelected ?? null);

  const handleSelect = (method: PaymentMethod) => {
    setSelected(method);
    onSelect(method);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {['cash', 'card', 'mealVoucher', 'mobile'].map(method => (
        <button
          key={method}
          onClick={() => handleSelect(method as PaymentMethod)}
          className={`
            flex items-center justify-center px-4 py-2 border rounded
            ${selected === method
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'}
          `}
        >
          {getLabel(method)}
          {getIcon(method)}
        </button>
      ))}
    </div>
  );
}

function getLabel(method: PaymentMethod): string {
  switch (method) {
    case 'cash': return 'Nakit';
    case 'card': return 'Kart';
    case 'mealVoucher': return 'Yemek Kartı';
    case 'mobile': return 'Mobil Ödeme';
    default: return '';
  }
}

function getIcon(method: PaymentMethod): JSX.Element | null {
  // Placeholder for icons; can be replaced with actual icon components
  return null;
}