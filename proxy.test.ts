import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("proxy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rewrites missing event slugs to the non-streamed not-found route", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 404,
        statusText: "Not Found",
      }),
    );

    const response = await proxy(
      new NextRequest("http://localhost:3000/event/missing-event", {
        headers: {
          accept: "text/html",
        },
      }),
    );

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost:3000/_not-found",
    );
  });

  it("passes through existing event slugs", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 200,
        statusText: "OK",
      }),
    );

    const response = await proxy(
      new NextRequest("http://localhost:3000/event/2026-nba-champion", {
        headers: {
          accept: "text/html",
        },
      }),
    );

    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("skips the preflight check for non-document event requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await proxy(
      new NextRequest("http://localhost:3000/event/missing-event", {
        headers: {
          accept: "text/x-component",
        },
      }),
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
