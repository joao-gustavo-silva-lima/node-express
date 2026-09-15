import DatabaseConnection from "../database/connection.db.js";
import {
  Category,
  Database,
  DTO,
  Habit,
  habitChildrenSchema,
  routineChildrenSchema,
} from "../types/routines.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";
import formatZodErrors from "../utils/zod-errors-formater.utils.js";

export default class RoutinesService {
  public static async create(DTO: DTO, routineId?: string, habitId?: string) {
    const data = await DatabaseConnection.read();

    const resource =
      routineId === undefined
        ? {
            siblings: [],
            children: data,
            self: {} as DTO,
            parent: undefined,
            selfType: undefined,
            parentType: undefined,
            childrenType: "routine",
          }
        : this.checkExistence(data, routineId, habitId);

    this.checkIDAvailability(DTO.id, resource.children);
    this.checkTitleAvailability(DTO.title, resource.children);

    resource.children.push(DTO as any);

    this.validateResourceMutation(resource.selfType, resource.self);

    await DatabaseConnection.write(data);

    return { resource: DTO, resourceType: resource.childrenType };
  }

  public static async read(
    readChildren = false,
    routineId?: string,
    habitId?: string,
    subTaskId?: string,
  ) {
    const data = await DatabaseConnection.read();

    if (routineId === undefined) {
      return data;
    }

    const resource = this.checkExistence(data, routineId, habitId, subTaskId);

    return readChildren ? resource.children : resource.self;
  }

  public static async patch(
    DTO: { title?: string; category?: string },
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

    if (DTO.title !== undefined) {
      this.checkTitleAvailability(DTO.title, patchingResource.siblings);

      patchingResource.self.title = DTO.title;
    }

    if (patchingResource.selfType === "habit" && DTO.category !== undefined) {
      (patchingResource.self as Habit).category = DTO.category as Category;
    }

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
    const resource = this.checkExistence(data, routineId, habitId, subTaskId);
    const deletionIndex = resource.siblings.findIndex(
      (sibling) => sibling.id === resource.self.id,
    );

    resource.siblings.splice(deletionIndex, 1);

    if (resource.parent !== undefined) {
      this.validateResourceMutation(resource.parentType!, resource.parent);
    }

    await DatabaseConnection.write(data);

    return { resource: resource.self, resourceType: resource.selfType };
  }

  public static async toggleTodaysCompletionDate(
    routineId: string,
    habitId?: string,
    subTaskId?: string,
  ) {
    const data = await DatabaseConnection.read();
    const todayISOString = new Date().toISOString().split("T")[0]!;
    const ids = [routineId, habitId, subTaskId].filter(
      (id) => id !== undefined,
    ) as [string, string?, string?];

    const mainToggle = this.toggleCompletionDates(
      todayISOString,
      false,
      data,
      ...ids,
    );

    while (ids.length > 1) {
      ids.pop();
      this.toggleCompletionDates(todayISOString, false, data, ...ids);
    }

    await DatabaseConnection.write(data);

    return {
      resource: mainToggle.resource.self,
      resourceType: mainToggle.resource.selfType,
      toggleState: mainToggle.isCompleting ? "completed" : "uncompleted",
    };
  }

  private static toggleCompletionDates(
    todayISOString: string,
    isParsingParent: boolean,
    database: Database,
    routineId: string,
    habitId?: string,
    subTaskId?: string,
  ) {
    const resource = this.checkExistence(
      database,
      routineId,
      habitId,
      subTaskId,
    );
    const parsingDates = resource.self.completionDates.filter(
      (date) => date !== todayISOString,
    );
    const isCompleting = isParsingParent
      ? resource.children.every((child) =>
          child.completionDates.includes(todayISOString),
        )
      : resource.self.completionDates.length === parsingDates.length;

    resource.self.completionDates = [
      ...parsingDates,
      ...(isCompleting ? [todayISOString] : []),
    ];

    return { resource, isCompleting };
  }

  private static checkExistence(
    database: Database,
    routineId: string,
    habitId?: string,
    subTaskId?: string,
  ): {
    self: DTO;
    parent: DTO | undefined;
    siblings: DTO[];
    children: DTO[];
    selfType: "routine" | "habit" | "sub-task";
    parentType: "routine" | "habit" | "sub-task" | undefined;
    childrenType: "routine" | "habit" | "sub-task" | undefined;
  } {
    const routine = database.find((routine) => routine.id === routineId);

    if (!routine) {
      throw new StatefulError(
        404,
        "ROUTINE_NOT_FOUND",
        `A routine with ID '${routineId}' was not found`,
      );
    } else if (!habitId) {
      return {
        self: routine,
        parent: undefined,
        siblings: database,
        selfType: "routine",
        childrenType: "habit",
        parentType: undefined,
        children: routine.habits,
      };
    }

    const habit = routine.habits.find((habit) => habit.id === habitId);

    if (!habit) {
      throw new StatefulError(
        404,
        "HABIT_NOT_FOUND",
        `A habit with ID '${habitId}' was not found`,
      );
    } else if (!subTaskId) {
      return {
        self: habit,
        parent: routine,
        selfType: "habit",
        parentType: "routine",
        siblings: routine.habits,
        children: habit.subTasks,
        childrenType: "sub-task",
      };
    }

    const subTask = habit.subTasks.find((subTask) => subTask.id === subTaskId);

    if (!subTask) {
      throw new StatefulError(
        404,
        "SUBTASK_NOT_FOUND",
        `A subtask with ID '${subTaskId}' was not found`,
      );
    }

    return {
      children: [],
      self: subTask,
      parent: habit,
      parentType: "habit",
      selfType: "sub-task",
      siblings: habit.subTasks,
      childrenType: undefined,
    };
  }

  private static checkIDAvailability(id: string, checkingResources: DTO[]) {
    if (checkingResources.some((resource) => resource.id === id)) {
      throw new StatefulError(409, "DUPLICATE_ID", `IDs have to be unique`);
    }
  }

  private static checkTitleAvailability(
    title: string,
    checkingResources: DTO[],
  ) {
    const normalizedTitle = title.trim().toLowerCase();
    if (
      checkingResources.some(
        (resource) => resource.title.trim().toLowerCase() === normalizedTitle,
      )
    ) {
      throw new StatefulError(
        409,
        "DUPLICATE_TITLE",
        `Titles have to be unique`,
      );
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
      throw new StatefulError(
        400,
        `INVALID_${type!.toUpperCase()}_MUTATION`,
        "The requested mutation is bad",
        {
          errors: formatZodErrors(validation.error.issues),
        },
      );
    }
  }
}
