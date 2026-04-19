"use client";

import { useSyncExternalStore } from "react";
import { getActiveHomeSection } from "./activeTab";

const URL_CHANGE_EVENT = "polymarket-clone:urlchange";

let restorePatchedHistory: (() => void) | null = null;
let historySubscriberCount = 0;

const emitUrlChange = () => {
  window.dispatchEvent(new Event(URL_CHANGE_EVENT));
};

const ensurePatchedHistory = () => {
  if (restorePatchedHistory) {
    historySubscriberCount += 1;
    return;
  }

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = (...args) => {
    originalPushState(...args);
    emitUrlChange();
  };

  window.history.replaceState = (...args) => {
    originalReplaceState(...args);
    emitUrlChange();
  };

  historySubscriberCount = 1;
  restorePatchedHistory = () => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    restorePatchedHistory = null;
  };
};

const subscribeToUrlChanges = (callback: () => void) => {
  ensurePatchedHistory();

  const handleChange = () => {
    callback();
  };

  window.addEventListener("hashchange", handleChange);
  window.addEventListener("popstate", handleChange);
  window.addEventListener(URL_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("hashchange", handleChange);
    window.removeEventListener("popstate", handleChange);
    window.removeEventListener(URL_CHANGE_EVENT, handleChange);

    historySubscriberCount -= 1;

    if (historySubscriberCount === 0) {
      restorePatchedHistory?.();
    }
  };
};

const readHomeSection = (): "trending" | "breaking-news" | "all-markets" =>
  typeof window === "undefined"
    ? "trending"
    : getActiveHomeSection(window.location.hash);

export const useActiveHomeSection = (
  pathname: string,
): "trending" | "breaking-news" | "all-markets" => {
  const activeSection = useSyncExternalStore<
    "trending" | "breaking-news" | "all-markets"
  >(
    subscribeToUrlChanges,
    readHomeSection,
    () => "trending",
  );

  return pathname === "/" ? activeSection : "trending";
};
