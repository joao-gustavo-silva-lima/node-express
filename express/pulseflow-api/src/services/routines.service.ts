import DatabaseConnection from "../database/connection.db.js";
import { Routine } from "../types/routines.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

export default class RoutinesService {
  public static async readRoutines() {
    const data = await DatabaseConnection.read();

    return Object.values(data);
  }

  public static async createRoutine(routineDTO: Routine) {
    const data = await DatabaseConnection.read();

    if (
      Object.values(data).some(
        (routine) =>
          routine.title.trim().toLowerCase() ===
          routineDTO.title.trim().toLowerCase(),
      )
    ) {
      throw new StatefulError(409, "Routines cannot have duplicate titles.");
    }

    data[routineDTO.id] = routineDTO;

    await DatabaseConnection.write(data);

    return routineDTO;
  }
}
