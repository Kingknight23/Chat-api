import request from "supertest";

import app from "../src/app.js";

describe("Health API", () => {
    test("GET /health returns API status", async () => {
        const response = await request(app)
            .get("/health");

        expect(response.statusCode)
            .toBe(200);

        expect(response.body)
            .toEqual({
                status: "ok",
                service: "chat-api"
            });
    });
});