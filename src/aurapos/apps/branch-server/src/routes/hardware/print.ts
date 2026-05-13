import { FastifyRequest, FastifyReply } from 'fastify';

interface PrintRequestBody {
  orderId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
  timestamp: string;
}

async function printHandler(request: FastifyRequest<{ Body: PrintRequestBody }>, reply: FastifyReply) {
  const { orderId, items, total, paymentMethod, timestamp } = request.body;

  if (!orderId || !items || !Array.isArray(items) || items.length === 0 || typeof total !== 'number' || !paymentMethod || !timestamp) {
    return reply.status(400).send({ error: 'Invalid request body' });
  }

  const receipt = generateReceipt({ orderId, items, total, paymentMethod, timestamp });
  console.log('Mock Thermal Printer Output:');
  console.log(receipt);
  console.log('--- End of Receipt ---');

  return reply.send({ success: true, message: 'Print job queued (mock)' });
}

function generateReceipt(data: PrintRequestBody): string {
  const { orderId, items, total, paymentMethod, timestamp } = data;
  const date = new Date(timestamp).toLocaleString();

  let receipt = '======================\n';
  receipt += '     AURA POS\n';
  receipt += '======================\n';
  receipt += `Order ID: ${orderId}\n`;
  receipt += `Date: ${date}\n`;
  receipt += '--------------------\n';

  items.forEach(item => {
    receipt += `${item.name} x${item.quantity}  ${(item.price * item.quantity).toFixed(2)}\n`;
  });

  receipt += '--------------------\n';
  receipt += `TOTAL: ${total.toFixed(2)}\n`;
  receipt += `Payment: ${paymentMethod}\n`;
  receipt += '======================\n';
  receipt += ' Thank you for your purchase!\n';
  receipt += '======================\n';

  return receipt;
}

export { printHandler };