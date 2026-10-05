import type { Request, Response } from "express";
import {
  fetchByIdUserService,
  loginUserService,
  registerUserService,
} from "../services/Users.service.js";

export async function registerUserController(req: Request, res: Response) {
  await registerUserService(req.body);

  res.status(201).json({
    code: "USER_CREATED",
    message: "User created successfully.",
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
    code: "LOGIN_SUCCESS",
    message: "User logged in successfully.",
  });
}

export async function logoutUserController(req: Request, res: Response) {
  res.clearCookie("token");

  res.status(200).json({
    code: "LOGOUT_SUCCESS",
    message: "User logged out successfully.",
  });
}

export async function fetchByIdUserController(req: Request, res: Response) {
  res.status(200).json({
    code: "USER_FETCHED",
    message: "User data retrieved successfully.",
    data: await fetchByIdUserService((req as any).authenticatedUserId),
  });
}
