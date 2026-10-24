const request = require("supertest");
const app = require("../../../app");
const {
  connect,
  closeDatabase,
  clearDatabase,
  verifyUser,
} = require("../../setup");

jest.mock("../../../app/services/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

const customer = {
  name: "Acme Sp. z o.o.",
  address: {
    street: "Testowa 1",
    suite: "10",
    city: "Warszawa",
    postcode: "00-001",
  },
  nip: "1234567890",
};

let loginRes;
let authCookie;

const login = () =>
  request(app).post("/auth/login").send({
    email: "jan@example.com",
    password: "password123",
  });

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  await request(app).post("/auth/signup").send({
    name: "Jan Kowalski",
    email: "jan@example.com",
    password: "password123",
  });
  await verifyUser("jan@example.com");

  loginRes = await login();
  authCookie = loginRes.headers["set-cookie"][0].split(";")[0];
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe("login cookie", () => {
  it("sets an httpOnly, same-site cookie with the token", () => {
    const header = loginRes.headers["set-cookie"][0];

    expect(header).toMatch(/^AuthToken=/);
    expect(header).toMatch(/HttpOnly/);
    expect(header).toMatch(/SameSite=Lax/);
    expect(header).toMatch(/Path=\//);
    expect(header).not.toMatch(/Secure/);
  });

  it("marks the cookie as secure in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const res = await login();
      expect(res.headers["set-cookie"][0]).toMatch(/Secure/);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});

describe("authentication with the cookie", () => {
  it("allows a read request", async () => {
    const res = await request(app).get("/customers").set("Cookie", authCookie);

    expect(res.statusCode).toBe(200);
  });

  it("rejects a write request without the CSRF header", async () => {
    const res = await request(app)
      .post("/customers/add")
      .set("Cookie", authCookie)
      .send(customer);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Missing CSRF header");
  });

  it("allows a write request that carries the CSRF header", async () => {
    const res = await request(app)
      .post("/customers/add")
      .set("Cookie", authCookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send(customer);

    expect(res.statusCode).toBe(201);
  });

  it("rejects an invalid cookie", async () => {
    const res = await request(app)
      .get("/customers")
      .set("Cookie", "AuthToken=garbage");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });
});

describe("authentication with the Authorization header", () => {
  it("still allows a write request without the CSRF header", async () => {
    const res = await request(app)
      .post("/customers/add")
      .set("Authorization", loginRes.body.jwt)
      .send(customer);

    expect(res.statusCode).toBe(201);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app)
      .get("/customers")
      .set("Authorization", "garbage");

    expect(res.statusCode).toBe(401);
  });

  it("rejects a request without any credentials", async () => {
    const res = await request(app).get("/customers");

    expect(res.statusCode).toBe(401);
  });
});

describe("logout", () => {
  it("clears the cookie with the same attributes it was set with", async () => {
    const res = await request(app).post("/auth/logout");
    const header = res.headers["set-cookie"][0];

    expect(header).toMatch(/^AuthToken=;/);
    expect(header).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(header).toMatch(/HttpOnly/);
    expect(header).toMatch(/SameSite=Lax/);
  });
});
