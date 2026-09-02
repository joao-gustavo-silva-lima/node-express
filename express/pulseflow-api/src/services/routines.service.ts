import DatabaseConnection from "../database/connection.db.js";
import { Habit, Routine } from "../types/routines.types.js";

class RoutinesService {
  public static async createRoutine(title: string, habits: Habit[]) {
    if (new Set(habits).size !== habits.length) {
      throw new Error("Routine habits should be unique.");
    }

    const data = await DatabaseConnection.read();

    if (
      data.routines.some(
        (routine) => routine.title.toLowerCase() === title.toLowerCase(),
      )
    ) {
      throw new Error("Routine name cannot be duplicated.");
    }

    const newID = `routine-${crypto.randomUUID()}`;

    if (data.routines.some((routine) => routine.id === newID)) {
      throw new Error("Generated ID collided a pre-generated one.");
    }

    const newRoutine: Routine = {
      id: newID,
      title: title,
      habits: habits,
      completedDates: [],
    };

    data.routines = [...data.routines, newRoutine];

    DatabaseConnection.write(data);

    return newRoutine;
  }
}
