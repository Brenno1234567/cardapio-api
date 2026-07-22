import type { UserRole } from "../common/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        restaurantId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};

