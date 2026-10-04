import type { Request, Response } from "express";
import {
  authenticateUserService,
  registerUserService,
} from "../services/Users.service.js";

export async function registerUserController(req: Request, res: Response) {
  await registerUserService(req.body);

  res.status(201).json({
    code: "USER_REGISTERED",
    message: "The user has been registered successfully.",
  });
}

export async function authenticateUserController(req: Request, res: Response) {
  await authenticateUserService(req.body);

  res.status(200).json({
    code: "USER_AUTHENTICATED",
    message: "The user authentication succeded.",
  });
}
