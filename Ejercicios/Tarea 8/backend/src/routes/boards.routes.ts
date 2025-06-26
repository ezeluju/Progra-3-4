import type { Express } from 'express'
import { z }             from 'zod'

import { prisma, Role }  from '../db'
import { authRequired }  from '../auth'
import { authorize }     from '../authorize'
import { validate }      from '../validate'
import {
  boardCreateSchema,
  boardUpdateSchema,
  shareSchema,
  taskCreateSchema,
  taskUpdateSchema,
}                        from '../schemas'
import { api }           from '../api'

/* Schema para cambiar únicamente el rol de un miembro compartido */
const shareRoleSchema = z
  .object({ role: z.nativeEnum(Role) })
  .openapi('ShareRoleBody')

export function boardRoutes(app: Express): void {
  /* ─────────────  GET /boards  ───────────── */
  app.get(
    '/api/boards',
    api({
      method: 'get',
      path:   '/boards',
      tags:   ['Boards'],
      summary: 'Obtener tableros del usuario',
      security: [{ cookieAuth: [] }],
      responses: { 200: { description: 'Lista de tableros' } },
    }),

    authRequired,

    async (req, res) => {
      const userId = req.userId!
      const boards = await prisma.board.findMany({
        where: {
          OR: [{ ownerId: userId }, { roles: { some: { userId } } }],
        },
        include: {
          roles: true,
          owner: { select: { id: true, name: true, email: true } },
        },
      })
      res.json(boards)
    },
  )

  /* ─────────────  POST /boards  ───────────── */
  app.post(
    '/api/boards',
    api({
      method: 'post',
      path:   '/boards',
      tags:   ['Boards'],
      summary: 'Crear tablero',
      security: [{ cookieAuth: [] }],
      request: {
        body: { content: { 'application/json': { schema: boardCreateSchema } } },
      },
      responses: { 201: { description: 'Tablero creado' } },
    }),

    authRequired,
    validate(boardCreateSchema),

    async (req, res) => {
      const board = await prisma.board.create({
        data: { name: req.body.name, ownerId: req.userId! },
      })
      res.status(201).json(board)
    },
  )

  /* ─────────────  PATCH /boards/:boardId  ───────────── */
  app.patch(
    '/api/boards/:boardId',
    api({
      method: 'patch',
      path:   '/boards/{boardId}',
      tags:   ['Boards'],
      summary: 'Actualizar tablero',
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'integer' } },
      ],
      request: {
        body: { content: { 'application/json': { schema: boardUpdateSchema } } },
      },
      responses: { 200: { description: 'Tablero actualizado' }, 403: { description: 'Sin permisos' } },
    }),

    authRequired,
    authorize(Role.OWNER),
    validate(boardUpdateSchema),

    async (req, res) => {
      const board = await prisma.board.update({
        where: { id: Number(req.params.boardId) },
        data:  { name: req.body.name },
      })
      res.json(board)
    },
  )

  /* ─────────────  DELETE /boards/:boardId  ───────────── */
  app.delete(
    '/api/boards/:boardId',
    api({
      method: 'delete',
      path:   '/boards/{boardId}',
      tags:   ['Boards'],
      summary: 'Eliminar tablero',
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'integer' } },
      ],
      responses: {
        200: { description: 'Tablero eliminado' },
        403: { description: 'Sin permisos' },
        500: { description: 'Error al eliminar' },
      },
    }),

    authRequired,
    authorize(Role.OWNER),

    async (req, res) => {
      const boardId = Number(req.params.boardId)

      try {
        await prisma.$transaction(async (tx) => {
          await tx.task.deleteMany({ where: { boardId } })
          await tx.boardUser.deleteMany({ where: { boardId } })
          await tx.board.delete({ where: { id: boardId } })
        })
        res.json({ deleted: true })
      } catch (err) {
        console.error('❌ Error deleting board:', err)
        res.status(500).json({ error: 'Failed to delete board' })
      }
    },
  )

  /* ─────────────  GET /boards/:id/tasks  ───────────── */
  app.get(
    '/api/boards/:id/tasks',
    api({
      method: 'get',
      path:   '/boards/{id}/tasks',
      tags:   ['Tasks'],
      summary: 'Obtener tareas del tablero (sin paginación)',
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      ],
      responses: { 200: { description: 'Lista de tareas' }, 403: { description: 'Sin acceso' } },
    }),

    authRequired,

    async (req, res) => {
      const boardId = Number(req.params.id)
      const userId  = req.userId!

      const hasAccess = await prisma.board.findFirst({
        where: {
          id: boardId,
          OR: [{ ownerId: userId }, { roles: { some: { userId } } }],
        },
      })

      if (!hasAccess) {
        res.status(403).json({ message: 'Sin acceso a este tablero' })
        return
      }

      const tasks = await prisma.task.findMany({
        where: { boardId },
        select: {
          id: true,
          title: true,
          content: true, // ✅ AGREGADO: Incluir el campo content
          completed: true,
          creatorId: true,
          createdAt: true,
          creator: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
      })

      res.json(tasks)
    },
  )

  /* ─────────────  POST /boards/:boardId/tasks  ───────────── */
  app.post(
    '/api/boards/:boardId/tasks',
    api({
      method: 'post',
      path:   '/boards/{boardId}/tasks',
      tags:   ['Tasks'],
      summary: 'Crear tarea (alias dentro de Boards)',
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'integer' } },
      ],
      request: {
        body: { content: { 'application/json': { schema: taskCreateSchema } } },
      },
      responses: { 201: { description: 'Tarea creada' }, 403: { description: 'Sin permisos' } },
    }),

    authRequired,
    validate(taskCreateSchema),

    async (req, res) => {
      const boardId = Number(req.params.boardId)
      const userId  = req.userId!

      const canEdit = await prisma.board.findFirst({
        where: {
          id: boardId,
          OR: [
            { ownerId: userId },
            { roles: { some: { userId, role: { in: [Role.EDITOR] } } } },
          ],
        },
      })

      if (!canEdit) {
        res.status(403).json({ message: 'Sin permisos para crear tareas' })
        return
      }

      const task = await prisma.task.create({
        data: { ...req.body, boardId, creatorId: userId },
        include: { creator: { select: { id: true, name: true, email: true } } },
      })
      res.status(201).json(task)
    },
  )

  /* ─────────────  PATCH /boards/:boardId/tasks/:taskId  ───────────── */
  app.patch(
    '/api/boards/:boardId/tasks/:taskId',
    api({
      method: 'patch',
      path:   '/boards/{boardId}/tasks/{taskId}',
      tags:   ['Tasks'],
      summary: 'Actualizar tarea (alias dentro de Boards)',
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'taskId',  in: 'path', required: true, schema: { type: 'integer' } },
      ],
      request: {
        body: { content: { 'application/json': { schema: taskUpdateSchema } } },
      },
      responses: { 200: { description: 'Tarea actualizada' }, 403: { description: 'Sin permisos' } },
    }),

    authRequired,
    validate(taskUpdateSchema),

    async (req, res) => {
      const boardId = Number(req.params.boardId)
      const taskId  = Number(req.params.taskId)
      const userId  = req.userId!

      const canEdit = await prisma.board.findFirst({
        where: {
          id: boardId,
          OR: [
            { ownerId: userId },
            { roles: { some: { userId, role: { in: [Role.EDITOR] } } } },
          ],
        },
      })

      if (!canEdit) {
        res.status(403).json({ message: 'Sin permisos para editar tareas' })
        return
      }

      const existing = await prisma.task.findFirst({ where: { id: taskId, boardId } })
      if (!existing) {
        res.status(404).json({ message: 'Tarea no encontrada' })
        return
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data:  req.body,
        include: { creator: { select: { id: true, name: true, email: true } } },
      })
      res.json(task)
    },
  )

  /* ─────────────  SHARE: GET miembros  ───────────── */
  app.get(
    '/api/boards/:boardId/share',
    api({
      method: 'get',
      path:   '/boards/{boardId}/share',
      tags:   ['Sharing'],
      summary: 'Obtener usuarios con acceso al tablero',
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'integer' } },
      ],
      responses: { 200: { description: 'Lista de usuarios' }, 403: { description: 'Sin permisos' } },
    }),

    authRequired,
    authorize(Role.OWNER),

    async (req, res) => {
      const users = await prisma.boardUser.findMany({
        where: { boardId: Number(req.params.boardId) },
        include: { user: true },
        orderBy: { role: 'asc' },
      })
      res.json(users.map(u => ({ userId: u.userId, email: u.user.email, role: u.role })))
    },
  )

  /* ─────────────  SHARE: POST agregar miembro  ───────────── */
  app.post(
    '/api/boards/:boardId/share',
    api({
      method: 'post',
      path:   '/boards/{boardId}/share',
      tags:   ['Sharing'],
      summary: 'Compartir tablero con usuario',
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'integer' } },
      ],
      request: {
        body: { content: { 'application/json': { schema: shareSchema } } },
      },
      responses: {
        201: { description: 'Usuario agregado' },
        404: { description: 'Usuario no encontrado' },
      },
    }),

    authRequired,
    authorize(Role.OWNER),
    validate(shareSchema),

    async (req, res) => {
      const { email, role } = req.body
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' })
        return
      }

      await prisma.boardUser.upsert({
        where: { boardId_userId: { boardId: Number(req.params.boardId), userId: user.id } },
        update: { role },
        create: { boardId: Number(req.params.boardId), userId: user.id, role },
      })

      res.status(201).json({ shared: true })
    },
  )

  /* ─────────────  SHARE: PATCH cambiar rol  ───────────── */
  app.patch(
    '/api/boards/:boardId/share/:userId',
    api({
      method: 'patch',
      path:   '/boards/{boardId}/share/{userId}',
      tags:   ['Sharing'],
      summary: 'Cambiar rol de usuario',
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'userId',  in: 'path', required: true, schema: { type: 'integer' } },
      ],
      request: {
        body: { content: { 'application/json': { schema: shareRoleSchema } } },
      },
      responses: { 200: { description: 'Rol actualizado' }, 403: { description: 'Sin permisos' } },
    }),

    authRequired,
    authorize(Role.OWNER),
    validate(shareRoleSchema),

    async (req, res) => {
      await prisma.boardUser.update({
        where: {
          boardId_userId: {
            boardId: Number(req.params.boardId),
            userId: Number(req.params.userId),
          },
        },
        data: { role: req.body.role },
      })
      res.json({ updated: true })
    },
  )

  /* ─────────────  SHARE: DELETE remover miembro  ───────────── */
  app.delete(
    '/api/boards/:boardId/share/:userId',
    api({
      method: 'delete',
      path:   '/boards/{boardId}/share/{userId}',
      tags:   ['Sharing'],
      summary: 'Remover usuario del tablero',
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'userId',  in: 'path', required: true, schema: { type: 'integer' } },
      ],
      responses: { 200: { description: 'Usuario removido' }, 403: { description: 'Sin permisos' } },
    }),

    authRequired,
    authorize(Role.OWNER),

    async (req, res) => {
      await prisma.boardUser.delete({
        where: {
          boardId_userId: {
            boardId: Number(req.params.boardId),
            userId: Number(req.params.userId),
          },
        },
      })
      res.json({ deleted: true })
    },
  )
}
