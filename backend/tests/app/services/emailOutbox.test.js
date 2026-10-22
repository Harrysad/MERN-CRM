const mongoose = require("mongoose");
const { connect, closeDatabase, clearDatabase } = require("../../setup");
const EmailMessage = require("../../../app/models/EmailMessageModel");

jest.mock("../../../app/services/emailService", () => ({
  sendEmail: jest.fn(),
}));
const { sendEmail } = require("../../../app/services/emailService");
const {
  enqueueEmail,
  processOutbox,
  getOutboxStats,
  getLatestEmailStatus,
} = require("../../../app/services/emailOutbox");

const email = {
  kind: "verification",
  to: "jan@example.com",
  subject: "Temat",
  html: "<p>Treść</p>",
};

let errorSpy;

beforeAll(async () => {
  await connect();
});

beforeEach(() => {
  sendEmail.mockReset();
  sendEmail.mockResolvedValue(undefined);
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(async () => {
  errorSpy.mockRestore();
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe("enqueueEmail", () => {
  it("sends the email right away and drops its content", async () => {
    const status = await enqueueEmail(email);

    expect(status).toBe("sent");
    expect(sendEmail).toHaveBeenCalledWith({
      to: "jan@example.com",
      subject: "Temat",
      html: "<p>Treść</p>",
    });

    const stored = await EmailMessage.findOne();
    expect(stored.status).toBe("sent");
    expect(stored.attempts).toBe(1);
    expect(stored.html).toBeFalsy();
  });

  it("keeps a failed email pending and schedules a retry", async () => {
    sendEmail.mockRejectedValueOnce(new Error("Resend is down"));

    const status = await enqueueEmail(email);

    expect(status).toBe("pending");
    const stored = await EmailMessage.findOne();
    expect(stored.attempts).toBe(1);
    expect(stored.lastError).toBe("Resend is down");
    expect(stored.html).toBe("<p>Treść</p>");
    expect(stored.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("processOutbox", () => {
  it("retries a pending email once it is due", async () => {
    sendEmail.mockRejectedValueOnce(new Error("Resend is down"));
    await enqueueEmail(email);

    const processed = await processOutbox(
      new Date(Date.now() + 10 * 60 * 1000),
    );

    expect(processed).toBe(1);
    expect(sendEmail).toHaveBeenCalledTimes(2);
    const stored = await EmailMessage.findOne();
    expect(stored.status).toBe("sent");
    expect(stored.attempts).toBe(2);
  });

  it("does not retry before the delay has passed", async () => {
    sendEmail.mockRejectedValueOnce(new Error("Resend is down"));
    await enqueueEmail(email);

    const processed = await processOutbox(new Date());

    expect(processed).toBe(0);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("gives up after three attempts and drops the content", async () => {
    sendEmail.mockRejectedValue(new Error("Resend is down"));
    await enqueueEmail(email);
    await processOutbox(new Date(Date.now() + 10 * 60 * 1000));
    await processOutbox(new Date(Date.now() + 60 * 60 * 1000));

    const stored = await EmailMessage.findOne();
    expect(stored.status).toBe("failed");
    expect(stored.attempts).toBe(3);
    expect(stored.html).toBeFalsy();
  });
});

describe("getOutboxStats", () => {
  it("counts the emails by status and lists recent failures without addresses", async () => {
    await enqueueEmail(email);
    sendEmail.mockRejectedValueOnce(new Error("Resend is down"));
    await enqueueEmail({ ...email, to: "anna@example.com" });

    const stats = await getOutboxStats();

    expect(stats).toMatchObject({ pending: 1, sent: 1, failed: 0 });
    expect(stats.recentFailures).toHaveLength(1);
    expect(stats.recentFailures[0].lastError).toBe("Resend is down");
    expect(stats.recentFailures[0].to).toBeUndefined();
  });
});

describe("getLatestEmailStatus", () => {
  it("returns the status of the newest email of a user", async () => {
    const userId = new mongoose.Types.ObjectId();
    await enqueueEmail({ ...email, user: userId });
    sendEmail.mockRejectedValueOnce(new Error("Resend is down"));
    await enqueueEmail({ ...email, user: userId });

    expect(await getLatestEmailStatus(userId, "verification")).toBe("pending");
  });

  it("returns null when the user has no email", async () => {
    const userId = new mongoose.Types.ObjectId();

    expect(await getLatestEmailStatus(userId, "verification")).toBeNull();
  });
});
