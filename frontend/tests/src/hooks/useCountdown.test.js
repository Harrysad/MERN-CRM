import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../../../src/hooks/useCountdown';

describe("useCountdown", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("starts at zero", () => {
        const { result } = renderHook(() => useCountdown());
        expect(result.current.secondsLeft).toBe(0);
    });

    it("counts down once per second after start", () => {
        const { result } = renderHook(() => useCountdown());

        act(() => {
            result.current.start(3);
        })
        expect(result.current.secondsLeft).toBe(3);

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(result.current.secondsLeft).toBe(2);

        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(result.current.secondsLeft).toBe(0);
    });

    it("does not go below zero", () => {
        const { result } = renderHook(() => useCountdown());

        act(() => {
            result.current.start(1);
        });
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(result.current.secondsLeft).toBe(0);
    });

    it("can be restarted with a new value", () => {
        const { result } = renderHook(() => useCountdown());

        act(() => {
            result.current.start(5);
        });
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(result.current.secondsLeft).toBe(3);

        act(() => {
            result.current.start(10);
        });
        expect(result.current.secondsLeft).toBe(10);
    })
});