import { Request, Response } from "express";
import RoutinesService from "../services/routines.service.js";

export default class RoutinesController {
  public static async create(req: Request, res: Response) {
    const { routineId, habitId } = req.params as Record<string, string>;

    const data = await RoutinesService.create(req.body, routineId, habitId);

    res.status(201).json({
      message: `The new ${data.resourceType} was created successfully`,
      data: data.resource,
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

    const data = await RoutinesService.patch(
      req.body,
      routineId!,
      habitId,
      subTaskId,
    );

    res.json({
      message: `The ${data.resourceType} with ID '${data.resource.id}' was updated successfully`,
      data: data.resource,
    });
  }

  public static async delete(req: Request, res: Response) {
    const { routineId, habitId, subTaskId } = req.params as Record<
      string,
      string
    >;

    const data = await RoutinesService.delete(routineId!, habitId, subTaskId);

    res.json({
      message: `The ${data.resourceType} with ID '${data.resource.id}' was deleted successfully`,
    });
  }

  public static async toggleTodaysCompletionDate(req: Request, res: Response) {
    const { routineId, habitId, subTaskId } = req.params as Record<
      string,
      string
    >;

    const data = await RoutinesService.toggleTodaysCompletionDate(
      routineId!,
      habitId,
      subTaskId,
    );

    res.json({
      message: `The ${data.resourceType} with ID '${data.resource.id}' was marked as '${data.toggleState}'`,
    });
  }

  public static notFound(req: Request, res: Response) {
    res.status(404).json({
      message: `No resource was found at route '${req.path}'`,
    });
  }
}
