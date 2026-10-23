import type { Request, Response } from "express";
import * as userService from "../services/User.service";
import { isProduction } from "../common/constants/nodeEnv";

export async function createUser(req: Request, res: Response) {
  const { user, token } = await userService.createUser(req.body);

  res.cookie("orbitaAuthToken", token, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,

    secure: isProduction,
    partitioned: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.status(201).json(user);
}

export async function loginUser(req: Request, res: Response) {
  const token = await userService.loginUser(req.body);

  res.cookie("orbitaAuthToken", token, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,

    secure: isProduction,
    partitioned: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.json({
    code: "USER_LOGIN",
    message: "The user has logged in successfully",
  });
}

export async function logoutUser(req: Request, res: Response) {
  res.clearCookie("orbitaAuthToken");

  res.json({
    code: "USER_LOGOUT",
    message: "The user has logged out successfully",
  });
}

export async function fetchUser(req: Request, res: Response) {
  const { username } = req.params;
  const isAPublicFetch = username !== undefined;

  const user = await userService.fetchUser(
    isAPublicFetch ? (username as string) : req.authUsername!,
    isAPublicFetch ? null : req.authUsername!,
  );

  res.json(user);
}

export async function updateUser(req: Request, res: Response) {
  const { updatedUser: user, token } = await userService.updateUser(
    req.authUsername!,
    req.body,
  );

  res.cookie("orbitaAuthToken", token, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,

    secure: isProduction,
    partitioned: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const { password } = req.body;

  await userService.deleteUser(req.authUsername!, password);

  res.clearCookie("orbitaAuthToken");

  res.json({
    code: "USER_DELETED",
    message: "The user was deleted successfully",
  });
}
