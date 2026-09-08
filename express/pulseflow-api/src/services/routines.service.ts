import DatabaseConnection from "../database/connection.db.js";
import {
  Database,
  DTO,
  habitOutterSchema,
  subtaskOutterSchema,
} from "../types/routines.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";
import formatZodErrors from "../utils/zod-errors-formater.utils.js";

export default class RoutinesService {
  public static async create(DTO: DTO, routineId?: string, habitId?: string) {
    const data = await DatabaseConnection.read();

    const resources =
      routineId === undefined
        ? { siblings: {}, self: {}, type: undefined, children: data }
        : this.checkExistence(data, routineId, habitId);

    this.checkIDAvailability(DTO.id, resources.children);
    this.checkTitleAvailability(DTO.title, resources.children);
    this.validateResourceMutation(resources.type, resources.children);

    resources.children[DTO.id] = DTO;

    await DatabaseConnection.write(data);

    return DTO;
  }

  public static async read(
    readChildren = false,
    routineId?: string,
    habitId?: string,
    subTaskId?: string,
  ) {
    const data = await DatabaseConnection.read();

    if (routineId === undefined) {
      return Object.values(data);
    }

    const resource = this.checkExistence(data, routineId, habitId, subTaskId);

    return readChildren ? Object.values(resource.children) : resource.self;
  }

  public static async patch(
    DTO: { title: string },
    routineId: string,
    habitId?: string,
    subTaskId?: string,
  ) {
    const data = await DatabaseConnection.read();
    const patchingResource = this.checkExistence(
      data,
      routineId,
      habitId,
      subTaskId,
    );

    this.checkTitleAvailability(DTO.title, patchingResource.siblings);

    patchingResource.self.title = DTO.title;

    await DatabaseConnection.write(data);

    return patchingResource.self;
  }

  public static async delete(
    routineId: string,
    habitId?: string,
    subTaskId?: string,
  ) {
    const data = await DatabaseConnection.read();
    const resources = this.checkExistence(data, routineId, habitId, subTaskId);

    this.validateResourceMutation(resources.type, resources.children);

    delete resources.siblings[resources.self.id];

    await DatabaseConnection.write(data);
  }

  private static checkExistence(
    database: Database,
    routineId: string,
    habitId?: string,
    subTaskId?: string,
  ): {
    self: DTO;
    type: "routine" | "habit" | "sub-task";
    siblings: Record<string, DTO>;
    children: Record<string, DTO>;
  } {
    const routine = database[routineId];

    if (!routine) {
      throw new StatefulError(
        404,
        `A routine with ID '${routineId}' was not found`,
      );
    } else if (!habitId) {
      return {
        self: routine,
        type: "routine",
        siblings: database,
        children: routine.habits,
      };
    }

    const habit = routine.habits[habitId];

    if (!habit) {
      throw new StatefulError(
        404,
        `A habit with ID '${habitId}' was not found`,
      );
    } else if (!subTaskId) {
      return {
        self: habit,
        type: "habit",
        siblings: routine.habits,
        children: habit.subTasks,
      };
    }

    const subTask = habit.subTasks[subTaskId];

    if (!subTask) {
      throw new StatefulError(
        404,
        `A subtask with ID '${subTaskId}' was not found`,
      );
    }

    return {
      self: subTask,
      type: "sub-task",
      siblings: habit.subTasks,
      children: {},
    };
  }

  private static checkIDAvailability(
    id: string,
    checkingResources: Record<string, DTO>,
  ) {
    if (checkingResources[id] !== undefined) {
      throw new StatefulError(409, `IDs have to be unique`);
    }
  }

  private static checkTitleAvailability(
    title: string,
    checkingResources: Record<string, DTO>,
  ) {
    const normalizedTitle = title.trim().toLowerCase();
    if (
      Object.values(checkingResources).some(
        (resource) => resource.title.trim().toLowerCase() === normalizedTitle,
      )
    ) {
      throw new StatefulError(409, `Titles have to be unique`);
    }
  }

  private static validateResourceMutation(
    type: "routine" | "habit" | "sub-task" | undefined,
    resources: Record<string, DTO>,
  ) {
    const validator = (() => {
      switch (type) {
        case "habit":
          return habitOutterSchema;
        case "sub-task":
          return subtaskOutterSchema;
      }
    })();

    if (validator === undefined) return;

    const validation = validator.safeParse(Object.values(resources));

    if (!validation.success) {
      throw new StatefulError(400, "The requested mutation is bad", {
        errors: formatZodErrors(validation.error.issues),
      });
    }
  }
}
