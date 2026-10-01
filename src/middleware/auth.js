const jwt = require("jsonwebtoken");
const prisma = require("../config/database");
const env = require("../config/env");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ error: "Authentication required" });

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true }
    });

    if (!user) return res.status(401).json({ error: "Invalid authentication" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}

module.exports = { requireAuth };