import {useCallback, useEffect, useRef} from 'react';

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll"];

export function useInactivityLogout({enabled, warnAfterMs, timeoutAfterMs, onWarn, onTimeout})
{
    const warnTimerRef = useRef(null);
    const timeoutTimerRef = useRef(null);
    const pausedRef = useRef(false);

    const clearTimeres = useCallback(() => {
        clearTimeout(warnTimerRef.current);
        clearTimeout(timeoutTimerRef.current);
    }, []);

    const scheduleTimers = useCallback(() => {
        clearTimeres();
        warnTimerRef.current = setTimeout(() => {
            pausedRef.current = true;
            onWarn();
        }, warnAfterMs);
        timeoutTimerRef.current = setTimeout(onTimeout, timeoutAfterMs);
    }, [clearTimeres, onTimeout, onWarn, warnAfterMs, timeoutAfterMs]);

    const handleActivity = useCallback(() => {
        if (pausedRef.current) return;
        scheduleTimers();
    }, [scheduleTimers]);

    useEffect(() => {
        if (!enabled) return undefined;

        scheduleTimers();
        ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity));

        return () => {
            clearTimeres();
            ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
        }
    }, [enabled, handleActivity, scheduleTimers, clearTimeres]);

    const confirmActive = useCallback(() => {
        pausedRef.current = false;
        scheduleTimers();
    }, [scheduleTimers]);

    return {confirmActive};
}