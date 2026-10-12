import express from "express";

import {
    conversations,
    conversation,
    openDirect,
    markRead
} from "../controllers/conversation.controller.js";


const router = express.Router();


router.get(
    "/",
    conversations
);

router.post(
    "/direct",
    openDirect
);

// Persist per-user read state in MongoDB so unread counts survive reloads.
router.patch(
    "/:conversationId/read",
    markRead
);


router.get(
    "/:conversationId",
    conversation
);


export default router;