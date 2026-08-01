import { NextResponse } from "next/server";
import { getPrismaClient } from "@/server/db/client";
import { checkApplicationHealth } from "@/server/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const health = await checkApplicationHealth(async () => {
    await getPrismaClient().$queryRaw`SELECT 1`;
  });
  if (health.status === "degraded") {
    console.error("Health readiness check failed: database unavailable.");
  }
  return NextResponse.json(health, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
    status: health.status === "ok" ? 200 : 503,
  });
}
