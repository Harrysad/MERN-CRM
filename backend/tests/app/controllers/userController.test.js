const request = require("supertest");
const app = require("../../../app");
const { connect, closeDatabase, clearDatabase } = require("../../setup");
const { sendEmail } = require("../../../app/services/emailService");
const User = require("../../../app/models/UserModel");

jest.mock("../../../app/services/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

const extractVerificationToken = () => {
  const html = sendEmail.mock.calls[sendEmail.mock.calls.length - 1][0].html;
  return html.match(/\/verify\/([a-f0-9]+)/)[1];
};

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe("POST /auth/signup", () => {
  it("registers a new user successfully", async () => {
    const res = await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Jan Kowalski");
    expect(res.body.email).toBe("jan@example.com");
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan@example.com",
      password: "password123",
    });

    const res = await request(app).post("/auth/signup").send({
      name: "Inny Jan",
      email: "jan@example.com",
      password: "password456",
    });

    expect(res.statusCode).toBe(409);
  });

  it("allows two users with the same name", async () => {
    await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan@example.com",
      password: "password123",
    });
    const res = await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan2@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(201);
  });

  it("rejects signup data that fails validation", async () => {
    const res = await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan@example",
    });
    expect(res.statusCode).toBe(400);
  });

  it("ignores a role in the signup request", async () => {
    await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan@example.com",
      password: "password123",
      role: "viewer",
    });

    const loginRes = await request(app).post("/auth/login").send({
      email: "jan@example.com",
      password: "password123",
    });

    expect(loginRes.body.role).toBe("admin");
  });

  it("rejects a password shorter then 8 characters", async () => {
    const res = await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan@example.com",
      password: "short12",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/at least 8/);
    expect(await User.countDocuments()).toBe(0);
  });

  it("accepts a password of exactly 8 characters", async () => {
    const res = await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan@example.com",
      password: "12345678",
    });

    expect(res.statusCode).toBe(201);
  });

  it("rejects a password the is not a string", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({
        name: "Jan Kowalski",
        email: "jan@example.com",
        password: { $ne: "" },
      });

    expect(res.statusCode).toBe(400);
    expect(await User.countDocuments()).toBe(0);
  });

  it("answers 500 when hashing the password fails", async () => {
    const bcrypt = require("bcrypt");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const saltSpy = jest
      .spyOn(bcrypt, "genSalt")
      .mockImplementation((rounds, callback) =>
        callback(new Error("hash failure")),
      );

    const res = await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(500);

    saltSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("stores the email address in lower case", async () => {
    const res = await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "  Jan@Example.COM ",
      password: "password123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.email).toBe("jan@example.com");
  });

  it("rejects an email that differs only in letter case", async () => {
    await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan@example.com",
      password: "password123",
    });

    const res = await request(app).post("/auth/signup").send({
      name: "Inny Jan",
      email: "JAN@EXAMPLE.COM",
      password: "password123",
    });

    expect(res.statusCode).toBe(409);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan@example.com",
      password: "password123",
    });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "jan@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.jwt).toBeDefined();
    expect(res.body.role).toBe("admin");
  });

  it("rejects an incorrect password", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "jan@example.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(400);
  });

  it("rejects a nonexistent user", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns the same message for a wrong password and a nonexistent user", async () => {
    const wrongPassword = await request(app).post("/auth/login").send({
      email: "jan@example.com",
      password: "wrongpassword",
    });
    const nonexistent = await request(app).post("/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });

    expect(wrongPassword.body.message).toBe("Invalid email or password");
    expect(nonexistent.body.message).toBe("Invalid email or password");
  });

  it("rejects an email the is not a string", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: { $regex: "^j" },
        password: "password123",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("rejects a password that is not a string", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "jan@example.com",
        password: { $ne: "" },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("blocks repeated failed logins from the same address", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      for (let i = 0; i < 10; i++) {
        await request(app).post("/auth/login").send({
          email: "jan@example.com",
          password: "wrongpassword",
        });
      }

      const res = await request(app).post("/auth/login").send({
        email: "jan@example.com",
        password: "wrongpassword",
      });
      expect(res.statusCode).toBe(429);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("logs in with an email written in a different letter case", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "  JAN@Example.com ",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.jwt).toBeDefined();
  });
});

