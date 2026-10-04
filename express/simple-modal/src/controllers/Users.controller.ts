import type { Request, Response } from "express";
import {
  fetchByIdUserService,
  loginUserService,
  registerUserService,
} from "../services/Users.service.js";

export async function registerUserController(req: Request, res: Response) {
  await registerUserService(req.body);

  res.status(201).json({
    code: "USER_REGISTERED",
    message: "The user has been registered successfully.",
  });
}

export async function loginUserController(req: Request, res: Response) {
  const token = await loginUserService(req.body);

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({
    code: "USER_LOGGED_IN",
    message: "The user logged in successfully.",
  });
}

export async function fetchByIdUserController(req: Request, res: Response) {
  res.json({
    code: "SUCCESSFUL_USER_DATA_FETCH",
    message: "The user data was fetched successfully.",
    data: await fetchByIdUserService(req.authenticatedUserId),
  });
}
