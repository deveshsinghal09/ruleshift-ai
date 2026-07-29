import { GameEngineError } from "@/domain/game/errors";
import { resolveRuleConflict } from "@/domain/rules/conflicts";
import { getRuleDefinition } from "@/domain/rules/registry";
import {
  validateActiveRule,
  validateRuleActivation,
} from "@/domain/rules/validation";
import type {
  ActiveRule,
  RuleActivationProposal,
  RuleLifecycleEvent,
  RuleLifecycleResolution,
  RuleTurnPreparation,
  RuleTurnResolution,
} from "@/domain/rules/types";
import type {
  Effect,
  GameAction,
  GameState,
  LocalGameEvent,
} from "@/domain/game/types";

function byPriority(left: ActiveRule, right: ActiveRule): number {
  return right.priority - left.priority || left.key.localeCompare(right.key);
}

function assertOutcomeUnchanged(
  before: GameState,
  after: GameState,
  ruleName: string,
): void {
  if (after.status !== before.status) {
    throw new GameEngineError(
      "INVALID_RULE",
      `${ruleName} attempted to set a final game outcome directly.`,
    );
  }
}

function lifecycleEvent(
  state: GameState,
  rule: Pick<ActiveRule, "key" | "name">,
  type: RuleLifecycleEvent["type"],
  message: string,
): RuleLifecycleEvent {
  return {
    id: `rule-${state.turn}-${type}-${rule.key}-${state.ruleEvents.length}`,
    message,
    ruleKey: rule.key,
    ruleName: rule.name,
    turn: state.turn,
    type,
  };
}

function actionAllowedByRules(
  state: GameState,
  action: GameAction,
  rules: readonly ActiveRule[],
): boolean {
  return rules.every((activeRule) =>
    getRuleDefinition(activeRule.key).actionValidation({
      action,
      activeRule,
      randomState: state.randomState,
      state,
    }).allowed,
  );
}

export function getRuleActionAvailability(
  state: GameState,
  action: GameAction,
): { readonly available: boolean; readonly reason?: string } {
  for (const activeRule of [...state.activeRules].sort(byPriority)) {
    const validation = getRuleDefinition(activeRule.key).actionValidation({
      action,
      activeRule,
      randomState: state.randomState,
      state,
    });
    if (!validation.allowed) {
      return { available: false, reason: validation.reason };
    }
  }
  return { available: true };
}

function assertPlayableComposition(
  state: GameState,
  rules: readonly ActiveRule[],
): void {
  if (
    !state.currentEvent.choices.some((choice) =>
      actionAllowedByRules(state, choice, rules),
    )
  ) {
    throw new GameEngineError(
      "INVALID_RULE",
      "The RuleShift composition would remove every prepared action.",
    );
  }
}

export function activateRule(
  state: GameState,
  input: RuleActivationProposal,
  event: LocalGameEvent = state.currentEvent,
): RuleLifecycleResolution {
  const proposal = validateRuleActivation(input);
  const definition = getRuleDefinition(proposal.key);
  const provisional: ActiveRule = validateActiveRule({
    activatedAtTurn: state.turn,
    category: definition.category,
    id: proposal.id,
    key: definition.key,
    name: definition.name,
    parameters: proposal.parameters,
    priority: definition.priority,
    remainingTurns: proposal.duration,
    totalTurns: proposal.duration,
    uiExplanation: definition.uiExplanation,
  });

  if (!definition.compatibleEventTypes.includes(event.kind)) {
    throw new GameEngineError(
      "INVALID_RULE",
      `${definition.name} is not compatible with ${event.kind} events.`,
    );
  }
  if (!definition.activationPredicate({ event, state })) {
    throw new GameEngineError(
      "INVALID_RULE",
      `${definition.name} cannot activate in the current state.`,
    );
  }

  const conflict = resolveRuleConflict(definition, state.activeRules);
  if (conflict.policy === "reject") {
    throw new GameEngineError(
      "RULE_CONFLICT",
      `${definition.name} conflicts with ${conflict.conflictingRule?.name ?? "an active rule"}.`,
    );
  }

  const retainedRules = conflict.conflictingRule
    ? state.activeRules.filter(
        (rule) => rule.id !== conflict.conflictingRule?.id,
      )
    : state.activeRules;
  const activeRules = [...retainedRules, provisional].sort(byPriority);
  assertPlayableComposition(state, activeRules);

  const events: RuleLifecycleEvent[] = [];
  if (conflict.conflictingRule) {
    events.push(
      lifecycleEvent(
        state,
        conflict.conflictingRule,
        "replaced",
        `${conflict.conflictingRule.name} was replaced by ${definition.name} under the registry priority policy.`,
      ),
    );
  }
  events.push(
    lifecycleEvent(
      state,
      provisional,
      "activated",
      `${definition.name} activated for ${proposal.duration} turns.`,
    ),
  );

  let activatedState: GameState = {
    ...state,
    activeRules,
    ruleEvents: [...state.ruleEvents, ...events],
  };
  const activationHook = definition.afterEvent;
  if (activationHook) {
    const result = activationHook({
      activeRule: provisional,
      randomState: activatedState.randomState,
      state: activatedState,
    });
    assertOutcomeUnchanged(activatedState, result.state, definition.name);
    activatedState = {
      ...result.state,
      randomState: result.randomState,
    };
  }

  return {
    events,
    state: activatedState,
  };
}

