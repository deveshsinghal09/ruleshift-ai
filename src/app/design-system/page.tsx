import type { Metadata } from "next";
import {
  CheckCircle2,
  CircleAlert,
  Compass,
  Keyboard,
  PanelRight,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { PageBackground } from "@/components/layout/page-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Design System | RuleShift AI",
  description: "RuleShift AI component calibration surface.",
  robots: {
    index: false,
    follow: false,
  },
};

interface ShowcaseSectionProps {
  children: ReactNode;
  description: string;
  title: string;
}

function ShowcaseSection({
  children,
  description,
  title,
}: ShowcaseSectionProps) {
  return (
    <section
      aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-title`}
      className="grid gap-5 border-t border-border py-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12 lg:py-14"
    >
      <div className="space-y-2">
        <h2
          className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground"
          id={`${title.toLowerCase().replaceAll(" ", "-")}-title`}
        >
          {title}
        </h2>
        <p className="max-w-sm text-sm leading-6 text-secondary-foreground">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const colorTokens = [
  { label: "Primary canvas", token: "--background-primary" },
  { label: "Card surface", token: "--background-card" },
  { label: "AI signal", token: "--accent-primary" },
  { label: "Exploration", token: "--accent-secondary" },
  { label: "RuleShift", token: "--accent-chaos" },
  { label: "Success", token: "--accent-success" },
  { label: "Warning", token: "--accent-warning" },
  { label: "Danger", token: "--accent-danger" },
] as const;

export default function DesignSystemPage() {
  return (
    <PageBackground tone="ai">
      <main className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
        <header className="grid gap-8 pb-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:pb-16">
          <div className="space-y-5">
            <Badge variant="ai">
              <Sparkles aria-hidden="true" className="size-3" />
              Interface calibration
            </Badge>
            <div className="space-y-4">
              <h1 className="font-display max-w-4xl text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl">
                Reliable controls for an unstable reality.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-secondary-foreground sm:text-lg">
                A reusable component bench for the magical console at the center
                of RuleShift AI. The system stays calm until the rules change.
              </p>
            </div>
          </div>
          <Card variant="elevated">
            <CardHeader className="pb-4">
              <CardDescription className="font-system text-xs uppercase tracking-[0.12em]">
                System state
              </CardDescription>
              <CardTitle>Foundation ready</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress
                label="Design system completion"
                value={100}
                valueLabel="Complete"
                variant="success"
              />
              <p className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                Tokens synchronized
              </p>
            </CardContent>
          </Card>
        </header>

        <ShowcaseSection
          description="Solid surfaces provide the stable console. Context colors appear only when they communicate state."
          title="Signal palette"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {colorTokens.map(({ label, token }) => (
              <div
                className="overflow-hidden rounded-md border border-border bg-card"
                key={token}
              >
                <div
                  aria-hidden="true"
                  className="h-16"
                  style={{ backgroundColor: `var(${token})` }}
                />
                <div className="space-y-1 p-3">
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <code className="font-system text-[0.625rem] text-muted-foreground">
                    {token}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          description="Action hierarchy is physical and clear. Loading keeps its label, and disabled controls explain their state nearby."
          title="Action controls"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button>
                <Sparkles aria-hidden="true" className="size-4" />
                Ask the Dungeon Master
              </Button>
              <Button variant="exploration">
                <Compass aria-hidden="true" className="size-4" />
                Explore passage
              </Button>
              <Button variant="ruleshift">
                <Zap aria-hidden="true" className="size-4" />
                Accept RuleShift
              </Button>
              <Button variant="secondary">Inspect inventory</Button>
              <Button variant="ghost">Wait one turn</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button aria-pressed="true" variant="secondary">
                Selected action
              </Button>
              <Button loading>Rewriting reality</Button>
              <Button disabled>Unavailable action</Button>
              <Button variant="danger">
                <TriangleAlert aria-hidden="true" className="size-4" />
                End adventure
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Neutral</Badge>
              <Badge variant="ai">AI message</Badge>
              <Badge variant="exploration">Exploration</Badge>
              <Badge variant="ruleshift">RuleShift · 3 turns</Badge>
              <Badge variant="success">Reward</Badge>
              <Badge variant="warning">Quest update</Badge>
              <Badge variant="danger">Low health</Badge>
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          description="Card variants preserve one layout while changing context. The displaced seam belongs only to reality-changing events."
          title="Story surfaces"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card variant="exploration">
              <CardHeader>
                <Badge className="w-fit" variant="exploration">
                  Exploration
                </Badge>
                <CardTitle>The Memory Forest</CardTitle>
                <CardDescription>
                  Forgotten variables rustle beneath a sky compiled from old
                  warnings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-secondary-foreground">
                  A cyan trail points toward the Kernel Castle.
                </p>
              </CardContent>
            </Card>

            <Card variant="ai">
              <CardHeader>
                <Badge className="w-fit" variant="ai">
                  Dungeon Master
                </Badge>
                <CardTitle>Reality is listening</CardTitle>
                <CardDescription>
                  “That was not one of the expected actions.”
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <span className="font-system text-xs text-muted-foreground">
                  MOOD: CURIOUS
                </span>
              </CardFooter>
            </Card>

            <Card variant="ruleshift">
              <CardHeader>
                <Badge className="w-fit" variant="ruleshift">
                  RuleShift
                </Badge>
                <CardTitle>Compliment combat</CardTitle>
                <CardDescription>
                  For three turns, attacks heal enemies and compliments deal
                  damage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress
                  label="RuleShift duration"
                  value={66}
                  valueLabel="2 of 3 turns remaining"
                  variant="ruleshift"
                />
              </CardContent>
            </Card>

            <Card variant="selected">
              <CardHeader>
                <Badge className="w-fit" variant="exploration">
                  Selected
                </Badge>
                <CardTitle>Negotiate</CardTitle>
                <CardDescription>
                  Convince the goblin that you are an auditor.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card variant="success">
              <CardHeader>
                <Badge className="w-fit" variant="success">
                  Reward
                </Badge>
                <CardTitle>Debugging Sword</CardTitle>
                <CardDescription>
                  Deals additional damage to digital enemies.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card variant="danger">
              <CardHeader>
                <Badge className="w-fit" variant="danger">
                  Reality error
                </Badge>
                <CardTitle>Timeline unavailable</CardTitle>
                <CardDescription>
                  A backup event has loaded. Continue from the restored turn.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          description="Inputs state the problem and recovery in text. Progress indicators always have an accessible name and value."
          title="Input and feedback"
        >
          <div className="grid gap-8 xl:grid-cols-2">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="character-name">
                  Character name
                </label>
                <Input
                  defaultValue="Devesh, the Placement Warrior"
                  id="character-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="custom-action">
                  Custom action
                </label>
                <Textarea
                  aria-describedby="custom-action-error"
                  aria-invalid="true"
                  defaultValue="Rewrite the entire universe with one semicolon."
                  id="custom-action"
                />
                <p
                  className="flex items-start gap-2 text-sm leading-6 text-danger"
                  id="custom-action-error"
                  role="alert"
                >
                  <CircleAlert
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0"
                  />
                  That action is too powerful for this timeline. Describe a
                  smaller action.
                </p>
              </div>
              <Input
                aria-label="Disabled world seed"
                disabled
                value="WORLD-SEED-LOCKED"
              />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="font-semibold">Player health</span>
                  <span className="font-system text-secondary-foreground">
                    72 / 100
                  </span>
                </div>
                <Progress
                  label="Player health"
                  value={72}
                  valueLabel="72 of 100 health"
                  variant="success"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="font-semibold">World stability</span>
                  <span className="font-system text-secondary-foreground">
                    38%
                  </span>
                </div>
                <Progress
                  label="World stability"
                  value={38}
                  valueLabel="38 percent stable"
                  variant="warning"
                />
              </div>
              <div aria-busy="true" className="space-y-3">
                <Skeleton className="h-4 w-32" label="Loading narration" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          description="Protected focus is reserved for true interruptions and secondary panels. Both close by keyboard and restore focus."
          title="Overlays and help"
        >
          <TooltipProvider>
            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <CircleAlert aria-hidden="true" className="size-4" />
                    Open interruption
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <Badge className="w-fit" variant="ruleshift">
                      Reality warning
                    </Badge>
                    <DialogTitle>The rules are about to change</DialogTitle>
                    <DialogDescription>
                      Compliment Combat will remain active for the next three
                      turns. Ordinary attacks will heal the enemy.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Review later</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="ruleshift">Understand the rule</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary">
                    <PanelRight aria-hidden="true" className="size-4" />
                    Open system panel
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <Badge className="w-fit" variant="ai">
                      Dungeon Master
                    </Badge>
                    <SheetTitle>Reality diagnostics</SheetTitle>
                    <SheetDescription>
                      Inspect the active signals without leaving the current
                      adventure.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-8 space-y-5">
                    <Card variant="ai">
                      <CardHeader>
                        <CardTitle>Current observation</CardTitle>
                        <CardDescription>
                          The player has chosen three risky actions in a row.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                    <Progress
                      label="Chaos level"
                      value={64}
                      valueLabel="64 percent"
                      variant="ruleshift"
                    />
                  </div>
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button className="w-full sm:w-auto">Close panel</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Show keyboard shortcuts"
                    size="icon"
                    variant="ghost"
                  >
                    <Keyboard aria-hidden="true" className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Press 1–4 to choose an action, or Enter to submit.
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </ShowcaseSection>

        <ShowcaseSection
          description="Tabs keep related system states in one place and remain operable with arrow keys."
          title="Grouped state"
        >
          <Tabs defaultValue="rules">
            <TabsList aria-label="Adventure information">
              <TabsTrigger value="rules">Active rules</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="rules">
              <Card variant="ruleshift">
                <CardHeader>
                  <CardTitle>Compliment combat</CardTitle>
                  <CardDescription>
                    Two turns remain before reality stabilizes.
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Resume of Questionable Experience</CardTitle>
                  <CardDescription>
                    One use remains. Rarity: suspiciously legendary.
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Turn 4</CardTitle>
                  <CardDescription>
                    You challenged the recruiter to binary search.
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </ShowcaseSection>
      </main>
    </PageBackground>
  );
}
