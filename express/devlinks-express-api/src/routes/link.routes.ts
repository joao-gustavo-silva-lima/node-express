import express from "express";
import { LinkController } from "../controllers/link.controller.js";

export const router = express.Router();

router.get("/", LinkController.list!);
