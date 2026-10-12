import http from "http";
import WebSocket from "ws";

import app from "../src/app.js";
import Broadcast from "../src/models/Broadcast.js";
import { makeToken } from "./helpers.js";

import setupWebSocket from
    "../src/websocket/websocket.server.js";

import {
    connectTestDatabase,
    disconnectTestDatabase,
    clearTestDatabase
} from "./setup.js";

const waitForMessage = (
    socket,
    expectedType
) => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(
                new Error(
                    `Timed out waiting for ${expectedType}`
                )
            );
        }, 5000);

        const handleMessage = (raw) => {
            const message =
                JSON.parse(
                    raw.toString()
                );

            if (
                message.type ===
                expectedType
            ) {
                clearTimeout(timeout);

                socket.off(
                    "message",
                    handleMessage
                );

                resolve(message);
            }
        };

        socket.on(
            "message",
            handleMessage
        );
    });
};

describe("WebSocket API", () => {
    let server;

    beforeAll(async () => {
        await connectTestDatabase();

        server =
            http.createServer(app);

        setupWebSocket(server);

        await new Promise((resolve) => {
            server.listen(
                0,
                resolve
            );
        });
    });

    afterEach(async () => {
        await clearTestDatabase();
    });

    afterAll(async () => {
        await new Promise((resolve) => {
            server.close(resolve);
        });

        await disconnectTestDatabase();
    });

    test("client receives connection.ready", async () => {
        const port =
            server.address().port;

        const socket =
            new WebSocket(
                `ws://localhost:${port}/ws`
            );
        socket.on("open", () => socket.send(JSON.stringify({ type: "auth", data: { token: makeToken() } })));

        const message =
            await waitForMessage(
                socket,
                "connection.ready"
            );

        expect(
            message.data.userId
        ).toBe("100");

        socket.close();
    });

    test("client receives unread broadcast", async () => {
        await Broadcast.create({
            senderId: "admin",
            payloadType: "text",
            payload: {
                text: "Important announcement"
            }
        });

        const port =
            server.address().port;

        const socket =
            new WebSocket(
                `ws://localhost:${port}/ws`
            );
        socket.on("open", () => socket.send(JSON.stringify({ type: "auth", data: { token: makeToken() } })));

        const message =
            await waitForMessage(
                socket,
                "admin.broadcast"
            );

        expect(
            message.data.payload.text
        ).toBe(
            "Important announcement"
        );

        expect(
            message.data.unreadCount
        ).toBe(1);

        socket.close();
    });

    test("already read broadcasts are not sent again", async () => {
        const broadcast =
            await Broadcast.create({
                senderId: "admin",
                payloadType: "text",
                payload: {
                    text: "Already read"
                }
            });

        const BroadcastRead =
            (await import(
                "../src/models/BroadcastRead.js"
            )).default;

        await BroadcastRead.create({
            broadcastId:
                broadcast._id,
            userId: "100"
        });

        const port =
            server.address().port;

        const socket =
            new WebSocket(
                `ws://localhost:${port}/ws`
            );
        socket.on("open", () => socket.send(JSON.stringify({ type: "auth", data: { token: makeToken() } })));

        await new Promise((resolve) => {
            const timeout =
                setTimeout(() => {
                    socket.close();
                    resolve();
                }, 1000);

            socket.on(
                "message",
                (raw) => {
                    const message =
                        JSON.parse(
                            raw.toString()
                        );

                    if (
                        message.type ===
                        "admin.broadcast"
                    ) {
                        clearTimeout(timeout);

                        throw new Error(
                            "Read broadcast was sent again"
                        );
                    }
                }
            );
        });

        socket.close();
    });
});