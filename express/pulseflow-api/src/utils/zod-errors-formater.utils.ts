import { $ZodIssue } from "zod/v4/core";

export default function formatZodErrors(issues: $ZodIssue[]) {
  return issues.reduce(
    (acc, issue) => ({
      ...acc,
      [issue.path.join(".") || "unknown-field"]: issue.message,
    }),
    {},
  );
}
