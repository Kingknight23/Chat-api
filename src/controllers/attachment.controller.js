import mongoose from "mongoose";
import ConversationMember from "../models/ConversationMember.js";
import Message from "../models/Message.js";

const MAX_SIZE = 15 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/gif", ".gif"],
  ["image/webp", ".webp"], ["image/avif", ".avif"],
  ["audio/webm", ".webm"], ["audio/mpeg", ".mp3"], ["audio/mp4", ".m4a"],
  ["audio/ogg", ".ogg"], ["application/pdf", ".pdf"],
  ["application/msword", ".doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
  ["application/vnd.oasis.opendocument.text", ".odt"],
  ["text/plain", ".txt"]
]);
const bucket = () => {
  if (!mongoose.connection.db) throw new Error("MongoDB is not connected");
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "attachments" });
};
const safeName = (value) => String(value || "attachment")
  .replace(/[\\/\0-\x1f\x7f]/g, "_").slice(0, 180);

export const uploadAttachment = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) return res.status(400).json({ message: "Invalid conversation ID" });
    const member = await ConversationMember.findOne({ conversationId, userId: req.user.userId });
    if (!member) return res.status(403).json({ message: "You are not a member of this conversation" });
    const mime = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED.has(mime)) return res.status(415).json({ message: "Unsupported file type. Upload an image, audio file, PDF, Word document, ODT, or TXT file." });
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ message: "File is empty" });
    if (req.body.length > MAX_SIZE) return res.status(413).json({ message: "File must be 15 MB or smaller" });

    const originalName = safeName(req.query.name || `attachment${ALLOWED.get(mime)}`);
    const id = new mongoose.mongo.ObjectId();
    const upload = bucket().openUploadStreamWithId(id, originalName, {
      contentType: mime,
      metadata: { conversationId: String(conversationId), uploadedBy: String(req.user.userId), originalName }
    });
    await new Promise((resolve, reject) => {
      upload.once("error", reject);
      upload.once("finish", resolve);
      upload.end(req.body);
    });

    return res.status(201).json({ attachment: {
      filename: String(id), name: originalName, mimeType: mime,
      size: req.body.length, url: `/api/files/${id}`
    }});
  } catch (error) { next(error); }
};

export const downloadAttachment = async (req, res, next) => {
  try {
    if (!mongoose.mongo.ObjectId.isValid(req.params.fileId)) return res.status(400).json({ message: "Invalid attachment ID" });
    const id = new mongoose.mongo.ObjectId(req.params.fileId);
    const files = await bucket().find({ _id: id }).toArray();
    const file = files[0];
    if (!file) return res.status(404).json({ message: "Attachment not found" });

    const conversationId = file.metadata?.conversationId;
    if (!conversationId) return res.status(404).json({ message: "Attachment metadata is missing" });
    const [member, linkedMessage] = await Promise.all([
      ConversationMember.findOne({ conversationId, userId: req.user.userId }),
      Message.findOne({ conversationId, "attachment.filename": String(id) }).select("_id").lean()
    ]);
    if (!member || !linkedMessage) return res.status(403).json({ message: "You do not have access to this attachment" });

    const filename = safeName(file.metadata?.originalName || file.filename || "attachment");
    res.setHeader("Content-Type", file.contentType || "application/octet-stream");
    res.setHeader("Content-Length", String(file.length));
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    bucket().openDownloadStream(id).on("error", next).pipe(res);
  } catch (error) { next(error); }
};
