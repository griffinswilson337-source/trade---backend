# TradeX Backend

A VS Code-ready Node.js/Express backend for a demo/paper trading platform.

## What is included

- User registration and login
- Password hashing with bcrypt
- JWT access tokens
- Rotating refresh sessions
- SQLite database through Prisma
- Demo trading account
- Market price service
- Candle endpoint
- Market BUY/SELL orders
- Positions and unrealized P&L
- Position closing and realized P&L
- Transaction ledger
- Rate limiting
- Helmet security headers
- CORS
- Zod request validation
- Central error handling
- Health endpoint

## Important

This project is intentionally **DEMO/PAPER TRADING**. The market service uses generated demo prices. It does not move real money and it is not connected to a broker or exchange.

For a real-money deployment, replace the market service with an official licensed broker/exchange API and implement the applicable KYC/AML, custody, payments, risk, compliance, monitoring, and security controls.

## Requirements

- Node.js 20+
- VS Code
- npm

## Setup

1. Open this folder in VS Code.
2. Open the terminal.
3. Install packages:

```bash
npm install
```

4. Create your environment file:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

5. Change `JWT_SECRET` in `.env` to a long random value.

6. Create the database:

```bash
npx prisma migrate dev --name init
```

7. Start the server:

```bash
npm run dev
```

The API will run on:

`http://localhost:5000`

## Test

Health:

```http
GET http://localhost:5000/api/health
```

Register:

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Demo User",
  "email": "demo@example.com",
  "password": "Password123!"
}
```

Login:

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "Password123!"
}
```

Use the returned `accessToken`:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Get account:

```http
GET http://localhost:5000/api/account
```

Get symbols:

```http
GET http://localhost:5000/api/market/symbols
```

Place a demo order:

```http
POST http://localhost:5000/api/orders
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "symbol": "EURUSD",
  "side": "BUY",
  "type": "MARKET",
  "quantity": 1000
}
```

Get positions:

```http
GET http://localhost:5000/api/positions
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Connecting your existing frontend

Your frontend should call:

```javascript
const API_URL = "http://localhost:5000/api";
```

Example login:

```javascript
const response = await fetch(`${API_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email,
    password
  })
});

const data = await response.json();
localStorage.setItem("accessToken", data.accessToken);
```

Example order:

```javascript
await fetch(`${API_URL}/orders`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
  },
  body: JSON.stringify({
    symbol: "EURUSD",
    side: "BUY",
    type: "MARKET",
    quantity: 1000
  })
});
```
