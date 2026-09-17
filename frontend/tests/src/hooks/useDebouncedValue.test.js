import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "../../../src/hooks/useDebouncedValue";

describe("useDebouncedValue", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns the initial value immediately", () => {
        const { result } = renderHook(() => useDebouncedValue("initial", 300));
        expect(result.current).toBe('initial');
    });

    it("does not update before the delay has passed", () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
            initialProps: { value: 'a' },
        });

        rerender({ value: 'ab' });
        act(() => {
            vi.advanceTimersByTime(200);

            expect(result.current).toBe('a');
        });
    });

    it("updates to the latest value after the delay", () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
            initialProps: { value: 'a' },
        });

        rerender({ value: 'ab' });
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(result.current).toBe('ab');
    });

    it("only reflects the latest value after multiple rapid changes", () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
            initialProps: { value: 'a' },
        });

        rerender({ value: 'ab' });
        act(() => {
            vi.advanceTimersByTime(100);
        });
        rerender({ value: 'abc' });
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(result.current).toBe('abc');
    });
});