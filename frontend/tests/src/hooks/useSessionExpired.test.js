import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useSessionExpired } from "../../../src/hooks/useSessionExpired";
import { SESSION_EXPIRED_EVENT } from "../../../src/apiService/createApiClient";

describe("useSessionExpired", () => {
  it("calls the callback when the session expires", () => {
    const onExpired = vi.fn();
    renderHook(() => useSessionExpired(onExpired));

    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("stops listening after it is unmounted", () => {
    const onExpired = vi.fn();
    const { unmount } = renderHook(() => useSessionExpired(onExpired));

    unmount();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));

    expect(onExpired).not.toHaveBeenCalled();
  });
});
