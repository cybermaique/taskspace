"use client";

import { apiRequest, uploadFile } from "@/lib/api-client";

export type RequestOptions = RequestInit & { json?: unknown };

/**
 * How the workspace talks to its backend. The live app uses HTTP route
 * handlers; the demo swaps in an in-memory implementation of the same routes.
 */
export interface Transport {
  mode: "live" | "demo";
  request<T>(url: string, init?: RequestOptions): Promise<T>;
  upload<T>(url: string, file: File): Promise<T>;
}

export const httpTransport: Transport = {
  mode: "live",
  request: apiRequest,
  upload: uploadFile,
};
