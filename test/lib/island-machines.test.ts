/**
 * sf-086 resolver-unit tier: the interaction machines behind the 13 migrated
 * islands. These tests pin the transitions that used to be scattered useState
 * setters — no React, no DOM.
 */
import { describe, expect, it } from "vitest";
import { cartIslandMachine, initialCartIslandMachine } from "@/lib/cart/viewMachine";
import {
  checkoutFieldsMachine,
  initialCheckoutFields,
  stripAddress,
} from "@/lib/checkout/fieldsMachine";
import { initialNavUiMachine, navUiMachine } from "@/lib/shell/navUiMachine";
import { initialSearchMountMachine, searchMountMachine } from "@/lib/search/mountMachine";
import {
  canSubmitReview,
  initialReviewFormMachine,
  reviewFormMachine,
} from "@/lib/reviews/machine";
import {
  canChangePassword,
  initialPasswordFormMachine,
  initialProfileFormMachine,
  passwordFormMachine,
  profileFormMachine,
} from "@/lib/account/formsMachine";
import {
  initialProductGridIslandMachine,
  productGridIslandMachine,
} from "@/lib/commerce/gridMachine";
import { initialOverlayMachine, overlayMachine } from "@/lib/overlay/machine";

describe("cart island machine", () => {
  it("prunes stale selections and keeps draft/writes keyed by line", () => {
    let state = cartIslandMachine(initialCartIslandMachine(), { type: "select/toggle", id: "a" });
    state = cartIslandMachine(state, { type: "select/toggle", id: "b" });
    state = cartIslandMachine(state, { type: "select/prune", ids: ["b"] });
    expect(state.selectedIds).toEqual(["b"]);
    expect(cartIslandMachine(state, { type: "select/prune", ids: ["b"] })).toBe(state);
    state = cartIslandMachine(state, { type: "draft/set", id: "b", qty: 3 });
    state = cartIslandMachine(state, { type: "write/start", id: "b" });
    expect(state.pendingIds).toEqual(["b"]);
    expect(cartIslandMachine(state, { type: "write/start", id: "b" })).toBe(state);
    state = cartIslandMachine(state, { type: "write/finish", id: "b" });
    state = cartIslandMachine(state, { type: "draft/delete", id: "b" });
    expect(state.pendingIds).toEqual([]);
    expect(state.drafts).toEqual({});
  });

  it("owns the whole coupon face in one transition", () => {
    let state = cartIslandMachine(initialCartIslandMachine(), { type: "coupon/type", code: "SAVE" });
    state = cartIslandMachine(state, { type: "coupon/start" });
    expect(state.couponStatus).toBe("loading");
    state = cartIslandMachine(state, {
      type: "coupon/error",
      message: "Invalid coupon code",
    });
    expect(state.couponStatus).toBe("error");
    state = cartIslandMachine(state, {
      type: "coupon/success",
      result: { valid: true, code: "SAVE10", discountType: "percent", value: 10 },
    });
    expect(state.couponStatus).toBe("success");
    expect(cartIslandMachine(state, { type: "coupon/clear" }).couponCode).toBe("");
  });
});

describe("checkout field machine", () => {
  it("fills shipping from a saved address and strips optional blanks", () => {
    let state = checkoutFieldsMachine(initialCheckoutFields(), {
      type: "addresses/success",
      addresses: [
        {
          id: "a1",
          label: "Home",
          line1: "9 Saved St",
          city: "Portland",
          postalCode: "97201",
          country: "US",
        },
      ],
    });
    state = checkoutFieldsMachine(state, { type: "address/select", id: "a1" });
    expect(state.shipping.line1).toBe("9 Saved St");
    state = checkoutFieldsMachine(state, {
      type: "field/set",
      group: "shipping",
      name: "line2",
      value: "",
    });
    expect(stripAddress(state.shipping)).toEqual({
      line1: "9 Saved St",
      city: "Portland",
      postalCode: "97201",
      country: "US",
    });
  });

  it("keeps billing separate until the same-billing flag changes", () => {
    let state = checkoutFieldsMachine(initialCheckoutFields(), {
      type: "field/set",
      group: "billing",
      name: "city",
      value: "Rome",
    });
    expect(state.shipping.city).toBe("");
    state = checkoutFieldsMachine(state, { type: "same-billing/set", same: false });
    expect(state.sameBilling).toBe(false);
    state = checkoutFieldsMachine(state, { type: "method/set", method: "express" });
    state = checkoutFieldsMachine(state, { type: "notes/set", notes: "Leave at door" });
    expect(state.shippingMethod).toBe("express");
    expect(state.notes).toBe("Leave at door");
  });
});

