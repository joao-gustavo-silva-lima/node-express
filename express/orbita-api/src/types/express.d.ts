declare global {
  namespace Express {
    interface Request {
      authenticatedUsername?: string;
    }
  }
}

export {};
