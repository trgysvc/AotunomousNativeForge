import { processPayment } from '../../../../../../src/aurapos/lib/hardware';
import { useState, useEffect } from 'react';

export default async function PaymentPage({ params }: { params: { id: string } }) {
  const [payment, setPayment] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayment() {
      try {
        const res = await fetch(`/api/payments/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch payment');
        const data = await res.json();
        setPayment(data);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    loadPayment();
  }, [params.id]);

  const handlePay = async () => {
    if (!payment) return;
    setStatus('processing');
    try {
      await processPayment(payment.amount, payment.method);
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (!payment) return <div>Loading...</div>;

  return (
    <div>
      <h2>Payment Details</h2>
      <p>Amount: {payment.amount}</p>
      <p>Method: {payment.method}</p>
      {status === 'idle' && (
        <button onClick={handlePay} disabled={status === 'processing'}>
          Process Payment
        </button>
      )}
      {status === 'processing' && <p>Processing...</p>}
      {status === 'success' && <p>Payment successful!</p>}
      {status === 'error' && <p>Payment failed: {error}</p>}
    </div>
  );
}