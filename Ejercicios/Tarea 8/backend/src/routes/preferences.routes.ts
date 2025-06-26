// src/routes/preferences.routes.ts
// ---------------------------------------------------------------------------
//  Preferences Routes – Zod → OpenAPI
// ---------------------------------------------------------------------------

import type { Express } from 'express'

import { prisma } from '../db'
import { authRequired } from '../auth'
import { validate } from '../validate'
import { prefSchema } from '../schemas'
import { api } from '../api'

export function preferenceRoutes(app: Express): void {
  /* ─────────────  GET /preferences  ───────────── */
  app.get(
    '/api/preferences',
    api({
      method:  'get',
      path:    '/preferences',
      tags:    ['Preferences'],
      summary: 'Obtener preferencias del usuario',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Objeto de preferencias o null',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/PreferencesBody' },
                  { type: 'null' },
                ],
              },
            },
          },
        },
      },
    }),

    authRequired,

    async (req, res) => {
      const pref = await prisma.preference.findUnique({
        where: { userId: req.userId! },
      })
      res.json(pref) 
    },
  )

  /* ─────────────  PUT /preferences  ───────────── */
  app.put(
    '/api/preferences',
    api({
      method:  'put',
      path:    '/preferences',
      tags:    ['Preferences'],
      summary: 'Guardar preferencias',
      security: [{ cookieAuth: [] }],
      request: {
        body: {
          content: {
            'application/json': { schema: prefSchema },
          },
        },
      },
      responses: { 200: { description: 'Preferencias guardadas' } },
    }),

    authRequired,
    validate(prefSchema),

    async (req, res) => {
      const pref = await prisma.preference.upsert({
        where:  { userId: req.userId! },
        update: req.body,
        create: { ...req.body, userId: req.userId! },
      })
      res.json(pref)
    },
  )
}
