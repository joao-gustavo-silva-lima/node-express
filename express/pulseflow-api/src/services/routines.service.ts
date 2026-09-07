import DatabaseConnection from "../database/connection.db.js";
import { Database, Habit, Routine, SubTask } from "../types/routines.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

export default class RoutinesService {
  public static async readRoutines() {
    const data = await DatabaseConnection.read();

    return Object.values(data);
  }

  public static async updateRoutineById(routineId: string, newTitle: string) {
    const data = await DatabaseConnection.read();

    this.checkRoutineExistence(routineId, data);
    this.checkRoutineUniqueness({ id: routineId, title: newTitle }, data);

    data[routineId]!.title = newTitle;

    await DatabaseConnection.write(data);
  }

  public static async deleteRoutineById(routineId: string) {
    const data = await DatabaseConnection.read();

    this.checkRoutineExistence(routineId, data);

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
      this.checkIDAvailability(DTO, data);
      this.checkTitleAvailability(DTO, data);

      data[DTO.id] = DTO as Routine;
    } else if (habitId === undefined) {
      const routine = this.checkExistence(
        "routine",
        routineId,
        data,
      )! as Routine;

      this.checkIDAvailability(DTO, routine.habits);
      this.checkTitleAvailability(DTO, routine.habits);

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

      this.checkIDAvailability(DTO, habit.subTasks);
      this.checkTitleAvailability(DTO, habit.subTasks);

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
    DTO: T,
    checkingResources: Record<string, T>,
  ) {
    if (checkingResources[DTO.id] !== undefined) {
      throw new StatefulError(
        409,
        `A ${this.getDTOType(DTO).toLowerCase()}'s ID has to be unique`,
      );
    }
  }

  private static checkTitleAvailability<T extends Routine | Habit | SubTask>(
    DTO: T,
    checkingResources: Record<string, T>,
  ) {
    if (
      Object.values(checkingResources).some(
        (element) =>
          element.title.trim().toLowerCase() === DTO.title.trim().toLowerCase(),
      )
    ) {
      throw new StatefulError(
        409,
        `${this.getDTOType(DTO)}s cannot have duplicate titles`,
      );
    }
  }

  private static getDTOType(DTO: Routine | Habit | SubTask) {
    if (Object.hasOwn(DTO, "habits")) {
      return "Routine";
    }

    if (Object.hasOwn(DTO, "subTasks")) {
      return "Habit";
    }

    return "Sub-task";
  }

  private static checkRoutineExistence(routineId: string, data: Database) {
    if (data[routineId] === undefined) {
      throw new StatefulError(
        404,
        `A routine with ID '${routineId}' was not found`,
      );
    }
  }

  private static checkRoutineUniqueness(
    routineDTO: Partial<Routine>,
    data: Database,
  ) {
    const isTitleUnique = !Object.values(data).some(
      (routine) =>
        (routineDTO.id ? routine.id !== routineDTO.id : true) &&
        routine.title.trim().toLowerCase() ===
          routineDTO.title?.trim().toLowerCase(),
    );

    if (!isTitleUnique) {
      throw new StatefulError(409, "Routines cannot have duplicate titles.");
    }
  }
}
