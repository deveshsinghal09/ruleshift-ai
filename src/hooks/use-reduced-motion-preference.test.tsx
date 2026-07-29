import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "framer-motion";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAccessibleTransition,
  useReducedMotionPreference,
} from "@/hooks/use-reduced-motion-preference";

vi.mock("framer-motion", () => ({
  useReducedMotion: vi.fn(),
}));

describe("reduced-motion hooks", () => {
  beforeEach(() => {
    vi.mocked(useReducedMotion).mockReset();
  });

  it("normalizes an unavailable preference to false", () => {
    vi.mocked(useReducedMotion).mockReturnValue(null);

    const { result } = renderHook(() => useReducedMotionPreference());

    expect(result.current).toBe(false);
  });

  it("returns an instant accessible transition when reduction is preferred", () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const { result } = renderHook(() =>
      useAccessibleTransition("ruleshift"),
    );

    expect(result.current.duration).toBe(0);
  });
});
