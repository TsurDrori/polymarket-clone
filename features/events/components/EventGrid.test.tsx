import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PolymarketEvent } from "@/features/events/types";
import { EventGrid } from "./EventGrid";

vi.mock("./EventCard", () => ({
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

describe("EventGrid", () => {
  it("reveals more events through the shared continuation affordance", () => {
    render(
      <EventGrid
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

  it("resets the visible window when a new event batch arrives", () => {
    const { rerender } = render(
      <EventGrid
        events={[buildEvent("1"), buildEvent("2"), buildEvent("3"), buildEvent("4")]}
        initialCount={2}
        incrementCount={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show more markets" }));
    expect(screen.getByText("Event 3")).toBeTruthy();

    rerender(
      <EventGrid
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

    expect(screen.queryByText("Event 3")).toBeNull();
    expect(screen.getByText("Event 1")).toBeTruthy();
    expect(screen.getByText("Event 2")).toBeTruthy();
  });
});
