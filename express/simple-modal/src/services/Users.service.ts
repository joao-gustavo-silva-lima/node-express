import { DatabaseError } from "pg";
import bcrypt from "bcrypt";
import { pool } from "../database/database.db.js";
import type { User } from "../types/User.types.js";

export async function registerUserService(userDTO: User) {
  try {
    const query = `
      INSERT INTO users (id, name, email, created_at, password_hash) 
      VALUES ($1,$2,$3,$4,$5)
    `;

    const passwordHash = await bcrypt.hash(userDTO.password, 10);

    await pool.query(query, [
      userDTO.id,
      userDTO.name,
      userDTO.email,
      userDTO.createdAt,
      passwordHash,
    ]);
  } catch (error: unknown) {
    if (error instanceof DatabaseError) {
      console.log(error);
    }

    throw error;
  }
}
