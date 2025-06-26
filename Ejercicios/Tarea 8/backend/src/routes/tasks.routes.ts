// src/routes/tasks.routes.ts
// ---------------------------------------------------------------------------
//  Task Routes  – Zod → OpenAPI
// ---------------------------------------------------------------------------

import type { Express } from "express"
import type { Prisma } from "@prisma/client"

import { prisma, Role } from "../db"
import { authRequired } from "../auth"
import { authorize } from "../authorize"
import { validate } from "../validate"
import { taskCreateSchema, taskUpdateSchema } from "../schemas"
import { api } from "../api"

export function taskRoutes(app: Express): void {
  /* ─────────────  GET /boards/:boardId/tasks  ───────────── */
  app.get(
    "/api/boards/:boardId/tasks",
    api({
      method: "get",
      path: "/boards/{boardId}/tasks",
      tags: ["Tasks"],
      summary: "Listar tareas del tablero",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "boardId", in: "path", required: true, schema: { type: "integer" } },
        { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
        { name: "size", in: "query", schema: { type: "integer", minimum: 1 } },
        { name: "completed", in: "query", schema: { type: "boolean" } },
        { name: "q", in: "query", schema: { type: "string" } },
      ],
      responses: {
        200: {
          description: "Lista de tareas",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Task" },
              },
            },
          },
        },
      },
    }),

    authRequired,
    authorize(Role.VIEWER),

    async (req, res) => {
      const { page, size, completed, q } = req.query
      const boardId = Number(req.params.boardId)

      /* -------- Filtros --------------------------------------------------- */
      const where: Prisma.TaskWhereInput = { boardId }
      if (completed !== undefined) where.completed = completed === "true"

      let qStr: string | undefined
      if (typeof q === "string") {
        qStr = q
      } else if (Array.isArray(q) && q.length) {
        qStr = String(q[0])
      }

      if (qStr) {
        where.title = { contains: qStr, mode: "insensitive" }
      }

      /* -------- Opciones de consulta -------------------------------------- */
      const opts: Prisma.TaskFindManyArgs = {
        where,
        select: {
          id: true,
          title: true,
          content: true, // ✅ AGREGADO: Incluir el campo content
          completed: true,
          creatorId: true,
          createdAt: true,
        },
        orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
      }

      if (page && size) {
        opts.skip = (Number(page) - 1) * Number(size)
        opts.take = Number(size)
      }

      const tasks = await prisma.task.findMany(opts)
      res.json(tasks)
    },
  )

  /* ─────────────  POST /boards/:boardId/tasks  ───────────── */
  app.post(
    "/api/boards/:boardId/tasks",
    api({
      method: "post",
      path: "/boards/{boardId}/tasks",
      tags: ["Tasks"],
      summary: "Crear tarea",
      security: [{ cookieAuth: [] }],
      parameters: [{ name: "boardId", in: "path", required: true, schema: { type: "integer" } }],
      request: {
        body: {
          content: {
            "application/json": { schema: taskCreateSchema },
          },
        },
      },
      responses: { 201: { description: "Tarea creada" } },
    }),

    authRequired,
    authorize(Role.EDITOR),
    validate(taskCreateSchema),

    async (req, res) => {
      const boardId = Number(req.params.boardId)
      const task = await prisma.task.create({
        data: {
          ...req.body,
          boardId,
          creatorId: req.userId!,
        },
      })
      res.status(201).json(task)
    },
  )

  /* ─────────────  PATCH /boards/:boardId/tasks/:taskId  ───────────── */
  app.patch(
    "/api/boards/:boardId/tasks/:taskId",
    api({
      method: "patch",
      path: "/boards/{boardId}/tasks/{taskId}",
      tags: ["Tasks"],
      summary: "Actualizar tarea",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "boardId", in: "path", required: true, schema: { type: "integer" } },
        { name: "taskId", in: "path", required: true, schema: { type: "integer" } },
      ],
      request: {
        body: {
          content: {
            "application/json": { schema: taskUpdateSchema },
          },
        },
      },
      responses: { 200: { description: "Tarea actualizada" } },
    }),

    authRequired,
    authorize(Role.EDITOR),
    validate(taskUpdateSchema),

    async (req, res) => {
      const boardId = Number(req.params.boardId)
      const taskId = Number(req.params.taskId)

      const existing = await prisma.task.findFirst({ where: { id: taskId, boardId } })
      if (!existing) {
        res.status(404).json({ message: "Tarea no encontrada" })
        return
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: req.body,
      })
      res.json(task)
    },
  )

  /* ─────────────  DELETE /boards/:boardId/tasks/:taskId  ───────────── */
  app.delete(
    "/api/boards/:boardId/tasks/:taskId",
    api({
      method: "delete",
      path: "/boards/{boardId}/tasks/{taskId}",
      tags: ["Tasks"],
      summary: "Eliminar tarea",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "boardId", in: "path", required: true, schema: { type: "integer" } },
        { name: "taskId", in: "path", required: true, schema: { type: "integer" } },
      ],
      responses: { 200: { description: "Tarea eliminada" } },
    }),

    authRequired,
    authorize(Role.EDITOR),

    async (req, res) => {
      const boardId = Number(req.params.boardId)
      const taskId = Number(req.params.taskId)

      const exists = await prisma.task.findFirst({ where: { id: taskId, boardId } })
      if (!exists) {
        res.status(404).json({ message: "Tarea no encontrada" })
        return
      }

      await prisma.task.delete({ where: { id: taskId } })
      res.json({ message: "Tarea eliminada" })
    },
  )

  /* ─────────────  DELETE /boards/:boardId/tasks (bulk)  ───────────── */
  app.delete(
    "/api/boards/:boardId/tasks",
    api({
      method: "delete",
      path: "/boards/{boardId}/tasks",
      tags: ["Tasks"],
      summary: "Eliminar tareas completadas en lote",
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: "boardId", in: "path", required: true, schema: { type: "integer" } },
        { name: "completed", in: "query", required: true, schema: { type: "boolean" } },
      ],
      responses: { 200: { description: "Cantidad eliminada" } },
    }),

    authRequired,
    authorize(Role.EDITOR),

    async (req, res) => {
      const boardId = Number(req.params.boardId)
      const completed = req.query.completed === "true"

      const { count } = await prisma.task.deleteMany({ where: { boardId, completed } })
      res.json({ deleted: count })
    },
  )
}