describe("shell/mount machines", () => {
  it("keeps navbar disclosures independent and wraps announcements", () => {
    let state = navUiMachine(initialNavUiMachine(), { type: "mobile/open" });
    state = navUiMachine(state, { type: "account/toggle" });
    expect(state.mobileOpen).toBe(true);
    expect(state.accountMenuOpen).toBe(true);
    state = navUiMachine(state, { type: "account/close" });
    expect(state.accountMenuOpen).toBe(false);
    expect(navUiMachine(state, { type: "announcement/prev", count: 3 }).announcementIndex).toBe(2);
    state = navUiMachine(state, { type: "announcement/dismiss/start" });
    expect(state.announcementClosing).toBe(true);
    state = navUiMachine(state, { type: "announcement/dismiss/finish" });
    expect(state.announcementDismissed).toBe(true);
    expect(navUiMachine(state, { type: "load/ready" }).status).toBe("ready");
  });

  it("owns search exit, toast and editorial assets", () => {
    let state = searchMountMachine(initialSearchMountMachine(), { type: "close/start" });
    expect(state.closing).toBe(true);
    state = searchMountMachine(state, { type: "close/finish" });
    expect(state.closing).toBe(false);
    state = searchMountMachine(state, {
      type: "toast/show",
      toast: { title: "Added to bag", message: "Mug" },
    });
    expect(state.toast?.message).toBe("Mug");
    state = searchMountMachine(state, { type: "toast/clear" });
    expect(state.toast).toBeNull();
    state = searchMountMachine(state, {
      type: "assets/success",
      terms: ["Linen"],
      curated: [],
    });
    expect(state.trending).toEqual(["Linen"]);
    expect(state.status).toBe("ready");
  });
});

describe("form machines", () => {
  it("queues a review without publishing it and keeps the draft on error", () => {
    let state = initialReviewFormMachine();
    expect(canSubmitReview(state)).toBe(false);
    state = reviewFormMachine(state, { type: "rating/set", rating: 9 });
    expect(state.rating).toBe(5);
    state = reviewFormMachine(state, { type: "body/set", body: "Good fit" });
    state = reviewFormMachine(state, { type: "open/toggle" });
    expect(state.open).toBe(true);
    state = reviewFormMachine(state, { type: "submit/start" });
    expect(state.status).toBe("loading");
    state = reviewFormMachine(state, { type: "submit/error" });
    expect(state.body).toBe("Good fit");
    state = reviewFormMachine(state, { type: "submit/start" });
    state = reviewFormMachine(state, { type: "submit/success" });
    expect(state.queued).toBe(true);
    expect(state.open).toBe(false);
  });

  it("keeps profile drafts and clears password secrets on success", () => {
    let profile = profileFormMachine(initialProfileFormMachine("Ana", ""), {
      type: "field/set",
      name: "last",
      value: "Silva",
    });
    profile = profileFormMachine(profile, { type: "submit/start" });
    expect(profile.status).toBe("loading");
    expect(profileFormMachine(profile, { type: "submit/success" }).status).toBe("success");

    let password = passwordFormMachine(initialPasswordFormMachine(), {
      type: "field/set",
      name: "current",
      value: "old123",
    });
    password = passwordFormMachine(password, { type: "field/set", name: "next", value: "weak" });
    expect(canChangePassword(password)).toBe(false);
    password = passwordFormMachine(password, { type: "field/set", name: "next", value: "new12345" });
    password = passwordFormMachine(password, {
      type: "field/set",
      name: "confirm",
      value: "new12345",
    });
    expect(canChangePassword(password)).toBe(true);
    const changed = passwordFormMachine(password, { type: "submit/success" });
    expect(changed.current).toBe("");
    expect(changed.status).toBe("success");
  });
});

describe("grid and overlay island machines", () => {
  it("closes quick view without leaving a stale flash row", () => {
    let state = productGridIslandMachine(initialProductGridIslandMachine(), {
      type: "flash/add",
      id: "p1",
    });
    expect(productGridIslandMachine(state, { type: "flash/add", id: "p1" })).toBe(state);
    state = productGridIslandMachine(state, { type: "quickview/open", product: {} as never });
    expect(state.activeProduct).not.toBeNull();
    state = productGridIslandMachine(state, { type: "quickview/close" });
    expect(state.activeProduct).toBeNull();
    expect(state.flashIds).toEqual(["p1"]);
    expect(productGridIslandMachine(state, { type: "flash/remove", id: "p1" }).flashIds).toEqual([]);
  });

  it("uses one add lifecycle for adding, added and failure faces", () => {
    const adding = overlayMachine(initialOverlayMachine(), { type: "add/start" });
    expect(adding.status).toBe("loading");
    expect(overlayMachine(adding, { type: "add/success" }).status).toBe("success");
    expect(overlayMachine(adding, { type: "add/reset" }).status).toBe("ready");
    expect(overlayMachine(adding, { type: "add/error", message: "no" }).message).toBe("no");
  });
});
