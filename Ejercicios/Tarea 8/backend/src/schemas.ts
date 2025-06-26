import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { Role } from './db'

extendZodWithOpenApi(z)

/* ───── Auth ───── */
export const registerSchema = z.object({
  email: z.string().email(),
  name:  z.string().min(1),
  password: z.string().min(6),
}).openapi('RegisterBody')

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
}).openapi('LoginBody')

/* ───── Boards ───── */
export const boardCreateSchema = z.object({
  name: z.string().min(1),
}).openapi('CreateBoardBody')

export const boardUpdateSchema = boardCreateSchema.openapi('UpdateBoardBody')

export const shareSchema = z.object({
  email: z.string().email(),
  role:  z.nativeEnum(Role).refine(r => r !== Role.OWNER, { message: 'No puedes asignar OWNER' }),
}).openapi('ShareBody')

/* ───── Tasks ───── */
export const taskCreateSchema = z.object({
  title:   z.string().min(1),
  content: z.string().optional(),
}).openapi('TaskCreate')

export const taskUpdateSchema = z.object({
  title:     z.string().min(1).optional(),
  content:   z.string().optional(),
  completed: z.boolean().optional(),
}).openapi('TaskUpdate')

/* ── Schema de salida Task ──*/
export const taskSchema = z.object({
  id:         z.number().int(),
  title:      z.string(),
  completed:  z.boolean(),
  creatorId:  z.number().int(),
  createdAt:  z.string().datetime(),
}).openapi('Task')

/* ───── Preferences ───── */
export const prefSchema = z.object({
  autoRefreshInterval: z.number().int().positive().optional(),
  taskView: z.enum(['grid', 'list']).optional(),
}).openapi('PreferencesBody')
