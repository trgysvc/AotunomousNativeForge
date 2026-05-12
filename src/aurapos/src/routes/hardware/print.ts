import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.post<{ Body: unknown }>('/hardware/print', async (request: FastifyRequest<{ Body: unknown }>, reply: FastifyReply) => {
    console.log('Mock Thermal Printer: Printing receipt:', request.body);
    reply.send({ success: true, message: 'Print job queued' });
  });
}