import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ResendVerificationModal from "../../../../src/components/modals/ResendVerificationModal";

describe("ResendVerificationModal", () => {
    it("shows the message and the remainig time", () => {
        render(
            <ResendVerificationModal
                show
                onClose={() => { }}
                message="Wysłano nowy link weryfikacyjny."
                secondsLeft={42}
            />
        )
        expect(screen.getByText("Wysłano nowy link weryfikacyjny.")).toBeInTheDocument();
        expect(screen.getByText("Kolejny linki możesz wysłać za 42 s.")).toBeInTheDocument();
    });

    it("says a new link can be sent once the countdown has finished", () => {
        render(
            <ResendVerificationModal
                show
                onClose={() => { }}
                message="Wysłano nowy link weryfikacyjny."
                secondsLeft={0}
            />
        )
        expect(screen.getByText("Możesz teraz wysłać link ponownie.")).toBeInTheDocument();
    });

    it("calls onClose when th close button is clicked", () => {
        const onClose = vi.fn();
        render(
            <ResendVerificationModal
                show
                onClose={onClose}
                message="Wysłano nowy link weryfikacyjny."
                secondsLeft={0}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: "Zamknij" }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});