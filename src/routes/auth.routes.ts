import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { authenticate, signToken } from "../common/auth.js";
import { asyncHandler } from "../common/async-handler.js";
import { unauthorized } from "../common/errors.js";
import { userDto } from "../common/dto/api-dto.js";
import { loginSchema } from "../common/validation.js";
import { db } from "../database/client.js";
import { users } from "../database/schema.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, payload.email)).limit(1);

    if (!user || !user.active) {
      throw unauthorized("Credenciais inválidas");
    }

    const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);

    if (!passwordMatches) {
      throw unauthorized("Credenciais inválidas");
    }

    const token = signToken({
      sub: user.id,
      restaurantId: user.restaurantId,
      email: user.email,
      role: user.role
    });

    res.json({
      token,
      user: userDto(user)
    });
  })
);

authRouter.get(
  "/me",
  authenticate(),
  asyncHandler(async (req, res) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);

    if (!user) {
      throw unauthorized("Usuário não encontrado");
    }

    res.json({ user: userDto(user) });
  })
);

