import type { Statistics } from "@/domain/game/types";

export const GAME_STATE_VERSION = 1 as const;
export const MIN_STAT_VALUE = 0;
export const MAX_WORLD_STABILITY = 100;
export const CUSTOM_ACTION_MAX_LENGTH = 300;
export const CUSTOM_ACTION_ENERGY_COST = 11;
export const DEFAULT_MAX_TURNS = 12;
export const UINT32_MAX = 4_294_967_295;

export const emptyActionCounts: Statistics["actionsByKind"] = {
  "accept-quest": 0,
  "reject-quest": 0,
  "run-away": 0,
  "use-item": 0,
  attack: 0,
  custom: 0,
  defend: 0,
  inspect: 0,
  move: 0,
  rest: 0,
  talk: 0,
};
