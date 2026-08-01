import nextEnvironment from "@next/env";

const { loadEnvConfig } = nextEnvironment;

export function loadTestDatabaseUrl() {
  loadEnvConfig(process.cwd(), true);
  const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL is required and must identify an isolated test database.",
    );
  }

  const parsed = new URL(databaseUrl);
  const databaseName = parsed.pathname.slice(1).toLowerCase();
  if (
    process.env.NODE_ENV === "production" ||
    /(^|[-_])prod(uction)?($|[-_])/u.test(databaseName)
  ) {
    throw new Error("Refusing to use a production-like database for tests.");
  }
  return databaseUrl;
}
