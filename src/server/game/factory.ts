import "server-only";
import { AiDirector } from "@/server/ai/director";
import { selectAiProvider } from "@/server/ai/providers/config";
import { getPrismaClient } from "@/server/db/client";
import { serverEnvironment } from "@/server/env";
import { GameService } from "@/server/game/service";
import { InMemoryRateLimiter } from "@/server/http/rate-limit";
import { PrismaGameSessionRepository } from "@/server/repositories/prisma-game-repository";

let gameService: GameService | undefined;

export function getGameService(): GameService {
  if (!gameService) {
    const providerSelection = selectAiProvider(serverEnvironment);
    gameService = new GameService({
      aiDirector: new AiDirector({
        provider: providerSelection.provider,
      }),
      rateLimiter: new InMemoryRateLimiter(),
      repository: new PrismaGameSessionRepository(getPrismaClient()),
    });
  }
  return gameService;
}
