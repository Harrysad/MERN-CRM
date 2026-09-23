const { parseAddress, formatCompanyName } = require("../../../app/controllers/nipController");

describe("formatCompanyName", () => {
  it("converts an all-caps name to title case", () => {
    expect(formatCompanyName("ALLEGRO SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ")).toBe(
      "Allegro Sp. z o.o."
    );
  });

  it("abbreviates spółka akcyjna to S.A.", () => {
    expect(formatCompanyName("ORLEN SPÓŁKA AKCYJNA")).toBe("Orlen S.A.");
  });

  it("returns falsy input unchanged", () => {
    expect(formatCompanyName("")).toBe("");
    expect(formatCompanyName(null)).toBe(null);
    expect(formatCompanyName(undefined)).toBe(undefined);
  });
});

describe("parseAddress", () => {
  it("splits a street name and building number without a slash", () => {
    expect(parseAddress("CHEMIKÓW 7, 09-411 PŁOCK")).toEqual({
      street: "Chemików",
      suite: "7",
      city: "Płock",
      postcode: "09-411",
    });
  });

  it("keeps an apartment number attached to the building number", () => {
    expect(parseAddress("MARSZAŁKOWSKA 12/3, 00-001 WARSZAWA")).toEqual({
      street: "Marszałkowska",
      suite: "12/3",
      city: "Warszawa",
      postcode: "00-001",
    });
  });

  it("handles a building number with a letter suffix", () => {
    expect(parseAddress("JULIUSZA SŁOWACKIEGO 19A, 01-592 WARSZAWA")).toEqual({
      street: "Juliusza Słowackiego",
      suite: "19A",
      city: "Warszawa",
      postcode: "01-592",
    });
  });

  it("returns empty fields when given no address", () => {
    expect(parseAddress(null)).toEqual({ street: "", suite: "", city: "", postcode: "" });
    expect(parseAddress(undefined)).toEqual({ street: "", suite: "", city: "", postcode: "" });
  });
});
