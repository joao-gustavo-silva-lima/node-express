import { Database } from "../types/routines.types.js";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DB_ADDRESS = path.join(
  import.meta.dirname,
  "../database/routines.db.json",
);

export default class DatabaseConnection {
  public static async read() {
    return readFile(DB_ADDRESS, {
      encoding: "utf-8",
    })
      .then((strDatabase) => JSON.parse(strDatabase) as Database)
      .catch((error) => {
        console.error(error);
        throw new Error("Database connection failed.");
      });
  }

  public static async write(writeContent: Database) {
    return writeFile(DB_ADDRESS, JSON.stringify(writeContent, null, 2)).catch(
      (error) => {
        console.error(error);
        throw new Error(
          "Database writing failed. Connection ended with no writing",
        );
      },
    );
  }
}
