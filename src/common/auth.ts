import type { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { forbidden, unauthorized } from "./errors.js";

export type UserRole = "admin" | "manager" | "employee" | "kitchen";

export type TokenPayload = {
  sub: string;
  restaurantId: string;
  email: string;
  role: UserRole;
};

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  });
}

export function authenticate(roles?: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      throw unauthorized("Token não informado");
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload & { iat: number; exp: number };
      req.user = {
        id: payload.sub,
        restaurantId: payload.restaurantId,
        email: payload.email,
        role: payload.role
      };

      if (roles?.length && !roles.includes(payload.role)) {
        throw forbidden("Perfil sem permissão para esta ação");
      }

      next();
    } catch (error) {
      if (error instanceof Error && error.message === "Perfil sem permissão para esta ação") {
        throw error;
      }

      throw unauthorized("Token inválido ou expirado");
    }
  };
}

export function requireUser(req: Request) {
  if (!req.user) {
    throw unauthorized("Usuário não autenticado");
  }

  return req.user;
}
