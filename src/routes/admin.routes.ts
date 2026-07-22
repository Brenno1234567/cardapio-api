import bcrypt from "bcryptjs";
import { and, asc, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { authenticate, requireUser } from "../common/auth.js";
import { asyncHandler } from "../common/async-handler.js";
import { badRequest, notFound } from "../common/errors.js";
import { categoryDto, orderDto, productDto, restaurantDto, tableDto, userDto } from "../common/dto/api-dto.js";
import { categorySchema, productSchema, settingsSchema, statusSchema, tableSchema, userSchema } from "../common/validation.js";
import { db } from "../database/client.js";
import { categories, orderItems, orders, products, restaurants, tables, users } from "../database/schema.js";
import { nowIso } from "../utils/date.js";
import { createId } from "../utils/id.js";
import { fromCents, toCents } from "../utils/money.js";

export const adminRouter = Router();

adminRouter.use(authenticate(["admin", "manager"]));

adminRouter.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const orderRows = await db.select().from(orders).where(eq(orders.restaurantId, user.restaurantId)).orderBy(desc(orders.createdAt));
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orderRows.filter((order) => order.createdAt.startsWith(today));
    const completedOrders = orderRows.filter((order) => ["delivered", "paid"].includes(order.status));
    const pendingOrders = orderRows.filter((order) => ["received", "preparing", "ready"].includes(order.status));

    const revenueSeries = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date);
      const value = fromCents(
        orderRows
          .filter((order) => order.createdAt.startsWith(key) && order.status !== "cancelled")
          .reduce((sum, order) => sum + order.totalCents, 0)
      );

      return { label, value };
    });

    const latestOrders = await Promise.all(
      orderRows.slice(0, 8).map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return orderDto(order, items);
      })
    );

    res.json({
      data: {
        stats: {
          ordersToday: todayOrders.length,
          revenue: fromCents(todayOrders.reduce((sum, order) => sum + order.totalCents, 0)),
          pendingOrders: pendingOrders.length,
          completedOrders: completedOrders.length
        },
        revenueSeries,
        latestOrders
      }
    });
  })
);

adminRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const rows = await db
      .select({ product: products, categoryName: categories.name })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.restaurantId, user.restaurantId))
      .orderBy(asc(products.name));

    res.json({ data: rows.map((row) => productDto(row.product, row.categoryName)) });
  })
);

adminRouter.post(
  "/products",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const payload = productSchema.parse(req.body);
    const timestamp = nowIso();
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, payload.categoryId), eq(categories.restaurantId, user.restaurantId)))
      .limit(1);

    if (!category) {
      throw badRequest("Categoria inválida");
    }

    const id = createId("prod");
    await db.insert(products).values({
      id,
      restaurantId: user.restaurantId,
      categoryId: payload.categoryId,
      name: payload.name,
      description: payload.description,
      fullDescription: payload.fullDescription,
      priceCents: toCents(payload.price),
      imageUrl: payload.imageUrl,
      ingredientsJson: JSON.stringify(payload.ingredients),
      available: payload.available,
      promotion: payload.promotion,
      bestSeller: payload.bestSeller,
      prepTime: payload.prepTime,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    const [created] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    res.status(201).json({ data: productDto(created!, category.name) });
  })
);

adminRouter.put(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const payload = productSchema.parse(req.body);
    const [product] = await db.select().from(products).where(and(eq(products.id, String(req.params.id)), eq(products.restaurantId, user.restaurantId))).limit(1);

    if (!product) {
      throw notFound("Produto não encontrado");
    }

    await db
      .update(products)
      .set({
        categoryId: payload.categoryId,
        name: payload.name,
        description: payload.description,
        fullDescription: payload.fullDescription,
        priceCents: toCents(payload.price),
        imageUrl: payload.imageUrl,
        ingredientsJson: JSON.stringify(payload.ingredients),
        available: payload.available,
        promotion: payload.promotion,
        bestSeller: payload.bestSeller,
        prepTime: payload.prepTime,
        updatedAt: nowIso()
      })
      .where(eq(products.id, product.id));

    const [updated] = await db.select().from(products).where(eq(products.id, product.id)).limit(1);
    res.json({ data: productDto(updated!) });
  })
);

adminRouter.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const [product] = await db.select().from(products).where(and(eq(products.id, String(req.params.id)), eq(products.restaurantId, user.restaurantId))).limit(1);

    if (!product) {
      throw notFound("Produto não encontrado");
    }

    await db.delete(products).where(eq(products.id, product.id));
    res.status(204).send();
  })
);

adminRouter.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const rows = await db.select().from(categories).where(eq(categories.restaurantId, user.restaurantId)).orderBy(asc(categories.sortOrder), asc(categories.name));
    res.json({ data: rows.map(categoryDto) });
  })
);

adminRouter.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const payload = categorySchema.parse(req.body);
    const timestamp = nowIso();
    const id = createId("cat");

    await db.insert(categories).values({
      id,
      restaurantId: user.restaurantId,
      name: payload.name,
      icon: payload.icon,
      active: payload.active,
      sortOrder: payload.sortOrder,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    const [created] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    res.status(201).json({ data: categoryDto(created!) });
  })
);

