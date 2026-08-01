import type { RuleKey } from "@/domain/rules/types";

const beforeExplanations = {
  compliment_combat: "Compliments affect dialogue, not enemy health.",
  enemy_mirrors_action: "Damage dealt to an enemy does not reflect back to you.",
  healing_hurts: "Health restoration increases your current health.",
  idle_regeneration: "Defending and resting provide no extra health bonus.",
  inventory_shuffle: "Inventory items remain in a stable order.",
  inventory_weight_damage: "Carrying extra items does not damage you.",
  locations_shuffle: "Available choices remain in their presented order.",
  no_repeat_action: "The same labelled move may be used on consecutive turns.",
  protect_the_enemy: "Enemy-damaging actions are allowed to reduce enemy health.",
  reverse_controls: "A prepared choice resolves exactly as selected.",
  weather_combat: "Weather changes narration but adds no combat damage.",
  wrong_answers_hurt_enemies: "Wrong answers do not deal bonus enemy damage.",
} satisfies Readonly<Record<RuleKey, string>>;

export function getRuleBeforeExplanation(key: RuleKey): string {
  return beforeExplanations[key];
}
