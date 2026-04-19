"use client";

import { Provider } from "jotai";
import type { ReactNode } from "react";
import { getRealtimeStore } from "@/features/realtime/store";

export function Providers({ children }: { children: ReactNode }) {
  return <Provider store={getRealtimeStore()}>{children}</Provider>;
}
