import { NextRequest, NextResponse } from "next/server";
import { getHomeChipFeedEvents } from "@/features/home/chipFeed";

const MAX_CHIP_SLUG_LENGTH = 64;

const normalizeChipSlug = (value: string | null): string | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > MAX_CHIP_SLUG_LENGTH) {
    return null;
  }

  return /^[a-z0-9-]+$/.test(normalized) ? normalized : null;
};

export async function GET(request: NextRequest) {
  const chipSlug = normalizeChipSlug(request.nextUrl.searchParams.get("chip"));

  if (!chipSlug) {
    return NextResponse.json({ error: "Invalid chip" }, { status: 400 });
  }

  const events = await getHomeChipFeedEvents(chipSlug);
  return NextResponse.json({ events });
}
