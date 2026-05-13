import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

interface LoginBody {
  username: string;
  password: string;
}

interface PinLoginBody {
  staffId: string;
  pin: string;
}

async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const jwtSecret = process.env.JWT_SECRET ?? '';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '1h';

  // Mock data – replace with actual DB lookups in production
  const users = [
    { id: '1', username: 'admin', passwordHash: '$2b$10$VexampleHash1234567890abcdef' },
  ];

  const staffPins = [
    { staffId: 's1', pinHash: '$2b$10$VexamplePinHash1234567890abcdef' },
  ];

  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    const { username, password } = request.body;
    const user = users.find(u => u.username === username);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    const token = await jwt.signAsync({ sub: user.id, username: user.username }, jwtSecret, { expiresIn: jwtExpiresIn });
    return reply.send({ token });
  });

  fastify.post<{ Body: PinLoginBody }>('/pin-login', async (request, reply) => {
    const { staffId, pin } = request.body;
    const staff = staffPins.find(s => s.staffId === staffId);
    if (!staff) {
      return reply.status(401).send({ error: 'Invalid staff' });
    }
    const match = await bcrypt.compare(pin, staff.pinHash);
    if (!match) {
      return reply.status(401).send({ error: 'Invalid PIN' });
    }
    const token = await jwt.signAsync({ sub: staffId, role: 'staff' }, jwtSecret, { expiresIn: jwtExpiresIn });
    return reply.send({ token });
  });

  fastify.decorate('verifyJWT', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new Error('Missing token');
      }
      await jwt.verifyAsync(token, jwtSecret);
    } catch (err) {
      reply.status(401).send({ error: 'Invalid or expired token' });
    }
  });
}

export default authRoutes;