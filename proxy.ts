import { NextResponse, type NextRequest } from "next/server";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const NOT_FOUND_ROUTE = "/_not-found";

const isDocumentRequest = (request: NextRequest): boolean => {
  const accept = request.headers.get("accept");
  return accept?.includes("text/html") ?? false;
};

const getEventSlug = (pathname: string): string | null => {
  const match = /^\/event\/([^/]+)\/?$/.exec(pathname);
  return match?.[1] ?? null;
};

const eventExists = async (slug: string): Promise<boolean> => {
  const response = await fetch(
    `${GAMMA_BASE}/events/slug/${encodeURIComponent(slug)}`,
    {
      method: "HEAD",
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return false;
  }

  return response.ok;
};

export async function proxy(request: NextRequest) {
  if (!isDocumentRequest(request)) {
    return NextResponse.next();
  }

  const slug = getEventSlug(request.nextUrl.pathname);
  if (!slug) {
    return NextResponse.next();
  }

  try {
    const exists = await eventExists(slug);
    if (exists) {
      return NextResponse.next();
    }

    return NextResponse.rewrite(new URL(NOT_FOUND_ROUTE, request.url));
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/event/:slug*"],
};
