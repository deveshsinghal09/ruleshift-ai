import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

describe("Dialog", () => {
  it("opens, traps a named dialog, closes with Escape, and restores focus", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open warning</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Reality warning</DialogTitle>
          <DialogDescription>The next rule lasts three turns.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    const trigger = screen.getByRole("button", { name: "Open warning" });
    await user.click(trigger);

    expect(
      screen.getByRole("dialog", { name: "Reality warning" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Reality warning" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe("Sheet", () => {
  it("opens a named panel and closes from its accessible close control", async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open inventory</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Inventory</SheetTitle>
          <SheetDescription>Items carried by the player.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    await user.click(screen.getByRole("button", { name: "Open inventory" }));

    expect(
      screen.getByRole("dialog", { name: "Inventory" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close panel" }));

    expect(
      screen.queryByRole("dialog", { name: "Inventory" }),
    ).not.toBeInTheDocument();
  });
});