adminRouter.put(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const payload = categorySchema.parse(req.body);
    const [category] = await db.select().from(categories).where(and(eq(categories.id, String(req.params.id)), eq(categories.restaurantId, user.restaurantId))).limit(1);

    if (!category) {
      throw notFound("Categoria não encontrada");
    }

    await db
      .update(categories)
      .set({ name: payload.name, icon: payload.icon, active: payload.active, sortOrder: payload.sortOrder, updatedAt: nowIso() })
      .where(eq(categories.id, category.id));

    const [updated] = await db.select().from(categories).where(eq(categories.id, category.id)).limit(1);
    res.json({ data: categoryDto(updated!) });
  })
);

adminRouter.delete(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const [category] = await db.select().from(categories).where(and(eq(categories.id, String(req.params.id)), eq(categories.restaurantId, user.restaurantId))).limit(1);

    if (!category) {
      throw notFound("Categoria não encontrada");
    }

    await db.delete(categories).where(eq(categories.id, category.id));
    res.status(204).send();
  })
);

adminRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const status = typeof req.query.status === "string" && req.query.status !== "all" ? statusSchema.parse(req.query.status) : undefined;
    const rows = await db
      .select()
      .from(orders)
      .where(status ? and(eq(orders.restaurantId, user.restaurantId), eq(orders.status, status)) : eq(orders.restaurantId, user.restaurantId))
      .orderBy(desc(orders.createdAt));
    const data = await Promise.all(
      rows.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return orderDto(order, items);
      })
    );

    res.json({ data });
  })
);

adminRouter.get(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const [order] = await db.select().from(orders).where(and(eq(orders.id, String(req.params.id)), eq(orders.restaurantId, user.restaurantId))).limit(1);

    if (!order) {
      throw notFound("Pedido não encontrado");
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    res.json({ data: orderDto(order, items) });
  })
);

adminRouter.patch(
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

adminRouter.get(
  "/tables",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const rows = await db.select().from(tables).where(eq(tables.restaurantId, user.restaurantId)).orderBy(asc(tables.name));
    res.json({ data: rows.map(tableDto) });
  })
);

adminRouter.put(
  "/tables/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const payload = tableSchema.parse(req.body);
    const [table] = await db.select().from(tables).where(and(eq(tables.id, String(req.params.id)), eq(tables.restaurantId, user.restaurantId))).limit(1);

    if (!table) {
      throw notFound("Mesa não encontrada");
    }

    await db.update(tables).set({ name: payload.name, seats: payload.seats, status: payload.status, updatedAt: nowIso() }).where(eq(tables.id, table.id));
    const [updated] = await db.select().from(tables).where(eq(tables.id, table.id)).limit(1);
    res.json({ data: tableDto(updated!) });
  })
);

adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const rows = await db.select().from(users).where(eq(users.restaurantId, user.restaurantId)).orderBy(asc(users.name));
    res.json({ data: rows.map(userDto) });
  })
);

adminRouter.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const payload = userSchema.parse(req.body);

    if (!payload.password) {
      throw badRequest("Senha é obrigatória para novo usuário");
    }

    const timestamp = nowIso();
    const id = createId("user");
    const passwordHash = await bcrypt.hash(payload.password, 10);

    await db.insert(users).values({
      id,
      restaurantId: user.restaurantId,
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: payload.role,
      active: payload.active,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    const [created] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    res.status(201).json({ data: userDto(created!) });
  })
);

adminRouter.put(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const payload = userSchema.parse(req.body);
    const [target] = await db.select().from(users).where(and(eq(users.id, String(req.params.id)), eq(users.restaurantId, user.restaurantId))).limit(1);

    if (!target) {
      throw notFound("Usuário não encontrado");
    }

    const passwordHash = payload.password ? await bcrypt.hash(payload.password, 10) : target.passwordHash;

    await db
      .update(users)
      .set({
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: payload.role,
        active: payload.active,
        updatedAt: nowIso()
      })
      .where(eq(users.id, target.id));

    const [updated] = await db.select().from(users).where(eq(users.id, target.id)).limit(1);
    res.json({ data: userDto(updated!) });
  })
);

adminRouter.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);

    if (String(req.params.id) === user.id) {
      throw badRequest("Você não pode excluir o próprio usuário logado");
    }

    const [target] = await db.select().from(users).where(and(eq(users.id, String(req.params.id)), eq(users.restaurantId, user.restaurantId))).limit(1);

    if (!target) {
      throw notFound("Usuário não encontrado");
    }

    await db.delete(users).where(eq(users.id, target.id));
    res.status(204).send();
  })
);

adminRouter.get(
  "/settings",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, user.restaurantId)).limit(1);

    if (!restaurant) {
      throw notFound("Restaurante não encontrado");
    }

    res.json({ data: restaurantDto(restaurant) });
  })
);

adminRouter.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const payload = settingsSchema.parse(req.body);
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, user.restaurantId)).limit(1);

    if (!restaurant) {
      throw notFound("Restaurante não encontrado");
    }

    await db
      .update(restaurants)
      .set({
        name: payload.name,
        logoUrl: payload.logoUrl,
        phone: payload.phone,
        address: payload.address,
        hours: payload.hours,
        primaryColor: payload.primaryColor,
        updatedAt: nowIso()
      })
      .where(eq(restaurants.id, restaurant.id));

    const [updated] = await db.select().from(restaurants).where(eq(restaurants.id, restaurant.id)).limit(1);
    res.json({ data: restaurantDto(updated!) });
  })
);
