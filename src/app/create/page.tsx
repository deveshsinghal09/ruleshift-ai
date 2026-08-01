import type { Metadata } from "next";
import { PageBackground } from "@/components/layout/page-background";
import { SiteHeader } from "@/components/navigation/site-header";
import { CharacterCreator } from "@/features/character/character-creator";

export const metadata: Metadata = {
  title: "Create Your Hero | RuleShift AI",
  description:
    "Build a character passport for the RuleShift AI scripted adventure.",
};

export default function CreateCharacterPage() {
  return (
    <PageBackground tone="exploration">
      <SiteHeader showStart={false} />
      <main id="main-content" tabIndex={-1}>
        <CharacterCreator />
      </main>
    </PageBackground>
  );
}
