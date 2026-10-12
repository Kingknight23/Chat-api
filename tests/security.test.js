import request from "supertest";
import app from "../src/app.js";

describe("Security middleware", () => {
  test("health endpoint returns security headers", async () => {
    const response = await request(app).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  test("protected routes reject missing authentication", async () => {
    const response = await request(app).get("/api/conversations");
    expect(response.statusCode).toBe(401);
  });

  test("protected routes reject invalid JWTs", async () => {
    const response = await request(app)
      .get("/api/conversations")
      .set("Authorization", "Bearer invalid-token");
    expect(response.statusCode).toBe(401);
  });
});
