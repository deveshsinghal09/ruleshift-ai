import { complimentCombatRule } from "@/domain/rules/definitions/compliment-combat";
import { enemyMirrorsActionRule } from "@/domain/rules/definitions/enemy-mirrors-action";
import { healingHurtsRule } from "@/domain/rules/definitions/healing-hurts";
import { idleRegenerationRule } from "@/domain/rules/definitions/idle-regeneration";
import { inventoryShuffleRule } from "@/domain/rules/definitions/inventory-shuffle";
import { inventoryWeightDamageRule } from "@/domain/rules/definitions/inventory-weight-damage";
import { locationsShuffleRule } from "@/domain/rules/definitions/locations-shuffle";
import { noRepeatActionRule } from "@/domain/rules/definitions/no-repeat-action";
import { protectTheEnemyRule } from "@/domain/rules/definitions/protect-the-enemy";
import { reverseControlsRule } from "@/domain/rules/definitions/reverse-controls";
import { weatherCombatRule } from "@/domain/rules/definitions/weather-combat";
import { wrongAnswersHurtEnemiesRule } from "@/domain/rules/definitions/wrong-answers-hurt-enemies";
import { GameEngineError } from "@/domain/game/errors";
import type { RuleDefinition, RuleKey } from "@/domain/rules/types";

export const ruleShiftRegistry = {
  compliment_combat: complimentCombatRule,
  enemy_mirrors_action: enemyMirrorsActionRule,
  healing_hurts: healingHurtsRule,
  idle_regeneration: idleRegenerationRule,
  inventory_shuffle: inventoryShuffleRule,
  inventory_weight_damage: inventoryWeightDamageRule,
  locations_shuffle: locationsShuffleRule,
  no_repeat_action: noRepeatActionRule,
  protect_the_enemy: protectTheEnemyRule,
  reverse_controls: reverseControlsRule,
  weather_combat: weatherCombatRule,
  wrong_answers_hurt_enemies: wrongAnswersHurtEnemiesRule,
} satisfies Readonly<Record<RuleKey, RuleDefinition>>;

export const registeredRuleKeys = Object.freeze(
  Object.keys(ruleShiftRegistry) as RuleKey[],
);

export function isRegisteredRuleKey(key: string): key is RuleKey {
  return Object.prototype.hasOwnProperty.call(ruleShiftRegistry, key);
}

export function getRuleDefinition(key: string): RuleDefinition {
  if (!isRegisteredRuleKey(key)) {
    throw new GameEngineError(
      "INVALID_RULE",
      `RuleShift "${key}" is not registered.`,
    );
  }
  return ruleShiftRegistry[key];
}
