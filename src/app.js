const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: "100kb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.get('/health', (req, res) => {
res.status(200).json({ status: 'ok', message: 'Backend is live!' });


app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use("/api", rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "TradeX API",
    mode: "DEMO",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/account", require("./routes/account.routes"));
app.use("/api/market", require("./routes/market.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/positions", require("./routes/position.routes"));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

module.exports = app;}