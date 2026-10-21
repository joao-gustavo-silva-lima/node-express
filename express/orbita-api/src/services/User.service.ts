import db from "../database/db";
import { UserInput } from "../schemas/User.schema";

export async function createUser(userInput: UserInput) {
  await db.orm.public.User.create(userInput);
}
