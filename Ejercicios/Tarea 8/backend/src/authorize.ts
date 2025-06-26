// src/authorize.ts
import { Request, Response, NextFunction } from 'express'
import { prisma, Role } from './db'

export function authorize (minimum: Role) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const boardId = Number(req.params.boardId)
    const userId  = req.userId!

    // 1) dueño?
    const board = await prisma.board.findUnique({ where: { id: boardId } })
    if (!board) {
      res.status(404).json({ message: 'Tablero no existe' })
      return
    }
    if (board.ownerId === userId) {
      req.role = Role.OWNER
      next()
      return
    }

    // 2) miembro?
    const membership = await prisma.boardUser.findUnique({
      where: { boardId_userId: { boardId, userId } }
    })
    const role = membership?.role

    // 3) comparar jerarquía
    const hierarchy = [Role.VIEWER, Role.EDITOR, Role.OWNER]
    if (role && hierarchy.indexOf(role) >= hierarchy.indexOf(minimum)) {
      req.role = role
      next()
    } else {
      res.status(403).json({ message: 'Sin permisos' })
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: number
      role?: Role
    }
  }
}
