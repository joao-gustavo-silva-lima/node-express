import { pool } from "../database/database.db.js";
import type { User } from "../types/User.types.js";

export default class UsersService {
  public static async register(userDTO: User) {
    const query = `INSERT INTO users (id, name, email, created_at) \
    VALUES ($1,$2,$3,$4)`;

    const result = await pool.query(query, [
      userDTO.id,
      userDTO.name,
      userDTO.email,
      userDTO.createdAt,
    ]);

    return result;
  }
}
