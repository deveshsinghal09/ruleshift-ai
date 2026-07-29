import { defineConfig } from "prisma/config";

const unconfiguredLocalUrl =
  "postgresql://ruleshift:ruleshift@127.0.0.1:5432/ruleshift_unconfigured";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? unconfiguredLocalUrl,
  },
});
