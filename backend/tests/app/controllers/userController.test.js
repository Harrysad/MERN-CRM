const request = require("supertest");
const app = require("../../../app");
const { connect, closeDatabase, clearDatabase } = require("../../setup");

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
