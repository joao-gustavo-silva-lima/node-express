import type { Request, Response } from "express";
import { registerUserService } from "../services/Users.service.js";

export async function registerUserController(req: Request, res: Response) {
  await registerUserService(req.body);

  res.status(201).json({ code: "USER_REGISTERED" });
}
