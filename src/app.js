import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authenticate from "./middleware/auth.js";
import errorHandler from "./middleware/error.js";
import rateLimit from "./middleware/rate-limit.js";
import env from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import friendRoutes from "./routes/friend.routes.js";
import groupRoutes from "./routes/group.routes.js";
import broadcastRoutes from "./routes/broadcast.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import keyRoutes from "./routes/key.routes.js";
import userRoutes from "./routes/user.routes.js";
import attachmentRoutes from "./routes/attachment.routes.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.trustProxy ? 1 : false);
app.use(helmet());
app.use(cors({
    origin: env.corsOrigin,
    credentials: false
}));
app.use(express.json({ limit: "3mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "chat-api" });
});

app.use(
    "/api/auth",
    rateLimit({ windowMs: 60_000, max: 10, message: "Too many authentication requests. Please try again later." }),
    authRoutes
);

app.use(authenticate);

app.use("/api", attachmentRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/broadcasts", broadcastRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/conversations", messageRoutes);
app.use("/api/keys", keyRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

export default app;
