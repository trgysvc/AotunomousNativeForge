import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { Order, SplitRequest, MergeRequest, TransferRequest } from '../../../packages/shared-types/src';

const validTransitions = {
  OPEN: ['PARTIAL_PAID', 'CANCELLED', 'SPLIT', 'MERGED'],
  PARTIAL_PAID: ['PAID', 'CANCELLED'],
  PAID: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
  SPLIT: [],
  MERGED: []
};

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  const allowed = validTransitions[currentStatus as keyof typeof validTransitions];
  return allowed ? allowed.includes(newStatus) : false;
}

export default async (fastify: FastifyInstance) => {
  fastify.post('/api/orders', async (request: FastifyRequest, reply: FastifyReply) => {
    const { branch_id, table_id, total_amount = 0 } = request.body as Order;
    if (!branch_id) {
      return reply.status(400).send({ error: 'branch_id is required' });
    }
    const id = randomUUID();
    const now = new Date();
    const client = await fastify.pg.connect();
    try {
      await client.query(
        'INSERT INTO orders (id, status, branch_id, table_id, total_amount, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, 'OPEN', branch_id, table_id ?? null, total_amount, now, now]
      );
      const { rows } = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
      reply.status(201).send(rows[0]);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to create order' });
    } finally {
      client.release();
    }
  });

  fastify.get('/api/orders/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const client = await fastify.pg.connect();
    try {
      const { rows } = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'Order not found' });
      }
      reply.send(rows[0]);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to fetch order' });
    } finally {
      client.release();
    }
  });

  fastify.patch('/api/orders/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { status, total_amount } = request.body as Partial<Order>;
    const client = await fastify.pg.connect();
    try {
      await client.query('BEGIN');
      const { rows: orderRows } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
      if (orderRows.length === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ error: 'Order not found' });
      }
      const order = orderRows[0];
      if (status !== undefined) {
        if (!isValidTransition(order.status, status)) {
          await client.query('ROLLBACK');
          return reply.status(400).send({ error: `Invalid status transition from ${order.status} to ${status}` });
        }
      }
      const updates: string[] = [];
      const values: any[] = [];
      let index = 1;
      if (status !== undefined) {
        updates.push(`status = $${index++}`);
        values.push(status);
      }
      if (total_amount !== undefined) {
        if (total_amount < 0) {
          await client.query('ROLLBACK');
          return reply.status(400).send({ error: 'total_amount cannot be negative' });
        }
        updates.push(`total_amount = $${index++}`);
        values.push(total_amount);
      }
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return reply.send(order);
      }
      updates.push(`updated_at = $${index++}`);
      values.push(new Date());
      values.push(id);
      const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = $${index}`;
      await client.query(query, values);
      const { rows: updatedRows } = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
      await client.query('COMMIT');
      reply.send(updatedRows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      reply.status(500).send({ error: 'Failed to update order' });
    } finally {
      client.release();
    }
  });

  fastify.delete('/api/orders/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const client = await fastify.pg.connect();
    try {
      const { rows } = await client.query(
        'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        ['CANCELLED', new Date(), id]
      );
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'Order not found' });
      }
      reply.send(rows[0]);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to cancel order' });
    } finally {
      client.release();
    }
  });

  fastify.post('/api/orders/:id/split', async (request: FastifyRequest<{ Params: { id: string }; Body: SplitRequest }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { splitBy, criteria } = request.body;
    const client = await fastify.pg.connect();
    try {
      await client.query('BEGIN');
      const { rows: orderRows } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
      if (orderRows.length === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ error: 'Order not found' });
      }
      const order = orderRows[0];
      if (order.status !== 'OPEN') {
        await client.query('ROLLBACK');
        return reply.status(400).send({ error: 'Only open orders can be split' });
      }
      // Placeholder: actual split logic would go here
      // For minimal implementation, we'll just mark as split and return
      await client.query(
        'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3',
        ['SPLIT', new Date(), id]
      );
      await client.query('COMMIT');
      reply.send({ message: 'Order split marked (implementation pending)' });
    } catch (err) {
      await client.query('ROLLBACK');
      reply.status(500).send({ error: 'Failed to split order' });
    } finally {
      client.release();
    }
  });

  fastify.post('/api/orders/:id/merge', async (request: FastifyRequest<{ Params: { id: string }; Body: MergeRequest }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { orderIds } = request.body;
    const client = await fastify.pg.connect();
    try {
      await client.query('BEGIN');
      const { rows: orderRows } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
      if (orderRows.length === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ error: 'Order not found' });
      }
      const baseOrder = orderRows[0];
      if (baseOrder.status !== 'OPEN') {
        await client.query('ROLLBACK');
        return reply.status(400).send({ error: 'Base order must be open for merge' });
      }
      // Placeholder: actual merge logic would go here
      await client.query(
        'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3',
        ['MERGED', new Date(), id]
      );
      await client.query('COMMIT');
      reply.send({ message: 'Order merge marked (implementation pending)' });
    } catch (err) {
      await client.query('ROLLBACK');
      reply.status(500).send({ error: 'Failed to merge order' });
    } finally {
      client.release();
    }
  });

  fastify.post('/api/orders/:id/transfer', async (request: FastifyRequest<{ Params: { id: string }; Body: TransferRequest }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { tableId } = request.body;
    const client = await fastify.pg.connect();
    try {
      const { rows } = await client.query(
        'UPDATE orders SET table_id = $1, updated_at = $2 WHERE id = $3 AND status = $4 RETURNING *',
        [tableId, new Date(), id, 'OPEN']
      );
      if (rows.length === 0) {
        const { rows: orderRows } = await client.query('SELECT status FROM orders WHERE id = $1', [id]);
        if (orderRows.length === 0) {
          return reply.status(404).send({ error: 'Order not found' });
        }
        return reply.status(400).send({ error: 'Only open orders can be transferred' });
      }
      reply.send(rows[0]);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to transfer order' });
    } finally {
      client.release();
    }
  });
};