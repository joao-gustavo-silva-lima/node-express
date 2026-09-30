import type { Request, Response } from "express";
import UsersService from "../services/Users.service.js";

export default class UsersController {
  public static async register(req: Request, res: Response) {
    res.status(201).json({ code: await UsersService.register(req.body) });
  }
}
