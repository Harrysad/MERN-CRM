import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CustomerToolbar from "../../../src/components/CustomerToolbar";

const baseProps = {
    searchTerm: "",
    onSearchChange: () => { },
    sortField: "name",
    onSortChange: () => { },
    sortOrder: "asc",
    onToggleSortOrder: () => { },
    pageSize: 10,
    onPageSizeChange: () => { },
};

describe("CustomerToolbar", () => {
    it("reports typed search text", () => {
        const onSearchChange = vi.fn();
        render(<CustomerToolbar {...baseProps} onSearchChange={onSearchChange} />);
        fireEvent.change(screen.getByLabelText("Szukaj klientów"), { target: { value: "acme" } });
        expect(onSearchChange).toHaveBeenCalledWith("acme");
    });

    it("shows the clear button only when there is text", () => {
        const { rerender } = render(<CustomerToolbar {...baseProps} />);
        expect(screen.queryByLabelText("Wyczyść wyszukiwanie")).toBeNull();
        rerender(<CustomerToolbar {...baseProps} searchTerm="acme" />);
        expect(screen.getByLabelText("Wyczyść wyszukiwanie")).toBeInTheDocument();
    });

    it("clears the search when the clear button is clicked", () => {
        const onSearchChange = vi.fn();
        render(<CustomerToolbar {...baseProps} searchTerm="acme" onSearchChange={onSearchChange} />);
        fireEvent.click(screen.getByLabelText("Wyczyść wyszukiwanie"));
        expect(onSearchChange).toHaveBeenCalledWith("");
    });

    it("toggles the sort order", () => {
        const onToggleSortOrder = vi.fn();
        render(<CustomerToolbar {...baseProps} onToggleSortOrder={onToggleSortOrder} />);
        fireEvent.click(screen.getByLabelText("Zmień kierunek sortowania"));
        expect(onToggleSortOrder).toHaveBeenCalledTimes(1);
    });

    it("offers every page size and reports the chosen one", () => {
        const onPageSizeChange = vi.fn();
        render(<CustomerToolbar {...baseProps} onPageSizeChange={onPageSizeChange} />);
        const select = screen.getByLabelText("Ilość klientów na stronie");
        expect(Array.from(select.options).map((o) => o.value)).toEqual(["5", "10", "25", "50"]);
        fireEvent.change(select, { target: { value: "25" } });
        expect(onPageSizeChange).toHaveBeenCalledWith("25");
    });
});