export function activateRuleFromEvent(
  state: GameState,
): RuleLifecycleResolution {
  const announcement = state.currentEvent.announcement;
  if (!announcement) {
    return { events: [], state };
  }

  try {
    return activateRule(
      state,
      {
        duration: announcement.totalTurns,
        id: announcement.id,
        key: announcement.ruleKey,
        parameters: announcement.parameters,
      },
      state.currentEvent,
    );
  } catch (error) {
    const key = announcement.ruleKey;
    const definition = getRuleDefinition(key);
    const message =
      error instanceof Error
        ? error.message
        : `${definition.name} was rejected by deterministic validation.`;
    const rejected = lifecycleEvent(
      state,
      { key: definition.key, name: definition.name },
      "rejected",
      message,
    );
    return {
      events: [rejected],
      state: {
        ...state,
        ruleEvents: [...state.ruleEvents, rejected],
      },
    };
  }
}

export function prepareRuleAction(
  state: GameState,
  action: GameAction,
): RuleTurnPreparation {
  let prepared: RuleTurnPreparation = {
    action,
    effects: [],
    randomState: state.randomState,
    state,
  };

  for (const activeRule of [...state.activeRules].sort(byPriority)) {
    const definition = getRuleDefinition(activeRule.key);
    const validation = definition.actionValidation({
      action: prepared.action,
      activeRule,
      randomState: prepared.randomState,
      state: prepared.state,
    });
    if (!validation.allowed) {
      throw new GameEngineError(
        "UNAVAILABLE_ACTION",
        validation.reason ?? `${activeRule.name} blocks that action.`,
      );
    }
    const result = definition.beforeAction({
      action: prepared.action,
      activeRule,
      randomState: prepared.randomState,
      state: prepared.state,
    });
    assertOutcomeUnchanged(prepared.state, result.state, activeRule.name);
    prepared = {
      action: result.action,
      effects: [...prepared.effects, ...result.effects],
      randomState: result.randomState,
      state: result.state,
    };
  }
  return prepared;
}

export function resolveRuleEffects(
  state: GameState,
  action: GameAction,
  effects: readonly Effect[],
  randomState: number,
): RuleTurnResolution {
  let resolved: RuleTurnResolution = { effects, randomState, state };
  for (const activeRule of [...state.activeRules].sort(byPriority)) {
    const result = getRuleDefinition(activeRule.key).afterAction({
      action,
      activeRule,
      effects: resolved.effects,
      randomState: resolved.randomState,
      state: resolved.state,
    });
    assertOutcomeUnchanged(resolved.state, result.state, activeRule.name);
    resolved = result;
  }
  return resolved;
}

export function applyRuleEventHooks(
  state: GameState,
): RuleTurnResolution {
  let resolved: RuleTurnResolution = {
    effects: [],
    randomState: state.randomState,
    state,
  };
  for (const activeRule of [...state.activeRules].sort(byPriority)) {
    const hook = getRuleDefinition(activeRule.key).afterEvent;
    if (hook) {
      const result = hook({
        activeRule,
        randomState: resolved.randomState,
        state: resolved.state,
      });
      assertOutcomeUnchanged(resolved.state, result.state, activeRule.name);
      resolved = {
        effects: [],
        randomState: result.randomState,
        state: result.state,
      };
    }
  }
  return resolved;
}

export function tickActiveRules(
  state: GameState,
  activeAtTurnStart: readonly string[],
  expireAll = false,
): RuleLifecycleResolution {
  let nextState = state;
  const events: RuleLifecycleEvent[] = [];
  const activeRules: ActiveRule[] = [];

  for (const activeRule of state.activeRules) {
    if (!activeAtTurnStart.includes(activeRule.id)) {
      activeRules.push(activeRule);
      continue;
    }
    if (!expireAll && activeRule.remainingTurns > 1) {
      activeRules.push({
        ...activeRule,
        remainingTurns: activeRule.remainingTurns - 1,
      });
      continue;
    }
    const expiration = getRuleDefinition(
      activeRule.key,
    ).expirationBehavior({ activeRule, state: nextState });
    assertOutcomeUnchanged(nextState, expiration.state, activeRule.name);
    nextState = expiration.state;
    events.push(
      lifecycleEvent(
        state,
        activeRule,
        "expired",
        expiration.message,
      ),
    );
  }

  return {
    events,
    state: {
      ...nextState,
      activeRules,
      ruleEvents: [...nextState.ruleEvents, ...events],
      statistics: {
        ...nextState.statistics,
        rulesSurvived: nextState.statistics.rulesSurvived + events.length,
      },
    },
  };
}
