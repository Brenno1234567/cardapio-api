import { randomUUID } from "node:crypto";

export function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

export function createOrderCode() {
  return `#${Math.floor(1000 + Math.random() * 9000)}`;
}

