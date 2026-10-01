const router = require("express").Router();
const prisma = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { refreshPositions, closePosition } = require("../services/trading.service");

router.get("/", requireAuth, async (req, res, next) => {
  try {
    await refreshPositions(req.user.id);
    const positions = await prisma.position.findMany({
      where: { userId: req.user.id },
      orderBy: { openedAt: "desc" }
    });
    res.json({ positions });
  } catch (e) { next(e); }
});

router.post("/:id/close", requireAuth, async (req, res, next) => {
  try {
    const result = await closePosition(req.user.id, req.params.id);
    res.json({ ...result, mode: "DEMO" });
  } catch (e) { next(e); }
});

module.exports = router;