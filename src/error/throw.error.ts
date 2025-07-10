// src/common/error/throw.error.ts

export class ThrowError extends Error {
  code: number;
  status: number;

  constructor(message: string, code = -1, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const errorMessages = {
  required: (field: string) => `${field} is required`,
  invalid: (field: string) => `${field} is invalid`,
  notFound: (field: string) => `${field} not found`,
  alreadyExists: (field: string) => `${field} already exists`,
  unauthorized: () => `Unauthorized`,
  forbidden: () => `Forbidden`,
};

type ErrorType = keyof typeof errorMessages;

export function throwError(
  messageOrField: string,
  code = -1,
  status = 400,
  type?: ErrorType
): never {
  const message =
    type && errorMessages[type]
      ? errorMessages[type](messageOrField)
      : messageOrField;

  throw new ThrowError(message, code, status);
}
