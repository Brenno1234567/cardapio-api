import type { Request } from "express";

export const defaultRestaurantId = "restaurant_erva_doce";

export function restaurantIdFromRequest(req: Request) {
  const headerValue = req.header("x-restaurant-id");
  const queryValue = typeof req.query.restaurantId === "string" ? req.query.restaurantId : undefined;

  return headerValue || queryValue || req.user?.restaurantId || defaultRestaurantId;
}

