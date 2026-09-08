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

  public static async readRoutineById(req: Request, res: Response) {
    const { routineId } = req.params;

    res.json(await RoutinesService.read(false, routineId as string));
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

  public static async readHabitsByRoutineId(req: Request, res: Response) {
    const { routineId } = req.params;

    res.json(await RoutinesService.read(true, routineId as string));
  }

  public static async createHabitByRoutineId(req: Request, res: Response) {
    const { routineId } = req.params;

    res.json({
      message: `The new habit was created successfully at routine with id '${routineId}'`,
      data: await RoutinesService.create(req.body, routineId as string),
    });
  }

  public static async readHabitById(req: Request, res: Response) {
    const { routineId, habitId } = req.params;

    res.json(
      await RoutinesService.read(false, routineId as string, habitId as string),
    );
  }

  public static async updateHabitById(req: Request, res: Response) {
    const { routineId, habitId } = req.params;

    res.json({
      message: `The habit with ID '${habitId}' was updated successfully`,
      data: await RoutinesService.patch(
        req.body,
        routineId as string,
        habitId as string,
      ),
    });
  }

  public static async deleteHabitById(req: Request, res: Response) {
    const { routineId, habitId } = req.params;

    await RoutinesService.delete(routineId as string, habitId as string);

    res.json({
      message: `The habit with ID '${habitId}' was deleted successfully`,
    });
  }

  public static async createSubTaskByHabitId(req: Request, res: Response) {
    const { routineId, habitId } = req.params;

    res.json({
      message: `The new sub-task was created successfully at habit with id '${habitId}'`,
      data: await RoutinesService.create(
        req.body,
        routineId as string,
        habitId as string,
      ),
    });
  }

  public static async readSubTasksByHabitId(req: Request, res: Response) {
    const { routineId, habitId } = req.params;

    res.json(
      await RoutinesService.read(true, routineId as string, habitId as string),
    );
  }

  public static async readSubTaskById(req: Request, res: Response) {
    const { routineId, habitId, subTaskId } = req.params;

    res.json(
      await RoutinesService.read(
        false,
        routineId as string,
        habitId as string,
        subTaskId as string,
      ),
    );
  }

  public static async updateSubTaskById(req: Request, res: Response) {
    const { routineId, habitId, subTaskId } = req.params;

    res.json({
      message: `The sub-task with ID '${subTaskId}' was updated successfully`,
      data: await RoutinesService.patch(
        req.body,
        routineId as string,
        habitId as string,
        subTaskId as string,
      ),
    });
  }

  public static async deleteSubTaskById(req: Request, res: Response) {
    const { routineId, habitId, subTaskId } = req.params;

    await RoutinesService.delete(
      routineId as string,
      habitId as string,
      subTaskId as string,
    );

    res.json({
      message: `The sub-task with ID '${subTaskId}' was deleted successfully`,
    });
  }
}
