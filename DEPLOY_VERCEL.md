# Deploy Quizly on Vercel (no VPS)

Quizly uses Next.js 16 and Prisma 6 backed by PostgreSQL. The source contains no production database credentials. Vercel hosts the Next.js app; use managed PostgreSQL separately.

## 1. Repository
Push the deployment-ready changes from this local checkout to a GitHub repository you control or have permission to modify. In Vercel, New Project -> Import Git Repository. Select the repo; root directory is `.`; framework is Next.js.

## 2. Hosted PostgreSQL
In Vercel Storage / Marketplace, create Prisma Postgres (Free for evaluation if eligible), preferably close to the Vercel function region, and connect it to the project. This normally creates `DATABASE_URL`. Use a separate database for preview deployments; never point untrusted preview builds to a production database.

## 3. Production environment variables
- `DATABASE_URL`: Managed PostgreSQL connection string supplied by the database integration. Use a pooled runtime endpoint once appropriate for production traffic.
- `QUIZLY_AUTH_SECRET`: A newly generated, high-entropy, private random value. Never publish or commit it.
- `AI_PROVIDER`: `mock` for the initial deployment; no AI API billing.
- `NEXT_PUBLIC_APP_URL`: Set to the final deployed HTTPS URL and redeploy when it is known.
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

This checkout passed local TypeScript checks, 85 tests, and Next.js production build on 2026-10-16; production PostgreSQL and Vercel deployment still require account-side provisioning and runtime verification.
