const escapeHtml = require("../../../app/helpers/escapeHtml");

describe("escapeHtml", () => {
  it("escapes HTML special character", () => {
    expect(escapeHtml(`<a href="x">Jan & Wspólnicy</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Jan &amp; Wspólnicy&lt;/a&gt;",
    );
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Jan Kowalski")).toBe("Jan Kowalski");
  });

  it("returns an empty string for a missing value", () => {
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(null)).toBe("");
  });
});
