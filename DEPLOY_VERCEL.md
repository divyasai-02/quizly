# Deploy Quizly on Vercel (no VPS)

Quizly uses Next.js 16 and Prisma 6 backed by PostgreSQL. Use Vercel for the website, Next.js API functions, deployments, environment variables, and the database connection through Vercel Storage / Marketplace. The managed PostgreSQL provider runs behind the Vercel integration; there is no VPS or self-managed server.

## 1. Repository
The source is **`divyasai-02/quizly`**, branch **`deploy/vercel-hardening`**. The Vercel project **`quizly`** (project ID `prj_inpmL7of4FaJF78SO0I50ZmhtkRg`) has a READY deployment from commit `ed4a8f0`. Keep `main` untouched until release gates pass. To enable automatic Git-triggered deployments, authorize Vercel's GitHub application for `divyasai-02/quizly` in the Vercel dashboard and connect this repository; manual deployments from the branch work in the meantime.

## 2. Hosted PostgreSQL
In **Vercel Dashboard -> Quizly -> Storage / Marketplace -> Add Integration**, install **Neon Postgres** (choose the free plan if eligible) and attach it to the `quizly` project. The Vercel Marketplace automatically provisions managed PostgreSQL and injects project credentials. Verify that `DATABASE_URL` exists for the desired environment; map the provider's server-side connection variable to `DATABASE_URL` if needed. Keep **preview** and **production** data isolated using separate databases or database branches. Select the database region close to the Vercel function region; the current functions default to `iad1` (US East). Never enter database credentials in GitHub or chat.

## 3. Production environment variables
- `DATABASE_URL`: Managed PostgreSQL connection string supplied by the database integration. Use a pooled runtime endpoint once appropriate for production traffic.
- `QUIZLY_AUTH_SECRET`: Already installed as two independent encrypted Vercel environment variables (preview and production). Never publish or commit the values.
- `AI_PROVIDER`: Already set to `mock` in Vercel for preview and production; no AI API billing.
- `NEXT_PUBLIC_APP_URL`: Optional for the current code (not referenced by the application); set only if future code starts using it. Do not use a temporary preview URL as the permanent production address.
- Optional: `AUTH_SECRET` (fallback), `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` if enabling live AI integrations.

The `postinstall` script generates Prisma Client. Standard Vercel project build command is `npm run build`.

## 4. Apply database migrations
Before exposing application workflows to users, apply committed Prisma migrations exactly once using a trusted environment with access to the managed database's *direct* migration connection string:

```bash
npm run db:migrate:deploy
```

Don't commit credentials, pass connection strings in chat, or use `prisma migrate reset` in production.

## 5. Deploy and smoke-test
Deploy the project in Vercel, then check `/`, `/login`, `/register`, registration/login/logout, professor/student/admin permissions, classroom creation, quiz creation, quiz taking, and data persistence.

## Important
Do **not** run the demo seed against a public production deployment: the README publishes the demo users' default passwords. Provision secure accounts and rotate any sample credentials before making the site public. The repository's local Docker configuration is only for local development and is not needed on Vercel.

Vercel's free Hobby tier is for personal/non-commercial use, subject to its terms. Prisma Postgres Free also has usage limits. Check current plan terms before offering the site commercially.

As of 2026-10-16, the Vercel build for `ed4a8f0` is **READY**. Local TypeScript, 85 tests, and the no-database Next.js build passed. **Not yet ready for public use:** no PostgreSQL integration or migrations, end-to-end runtime checks, or production sign-off. The Vercel deployment uses Vercel Authentication protection until explicitly released.
