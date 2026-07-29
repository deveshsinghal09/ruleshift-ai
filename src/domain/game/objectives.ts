import { GameEngineError } from "@/domain/game/errors";
import type { Objective, ObjectiveStatus } from "@/domain/game/types";

export function updateObjectiveProgress(
  objectives: readonly Objective[],
  objectiveId: string,
  amount: number,
): readonly Objective[] {
  const objective = objectives.find((candidate) => candidate.id === objectiveId);
  if (!objective) {
    throw new GameEngineError(
      "INVALID_ACTION",
      `Objective "${objectiveId}" does not exist.`,
    );
  }
  if (objective.status === "failed") {
    throw new GameEngineError(
      "UNAVAILABLE_ACTION",
      "A failed objective cannot gain progress.",
    );
  }

  return objectives.map((candidate) => {
    if (candidate.id !== objectiveId) {
      return candidate;
    }

    const progress = Math.max(
      0,
      Math.min(candidate.target, candidate.progress + amount),
    );
    return {
      ...candidate,
      progress,
      status:
        progress >= candidate.target
          ? ("completed" as const)
          : candidate.status === "available"
            ? ("active" as const)
            : candidate.status,
    };
  });
}

export function updateObjectiveStatus(
  objectives: readonly Objective[],
  objectiveId: string,
  status: ObjectiveStatus,
): readonly Objective[] {
  if (!objectives.some((objective) => objective.id === objectiveId)) {
    throw new GameEngineError(
      "INVALID_ACTION",
      `Objective "${objectiveId}" does not exist.`,
    );
  }

  return objectives.map((objective) =>
    objective.id === objectiveId
      ? {
          ...objective,
          progress:
            status === "completed" ? objective.target : objective.progress,
          status,
        }
      : objective,
  );
}
