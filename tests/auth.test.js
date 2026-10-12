import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from "./setup.js";

describe("Authentication API", () => {
  beforeAll(connectTestDatabase);
  afterEach(clearTestDatabase);
  afterAll(disconnectTestDatabase);

  test("registers a user and returns a JWT", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username: "alice",
      email: "ALICE@example.com",
      password: "password123"
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe("alice@example.com");
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  test("rejects weak passwords", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username: "alice",
      email: "alice@example.com",
      password: "short"
    });
    expect(response.statusCode).toBe(400);
  });

  test("rejects duplicate usernames or emails", async () => {
    await request(app).post("/api/auth/register").send({ username: "alice", email: "alice@example.com", password: "password123" });
    const response = await request(app).post("/api/auth/register").send({ username: "alice", email: "other@example.com", password: "password123" });
    expect(response.statusCode).toBe(400);
    expect(await User.countDocuments()).toBe(1);
  });

  test("logs in with valid credentials and rejects invalid credentials", async () => {
    await request(app).post("/api/auth/register").send({ username: "alice", email: "alice@example.com", password: "password123" });
    const ok = await request(app).post("/api/auth/login").send({ email: "alice@example.com", password: "password123" });
    expect(ok.statusCode).toBe(200);
    expect(ok.body.token).toEqual(expect.any(String));

    const bad = await request(app).post("/api/auth/login").send({ email: "alice@example.com", password: "wrongpass" });
    expect(bad.statusCode).toBe(401);
  });
});
