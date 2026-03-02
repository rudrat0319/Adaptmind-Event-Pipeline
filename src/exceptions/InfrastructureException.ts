export class InfrastructureException extends Error {
  public readonly statusCode: number = 500;

  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'InfrastructureException';
    Object.setPrototypeOf(this, InfrastructureException.prototype);
  }
}
