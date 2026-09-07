import DatabaseConnection from "../database/connection.db.js";
import { Database, Habit, Routine, SubTask } from "../types/routines.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

export default class RoutinesService {
  public static async readRoutines() {
    const data = await DatabaseConnection.read();

    return Object.values(data);
  }

  public static async deleteRoutineById(routineId: string) {
    const data = await DatabaseConnection.read();

    this.checkExistence(data, routineId);

    delete data[routineId];

    await DatabaseConnection.write(data);
  }

  public static async create(
    DTO: Routine | Habit | SubTask,
    routineId?: string,
    habitId?: string,
  ) {
    const data = await DatabaseConnection.read();

    if (routineId === undefined) {
      this.checkIDAvailability("routine", DTO.id, data);
      this.checkTitleAvailability("routine", DTO.title, data);

      data[DTO.id] = DTO as Routine;
    } else if (habitId === undefined) {
      const routine = this.checkExistence(data, routineId) as Routine;

      this.checkIDAvailability("habit", DTO.id, routine.habits);
      this.checkTitleAvailability("habit", DTO.title, routine.habits);

      routine.habits[DTO.id] = DTO as Habit;
    } else {
      const habit = this.checkExistence(data, routineId, habitId) as Habit;

      this.checkIDAvailability("sub-task", DTO.id, habit.subTasks);
      this.checkTitleAvailability("sub-task", DTO.title, habit.subTasks);

      habit.subTasks[DTO.id] = DTO as SubTask;
    }

    await DatabaseConnection.write(data);

    return DTO;
  }

  public static async patch(
    DTO: { title: string },
    routineId: string,
    habitId?: string,
    subTaskId?: string,
  ) {
    const data = await DatabaseConnection.read();
    const patchingProperty = this.checkExistence(
      data,
      routineId,
      habitId,
      subTaskId,
    );

    patchingProperty.title = DTO.title;

    await DatabaseConnection.write(data);

    return patchingProperty;
  }

  private static checkExistence(
    checkingResources: Database,
    routineId: string,
    habitId?: string,
    subTaskId?: string,
  ) {
    const routine =
      checkingResources[routineId] ||
      (() => {
        throw new StatefulError(
          404,
          `A routine with ID '${routineId}' was not found`,
        );
      })();

    if (!habitId) return routine;

    const habit =
      routine.habits[habitId] ||
      (() => {
        throw new StatefulError(
          404,
          `A habit with ID '${habitId}' was not found`,
        );
      })();

    if (!subTaskId) return habit;

    const subtask =
      habit.subTasks[subTaskId] ||
      (() => {
        throw new StatefulError(
          404,
          `A subtask with ID '${subTaskId}' was not found`,
        );
      })();

    return subtask;
  }

  private static checkIDAvailability<T extends Routine | Habit | SubTask>(
    DTOType: string,
    id: string,
    checkingResources: Record<string, T>,
  ) {
    if (checkingResources[id] !== undefined) {
      throw new StatefulError(409, `A ${DTOType}'s ID has to be unique`);
    }
  }

  private static checkTitleAvailability<T extends Routine | Habit | SubTask>(
    DTOType: string,
    title: string,
    checkingResources: Record<string, T>,
  ) {
    if (
      Object.values(checkingResources).some(
        (element) =>
          element.title.trim().toLowerCase() === title.trim().toLowerCase(),
      )
    ) {
      throw new StatefulError(409, `${DTOType}s cannot have duplicate titles`);
    }
  }
}
