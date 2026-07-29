import type { Metadata } from "next";
import { ResultScreen } from "@/features/result/result-screen";

export const metadata: Metadata = {
  title: "Adventure Result | RuleShift AI",
  description: "Review the outcome of a RuleShift AI adventure.",
};

interface ResultPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { sessionId } = await params;
  return <ResultScreen sessionId={sessionId} />;
}
