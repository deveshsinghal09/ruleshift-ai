import { UINT32_MAX } from "@/domain/game/constants";

export interface RandomResult<T> {
  readonly state: number;
  readonly value: T;
}

export function hashSeed(seed: string): number {
  let hash = 2_166_136_261;

  for (const character of seed) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

export function nextRandom(state: number): RandomResult<number> {
  const nextState = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
  return {
    state: nextState,
    value: nextState / (UINT32_MAX + 1),
  };
}

export function randomInt(
  state: number,
  minimum: number,
  maximum: number,
): RandomResult<number> {
  const random = nextRandom(state);
  const lower = Math.ceil(minimum);
  const upper = Math.floor(maximum);

  return {
    state: random.state,
    value: lower + Math.floor(random.value * (upper - lower + 1)),
  };
}

export function randomChance(
  state: number,
  probability: number,
): RandomResult<boolean> {
  const random = nextRandom(state);
  return {
    state: random.state,
    value: random.value < Math.max(0, Math.min(1, probability)),
  };
}

export function randomItem<T>(
  state: number,
  items: readonly T[],
): RandomResult<T> {
  if (items.length === 0) {
    throw new Error("Cannot select a deterministic item from an empty list.");
  }

  const index = randomInt(state, 0, items.length - 1);
  return {
    state: index.state,
    value: items[index.value] as T,
  };
}

export function shuffle<T>(
  state: number,
  items: readonly T[],
): RandomResult<readonly T[]> {
  const shuffled = [...items];
  let nextState = state;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const selection = randomInt(nextState, 0, index);
    nextState = selection.state;
    const selected = shuffled[selection.value] as T;
    shuffled[selection.value] = shuffled[index] as T;
    shuffled[index] = selected;
  }

  return { state: nextState, value: shuffled };
}
