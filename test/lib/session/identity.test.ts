/**
 * `readIdentity` — one reader for "who is asking".
 *
 * The point of these tests is the *separation*: the reader reports the guest id
 * as a value (login needs it to merge a cart) while the headers only ever carry
 * it as `x-session-id`. A signed-in shopper's stale `sf_cid` must lose to the
 * Bearer token, and a malformed `sf_cid` must vanish rather than be forwarded.
 */
import { describe, expect, it } from "vitest";
import { ACCESS_COOKIE, type CookieReader } from "@/lib/auth/session";
import { GUEST_COOKIE } from "@/lib/session/guest";
import { hasIdentity, identityHeaders, readIdentity } from "@/lib/session/identity";

function jar(cookies: Record<string, string>): CookieReader {
  return {
    get: (name) => (name in cookies ? { value: cookies[name] } : undefined),
  };
}

const GUEST = "guest-1234";

describe("readIdentity", () => {
  it("reports nobody when the jar is empty", () => {
    const identity = readIdentity(jar({}));

    expect(identity).toEqual({ userId: null, accessToken: null, sessionId: null });
    expect(hasIdentity(identity)).toBe(false);
    expect(identityHeaders(identity)).toEqual({});
  });

  it("reports a guest from sf_cid", () => {
    const identity = readIdentity(jar({ [GUEST_COOKIE]: GUEST }));

    expect(identity.sessionId).toBe(GUEST);
    expect(identity.accessToken).toBeNull();
    expect(hasIdentity(identity)).toBe(true);
    expect(identityHeaders(identity)).toEqual({ "x-session-id": GUEST });
  });

  it("reports a shopper from the access cookie", () => {
    const identity = readIdentity(jar({ [ACCESS_COOKIE]: "at_1" }));

    expect(identity.accessToken).toBe("at_1");
    expect(identity.sessionId).toBeNull();
    expect(identityHeaders(identity)).toEqual({ authorization: "Bearer at_1" });
  });

  it("sends both when both exist, Bearer first", () => {
    // cart-svc's guard checks `authorization` before `x-session-id`, so the
    // stale guest id can never win the race with a live session.
    const headers = identityHeaders(
      readIdentity(jar({ [ACCESS_COOKIE]: "at_1", [GUEST_COOKIE]: GUEST })),
    );

    expect(headers).toEqual({
      authorization: "Bearer at_1",
      "x-session-id": GUEST,
    });
    expect(Object.keys(headers)).toEqual(["authorization", "x-session-id"]);
  });

  it("drops a malformed sf_cid instead of forwarding it", () => {
    // cart-svc would 400 every cart call on a bad id, and the shopper cannot
    // clear an HttpOnly cookie from the UI.
    const identity = readIdentity(jar({ [GUEST_COOKIE]: "not a valid id" }));

    expect(identity.sessionId).toBeNull();
    expect(identityHeaders(identity)).toEqual({});
  });

  it("treats an empty access cookie as signed out", () => {
    const identity = readIdentity(jar({ [ACCESS_COOKIE]: "" }));

    expect(identity.accessToken).toBeNull();
    expect(hasIdentity(identity)).toBe(false);
  });
});
