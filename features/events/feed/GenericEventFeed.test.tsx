import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PolymarketEvent } from "../types";
import { GenericEventFeed } from "./GenericEventFeed";

vi.mock("../components/EventCard", () => ({
  EventCard: ({ event }: { event: Pick<PolymarketEvent, "title"> }) => (
    <article>{event.title}</article>
  ),
}));

const buildEvent = (id: string): PolymarketEvent =>
  ({
    id,
    slug: `event-${id}`,
    title: `Event ${id}`,
  } as PolymarketEvent);

describe("GenericEventFeed", () => {
  it("reveals more events through the shared continuation window", () => {
    render(
      <GenericEventFeed
        events={[buildEvent("1"), buildEvent("2"), buildEvent("3"), buildEvent("4")]}
        initialCount={2}
        incrementCount={1}
      />,
    );

    expect(screen.getByText("Event 1")).toBeTruthy();
    expect(screen.getByText("Event 2")).toBeTruthy();
    expect(screen.queryByText("Event 3")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show more markets" }));

    expect(screen.getByText("Event 3")).toBeTruthy();
  });

  it("preserves the visible slice when a new event batch is appended", () => {
    const { rerender } = render(
      <GenericEventFeed
        events={[buildEvent("1"), buildEvent("2"), buildEvent("3"), buildEvent("4")]}
        initialCount={2}
        incrementCount={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show more markets" }));
    expect(screen.getByText("Event 3")).toBeTruthy();

    rerender(
      <GenericEventFeed
        events={[
          buildEvent("1"),
          buildEvent("2"),
          buildEvent("3"),
          buildEvent("4"),
          buildEvent("5"),
        ]}
        initialCount={2}
        incrementCount={1}
      />,
    );

    expect(screen.getByText("Event 3")).toBeTruthy();
    expect(screen.getByText("Event 1")).toBeTruthy();
    expect(screen.getByText("Event 2")).toBeTruthy();
    expect(screen.queryByText("Event 4")).toBeNull();
  });
});
