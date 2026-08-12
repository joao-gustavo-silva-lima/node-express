export class StatefulError extends Error {
  public constructor(
    public readonly status?: number,
    message?: string | undefined,
    options?: ErrorOptions | undefined,
  ) {
    super(message, options);
  }
}
