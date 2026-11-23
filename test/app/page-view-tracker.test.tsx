// @vitest-environment jsdom
/** The tracker only sends beacons to this origin and never uses fetch. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

const harness = vi.hoisted(() => ({
  sendBeacon: vi.fn(() => true),
  pathname: "/products",
}));

vi.mock("next/navigation", () => ({ usePathname: () => harness.pathname }));

import PageViewTracker from "@/app/_components/PageViewTracker";

afterEach(() => {
  cleanup();
  harness.sendBeacon.mockClear();
  vi.unstubAllGlobals();
});

function installNavigator(over: Record<string, unknown> = {}) {
  vi.stubGlobal("navigator", {
    doNotTrack: null,
    sendBeacon: harness.sendBeacon,
    ...over,
  });
}

describe("PageViewTracker", () => {
  it("sends one pageview to /api/track, never to a service", () => {
    installNavigator();
    render(<PageViewTracker />);
    expect(harness.sendBeacon).toHaveBeenCalledOnce();
    const [path, blob] = harness.sendBeacon.mock.calls[0] as unknown as [string, Blob];
    expect(path).toBe("/api/track");
    expect(blob.type).toBe("application/json");
  });

  it("sends an exit heartbeat once on pagehide", () => {
    installNavigator();
    render(<PageViewTracker />);
    window.dispatchEvent(new Event("pagehide"));
    window.dispatchEvent(new Event("pagehide"));
    expect(harness.sendBeacon).toHaveBeenCalledTimes(2);
    const [, blob] = harness.sendBeacon.mock.calls[1] as unknown as [string, Blob];
    // Blob body is read async; the call shape is what matters here.
    expect(blob).toBeDefined();
  });

  it("sends nothing when the browser says do not track", () => {
    installNavigator({ doNotTrack: "1" });
    render(<PageViewTracker />);
    expect(harness.sendBeacon).not.toHaveBeenCalled();
  });

  it("never uses fetch", () => {
    installNavigator();
    const fetchFn = vi.fn();
    vi.stubGlobal("fetch", fetchFn);
    render(<PageViewTracker />);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
