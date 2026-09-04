import DatabaseConnection from "../database/connection.db.js";
import { Routine } from "../types/routines.types.js";

class RoutinesService {
  public static async createRoutine(routineDTO: Routine) {
    const data = await DatabaseConnection.read();

    data[routineDTO.id] = routineDTO;

    await DatabaseConnection.write(data);
  }
}
