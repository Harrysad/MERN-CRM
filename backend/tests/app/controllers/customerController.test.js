const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../../app");
const {
  connect,
  closeDatabase,
  clearDatabase,
  verifyUser,
} = require("../../setup");

const Customer = require("../../../app/models/CustomerModel");
const expectCookies = require("supertest/lib/cookies");

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

  await verifyUser("jan@example.com");

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

const createCustomer = async (data = sampleCustomer) => {
  await request(app)
    .post("/customers/add")
    .set("Authorization", token)
    .send(data);
  const listRes = await request(app)
    .get("/customers")
    .set("Authorization", token);
  return listRes.body.data.find((c) => c.nip === data.nip)._id;
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
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send(sampleCustomer);

    const res = await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send({ ...sampleCustomer, name: "Inna Firma" });

    expect(res.statusCode).toBe(409);
  });

  it("ignores fields outside the allowed list on create", async () => {
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send({ ...sampleCustomer, actions: ["000000000000000000000001"] });

    const saved = await Customer.findOne({ nip: sampleCustomer.nip });
    expect(saved.actions).toHaveLength(0);
  });
});

describe("GET /customers", () => {
  it("returns a paginated list", async () => {
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send(sampleCustomer);

    const res = await request(app)
      .get("/customers")
      .set("Authorization", token);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });
});

describe("GET /customers/:id", () => {
  it("returns a single customer", async () => {
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send(sampleCustomer);
    const listRes = await request(app)
      .get("/customers")
      .set("Authorization", token);
    const customerId = listRes.body.data[0]._id;

    const res = await request(app)
      .get(`/customers/${customerId}`)
      .set("Authorization", token);

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
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send(sampleCustomer);
    const listRes = await request(app)
      .get("/customers")
      .set("Authorization", token);
    const customerId = listRes.body.data[0]._id;

    const res = await request(app)
      .put(`/customers/edit/${customerId}`)
      .set("Authorization", token)
      .send({ name: "Nowa Nazwa" });

    expect(res.statusCode).toBe(200);
  });

  it("ignores an owner in the update request", async () => {
    const customerId = await createCustomer();

    await request(app)
      .put(`/customers/edit/${customerId}`)
      .set("Authorization", token)
      .send({ name: "Nowa Nazwa", owner: "000000000000000000000099" });

    const res = await request(app)
      .get(`/customers/${customerId}`)
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Nowa Nazwa");
  });

  it("ignores MongoDB operations in the update request", async () => {
    const customerId = await createCustomer();

    await request(app)
      .put(`/customers/edit/${customerId}`)
      .set("Authorization", token)
      .send({ $unset: { name: "" } });

    const res = await request(app)
      .get(`/customers/${customerId}`)
      .set("Authorization", token);
    expect(res.body.name).toBe(sampleCustomer.name);
  });

  it("rejects an update that fails validation", async () => {
    const customerId = await createCustomer();

    const res = await request(app)
      .put(`/customers/edit/${customerId}`)
      .set("Authorization", token)
      .send({ name: "" });

    expect(res.statusCode).toBe(400);
  });

  it("rejects an update to a NIP that already exists", async () => {
    await createCustomer();
    const secondId = await createCustomer({
      ...sampleCustomer,
      nip: "0987654321",
    });

    const res = await request(app)
      .put(`/customers/edit/${secondId}`)
      .set("Authorization", token)
      .send({ nip: sampleCustomer.nip });

    expect(res.statusCode).toBe(409);
  });
});

describe("DELETE /customers/delete/:id", () => {
  it("deletes an existing customer", async () => {
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send(sampleCustomer);
    const listRes = await request(app)
      .get("/customers")
      .set("Authorization", token);
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
    const res = await request(app)
      .get("/customers?search=google")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Google LLC");
  });

  it("finds a customer by NIP", async () => {
    const res = await request(app)
      .get("/customers?search=0987654321")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Microsoft Corporation");
  });

  it("finds a customer by city", async () => {
    const res = await request(app)
      .get("/customers?search=redmond")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Microsoft Corporation");
  });

  it("returns an empty list if no matches are found", async () => {
    const res = await request(app)
      .get("/customers?search=nonexistent")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it("ignores a search parameter the is not a string", async () => {
    const res = await request(app)
      .get("/customers?serach[]=google")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(2);
  });
});

describe("GET /customers sorting", () => {
  beforeEach(async () => {
    for (const customer of [
      { name: "Beta", nip: "2222222222" },
      { name: "Alpha", nip: "3333333333" },
    ]) {
      await request(app)
        .post("/customers/add")
        .set("Authorization", token)
        .send({ ...sampleCustomer, ...customer });
    }
  });

  it("sorts by NIP when requested", async () => {
    const res = await request(app)
      .get("/customers?sort=nip")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.map((c) => c.name)).toEqual(["Beta", "Alpha"]);
  });

  it("falls back to sorting by name for a field outside the allowed list", async () => {
    const res = await request(app)
      .get("/customers?sort=owner")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.map((c) => c.name)).toEqual(["Alpha", "Beta"]);
  });

  it("does not fail on a sort parameter that is not a string", async () => {
    const res = await request(app)
      .get("/customers?sort[]=nip")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.map((c) => c.name)).toEqual(["Alpha", "Beta"]);
  });
});

