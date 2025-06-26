
This guide walks you through spinning up the project *from zero* using a free PostgreSQL database on **Neon**.

---

## 1  Clone the repository

```bash
git clone -> este repositorio
cd advanced-backend
```

---

## 2  Install backend dependencies

```bash
cd backend
npm install
```

---

## 3  Create your database in Neon

1. Sign up / log in to **[Neon](https://neon.tech)**.  
2. Click **“New Project”**, pick a name and region.  
3. When it finishes, open **“Connection Details”** and copy the **connection string**  
   *(starts with `postgresql://` and ends with `sslmode=require`)*.

---

## 4  Environment variables

```bash
# copy the template provided in the repo
cp .env.example .env
```

Edit **`backend/.env`**:

```env
# ⇩ paste the Neon connection string here
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require&pgbouncer=true"

# at least 32 random bytes – generate with `openssl rand -base64 32`
JWT_SECRET="your-super-secret-jwt-key"
```

> **Tip ** `pgbouncer=true` lets Prisma work smoothly with Neon’s connection pooler.

---

## 5  Create the schema in Neon

### Option A  (keep migration history)

If you have migrations committed under `prisma/migrations/`:

```bash
npx prisma migrate deploy        # applies them to Neon
```

### Option B  (just push the current model) — **recommended for fresh dev**

```bash
# generate/update Prisma Client
npx prisma generate

# create all tables as defined in schema.prisma
npx prisma db push
# add --force-reset to drop everything first (dev only):
# npx prisma db push --force-reset
```

*(Optional) seed initial data if you have a seed script:*

```bash
npx prisma db seed
```

---

## 6  Run in development

```bash
# still inside backend/
npm run dev
```

API available at **`http://localhost:4000`**  
Swagger docs at **`http://localhost:4000/docs`**

---

## 7  (Frontend – optional)

```bash
cd ../frontend
npm install

# copy & tweak env
cp .env.example .env
# .env
VITE_API=http://localhost:4000/api

npm run dev
```

---

