import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const restaurants = sqliteTable("restaurants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  phone: text("phone"),
  address: text("address"),
  hours: text("hours"),
  primaryColor: text("primary_color").notNull().default("#D62828"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "manager", "employee", "kitchen"] }).notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const tables = sqliteTable("tables", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  seats: integer("seats").notNull().default(4),
  status: text("status", { enum: ["free", "occupied", "payment"] }).notNull().default("free"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("🍽️"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull().references(() => restaurants.id),
  categoryId: text("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  fullDescription: text("full_description").notNull(),
  priceCents: integer("price_cents").notNull(),
  imageUrl: text("image_url").notNull(),
  ingredientsJson: text("ingredients_json").notNull().default("[]"),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  promotion: integer("promotion", { mode: "boolean" }).notNull().default(false),
  bestSeller: integer("best_seller", { mode: "boolean" }).notNull().default(false),
  prepTime: text("prep_time").notNull().default("15-25 min"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull().references(() => restaurants.id),
  tableId: text("table_id").references(() => tables.id),
  tableName: text("table_name").notNull(),
  status: text("status", {
    enum: ["received", "accepted", "preparing", "ready", "delivered", "paid", "cancelled"]
  }).notNull().default("received"),
  subtotalCents: integer("subtotal_cents").notNull(),
  serviceFeeCents: integer("service_fee_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id),
  productId: text("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull()
});

export const logs = sqliteTable("logs", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").references(() => restaurants.id),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: text("created_at").notNull()
});

export type RestaurantRow = typeof restaurants.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type TableRow = typeof tables.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
