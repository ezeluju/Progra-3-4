// src/api.ts
// ---------------------------------------------------------------------------
// Helper `api()` → registra la ruta en el OpenAPI Registry
// ---------------------------------------------------------------------------
// Uso:
//
//   app.post('/ruta',
//     api({                                   
//       method: 'post',
//       path:   '/auth/register',
//       summary:'Registrar usuario',
//       tags:   ['Auth'],
//       request: { … },
//       responses: { 201: { description: 'Ok' } }
//     }),
//     validate(schema),                       
//     handler
//   )
//
// ---------------------------------------------------------------------------

import type { RequestHandler } from 'express'
import type { RouteConfig }   from '@asteasolutions/zod-to-openapi'
import { registry }           from './openapi'

export const api = (config: RouteConfig): RequestHandler => {
  // 1) Registrar la definición en el documento OpenAPI
  registry.registerPath(config)

  // 2) Middleware que no hace nada — sólo permite continuar la cadena
  return (_req, _res, next) => next()
}
