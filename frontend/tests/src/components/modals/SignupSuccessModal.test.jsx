import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SignupSuccessModal from "../../../../src/components/modals/SignupSuccessModal";

describe("SignupSuccessModal", () => {
  it("tells the user which address the activation link was sent to", () => {
    render(<SignupSuccessModal show onClose={() => {}} email="jan@firma.pl" />);
    expect(screen.getByText("jan@firma.pl")).toBeInTheDocument();
    expect(screen.getByText(/Wysłaliśmy link aktywacyjny/)).toBeInTheDocument();
  });

  it("warns that the account is deleted after 3 days", () => {
    render(<SignupSuccessModal show onClose={() => {}} email="jan@firma.pl" />);
    expect(screen.getByText(/usunięte po 3 dniach/)).toBeInTheDocument();
  });

  it("renders nothing when it is not shown", () => {
    render(
      <SignupSuccessModal
        show={false}
        onClose={() => {}}
        email="jan@firma.pl"
      />,
    );
    expect(screen.queryByText("jan@firma.pl")).not.toBeInTheDocument();
  });

  it("calls onClose when the button is clocked", () => {
    const onClose = vi.fn();
    render(<SignupSuccessModal show onClose={onClose} email="jan@firma.pl" />);
    fireEvent.click(screen.getByRole("button", { name: "Rozumiem" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
