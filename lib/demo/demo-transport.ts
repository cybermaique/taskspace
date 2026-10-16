"use client";

import { createDemoServer, DemoHttpError } from "@/lib/demo/demo-server";
import { createDemoState, type DemoState } from "@/lib/demo/seed";
import type { RequestOptions, Transport } from "@/lib/transport";
import { getBrowserLocale } from "@/lib/i18n/browser";
import { translate } from "@/lib/i18n";

const STORAGE_KEY = "taskboard:demo:v1";
const LATENCY_MS = 180;

export function loadDemoState(): DemoState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as DemoState;
  } catch {
    // Storage blocked or corrupted: start from the seed.
  }
  return createDemoState();
}

function saveDemoState(state: DemoState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persisting is a convenience; the demo keeps working in memory.
  }
}

export function resetDemoState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Serves the app's API from memory so the demo needs no account or database. */
export function createDemoTransport(state: DemoState): Transport {
  const server = createDemoServer(state, getBrowserLocale);
  const respond = async <T>(method: string, url: string, body?: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
    try {
      const result = server.handle(method, url, body) as T;
      saveDemoState(state);
      return result;
    } catch (error) {
      if (error instanceof DemoHttpError) throw new Error(translate(getBrowserLocale(), error.message));
      throw error;
    }
  };

  return {
    mode: "demo",
    request: <T>(url: string, init: RequestOptions = {}) =>
      respond<T>((init.method ?? "GET").toUpperCase(), url, init.json),
    upload: <T>(url: string) => respond<T>("POST", url),
  };
}
