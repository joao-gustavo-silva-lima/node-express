import DatabaseConnection from "../database/connection.db.js";
import {
  Database,
  DTO,
  habitChildrenSchema,
  routineChildrenSchema,
} from "../types/routines.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";
import formatZodErrors from "../utils/zod-errors-formater.utils.js";

export default class RoutinesService {
  public static async create(DTO: DTO, routineId?: string, habitId?: string) {
    const data = await DatabaseConnection.read();

    const resources =
      routineId === undefined
        ? {
            siblings: {},
            self: {} as DTO,
            selfType: undefined,
            children: data,
            childrenType: "routine",
          }
        : this.checkExistence(data, routineId, habitId);

    this.checkIDAvailability(DTO.id, resources.children);
    this.checkTitleAvailability(DTO.title, resources.children);

    resources.children[DTO.id] = DTO;

    this.validateResourceMutation(resources.selfType, resources.self);

    await DatabaseConnection.write(data);

    return { resource: DTO, resourceType: resources.childrenType };
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

    return {
      resource: patchingResource.self,
      resourceType: patchingResource.selfType,
    };
  }

  public static async delete(
    routineId: string,
    habitId?: string,
    subTaskId?: string,
  ) {
    const data = await DatabaseConnection.read();
    const resources = this.checkExistence(data, routineId, habitId, subTaskId);

    this.validateResourceMutation(resources.selfType, resources.self);

    delete resources.siblings[resources.self.id];

    await DatabaseConnection.write(data);

    return { resource: resources.self, resourceType: resources.selfType };
  }

  private static checkExistence(
    database: Database,
    routineId: string,
    habitId?: string,
    subTaskId?: string,
  ): {
    self: DTO;
    siblings: Record<string, DTO>;
    children: Record<string, DTO>;
    selfType: "routine" | "habit" | "sub-task";
    childrenType: "routine" | "habit" | "sub-task" | undefined;
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
        selfType: "routine",
        siblings: database,
        children: routine.habits,
        childrenType: "habit",
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
        selfType: "habit",
        siblings: routine.habits,
        children: habit.subTasks,
        childrenType: "sub-task",
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
      selfType: "sub-task",
      siblings: habit.subTasks,
      children: {},
      childrenType: undefined,
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
    resource: DTO,
  ) {
    const validator = (() => {
      switch (type) {
        case "routine":
          return routineChildrenSchema;
        case "habit":
          return habitChildrenSchema;
      }
    })();

    if (validator === undefined) return;

    const validation = validator.safeParse(resource);

    if (!validation.success) {
      console.log(type, resource, validation.error!.issues);
      throw new StatefulError(400, "The requested mutation is bad", {
        errors: formatZodErrors(validation.error.issues),
      });
    }
  }
}
