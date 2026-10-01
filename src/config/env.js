const dotenv = require("dotenv");
dotenv.config();

const required = ["JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS || 7),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5500",
  startingBalance: Number(process.env.STARTING_BALANCE || 10000)
};