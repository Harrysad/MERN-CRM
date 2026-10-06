import { describe, it, expect } from "vitest";
import {
  formatZipCode,
  formatNipCode,
  getWriteBlockMessage,
  getSignupErrorMessage,
  getLoginErrorMessage,
} from "../../../src/helpers/helpers";

describe("formatZipCode", () => {
  it("formats a 5-digit code as XX-XXX", () => {
    expect(formatZipCode("00001")).toBe("00-001");
  });

  it("strips non-digit characters before formatting", () => {
    expect(formatZipCode("00-001")).toBe("00-001");
  });

  it("returns an empty string for empty input", () => {
    expect(formatZipCode("")).toBe("");
  });
});

describe("formatNipCode", () => {
  it("formats a 10-digit NIP as XXX-XXX-XX-XX", () => {
    expect(formatNipCode("1234567890")).toBe("123-456-78-90");
  });

  it("returns partial formatting for shorter input", () => {
    expect(formatNipCode("123456")).toBe("123-456");
  });

  it("returns an empty string for empty input", () => {
    expect(formatNipCode("")).toBe("");
  });
});

describe("getWriteBlockMessage", () => {
  it("returns the demo message for a viewer account", () => {
    expect(getWriteBlockMessage(true, true)).toMatch(/tylko do odczytu/);
  });

  it("returns the verification message for an unverified account", () => {
    expect(getWriteBlockMessage(false, false)).toMatch(
      /Potwierdź adres e-mail/,
    );
  });

  it("prioritizes the viewer message when both conditions apply", () => {
    expect(getWriteBlockMessage(true, false)).toMatch(/tylko do odczytu/);
  });

  it("returns null when writes are allowed", () => {
    expect(getWriteBlockMessage(false, true)).toBeNull();
  });
});

describe("getSignupErrorMessage", () => {
  it("reports a taken email address for a 409 response", () => {
    expect(getSignupErrorMessage({ response: { status: 409 } })).toMatch(
      /już istnieje/,
    );
  });

  it("tells the user to wait for a 429 response", () => {
    expect(getSignupErrorMessage({ response: { status: 429 } })).toMatch(
      /Zbyt wiele prób/,
    );
  });

  it("asks to check the data for a 400 response", () => {
    expect(getSignupErrorMessage({ response: { status: 400 } })).toMatch(
      /poprawność/,
    );
  });

  it("returns a generic message for other errors", () => {
    expect(getSignupErrorMessage({ response: { status: 500 } })).toMatch(
      /Nie udało się założyć konta/,
    );
  });

  it("returns a generic message when there is no response", () => {
    expect(getSignupErrorMessage(new Error("Network Error"))).toMatch(
      /Nie udało się założyć konta/,
    );
  });
});

describe("getLoginErrorMessage", () => {
  it("reports invalid credentials for a 400 response", () => {
    expect(getLoginErrorMessage({ response: { status: 400 } })).toMatch(
      /Nieprawidłowy e-mail lub hasło/,
    );
  });

  it("tells the user to wait for a 429 response", () => {
    expect(getLoginErrorMessage({ response: { status: 429 } })).toMatch(
      /Zbyt wiele prób/,
    );
  });

  it("does not blame the credentials for other faileres", () => {
    expect(getLoginErrorMessage({ response: { status: 500 } })).toMatch(
      /Nie udało się zalogować/,
    );
    expect(getLoginErrorMessage(new Error("Network Error"))).toMatch(
      /Nie udało się zalogować/,
    );
  });
});
