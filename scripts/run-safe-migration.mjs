import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import nextEnvironment from "@next/env";

const { loadEnvConfig } = nextEnvironment;
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error(
    "DATABASE_URL is required. Configure an explicitly identified development database in .env.local.",
  );
  process.exit(1);
}

const parsed = new URL(databaseUrl);
const databaseName = parsed.pathname.slice(1).toLowerCase();
const environment = process.env.NODE_ENV ?? "development";
if (
  environment === "production" ||
  /(^|[-_])prod(uction)?($|[-_])/u.test(databaseName)
) {
  console.error(
    "Refusing to run a development migration against a production-like database.",
  );
  process.exit(1);
}

const prismaCli = fileURLToPath(
  new URL("../node_modules/prisma/build/index.js", import.meta.url),
);
const result = spawnSync(
  process.execPath,
  [prismaCli, "migrate", "dev"],
  { env: process.env, stdio: "inherit" },
);
if (result.error) {
  console.error("Unable to start the local Prisma CLI.");
}
process.exit(result.status ?? 1);
