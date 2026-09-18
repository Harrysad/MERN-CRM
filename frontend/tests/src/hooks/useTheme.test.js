import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../../../src/hooks/useTheme";

function mockMatchMedia(matches) {
    const listeners = [];
    window.matchMedia = vi.fn().mockReturnValue({
        matches,
        addEventListener: (event, cb) => listeners.push(cb),
        removeEventListener: vi.fn(),
    });
    return {
        trigger: (newMatches) => listeners.forEach((cb) => cb({ matches: newMatches })),
    };
}

describe("useTheme", () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute("data-theme", () => { });
    });

    it("dafaults to system light pregference when nothing is stored", () => {
        mockMatchMedia(false);
        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe("light");
    });

    it("defaults to system dark preference when nothing is stored", () => {
        mockMatchMedia(true);
        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe("dark");
    });

    it("uses the stored preference over the system one", () => {
        mockMatchMedia(true);
        localStorage.setItem("theme", "light");
        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe("light");
    });

    it("toggleTheme switches and persists the choice", () => {
        mockMatchMedia(false);
        const { result } = renderHook(() => useTheme());
        act(() => result.current.toggleTheme());
        expect(result.current.theme).toBe('dark');
        expect(localStorage.getItem("theme")).toBe("dark")
    });

    it("sets the data-theme attribute on the html element", () => {
        mockMatchMedia(true);
        renderHook(() => useTheme());
        expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    it("sets the Nootstrap theme attribute so Bootstrap components follow", () => {
        mockMatchMedia(true);
        renderHook(() => useTheme());
        expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");
    })
});