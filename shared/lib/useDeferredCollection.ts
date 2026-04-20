"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";

type DeferredCollectionOptions<T> = {
  endpoint?: string;
  initialItems: ReadonlyArray<T>;
  selectItems: (payload: unknown) => ReadonlyArray<T>;
  preload?: boolean;
};

export function useDeferredCollection<T>({
  endpoint,
  initialItems,
  selectItems,
  preload = true,
}: DeferredCollectionOptions<T>) {
  const [items, setItems] = useState<ReadonlyArray<T> | null>(null);
  const requestRef = useRef<Promise<ReadonlyArray<T>> | null>(null);

  const ensureItems = useCallback(async (): Promise<ReadonlyArray<T>> => {
    if (items) {
      return items;
    }

    if (!endpoint) {
      return initialItems;
    }

    if (requestRef.current) {
      return requestRef.current;
    }

    const nextRequest = fetch(endpoint, { method: "GET" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Unable to load deferred collection from ${endpoint}`);
        }

        return selectItems(await response.json());
      })
      .then((nextItems) => {
        startTransition(() => {
          setItems(nextItems);
        });

        return nextItems;
      })
      .finally(() => {
        requestRef.current = null;
      });

    requestRef.current = nextRequest;
    return nextRequest;
  }, [endpoint, initialItems, items, selectItems]);

  useEffect(() => {
    if (!endpoint || !preload) {
      return;
    }

    void ensureItems().catch(() => null);
  }, [endpoint, ensureItems, preload]);

  return {
    items: items ?? initialItems,
    ensureItems,
    hasLoadedDeferredItems: items !== null,
  };
}
