import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Cardapio API running on http://127.0.0.1:${env.PORT}`);
});

