const { sendEmail } = require("../../../app/services/emailService");

describe("sendEmail", () => {
  const originalEnv = { ...process.env };
  const message = {
    to: "jan@example.com",
    subject: "Temat",
    html: "<p>Treść</p>",
  };

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("only logs the message when no API key is configured", async () => {
    delete process.env.RESEND_API_KEY;

    await sendEmail(message);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends the message through Resend when an API key is configured", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "no-reply@example.com";
    global.fetch.mockResolvedValue({ ok: true });

    await sendEmail(message);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(options.body)).toEqual({
      from: "no-reply@example.com",
      to: "jan@example.com",
      subject: "Temat",
      html: "<p>Treść</p>",
    });
  });

  it("falls back to a default sender when EMAIL_FROM is not set", async () => {
    process.env.RESEND_API_KEY = "test-key";
    delete process.env.EMAIL_FROM;
    global.fetch.mockResolvedValue({ ok: true });

    await sendEmail(message);

    const [, options] = global.fetch.mock.calls[0];
    expect(JSON.parse(options.body).from).toBe("no-reply@example.com");
  });

  it("throws when Resend rejects the request", async () => {
    process.env.RESEND_API_KEY = "test-key";
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: () => Promise.resolve("invalid sender"),
    });

    await expect(sendEmail(message)).rejects.toThrow(/422/);
  });
});
