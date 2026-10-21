import type { Request, Response, NextFunction } from "express";
import { verifyToken, type TokenPayload } from "./jwt";

export const SUPER_ADMIN_EMAIL = "admin2-yusstyle@gmail.com";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      authUser?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Access token required" });
    return;
  }

  const payload = verifyToken(authHeader);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    return;
  }

  req.user = payload;
  req.authUser = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Forbidden: Admin access required" });
      return;
    }
    next();
  });
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin" || (req.user?.email !== SUPER_ADMIN_EMAIL && req.user?.email !== "yusstyle13@gmail.com")) {
      res.status(403).json({ error: "Forbidden: Super Admin access required" });
      return;
    }
    next();
  });
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const payload = verifyToken(authHeader);
    if (payload) {
      req.user = payload;
      req.authUser = payload;
    }
  }
  next();
}

