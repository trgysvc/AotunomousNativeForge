import React from 'react';

type PaymentMethod = 'cash' | 'card' | 'mealVoucher' | 'mobile';

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethod) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ onSelect }) => {
  const handleSelect = (method: PaymentMethod) => {
    onSelect(method);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button
        onClick={() => handleSelect('cash')}
        style={{
          padding: '12px 16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
          cursor: 'pointer',
        }}
      >
        Nakit
      </button>
      <button
        onClick={() => handleSelect('card')}
        style={{
          padding: '12px 16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
          cursor: 'pointer',
        }}
      >
        Kart
      </button>
      <button
        onClick={() => handleSelect('mealVoucher')}
        style={{
          padding: '12px 16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
          cursor: 'pointer',
        }}
      >
        Yemek Kuponu
      </button>
      <button
        onClick={() => handleSelect('mobile')}
        style={{
          padding: '12px 16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
          cursor: 'pointer',
        }}
      >
        Mobil Ödeme
      </button>
    </div>
  );
};

export default PaymentMethodSelector;