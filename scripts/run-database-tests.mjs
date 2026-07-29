import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import nextEnvironment from "@next/env";

const { loadEnvConfig } = nextEnvironment;
loadEnvConfig(process.cwd(), true);

if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  console.error(
    "Set TEST_DATABASE_URL or DATABASE_URL in .env.local before running database tests.",
  );
  process.exit(1);
}

const vitestCli = fileURLToPath(
  new URL("../node_modules/vitest/vitest.mjs", import.meta.url),
);
const result = spawnSync(
  process.execPath,
  [vitestCli, "run", "--config", "vitest.database.config.ts"],
  { env: process.env, stdio: "inherit" },
);
if (result.error) {
  console.error("Unable to start the database test runner.");
}
process.exit(result.status ?? 1);
