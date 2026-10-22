import type { Request, Response } from "express";
import * as userService from "../services/User.service";
import { isProduction } from "../common/constants/nodeEnv";
import HttpError from "../common/classes/HttpError";

export async function createUser(req: Request, res: Response) {
  const { user, token } = await userService.createUser(req.body);

  res.cookie("orbitaAuthToken", token, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,

    secure: isProduction,
    partitioned: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.setHeader("Content-Location", `/user/${user.username.toLowerCase()}`);

  res.status(201).json({
    code: "USER_CREATED",
    message: "The user has been created successfully.",
    data: user,
  });
}

export async function fetchUser(req: Request, res: Response) {
  const { username } = req.params;
  const isAPublicFetch = username !== undefined;

  const user = await userService.fetchUser(
    isAPublicFetch ? (username as string) : req.authenticatedUsername!,
    isAPublicFetch ? null : req.authenticatedUsername!,
  );

  res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const { password } = req.body;

  await userService.deleteUser(req.authenticatedUsername!, password);

  res.json({
    code: "USER_DELETED",
    message: "The user was deleted successfully",
  });
}
