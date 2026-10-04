const request = require("supertest");
const app = require("../../../app");
const User = require("../../../app/models/UserModel");
const Customer = require("../../../app/models/CustomerModel");
const Action = require("../../../app/models/ActionModel");
const { connect, closeDatabase, clearDatabase } = require("../../setup");

jest.mock("../../../app/services/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));
const { sendEmail } = require("../../../app/services/emailService");

const DAY_MS = 24 * 60 * 60 * 1000;
const SECRET = "test-internal-secret";

const createUser = async ({ name, email, verified, role, ageDays }) => {
  const user = await User.create({
    name,
    email,
    password: "password123",
    verified,
    ...(role ? { role } : {}),
  });
  await User.collection.updateOne(
    { _id: user._id },
    { $set: { createdAt: new Date(Date.now() - ageDays * DAY_MS) } },
  );
  return user;
};

const cleanup = (secret) => {
  const req = request(app).post("/internal/cleanup-unverified");
  return secret ? req.set("X-Internal-Secret", secret) : req;
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

beforeEach(() => {
  process.env.INTERNAL_CLEANUP_SECRET = SECRET;
  sendEmail.mockClear();
});

describe("POST /internal/cleanup-unverified", () => {
  describe("access", () => {
    it("rejects a request without the secret", async () => {
      const res = await cleanup();
      expect(res.statusCode).toBe(401);
    });

    it("rejects a request with the wrong secret", async () => {
      const res = await cleanup("wrong-secret");
      expect(res.statusCode).toBe(401);
    });

    it("refuses every request when no secret is configured", async () => {
      delete process.env.INTERNAL_CLEANUP_SECRET;

      const res = await cleanup(SECRET);
      expect(res.statusCode).toBe(503);
    });
  });

  describe("cleanup", () => {
    it("deletes an expired unverified account with its data and notifies the owner", async () => {
      const user = await createUser({
        name: "Stare Konto",
        email: "stare@example.com",
        verified: false,
        ageDays: 4,
      });
      const customer = await Customer.create({
        owner: user._id,
        name: "Acme",
        address: {
          street: "Testowa",
          suite: "1",
          city: "Warszawa",
          postcode: "00-001",
        },
        nip: "1234567890",
      });
      await Action.create({
        owner: user._id,
        type: "Telefon",
        customer: customer._id,
      });

      const res = await cleanup(SECRET);

      expect(res.statusCode).toBe(200);
      expect(res.body.deleted).toBe(1);
      expect(await User.countDocuments()).toBe(0);
      expect(await Customer.countDocuments()).toBe(0);
      expect(await Action.countDocuments()).toBe(0);
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail.mock.calls[0][0].to).toBe("stare@example.com");
    });

    it("keeps accounts that must not be deleted", async () => {
      await createUser({
        name: "Nowe",
        email: "nowe@example.com",
        verified: false,
        ageDays: 1,
      });
      await createUser({
        name: "Potwierdzone",
        email: "ok@example.com",
        verified: true,
        ageDays: 10,
      });
      await createUser({
        name: "Demo",
        email: "demo@example.com",
        verified: false,
        role: "viewer",
        ageDays: 10,
      });
      const legacy = await createUser({
        name: "Sprzed weryfikacji",
        email: "legacy@example.com",
        verified: true,
        ageDays: 10,
      });
      await User.collection.updateOne(
        { _id: legacy._id },
        { $unset: { verified: "" } },
      );

      const res = await cleanup(SECRET);

      expect(res.statusCode).toBe(200);
      expect(res.body.deleted).toBe(0);
      expect(await User.countDocuments()).toBe(4);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("only deletes the expired accounts when there are several", async () => {
      await createUser({
        name: "Stare",
        email: "stare@example.com",
        verified: false,
        ageDays: 5,
      });
      await createUser({
        name: "Nowe",
        email: "nowe@example.com",
        verified: false,
        ageDays: 2,
      });

      const res = await cleanup(SECRET);

      expect(res.body.deleted).toBe(1);
      const remaining = await User.find();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].email).toBe("nowe@example.com");
    });

    it("still deletes the account when the notification email fails", async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      sendEmail.mockRejectedValueOnce(new Error("Resend is down"));
      await createUser({
        name: "Stare",
        email: "stare@example.com",
        verified: false,
        ageDays: 5,
      });

      const res = await cleanup(SECRET);

      expect(res.statusCode).toBe(200);
      expect(res.body.deleted).toBe(1);
      expect(await User.countDocuments()).toBe(0);
      errorSpy.mockRestore();
    });
  });
});
