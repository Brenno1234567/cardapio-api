import bcrypt from "bcryptjs";
import { turso } from "./client.js";
import { env } from "../config/env.js";
import { minutesAgo, nowIso } from "../utils/date.js";
import { toCents } from "../utils/money.js";

const restaurantId = "restaurant_erva_doce";
const now = nowIso();

async function run(sql: string, args: Array<string | number | boolean | null> = []) {
  await turso.execute({ sql, args });
}

const categories = [
  { id: "cat_burgers", name: "Hambúrguer", icon: "🍔", sortOrder: 1 },
  { id: "cat_pizza", name: "Pizza", icon: "🍕", sortOrder: 2 },
  { id: "cat_drinks", name: "Bebidas", icon: "🥤", sortOrder: 3 },
  { id: "cat_portions", name: "Porções", icon: "🍟", sortOrder: 4 },
  { id: "cat_desserts", name: "Sobremesas", icon: "🍰", sortOrder: 5 },
  { id: "cat_coffee", name: "Cafés", icon: "☕", sortOrder: 6 }
];

const products = [
  {
    id: "prod_burger_brie",
    categoryId: "cat_burgers",
    name: "Burger Brie da Casa",
    description: "Blend angus, brie tostado, cebola caramelizada e aioli de ervas.",
    fullDescription:
      "Um hambúrguer autoral com blend angus de 180g, queijo brie levemente tostado, cebola caramelizada no vinho branco e aioli de ervas frescas.",
    price: 38.9,
    imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1100&q=80",
    ingredients: ["Pão brioche", "Blend angus", "Queijo brie", "Cebola caramelizada", "Aioli de ervas"],
    promotion: false,
    bestSeller: true,
    prepTime: "18-24 min"
  },
  {
    id: "prod_smash_citrus",
    categoryId: "cat_burgers",
    name: "Smash Citrus",
    description: "Dois smashs, cheddar inglês, picles artesanal e maionese cítrica.",
    fullDescription:
      "Clássico de chapa com dois smash burgers de 90g, cheddar inglês derretido, picles artesanal e maionese cítrica da casa.",
    price: 34.5,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1100&q=80",
    ingredients: ["Pão potato", "Dois smash burgers", "Cheddar inglês", "Picles", "Maionese cítrica"],
    promotion: true,
    bestSeller: false,
    prepTime: "12-18 min"
  },
  {
    id: "prod_pizza_burrata",
    categoryId: "cat_pizza",
    name: "Pizza Burrata & Pesto",
    description: "Massa longa fermentação, burrata cremosa, pesto e tomate confit.",
    fullDescription:
      "Pizza de fermentação lenta com molho de tomates italianos, burrata fresca, pesto de manjericão, tomate confit e azeite extra virgem.",
    price: 59.9,
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1100&q=80",
    ingredients: ["Massa artesanal", "Molho italiano", "Burrata", "Pesto", "Tomate confit"],
    promotion: false,
    bestSeller: true,
    prepTime: "24-32 min"
  },
  {
    id: "prod_pizza_calabresa",
    categoryId: "cat_pizza",
    name: "Pizza Calabresa Premium",
    description: "Calabresa artesanal, cebola roxa, mussarela e oregano fresco.",
    fullDescription:
      "Uma releitura premium da calabresa com linguiça artesanal fatiada, cebola roxa, mussarela cremosa e oregano fresco.",
    price: 49.9,
    imageUrl: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1100&q=80",
    ingredients: ["Massa artesanal", "Calabresa artesanal", "Mussarela", "Cebola roxa", "Oregano fresco"],
    promotion: false,
    bestSeller: false,
    prepTime: "22-30 min"
  },
  {
    id: "prod_tea_citrus",
    categoryId: "cat_drinks",
    name: "Chá Gelado Citrus",
    description: "Chá preto, limão siciliano, hortelã e xarope leve de especiarias.",
    fullDescription:
      "Bebida refrescante preparada na casa com chá preto infusionado, limão siciliano, hortelã fresca e xarope leve de especiarias.",
    price: 14.9,
    imageUrl: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=1100&q=80",
    ingredients: ["Chá preto", "Limão siciliano", "Hortelã", "Especiarias"],
    promotion: true,
    bestSeller: false,
    prepTime: "4-6 min"
  },
  {
    id: "prod_fries_truffle",
    categoryId: "cat_portions",
    name: "Fritas Trufadas",
    description: "Batatas crocantes, azeite trufado, parmesão e aioli da casa.",
    fullDescription:
      "Porção generosa de batatas selecionadas, finalizadas com azeite trufado, parmesão curado e aioli cremoso da casa.",
    price: 31.9,
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1100&q=80",
    ingredients: ["Batata", "Azeite trufado", "Parmesão", "Aioli"],
    promotion: false,
    bestSeller: true,
    prepTime: "14-18 min"
  },
  {
    id: "prod_cheesecake",
    categoryId: "cat_desserts",
    name: "Cheesecake de Frutas Vermelhas",
    description: "Base crocante, creme leve de cream cheese e calda fresca.",
    fullDescription:
      "Sobremesa cremosa com base amanteigada, creme aerado de cream cheese e calda artesanal de frutas vermelhas.",
    price: 24.9,
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=1100&q=80",
    ingredients: ["Cream cheese", "Biscoito amanteigado", "Frutas vermelhas", "Baunilha"],
    promotion: false,
    bestSeller: false,
    prepTime: "5-8 min"
  },
  {
    id: "prod_espresso_tonic",
    categoryId: "cat_coffee",
    name: "Espresso Tônica",
    description: "Espresso duplo, tônica premium, gelo cristalino e laranja.",
    fullDescription:
      "Café autoral refrescante com espresso duplo, tônica premium, gelo cristalino e zest de laranja bahia.",
    price: 16.9,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1100&q=80",
    ingredients: ["Espresso", "Tônica premium", "Laranja bahia", "Gelo"],
    promotion: true,
    bestSeller: false,
    prepTime: "4-7 min"
  }
];

