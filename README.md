# Quizly

Quizly is a full-stack Next.js quiz platform with professor, student, and admin experiences, local password authentication, role-based access control, AI-assisted quiz workflows, analytics, reports, and classroom management.

## Tech Stack

- Next.js 14
- React 18
- Prisma ORM
- PostgreSQL for local/staging/production-ready database workflows
- Vitest for unit and route tests
- Docker Compose for local PostgreSQL

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment values:

```bash
cp .env.example .env
```

3. Start PostgreSQL:

```bash
docker compose up -d postgres
```

4. Generate Prisma client and apply migrations:

```bash
npm run db:generate
npm run db:migrate:dev -- --name init_postgres
```

5. Seed demo data:

```bash
npm run db:seed
```

6. Start the app:

```bash
npm run dev
```

## Environment Variables

`.env.example` includes the standard local setup:

```env
DATABASE_URL="postgresql://quizly:quizly_password@localhost:5433/quizly?schema=public"
QUIZLY_AUTH_SECRET="replace-with-secure-secret"
AUTH_SECRET="replace-with-secure-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AI_PROVIDER="mock"
ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL="claude-3-5-sonnet-latest"
```

Notes:

- `QUIZLY_AUTH_SECRET` is the runtime auth secret currently used by the app.
- `AUTH_SECRET` is also accepted as a compatibility fallback.
- `AI_PROVIDER="mock"` keeps Quizly in deterministic demo mode.
- Set `AI_PROVIDER="claude"` and `ANTHROPIC_API_KEY` to enable live Anthropic requests.
- If Claude is requested but unavailable, Quizly falls back to the mock provider and surfaces a UI warning instead of failing silently.
- Do not commit real secrets.

## AI Provider Setup

Quizly now supports a provider abstraction for AI quiz generation and explanation drafting:

- `mock`: deterministic local demo mode with no external API calls.
- `claude`: Anthropic-backed mode using `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`.

Behavior:

- Quiz/question/explanation responses are JSON-validated server-side before the UI receives them.
- Oversized pasted notes are trimmed safely and surfaced as warnings.
- If Claude returns invalid JSON, times out, or is missing credentials, Quizly falls back to the mock provider.
- The professor-facing AI UI shows whether Claude is connected, whether mock mode is active, or whether fallback was used.

## AI Material Upload MVP

Quizly's AI quiz-generation agent now supports professor-side material parsing for:

- `.txt`
- `.md`
- `.markdown`

Current limits and behavior:

- Max upload size: `5MB`
- Extracted text is trimmed to about `20,000` characters for safer AI generation
- Files are parsed in the request flow and are not permanently stored in this MVP
- Uploaded material is previewed before generation so professors can confirm parsing quality
- PDF, DOCX, and PPTX remain limited/coming-soon in this MVP path

Privacy notes:

- Do not upload confidential or sensitive student data
- AI-drafted content still requires professor review before publishing

## Database Commands

```bash
npm run db:generate
npm run db:migrate:dev
npm run db:migrate:deploy
npm run db:seed
npm run db:studio
npm run db:reset
npm run db:push
```

Legacy SQLite helper:

```bash
npm run db:push-local:sqlite-legacy
```

Use the SQLite helper only for older MVP recovery work. The normal local workflow is PostgreSQL plus Prisma migrations.

## Quality Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Demo Credentials

- Professor: `professor@quizly.local` / `password123`
- Student: `student@quizly.local` / `password123`
- Admin: `admin@quizly.local` / `password123`

## Useful Routes

- `/`
- `/login`
- `/register`
- `/professor/dashboard`
- `/student/dashboard`
- `/admin/dashboard`
- `/professor/create-quiz`
- `/professor/question-bank`
- `/professor/templates`
- `/professor/reports`
- `/student/practice`
- `/student/study-room`
- `/admin/users`
- `/admin/ai-moderation`

## Troubleshooting

- If `docker compose up -d postgres` fails, make sure Docker Desktop is running and the Docker engine is healthy.
- If Prisma commands complain about missing `DATABASE_URL`, confirm `.env` exists at the repo root.
- If migrations fail because the database already exists in a bad state, run `npm run db:reset` for local-only recovery.
- If the app cannot log in after env changes, confirm `QUIZLY_AUTH_SECRET` or `AUTH_SECRET` is set consistently.
- The default Docker-first local setup uses port `5433` to avoid collisions with existing host PostgreSQL services.
