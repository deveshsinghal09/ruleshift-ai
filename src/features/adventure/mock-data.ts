import type {
  CharacterOption,
  Difficulty,
  InventoryItem,
  MoodId,
  TurnScene,
} from "@/features/adventure/types";

export const demoCharacters: CharacterOption[] = [
  {
    archetype: "Placement Warrior",
    description:
      "Turns interview anxiety into tactical focus and carries one suspiciously polished résumé.",
    id: "devesh",
    name: "Devesh",
    title: "the Placement Warrior",
  },
  {
    archetype: "Bug Bard",
    description:
      "Sings stack traces until broken systems reveal where they hid the truth.",
    id: "mira",
    name: "Mira",
    title: "the Bug Bard",
  },
  {
    archetype: "Cache Ranger",
    description:
      "Finds forgotten shortcuts, stale secrets, and the fastest path through a hostile campus.",
    id: "kabir",
    name: "Kabir",
    title: "the Cache Ranger",
  },
];

export const mockGeneratedSuggestions: CharacterOption[] = [
  {
    archetype: "Deadline Chronomancer",
    description: "Can move any deadline except the one currently approaching.",
    id: "suggestion-chronomancer",
    name: "Aarav",
    title: "the Deadline Chronomancer",
  },
  {
    archetype: "Spreadsheet Paladin",
    description: "Defends the party with pivot tables and conditional courage.",
    id: "suggestion-paladin",
    name: "Ishita",
    title: "the Spreadsheet Paladin",
  },
  {
    archetype: "Wi-Fi Oracle",
    description: "Foretells network outages exactly three seconds too late.",
    id: "suggestion-oracle",
    name: "Rohan",
    title: "the Wi-Fi Oracle",
  },
];

export const moods: Array<{
  description: string;
  id: MoodId;
  label: string;
}> = [
  {
    id: "fantasy",
    label: "Fantasy",
    description: "Runes, quests, and heroic stakes.",
  },
  {
    id: "mysterious",
    label: "Mysterious",
    description: "Secrets behind every locked door.",
  },
  {
    id: "chaotic",
    label: "Chaotic",
    description: "Unpredictable, but still fair.",
  },
  { id: "funny", label: "Funny", description: "Absurd stakes, dry wit." },
  {
    id: "horror",
    label: "Horror",
    description: "Unsettling without becoming cruel.",
  },
  {
    id: "wholesome",
    label: "Wholesome",
    description: "Kind allies and hopeful turns.",
  },
  {
    id: "scifi",
    label: "Sci-Fi",
    description: "Speculative systems and strange technology.",
  },
];

export const moodNarrativeCues: Record<MoodId, string> = {
  fantasy:
    "Fantasy lens: campus notices curl into quest scrolls and every deadline sounds like a prophecy.",
  mysterious:
    "Mystery lens: every corridor withholds one detail, and the silence seems to know your résumé.",
  chaotic:
    "Chaos lens: signs rearrange between glances, though the objective remains unmistakable.",
  funny:
    "Funny lens: the danger is real, but the campus insists on delivering it with excellent timing.",
  horror:
    "Horror lens: fluorescent lights count down in a language no living recruiter remembers.",
  wholesome:
    "Wholesome lens: even the haunted campus leaves encouraging notes beside the traps.",
  scifi:
    "Sci-Fi lens: assessment drones scan the halls while tomorrow’s offer letter pings from orbit.",
};

export const difficultyOptions: Array<{
  description: string;
  internal: Difficulty;
  label: string;
}> = [
  {
    internal: "easy",
    label: "Relaxed",
    description: "More health, gentler consequences.",
  },
  {
    internal: "normal",
    label: "Unstable",
    description: "The intended balance of risk and surprise.",
  },
  {
    internal: "hard",
    label: "Impossible",
    description: "Sharper costs and very little mercy.",
  },
];

export const difficultyLabels: Record<Difficulty, string> = {
  easy: "Relaxed",
  normal: "Unstable",
  hard: "Impossible",
};

