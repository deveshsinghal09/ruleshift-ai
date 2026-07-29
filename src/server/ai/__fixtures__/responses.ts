import type {
  EventGeneration,
  FinalSummary,
  MemoryUpdate,
  WorldGeneration,
} from "@/server/ai/schemas";

export const validEventFixture: EventGeneration = {
  badge: "Assessment anomaly",
  choices: [
    {
      effects: [
        { intensity: "minor", kind: "progress_objective" },
      ],
      kind: "inspect",
      label: "Read the rubric between its blinking lines",
      risk: "safe",
    },
    {
      effects: [
        { intensity: "moderate", kind: "damage_enemy" },
      ],
      kind: "attack",
      label: "Refactor the examiner's impossible premise",
      risk: "bold",
    },
  ],
  dmAside: "The rubric insists this is all standard procedure.",
  item: null,
  kind: "puzzle",
  narration:
    "The assessment rubric folds itself into a maze of contradictory requirements.",
  rule: null,
  title: "The rubric rewrites the corridor",
};

export const validWorldFixture: WorldGeneration = {
  description:
    "A haunted campus where interviews have escaped their calendars.",
  objectiveDescription:
    "Cross the assessment wing and recover the promised offer.",
  objectiveTitle: "Recover the promised offer",
  openingNarration:
    "An attendance bell rings from a classroom that does not exist.",
  title: "The Campus Between Interviews",
};

export const validMemoryFixture: MemoryUpdate = {
  summary: "Devesh followed the bell and challenged the living rubric.",
};

export const validFinalSummaryFixture: FinalSummary = {
  mostCreativeAction: "Refactored the examiner's impossible premise",
  summary:
    "Devesh crossed the assessment wing while reality changed its grading policy.",
  title: "The final interview finally ended",
};
