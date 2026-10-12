import mongoose from "mongoose";

import Broadcast from "../src/models/Broadcast.js";
import BroadcastRead from "../src/models/BroadcastRead.js";

import {
    getUnreadBroadcasts,
    getUnreadBroadcastCount,
    markBroadcastRead
} from "../src/services/broadcast.service.js";

import {
    connectTestDatabase,
    disconnectTestDatabase,
    clearTestDatabase
} from "./setup.js";

describe("Broadcast Service", () => {
    beforeAll(async () => {
        await connectTestDatabase();
    });

    afterEach(async () => {
        await clearTestDatabase();
    });

    afterAll(async () => {
        await disconnectTestDatabase();
    });

    test("returns zero unread broadcasts for a new user", async () => {
        const count =
            await getUnreadBroadcastCount(
                "100"
            );

        expect(count).toBe(0);
    });

    test("counts unread broadcasts", async () => {
        await Broadcast.create([
            {
                senderId: "admin",
                payloadType: "text",
                payload: {
                    text: "Broadcast 1"
                }
            },
            {
                senderId: "admin",
                payloadType: "text",
                payload: {
                    text: "Broadcast 2"
                }
            },
            {
                senderId: "admin",
                payloadType: "text",
                payload: {
                    text: "Broadcast 3"
                }
            }
        ]);

        const count =
            await getUnreadBroadcastCount(
                "100"
            );

        expect(count).toBe(3);
    });

    test("marking a broadcast as read decreases unread count", async () => {
        const broadcast =
            await Broadcast.create({
                senderId: "admin",
                payloadType: "text",
                payload: {
                    text: "Hello"
                }
            });

        let count =
            await getUnreadBroadcastCount(
                "100"
            );

        expect(count).toBe(1);

        await markBroadcastRead(
            "100",
            broadcast._id
        );

        count =
            await getUnreadBroadcastCount(
                "100"
            );

        expect(count).toBe(0);
    });

    test("does not create duplicate read records", async () => {
        const broadcast =
            await Broadcast.create({
                senderId: "admin",
                payloadType: "text",
                payload: {
                    text: "Hello"
                }
            });

        await markBroadcastRead(
            "100",
            broadcast._id
        );

        await markBroadcastRead(
            "100",
            broadcast._id
        );

        const reads =
            await BroadcastRead.countDocuments({
                userId: "100",
                broadcastId: broadcast._id
            });

        expect(reads).toBe(1);
    });

    test("different users have independent unread counts", async () => {
        const broadcast =
            await Broadcast.create({
                senderId: "admin",
                payloadType: "text",
                payload: {
                    text: "Hello"
                }
            });

        await markBroadcastRead(
            "100",
            broadcast._id
        );

        const user100Count =
            await getUnreadBroadcastCount(
                "100"
            );

        const user200Count =
            await getUnreadBroadcastCount(
                "200"
            );

        expect(user100Count).toBe(0);
        expect(user200Count).toBe(1);
    });

    test("returns only unread broadcasts", async () => {
        const first =
            await Broadcast.create({
                senderId: "admin",
                payloadType: "text",
                payload: {
                    text: "First"
                }
            });

        await Broadcast.create({
            senderId: "admin",
            payloadType: "text",
            payload: {
                text: "Second"
            }
        });

        await markBroadcastRead(
            "100",
            first._id
        );

        const unread =
            await getUnreadBroadcasts(
                "100",
                20
            );

        expect(unread).toHaveLength(1);

        expect(
            unread[0].payload.text
        ).toBe("Second");
    });
});