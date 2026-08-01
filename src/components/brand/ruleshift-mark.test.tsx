import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RuleShiftMark } from "@/components/brand/ruleshift-mark";

describe("RuleShiftMark", () => {
  it("renders the supplied logo as decorative brand artwork beside its name", () => {
    const { container } = render(<RuleShiftMark />);
    const logo = container.querySelector("img");

    expect(logo).not.toBeNull();
    expect(logo).toHaveAttribute("alt", "");
    expect(logo?.getAttribute("src")).toContain("ruleshift-logo.png");
    expect(container).toHaveTextContent("RuleShift AI");
  });
});
