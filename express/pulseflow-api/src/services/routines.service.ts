import DatabaseConnection from "../database/connection.db.js";
import {
  Database,
  DTO,
  Habit,
  Routine,
  SubTask,
} from "../types/routines.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

export default class RoutinesService {
  public static async create(DTO: DTO, routineId?: string, habitId?: string) {
    const data = await DatabaseConnection.read();

    const creativeResources =
      routineId === undefined
        ? data
        : this.checkExistence(data, routineId, habitId).children;

    this.checkIDAvailability(DTO.id, creativeResources);
    this.checkTitleAvailability(DTO.title, creativeResources);

    creativeResources[DTO.id] = DTO;

    await DatabaseConnection.write(data);

    return DTO;
  }

  public static async read(
    routineId?: string,
    habitId?: string,
    subTaskId?: string,
  ) {
    const data = await DatabaseConnection.read();

    return routineId === undefined
      ? Object.values(data)
      : this.checkExistence(data, routineId, habitId, subTaskId).self;
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

    delete resources.siblings[resources.self.id];

    await DatabaseConnection.write(data);
  }

  private static checkExistence(
    database: Database,
    routineId: string,
    habitId?: string,
    subTaskId?: string,
  ): {
    siblings: Record<string, DTO>;
    self: DTO;
    children: Record<string, DTO>;
  } {
    const routine = database[routineId];

    if (!routine) {
      throw new StatefulError(
        404,
        `A routine with ID '${routineId}' was not found`,
      );
    } else if (!habitId) {
      return { siblings: database, self: routine, children: routine.habits };
    }

    const habit = routine.habits[habitId];

    if (!habit) {
      throw new StatefulError(
        404,
        `A habit with ID '${habitId}' was not found`,
      );
    } else if (!subTaskId) {
      return {
        siblings: routine.habits,
        self: habit,
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

    return { siblings: habit.subTasks, self: subTask, children: {} };
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
}
