import { NextRequest, NextResponse } from "next/server";
import { getMarketPriceHistory } from "@/features/events/api/clob";

const MAX_TOKEN_ID_LENGTH = 256;

const normalizeTokenId = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (normalized.length === 0 || normalized.length > MAX_TOKEN_ID_LENGTH) {
    return null;
  }

  return /^[A-Za-z0-9_-]+$/.test(normalized) ? normalized : null;
};

export async function GET(request: NextRequest) {
  const tokenId = normalizeTokenId(request.nextUrl.searchParams.get("tokenId"));

  if (!tokenId) {
    return NextResponse.json({ error: "Invalid tokenId" }, { status: 400 });
  }

  try {
    const points = await getMarketPriceHistory({
      tokenId,
      interval: "1w",
      fidelity: 60,
    });

    return NextResponse.json(
      {
        chart:
          points.length >= 5
            ? {
                points,
                intervalLabel: "Monthly",
                sourceLabel: "Polymarket",
              }
            : null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { chart: null },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  }
}
