const request = require("supertest");
const app = require("../../../app");
const {
  connect,
  closeDatabase,
  clearDatabase,
  verifyUser,
  getAuthToken,
  withAuth,
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
let token;

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
  token = getAuthToken(loginRes);
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

  it("does not return the token in the response body", () => {
    expect(loginRes.body.jwt).toBeUndefined();
    expect(loginRes.body.role).toBe("admin");
  });
});

describe("authentication with the cookie", () => {
  it("allows a read request", async () => {
    const res = await request(app).get("/customers").use(withAuth(token));

    expect(res.statusCode).toBe(200);
  });

  it("rejects a write request without the CSRF header", async () => {
    const res = await request(app)
      .post("/customers/add")
      .set("Cookie", `AuthToken=${token}`)
      .send(customer);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Missing CSRF header");
  });

  it("allows a write request that carries the CSRF header", async () => {
    const res = await request(app)
      .post("/customers/add")
      .use(withAuth(token))
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

  it("rejects a request without any credentials", async () => {
    const res = await request(app).get("/customers");

    expect(res.statusCode).toBe(401);
  });
});

describe("the Authorization header", () => {
  it("is no longer accepted as a way to authenticate", async () => {
    const res = await request(app)
      .get("/customers")
      .set("Authorization", token);

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
