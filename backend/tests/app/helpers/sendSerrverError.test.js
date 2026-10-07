const sendServerError = require("../../../app/helpers/sendServerError");

describe("sendServerError", () => {
  let errorSpy;
  let res;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("answers 500 with a generic message and does not expose the error", () => {
    const err = new Error("connection to mongodb://user:secret@host failed");

    sendServerError(res, err);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body).toEqual({ error: true, message: "Internal server error." });
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  it("logs the error on the server", () => {
    const err = new Error("boom");

    sendServerError(res, err);

    expect(errorSpy).toHaveBeenCalledWith("Server error: ", err);
  });
});
