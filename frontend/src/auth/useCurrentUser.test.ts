import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthState, useCurrentUser } from "./useCurrentUser";

const { mockUseConvexAuth, mockUseConvexQuery } = vi.hoisted(() => ({
  mockUseConvexAuth: vi.fn(),
  mockUseConvexQuery: vi.fn(),
}));

vi.mock("@convex-dev/auth/react", () => ({
  useConvexAuth: () => mockUseConvexAuth(),
}));

vi.mock("convex/react", () => ({
  useQuery: (queryRef: unknown) => mockUseConvexQuery(queryRef),
}));

const userDoc = {
  _id: "k57abcdefghijklmnop",
  _creationTime: 1_700_000_000_000,
  email: "traveler@waynora.test",
};

beforeEach(() => {
  mockUseConvexAuth.mockReset();
  mockUseConvexQuery.mockReset();
});

describe("useAuthState", () => {
  it("reports isLoading while the session is resolving — never a resolved unauthenticated (TM-05)", () => {
    // Auth hook still resolving, even though it reports unauthenticated.
    mockUseConvexAuth.mockReturnValue({ isLoading: true, isAuthenticated: false });
    mockUseConvexQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useAuthState());

    // Callers must branch on isLoading first; a resolved negative is
    // { isLoading: false, isAuthenticated: false } and must not be observable
    // while the handshake is still in flight.
    expect(result.current.isLoading).toBe(true);
    expect(result.current).toEqual({
      isAuthenticated: false,
      isLoading: true,
      userId: null,
    });
  });

  it("transitions to authenticated with the user id once resolved", () => {
    mockUseConvexAuth.mockReturnValue({ isLoading: false, isAuthenticated: true });
    mockUseConvexQuery.mockReturnValue(userDoc);

    const { result } = renderHook(() => useAuthState());

    expect(result.current).toEqual({
      isAuthenticated: true,
      isLoading: false,
      userId: userDoc._id,
    });
  });

  it("transitions to resolved unauthenticated when signed out", () => {
    mockUseConvexAuth.mockReturnValue({ isLoading: false, isAuthenticated: false });
    mockUseConvexQuery.mockReturnValue(null);

    const { result } = renderHook(() => useAuthState());

    expect(result.current).toEqual({
      isAuthenticated: false,
      isLoading: false,
      userId: null,
    });
  });

  it("never reports a userId while signed out, even if a stale user document lingers", () => {
    mockUseConvexAuth.mockReturnValue({ isLoading: false, isAuthenticated: false });
    mockUseConvexQuery.mockReturnValue(userDoc);

    const { result } = renderHook(() => useAuthState());

    expect(result.current.userId).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe("useCurrentUser", () => {
  it("returns undefined while the query is loading", () => {
    mockUseConvexAuth.mockReturnValue({ isLoading: true, isAuthenticated: false });
    mockUseConvexQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toBeUndefined();
  });

  it("returns the user document when signed in", () => {
    mockUseConvexAuth.mockReturnValue({ isLoading: false, isAuthenticated: true });
    mockUseConvexQuery.mockReturnValue(userDoc);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toEqual(userDoc);
  });

  it("returns null when signed out", () => {
    mockUseConvexAuth.mockReturnValue({ isLoading: false, isAuthenticated: false });
    mockUseConvexQuery.mockReturnValue(null);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toBeNull();
  });
});
