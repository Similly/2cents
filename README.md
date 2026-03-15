# 2cents

Production-ready personal essay blog built with Next.js, Prisma, PostgreSQL, TipTap, next-intl, Auth.js, Docker, and Caddy.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + reusable shadcn-style UI primitives
- Prisma + PostgreSQL
- TipTap rich text editor
- next-intl (default locale `de`, `en` ready)
- Auth.js credentials login (single admin)
- Zod validation
- Docker multi-stage image + docker-compose
- Caddy reverse proxy with automatic TLS

## Features

- Public pages
  - `/` home with featured + recent essays
  - `/archiv` with search, category and tag filtering
  - `/about` seeded editable profile/content
  - `/essay/[slug]` long-form reading layout, metadata, related essays
- Admin/editor
  - `/login` secure credentials login
  - `/editor` draft/published overview
  - `/editor/posts/[id]` TipTap writing studio with toolbar, preview/split mode, autosave indicator, save draft/publish, cover image upload
- SEO/distribution
  - Dynamic metadata + Open Graph
  - `sitemap.xml`
  - `robots.txt`
  - `rss.xml`
- Bilingual-ready architecture
  - Locale-aware routes via `next-intl`
  - `Post` + `PostTranslation` split model
  - German-first content, English optional

## Project Structure

```txt
app/
  [locale]/
    (public)/
    (auth)/login/
    (editor)/editor/
  api/
  rss.xml/
components/
  public/
  editor/
  ui/
lib/
i18n/
messages/
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Environment

Copy `.env.example` to `.env` and adjust values.

```bash
cp .env.example .env
```

Important variables:

- `DATABASE_URL`: Postgres URL for host tools/dev (`localhost:5434`)
- `DOCKER_DATABASE_URL`: Postgres URL used inside Docker app container (`postgres:5432`)
- `POSTGRES_HOST_PORT`: host port for Docker Postgres (`5434`)
- `UPLOAD_DIR`: upload path for host dev (`public/uploads`)
- `DOCKER_UPLOAD_DIR`: upload path inside Docker app (`/app/public/uploads`)
- `NEXTAUTH_SECRET`: long random secret
- `NEXTAUTH_URL`: public app URL
- `APP_BASE_URL`: canonical URL used for sitemap/rss/metadata
- `APP_DOMAIN`: domain used by Caddy
- `CADDY_EMAIL`: email for TLS cert management
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: seeded first admin credentials

## Local Development

1. Install dependencies

```bash
npm install
```

2. Run database (Docker, exposed on host port 5434 by default)

```bash
docker compose up -d postgres
```

3. Run migrations + seed

Run from your host machine:

```bash
npm run prisma:migrate
npm run db:seed
```

Run from Docker app container:

```bash
docker compose run --rm app npm run prisma:migrate
docker compose run --rm app npm run db:seed
```

4. Start app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Production VPS Deployment (Ubuntu, Docker + Caddy)

1. Install Docker + Compose plugin on VPS.
2. Clone this repo.
3. Create `.env` from template and set production values.
4. Start stack:

```bash
docker compose up -d --build
```

This starts:

- `postgres` (persistent volume: `postgres_data`)
- `app` (Next.js production container)
- `caddy` (TLS termination + reverse proxy)

5. Run seed once (optional but recommended):

```bash
docker compose exec app npm run db:seed
```

## Media Upload Persistence

Uploads are stored in `/app/public/uploads` in the container, mapped to Docker volume `uploads_data`.

## Database Model Notes

- `Post` stores shared metadata (status, cover, featured, publish date)
- `PostTranslation` stores locale-specific fields (`title`, `slug`, `excerpt`, `contentJson`, `contentHtml`, SEO fields)
- `Tag`, `Category`, and pivot `PostTag`
- `SiteSettings` locale-aware profile/about content
- Auth.js tables + `User` with admin role

## Prisma Commands

- Generate client: `npm run prisma:generate`
- Apply migrations: `npm run prisma:migrate`
- Seed sample data: `npm run db:seed`
- Studio: `npm run db:studio`

## Notes

- Default active locale is German (`de`) with architecture ready for English (`en`).
- Content rendering uses stored TipTap HTML for performance.
- Upload flow is local filesystem first; easy to replace with S3-compatible storage in `lib/uploads.ts`.
