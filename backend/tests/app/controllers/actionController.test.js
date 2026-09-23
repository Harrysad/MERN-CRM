const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../../app");
const { connect, closeDatabase, clearDatabase, verifyUser } = require("../../setup");

let token;
let customerId;

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await request(app).post("/auth/signup").send({
    name: "Jan Kowalski",
    email: "jan@example.com",
    password: "password123",
  });
  
  await verifyUser("jan@example.com");

  const loginRes = await request(app).post("/auth/login").send({
    email: "jan@example.com",
    password: "password123",
  });

  token = loginRes.body.jwt;

  await request(app)
    .post("/customers/add")
    .set("Authorization", token)
    .send({
      name: "Acme Corp",
      address: { street: "Main St", suite: "1", city: "Warszawa", postcode: "00-001" },
      nip: "1112223344",
    });

  const listRes = await request(app).get("/customers").set("Authorization", token);
  customerId = listRes.body.data[0]._id;
});

const sampleAction = {
  type: "Telefon",
  description: "Pierwsza rozmowa",
  date: "2026-09-01T10:00:00.000Z",
};

describe("POST /actions/add", () => {
  it("creates a new action for an owned customer", async () => {
    const res = await request(app)
      .post("/actions/add")
      .set("Authorization", token)
      .send({ ...sampleAction, customer: customerId });

    expect(res.statusCode).toBe(201);
    expect(res.body.type).toBe("Telefon");
  });

  it("rejects an action for a customer that does not belong to the account", async () => {
    await request(app).post("/auth/signup").send({
      name: "Inny Uzytkownik",
      email: "inny@example.com",
      password: "password123",
    });
    await verifyUser("inny@example.com");
    const otherLogin = await request(app).post("/auth/login").send({
      email: "inny@example.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/actions/add")
      .set("Authorization", otherLogin.body.jwt)
      .send({ ...sampleAction, customer: customerId });

    expect(res.statusCode).toBe(404);
  });
});

describe("GET /actions/:customerId", () => {
  it("lists actions belonging to the account", async () => {
    await request(app)
      .post("/actions/add")
      .set("Authorization", token)
      .send({ ...sampleAction, customer: customerId });

    const res = await request(app).get(`/actions/${customerId}`).set("Authorization", token);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("does not list another account's actions for the same customer id", async () => {
    await request(app)
      .post("/actions/add")
      .set("Authorization", token)
      .send({ ...sampleAction, customer: customerId });

    await request(app).post("/auth/signup").send({
      name: "Inny Uzytkownik",
      email: "inny2@example.com",
      password: "password123",
    });
    const otherLogin = await request(app).post("/auth/login").send({
      email: "inny2@example.com",
      password: "password123",
    });

    const res = await request(app)
      .get(`/actions/${customerId}`)
      .set("Authorization", otherLogin.body.jwt);

    expect(res.body.data).toHaveLength(0);
  });
});

describe("Read-only role", () => {
  let viewerToken;

  beforeAll(() => {
    viewerToken = jwt.sign(
      { _id: "000000000000000000000001", role: "viewer" },
      process.env.JWT_SECRET
    );
  });

  it("blocks a viewer from creating an action", async () => {
    const res = await request(app)
      .post("/actions/add")
      .set("Authorization", viewerToken)
      .send({ ...sampleAction, customer: "000000000000000000000002" });

    expect(res.statusCode).toBe(403);
  });
});
