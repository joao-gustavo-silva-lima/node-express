import express from "express";
import validateRoutineMiddleware from "../middlewares/validate-routine.middleware.js";

export const router = express.Router();

router.post("/", validateRoutineMiddleware, (req, res) => {
  res.send({ message: "registered" });
});
