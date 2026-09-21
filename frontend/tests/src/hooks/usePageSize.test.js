import {describe, it, expect, beforeEach} from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePageSize } from "../../../src/hooks/usePageSize"; 

describe("usePageSize", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("defaults to 10 when nothing is stored", () => {
        const {result} = renderHook(() => usePageSize());
        expect(result.current.pageSize).toBe(10);
    });

    it("use a valid stored value", () => {
        localStorage.setItem("pageSize", "25");
        const {result} = renderHook(() => usePageSize());
        expect(result.current.pageSize).toBe(25);
    });

    it("ignores an invalid stored value", () => {
        localStorage.setItem("pageSize", "999");
        const {result} = renderHook(() => usePageSize());
        expect(result.current.pageSize).toBe(10);
    });

    it("persists the chosen size", () => {
        const {result} = renderHook(() => usePageSize());
        act(() => result.current.setPageSize(50));
        expect(result.current.pageSize).toBe(50);
        expect(localStorage.getItem("pageSize")).toBe("50");
    });

    it("ignore unsupported sizes", () => {
        const {result} = renderHook(() => usePageSize());
        act(() => result.current.setPageSize(7));
        expect(result.current.pageSize).toBe(10);
        expect(localStorage.getItem("pageSize")).toBeNull();
    });
});