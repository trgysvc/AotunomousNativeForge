import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ApprovalResponse, PaymentRequest } from '../../../../../packages/shared-types/src/index.ts';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateMockTransactionId = () => `mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const saleHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  await delay(500);
  const { amount, paymentMethod, cardAmount, mealVoucherAmount, cashGiven } = request.body as PaymentRequest;

  if (paymentMethod === 'mixed') {
    if (cardAmount === undefined || mealVoucherAmount === undefined || cashGiven === undefined) {
      return reply.status(400).send({ error: 'Missing required fields for mixed payment' });
    }
    const cashDue = amount - cardAmount - mealVoucherAmount;
    if (cashGiven < cashDue) {
      return reply.status(400).send({ error: 'Insufficient cash provided' });
    }
    const change = cashGiven - cashDue;
    const transactionId = generateMockTransactionId();
    const response: ApprovalResponse = {
      approval: true,
      amount,
      transactionId,
      cardAmount: cardAmount > 0 ? cardAmount : undefined,
      mealVoucherAmount: mealVoucherAmount > 0 ? mealVoucherAmount : undefined,
      cashAmount: cashDue,
      change: change > 0 ? change : undefined,
    };
    return reply.send(response);
  }

  if (paymentMethod === 'card') {
    const transactionId = generateMockTransactionId();
    const response: ApprovalResponse = {
      approval: true,
      amount,
      transactionId,
    };
    return reply.send(response);
  }

  if (paymentMethod === 'meal_voucher') {
    const transactionId = generateMockTransactionId();
    const response: ApprovalResponse = {
      approval: true,
      amount,
      transactionId,
    };
    return reply.send(response);
  }

  if (paymentMethod === 'cash') {
    if (cashGiven === undefined) {
      return reply.status(400).send({ error: 'cashGiven is required for cash payment' });
    }
    if (cashGiven < amount) {
      return reply.status(400).send({ error: 'Insufficient cash provided' });
    }
    const change = cashGiven - amount;
    const transactionId = generateMockTransactionId();
    const response: ApprovalResponse = {
      approval: true,
      amount,
      transactionId,
      change: change > 0 ? change : undefined,
    };
    return reply.send(response);
  }

  return reply.status(400).send({ error: 'Unsupported payment method' });
};

const cancelHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  await delay(500);
  const { transactionId } = request.body as { transactionId: string };
  if (!transactionId) {
    return reply.status(400).send({ error: 'transactionId is required' });
  }
  const response: ApprovalResponse = {
    approval: true,
    amount: 0,
    transactionId: `${transactionId}_cancelled`,
  };
  return reply.send(response);
};

const refundHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  await delay(500);
  const { transactionId, amount } = request.body as { transactionId: string; amount: number };
  if (!transactionId || amount === undefined) {
    return reply.status(400).send({ error: 'transactionId and amount are required' });
  }
  const response: ApprovalResponse = {
    approval: true,
    amount,
    transactionId: `${transactionId}_refunded`,
  };
  return reply.send(response);
};

const addTipHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  await delay(500);
  const { transactionId, tipAmount } = request.body as { transactionId: string; tipAmount: number };
  if (!transactionId || tipAmount === undefined) {
    return reply.status(400).send({ error: 'transactionId and tipAmount are required' });
  }
  const response: ApprovalResponse = {
    approval: true,
    amount: tipAmount,
    transactionId: `${transactionId}_tip_added`,
  };
  return reply.send(response);
};

const partialPaymentHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  await delay(500);
  const { amount, paymentMethod } = request.body as PaymentRequest;
  if (amount === undefined || paymentMethod === undefined) {
    return reply.status(400).send({ error: 'amount and paymentMethod are required' });
  }
  // Simplified: treat as a sale for the partial amount
  const transactionId = generateMockTransactionId();
  const response: ApprovalResponse = {
    approval: true,
    amount,
    transactionId,
  };
  return reply.send(response);
};

const batchCloseHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  await delay(500);
  const response: ApprovalResponse = {
    approval: true,
    amount: 0,
    transactionId: `batch_closed_${Date.now()}`,
  };
  return reply.send(response);
};

export default function (fastify: FastifyInstance, opts: any, done: any) {
  fastify.post('/api/hardware/payment/sale', saleHandler);
  fastify.post('/api/hardware/payment/cancel', cancelHandler);
  fastify.post('/api/hardware/payment/refund', refundHandler);
  fastify.post('/api/hardware/payment/addTip', addTipHandler);
  fastify.post('/api/hardware/payment/partialPayment', partialPaymentHandler);
  fastify.post('/api/hardware/payment/batchClose', batchCloseHandler);
  done();
}