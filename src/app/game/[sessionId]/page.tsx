import type { Metadata } from "next";
import { GameScreen } from "@/features/game/game-screen";

export const metadata: Metadata = {
  title: "Adventure | RuleShift AI",
  description: "Play the RuleShift AI scripted adventure demo.",
};

interface GamePageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { sessionId } = await params;
  return <GameScreen sessionId={sessionId} />;
}
