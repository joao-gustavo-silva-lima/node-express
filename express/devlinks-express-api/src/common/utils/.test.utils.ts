import { Query } from "../../link/link.types";

export function getThrownError(fn: () => void) {
  try {
    fn();
  } catch (error) {
    return error;
  }

  throw "The test expected the tested function to throw, but nothing was thrown.";
}

export function stringfyQuery(query: Query) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "string") {
      params.append(key, value);
      return;
    }

    value.forEach((str) => params.append(key, str));
  });

  return params.toString();
}
