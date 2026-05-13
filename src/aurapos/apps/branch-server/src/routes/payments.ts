import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const cashPaymentSchema = z.object({
  method: z.literal('CASH'),
  amountPaid: z.number().positive(),
  totalAmount: z.number().positive(),
});

export async function paymentsRoutes(fastify: any) {
  fastify.post('/api/payments', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = cashPaymentSchema.parse(request.body);
      const { amountPaid, totalAmount } = body;

      if (amountPaid < totalAmount) {
        return reply.status(400).send({ error: 'Insufficient cash provided' });
      }

      const change = Number((amountPaid - totalAmount).toFixed(2));

      // Record cash register transaction (IN for received amount, OUT for change given)
      await prisma.$transaction([
        prisma.cash_registers.create({
          data: {
            amount: totalAmount,
            type: 'IN',
            description: `Cash payment for order`,
          },
        }),
        prisma.cash_registers.create({
          data: {
            amount: change,
            type: 'OUT',
            description: `Change returned to customer`,
          },
        }),
      ]);

      // Trigger hardware bridge to open cash drawer
      const hardwareUrl = process.env.HARDWARE_BRIDGE_URL;
      if (!hardwareUrl) {
        throw new Error('HARDWARE_BRIDGE_URL not configured');
      }
      const drawerResponse = await fetch(`${hardwareUrl}/api/hardware/drawer/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!drawerResponse.ok) {
        throw new Error(`Hardware drawer open failed: ${drawerResponse.statusText}`);
      }

      return reply.send({ change, status: 'success' });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message ?? 'Internal server error' });
    }
  });
}