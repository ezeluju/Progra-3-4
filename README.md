## No lo pude hostear debido al peso de las librerias utilizadas (7gb aprox), ademas de la ram utilizada, y habia que garpar host

# VoiceID Monorepo

Sistema de **registro y autenticación de usuarios por voz** utilizando **FastAPI** (backend) y **Expo React Native** (cliente).

## 📂 Estructura del proyecto

- `server/` – Backend en **FastAPI**  
- `app/` – Cliente en **Expo React Native**

## ⚡ Inicio rápido

### 1. Base de datos (Supabase)
Ejecutá el script SQL que está en [`server/README.md`](server/README.md) para crear la tabla y el índice necesarios.

### 2. Backend
Revisá [`server/README.md`](server/README.md) para:  
- Variables de entorno requeridas.  
- Instrucciones para correr el servidor.  

### 3. Cliente
Revisá [`app/README.md`](app/README.md) para:  
- Cómo iniciar la aplicación de Expo.  

## 🔑 Endpoints principales

A continuación, algunos ejemplos usando **cURL**:

### ➕ Registrar usuario (enroll)
```bash
curl -F "name=Alice" -F "file=@sample.wav" http://localhost:8000/enroll
```
### 🔍 Identificar usuario
```bash
curl -F "file=@sample.wav" -F "threshold=0.75" http://localhost:8000/identify
```
### 🔐 Iniciar sesión por voz
```bash
curl -F "file=@sample.wav" -F "threshold=0.75" http://localhost:8000/login-by-voice
```
El threshold va de 0 a 1, y seria el porcentaje de similitud entre un audio y otro, cuanto mas bajo menos coincide la nueva voz con la guardada.
