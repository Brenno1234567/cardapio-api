import { z } from "zod";

export const statusSchema = z.enum(["received", "preparing", "ready", "delivered", "paid", "cancelled"]);
export const tableStatusSchema = z.enum(["free", "occupied", "payment"]);
export const userRoleSchema = z.enum(["admin", "manager", "employee", "kitchen"]);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const createOrderSchema = z.object({
  tableId: z.string().optional(),
  tableName: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.coerce.number().int().min(1).max(99),
        notes: z.string().max(500).optional()
      })
    )
    .min(1)
});

export const productSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(2),
  description: z.string().min(4),
  fullDescription: z.string().min(4),
  price: z.coerce.number().min(0.01),
  imageUrl: z.string().url(),
  ingredients: z.array(z.string()).default([]),
  available: z.boolean().default(true),
  promotion: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  prepTime: z.string().min(2).default("15-25 min")
});

export const categorySchema = z.object({
  name: z.string().min(2),
  icon: z.string().min(1),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0)
});

export const tableSchema = z.object({
  name: z.string().min(2),
  seats: z.coerce.number().int().min(1).max(20),
  status: tableStatusSchema.default("free")
});

export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: userRoleSchema,
  active: z.boolean().default(true)
});

export const settingsSchema = z.object({
  name: z.string().min(2),
  logoUrl: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  hours: z.string().nullable().optional(),
  primaryColor: z.string().min(4)
});

