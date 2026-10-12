import request from "supertest";
import express from "express";
import rateLimit from "../src/middleware/rate-limit.js";

test("rate limiter returns 429 after the configured limit", async () => {
  const app = express();
  app.use(rateLimit({ windowMs: 60_000, max: 2 }));
  app.get("/", (_req, res) => res.json({ ok: true }));

  expect((await request(app).get("/")).statusCode).toBe(200);
  expect((await request(app).get("/")).statusCode).toBe(200);
  const blocked = await request(app).get("/");
  expect(blocked.statusCode).toBe(429);
  expect(blocked.headers["retry-after"]).toBeDefined();
});
