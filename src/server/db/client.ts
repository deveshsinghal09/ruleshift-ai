import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { hardenPostgresSslMode } from "@/server/db/connection";
import { serverEnvironment } from "@/server/env";
import { GameServiceError } from "@/server/game/errors";

const globalDatabase = globalThis as unknown as {
  ruleshiftPrisma?: PrismaClient;
};

export function getPrismaClient(): PrismaClient {
  if (!serverEnvironment.DATABASE_URL) {
    throw new GameServiceError(
      "DATABASE_UNAVAILABLE",
      "Database persistence is not configured.",
    );
  }
  if (!globalDatabase.ruleshiftPrisma) {
    const adapter = new PrismaPg(
      hardenPostgresSslMode(serverEnvironment.DATABASE_URL),
      {
        onPoolError: () => {
          // Deliberately omit connection details and credentials.
        },
      },
    );
    globalDatabase.ruleshiftPrisma = new PrismaClient({ adapter });
  }
  return globalDatabase.ruleshiftPrisma;
}
