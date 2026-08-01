import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadTestDatabaseUrl } from "./test-database-url.mjs";

let databaseUrl;
try {
  databaseUrl = loadTestDatabaseUrl();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Invalid test database configuration.");
  process.exit(1);
}

const prismaCli = fileURLToPath(
  new URL("../node_modules/prisma/build/index.js", import.meta.url),
);
const result = spawnSync(
  process.execPath,
  [prismaCli, "migrate", "deploy"],
  {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  },
);
if (result.error) {
  console.error("Unable to start the Prisma test migration.");
}
process.exit(result.status ?? 1);
