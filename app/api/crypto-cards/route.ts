import { NextResponse } from "next/server";
import { getCryptoCatalogPayload } from "@/features/crypto/server";

export const revalidate = 30;

export async function GET() {
  const payload = await getCryptoCatalogPayload();
  return NextResponse.json(payload);
}
