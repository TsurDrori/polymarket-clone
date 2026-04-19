"use client";

import { useState } from "react";
import { EventGrid } from "@/features/events/components/EventGrid";
import type { PolymarketEvent } from "@/features/events/types";
import { Chip } from "@/shared/ui/Chip";
import {
  CRYPTO_COIN_OPTIONS,
  CRYPTO_MARKET_TYPE_OPTIONS,
  CRYPTO_TIME_OPTIONS,
  type CryptoCoin,
  type CryptoMarketType,
  type CryptoTimeBucket,
  getCryptoCoin,
  getCryptoMarketType,
  getCryptoTimeBucket,
} from "../filters";
import styles from "./CryptoExplorer.module.css";

type CryptoExplorerProps = {
  events: ReadonlyArray<PolymarketEvent>;
};

export function CryptoExplorer({ events }: CryptoExplorerProps) {
  const [selectedTime, setSelectedTime] = useState<CryptoTimeBucket>("all");
  const [selectedMarketType, setSelectedMarketType] =
    useState<CryptoMarketType>("all");
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin>("all");

  const timeCounts = new Map<CryptoTimeBucket, number>();
  const marketTypeCounts = new Map<CryptoMarketType, number>();
  const coinCounts = new Map<CryptoCoin, number>();

  for (const option of CRYPTO_TIME_OPTIONS) timeCounts.set(option.value, 0);
  for (const option of CRYPTO_MARKET_TYPE_OPTIONS) {
    marketTypeCounts.set(option.value, 0);
  }
  for (const option of CRYPTO_COIN_OPTIONS) coinCounts.set(option.value, 0);

  for (const event of events) {
    const timeBucket = getCryptoTimeBucket(event);
    const marketType = getCryptoMarketType(event);
    const coin = getCryptoCoin(event);

    timeCounts.set("all", (timeCounts.get("all") ?? 0) + 1);
    marketTypeCounts.set("all", (marketTypeCounts.get("all") ?? 0) + 1);
    coinCounts.set("all", (coinCounts.get("all") ?? 0) + 1);

    timeCounts.set(timeBucket, (timeCounts.get(timeBucket) ?? 0) + 1);
    marketTypeCounts.set(
      marketType,
      (marketTypeCounts.get(marketType) ?? 0) + 1,
    );
    coinCounts.set(coin, (coinCounts.get(coin) ?? 0) + 1);
  }

  const filteredEvents = events.filter((event) => {
    if (selectedTime !== "all" && getCryptoTimeBucket(event) !== selectedTime) {
      return false;
    }

    if (
      selectedMarketType !== "all" &&
      getCryptoMarketType(event) !== selectedMarketType
    ) {
      return false;
    }

    if (selectedCoin !== "all" && getCryptoCoin(event) !== selectedCoin) {
      return false;
    }

    return true;
  });

  return (
    <section className={styles.root}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Category surface</p>
          <h1 className={styles.title}>Crypto</h1>
        </div>
        <p className={styles.copy}>
          Time buckets, market-type chips, and asset filters modeled after the
          current Polymarket crypto hub.
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          {CRYPTO_TIME_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              active={selectedTime === option.value}
              onClick={() => setSelectedTime(option.value)}
            >
              {option.label} {timeCounts.get(option.value) ?? 0}
            </Chip>
          ))}
        </div>

        <div className={styles.controlRow}>
          {CRYPTO_COIN_OPTIONS.map((option) => {
            const count = coinCounts.get(option.value) ?? 0;
            if (option.value !== "all" && count === 0) return null;

            return (
              <Chip
                key={option.value}
                active={selectedCoin === option.value}
                onClick={() => setSelectedCoin(option.value)}
              >
                {option.label} {count}
              </Chip>
            );
          })}
        </div>

        <div className={styles.sortRow}>
          <span className={styles.staticChip}>24hr Volume</span>
          <span className={styles.staticChip}>All</span>
        </div>

        <div className={styles.controlRow}>
          {CRYPTO_MARKET_TYPE_OPTIONS.map((option) => {
            const count = marketTypeCounts.get(option.value) ?? 0;
            if (option.value !== "all" && count === 0) return null;

            return (
              <Chip
                key={option.value}
                active={selectedMarketType === option.value}
                onClick={() => setSelectedMarketType(option.value)}
              >
                {option.label}
              </Chip>
            );
          })}
        </div>
      </div>

      {filteredEvents.length > 0 ? (
        <EventGrid events={filteredEvents} />
      ) : (
        <div className={styles.emptyState}>
          No crypto markets match the active combination of time, type, and
          asset filters.
        </div>
      )}
    </section>
  );
}
