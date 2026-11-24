import type { Request, Response } from "express";
import * as userService from "./User.service.js";
import {
  assignAuthenticationCookie,
  clearAuthenticationCookie,
} from "./User.utils.js";

export async function createUser(req: Request, res: Response) {
  const { user, token } = await userService.createUser(req.body);

  assignAuthenticationCookie(res, token);

  res.status(201).json(user);
}

export async function loginUser(req: Request, res: Response) {
  const { user, token } = await userService.loginUser(req.body);

  assignAuthenticationCookie(res, token);

  res.json(user);
}

export async function logoutUser(req: Request, res: Response) {
  clearAuthenticationCookie(res);

  res.json({
    code: "USER_LOGOUT_SUCCESS",
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

  assignAuthenticationCookie(res, token);

  res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const { password } = req.body;

  await userService.deleteUser(req.authUsername!, password);

  clearAuthenticationCookie(res);

  res.json({
    code: "USER_DELETION_SUCCESS",
    message: "The user was deleted successfully",
  });
}
