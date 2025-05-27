import { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';

export const validate = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.issues.map((issue) => issue.message) });
      return;
    }
    req.body = result.data;
    next();
  };
};