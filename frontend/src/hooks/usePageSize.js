import { useCallback, useState } from "react";

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
export const DEFAULT_PAGE_SIZE = 10;
const STORAGE_KEY = "pageSize";

function readStoredPageSize() {
    try {
        const stored = Number(localStorage.getItem(STORAGE_KEY));
        return PAGE_SIZE_OPTIONS.includes(stored) ? stored : DEFAULT_PAGE_SIZE;
    } catch {
        return DEFAULT_PAGE_SIZE;
    }
}

export function usePageSize() {
    const [pageSize, setPageSizeState] = useState(readStoredPageSize);

    const setPageSize = useCallback((size) => {
        const next = Number(size);
        if (!PAGE_SIZE_OPTIONS.includes(next)) return;
        setPageSizeState(next);
        try {
            localStorage.setItem(STORAGE_KEY, String(next));
        } catch {
            // storage unavailable
        }
    }, []);

    return {pageSize, setPageSize};
}