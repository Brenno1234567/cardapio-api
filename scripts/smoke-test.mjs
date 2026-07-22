import { createApp } from "../dist/app.js";

const app = createApp();
const server = app.listen(0, "127.0.0.1");

function listen(serverInstance) {
  return new Promise((resolve) => {
    serverInstance.once("listening", () => resolve(serverInstance.address().port));
  });
}

const port = await listen(server);
const baseUrl = `http://127.0.0.1:${port}`;

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(options?.headers ?? {})
    },
    ...options
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

const health = await request("/health");
const products = await request("/api/public/products");
const login = await request("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email: "admin@ervadoce.com", password: "123456" })
});
const dashboard = await request("/api/admin/dashboard", {
  headers: {
    authorization: `Bearer ${login.token}`
  }
});
const createdOrder = await request("/api/public/orders", {
  method: "POST",
  body: JSON.stringify({
    tableId: "table_12",
    items: [
      {
        productId: "prod_burger_brie",
        quantity: 1,
        notes: "Sem cebola"
      }
    ]
  })
});

console.log(
  JSON.stringify(
    {
      health: health.status,
      products: products.data.length,
      login: login.user.email,
      dashboardOrdersToday: dashboard.data.stats.ordersToday,
      createdOrder: createdOrder.data.id,
      createdOrderTotal: createdOrder.data.total
    },
    null,
    2
  )
);

server.close();

