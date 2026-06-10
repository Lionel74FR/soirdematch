import { NextRequest, NextResponse } from "next/server";
import { sendMetaEvent } from "@/lib/meta-capi";

export const runtime = "nodejs";

/**
 * Fires the Meta CAPI "StartQuestionnaire" custom event when the form opens.
 * Tracking must never block the user, so failures are swallowed.
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;
    const fbp = req.cookies.get("_fbp")?.value;
    const fbc = req.cookies.get("_fbc")?.value;

    await sendMetaEvent({
      eventName: "StartQuestionnaire",
      eventSourceUrl: req.headers.get("referer") || undefined,
      userData: {
        clientIpAddress: ip,
        clientUserAgent: userAgent,
        fbp,
        fbc,
      },
    });
  } catch (err) {
    console.warn("Meta CAPI StartQuestionnaire skipped:", (err as Error).message);
  }

  return NextResponse.json({ ok: true });
}
