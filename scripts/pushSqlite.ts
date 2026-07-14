import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import sqlite3 from "sqlite3";

function readDatabaseUrlFromEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return null;
  const match = readFileSync(envPath, "utf8").match(/^DATABASE_URL=(.+)$/m);
  return match ? match[1].trim().replace(/^"(.*)"$/, "$1") : null;
}

function resolveSqlitePath() {
  const databaseUrl = process.env.DATABASE_URL?.trim() || readDatabaseUrlFromEnvFile();
  if (!databaseUrl) {
    return resolve(process.cwd(), "dev.db");
  }

  if (!databaseUrl.startsWith("file:")) {
    console.error("SQLite legacy bootstrap only supports file: DATABASE_URL values.");
    console.error("Use npm run db:migrate:dev against PostgreSQL for the standard local workflow.");
    process.exit(1);
  }

  const relativePath = databaseUrl.slice("file:".length);
  return resolve(process.cwd(), relativePath);
}

const dbPath = resolveSqlitePath();

if (existsSync(dbPath)) {
  try {
    unlinkSync(dbPath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EBUSY" || code === "EPERM") {
      console.error(`Could not reset ${dbPath} because SQLite is locked.`);
      console.error("Stop the dev server and rerun npm run db:push-local.");
      process.exit(1);
    }
    throw error;
  }
}

const sql = execSync("npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script", {
  cwd: process.cwd(),
  encoding: "utf8"
});

const statements = sql
  .split("\n")
  .filter((line) => !line.startsWith("warn "))
  .join("\n");

const db = new sqlite3.Database(dbPath);

db.exec("PRAGMA foreign_keys=OFF;\n" + statements + "\nPRAGMA foreign_keys=ON;", (error) => {
  db.close();
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`SQLite schema created at ${dbPath}`);
});
