// src/validate.ts
import { ZodTypeAny } from 'zod'
import type { RequestHandler } from 'express'

/**
 * Devuelve un middleware Express que valida `req.body`
 * contra el esquema Zod dado. Si falla, responde 400.
 */
export function validate(schema: ZodTypeAny): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ message: 'Invalid body', errors: result.error.issues })
      return
    }
    req.body = result.data
    next()
  }
}
