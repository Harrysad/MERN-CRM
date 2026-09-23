const request = require("supertest");
const app = require("../../../app");
const { connect, closeDatabase, clearDatabase } = require("../../setup");
const { sendEmail } = require("../../../app/services/emailService");

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
  });
});
