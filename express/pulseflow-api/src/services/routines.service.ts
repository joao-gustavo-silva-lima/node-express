import DatabaseConnection from "../database/connection.db.js";
import { Database, Habit, Routine } from "../types/routines.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

export default class RoutinesService {
  public static async readRoutines() {
    const data = await DatabaseConnection.read();

    return Object.values(data);
  }

  public static async createRoutine(routineDTO: Routine) {
    const data = await DatabaseConnection.read();

    this.checkRoutineUniqueness(routineDTO, data);

    data[routineDTO.id] = routineDTO;

    await DatabaseConnection.write(data);

    return routineDTO;
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

  public static async createHabitByRoutineId(
    routineId: string,
    habitDTO: Habit,
  ) {
    const data = await DatabaseConnection.read();

    this.checkRoutineExistence(routineId, data);

    const habits = Object.values(data[routineId]!.habits);

    if (
      habits.some(
        (habit) =>
          habit.title.trim().toLowerCase() ===
          habitDTO.title.trim().toLowerCase(),
      )
    ) {
      throw new StatefulError(
        409,
        `A routine must not contain duplicate habits`,
      );
    }

    data[routineId]!.habits[habitDTO.id] = habitDTO;

    await DatabaseConnection.write(data);

    return habitDTO;
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
