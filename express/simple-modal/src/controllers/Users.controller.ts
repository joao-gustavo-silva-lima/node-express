import type { Request, Response } from "express";
import { registerUserService } from "../services/Users.service.js";

export async function registerUserController(req: Request, res: Response) {
  res.status(201).json({ code: await registerUserService(req.body) });
}
