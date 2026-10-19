const getSaltRounds = require("../../../app/helpers/getSaltRounds");

describe("getSaltRounds", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("uses a cheap cost in the test enviroment", () => {
    process.env.NODE_ENV = "test";
    expect(getSaltRounds()).toBe(4);
  });

  it("uses the full cost in production", () => {
    process.env.NODE_ENV = "production";
    expect(getSaltRounds()).toBe(10);
  });

  it("uses the full cost when no environment is set", () => {
    delete process.env.NODE_ENV;
    expect(getSaltRounds()).toBe(10);
  });
});
