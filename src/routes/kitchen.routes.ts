import { and, desc, eq, inArray } from "drizzle-orm";
import { Router } from "express";
import { authenticate, requireUser } from "../common/auth.js";
import { asyncHandler } from "../common/async-handler.js";
import { notFound } from "../common/errors.js";
import { orderDto } from "../common/dto/api-dto.js";
import { statusSchema } from "../common/validation.js";
import { db } from "../database/client.js";
import { orderItems, orders } from "../database/schema.js";
import { nowIso } from "../utils/date.js";

export const kitchenRouter = Router();

kitchenRouter.use(authenticate(["admin", "manager", "employee", "kitchen"]));

kitchenRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const status = typeof req.query.status === "string" ? req.query.status : "active";
    const activeStatuses: Array<"received" | "preparing" | "ready"> = ["received", "preparing", "ready"];
    const rows =
      status === "active"
        ? await db
            .select()
            .from(orders)
            .where(and(eq(orders.restaurantId, user.restaurantId), inArray(orders.status, activeStatuses)))
            .orderBy(desc(orders.createdAt))
        : await db.select().from(orders).where(and(eq(orders.restaurantId, user.restaurantId), eq(orders.status, statusSchema.parse(status)))).orderBy(desc(orders.createdAt));

    const data = await Promise.all(
      rows.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return orderDto(order, items);
      })
    );

    res.json({ data });
  })
);

kitchenRouter.patch(
  "/orders/:id/status",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const status = statusSchema.parse(req.body.status);
    const [order] = await db.select().from(orders).where(and(eq(orders.id, String(req.params.id)), eq(orders.restaurantId, user.restaurantId))).limit(1);

    if (!order) {
      throw notFound("Pedido não encontrado");
    }

    await db.update(orders).set({ status, updatedAt: nowIso() }).where(eq(orders.id, order.id));

    const [updated] = await db.select().from(orders).where(eq(orders.id, order.id)).limit(1);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    res.json({ data: orderDto(updated!, items) });
  })
);