describe("Email verification", () => {
  beforeEach(() => {
    sendEmail.mockClear();
  });

  it("creates an unverified account by default", async () => {
    await request(app).post("/auth/signup").send({
      name: "Jan Kowalski",
      email: "jan@example.com",
      password: "password123",
    });

    const loginRes = await request(app).post("/auth/login").send({
      email: "jan@example.com",
      password: "password123",
    });

    expect(loginRes.body.verified).toBe(false);
  });

  it("escapes HTML in the name in the varification email", async () => {
    await request(app).post("/auth/signup").send({
      name: '<a href="https://evil.example">Kliknij</a>',
      email: "jan@example.com",
      password: "password123",
    });

    const html = sendEmail.mock.calls[sendEmail.mock.calls.length - 1][0].html;
    expect(html).not.toContain('<a href="https://evil.example">');
    expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;");
  });

  describe("GET /auth/verify/:token", () => {
    beforeEach(async () => {
      await request(app).post("/auth/signup").send({
        name: "Jan Kowalski",
        email: "jan@example.com",
        password: "password123",
      });
    });

    it("verifies the account with a valid token", async () => {
      const token = extractVerificationToken();

      const res = await request(app).get(`/auth/verify/${token}`);
      expect(res.statusCode).toBe(200);

      const loginRes = await request(app).post("/auth/login").send({
        email: "jan@example.com",
        password: "password123",
      });
      expect(loginRes.body.verified).toBe(true);
    });

    it("rejects an invalid token", async () => {
      const res = await request(app).get("/auth/verify/not-a-real-token");
      expect(res.statusCode).toBe(400);
    });

    it("rejects reusing an already-used token", async () => {
      const token = extractVerificationToken();
      await request(app).get(`/auth/verify/${token}`);

      const res = await request(app).get(`/auth/verify/${token}`);
      expect(res.statusCode).toBe(400);
    });

    it("rejects an expired token", async () => {
      const token = extractVerificationToken();
      await User.updateOne(
        { email: "jan@example.com" },
        { verificationSentAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
      );

      const res = await request(app).get(`/auth/verify/${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/wygasł/);
    });

    it("accepts a token that is still within its lifetime", async () => {
      const token = extractVerificationToken();
      await User.updateOne(
        { email: "jan@example.com" },
        { verificationSentAt: new Date(Date.now() - 23 * 60 * 60 * 1000) },
      );

      const res = await request(app).get(`/auth/verify/${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("allows requesting a new link once the old one has expired", async () => {
      await User.updateOne(
        { email: "jan@example.com" },
        { verificationSentAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
      );
      const loginRes = await request(app).post("/auth/login").send({
        email: "jan@example.com",
        password: "password123",
      });

      const resendRes = await request(app)
        .post("/auth/resend-verification")
        .set("Authorization", loginRes.body.jwt);
      expect(resendRes.statusCode).toBe(200);

      const res = await request(app).get(
        `/auth/verify/${extractVerificationToken()}`,
      );
      expect(res.statusCode).toBe(200);
    });
  });

  describe("POST /auth/resend-verification", () => {
    let jwtToken;

    beforeEach(async () => {
      await request(app).post("/auth/signup").send({
        name: "Jan Kowalski",
        email: "jan@example.com",
        password: "password123",
      });

      const loginRes = await request(app).post("/auth/login").send({
        email: "jan@example.com",
        password: "password123",
      });
      jwtToken = loginRes.body.jwt;
    });

    it("requires authentication", async () => {
      const res = await request(app).post("/auth/resend-verification");
      expect(res.statusCode).toBe(401);
    });

    it("blocks a resend during the cooldown", async () => {
      const res = await request(app)
        .post("/auth/resend-verification")
        .set("Authorization", jwtToken);

      expect(res.statusCode).toBe(429);
      expect(res.body.retryAfterSeconds).toBeGreaterThan(0);
      expect(res.body.retryAfterSeconds).toBeLessThanOrEqual(60);
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    it("sends a new link after the cooldown and invalidates the old one", async () => {
      const oldToken = extractVerificationToken();
      await User.updateOne(
        { email: "jan@example.com" },
        { verificationSentAt: new Date(Date.now() - 2 * 60 * 1000) },
      );

      const res = await request(app)
        .post("/auth/resend-verification")
        .set("Authorization", jwtToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.retryAfterSeconds).toBe(60);
      expect(sendEmail).toHaveBeenCalledTimes(2);

      const newToken = extractVerificationToken();
      expect(newToken).not.toBe(oldToken);

      const oldRes = await request(app).get(`/auth/verify/${oldToken}`);
      expect(oldRes.statusCode).toBe(400);

      const newRes = await request(app).get(`/auth/verify/${newToken}`);
      expect(newRes.statusCode).toBe(200);
    });

    it("rejects a resend for an already verified account", async () => {
      await request(app).get(`/auth/verify/${extractVerificationToken()}`);

      const res = await request(app)
        .post("/auth/resend-verification")
        .set("Authorization", jwtToken);
      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /auth/verification-status", () => {
    let jwtToken;

    beforeEach(async () => {
      await request(app).post("/auth/signup").send({
        name: "Jan Kowalski",
        email: "jan@example.com",
        password: "password123",
      });

      const loginRes = await request(app).post("/auth/login").send({
        email: "jan@example.com",
        password: "password123",
      });
      jwtToken = loginRes.body.jwt;
    });

    it("requires authentication", async () => {
      const res = await request(app).get("/auth/verification-status");
      expect(res.statusCode).toBe(401);
    });

    it("reports a new account as not verfied", async () => {
      const res = await request(app)
        .get("/auth/verification-status")
        .set("Authorization", jwtToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.verified).toBe(false);
    });

    it("reports the account as verified after the linkis used, with the same token", async () => {
      await request(app).get(`/auth/verify/${extractVerificationToken()}`);

      const res = await request(app)
        .get("/auth/verification-status")
        .set("Authorization", jwtToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.verified).toBe(true);
    });
  });
});

describe("Security headers and error handling", () => {
  it("sets security headers and hides the framework name", async () => {
    const res = await request(app).post("/auth/logout");

    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("answers 400 with JSON for a malformed request body", async () => {
    const res = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": ');

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: true, message: "Invalid JSON body." });
  });

  it("answers 413 with JSON for a payload that is too large", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ name: "a".repeat(200000) });

    expect(res.statusCode).toBe(413);
    expect(res.body).toEqual({ error: true, message: "Payload too large." });
  });

  it("answers 500 with a generic message when a handler throws", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const findSpy = jest.spyOn(User, "findOne").mockImplementationOnce(() => {
      throw new Error("db exploded");
    });

    const res = await request(app).post("/auth/login").send({
      email: "jan@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: true,
      message: "Internal server error.",
    });

    findSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
