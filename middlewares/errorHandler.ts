import type { StripeError } from "../src/paymentIntents/interface/types";

export class StripeMockError extends Error {
  readonly stripeError: StripeError;
  readonly statusCode: number;

  constructor(error: StripeError, statusCode = 400) {
    super(error.message);
    this.name = "StripeMockError";
    this.stripeError = error;
    this.statusCode = statusCode;
  }
}

export function notFound(resource: string, id: string, param = "id"): never {
  throw new StripeMockError(
    {
      type: "invalid_request_error",
      code: "resource_missing",
      message: `No such ${resource}: '${id}'`,
      param,
    },
    404
  );
}

export function invalidParam(message: string, param?: string, code?: string): never {
  throw new StripeMockError({
    type: "invalid_request_error",
    code: code ?? "parameter_invalid",
    message,
    param,
  });
}