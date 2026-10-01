const router = require("express").Router();
const market = require("../market/prices");

router.get("/symbols", (req, res) => {
  res.json({ mode: "DEMO", symbols: market.getSymbols() });
});

router.get("/:symbol/price", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const price = market.getPrice(symbol);
  if (!price) return res.status(404).json({ error: "Unsupported symbol" });
  res.json({ symbol, price, mode: "DEMO" });
});

router.get("/:symbol/candles", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const candles = market.getCandles(symbol, Math.min(Number(req.query.limit) || 60, 200));
  if (!candles) return res.status(404).json({ error: "Unsupported symbol" });
  res.json({ symbol, candles, timeframe: "1m", mode: "DEMO" });
});

module.exports = router;