import { z } from "zod";

export const PREDEFINED_CATEGORIES = [
  "Saúde",
  "Estudos",
  "Trabalho",
  "Finanças",
  "Pessoal",
  "Produtividade",
] as const;

const isoDateStringSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
    "A data deve estar no formato YYYY-MM-DD válido.",
  );

export const subTaskSchema = z.object({
  id: z
    .string("Invalid sub-task ID.")
    .optional()
    .default(`sub-task-${crypto.randomUUID()}`),
  title: z
    .string({ error: "The sub-task title is required." })
    .trim()
    .min(1, "The sub-task title cannot be empty.")
    .min(2, "The sub-task must be at least 2 characters long.")
    .max(60, "The sub-task must be at most 60 characters long."),
  completionDates: z
    .array(isoDateStringSchema, {
      error: "A sub-task completion dates must be contained in an array",
    })
    .optional()
    .transform((array) => array ?? [])
    .refine(
      (dates) => new Set(dates).size === dates.length,
      "The completion history cannot contain duplicate dates.",
    ),
});

export const habitSchema = z.object({
  id: z
    .string("Invalid habit ID.")
    .optional()
    .default(`habit-${crypto.randomUUID()}`),

  title: z
    .string({ error: "The habit title is required." })
    .trim()
    .min(1, "The habit title is required.")
    .min(3, "The title must be at least 3 visible characters long.")
    .max(50, "The title is too long (maximum 50 characters)."),

  category: z.enum(PREDEFINED_CATEGORIES, {
    error: "The habit category is invalid",
  }),

  subTasks: z
    .record(z.string(), subTaskSchema, {
      error: "A habit's sub-tasks must be contained in a record",
    })
    .refine(
      (subTasks) => Object.keys(subTasks).length <= 10,
      "You can add at most 10 sub-tasks per habit.",
    )
    .refine(
      (subtasks) =>
        new Set(Object.values(subtasks).map((subtask) => subtask.title))
          .size ===
        Object.values(subtasks).map((subtask) => subtask.title).length,
      "A habit cannot contain duplicate sub-tasks.",
    )
    .optional()
    .default({}),

  completionDates: z
    .array(isoDateStringSchema, {
      error: "A habit's completion dates must be contained in an array",
    })
    .optional()
    .transform((array) => array ?? [])
    .refine(
      (dates) => new Set(dates).size === dates.length,
      "The completion history cannot contain duplicate dates.",
    ),
});

export const routineSchema = z.object({
  id: z
    .string("Invalid routine ID.")
    .optional()
    .default(`routine-${crypto.randomUUID()}`),

  title: z
    .string({ error: "The routine title is required." })
    .trim()
    .min(1, "The routine title  is required.")
    .min(3, "The routine title must be at least 3 characters long.")
    .max(40, "The routine title is too long (maximum 40 characters)."),

  habits: z
    .record(z.string(), habitSchema, {
      error: "A routine's habits must be contained in a record.",
    })
    .refine(
      (habits) => Object.keys(habits).length > 0,
      "A routine must contain at least 1 registered habit.",
    )
    .refine(
      (habits) =>
        new Set(Object.values(habits).map((habit) => habit.title)).size ===
        Object.values(habits).map((habit) => habit.title).length,
      "A routine cannot contain duplicate habits.",
    )
    .refine(
      (habits) => Object.keys(habits).length <= 15,
      "A routine can contain at most 15 habits.",
    ),

  completionDates: z
    .array(isoDateStringSchema, {
      error: "A routine's completion dates must be contained in an array",
    })
    .optional()
    .transform((array) => array ?? [])
    .refine(
      (dates) => new Set(dates).size === dates.length,
      "The completion history cannot contain duplicate dates.",
    ),
});

export type SubTask = z.infer<typeof subTaskSchema>;
export type Habit = z.infer<typeof habitSchema>;
export type Routine = z.infer<typeof routineSchema>;

export interface Database {
  [k: string]: Routine;
}
