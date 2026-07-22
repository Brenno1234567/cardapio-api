import type { CategoryRow, OrderItemRow, OrderRow, ProductRow, RestaurantRow, TableRow, UserRow } from "../../database/schema.js";
import { fromCents } from "../../utils/money.js";

function parseIngredients(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function restaurantDto(row: RestaurantRow) {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logoUrl,
    phone: row.phone,
    address: row.address,
    hours: row.hours,
    primaryColor: row.primaryColor
  };
}

export function categoryDto(row: CategoryRow) {
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    name: row.name,
    icon: row.icon,
    active: row.active,
    sortOrder: row.sortOrder
  };
}

export function productDto(row: ProductRow, categoryName?: string | null) {
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    categoryId: row.categoryId,
    category: categoryName,
    name: row.name,
    description: row.description,
    fullDescription: row.fullDescription,
    price: fromCents(row.priceCents),
    priceCents: row.priceCents,
    imageUrl: row.imageUrl,
    image: row.imageUrl,
    ingredients: parseIngredients(row.ingredientsJson),
    available: row.available,
    promotion: row.promotion,
    bestSeller: row.bestSeller,
    isPromotion: row.promotion,
    isBestSeller: row.bestSeller,
    prepTime: row.prepTime
  };
}

export function tableDto(row: TableRow) {
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    name: row.name,
    seats: row.seats,
    status: row.status
  };
}

export function userDto(row: UserRow) {
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.active
  };
}

export function orderDto(row: OrderRow, items: OrderItemRow[] = []) {
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    tableId: row.tableId,
    tableName: row.tableName,
    table: row.tableName,
    status: row.status,
    subtotal: fromCents(row.subtotalCents),
    serviceFee: fromCents(row.serviceFeeCents),
    total: fromCents(row.totalCents),
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: fromCents(item.unitPriceCents),
      unitPriceCents: item.unitPriceCents,
      notes: item.notes
    }))
  };
}

