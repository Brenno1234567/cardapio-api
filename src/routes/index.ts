import { Router } from "express";
import { adminRouter } from "./admin.routes.js";
import { authRouter } from "./auth.routes.js";
import { kitchenRouter } from "./kitchen.routes.js";
import { publicRouter } from "./public.routes.js";

export const routes = Router();

routes.use("/auth", authRouter);
routes.use("/public", publicRouter);
routes.use("/admin", adminRouter);
routes.use("/kitchen", kitchenRouter);

