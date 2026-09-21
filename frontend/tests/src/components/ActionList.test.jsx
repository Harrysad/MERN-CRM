import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ActionList from "../../../src/components/ActionList";

vi.mock("../../../src/apiService/action/apiActions", async (importOriginal) => ({
    ...(await importOriginal()),
    deleteAction: vi.fn(),
    updateAction: vi.fn(),
}));

const actions = [
    { _id: "1", type: "Telefon", description: "Pierwsza rozmowa", date: "2026-09-01T10:00:00.000Z", customer: "c1" },
    { _id: "2", type: "Mail", description: "Oferta", date: "2026-09-02T10:00:00.000Z", customer: "c1" },
];

const props = { handleGetActions: () => { }, customerName: "Acme", allActions: actions };

describe("ActionList", () => {
    it("shows an empty state when there are no actions", () => {
        render(<ActionList {...props} allActions={[]} />);
        expect(screen.getByText(/Brak akcji/)).toBeInTheDocument();
    });

    it("renders every action in both the table and the mobile card list", () => {
        const { container } = render(<ActionList {...props} />);
        expect(container.querySelectorAll(".crm-table tbody tr")).toHaveLength(2);
        expect(container.querySelectorAll(".crm-mobile-card")).toHaveLength(2);
    });

    it("opens the delete confirmation from a mobile card", async () => {
        const { container } = render(<ActionList {...props} />);
        fireEvent.click(container.querySelector(".crm-mobile-card .btn-icon--delete"));
        expect(await screen.findByText("Czy na pewno chcesz usunąć?")).toBeInTheDocument();
    });
});