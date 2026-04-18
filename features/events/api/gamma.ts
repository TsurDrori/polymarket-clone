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

export interface ListEventsParams {
  limit: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
}

const buildListUrl = ({
  limit,
  offset,
  order,
  ascending,
}: ListEventsParams): string => {
  const params = new URLSearchParams();
  params.set("active", "true");
  params.set("closed", "false");
  params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  if (order !== undefined) params.set("order", order);
  if (ascending !== undefined) params.set("ascending", String(ascending));
  return `${GAMMA_BASE}/events?${params.toString()}`;
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
