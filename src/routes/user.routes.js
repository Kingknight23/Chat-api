import express from "express";
import { profile, update } from "../controllers/user.controller.js";
const router=express.Router();
router.get("/me", profile);
router.patch("/me", update);
export default router;
