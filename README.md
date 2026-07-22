# Cardapio API

API Node + TypeScript para o Cardapio Digital.

## Stack

- Express
- Zod
- Drizzle ORM
- Turso/LibSQL
- JWT
- Bcrypt

## Rodando local

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

API local:

```txt
http://127.0.0.1:3333
```

## Login seed

```txt
admin@ervadoce.com
123456
```

## Variaveis para producao

```txt
DATABASE_URL=libsql://...
DATABASE_AUTH_TOKEN=...
JWT_SECRET=...
CORS_ORIGIN=https://cliente.vercel.app,https://admin.vercel.app,https://cozinha.vercel.app
```

Nunca coloque `DATABASE_AUTH_TOKEN` ou `JWT_SECRET` nos frontends.

## Endpoints principais

Publicos:

```txt
GET    /health
GET    /api/public/restaurant
GET    /api/public/categories
GET    /api/public/products
GET    /api/public/products/:id
POST   /api/public/orders
GET    /api/public/orders/:id
```

Autenticacao:

```txt
POST   /api/auth/login
GET    /api/auth/me
```

Admin:

```txt
GET    /api/admin/dashboard
GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
GET    /api/admin/orders
GET    /api/admin/orders/:id
PATCH  /api/admin/orders/:id/status
GET    /api/admin/tables
PUT    /api/admin/tables/:id
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
GET    /api/admin/settings
PUT    /api/admin/settings
```

Cozinha:

```txt
GET    /api/kitchen/orders
PATCH  /api/kitchen/orders/:id/status
```

## Teste rapido

Depois do build:

```bash
npm run smoke
```

Esse teste sobe a API temporariamente, busca produtos, faz login, acessa dashboard e cria um pedido.

## Turso

Para usar Turso em vez do banco local:

1. Crie um banco no Turso.
2. Copie a URL `libsql://...`.
3. Gere um token.
4. Configure no `.env`:

```txt
DATABASE_URL=libsql://...
DATABASE_AUTH_TOKEN=...
```

Depois rode:

```bash
npm run db:migrate
npm run db:seed
```

