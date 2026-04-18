import { render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import { describe, expect, it } from "vitest";
import fixture from "@/fixtures/gamma-event-sample.json";
import { parseEvent } from "@/features/events/api/parse";
import { PriceCell } from "@/features/events/components/PriceCell";
import { formatCents, formatPct } from "@/shared/lib/format";
import { Hydrator } from "./Hydrator";

const event = parseEvent(fixture.events[0]);
const market = event.markets[0];

describe("Hydrator", () => {
  it("seeds live prices from server data before websocket updates arrive", () => {
    render(
      <Provider>
        <Hydrator events={[event]} />
        <PriceCell tokenId={market.clobTokenIds[0]} format={formatPct} />
        <PriceCell tokenId={market.clobTokenIds[1]} format={formatCents} />
      </Provider>,
    );

    expect(screen.getByText("17%")).toBeTruthy();
    expect(screen.getByText(formatCents(market.outcomePrices[1]))).toBeTruthy();
  });
});
