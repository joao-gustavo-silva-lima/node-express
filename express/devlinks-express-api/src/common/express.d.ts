import { Query } from "../link/link.types.ts";

declare global {
  namespace Express {
    interface Request {
      validQuery: Query;
    }
  }
}

export {};
