import fs from "fs";
import http from "http";
import https from "https";
import app from "./app.js";
import env from "./config/env.js";
import connectDatabase from "./config/database.js";
import setupWebSocket from "./websocket/websocket.server.js";
import seedAdmin from "./config/seed-admin.js";

const startServer = async () => {
    await connectDatabase();
    await seedAdmin();

    let server;
    if (env.https) {
        if (!env.httpsKeyPath || !env.httpsCertPath) {
            throw new Error("HTTPS_KEY_PATH and HTTPS_CERT_PATH are required when HTTPS=true");
        }
        server = https.createServer({ key: fs.readFileSync(env.httpsKeyPath), cert: fs.readFileSync(env.httpsCertPath) }, app);
    } else {
        server = http.createServer(app);
    }

    setupWebSocket(server);
    server.listen(env.port, () => {
        const scheme = env.https ? "https" : "http";
        const wsScheme = env.https ? "wss" : "ws";
        console.log(`Chat API running on ${scheme}://localhost:${env.port}`);
        console.log(`WebSocket running on ${wsScheme}://localhost:${env.port}/ws`);
    });
};
startServer();
