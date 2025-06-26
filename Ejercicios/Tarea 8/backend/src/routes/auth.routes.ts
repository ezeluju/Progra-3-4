// src/routes/auth.routes.ts
// ---------------------------------------------------------------------------
//  Authentication Routes
// ---------------------------------------------------------------------------
//  Este módulo define los endpoints de autenticación y genera la documentación
//  OpenAPI consumida por Swagger. Los bloques `/** @openapi ... */` NO deben
//  eliminarse: son parseados para construir la spec.  Encima de cada ruta
//  encontrarás un encabezado breve `//` que resume la lógica interna.
// ---------------------------------------------------------------------------

import type { Express } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "../db"
import { validate } from "../validate"
import { registerSchema, loginSchema } from "../schemas"
import { authRequired } from "../auth"

/* --------------------------------------------------------------------------
 * Helper: Generar JWT
 * -------------------------------------------------------------------------- */
const signToken = (id: number) =>
  jwt.sign({}, process.env.JWT_SECRET!, {
    expiresIn: "7d",
    subject: id.toString(),
  })

export function authRoutes(app: Express): void {
  // ------------------------------------------------------------------------
  // Registro de usuario
  // ------------------------------------------------------------------------
  /**
   * @openapi
   * /auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Registrar usuario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/RegisterBody' }
   *     responses:
   *       201: { description: Usuario creado }
   *       409: { description: Email en uso }
   */
  app.post("/api/auth/register", validate(registerSchema), async (req, res) => {
    const { email, name, password } = req.body
    const bcrypt = await import("bcrypt")
    const hash = await bcrypt.hash(password, 12)

    try {
      const user = await prisma.user.create({ data: { email, name, passwordHash: hash } })
      const token = signToken(user.id)
      res.cookie("token", token, { httpOnly: true, sameSite: "lax" })
      res.status(201).json({ id: user.id, email: user.email })
    } catch {
      res.status(409).json({ message: "Email en uso" })
    }
  })

  // ------------------------------------------------------------------------
  // Inicio de sesión
  // ------------------------------------------------------------------------
  /**
   * @openapi
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Iniciar sesión
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/LoginBody' }
   *     responses:
   *       200: { description: Sesión iniciada }
   *       401: { description: Credenciales inválidas }
   */
  app.post("/api/auth/login", validate(loginSchema), async (req, res) => {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(401).json({ message: "Credenciales inválidas" })
      return
    }

    const bcrypt = await import("bcrypt")
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      res.status(401).json({ message: "Credenciales inválidas" })
      return
    }

    const token = signToken(user.id)
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" })
    res.json({ id: user.id, email: user.email })
  })

  // ------------------------------------------------------------------------
  // Cierre de sesión
  // ------------------------------------------------------------------------
  /**
   * @openapi
   * /auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: Cerrar sesión
   *     security: [{ cookieAuth: [] }]
   *     responses:
   *       200: { description: Sesión cerrada }
   */
  app.post("/api/auth/logout", authRequired, (_req, res) => {
    res.clearCookie("token")
    res.json({ message: "Bye!" })
  })

  // ------------------------------------------------------------------------
  // Obtener usuario actual
  // ------------------------------------------------------------------------
  /**
   * @openapi
   * /auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Obtener usuario autenticado
   *     security: [{ cookieAuth: [] }]
   *     responses:
   *       200:
   *         description: Datos del usuario
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id: { type: integer }
   *                 email: { type: string }
   *                 name: { type: string }
   */
  app.get("/api/auth/me", authRequired, async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, email: true, name: true },
    })
    res.json(user)
  })
}
