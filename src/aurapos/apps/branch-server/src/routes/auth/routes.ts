import { Router } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const verifyAsync = promisify(jwt.verify);
const signAsync = promisify(jwt.sign);

interface JwtPayload {
  userId: string;
  role: string;
  branch: string;
  iat: number;
  exp: number;
}

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token missing' });
  }

  try {
    const payload = await verifyAsync(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload;

    const client = await pool.connect();
    client.release();

    const accessToken = await signAsync(
      { userId: payload.userId, role: payload.role, branch: payload.branch },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '15m' }
    );

    res.json({ accessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

export default router;