import request from "supertest";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { app } from "./src/app.js";
import DatabaseConnection from "./src/database/connection.db.js";
import type { Database } from "./src/types/routines.types.js";

const routineId = "routine-test";
const habitId = "habit-test";

function createDatabase(): Database {
  return {
    [routineId]: {
      id: routineId,
      title: "Morning routine",
      habits: {
        [habitId]: {
          id: habitId,
          title: "Drink water",
          category: "Saúde",
          subTasks: {},
          completionDates: [],
        },
      },
      completionDates: [],
    },
  };
}

describe("routine routes", () => {
  let database: Database;

  beforeEach(() => {
    database = createDatabase();
    jest
      .spyOn(DatabaseConnection, "read")
      .mockImplementation(async () => database);
    jest
      .spyOn(DatabaseConnection, "write")
      .mockImplementation(async (nextDatabase) => {
        database = nextDatabase;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("GET / returns all routines", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(Object.values(database));
  });

  it("POST / creates a routine", async () => {
    const response = await request(app)
      .post("/")
      .send({
        title: "Evening routine",
        habits: [
          {
            title: "Read",
            category: "Estudos",
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("The routine was created successfully.");
    expect(response.body.data.title).toBe("Evening routine");
    expect(database[response.body.data.id]).toEqual(response.body.data);
  });

  it("PATCH /:routineId updates a routine title", async () => {
    const response = await request(app)
      .patch(`/${routineId}`)
      .send({ title: "Updated routine" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      `The routine with ID '${routineId}' was updated successfully`,
    );
    expect(database[routineId]?.title).toBe("Updated routine");
  });

  it("DELETE /:routineId deletes a routine", async () => {
    const response = await request(app).delete(`/${routineId}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      `The routine with ID '${routineId}' was deleted successfully`,
    );
    expect(database[routineId]).toBeUndefined();
  });

  it("POST /:routineId/habits creates a habit", async () => {
    const response = await request(app).post(`/${routineId}/habits`).send({
      title: "Stretch",
      category: "Pessoal",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      `The new habit was created successfully at routine with id '${routineId}'`,
    );
    expect(database[routineId]?.habits[response.body.data.id]).toEqual(
      response.body.data,
    );
  });
});
