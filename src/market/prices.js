// Demo market-data provider.
// Replace this service with a licensed broker/exchange feed before live trading.
const BASE = {
  EURUSD: 1.1724,
  GBPUSD: 1.3482,
  USDJPY: 147.62,
  BTCUSD: 112500,
  ETHUSD: 4180,
  AAPL: 255.12,
  TSLA: 423.18
};

function getPrice(symbol) {
  const key = symbol.toUpperCase();
  const base = BASE[key];
  if (!base) return null;

  // Small deterministic-looking demo movement.
  const movement = Math.sin(Date.now() / 15000 + key.length) * base * 0.0008;
  return Number((base + movement).toFixed(key.includes("JPY") ? 3 : 4));
}

function getSymbols() {
  return Object.keys(BASE).map(symbol => ({
    symbol,
    price: getPrice(symbol),
    mode: "DEMO"
  }));
}

function getCandles(symbol, limit = 60) {
  const current = getPrice(symbol);
  if (!current) return null;

  const candles = [];
  const now = Date.now();
  let price = current * 0.997;

  for (let i = limit - 1; i >= 0; i--) {
    const open = price;
    const close = open * (1 + Math.sin(i * 1.7) * 0.0009);
    const high = Math.max(open, close) * 1.0008;
    const low = Math.min(open, close) * 0.9992;
    candles.push({
      time: Math.floor((now - i * 60000) / 1000),
      open: Number(open.toFixed(6)),
      high: Number(high.toFixed(6)),
      low: Number(low.toFixed(6)),
      close: Number(close.toFixed(6))
    });
    price = close;
  }
  return candles;
}

module.exports = { getPrice, getSymbols, getCandles };