import {
  Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";
import type { SessionStatus } from "@/generated/prisma/enums";
import { validateGameState } from "@/domain/game/schemas";
import { persistedSessionSchema } from "@/server/game/schemas";
import type {
  AbandonOutcome,
  CreateStoredSessionInput,
  GameSessionRepository,
  PersistTurnInput,
  PersistTurnOutcome,
  StoredSession,
  StoredSessionStatus,
  StoredSessionSummary,
} from "@/server/game/repository";

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toDatabaseStatus(status: StoredSessionStatus): SessionStatus {
  switch (status) {
    case "playing":
      return "PLAYING";
    case "victory":
      return "VICTORY";
    case "defeat":
      return "DEFEAT";
    case "abandoned":
      return "ABANDONED";
  }
}

function fromDatabaseStatus(status: SessionStatus): StoredSessionStatus {
  switch (status) {
    case "PLAYING":
      return "playing";
    case "VICTORY":
      return "victory";
    case "DEFEAT":
      return "defeat";
    case "ABANDONED":
      return "abandoned";
  }
}

interface SessionRow {
  readonly abandonedAt: Date | null;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly currentSnapshot: Prisma.JsonValue;
  readonly ownerTokenHash: string;
  readonly stateVersion: number;
  readonly status: SessionStatus;
  readonly updatedAt: Date;
}

function toStoredSession(row: SessionRow): StoredSession {
  return {
    abandonedAt: row.abandonedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    ownerTokenHash: row.ownerTokenHash,
    state: validateGameState(row.currentSnapshot),
    stateVersion: row.stateVersion,
    status: fromDatabaseStatus(row.status),
    updatedAt: row.updatedAt,
  };
}

function normalizedRelations(
  sessionId: string,
  state: PersistTurnInput["afterState"],
) {
  return {
    activeRules: state.activeRules.map((rule) => ({
      activatedAtTurn: rule.activatedAtTurn,
      parameters: json(rule.parameters),
      remainingTurns: rule.remainingTurns,
      ruleId: rule.id,
      ruleKey: rule.key,
      sessionId,
      totalTurns: rule.totalTurns,
    })),
    inventoryItems: state.player.inventory.map((item) => ({
      description: item.description,
      itemId: item.id,
      name: item.name,
      quantity: item.quantity,
      rarity: item.rarity,
      sessionId,
      snapshot: json(item),
      usesRemaining: item.usesRemaining,
    })),
    npcStates: state.npcs.map((npc) => ({
      name: npc.name,
      npcId: npc.id,
      relationship: npc.relationship,
      sessionId,
      snapshot: json(npc),
    })),
  };
}

export class PrismaGameSessionRepository
  implements GameSessionRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async abandon(
    sessionId: string,
    ownerTokenHash: string,
  ): Promise<AbandonOutcome> {
    const current = await this.prisma.gameSession.findFirst({
      where: { id: sessionId, ownerTokenHash },
    });
    if (!current) {
      return { kind: "not-found" };
    }
    if (current.status !== "PLAYING") {
      return { kind: "completed" };
    }
    const updated = await this.prisma.gameSession.updateMany({
      data: { abandonedAt: new Date(), status: "ABANDONED" },
      where: {
        id: sessionId,
        ownerTokenHash,
        status: "PLAYING",
      },
    });
    return updated.count === 1
      ? { kind: "abandoned" }
      : { kind: "completed" };
  }

  async create(input: CreateStoredSessionInput): Promise<StoredSession> {
    const relations = normalizedRelations(
      input.state.sessionId,
      input.state,
    );
    return this.prisma.$transaction(
      async (transaction) => {
        const created = await transaction.gameSession.create({
        data: {
          currentSnapshot: json(input.state),
          currentTurn: input.state.turn,
          id: input.state.sessionId,
          ownerTokenHash: input.ownerTokenHash,
          stateVersion: 1,
          status: toDatabaseStatus(input.state.status),
          title: input.state.world.title,
        },
      });
        await Promise.all([
          relations.activeRules.length === 0
            ? Promise.resolve()
            : transaction.activeRule.createMany({
                data: relations.activeRules,
              }),
          relations.inventoryItems.length === 0
            ? Promise.resolve()
            : transaction.sessionInventoryItem.createMany({
                data: relations.inventoryItems,
              }),
          relations.npcStates.length === 0
            ? Promise.resolve()
            : transaction.sessionNpcState.createMany({
                data: relations.npcStates,
              }),
        ]);
        return toStoredSession(created);
      },
      { maxWait: 10_000, timeout: 30_000 },
    );
  }

  async findOwned(
    sessionId: string,
    ownerTokenHash: string,
  ): Promise<StoredSession | null> {
    const row = await this.prisma.gameSession.findFirst({
      where: { id: sessionId, ownerTokenHash },
    });
    return row ? toStoredSession(row) : null;
  }

  async findIdempotentResponse(
    sessionId: string,
    ownerTokenHash: string,
    idempotencyKey: string,
  ) {
    const request = await this.prisma.turnRequest.findFirst({
      where: {
        idempotencyKey,
        session: { id: sessionId, ownerTokenHash },
      },
    });
    return request
      ? persistedSessionSchema.parse(request.responseSnapshot)
      : null;
  }

  async listOwned(
    ownerTokenHash: string,
  ): Promise<readonly StoredSessionSummary[]> {
    const rows = await this.prisma.gameSession.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        currentTurn: true,
        id: true,
        status: true,
        title: true,
        updatedAt: true,
      },
      where: {
        ownerTokenHash,
        status: { in: ["PLAYING", "VICTORY", "DEFEAT"] },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      status: fromDatabaseStatus(row.status),
      title: row.title,
      turn: row.currentTurn,
      updatedAt: row.updatedAt,
    }));
  }

  async persistTurn(
    input: PersistTurnInput,
  ): Promise<PersistTurnOutcome> {
    const relations = normalizedRelations(
      input.sessionId,
      input.afterState,
    );
    return this.prisma.$transaction(
      async (transaction) => {
        const replay = await transaction.turnRequest.findFirst({
          where: {
            idempotencyKey: input.idempotencyKey,
            session: {
              id: input.sessionId,
              ownerTokenHash: input.ownerTokenHash,
            },
          },
        });
        if (replay) {
          return {
            kind: "replayed",
            response: persistedSessionSchema.parse(
              replay.responseSnapshot,
            ),
          };
        }

        const current = await transaction.gameSession.findFirst({
          where: {
            id: input.sessionId,
            ownerTokenHash: input.ownerTokenHash,
          },
        });
        if (!current) {
          return { kind: "not-found" };
        }
        if (current.status !== "PLAYING") {
          return { kind: "completed" };
        }
        if (current.stateVersion !== input.expectedStateVersion) {
          return {
            actualVersion: current.stateVersion,
            kind: "stale",
          };
        }

        const updated = await transaction.gameSession.updateMany({
          data: {
            completedAt:
              input.afterState.status === "playing"
                ? null
                : new Date(input.response.updatedAt),
            currentSnapshot: json(input.afterState),
            currentTurn: input.afterState.turn,
            stateVersion: { increment: 1 },
            status: toDatabaseStatus(input.afterState.status),
            updatedAt: new Date(input.response.updatedAt),
          },
          where: {
            id: input.sessionId,
            ownerTokenHash: input.ownerTokenHash,
            stateVersion: input.expectedStateVersion,
            status: "PLAYING",
          },
        });
        if (updated.count !== 1) {
          const latest = await transaction.gameSession.findUnique({
            where: { id: input.sessionId },
          });
          return latest?.status !== "PLAYING"
            ? { kind: "completed" }
            : {
                actualVersion:
                  latest?.stateVersion ?? input.expectedStateVersion,
                kind: "stale",
              };
        }

        await Promise.all([
          transaction.activeRule.deleteMany({
            where: { sessionId: input.sessionId },
          }),
          transaction.sessionInventoryItem.deleteMany({
            where: { sessionId: input.sessionId },
          }),
          transaction.sessionNpcState.deleteMany({
            where: { sessionId: input.sessionId },
          }),
        ]);
        await Promise.all([
          relations.activeRules.length === 0
            ? Promise.resolve()
            : transaction.activeRule.createMany({
                data: relations.activeRules,
              }),
          relations.inventoryItems.length === 0
            ? Promise.resolve()
            : transaction.sessionInventoryItem.createMany({
                data: relations.inventoryItems,
              }),
          relations.npcStates.length === 0
            ? Promise.resolve()
            : transaction.sessionNpcState.createMany({
                data: relations.npcStates,
              }),
        ]);
        await transaction.gameEvent.create({
          data: {
            actionId: input.action.id,
            actionLabel: input.action.label,
            afterStateSnapshot: json(input.afterState),
            beforeStateSnapshot: json(input.beforeState),
            effects: json(input.effects),
            eventId: input.beforeState.currentEvent.id,
            eventKind: input.beforeState.currentEvent.kind,
            ruleEvents: json(input.ruleEvents),
            sessionId: input.sessionId,
            title:
              input.afterState.history.at(-1)?.title ??
              input.action.label,
            turn: input.afterState.turn,
          },
        });
        await transaction.turnRequest.create({
          data: {
            action: json(input.action),
            expectedVersion: input.expectedStateVersion,
            idempotencyKey: input.idempotencyKey,
            responseSnapshot: json(input.response),
            resultingVersion: input.expectedStateVersion + 1,
            sessionId: input.sessionId,
          },
        });
        const persisted = await transaction.gameSession.findUniqueOrThrow({
          where: { id: input.sessionId },
        });
        return {
          kind: "persisted",
          session: toStoredSession(persisted),
        };
      },
      {
        isolationLevel: "Serializable",
        maxWait: 10_000,
        timeout: 30_000,
      },
    );
  }
}
