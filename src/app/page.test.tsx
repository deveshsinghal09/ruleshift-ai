import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the project identity and foundation status", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "RuleShift AI" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/strict, testable application foundation is ready/i),
    ).toBeInTheDocument();
  });
});
