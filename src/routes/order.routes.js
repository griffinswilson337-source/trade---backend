const router = require("express").Router();
const { z } = require("zod");
const prisma = require("../config/database");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { createMarketOrder } = require("../services/trading.service");

const orderSchema = z.object({
  symbol: z.string().min(2).max(20),
  side: z.enum(["BUY", "SELL"]),
  type: z.literal("MARKET"),
  quantity: z.number().positive().finite()
});

router.post("/", requireAuth, validate(orderSchema), async (req, res, next) => {
  try {
    const order = await createMarketOrder(req.user.id, req.body);
    res.status(201).json({ order, mode: "DEMO" });
  } catch (e) { next(e); }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json({ orders });
  } catch (e) { next(e); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ order });
  } catch (e) { next(e); }
});

module.exports = router;