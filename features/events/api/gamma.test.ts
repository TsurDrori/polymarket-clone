import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/gamma-event-sample.json";
import { listEventsKeyset } from "./gamma";

describe("listEventsKeyset", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves the requested order value for keyset requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          events: (fixture as { events: unknown[] }).events,
          next_cursor: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await listEventsKeyset({
      limit: 20,
      order: "volume_24hr",
      ascending: false,
      tagSlug: "crypto",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("order=volume_24hr"),
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});
