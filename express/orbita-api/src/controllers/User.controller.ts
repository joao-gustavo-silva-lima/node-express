import type { Request, Response } from "express";
import * as userService from "../services/User.service";

export async function createUser(req: Request, res: Response) {
  const user = await userService.createUser(req.body);

  res.status(201).json({
    code: "USER_CREATED",
    message: "The user has been created successfully.",
    data: user,
  });
}
