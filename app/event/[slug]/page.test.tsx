import { describe, expect, it, vi } from "vitest";

const { getEventBySlug, notFound } = vi.hoisted(() => ({
  getEventBySlug: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound,
}));

vi.mock("@/features/events/api/gamma", async () => {
  const actual = await vi.importActual<typeof import("@/features/events/api/gamma")>(
    "@/features/events/api/gamma",
  );

  return {
    ...actual,
    getEventBySlug,
  };
});

import { GammaError } from "@/features/events/api/gamma";
import EventPage from "./page";

describe("EventPage", () => {
  it("maps a Gamma 404 to notFound()", async () => {
    getEventBySlug.mockRejectedValueOnce(
      new GammaError("missing event", 404),
    );

    await expect(
      EventPage({
        params: Promise.resolve({ slug: "missing-event" }),
      } as PageProps<"/event/[slug]">),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
