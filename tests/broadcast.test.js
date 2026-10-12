import request from "supertest";

import app from "../src/app.js";
import Broadcast from "../src/models/Broadcast.js";
import { makeToken } from "./helpers.js";

import {
    connectTestDatabase,
    disconnectTestDatabase,
    clearTestDatabase
} from "./setup.js";

describe("Broadcast API", () => {
    beforeAll(async () => {
        await connectTestDatabase();
    });

    afterEach(async () => {
        await clearTestDatabase();
    });

    afterAll(async () => {
        await disconnectTestDatabase();
    });

    test("returns broadcasts and unreadCount", async () => {
        await Broadcast.create([
            {
                senderId: "admin",
                payloadType: "text",
                payload: {
                    text: "Hello"
                }
            },
            {
                senderId: "admin",
                payloadType: "text",
                payload: {
                    text: "Welcome"
                }
            }
        ]);

        const response = await request(app)
            .get("/api/broadcasts")
            .set(
                "Authorization",
                `Bearer ${makeToken()}`
            );

        expect(response.statusCode)
            .toBe(200);

        expect(
            response.body.broadcasts
        ).toHaveLength(2);

        expect(
            response.body.unreadCount
        ).toBe(2);
    });

    test("requires authentication", async () => {
        const response = await request(app)
            .get("/api/broadcasts");

        expect(response.statusCode)
            .toBe(401);
    });

    test("returns zero unreadCount when all broadcasts are read", async () => {
        await Broadcast.create({
            senderId: "admin",
            payloadType: "text",
            payload: {
                text: "Hello"
            }
        });

        const broadcasts =
            await Broadcast.find();

        const BroadcastRead =
            (await import(
                "../src/models/BroadcastRead.js"
            )).default;

        await BroadcastRead.create({
            broadcastId:
                broadcasts[0]._id,
            userId: "100"
        });

        const response = await request(app)
            .get("/api/broadcasts")
            .set(
                "Authorization",
                `Bearer ${makeToken()}`
            );

        expect(response.body.unreadCount)
            .toBe(0);
    });
});