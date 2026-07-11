import { NextResponse, type NextRequest } from "next/server";
import { runUpratingRecheck } from "@/lib/jobs/uprating";

export const runtime = "nodejs";

/**
 * Trigger for the uprating re-check job (J4). Called by the scheduler (Vercel
 * cron) or by the admin config publisher (P14) when a version goes live.
 * Guarded by JOBS_SECRET — never callable anonymously. Vercel cron invokes
 * with GET and sends `Authorization: Bearer ${CRON_SECRET}` when that env var
 * is set — CRON_SECRET and JOBS_SECRET hold the same value in production.
 */
async function handle(req: NextRequest) {
  const secret = process.env.JOBS_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || provided !== secret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const onDate = new URL(req.url).searchParams.get("date") ?? undefined;
  const summary = await runUpratingRecheck(onDate);
  return NextResponse.json(summary);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
