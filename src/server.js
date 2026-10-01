const app = require("./app");
const prisma = require("./config/database");
const env = require("./config/env");

async function start() {
  try {
    await prisma.$connect();
    app.listen(env.port, () => {
      console.log(`TradeX API running at http://localhost:${env.port}`);
      console.log(`Mode: ${env.nodeEnv === "production" ? "PRODUCTION" : "DEMO"}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();