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
const jwt = require("jsonwebtoken");
const User = require("../../../app/models/UserModel");

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

describe("session revocation and fresh account data", () => {
  it("rejects a token after the user logged out", async () => {
    await request(app).post("/auth/logout").use(withAuth(token));

    const res = await request(app).get("/customers").use(withAuth(token));

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Session has ended");
  });

  it("keeps the other sessions of the same account valid", async () => {
    const secondToken = getAuthToken(await login());

    await request(app).post("/auth/logout").use(withAuth(token));

    const res = await request(app).get("/customers").use(withAuth(secondToken));
    expect(res.statusCode).toBe(200);
  });

  it("issues a different token at every login", async () => {
    const secondToken = getAuthToken(await login());

    expect(secondToken).not.toBe(token);
  });

  it("rejects the token of an account that no longer exists", async () => {
    await User.deleteOne({ email: "jan@example.com" });

    const res = await request(app).get("/customers").use(withAuth(token));

    expect(res.statusCode).toBe(401);
  });

  it("uses the role stored in the database, not the one at login time", async () => {
    await User.updateOne({ email: "jan@example.com" }, { role: "viewer" });

    const res = await request(app)
      .post("/customers/add")
      .use(withAuth(token))
      .send(customer);

    expect(res.statusCode).toBe(403);
  });

  it("rejects a token that has no identifier", async () => {
    const user = await User.findOne({ email: "jan@example.com" });
    const legacyToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const res = await request(app).get("/customers").use(withAuth(legacyToken));

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });
});
