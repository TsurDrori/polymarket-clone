import { NextRequest, NextResponse } from "next/server";
import { getSportsLeagueCardCatalogPayload } from "@/features/sports/server";

const SURFACE_SET = new Set(["props", "futures"]);

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("league");
  const surface = request.nextUrl.searchParams.get("surface");

  if (!league || !surface || !SURFACE_SET.has(surface)) {
    return NextResponse.json({ error: "Invalid sports catalog request" }, { status: 400 });
  }

  const payload = await getSportsLeagueCardCatalogPayload({
    league,
    surface: surface as "props" | "futures",
  });

  return NextResponse.json({ cards: payload.cards });
}
