export class IdempotencyException extends Error {
  public readonly statusCode: number = 409;

  constructor(requestId: string) {
    super(`Request with id '${requestId}' has already been processed`);
    this.name = 'IdempotencyException';
    Object.setPrototypeOf(this, IdempotencyException.prototype);
  }
}
