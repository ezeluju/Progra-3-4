// src/swagger.ts
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Boards API',
      version: '1.0.0',
      description: 'Backend UAP – Tableros, Tareas y Auth',
    },
    servers: [
      { url: 'http://localhost:4000/api' }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts'],
}

const spec = swaggerJSDoc(options)

export function setupSwagger(app: Express): void {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))
}
