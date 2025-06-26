// src/auth.ts
import type { Request, Response, NextFunction } from "express"
import jwt, { type JwtPayload } from "jsonwebtoken"

declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token

  if (!token) {
    res.status(401).json({ message: "Auth required" })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

    if (!payload.sub) {
      res.clearCookie("token")
      res.status(401).json({ message: "Invalid token - no subject" })
      return
    }

    const userId = Number(payload.sub)

    if (isNaN(userId) || userId <= 0) {
      res.clearCookie("token")
      res.status(401).json({ message: "Invalid token - invalid user ID" })
      return
    }

    req.userId = userId
    next()
  } catch (error) {
    res.clearCookie("token")
    res.status(401).json({ message: "Invalid token" })
  }
}
