import { z } from 'zod'
import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

/* Registro global */
export const registry = new OpenAPIRegistry()

/* Schemas Zod a registrar */
import {
  registerSchema,
  loginSchema,
  boardCreateSchema,
  boardUpdateSchema,
  shareSchema,
  taskCreateSchema,
  taskUpdateSchema,
  prefSchema,
  taskSchema,
} from './schemas'

registry.register('RegisterBody',    registerSchema)
registry.register('LoginBody',       loginSchema)
registry.register('CreateBoardBody', boardCreateSchema)
registry.register('UpdateBoardBody', boardUpdateSchema)
registry.register('ShareBody',       shareSchema)
registry.register('TaskCreate',      taskCreateSchema)
registry.register('TaskUpdate',      taskUpdateSchema)
registry.register('PreferencesBody', prefSchema)
registry.register('Task',            taskSchema)

/* Generar spec y fusionar securitySchemes */
export function buildSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  const doc = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Task Boards API',
      version: '1.0.0',
      description: 'Backend UAP – Tableros, Tareas, Auth y Preferencias',
    },
    servers: [{ url: 'http://localhost:4000/api' }],
  })

  doc.components = {
    ...doc.components,
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in:   'cookie',
        name: 'token',
      },
    },
  }

  return doc
}
