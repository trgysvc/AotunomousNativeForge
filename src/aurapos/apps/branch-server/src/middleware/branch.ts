import { Request, Response, NextFunction } from 'express';

export const setBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const user = req.user as { allowedBranches?: string[] } | undefined;
    const allowedBranches = user?.allowedBranches ?? [];

    if (!allowedBranches.length || !allowedBranches.includes(branchId)) {
      return res.status(403).json({ error: 'Not authorized to switch to this branch' });
    }

    req.branch = branchId;

    res.status(200).json({ message: 'Active branch updated successfully', branchId });
  } catch (error) {
    next(error);
  }
};