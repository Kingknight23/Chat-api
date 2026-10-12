import express from "express";
import { publicKey, conversationKeys } from "../controllers/key.controller.js";

const router = express.Router();
router.put("/public", publicKey);
router.get("/conversation/:conversationId", conversationKeys);
export default router;
