import { Request, Response } from "express";
import RoutinesService from "../services/routines.service.js";

export default class RoutinesController {
  public static async createRoutine(req: Request, res: Response) {
    res.status(201).json({
      message: "The routine was created successfully.",
      data: await RoutinesService.createRoutine(req.body),
    });
  }
}
