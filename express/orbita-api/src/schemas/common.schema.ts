import * as z from "zod";

export const uuidSchema = z.uuid({
  error: "INVALID_UUID",
});

export const timestampSchema = z.iso.datetime({
  offset: true,
  error: "INVALID_TIMESTAMP",
});
