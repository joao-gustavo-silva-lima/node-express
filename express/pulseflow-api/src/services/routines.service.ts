import DatabaseConnection from "../database/connection.db.js";
import { Habit, Routine, SubTask } from "../types/routines.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

export default class RoutinesService {
  public static async readRoutines() {
    const data = await DatabaseConnection.read();

    return Object.values(data);
  }

  public static async updateRoutineById(routineId: string, newTitle: string) {
    const data = await DatabaseConnection.read();
    const routine = this.checkExistence("routine", routineId, data) as Routine;

    this.checkTitleAvailability("habit", newTitle, routine.habits);

    routine.title = newTitle;

    await DatabaseConnection.write(data);
  }

  public static async deleteRoutineById(routineId: string) {
    const data = await DatabaseConnection.read();

    this.checkExistence("routine", routineId, data);

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
      const routine = this.checkExistence(
        "routine",
        routineId,
        data,
      )! as Routine;

      this.checkIDAvailability("habit", DTO.id, routine.habits);
      this.checkTitleAvailability("habit", DTO.title, routine.habits);

      routine.habits[DTO.id] = DTO as Habit;
    } else {
      const routine = this.checkExistence(
        "routine",
        routineId,
        data,
      )! as Routine;
      const habit = this.checkExistence(
        "habit",
        habitId,
        routine.habits,
      )! as Habit;

      this.checkIDAvailability("sub-task", DTO.id, habit.subTasks);
      this.checkTitleAvailability("sub-task", DTO.title, habit.subTasks);

      habit.subTasks[DTO.id] = DTO as SubTask;
    }

    await DatabaseConnection.write(data);

    return DTO;
  }

  private static checkExistence(
    DTOType: string,
    id: string,
    checkingResources: Record<string, unknown>,
  ) {
    if (checkingResources[id] === undefined) {
      throw new StatefulError(
        404,
        `A ${DTOType} with ID '${id}' was not found`,
      );
    }

    return checkingResources[id]!;
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
