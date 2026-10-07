const { get } = require("mongoose");
const getPagination = require("../../../app/helpers/getPagination");

describe("getPagination", () => {
  it("uses the defaults ehrn nothing is requested", () => {
    expect(getPagination({})).toEqual({ page: 1, limit: 10 });
  });

  it("reads a valid page and limit", () => {
    expect(getPagination({ page: "3", limit: "25" })).toEqual({
      page: 3,
      limit: 25,
    });
  });

  it("caps the limit at 100", () => {
    expect(getPagination({ limit: "1000" }).limit).toBe(100);
  });

  it("falls back to the defaults for invalid values", () => {
    expect(getPagination({ page: "-3", limit: "-5" })).toEqual({
      page: 1,
      limit: 10,
    });
    expect(getPagination({ page: "abc", limit: "abc" })).toEqual({
      page: 1,
      limit: 10,
    });
  });
});
