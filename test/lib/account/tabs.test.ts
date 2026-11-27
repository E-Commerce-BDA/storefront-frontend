import { describe, expect, it } from "vitest";
import {
  accountTabEvent,
  accountTabHref,
  accountTabsMachine,
  initialAccountTabsMachine,
  parseAccountTab,
} from "@/lib/account/machine";

describe("account tab deep links (sf-094)", () => {
  it("parses only linkable tabs and falls back on junk", () => {
    expect(parseAccountTab("orders")).toBe("orders");
    expect(parseAccountTab("wishlist")).toBe("wishlist");
    expect(parseAccountTab("orderDetail")).toBe("overview");
    expect(parseAccountTab(["PROFILE"])).toBe("overview");
  });

  it("emits canonical hrefs", () => {
    expect(accountTabHref("overview")).toBe("/account");
    expect(accountTabHref("addresses")).toBe("/account?tab=addresses");
  });

  it("translates a tab into a machine event without a second store", () => {
    const state = initialAccountTabsMachine("overview");
    expect(accountTabsMachine(state, accountTabEvent("orders")).tab).toBe("orders");
    expect(accountTabsMachine(state, accountTabEvent("overview"))).toBe(state);
  });
});
