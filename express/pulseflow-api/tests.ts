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
const secondRoutineId = "routine-second";
const secondHabitId = "habit-second";

function createDatabase(): Database {
  return {
    [routineId]: {
      id: routineId,
      title: "Morning routine",
      habits: {
        [habitId]: {
          id: habitId,
          title: "Drink water",
          category: "Health",
          subTasks: {},
          completionDates: [],
        },
      },
      completionDates: [],
    },
  };
}

function expectPayloadError(
  response: { status: number; body: Record<string, any> },
  field: string,
  message?: string,
) {
  expect(response.status).toBe(400);
  expect(response.body.message).toBe("The payload format is not valid");
  expect(response.body.errors[field]).toBeDefined();

  if (message) {
    expect(response.body.errors[field]).toBe(message);
  }
}

function createHabitPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Stretch",
    category: "Personal",
    ...overrides,
  };
}

function createRoutinePayload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Evening routine",
    habits: [createHabitPayload({ title: "Read" })],
    ...overrides,
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

  describe("successful requests", () => {
    it("GET / returns all routines", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(Object.values(database));
    });

    it("POST / creates a routine with generated resource IDs", async () => {
      const response = await request(app)
        .post("/")
        .send(createRoutinePayload());

      expect(response.status).toBe(201);
      expect(response.body.message).toBe(
        "The routine was created successfully.",
      );
      expect(response.body.data.id).toMatch(/^routine-/);
      expect(Object.values(response.body.data.habits)).toEqual([
        expect.objectContaining({ id: expect.stringMatching(/^habit-/) }),
      ]);
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
      const response = await request(app)
        .post(`/${routineId}/habits`)
        .send(createHabitPayload());

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        `The new habit was created successfully at routine with id '${routineId}'`,
      );
      expect(database[routineId]?.habits[response.body.data.id]).toEqual(
        response.body.data,
      );
    });
  });

  describe("request and type contract validation", () => {
    it("rejects a request without application/json", async () => {
      const response = await request(app)
        .post("/")
        .set("content-type", "text/plain")
        .send(JSON.stringify(createRoutinePayload()));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message:
          "The 'content-type: application/json' request header was expected",
      });
    });

    it.each([
      ["missing title", {}, "title", "The routine title is required."],
      [
        "short title",
        { title: "ab" },
        "title",
        "The routine title must be at least 3 characters long.",
      ],
      [
        "non-array habits",
        { habits: {} },
        "habits",
        "A routine's habits must be contained in an array.",
      ],
      [
        "empty habits",
        { habits: [] },
        "habits",
        "A routine must contain at least 1 registered habit.",
      ],
      [
        "invalid completion date",
        { completionDates: ["2026-13-01"] },
        "completionDates__0",
        "A data deve estar no formato YYYY-MM-DD válido.",
      ],
      [
        "duplicate completion date",
        { completionDates: ["2026-01-01", "2026-01-01"] },
        "completionDates",
        "The completion history cannot contain duplicate dates.",
      ],
    ])(
      "rejects an invalid routine: %s",
      async (_case, payload, field, message) => {
        const requestPayload: Record<string, unknown> =
          createRoutinePayload(payload);
        if (_case === "missing title") {
          delete requestPayload.title;
        }

        const response = await request(app).post("/").send(requestPayload);

        expectPayloadError(response, field, message);
      },
    );

    it.each([
      ["missing title", {}, "title", "The habit title is required."],
      [
        "short title",
        { title: "ab" },
        "title",
        "The title must be at least 3 visible characters long.",
      ],
      [
        "invalid category",
        { category: "Lazer" },
        "category",
        "The habit category is invalid",
      ],
      [
        "non-array sub-tasks",
        { subTasks: {} },
        "subTasks",
        "A habit's sub-tasks must be contained in an array",
      ],
      [
        "invalid completion date",
        { completionDates: ["yesterday"] },
        "completionDates__0",
        "A data deve estar no formato YYYY-MM-DD válido.",
      ],
      [
        "duplicate completion date",
        { completionDates: ["2026-01-01", "2026-01-01"] },
        "completionDates",
        "The completion history cannot contain duplicate dates.",
      ],
    ])(
      "rejects an invalid habit: %s",
      async (_case, payload, field, message) => {
        const requestPayload: Record<string, unknown> =
          createHabitPayload(payload);
        if (_case === "missing title") {
          delete requestPayload.title;
        }

        const response = await request(app)
          .post(`/${routineId}/habits`)
          .send(requestPayload);

        expectPayloadError(response, field, message);
      },
    );

    it("rejects a routine containing duplicate habits", async () => {
      const response = await request(app)
        .post("/")
        .send(
          createRoutinePayload({
            habits: [
              createHabitPayload({ title: "Read" }),
              createHabitPayload({ title: "Read" }),
            ],
          }),
        );

      expectPayloadError(
        response,
        "habits",
        "A routine cannot contain duplicate habits.",
      );
    });

    it("rejects a habit containing duplicate sub-tasks", async () => {
      const response = await request(app)
        .post(`/${routineId}/habits`)
        .send(
          createHabitPayload({
            subTasks: [{ title: "First task" }, { title: " First task " }],
          }),
        );

      expectPayloadError(
        response,
        "subTasks",
        "A habit cannot contain duplicate sub-tasks.",
      );
    });

    it("rejects an invalid sub-task contract", async () => {
      const response = await request(app)
        .post(`/${routineId}/habits`)
        .send(createHabitPayload({ subTasks: [{ title: "x" }] }));

      expectPayloadError(
        response,
        "subTasks__0__title",
        "The sub-task must be at least 2 characters long.",
      );
    });

    it("rejects a patch without a valid title", async () => {
      const response = await request(app)
        .patch(`/${routineId}`)
        .send({ title: "ab" });

      expectPayloadError(
        response,
        "title",
        "The routine title must be at least 3 characters long.",
      );
    });
  });

  describe("service business rules", () => {
    it("rejects a routine with an ID already in use", async () => {
      const response = await request(app)
        .post("/")
        .send(createRoutinePayload({ id: routineId }));

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: "IDs have to be unique" });
    });

    it("rejects routine titles that differ only by case or whitespace", async () => {
      const response = await request(app)
        .post("/")
        .send(createRoutinePayload({ title: "  MORNING ROUTINE  " }));

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: "Titles have to be unique" });
    });

    it("rejects a duplicate habit ID and title within a routine", async () => {
      const duplicateIdResponse = await request(app)
        .post(`/${routineId}/habits`)
        .send(createHabitPayload({ id: habitId }));

      expect(duplicateIdResponse.status).toBe(409);
      expect(duplicateIdResponse.body).toEqual({
        message: "IDs have to be unique",
      });

      const duplicateTitleResponse = await request(app)
        .post(`/${routineId}/habits`)
        .send(createHabitPayload({ title: " drink WATER " }));

      expect(duplicateTitleResponse.status).toBe(409);
      expect(duplicateTitleResponse.body).toEqual({
        message: "Titles have to be unique",
      });
    });

    it.each([
      [
        "POST /:routineId/habits",
        (id: string) =>
          request(app).post(`/${id}/habits`).send(createHabitPayload()),
      ],
      [
        "PATCH /:routineId",
        (id: string) => request(app).patch(`/${id}`).send({ title: "Updated" }),
      ],
      ["DELETE /:routineId", (id: string) => request(app).delete(`/${id}`)],
    ])(
      "returns 404 when %s targets an unknown routine",
      async (_route, makeRequest) => {
        const response = await makeRequest("missing-routine");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
          message: "A routine with ID 'missing-routine' was not found",
        });
      },
    );

    it("rejects a patch that duplicates another routine title", async () => {
      database[secondRoutineId] = {
        id: secondRoutineId,
        title: "Second routine",
        habits: {
          [secondHabitId]: {
            id: secondHabitId,
            title: "Write",
            category: "Studies",
            subTasks: {},
            completionDates: [],
          },
        },
        completionDates: [],
      };

      const response = await request(app)
        .patch(`/${routineId}`)
        .send({ title: " second ROUTINE " });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: "Titles have to be unique" });
    });
  });
});
