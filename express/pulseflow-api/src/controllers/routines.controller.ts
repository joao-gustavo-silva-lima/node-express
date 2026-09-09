import { Request, Response } from "express";
import RoutinesService from "../services/routines.service.js";

export default class RoutinesController {
  public static async create(req: Request, res: Response) {
    const { routineId, habitId } = req.params as Record<string, string>;

    res.json({
      message: `The resource was created successfully`,
      data: await RoutinesService.create(req.body, routineId, habitId),
    });
  }

  public static async read(req: Request, res: Response) {
    const { routineId, habitId, subTaskId } = req.params as Record<
      string,
      string
    >;

    const pathSegments = req.route.path
      .replace(/\/$/, "")
      .split("/")
      .filter(Boolean) as string[];

    const isSingleSourceEndpoint = (
      pathSegments[pathSegments.length - 1] ?? ""
    ).startsWith(":");

    res.json(
      await RoutinesService.read(
        !isSingleSourceEndpoint,
        routineId,
        habitId,
        subTaskId,
      ),
    );
  }

  public static async update(req: Request, res: Response) {
    const { routineId, habitId, subTaskId } = req.params as Record<
      string,
      string
    >;

    const resourceId = subTaskId || routineId || habitId;

    res.json({
      message: `The resource with ID '${resourceId}' was updated successfully`,
      data: await RoutinesService.patch(
        req.body,
        routineId!,
        habitId,
        subTaskId,
      ),
    });
  }

  public static async delete(req: Request, res: Response) {
    const { routineId, habitId, subTaskId } = req.params as Record<
      string,
      string
    >;

    await RoutinesService.delete(routineId!, habitId, subTaskId);

    res.json({
      message: `The resource was deleted successfully`,
    });
  }
}
