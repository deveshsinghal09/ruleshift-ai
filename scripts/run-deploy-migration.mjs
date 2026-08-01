import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import nextEnvironment from "@next/env";

const { loadEnvConfig } = nextEnvironment;
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required for a deployment migration.");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(databaseUrl);
} catch {
  console.error("DATABASE_URL must be a valid PostgreSQL URL.");
  process.exit(1);
}

if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
  console.error("DATABASE_URL must use the postgresql:// or postgres:// protocol.");
  process.exit(1);
}

const databaseName = decodeURIComponent(parsed.pathname.slice(1));
const confirmation = process.argv
  .slice(2)
  .find((argument) => argument.startsWith("--confirm-database="))
  ?.slice("--confirm-database=".length);

if (!databaseName || confirmation !== databaseName) {
  console.error(
    "Migration refused. Re-run with --confirm-database=<exact database name> after verifying the target and backup.",
  );
  process.exit(1);
}

const prismaCli = fileURLToPath(
  new URL("../node_modules/prisma/build/index.js", import.meta.url),
);
const result = spawnSync(
  process.execPath,
  [prismaCli, "migrate", "deploy"],
  {
    env: process.env,
    stdio: "inherit",
  },
);
if (result.error) {
  console.error("Unable to start the deployment migration command.");
}
process.exit(result.status ?? 1);
