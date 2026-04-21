import { NextRequest, NextResponse } from "next/server";
import { getHomeChipFeedEvents } from "@/features/home/chipFeed";

const MAX_CHIP_SLUG_LENGTH = 64;
const MAX_CURSOR_LENGTH = 512;

const normalizeChipSlug = (value: string | null): string | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > MAX_CHIP_SLUG_LENGTH) {
    return null;
  }

  return /^[a-z0-9-]+$/.test(normalized) ? normalized : null;
};

const normalizeCursor = (value: string | null): string | null => {
  if (!value) return null;

  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > MAX_CURSOR_LENGTH) {
    return null;
  }

  return /^[A-Za-z0-9_-]+$/.test(normalized) ? normalized : null;
};

export async function GET(request: NextRequest) {
  const chipSlug = normalizeChipSlug(request.nextUrl.searchParams.get("chip"));
  const rawCursor = request.nextUrl.searchParams.get("cursor");
  const cursor = normalizeCursor(rawCursor);

  if (!chipSlug) {
    return NextResponse.json({ error: "Invalid chip" }, { status: 400 });
  }
  if (rawCursor && !cursor) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  const page = await getHomeChipFeedEvents(chipSlug, cursor ?? undefined);
  return NextResponse.json(page);
}
