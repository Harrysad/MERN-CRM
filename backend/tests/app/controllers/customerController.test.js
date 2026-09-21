const request = require("supertest");
const app = require("../../../app");
const { connect, closeDatabase, clearDatabase } = require("../../setup");

let token;

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

  const loginRes = await request(app).post("/auth/login").send({
    email: "jan@example.com",
    password: "password123",
  });

  token = loginRes.body.jwt;
});

const sampleCustomer = {
  name: "Acme Sp. z o.o.",
  address: {
    street: "Testowa 1",
    suite: "10",
    city: "Warszawa",
    postcode: "00-001",
  },
  nip: "1234567890",
};

describe("Authorization", () => {
  it("rejects requests without a token", async () => {
    const res = await request(app).get("/customers");
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /customers/add", () => {
  it("creates a new customer", async () => {
    const res = await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send(sampleCustomer);

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe(sampleCustomer.name);
    expect(res.body.nip).toBe(sampleCustomer.nip);
  });

  it("rejects a duplicate NIP", async () => {
    await request(app).post("/customers/add").set("Authorization", token).send(sampleCustomer);

    const res = await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send({ ...sampleCustomer, name: "Inna Firma" });

    expect(res.statusCode).toBe(409);
  });
});

describe("GET /customers", () => {
  it("returns a paginated list", async () => {
    await request(app).post("/customers/add").set("Authorization", token).send(sampleCustomer);

    const res = await request(app).get("/customers").set("Authorization", token);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });
});

describe("GET /customers/:id", () => {
  it("returns a single customer", async () => {
    await request(app).post("/customers/add").set("Authorization", token).send(sampleCustomer);
    const listRes = await request(app).get("/customers").set("Authorization", token);
    const customerId = listRes.body.data[0]._id;

    const res = await request(app).get(`/customers/${customerId}`).set("Authorization", token);

    expect(res.statusCode).toBe(200);
    expect(res.body.nip).toBe(sampleCustomer.nip);
  });

  it("returns 404 for a nonexistent customer", async () => {
    const res = await request(app)
      .get("/customers/000000000000000000000000")
      .set("Authorization", token);

    expect(res.statusCode).toBe(404);
  });
});

describe("PUT /customers/edit/:id", () => {
  it("updates an existing customer", async () => {
    await request(app).post("/customers/add").set("Authorization", token).send(sampleCustomer);
    const listRes = await request(app).get("/customers").set("Authorization", token);
    const customerId = listRes.body.data[0]._id;

    const res = await request(app)
      .put(`/customers/edit/${customerId}`)
      .set("Authorization", token)
      .send({ name: "Nowa Nazwa" });

    expect(res.statusCode).toBe(200);
  });
});

describe("DELETE /customers/delete/:id", () => {
  it("deletes an existing customer", async () => {
    await request(app).post("/customers/add").set("Authorization", token).send(sampleCustomer);
    const listRes = await request(app).get("/customers").set("Authorization", token);
    const customerId = listRes.body.data[0]._id;

    const res = await request(app)
      .delete(`/customers/delete/${customerId}`)
      .set("Authorization", token);

    expect(res.statusCode).toBe(200);
    expect(res.body.deleted).toBe(true);
  });
});

describe("GET /customers?search=", () => {
  beforeEach(async () => {
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send({
        name: "Google LLC",
        address: {
          street: "1600 Amphitheatre Parkway",
          suite: "1",
          city: "Mountain View",
          postcode: "94043",
        },
        nip: "1234567890",
      });
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send({
        name: "Microsoft Corporation",
        address: {
          street: "One Microsoft Way",
          suite: "2",
          city: "Redmond",
        postcode: "98052",
      },
      nip: "0987654321",
    });
  });

  it("finds a customer by partial name match (case-insensitive)", async () => {
    const res = await request(app).get("/customers?search=google").set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Google LLC");
  });

  it("finds a customer by NIP", async () => {
    const res = await request(app).get("/customers?search=0987654321").set("Authorization", token)
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Microsoft Corporation");
  });

  it("finds a customer by city", async () => {
    const res = await request(app).get("/customers?search=redmond").set("Authorization", token)
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Microsoft Corporation");
  });

  it("returns an empty list if no matches are found", async () => {
    const res = await request(app).get("/customers?search=nonexistent").set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});

describe("GET /customers pagination limits", () => {
  it("caps the page size at 100", async () => {
    const res = await request(app).get("/customers?limit=1000").set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.limit).toBe(100);
  });

  it("falls back to the default page size for invalid values", async () => {
    const negative = await request(app).get("/customers?limit=-5").set("Authorization", token);
    const text = await request(app).get("/customers?limit=abc").set("Authorization", token);
    expect(negative.body.limit).toBe(10);
    expect(text.body.limit).toBe(10);
  });

  it("falls back to the first page for invalid page numbers", async () => {
    const res = await request(app).get("/customers?page=-3").set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.page).toBe(1);
  });
});