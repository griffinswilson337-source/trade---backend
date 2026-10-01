const router = require("express").Router();
const bcrypt = require("bcryptjs");
const prisma = require("../config/database");
const env = require("../config/env");
const validate = require("../middleware/validate");
const { createAccessToken, createRefreshToken, hashToken } = require("../utils/tokens");
const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().transform(v => v.toLowerCase()),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email().transform(v => v.toLowerCase()),
  password: z.string().min(1)
});

async function issueSession(userId) {
  const refresh = createRefreshToken();
  const expiresAt = new Date(Date.now() + env.refreshTokenDays * 86400000);

  await prisma.session.create({
    data: { userId, tokenHash: hashToken(refresh), expiresAt }
  });

  return { accessToken: createAccessToken(userId), refreshToken: refresh };
}

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        account: { create: { balance: env.startingBalance, equity: env.startingBalance } }
      },
      select: { id: true, name: true, email: true }
    });

    const tokens = await issueSession(user.id);
    res.status(201).json({ user, ...tokens, mode: "DEMO" });
  } catch (e) { next(e); }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const tokens = await issueSession(user.id);
    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      ...tokens,
      mode: "DEMO"
    });
  } catch (e) { next(e); }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.body.refreshToken;
    if (!token) return res.status(400).json({ error: "Refresh token required" });

    const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    await prisma.session.delete({ where: { id: session.id } });
    const tokens = await issueSession(session.userId);
    res.json(tokens);
  } catch (e) { next(e); }
});

module.exports = router;