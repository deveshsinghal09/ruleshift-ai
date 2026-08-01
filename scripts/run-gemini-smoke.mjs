import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import nextEnvironment from "@next/env";

const { loadEnvConfig } = nextEnvironment;
loadEnvConfig(process.cwd());

if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) {
  console.error(
    "GEMINI_API_KEY and GEMINI_MODEL must be configured securely before the live smoke test.",
  );
  process.exit(1);
}

const vitestCli = fileURLToPath(
  new URL("../node_modules/vitest/vitest.mjs", import.meta.url),
);
const child = spawn(
  process.execPath,
  [vitestCli, "run", "src/server/ai/providers/gemini.live.test.ts"],
  {
    env: { ...process.env, RUN_GEMINI_SMOKE: "1" },
    stdio: "inherit",
  },
);

child.once("error", () => process.exit(1));
child.once("exit", (code) => process.exit(code ?? 1));
