import { describe, expect, it } from "vitest";
import {
  getEntranceVariants,
  getMotionTransition,
  motionDuration,
} from "@/lib/motion";

describe("motion utilities", () => {
  it("uses the requested purposeful duration", () => {
    expect(getMotionTransition("deliberate", false).duration).toBe(
      motionDuration.deliberate,
    );
  });

  it("removes duration and spatial travel for reduced motion", () => {
    const transition = getMotionTransition("ruleshift", true);
    const variants = getEntranceVariants(true);

    expect(transition.duration).toBe(0);
    expect(variants.hidden).toMatchObject({ opacity: 1, y: 0 });
  });
});
