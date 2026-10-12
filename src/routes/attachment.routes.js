import express from "express";
import { uploadAttachment, downloadAttachment } from "../controllers/attachment.controller.js";
const router = express.Router();
router.post("/conversations/:conversationId/attachments", express.raw({ type: ["image/*", "audio/*", "application/pdf"], limit: "15mb" }), uploadAttachment);
router.get("/files/:filename", downloadAttachment);
export default router;
