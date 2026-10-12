import { WebSocketServer } from "ws";
import routeMessage from "./router.js";
import { addConnection, removeConnection, isUserOnline, getOnlineUserIds, broadcastToUsers } from "./connection.manager.js";
import { startHeartbeat, startHeartbeatInterval } from "./heartbeat.js";
import { sendRecentBroadcasts } from "../services/broadcast.service.js";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

const AUTH_TIMEOUT_MS = 10_000;
const MESSAGE_WINDOW_MS = 10_000;
const MAX_MESSAGES_PER_WINDOW = 50;

const setupWebSocket = (server) => {
    const webSocketServer = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 64 * 1024
    });

    webSocketServer.on("connection", async (socket) => {
        let authenticated = false;
        let authTimer;
        let messageCount = 0;
        let messageWindowStart = Date.now();

        const finishAuthentication = async (token) => {
            if (authenticated) return true;
            if (!token || typeof token !== "string" || token.length > 4096) {
                socket.close(1008, "Authentication required");
                return false;
            }

            let decoded;
            try {
                decoded = jwt.verify(token, env.jwtSecret);
            } catch {
                socket.close(1008, "Invalid authentication token");
                return false;
            }

            authenticated = true;
            clearTimeout(authTimer);
            socket.user = {
                userId: decoded.userId,
                username: decoded.username,
                role: decoded.role,
                roles: [decoded.role]
            };
            socket.subscriptions = new Set();

            const wasAlreadyOnline = isUserOnline(socket.user.userId);
            addConnection(socket.user.userId, socket);

            if (!wasAlreadyOnline) {
                broadcastToUsers(getOnlineUserIds(), {
                    type: "presence.online",
                    data: { userId: socket.user.userId }
                });
            }

            startHeartbeat(socket);
            socket.send(JSON.stringify({ type: "connection.ready", data: { userId: socket.user.userId } }));

            try {
                await sendRecentBroadcasts(socket.user.userId);
            } catch (error) {
                console.error("Could not send unread broadcasts:", error.message);
            }

            return true;
        };

        authTimer = setTimeout(() => {
            if (!authenticated) socket.close(1008, "Authentication timeout");
        }, AUTH_TIMEOUT_MS);

        socket.on("message", async (rawMessage) => {
            if (rawMessage.length > 64 * 1024) {
                socket.close(1009, "Message too large");
                return;
            }

            try {
                const message = JSON.parse(rawMessage.toString());

                if (!authenticated) {
                    if (message?.type !== "auth" || typeof message?.data?.token !== "string") {
                        socket.close(1008, "Authentication required");
                        return;
                    }
                    await finishAuthentication(message.data.token);
                    return;
                }

                const now = Date.now();
                if (now - messageWindowStart >= MESSAGE_WINDOW_MS) {
                    messageWindowStart = now;
                    messageCount = 0;
                }
                messageCount += 1;
                if (messageCount > MAX_MESSAGES_PER_WINDOW) {
                    socket.send(JSON.stringify({ type: "error", data: { message: "Too many WebSocket messages. Please slow down." } }));
                    return;
                }

                await routeMessage(socket, message);
            } catch (error) {
                socket.send(JSON.stringify({ type: "error", data: { message: "Invalid WebSocket message" } }));
            }
        });

        socket.on("close", () => {
            clearTimeout(authTimer);
            if (!authenticated || !socket.user) return;

            removeConnection(socket.user.userId, socket);
            if (!isUserOnline(socket.user.userId)) {
                broadcastToUsers(getOnlineUserIds(), {
                    type: "presence.offline",
                    data: { userId: socket.user.userId }
                });
            }
        });

        socket.on("error", () => {
            clearTimeout(authTimer);
            if (authenticated && socket.user) removeConnection(socket.user.userId, socket);
        });
    });

    startHeartbeatInterval(webSocketServer);
    console.log("WebSocket server ready");
};

export default setupWebSocket;
