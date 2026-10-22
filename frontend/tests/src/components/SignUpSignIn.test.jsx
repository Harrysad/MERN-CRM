import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/apiService/user/apiUser", () => ({
  addUser: vi.fn(),
  logInUser: vi.fn(),
}));

import { addUser, logInUser } from "../../../src/apiService/user/apiUser";
import { SignUpSignIn } from "../../../src/components/SignUpSignIn";

const renderPage = () =>
  render(
    <MemoryRouter>
      <SignUpSignIn setUser={() => {}} />
    </MemoryRouter>,
  );

const submitLogin = (container) => {
  fireEvent.change(container.querySelector('input[name="email"]'), {
    target: { value: "jan@firma.pl" },
  });
  fireEvent.change(container.querySelector('input[name="password"]'), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));
};

describe("SignUpSignIn login errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports invalid credentials when the login is rejected", async () => {
    logInUser.mockRejectedValueOnce({ response: { status: 400 } });
    const { container } = renderPage();

    submitLogin(container);

    expect(
      await screen.findByText("Nieprawidłowy e-mail lub hasło."),
    ).toBeInTheDocument();
  });

  it("tells the user to wait when the login is rate limited", async () => {
    logInUser.mockRejectedValueOnce({ response: { status: 429 } });
    const { container } = renderPage();

    submitLogin(container);

    expect(await screen.findByText(/Zbyt wiele prób/)).toBeInTheDocument();
  });

  it("does not blame the credentials when the server cannot be reached", async () => {
    logInUser.mockRejectedValueOnce(new Error("Network Error"));
    const { container } = renderPage();

    submitLogin(container);

    expect(
      await screen.findByText(/Nie udało się zalogować/),
    ).toBeInTheDocument();
  });
});

describe("SignUpSignIn signup confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const submitSignup = (container) => {
    fireEvent.click(screen.getByRole("button", { name: "Zarejestruj się" }));
    fireEvent.change(container.querySelector('input[name="name"]'), {
      target: { value: "Jan Kowalski" },
    });
    fireEvent.change(container.querySelector('input[name="email"]'), {
      target: { value: "jan@firma.pl" },
    });
    fireEvent.change(container.querySelector('input[name="password"]'), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zarejestruj się" }));
  };

  it("confirms that the activation email was sent", async () => {
    addUser.mockResolvedValueOnce({
      email: "jan@firma.pl",
      emailStatus: "sent",
    });
    const { container } = renderPage();

    submitSignup(container);

    expect(
      await screen.findByText(/Wysłaliśmy link aktywacyjny/),
    ).toBeInTheDocument();
  });

  it("warns when the activation email could not be sent right away", async () => {
    addUser.mockResolvedValueOnce({
      email: "jan@firma.pl",
      emailStatus: "pending",
    });
    const { container } = renderPage();

    submitSignup(container);

    expect(
      await screen.findByText(
        /nie udało się od razu wysłać linku aktywacyjnego/,
      ),
    ).toBeInTheDocument();
  });
});
