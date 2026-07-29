import type {
  CharacterOption,
  Difficulty,
  MoodId,
} from "@/features/adventure/types";

export const demoCharacters: readonly CharacterOption[] = [
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

export const mockGeneratedSuggestions: readonly CharacterOption[] = [
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

export const moods: ReadonlyArray<{
  readonly description: string;
  readonly id: MoodId;
  readonly label: string;
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

export const difficultyOptions: ReadonlyArray<{
  readonly description: string;
  readonly internal: Difficulty;
  readonly label: string;
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
