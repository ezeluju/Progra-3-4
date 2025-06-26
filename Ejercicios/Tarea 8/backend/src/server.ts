// src/server.ts
// ---------------------------------------------------------------------------
//  Express bootstrap
// ---------------------------------------------------------------------------

import 'dotenv/config'
import express  from 'express'
import helmet   from 'helmet'
import cors     from 'cors'
import cookieParser from 'cookie-parser'

/* Swagger (UI) */
import swaggerUi from 'swagger-ui-express'
import { buildSpec } from './openapi'   // 🔑 genera el documento OpenAPI

/* Routers modulares */
import { authRoutes }       from './routes/auth.routes'
import { boardRoutes }      from './routes/boards.routes'
import { taskRoutes }       from './routes/tasks.routes'
import { preferenceRoutes } from './routes/preferences.routes'

const app = express()

/* ───── Middlewares globales ─────────────────────────────────────────── */
app.use(helmet())
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

/* ───── Rutas ─────────────────────────────────────────────────────────── */
authRoutes(app)
boardRoutes(app)
taskRoutes(app)
preferenceRoutes(app)

/* ───── Healthcheck ──────────────────────────────────────────────────── */
app.get('/ping', (_req, res) => {
  res.json({ ok: true })
})

/* ───── Swagger UI (OpenAPI v3) ──────────────────────────────────────── */
app.use('/docs', swaggerUi.serve, swaggerUi.setup(buildSpec()))

/* ───── Start server ─────────────────────────────────────────────────── */
const PORT = process.env.PORT ?? 4000
app.listen(PORT, () =>
  console.log(`🚀 API lista en http://localhost:${PORT} — Swagger en /docs`),
)
