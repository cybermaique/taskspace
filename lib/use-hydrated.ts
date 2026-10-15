"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after hydration; use for output that depends on the viewer's clock or timezone. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
