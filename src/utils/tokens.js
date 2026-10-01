const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

function createAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function createRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { createAccessToken, createRefreshToken, hashToken };