"use client";

import { useReducedMotion } from "framer-motion";
import {
  getMotionTransition,
  type MotionPreset,
} from "@/lib/motion";

export function useReducedMotionPreference(): boolean {
  return useReducedMotion() ?? false;
}

export function useAccessibleTransition(preset: MotionPreset = "standard") {
  const reduceMotion = useReducedMotionPreference();

  return getMotionTransition(preset, reduceMotion);
}
