/**
 * Application Errors & Error Handling
 *
 * Defines standard error classes and server action result wrappers
 * to ensure consistent error handling across the application.
 */

import { ZodError } from 'zod';

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function handleActionError(error: unknown): ActionResult<never> {
  console.error('[Server Action Error]:', error);

  if (error instanceof ZodError) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (error instanceof Error) {
    // In production, we might want to sanitize this, but for this demo 
    // it's helpful to see the actual error message.
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: false,
    error: 'An unexpected error occurred',
  };
}
