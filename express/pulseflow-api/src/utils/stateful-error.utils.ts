export class StatefulError extends Error {
  public constructor(
    public readonly status?: number,
    message?: string | undefined,
    public readonly appendix?: { [k: string]: unknown },
    options?: ErrorOptions | undefined,
  ) {
    super(message, options);
  }
}
