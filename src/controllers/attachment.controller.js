import fs from "fs";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import ConversationMember from "../models/ConversationMember.js";
import Message from "../models/Message.js";

const uploadDir = path.resolve(process.cwd(), "uploads");
const allowed = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/gif", ".gif"], ["image/webp", ".webp"], ["audio/webm", ".webm"], ["audio/mpeg", ".mp3"], ["audio/mp4", ".m4a"], ["audio/ogg", ".ogg"], ["application/pdf", ".pdf"]]);
const MAX_SIZE = 15 * 1024 * 1024;

export const uploadAttachment = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) return res.status(400).json({ message: "Invalid conversation ID" });
    const member = await ConversationMember.findOne({ conversationId, userId: req.user.userId });
    if (!member) return res.status(403).json({ message: "You are not a member of this conversation" });
    const mime = String(req.headers["content-type"] || "").split(";")[0].toLowerCase();
    if (!allowed.has(mime)) return res.status(415).json({ message: "Only images, audio, and PDF files are supported" });
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ message: "File is empty" });
    if (req.body.length > MAX_SIZE) return res.status(413).json({ message: "File must be 15 MB or smaller" });
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const filename = `${crypto.randomUUID()}${allowed.get(mime)}`;
    await fs.promises.writeFile(path.join(uploadDir, filename), req.body, { flag: "wx" });
    res.status(201).json({ attachment: { filename, name: String(req.query.name || "attachment").replace(/[\\/\\\0-\\x1f]/g, "_").slice(0, 180), mimeType: mime, size: req.body.length, url: `/api/files/${filename}` } });
  } catch (error) { next(error); }
};

export const downloadAttachment = async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename);
    const messages = await Message.find({ "attachment.filename": filename }).select("conversationId payload").lean();
    if (!messages.length) return res.status(404).json({ message: "Attachment not found" });
    const member = await ConversationMember.findOne({ conversationId: messages[0].conversationId, userId: req.user.userId });
    if (!member) return res.status(403).json({ message: "You do not have access to this attachment" });
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Attachment file is missing" });
    const attachment = messages[0].payload.attachment;
    res.setHeader("Content-Type", attachment.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(attachment.name || filename)}`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    fs.createReadStream(filePath).pipe(res);
  } catch (error) { next(error); }
};
