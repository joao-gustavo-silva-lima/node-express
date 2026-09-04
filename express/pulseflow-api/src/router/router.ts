import express from "express";
import ValidateRoutineMiddleware from "../middlewares/validate-routine.middleware.js";

export const router = express.Router();

router.post("/", ValidateRoutineMiddleware, (req, res) => {
  res.send({ message: "registered" });
});
