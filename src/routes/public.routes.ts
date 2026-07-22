import { and, asc, eq, inArray, like, or } from "drizzle-orm";
import { Router } from "express";
import { asyncHandler } from "../common/async-handler.js";
import { badRequest, notFound } from "../common/errors.js";
import { categoryDto, orderDto, productDto, restaurantDto, tableDto } from "../common/dto/api-dto.js";
import { restaurantIdFromRequest } from "../common/restaurant.js";
import { createOrderSchema } from "../common/validation.js";
import { db } from "../database/client.js";
import { categories, orderItems, orders, products, restaurants, tables } from "../database/schema.js";
import { nowIso } from "../utils/date.js";
import { createId, createOrderCode } from "../utils/id.js";

export const publicRouter = Router();

publicRouter.get(
  "/restaurant",
  asyncHandler(async (req, res) => {
    const restaurantId = restaurantIdFromRequest(req);
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);

    if (!restaurant) {
      throw notFound("Restaurante não encontrado");
    }

    res.json({ data: restaurantDto(restaurant) });
  })
);

publicRouter.get(
  "/tables",
  asyncHandler(async (req, res) => {
    const restaurantId = restaurantIdFromRequest(req);
    const rows = await db.select().from(tables).where(eq(tables.restaurantId, restaurantId)).orderBy(asc(tables.name));
    res.json({ data: rows.map(tableDto) });
  })
);

publicRouter.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const restaurantId = restaurantIdFromRequest(req);
    const rows = await db
      .select()
      .from(categories)
      .where(and(eq(categories.restaurantId, restaurantId), eq(categories.active, true)))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    res.json({ data: rows.map(categoryDto) });
  })
);

publicRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    const restaurantId = restaurantIdFromRequest(req);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : "";
    const conditions = [eq(products.restaurantId, restaurantId), eq(products.available, true)];

    if (categoryId && categoryId !== "all") {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(or(like(products.name, pattern), like(products.description, pattern), like(products.fullDescription, pattern))!);
    }

    const rows = await db
      .select({ product: products, categoryName: categories.name })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(asc(products.name));

    res.json({ data: rows.map((row) => productDto(row.product, row.categoryName)) });
  })
);

publicRouter.get(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const restaurantId = restaurantIdFromRequest(req);
    const [row] = await db
      .select({ product: products, categoryName: categories.name })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.id, String(req.params.id)), eq(products.restaurantId, restaurantId), eq(products.available, true)))
      .limit(1);

    if (!row) {
      throw notFound("Produto não encontrado");
    }

    res.json({ data: productDto(row.product, row.categoryName) });
  })
);

publicRouter.post(
  "/orders",
  asyncHandler(async (req, res) => {
    const restaurantId = restaurantIdFromRequest(req);
    const payload = createOrderSchema.parse(req.body);
    const productIds = [...new Set(payload.items.map((item) => item.productId))];
    const productRows = await db
      .select()
      .from(products)
      .where(and(eq(products.restaurantId, restaurantId), inArray(products.id, productIds), eq(products.available, true)));

    if (productRows.length !== productIds.length) {
      throw badRequest("Um ou mais produtos estão indisponíveis");
    }

    const productMap = new Map(productRows.map((product) => [product.id, product]));
    const table = payload.tableId
      ? (await db.select().from(tables).where(and(eq(tables.id, payload.tableId), eq(tables.restaurantId, restaurantId))).limit(1))[0]
      : undefined;
    const tableName = table?.name ?? payload.tableName ?? "Mesa não informada";
    const createdAt = nowIso();
    const orderId = createOrderCode();

    let subtotalCents = 0;
    const itemsToInsert = payload.items.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw badRequest("Produto inválido");
      }

      subtotalCents += product.priceCents * item.quantity;

      return {
        id: createId("item"),
        orderId,
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
        notes: item.notes,
        createdAt
      };
    });

    const serviceFeeCents = Math.round(subtotalCents * 0.1);
    const totalCents = subtotalCents + serviceFeeCents;

    await db.insert(orders).values({
      id: orderId,
      restaurantId,
      tableId: table?.id,
      tableName,
      status: "received",
      subtotalCents,
      serviceFeeCents,
      totalCents,
      notes: payload.notes,
      createdAt,
      updatedAt: createdAt
    });
    await db.insert(orderItems).values(itemsToInsert);

    if (table) {
      await db.update(tables).set({ status: "occupied", updatedAt: createdAt }).where(eq(tables.id, table.id));
    }

    const [createdOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const createdItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    res.status(201).json({ data: orderDto(createdOrder!, createdItems) });
  })
);

publicRouter.get(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const restaurantId = restaurantIdFromRequest(req);
    const [order] = await db.select().from(orders).where(and(eq(orders.id, String(req.params.id)), eq(orders.restaurantId, restaurantId))).limit(1);

    if (!order) {
      throw notFound("Pedido não encontrado");
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    res.json({ data: orderDto(order, items) });
  })
);
