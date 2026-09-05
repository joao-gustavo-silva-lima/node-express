import { Request, Response } from "express";
import RoutinesService from "../services/routines.service.js";

export default class RoutinesController {
  public static async readRoutines(req: Request, res: Response) {
    res.json(await RoutinesService.readRoutines());
  }

  public static async createRoutine(req: Request, res: Response) {
    res.status(201).json({
      message: "The routine was created successfully.",
      data: await RoutinesService.createRoutine(req.body),
    });
  }

  public static async updateRoutineById(req: Request, res: Response) {
    const { routineId } = req.params;
    const { title: newTitle } = req.body;

    res.json({
      message: `The routine with ID '${routineId}' was updated successfully`,
      data: await RoutinesService.updateRoutineById(
        routineId as string,
        newTitle as string,
      ),
    });
  }

  public static async deleteRoutineById(req: Request, res: Response) {
    const { routineId } = req.params;

    await RoutinesService.deleteRoutineById(routineId as string);

    res.json({
      message: `The routine with ID '${routineId}' was deleted successfully`,
    });
  }
}
