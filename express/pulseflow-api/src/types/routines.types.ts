import { z } from "zod";

const isoDateStringSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
    "A data deve estar no formato YYYY-MM-DD válido.",
  );

export const subTaskSchema = z.object({
  id: z.uuid("ID de sub-tarefa inválido."),
  title: z
    .string({ error: "O título da sub-tarefa é obrigatório." })
    .trim()
    .min(1, "O título da sub-tarefa não pode estar vazio.")
    .min(2, "A sub-tarefa deve ter pelo menos 2 caracteres.")
    .max(60, "A sub-tarefa deve ter no máximo 60 caracteres."),
  completedDates: z
    .array(isoDateStringSchema)
    .refine(
      (dates) => new Set(dates).size === dates.length,
      "O histórico de conclusões não pode conter datas duplicadas.",
    )
    .default([]),
});

export const habitSchema = z.object({
  id: z.uuid("ID de hábito inválido."),

  title: z
    .string({ error: "O título do hábito é obrigatório." })
    .trim()
    .min(1, "O título do hábito é obrigatório.")
    .min(3, "O título deve ter pelo menos 3 caracteres visíveis.")
    .max(50, "O título é muito longo (máximo de 50 caracteres)."),

  category: z
    .string({ error: "A categoria é obrigatória." })
    .trim()
    .min(1, "Selecione uma categoria válida.")
    .max(30, "A categoria deve ter no máximo 30 caracteres."),

  subTasks: z
    .array(subTaskSchema)
    .max(10, "Você pode adicionar no máximo 10 sub-tarefas por hábito.")
    .optional()
    .default([]),

  completedDates: z
    .array(isoDateStringSchema)
    .refine(
      (dates) => new Set(dates).size === dates.length,
      "O histórico de conclusões não pode conter datas duplicadas.",
    )
    .default([]),
});

export const routineSchema = z.object({
  id: z.uuid("ID de rotina inválido."),

  title: z
    .string({ error: "O título da rotina é obrigatório." })
    .trim()
    .min(1, "O título da rotina é obrigatório.")
    .min(3, "O título da rotina deve ter pelo menos 3 caracteres.")
    .max(40, "O título da rotina é muito longo (máximo de 40 caracteres)."),

  habits: z
    .array(habitSchema)
    .min(1, "A rotina deve conter pelo menos 1 hábito cadastrado.")
    .max(15, "Uma rotina pode conter no máximo 15 hábitos."),

  completedDates: z
    .array(isoDateStringSchema)
    .refine(
      (dates) => new Set(dates).size === dates.length,
      "O histórico de conclusões da rotina não pode conter datas duplicadas.",
    )
    .default([]),
});

export type SubTask = z.infer<typeof subTaskSchema>;
export type Habit = z.infer<typeof habitSchema>;
export type Routine = z.infer<typeof routineSchema>;

export interface Database {
  subtasks: SubTask[];
  habits: Habit[];
  routines: Routine[];
}
