import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export const notFound = (message = "Recurso não encontrado") => new ApiError(404, message);
export const badRequest = (message = "Requisição inválida") => new ApiError(400, message);
export const unauthorized = (message = "Não autorizado") => new ApiError(401, message);
export const forbidden = (message = "Acesso negado") => new ApiError(403, message);

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(422).json({
      error: "ValidationError",
      message: "Dados inválidos",
      issues: error.flatten()
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: "ApiError",
      message: error.message
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "InternalServerError",
    message: "Erro interno do servidor"
  });
};

