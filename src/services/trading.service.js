const prisma = require("../config/database");
const market = require("../market/prices");

async function createMarketOrder(userId, { symbol, side, quantity }) {
  const normalized = symbol.toUpperCase();
  const price = market.getPrice(normalized);

  if (!price) {
    const err = new Error("Unsupported symbol");
    err.status = 400;
    throw err;
  }

  const notional = price * quantity;
  if (!Number.isFinite(notional) || notional <= 0) {
    const err = new Error("Invalid order size");
    err.status = 400;
    throw err;
  }

  return prisma.$transaction(async tx => {
    const account = await tx.account.findUnique({ where: { userId } });
    if (!account) throw new Error("Trading account not found");

    // Demo account: reserve the full notional for BUY orders.
    if (side === "BUY" && account.balance < notional) {
      const err = new Error("Insufficient demo balance");
      err.status = 400;
      throw err;
    }

    const order = await tx.order.create({
      data: {
        userId,
        symbol: normalized,
        side,
        type: "MARKET",
        quantity,
        price,
        filledPrice: price,
        status: "FILLED"
      }
    });

    const positionSide = side === "BUY" ? "LONG" : "SHORT";
    const existing = await tx.position.findFirst({
      where: { userId, symbol: normalized, side: positionSide }
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      const newEntry = ((existing.quantity * existing.entryPrice) + (quantity * price)) / newQty;

      await tx.position.update({
        where: { id: existing.id },
        data: {
          quantity: newQty,
          entryPrice: newEntry,
          currentPrice: price,
          unrealizedPnl: positionSide === "LONG"
            ? (price - newEntry) * newQty
            : (newEntry - price) * newQty
        }
      });
    } else {
      await tx.position.create({
        data: {
          userId,
          symbol: normalized,
          side: positionSide,
          quantity,
          entryPrice: price,
          currentPrice: price,
          unrealizedPnl: 0
        }
      });
    }

    if (side === "BUY") {
      await tx.account.update({
        where: { userId },
        data: { balance: { decrement: notional } }
      });
    }

    await tx.transaction.create({
      data: {
        userId,
        type: "TRADE",
        amount: side === "BUY" ? -notional : notional,
        reference: order.id
      }
    });

    return order;
  });
}

async function refreshPositions(userId) {
  const positions = await prisma.position.findMany({ where: { userId } });

  for (const p of positions) {
    const currentPrice = market.getPrice(p.symbol);
    if (!currentPrice) continue;

    const pnl = p.side === "LONG"
      ? (currentPrice - p.entryPrice) * p.quantity
      : (p.entryPrice - currentPrice) * p.quantity;

    await prisma.position.update({
      where: { id: p.id },
      data: { currentPrice, unrealizedPnl: pnl }
    });
  }
}

async function closePosition(userId, positionId) {
  return prisma.$transaction(async tx => {
    const position = await tx.position.findFirst({
      where: { id: positionId, userId }
    });

    if (!position) {
      const err = new Error("Position not found");
      err.status = 404;
      throw err;
    }

    const price = market.getPrice(position.symbol);
    if (!price) throw new Error("Market price unavailable");

    const pnl = position.side === "LONG"
      ? (price - position.entryPrice) * position.quantity
      : (position.entryPrice - price) * position.quantity;

    const order = await tx.order.create({
      data: {
        userId,
        symbol: position.symbol,
        side: position.side === "LONG" ? "SELL" : "BUY",
        type: "MARKET",
        quantity: position.quantity,
        price,
        filledPrice: price,
        status: "FILLED"
      }
    });

    // Return original BUY notional plus P&L in this simplified demo ledger.
    const released = position.entryPrice * position.quantity + pnl;

    await tx.account.update({
      where: { userId },
      data: { balance: { increment: released } }
    });

    await tx.transaction.create({
      data: {
        userId,
        type: "TRADE",
        amount: released,
        reference: order.id
      }
    });

    await tx.position.delete({ where: { id: position.id } });

    return { order, realizedPnl: pnl };
  });
}

module.exports = { createMarketOrder, refreshPositions, closePosition };