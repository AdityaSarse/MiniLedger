# MiniLedger — Personal Loan Tracker

A full-stack mobile application that helps users track money lent to friends, monitor due dates, record repayments, and view outstanding balances.

MiniLedger is built with React Native and Expo on the frontend, Node.js and Express on the backend, and PostgreSQL with Prisma ORM for data persistence.

---

## Features

- **Phone authentication**: Mock OTP-based login with JWT authentication.
- **Loan management**: Create and view personal loan records.
- **Repayment tracking**: Mark pending loans as repaid.
- **Overdue detection**: Identify pending loans past their due dates.
- **Financial summary**: View total amount lent, total amount repaid, and overdue amount.
- **User data isolation**: Authenticated users can access only their own loan records.
- **Session persistence**: Securely store the authentication token on the mobile device.
- **Input validation**: Validate phone numbers, loan amounts, and due dates.
- **API security**: Helmet security headers, request-size limits, and protected routes.
- **Automated tests**: Backend API tests using Vitest and Supertest.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Mobile frontend** | React Native, Expo, TypeScript |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | Mock OTP, JSON Web Tokens (JWT) |
| **Validation** | Zod |
| **Mobile storage** | Expo SecureStore |
| **Testing** | Vitest, Supertest |
| **Security** | Helmet |

---

## Project Structure

```text
MiniLedger/
├── Backend/
│   ├── prisma/
│   ├── src/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── mobile/
│   ├── app/
│   ├── src/
│   │   ├── api/
│   │   └── screens/
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## Prerequisites

Install the following before running the project:
- **Node.js and npm** (v18+ or v20+)
- **PostgreSQL**
- **Expo Go** on your mobile phone
- **Git**

---

## Getting Started

### 1. Clone the repository
```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd MiniLedger
```
*(Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.)*

### 2. Configure the backend
```bash
cd Backend
npm install
```
Create a `.env` file using `.env.example` as a reference.

Configure the following variables:
```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/miniledger?schema=public
PORT=5000
JWT_SECRET=your_random_jwt_secret
OTP_HASH_SECRET=your_different_random_otp_secret
OTP_EXPIRY_MINUTES=5
CORS_ORIGINS=
```
Use your local PostgreSQL credentials. URL-encode special characters in the database password when required.

### 3. Set up the database
Create a PostgreSQL database named `miniledger`.

Apply the existing migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```
*(If you are setting up a fresh development database and no migration exists yet, create the initial migration using your Prisma development workflow.)*

### 4. Start the backend
```bash
npm run dev
```
The API should run on port 5000, unless another port is configured.

**Health check:**
```http
GET http://localhost:5000/health
```
Expected response:
```json
{
  "status": "ok",
  "app": "MiniLedger"
}
```

### 5. Configure the mobile application
Open another terminal:
```bash
cd mobile
npm install
```
Create `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:5000
```
Replace `YOUR_COMPUTER_LAN_IP` with your computer's current local network IP address (check via `ipconfig` on Windows).

For a physical phone, connect the phone and computer to the same Wi-Fi network. Ensure the backend is listening on `0.0.0.0` and that your firewall permits the connection.

### 6. Run the mobile app
```bash
npx expo start
```
Scan the QR code using **Expo Go**.

---

## API Documentation

All protected loan endpoints require a valid JWT:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Authentication

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| `POST` | `/auth/send-otp` | Request a mock OTP | No |
| `POST` | `/auth/verify-otp` | Verify OTP and receive a JWT | No |
| `GET` | `/auth/me` | Validate the current session | Yes |

**Example: Request an OTP (`POST /auth/send-otp`)**
```json
{
  "phone": "+919876543210"
}
```

**Example: Verify an OTP (`POST /auth/verify-otp`)**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```
*Note: The OTP above is an example only. The actual mock OTP is printed in the backend terminal.*

---

### Loan Management

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/loans` | Create a loan |
| `GET` | `/loans` | List the authenticated user's loans |
| `PATCH` | `/loans/:id/repay` | Mark a loan as repaid |
| `GET` | `/loans/summary` | Retrieve financial summary totals |

**Example: Create a loan (`POST /loans`)**
```json
{
  "friendName": "Rahul",
  "amount": 1500,
  "dueDate": "2026-11-15T00:00:00.000Z"
}
```
*The `dueDate` should be a valid ISO 8601 datetime with a timezone offset.*

**Example summary response (`GET /loans/summary`)**
```json
{
  "totalLent": 5000,
  "totalRepaid": 1500,
  "overdueAmount": 500
}
```
*The example amounts are illustrative; actual totals depend on the authenticated user's database records.*

---

## Financial Calculations

- **Total lent**: Sum of all recorded loans, including loans already repaid.
- **Total repaid**: Sum of loans marked as repaid.
- **Overdue amount**: Sum of pending loans whose due dates have passed.

Amounts are stored using PostgreSQL decimal precision to avoid typical floating-point storage errors.

---

## Authentication and Security

- OTP verification issues a JWT for authenticated requests.
- OTPs expire and are intended for one-time use.
- OTP attempts and resend cooldowns are limited in the mock implementation.
- Loan operations are scoped to the authenticated user.
- Helmet adds security-related HTTP headers.
- Request payload size is limited.
- Mobile authentication tokens are stored using Expo SecureStore.

> **Important limitation**: This project uses a mock OTP delivered through the backend terminal, not a real SMS provider. Its in-memory OTP storage and rate limiting are suitable only for a limited demonstration, not a horizontally scaled production service. A production deployment should use shared rate limiting, monitoring, secure OTP delivery, HTTPS, and appropriate secret management.

---

## Testing

Run the backend tests from the `Backend` directory:
```bash
npx vitest run
```

**Current test result: 12 tests passing.**

```text
 ✓ tests/api.test.ts (12 tests)
   ✓ MiniLedger API (12)
     ✓ returns a healthy status
     ✓ rejects invalid phone number on send-otp
     ✓ rejects invalid OTP on verify-otp
     ✓ rejects expired JWT token
     ✓ rejects unauthenticated loan requests
     ✓ creates a loan for the authenticated user
     ✓ rejects an invalid loan
     ✓ lists only the authenticated user's loans and does not expose other users' loans
     ✓ does not allow one user to repay another user's loan
     ✓ marks a loan as repaid
     ✓ returns 409 when loan is repaid twice
     ✓ calculates summary correctly and excludes repaid loans from overdue amount
```

The tests cover implemented API functionality, including health checks, authentication requirements, loan creation, validation, repayment, and summary calculations.

*Use a dedicated test database (`miniledger_test`) when running integration tests that create or delete database records.*

---

## Future Improvements

- Real SMS OTP integration
- Receipt photo upload
- Pagination and search
- Push notifications for upcoming due dates
- Deployment with managed PostgreSQL
- Expanded security and integration testing

---
