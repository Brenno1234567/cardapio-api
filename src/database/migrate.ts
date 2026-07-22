import { turso } from "./client.js";

const statements = [
  `CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    phone TEXT,
    address TEXT,
    hours TEXT,
    primary_color TEXT NOT NULL DEFAULT '#D62828',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
  )`,
  `CREATE TABLE IF NOT EXISTS tables (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'free',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🍽️',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    ingredients_json TEXT NOT NULL DEFAULT '[]',
    available INTEGER NOT NULL DEFAULT 1,
    promotion INTEGER NOT NULL DEFAULT 0,
    best_seller INTEGER NOT NULL DEFAULT 0,
    prep_time TEXT NOT NULL DEFAULT '15-25 min',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    table_id TEXT,
    table_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'received',
    subtotal_cents INTEGER NOT NULL,
    service_fee_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY (table_id) REFERENCES tables(id)
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`,
  `CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT,
    user_id TEXT,
    action TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`
];

for (const sql of statements) {
  await turso.execute(sql);
}

console.log("Database migrated successfully.");

