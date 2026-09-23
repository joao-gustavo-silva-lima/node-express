import { z } from "zod";

export const PREDEFINED_CATEGORIES = [
  "Health",
  "Studies",
  "Work",
  "Finance",
  "Personal",
  "Productivity",
] as const;

const isoDateStringSchema = z
  .string("INVALID_DATE_TYPE")
  .trim()
  .regex(
    /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
    "INVALID_DATE_FORMAT",
  );

export const toggleDateSchema = z.object({
  date: isoDateStringSchema,
});

export const subTaskSchema = z.object({
  id: z
    .string("INVALID_SUB-TASK_ID")
    .optional()
    .default(() => `sub-task-${crypto.randomUUID()}`),
  title: z
    .string({ error: "SUB-TASK_TITLE_REQUIRED" })
    .trim()
    .min(1, "SUB-TASK_TITLE_EMPTY")
    .min(2, "SUB-TASK_TITLE_TOO_SHORT")
    .max(60, "SUB-TASK_TITLE_TOO_LONG"),
  completionDates: z
    .array(isoDateStringSchema, {
      error: "INVALID_SUB-TASK_COMPLETION_DATES",
    })
    .optional()
    .default(() => [])
    .refine(
      (dates) => new Set(dates).size === dates.length,
      "DUPLICATE_SUB-TASK_COMPLETION_DATE",
    ),
});

export const habitSchema = z.object({
  id: z
    .string("INVALID_HABIT_ID")
    .optional()
    .default(() => `habit-${crypto.randomUUID()}`),

  title: z
    .string({ error: "HABIT_TITLE_REQUIRED" })
    .trim()
    .min(1, "HABIT_TITLE_EMPTY")
    .min(3, "HABIT_TITLE_TOO_SHORT")
    .max(50, "HABIT_TITLE_TOO_LONG"),

  category: z.enum(PREDEFINED_CATEGORIES, {
    error: "INVALID_HABIT_CATEGORY",
  }),

  subTasks: z
    .array(subTaskSchema, {
      error: "INVALID_HABIT_SUB-TASKS",
    })
    .refine(
      (subTasks) => subTasks.length <= 10,
      "HABIT_SUB-TASK_LIMIT_EXCEEDED",
    )
    .refine(
      (subtasks) =>
        new Set(subtasks.map((subtask) => subtask.title)).size ===
        subtasks.map((subtask) => subtask.title).length,
      "DUPLICATE_HABIT_SUB-TASK_TITLE",
    )
    .optional()
    .default([]),

  completionDates: z
    .array(isoDateStringSchema, {
      error: "INVALID_HABIT_COMPLETION_DATES",
    })
    .optional()
    .default(() => [])
    .refine(
      (dates) => new Set(dates).size === dates.length,
      "DUPLICATE_HABIT_COMPLETION_DATE",
    ),
});

export const habitChildrenSchema = habitSchema.pick({ subTasks: true });

export const routineSchema = z.object({
  id: z
    .string("INVALID_ROUTINE_ID")
    .optional()
    .default(() => `routine-${crypto.randomUUID()}`),

  title: z
    .string({ error: "ROUTINE_TITLE_REQUIRED" })
    .trim()
    .min(1, "ROUTINE_TITLE_EMPTY")
    .min(3, "ROUTINE_TITLE_TOO_SHORT")
    .max(40, "ROUTINE_TITLE_TOO_LONG"),

  habits: z
    .array(habitSchema, {
      error: "INVALID_ROUTINE_HABITS",
    })
    .refine((habits) => habits.length > 0, "ROUTINE_HABIT_REQUIRED")
    .refine((habits) => habits.length <= 15, "ROUTINE_HABIT_LIMIT_EXCEEDED")
    .refine(
      (habits) =>
        new Set(habits.map((habit) => habit.title)).size ===
        habits.map((habit) => habit.title).length,
      "DUPLICATE_ROUTINE_HABIT_TITLE",
    ),

  completionDates: z
    .array(isoDateStringSchema, {
      error: "INVALID_ROUTINE_COMPLETION_DATES",
    })
    .optional()
    .default(() => [])
    .refine(
      (dates) => new Set(dates).size === dates.length,
      "DUPLICATE_ROUTINE_COMPLETION_DATE",
    ),
});

export const routineChildrenSchema = routineSchema.pick({ habits: true });

export type SubTask = z.infer<typeof subTaskSchema>;
export type Habit = z.infer<typeof habitSchema>;
export type Routine = z.infer<typeof routineSchema>;
export type DTO = Routine | Habit | SubTask;
export type Category = (typeof PREDEFINED_CATEGORIES)[number];

export type Database = Routine[];