export const demoTurns: TurnScene[] = [
  {
    actions: [
      {
        id: "follow-bell",
        label: "Follow the bell into the archive",
        energyCost: 8,
        risk: "safe",
      },
      {
        id: "question-map",
        label: "Interrogate the campus map",
        energyCost: 10,
        risk: "bold",
      },
      {
        id: "kick-door",
        label: "Kick open the Faculty of Algorithms",
        energyCost: 14,
        risk: "wild",
      },
    ],
    badge: "Exploration",
    dmAside:
      "The campus has scheduled your future for Room ∞. It did not include directions.",
    id: "campus-gates",
    narration:
      "Rain falls upward across the Haunted Campus of Infinite Assessments. Every corridor ends at a placement test, and somewhere beyond the faculty tower waits the Golden Offer Letter.",
    title: "The attendance bell rings for you",
    tone: "exploration",
  },
  {
    actions: [
      {
        id: "answer-zero",
        label: "Answer: O(1), confidently and incorrectly",
        energyCost: 10,
        risk: "bold",
      },
      {
        id: "binary-search",
        label: "Binary-search the examiner’s patience",
        energyCost: 12,
        risk: "safe",
      },
      {
        id: "ask-hint",
        label: "Trade one résumé bullet for a hint",
        energyCost: 7,
        risk: "safe",
      },
      {
        id: "invert-whiteboard",
        label: "Turn the whiteboard upside down",
        energyCost: 15,
        risk: "wild",
      },
    ],
    badge: "Enemy encounter",
    dmAside:
      "Incorrect answers are somehow hurting it. I definitely meant to configure that.",
    encounter: {
      description:
        "A recursive invigilator that grows stronger whenever someone says “brute force.”",
      health: 64,
      kind: "enemy",
      name: "The Infinite Examiner",
    },
    id: "binary-examiner",
    narration:
      "The Infinite Examiner unfolds from a whiteboard and demands the midpoint of an array with no end. Its rubric is alive, hostile, and surprisingly sensitive to wrong answers.",
    title: "A binary-search challenge blocks the quad",
    tone: "encounter",
  },
  {
    actions: [
      {
        id: "weaponize-error",
        label: "Weaponize a spectacularly wrong answer",
        energyCost: 12,
        risk: "bold",
      },
      {
        id: "compliment-complexity",
        label: "Compliment its asymptotic complexity",
        energyCost: 8,
        risk: "safe",
      },
      {
        id: "submit-resume",
        label: "Submit a résumé with twelve pages",
        energyCost: 16,
        risk: "wild",
      },
    ],
    badge: "RuleShift active",
    dmAside:
      "Reality has inverted one tiny assumption. Try not to learn the wrong lesson.",
    encounter: {
      description:
        "Its health bar now flinches whenever your answer would fail a basic screening.",
      health: 28,
      kind: "enemy",
      name: "The Infinite Examiner",
    },
    id: "incorrect-damage",
    narration:
      "The campus compiler stutters. A magenta seam cuts through the exam hall: for three turns, incorrect answers damage enemies while correct answers restore their confidence.",
    title: "RuleShift: Wrong answers become weapons",
    tone: "ruleshift",
  },
  {
    actions: [
      {
        id: "open-letter",
        label: "Open the Golden Offer Letter",
        energyCost: 8,
        risk: "safe",
      },
      {
        id: "negotiate-title",
        label: "Negotiate for “Senior Chosen One”",
        energyCost: 11,
        risk: "bold",
      },
      {
        id: "thank-examiner",
        label: "Thank the examiner for the bug report",
        energyCost: 6,
        risk: "safe",
      },
    ],
    badge: "Objective update",
    dmAside:
      "The letter is real. The compensation package appears to include dental and destiny.",
    encounter: {
      description:
        "A campus spirit who has been trying to graduate since the first compiler.",
      health: 100,
      kind: "npc",
      name: "The Dean of Deferred Dreams",
    },
    id: "golden-offer",
    narration:
      "The defeated examiner collapses into a single red pen. Behind it, the Dean of Deferred Dreams presents the Golden Offer Letter and a résumé no honest recruiter would believe.",
    title: "The final interview has only one question",
    tone: "reward",
  },
];

export const resumeItem: InventoryItem = {
  description:
    "Once per adventure, adds six years of experience to a technology invented yesterday.",
  id: "questionable-resume",
  name: "Résumé of Questionable Experience",
  rarity: "legendary",
};

export const previewRules = [
  {
    after: "Wrong answers deal damage.",
    before: "Correct answers deal damage.",
    name: "Incorrectly Correct",
  },
  {
    after: "Compliments count as attacks.",
    before: "Attacks reduce enemy health.",
    name: "Kindness Is Violence",
  },
  {
    after: "Empty inventory slots grant armor.",
    before: "Items grant useful effects.",
    name: "Pack Light",
  },
] as const;

export const exampleWorlds = [
  {
    title: "Haunted Campus of Infinite Assessments",
    description:
      "Placement tests became sentient. The final offer letter is guarded by a recursive examiner.",
    signal: "Campus fantasy",
  },
  {
    title: "Moon Bazaar of Borrowed Memories",
    description:
      "Every purchase costs a memory, including the memory of why you came.",
    signal: "Surreal mystery",
  },
  {
    title: "Last Train to the End of Time",
    description:
      "Carriages rearrange at midnight, and one passenger is tomorrow’s version of you.",
    signal: "Temporal thriller",
  },
] as const;
