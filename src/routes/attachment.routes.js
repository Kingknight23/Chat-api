import express from "express";
import { uploadAttachment, downloadAttachment } from "../controllers/attachment.controller.js";

const router = express.Router();
const rawUpload = express.raw({
  type: ["image/*", "audio/*", "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text", "text/plain"],
  limit: "15mb"
});
router.post("/conversations/:conversationId/attachments", rawUpload, uploadAttachment);
router.get("/files/:fileId", downloadAttachment);
export default router;
