import {useEffect, useState} from "react";

export function useDebouncedValue(value, delayMs) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
        return () => clearTimeout(timeout);
    }, [value, delayMs]);

    return debouncedValue;
}