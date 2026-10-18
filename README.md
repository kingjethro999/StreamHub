# StreamHub — Nigerian Streaming Platform

A vertical-video streaming platform for Nigerian creators. React + Vite frontend,
Fastify + PostgreSQL backend.

## Features

- Vertical swipe feed with a live-stream catalog and categories (Gaming, Music,
  Technology, Comedy, Entertainment)
- Email/password authentication with JWT sessions
- Channel profiles, follows, likes, comments and reposts
- Stream details, search, activity and alerts views
- Profile dashboard with Cloudinary image/video uploads
- "Going live" email notifications to a channel's followers

## Tech Stack

| Layer      | Technology                                            |
| ---------- | ----------------------------------------------------- |
| Frontend   | React 19, React Router 7, Vite 8, Tailwind CSS 4      |
| UI         | shadcn/ui primitives on Radix UI, Lucide icons        |
| Backend    | Fastify 5 (REST API + static host in production)      |
| Database   | PostgreSQL 17 (Docker locally, any managed PG in prod)|
| Auth       | JWT (`@fastify/jwt`) + bcrypt password hashing        |
| Email      | Nodemailer (SMTP)                                     |
| Media      | Cloudinary upload widget (unsigned, browser-side)     |

## Getting Started

### Prerequisites

- Node.js 20.6+ (the API uses `process.loadEnvFile`)
- pnpm (`npm i -g pnpm`)
- Docker + Docker Compose (for the local database)

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Create your environment file
cp .env.example .env
#    …then edit .env if you want to change any values.

# 3. Start PostgreSQL in Docker
pnpm db:up

# 4. Create the schema and load demo data
pnpm db:setup

# 5. Run the API and the Vite dev server together
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The API listens on
`http://localhost:4000`, and Vite proxies `/api` requests to it.

### Demo logins

All seeded accounts use the password **`streamhub123`**.

| Role   | Email                                                     |
| ------ | --------------------------------------------------------- |
| Viewer | `demo@streamhub.dev`                                      |
| Creator| `tech@streamhub.dev`, `gaming@streamhub.dev`, `music@streamhub.dev`, `comedy@streamhub.dev`, `nollywood@streamhub.dev` |

> To upload a stream you need a channel — sign in as a creator, open **Profile**,
> fill in the form and hit **Publish**, then use **Upload**.

## Configuration

All configuration lives in `.env` (gitignored — see `.env.example` for the shape).

| Variable         | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `PORT`           | API port (default `4000`)                                     |
| `CORS_ORIGIN`    | Allowed browser origin for the API (default `http://localhost:3000`) |
| `DATABASE_URL`   | PostgreSQL connection string                                  |
| `DATABASE_SSL`   | Set `true` for managed Postgres that requires TLS             |
| `POSTGRES_*`     | Consumed by `docker-compose.yml` to create the local database || `JWT_SECRET`     | Signing key for session tokens — **change in production**     |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`)                                 |
| `SMTP_*`, `MAIL_FROM` | Follower notification email. Leave `SMTP_USER`/`SMTP_PASS` empty to disable |
| `VITE_API_BASE_URL` | API base path used by the browser (default `/api`)         |
| `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned uploads |

Variables prefixed with `VITE_` are bundled into the browser build — never put
secrets there.

If port `5432` is already in use (another local Postgres), change
`POSTGRES_PORT` **and** the port inside `DATABASE_URL` to a free port, e.g.
`5434`, then run `pnpm db:up && pnpm db:setup`.

### Switching to a production database

Point `DATABASE_URL` at your managed Postgres, set `DATABASE_SSL=true`, and run
`pnpm db:migrate` once to create the schema. No other code changes are needed.

## Project Structure

```
server/
├── index.js            # Fastify bootstrap, JWT, CORS, static hosting
├── env.js              # Loads .env and exports config
├── db.js               # pg connection pool + query helpers
├── users.js            # password hashing / user helpers
├── errors.js           # { error, code } response helpers
├── routes/             # auth, channels, streams, comments, likes,
│                       # reposts, follows, notify
└── db/
    ├── schema.sql      # canonical schema (tables, triggers, indexes)
    ├── migrate.js      # applies schema.sql
    └── seed.js         # demo creators, channels and streams

src/
├── components/         # Layout, cards, feed, comments, share modal, ui/
├── pages/              # Route pages (Route definitions in App.jsx)
│   └── auth/           # Login, SignUp
├── lib/
│   ├── api/            # client.js (fetch wrapper) + index.js (domain calls)
│   └── utils.js        # cn() class helper
├── App.jsx             # Routes
├── main.jsx            # Entry point
└── index.css           # Tailwind theme tokens
```

## Available Scripts

| Script            | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `pnpm dev`        | Run the API and Vite dev server together                 |
| `pnpm dev:api`    | Run only the API (`node --watch server/index.js`)        |
| `pnpm dev:web`    | Run only the Vite dev server                             |
| `pnpm build`      | Build the frontend to `dist/`                            |
| `pnpm start`      | Run the API, serving the built `dist/` in production     |
| `pnpm lint`       | Lint the codebase with ESLint                            |
| `pnpm db:up`      | Start the Docker PostgreSQL database                     |
| `pnpm db:down`    | Stop the Docker PostgreSQL database                      |
| `pnpm db:migrate` | Apply `server/db/schema.sql`                             |
| `pnpm db:seed`    | Load demo data                                           |
| `pnpm db:setup`   | `db:migrate` + `db:seed`                                 |

## Deployment

```bash
pnpm install
pnpm build          # emits dist/
pnpm start          # Fastify serves the API and dist/ on $PORT
```

Set `NODE_ENV=production`, a strong `JWT_SECRET`, and your production
`DATABASE_URL` (+ `DATABASE_SSL=true`) in the environment.

## License

MIT
