# express-ts-drizzle-starter

A production-ready Express + TypeScript backend starter with Drizzle ORM
(Postgres), JWT auth, Winston logging, ESLint/Prettier, and Husky
pre-commit hooks.

Use it as a template for new Node.js services — clone, set your env vars,
run the initial migration, and start building your domain on top of the
user/auth module that's already wired up.

## Features

- **Express 5** + **TypeScript** with strict typing end-to-end
- **Drizzle ORM** over a **Postgres** pool, with migrations
- **JWT auth** (access + refresh tokens) — register / login / refresh /
  logout / `me` / change-password / update-profile
- **Account lockout** after repeated failed logins
- **express-validator** request validation with a shared `validate`
  middleware
- **Centralized error handling** via `ApiError` + a global error middleware
- **Winston logger** with HTTP access logging piped through Morgan
- **CORS** + **cookie-parser** + JSON body parsing pre-configured
- **ESLint** + **Prettier**, enforced on commit via **Husky** + **lint-staged**
- Typed env loader that fails fast if required variables are missing

## Stack

| Layer       | Choice                                |
| ----------- | ------------------------------------- |
| Runtime     | Node.js                               |
| Language    | TypeScript                            |
| HTTP        | Express 5                             |
| ORM         | Drizzle ORM                           |
| Database    | PostgreSQL                            |
| Auth        | JSON Web Tokens (HS256)               |
| Hashing     | bcrypt                                |
| Validation  | express-validator                     |
| Logging     | Winston + Morgan                      |
| Tooling     | ESLint, Prettier, Husky, lint-staged  |

## Quick start

```bash
# 1. Use this template (or clone it)
git clone <your-repo-url> my-service
cd my-service

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
#   …then edit .env with your DB credentials and JWT secrets

# 4. Apply the initial migration
npm run db:migrate

# 5. Start the dev server (with hot reload)
npm run dev
```

The server listens on `PORT` (default `3000`) at `http://localhost:3000`.
A health check is available at `GET /api/v1/health`.

## Environment variables

| Variable                  | Required | Default                 | Description                          |
| ------------------------- | -------- | ----------------------- | ------------------------------------ |
| `NODE_ENV`                | no       | `development`           | `development` / `production` / `test`|
| `PORT`                    | no       | `3000`                  | HTTP port                            |
| `APP_NAME`                | no       | `zenith-backend`        | App identifier                       |
| `DB_HOST`                 | yes      | —                       | Postgres host                        |
| `DB_PORT`                 | no       | `5432`                  | Postgres port                        |
| `DB_NAME`                 | yes      | —                       | Database name                        |
| `DB_USER`                 | yes      | —                       | Database user                        |
| `DB_PASSWORD`             | yes      | —                       | Database password                    |
| `JWT_ACCESS_SECRET`       | yes      | —                       | Secret for signing access tokens     |
| `JWT_REFRESH_SECRET`      | yes      | —                       | Secret for signing refresh tokens    |
| `JWT_ACCESS_EXPIRES_IN`   | no       | `15m`                   | Access token TTL                     |
| `JWT_REFRESH_EXPIRES_IN`  | no       | `7d`                    | Refresh token TTL                    |
| `FRONTEND_URL`            | no       | `http://localhost:5173` | Allowed CORS origin                  |

`.env`, `.env.production`, and `.env.test` are auto-selected by
`NODE_ENV`.

## Scripts

| Script              | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the server with nodemon (hot reload)         |
| `npm run build`     | Compile TypeScript to `dist/`                      |
| `npm start`         | Run the compiled production build                  |
| `npm run lint`      | ESLint the codebase                                |
| `npm run lint:fix`  | ESLint with autofix                                |
| `npm run format`    | Prettier-format all source files                   |
| `npm run format:check` | Check formatting without writing                |
| `npm run type-check`| `tsc --noEmit`                                     |
| `npm run db:generate` | Generate a new Drizzle migration from the schema |
| `npm run db:migrate`  | Apply pending migrations                         |
| `npm run db:push`     | Push the schema directly to the DB (dev only)    |
| `npm run db:studio`   | Open Drizzle Studio                              |
| `npm run db:drop`     | Drop a migration                                 |

## Project structure

```
src/
├── app.ts                       # Express bootstrap
├── index.ts                     # Process entrypoint
├── config/
│   └── env.config.ts            # Typed env loader
├── database/
│   └── connection.ts            # pg Pool + Drizzle instance
├── logger/
│   └── winston.logger.ts        # Winston setup
├── middlewares/
│   ├── auth.middleware.ts       # JWT verification
│   ├── error-handler.middleware.ts
│   ├── morgan.middleware.ts
│   └── validate.middleware.ts
├── utils/
│   ├── api-error.ts             # ApiError class
│   ├── api-response.ts          # ApiResponse envelope
│   └── async-handler.ts         # async/await error forwarder
├── constants/
│   └── error-message.constants.ts
├── types/                       # Shared types + Express augments
├── schema/                      # Drizzle schema barrels
└── app/
    └── user/                    # User module (auth + profile)
        ├── controllers/
        ├── routes/
        ├── services/
        ├── schema/
        ├── types/
        └── validators/
```

## Built-in API (user module)

Base path: `/api/v1/users`

| Method | Path                | Auth | Description                       |
| ------ | ------------------- | ---- | --------------------------------- |
| POST   | `/register`         | —    | Create a new user                 |
| POST   | `/login`            | —    | Issue access + refresh tokens     |
| POST   | `/refresh`          | —    | Issue a new access token          |
| POST   | `/logout`           | JWT  | Clear auth cookies                |
| GET    | `/me`               | JWT  | Current user                      |
| POST   | `/change-password`  | JWT  | Change own password               |
| PATCH  | `/me`               | JWT  | Update profile                    |

Tokens are returned in the response body **and** set as `httpOnly`
cookies (`accessToken`, `refreshToken`).

## Git hooks

`husky` runs `lint-staged` on every commit, which applies
`eslint --fix` and `prettier --write` to staged `src/**/*.ts` files.
The hooks install automatically on `npm install` via the `prepare` and
`postinstall` scripts.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, commit style, and PR
guidelines. By participating you agree to abide by the
[Code of Conduct](./CODE_OF_CONDUCT.md).

## License

[MIT](./LICENSE) © codemitrayt
