export default class HttpError extends Error {
  public status: number;
  public code: string;

  public constructor(
    status: number,
    code: string,
    message?: string | undefined,
    options?: ErrorOptions | undefined,
  ) {
    super(message, options);

    this.code = code;
    this.status = status;
    this.name = "HttpError";
  }
}
