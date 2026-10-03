import {useCallback, useEffect, useState} from 'react';

export function useCountdown() {
    const [secondsLeft, setSecondsLeft] = useState(0);
    const active = secondsLeft > 0;

    useEffect(() => {
        if (!active) 
return;
        const interval = setInterval(() => {
            setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [active]);

    const start = useCallback((seconds) => setSecondsLeft(seconds), []);

    return { secondsLeft, start };
}