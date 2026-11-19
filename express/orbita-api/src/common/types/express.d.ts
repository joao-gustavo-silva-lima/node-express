declare global {
  namespace Express {
    interface Request {
      authUsername?: string;
    }
  }
}

export {};
