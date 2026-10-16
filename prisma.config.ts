import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  engine: "classic",
  // Generate Prisma Client during Vercel install, before a database is attached.
  // Any real database operations still require a valid DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL ?? "" }
});
