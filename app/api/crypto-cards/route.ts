import { NextResponse } from "next/server";
import { getCryptoCatalogPayload } from "@/features/crypto/server";

export async function GET() {
  const payload = await getCryptoCatalogPayload();
  return NextResponse.json(payload);
}
