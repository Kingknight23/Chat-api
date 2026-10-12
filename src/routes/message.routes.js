import express from "express";

import {
    messages
} from "../controllers/message.controller.js";

const router = express.Router();

router.get(
    "/:conversationId/messages",
    messages
);

export default router;