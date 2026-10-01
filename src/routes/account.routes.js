const router = require("express").Router();
const prisma = require("../config/database");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const account = await prisma.account.findUnique({
      where: { userId: req.user.id }
    });
    res.json({ account, mode: "DEMO" });
  } catch (e) { next(e); }
});

router.get("/transactions", requireAuth, async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json({ transactions });
  } catch (e) { next(e); }
});

module.exports = router;