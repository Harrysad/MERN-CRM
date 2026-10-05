const express = require("express");
const request = require("supertest");
const { createRateLimiter } = require("../../../app/middlewares/rateLimiters");

const createApp = (options) => {
  const app = express();
  app.post(
    "/ping",
    createRateLimiter({ message: "Slow down.", ...options }),
    (req, res) => res.sendStatus(req.query.fail ? 400 : 200),
  );
  return app;
};

describe("createRateLimiter", () => {
  it("answers 429 with a JSON message once the limit is exceeded", async () => {
    const app = createApp({ windowMs: 60 * 1000, limit: 2 });

    expect((await request(app).post("/ping")).statusCode).toBe(200);
    expect((await request(app).post("/ping")).statusCode).toBe(200);

    const res = await request(app).post("/ping");
    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({ error: true, message: "Slow down." });
  });

  it("counts only failed requests when successful ones are skipped", async () => {
    const app = createApp({
      windowMs: 60 * 1000,
      limit: 2,
      skipSuccessfulRequests: true,
    });

    for (let i = 0; i < 3; i++) {
      expect((await request(app).post("/ping")).statusCode).toBe(200);
    }
    expect((await request(app).post("/ping?fail=1")).statusCode).toBe(400);
    expect((await request(app).post("/ping?fail=1")).statusCode).toBe(400);
    expect((await request(app).post("/ping?fail=1")).statusCode).toBe(429);
  });

  it("does not limit requests that are skipped", async () => {
    const app = createApp({ windowMs: 60 * 1000, limit: 1, skip: () => true });

    for (let i = 0; i < 3; i++) {
      expect((await request(app).post("/ping")).statusCode).toBe(200);
    }
  });
});
