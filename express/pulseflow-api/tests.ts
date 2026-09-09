import request from "supertest";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { app } from "./src/app.js";

const databasePath = path.join(
  import.meta.dirname,
  "src/database/routines.db.json",
);

const routineId = "routine-test";
const habitId = "habit-test";
const subTaskId = "sub-task-test";

const initialDatabase = {
  [routineId]: {
    id: routineId,
    title: "Rotina de Teste",
    habits: {
      [habitId]: {
        id: habitId,
        title: "Ler um livro",
        category: "Studies",
        subTasks: {
          [subTaskId]: {
            id: subTaskId,
            title: "Ler dez paginas",
            completionDates: [],
          },
        },
        completionDates: [],
      },
    },
    completionDates: [],
  },
};

async function resetDatabase() {
  await writeFile(databasePath, JSON.stringify(initialDatabase, null, 2));
}

describe("routine routes", () => {
  let originalDatabase: string;

  beforeAll(async () => {
    originalDatabase = await readFile(databasePath, "utf-8");
  });

  beforeEach(resetDatabase);

  afterAll(async () => {
    await writeFile(databasePath, originalDatabase);
  });

  describe("successful requests", () => {
    it("creates a routine, habit and sub-task", async () => {
      const routineResponse = await request(app)
        .post("/")
        .send({
          id: "routine-created",
          title: "Rotina Nova",
          habits: [
            {
              id: "habit-created",
              title: "Estudar TypeScript",
              category: "Studies",
            },
          ],
        });

      expect(routineResponse.status).toBe(201);
      expect(routineResponse.body.data).toMatchObject({
        id: "routine-created",
        title: "Rotina Nova",
      });

      const habitResponse = await request(app)
        .post("/routine-created/habits")
        .send({
          id: "habit-created-2",
          title: "Praticar exercicios",
          category: "Health",
        });

      expect(habitResponse.status).toBe(201);
      expect(habitResponse.body.data).toMatchObject({
        id: "habit-created-2",
        title: "Praticar exercicios",
      });

      const subTaskResponse = await request(app)
        .post("/routine-created/habits/habit-created-2/sub-tasks")
        .send({ title: "Fazer alongamento" });

      expect(subTaskResponse.status).toBe(201);
      expect(subTaskResponse.body.data).toMatchObject({
        title: "Fazer alongamento",
      });
      expect(subTaskResponse.body.data.id).toMatch(/^sub-task-/);
    });

    it("reads collections and individual resources", async () => {
      await expect(request(app).get("/")).resolves.toMatchObject({
        status: 200,
      });
      await expect(request(app).get(`/${routineId}`)).resolves.toMatchObject({
        status: 200,
      });
      await expect(
        request(app).get(`/${routineId}/habits`),
      ).resolves.toMatchObject({ status: 200 });
      await expect(
        request(app).get(`/${routineId}/habits/${habitId}/sub-tasks`),
      ).resolves.toMatchObject({ status: 200 });

      const response = await request(app).get(
        `/${routineId}/habits/${habitId}/sub-tasks/${subTaskId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: subTaskId,
        title: "Ler dez paginas",
      });
    });

    it("updates and deletes a resource", async () => {
      const updateResponse = await request(app)
        .patch(`/${routineId}/habits/${habitId}`)
        .send({ title: "Ler todos os dias" });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.title).toBe("Ler todos os dias");

      const deleteResponse = await request(app).delete(
        `/${routineId}/habits/${habitId}/sub-tasks/${subTaskId}`,
      );

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toContain("deleted successfully");
    });
  });

  describe("payload contracts and validations", () => {
    it.each([
      ["missing title", { category: "Studies" }],
      ["short title", { title: "ab", category: "Studies" }],
      ["invalid category", { title: "Estudar", category: "Invalid" }],
      [
        "invalid completion date",
        {
          title: "Estudar",
          category: "Studies",
          completionDates: ["2024/02/30"],
        },
      ],
    ])(
      "rejects a habit with %s",
      async (_caseName: string, payload: Record<string, unknown>) => {
        const response = await request(app)
          .post(`/${routineId}/habits`)
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("The payload format is not valid");
        expect(response.body.errors).toBeDefined();
      },
    );

    it("rejects missing JSON content type", async () => {
      const response = await request(app)
        .post(`/${routineId}/habits`)
        .set("content-type", "text/plain")
        .send("not json");

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("content-type");
    });

    it("rejects duplicate completion dates and duplicate nested titles", async () => {
      const duplicateDates = await request(app)
        .post("/")
        .send({
          title: "Rotina com datas",
          habits: [
            {
              title: "Estudar",
              category: "Studies",
              completionDates: ["2026-01-01", "2026-01-01"],
            },
          ],
        });
      expect(duplicateDates.status).toBe(400);

      const duplicateSubTasks = await request(app)
        .post(`/${routineId}/habits`)
        .send({
          title: "Novo habito",
          category: "Health",
          subTasks: [{ title: "Alongar" }, { title: "Alongar" }],
        });
      expect(duplicateSubTasks.status).toBe(400);
    });

    it.each([
      ["routine", "/", { title: "ab", habits: [] }],
      ["habit", `/${routineId}/habits`, { title: "ab", category: "Health" }],
      ["sub-task", `/${routineId}/habits/${habitId}/sub-tasks`, { title: "a" }],
    ])(
      "rejects an invalid %s payload",
      async (
        _resource: string,
        route: string,
        payload: Record<string, unknown>,
      ) => {
        const response = await request(app).post(route).send(payload);

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      },
    );

    it("rejects invalid update payloads", async () => {
      const response = await request(app)
        .patch(`/${routineId}`)
        .send({ title: "ab" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("The payload format is not valid");
    });
  });

  describe("resource validations", () => {
    it("returns 404 for unknown resources", async () => {
      const response = await request(app).get("/routine-missing");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("was not found");
    });

    it("returns 409 for duplicate IDs and titles", async () => {
      const duplicateId = await request(app)
        .post("/")
        .send({
          id: routineId,
          title: "Outra rotina",
          habits: [{ title: "Novo habito", category: "Health" }],
        });
      expect(duplicateId.status).toBe(409);

      const duplicateTitle = await request(app)
        .post("/")
        .send({
          title: " rotina de TESTE ",
          habits: [{ title: "Novo habito", category: "Health" }],
        });
      expect(duplicateTitle.status).toBe(409);
    });
  });
});
