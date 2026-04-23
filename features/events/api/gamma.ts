import type { PolymarketEvent } from "../types";
import { isValidEvent, parseEvent } from "./parse";

const GAMMA_BASE = "https://gamma-api.polymarket.com";

export class GammaError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GammaError";
  }
}

interface ListEventsParams {
  limit: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  tagSlug?: string;
}

export interface ListEventsKeysetParams {
  limit: number;
  order?: string;
  ascending?: boolean;
  tagSlug?: string;
  afterCursor?: string;
  revalidate?: number;
}

export type ListEventsKeysetResult = {
  events: PolymarketEvent[];
  nextCursor: string | null;
};

const buildListUrl = ({
  limit,
  offset,
  order,
  ascending,
  tagSlug,
}: ListEventsParams): string => {
  const params = new URLSearchParams();
  params.set("active", "true");
  params.set("closed", "false");
  params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  if (order !== undefined) params.set("order", order);
  if (ascending !== undefined) params.set("ascending", String(ascending));
  if (tagSlug !== undefined) params.set("tag_slug", tagSlug);
  return `${GAMMA_BASE}/events?${params.toString()}`;
};

const buildListKeysetUrl = ({
  limit,
  order,
  ascending,
  tagSlug,
  afterCursor,
}: ListEventsKeysetParams): string => {
  const params = new URLSearchParams();
  params.set("active", "true");
  params.set("closed", "false");
  params.set("limit", String(limit));
  if (order !== undefined) params.set("order", order);
  if (ascending !== undefined) params.set("ascending", String(ascending));
  if (tagSlug !== undefined) params.set("tag_slug", tagSlug);
  if (afterCursor !== undefined) params.set("after_cursor", afterCursor);
  return `${GAMMA_BASE}/events/keyset?${params.toString()}`;
};

const parseEventList = (payload: unknown): PolymarketEvent[] => {
  if (!Array.isArray(payload)) return [];
  const out: PolymarketEvent[] = [];
  for (const raw of payload) {
    if (isValidEvent(raw)) out.push(parseEvent(raw));
  }
  return out;
};

export const listEvents = async (
  params: ListEventsParams,
): Promise<PolymarketEvent[]> => {
  const url = buildListUrl(params);
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) {
    throw new GammaError(
      `listEvents failed: ${res.status} ${res.statusText}`,
      res.status,
    );
  }
  const payload = await res.json();
  return parseEventList(payload);
};

export const listEventsKeyset = async (
  params: ListEventsKeysetParams,
): Promise<ListEventsKeysetResult> => {
  const url = buildListKeysetUrl(params);
  const res = await fetch(
    url,
    typeof params.revalidate === "number"
      ? { next: { revalidate: params.revalidate } }
      : { cache: "no-store" },
  );
  if (!res.ok) {
    throw new GammaError(
      `listEventsKeyset failed: ${res.status} ${res.statusText}`,
      res.status,
    );
  }

  const payload = await res.json();
  const events = parseEventList(
    payload && typeof payload === "object" && "events" in payload
      ? (payload as { events?: unknown }).events
      : [],
  );

  return {
    events,
    nextCursor:
      payload && typeof payload === "object" && "next_cursor" in payload
        ? String((payload as { next_cursor?: string | null }).next_cursor ?? "")
        : null,
  };
};

export const getEventBySlug = async (
  slug: string,
): Promise<PolymarketEvent> => {
  const url = `${GAMMA_BASE}/events/slug/${encodeURIComponent(slug)}`;
  const res = await fetch(url, { next: { revalidate: 10 } });
  if (!res.ok) {
    throw new GammaError(
      `getEventBySlug(${slug}) failed: ${res.status} ${res.statusText}`,
      res.status,
    );
  }
  const payload = await res.json();
  if (!isValidEvent(payload)) {
    throw new GammaError(`getEventBySlug(${slug}) returned invalid payload`);
  }
  return parseEvent(payload);
};