const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 10);

await run(
  `INSERT OR IGNORE INTO restaurants
   (id, name, logo_url, phone, address, hours, primary_color, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    restaurantId,
    "Erva Doce Bistrô",
    "/images/logo-ervadoce.jpeg",
    "(11) 99999-1200",
    "Rua das Acácias, 122 - Jardim Paulista",
    "Seg a Sab, 11h30 às 23h",
    "#D62828",
    now,
    now
  ]
);

await run(
  `INSERT OR IGNORE INTO users
   (id, restaurant_id, name, email, password_hash, role, active, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ["user_admin", restaurantId, "Marina Lopes", env.SEED_ADMIN_EMAIL, passwordHash, "admin", 1, now, now]
);

await run(
  `INSERT OR IGNORE INTO users
   (id, restaurant_id, name, email, password_hash, role, active, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ["user_kitchen", restaurantId, "Equipe Cozinha", "cozinha@ervadoce.com", passwordHash, "kitchen", 1, now, now]
);

for (let index = 1; index <= 18; index += 1) {
  const status = index % 7 === 0 ? "payment" : index % 3 === 0 ? "occupied" : "free";
  await run(
    `INSERT OR IGNORE INTO tables
     (id, restaurant_id, name, seats, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [`table_${index}`, restaurantId, `Mesa ${String(index).padStart(2, "0")}`, index % 4 === 0 ? 6 : 4, status, now, now]
  );
}

for (const category of categories) {
  await run(
    `INSERT OR IGNORE INTO categories
     (id, restaurant_id, name, icon, active, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [category.id, restaurantId, category.name, category.icon, 1, category.sortOrder, now, now]
  );
}

for (const product of products) {
  await run(
    `INSERT OR IGNORE INTO products
     (id, restaurant_id, category_id, name, description, full_description, price_cents, image_url, ingredients_json,
      available, promotion, best_seller, prep_time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.id,
      restaurantId,
      product.categoryId,
      product.name,
      product.description,
      product.fullDescription,
      toCents(product.price),
      product.imageUrl,
      JSON.stringify(product.ingredients),
      1,
      product.promotion ? 1 : 0,
      product.bestSeller ? 1 : 0,
      product.prepTime,
      now,
      now
    ]
  );
}

const sampleOrders = [
  {
    id: "#1842",
    tableId: "table_12",
    tableName: "Mesa 12",
    status: "preparing",
    notes: "Enviar bebidas primeiro",
    createdAt: minutesAgo(8),
    items: [
      { productId: "prod_burger_brie", name: "Burger Brie da Casa", quantity: 1, price: 38.9, notes: "Ponto ao ponto, sem cebola" },
      { productId: "prod_fries_truffle", name: "Fritas Trufadas", quantity: 1, price: 31.9, notes: null },
      { productId: "prod_tea_citrus", name: "Chá Gelado Citrus", quantity: 2, price: 14.9, notes: null }
    ]
  },
  {
    id: "#1841",
    tableId: "table_4",
    tableName: "Mesa 04",
    status: "received",
    notes: null,
    createdAt: minutesAgo(13),
    items: [
      { productId: "prod_pizza_burrata", name: "Pizza Burrata & Pesto", quantity: 1, price: 59.9, notes: null },
      { productId: "prod_espresso_tonic", name: "Espresso Tônica", quantity: 1, price: 16.9, notes: null }
    ]
  }
];

for (const order of sampleOrders) {
  const subtotal = order.items.reduce((sum, item) => sum + toCents(item.price) * item.quantity, 0);
  const serviceFee = Math.round(subtotal * 0.1);

  await run(
    `INSERT OR IGNORE INTO orders
     (id, restaurant_id, table_id, table_name, status, subtotal_cents, service_fee_cents, total_cents, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [order.id, restaurantId, order.tableId, order.tableName, order.status, subtotal, serviceFee, subtotal + serviceFee, order.notes, order.createdAt, order.createdAt]
  );

  for (const [index, item] of order.items.entries()) {
    await run(
      `INSERT OR IGNORE INTO order_items
       (id, order_id, product_id, product_name, quantity, unit_price_cents, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [`${order.id}_item_${index + 1}`, order.id, item.productId, item.name, item.quantity, toCents(item.price), item.notes, order.createdAt]
    );
  }
}

console.log("Database seeded successfully.");

