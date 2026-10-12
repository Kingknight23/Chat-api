import express from "express";
import {broadcasts} from "../controllers/broadcast.controller.js";


const router =
    express.Router();


router.get(
    "/",
    broadcasts
);


export default router;