describe("GET /customers pagination limits", () => {
  it("caps the page size at 100", async () => {
    const res = await request(app)
      .get("/customers?limit=1000")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.limit).toBe(100);
  });

  it("falls back to the default page size for invalid values", async () => {
    const negative = await request(app)
      .get("/customers?limit=-5")
      .set("Authorization", token);
    const text = await request(app)
      .get("/customers?limit=abc")
      .set("Authorization", token);
    expect(negative.body.limit).toBe(10);
    expect(text.body.limit).toBe(10);
  });

  it("falls back to the first page for invalid page numbers", async () => {
    const res = await request(app)
      .get("/customers?page=-3")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body.page).toBe(1);
  });
});

describe("Server errors", () => {
  it("does not leak internal error details", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const countSpy = jest
      .spyOn(Customer, "countDocuments")
      .mockReturnValueOnce(Promise.reject(new Error("internal secret detail")));

    const res = await request(app)
      .get("/customers")
      .set("Authorization", token);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: true,
      message: "Internal server error.",
    });

    countSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

describe("Data isolation between accounts", () => {
  let otherToken;

  beforeEach(async () => {
    await request(app).post("/auth/signup").send({
      name: "Inny Uzytkownik",
      email: "inny@example.com",
      password: "password123",
    });

    await verifyUser("inny@example.com");

    const loginRes = await request(app).post("/auth/login").send({
      email: "inny@example.com",
      password: "password123",
    });

    otherToken = loginRes.body.jwt;
  });

  it("allows two different accounts to use the same NIP", async () => {
    const first = await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send(sampleCustomer);

    const second = await request(app)
      .post("/customers/add")
      .set("Authorization", otherToken)
      .send(sampleCustomer);

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
  });

  it("does not show another account's customer in the list", async () => {
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send(sampleCustomer);

    const res = await request(app)
      .get("/customers")
      .set("Authorization", otherToken);

    expect(res.body.data).toHaveLength(0);
  });

  it("returns 404 when fetching another account's customer by id", async () => {
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send(sampleCustomer);
    const listRes = await request(app)
      .get("/customers")
      .set("Authorization", token);
    const customerId = listRes.body.data[0]._id;

    const res = await request(app)
      .get(`/customers/${customerId}`)
      .set("Authorization", otherToken);

    expect(res.statusCode).toBe(404);
  });

  it("does not allow editing another account's customer", async () => {
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send(sampleCustomer);
    const listRes = await request(app)
      .get("/customers")
      .set("Authorization", token);
    const customerId = listRes.body.data[0]._id;

    const res = await request(app)
      .put(`/customers/edit/${customerId}`)
      .set("Authorization", otherToken)
      .send({ name: "Podmienione" });

    expect(res.statusCode).toBe(404);
  });

  it("does not allow deleting another account's customer", async () => {
    await request(app)
      .post("/customers/add")
      .set("Authorization", token)
      .send(sampleCustomer);
    const listRes = await request(app)
      .get("/customers")
      .set("Authorization", token);
    const customerId = listRes.body.data[0]._id;

    const res = await request(app)
      .delete(`/customers/delete/${customerId}`)
      .set("Authorization", otherToken);

    expect(res.statusCode).toBe(404);
  });
});

describe("Read-only role", () => {
  let viewerToken;

  beforeAll(() => {
    viewerToken = jwt.sign(
      { _id: "000000000000000000000001", role: "viewer" },
      process.env.JWT_SECRET,
    );
  });

  it("allows a viewer to read the customer list", async () => {
    const res = await request(app)
      .get("/customers")
      .set("Authorization", viewerToken);
    expect(res.statusCode).toBe(200);
  });

  it("blocks a viewer from creating a customer", async () => {
    const res = await request(app)
      .post("/customers/add")
      .set("Authorization", viewerToken)
      .send(sampleCustomer);

    expect(res.statusCode).toBe(403);
  });

  it("blocks a viewer from updating a customer", async () => {
    const res = await request(app)
      .put("/customers/edit/000000000000000000000002")
      .set("Authorization", viewerToken)
      .send({ name: "x" });

    expect(res.statusCode).toBe(403);
  });

  it("blocks a viewer from deleting a customer", async () => {
    const res = await request(app)
      .delete("/customers/delete/000000000000000000000002")
      .set("Authorization", viewerToken);

    expect(res.statusCode).toBe(403);
  });
});

describe("Unverified account", () => {
  let unverifiedToken;

  beforeEach(async () => {
    await request(app).post("/auth/signup").send({
      name: "Nowy Uzytkownik",
      email: "nowy@example.com",
      password: "password123",
    });

    const loginRes = await request(app).post("/auth/login").send({
      email: "nowy@example.com",
      password: "password123",
    });
    unverifiedToken = loginRes.body.jwt;
  });

  it("allows an unverified account to read the customer list", async () => {
    const res = await request(app)
      .get("/customers")
      .set("Authorization", unverifiedToken);
    expect(res.statusCode).toBe(200);
  });

  it("blocks an unverified account from creating a customer", async () => {
    const res = await request(app)
      .post("/customers/add")
      .set("Authorization", unverifiedToken)
      .send(sampleCustomer);

    expect(res.statusCode).toBe(403);
  });

  it("allows writes with an older token once the account has been verified", async () => {
    await verifyUser("nowy@example.com");
    const res = await request(app)
      .post("/customers/add")
      .set("Authorization", unverifiedToken)
      .send(sampleCustomer);

    expect(res.statusCode).toBe(201);
  });
});
