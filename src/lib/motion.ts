import type { Transition, Variants } from "framer-motion";

export const motionDuration = {
  instant: 0,
  fast: 0.15,
  standard: 0.24,
  deliberate: 0.38,
  ruleshift: 0.65,
} as const;

export const motionEasing = {
  standard: [0.22, 1, 0.36, 1],
  emphasized: [0.16, 1, 0.3, 1],
} as const;

export type MotionPreset = keyof typeof motionDuration;

export function getMotionTransition(
  preset: MotionPreset = "standard",
  reduceMotion = false,
): Transition {
  return {
    duration: reduceMotion ? motionDuration.instant : motionDuration[preset],
    ease: motionEasing.standard,
  };
}

export function getEntranceVariants(reduceMotion = false): Variants {
  return {
    hidden: {
      opacity: reduceMotion ? 1 : 0,
      y: reduceMotion ? 0 : 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: getMotionTransition("deliberate", reduceMotion),
    },
  };
}
