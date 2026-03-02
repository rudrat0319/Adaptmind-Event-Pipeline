export class EntityNotFoundException extends Error {
  public readonly statusCode: number = 404;

  constructor(entityName: string, id: string) {
    super(`${entityName} with id '${id}' not found`);
    this.name = 'EntityNotFoundException';
    Object.setPrototypeOf(this, EntityNotFoundException.prototype);
  }
}
