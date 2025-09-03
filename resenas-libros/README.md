# Plataforma de reseñas de libros

Aplicación Next.js para descubrir libros y publicar reseñas.

## Desarrollo local

```bash
npm install
npm run dev
```

## GitHub Actions

- **Build** (`.github/workflows/pr-build.yml`): se ejecuta en cada Pull Request y valida que la aplicación compile correctamente.
- **Test** (`.github/workflows/pr-test.yml`): ejecuta la suite de tests unitarios en cada Pull Request.
- **Docker Image** (`.github/workflows/docker.yml`): al mergear en `main`/`master` construye y publica una imagen en GitHub Container Registry con las etiquetas `latest`, la versión de `package.json` y el hash del commit.

## Variables de entorno

La aplicación no requiere variables de entorno especiales para ejecutarse.

## Docker

Para construir y ejecutar la imagen localmente:

```bash
docker build -t resenas-libros .
docker run -p 3000:3000 resenas-libros
```
