/**
 * Registry — the two properties every call site depends on:
 * the env var is read at *call* time (not import time), and a trailing slash
 * never leaks into a path. Both are silent bugs otherwise: the first shows up
 * as "tests pass alone, fail together", the second as a 404 from one proxy.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SERVICE_NAMES,
  serviceTimeout,
  serviceUrl,
  SERVICES,
} from "@/lib/services/urls";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("serviceUrl", () => {
  it("falls back to the documented local port for every service", () => {
    expect(serviceUrl("auth")).toBe("http://localhost:4010");
    expect(serviceUrl("cms")).toBe("http://localhost:4050");
    expect(serviceUrl("catalog")).toBe("http://localhost:4020");
    expect(serviceUrl("cart")).toBe("http://localhost:4030");
    expect(serviceUrl("order")).toBe("http://localhost:4040");
    expect(serviceUrl("search")).toBe("http://localhost:4090");
  });

  it("reads the env var at call time, not at import time", () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.container:9000");
    expect(serviceUrl("cart")).toBe("http://cart.container:9000");

    vi.stubEnv("CART_SVC_URL", "http://cart.other:9100");
    expect(serviceUrl("cart")).toBe("http://cart.other:9100");
  });

  it("strips trailing slashes so callers own the path fragment", () => {
    vi.stubEnv("CATALOG_SVC_URL", "http://catalog.test///");
    expect(serviceUrl("catalog")).toBe("http://catalog.test");
  });

  it("treats an empty or blank env var as unset", () => {
    vi.stubEnv("ORDER_SVC_URL", "   ");
    expect(serviceUrl("order")).toBe("http://localhost:4040");
    expect(serviceUrl("search")).toBe("http://localhost:4090");
  });

  it("prefers an explicit value — the edge-safe path proxy.ts uses", () => {
    vi.stubEnv("AUTH_SVC_URL", "http://ignored.test");
    expect(serviceUrl("auth", "http://static.test/")).toBe("http://static.test");
  });

  it("keeps CMS_BASE_URL as the historic env name", () => {
    vi.stubEnv("CMS_BASE_URL", "http://cms.test");
    expect(serviceUrl("cms")).toBe("http://cms.test");
    expect(SERVICES.cms.env).toBe("CMS_BASE_URL");
  });
});

describe("serviceTimeout", () => {
  it("budgets the payment path wider than catalog reads", () => {
    expect(serviceTimeout("order")).toBe(8000);
    expect(serviceTimeout("catalog")).toBe(2500);
    expect(serviceTimeout("order")).toBeGreaterThan(serviceTimeout("catalog"));
  });

  it("declares exactly the five registered services", () => {
    expect(SERVICE_NAMES).toEqual(["auth", "cms", "catalog", "cart", "order", "search"]);
  });
});
