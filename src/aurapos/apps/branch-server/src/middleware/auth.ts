import { verify } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const branchMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verify(token, process.env.JWT_SECRET as string) as { branchId: string };
    if (!decoded.branchId) {
      return res.status(401).json({ error: 'Unauthorized: Branch ID missing in token' });
    }
    req.branch = decoded.branchId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};