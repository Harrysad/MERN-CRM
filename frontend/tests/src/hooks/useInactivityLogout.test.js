import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {renderHook, act} from "@testing-library/react";
import {useInactivityLogout} from "../../../src/hooks/useInactivityLogout";

describe("useInactivityLogout", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    
    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls onWarn after warnAfterMs of inactivity', () => {
        const onWarn = vi.fn();
        const onTimeout = vi.fn();
        renderHook(() => 
            useInactivityLogout({
                enabled: true,
                warnAfterMs: 1000,
                timeoutAfterMs: 2000,
                onWarn,
                onTimeout
            })
        );

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(onWarn).toHaveBeenCalledTimes(1);
        expect(onTimeout).not.toHaveBeenCalled();
    });

    it('calls onTimeout after timeoutAfterMs of inactivity', () => {
        const onWarn = vi.fn();
        const onTimeout = vi.fn();
        renderHook(() => 
            useInactivityLogout({
                enabled: true,
                warnAfterMs: 1000,
                timeoutAfterMs: 2000,
                onWarn,
                onTimeout
            })
        );

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('reset timers when activity happens before the warnin fires', () => {
        const onWarn = vi.fn();
        const onTimeout = vi.fn();
        renderHook(() => 
            useInactivityLogout({
                enabled: true,
                warnAfterMs: 1000,
                timeoutAfterMs: 2000,
                onWarn,
                onTimeout
            })
        );

        act(() => {
            vi.advanceTimersByTime(900);
        });
        act(() => {
            window.dispatchEvent( new Event('mousemove'));
        });
        act(() => {
            vi.advanceTimersByTime(900);
        });

        expect(onWarn).not.toHaveBeenCalled();
    });

    it('does not start any timers when disabled', () => {
        const onWarn = vi.fn();
        const onTimeout = vi.fn();
        renderHook(() =>
            useInactivityLogout({
                enabled: false,
                warnAfterMs: 1000,
                timeoutAfterMs: 2000,
                onWarn,
                onTimeout
            })
        );

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(onWarn).not.toHaveBeenCalled();
        expect(onTimeout).not.toHaveBeenCalled();
    });
});