import { NextRequest, NextResponse } from "next/server";
import {
  getSportsLeagueGamesSectionsPayload,
  getSportsLiveSectionsPayload,
} from "@/features/sports/server";

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("league");

  const payload = league
    ? await getSportsLeagueGamesSectionsPayload(league)
    : await getSportsLiveSectionsPayload();

  return NextResponse.json(payload);
}
