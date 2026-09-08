import { Request, Response } from "express";
import RoutinesService from "../services/routines.service.js";

export default class RoutinesController {
  public static async readRoutines(req: Request, res: Response) {
    res.json(await RoutinesService.read());
  }

  public static async createRoutine(req: Request, res: Response) {
    res.status(201).json({
      message: "The routine was created successfully.",
      data: await RoutinesService.create(req.body),
    });
  }

  public static async updateRoutineById(req: Request, res: Response) {
    const { routineId } = req.params;

    res.json({
      message: `The routine with ID '${routineId}' was updated successfully`,
      data: await RoutinesService.patch(req.body, routineId as string),
    });
  }

  public static async deleteRoutineById(req: Request, res: Response) {
    const { routineId } = req.params;

    await RoutinesService.delete(routineId as string);

    res.json({
      message: `The routine with ID '${routineId}' was deleted successfully`,
    });
  }

  public static async createHabitByRoutineId(req: Request, res: Response) {
    const { routineId } = req.params;

    res.json({
      message: `The new habit was created successfully at routine with id '${routineId}'`,
      data: await RoutinesService.create(req.body, routineId as string),
    });
  }
}
