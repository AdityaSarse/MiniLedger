# MiniLedger — Personal Loan Tracker

<div align="center">

![MiniLedger Banner](mobile/baner.png)

### *Keep money and friendships crystal clear.*

A full-stack, mobile-first fintech application engineered to track money lent to friends, monitor due dates, record repayments, and view real-time outstanding balances.

[![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-58-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-6.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Tests-12_Passed-22C55E?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

</div>

---

## 📌 Overview

Lending money to friends often creates awkward tracking situations, forgotten due dates, and lost ledgers. **MiniLedger** eliminates this friction with a focused personal loan tracker designed around simplicity, transparency, and data integrity.

Built with a modern fintech aesthetic inspired by clean digital wallets, MiniLedger provides instant financial clarity through an interactive summary card, real-time overdue detection, and single-tap repayment logging.

---

## 📱 App Preview

<div align="center">

![MiniLedger App Preview](mobile/page.png)

*MiniLedger user journey: phone & OTP verification, dark-navy hero summary dashboard, and streamlined loan creation form.*

</div>

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Mock OTP Authentication** | Passwordless phone login with HMAC-hashed OTP verification, resend cooldowns, and maximum-attempt guardrails. |
| 🛡️ **JWT-Protected API** | Stateless authorization using signed JSON Web Tokens, validating user sessions on every privileged request. |
| 📊 **Financial Summary Card** | Real-time calculation of **Total Lent**, **Total Repaid**, and **Overdue Amount** directly aggregated in PostgreSQL. |
| ⏰ **Overdue Detection** | Automated date-comparison logic flags pending loans that have crossed their maturity date with distinct warning indicators. |
| 👥 **Strict Data Isolation** | Multi-tenant tenant scoping ensures each user strictly views and manages only their own records. |
| 💳 **One-Tap Repayment** | Mark outstanding loans as repaid instantly with concurrency safeguards preventing duplicate repayment states. |
| 🔒 **Encrypted Mobile Session** | Secure auth token persistence via device-native keychain storage using `expo-secure-store`. |
| ✅ **Automated Test Coverage** | 12 automated integration tests verifying authentication, authorization boundaries, validation, and aggregations. |

---

## 🛠️ Technology Stack

### Mobile Client
- **Framework:** React Native 0.88 with Expo SDK 58 (Expo Router)
- **Language:** TypeScript 5.x
- **UI & Layout:** Vanilla React Native StyleSheet with custom Design Token System ([`theme.ts`](mobile/src/theme.ts))
- **Gradients:** `expo-linear-gradient`
- **Security & Storage:** `expo-secure-store` (hardware-backed storage)
- **Networking:** Native fetch with strongly typed wrapper and error discrimination

### Backend API
- **Runtime:** Node.js (v18+ or v20+) with TypeScript
- **Framework:** Express.js 5.x
- **Database & ORM:** PostgreSQL with Prisma ORM 6.x (`@prisma/adapter-pg`)
- **Validation:** Zod 4.x schema validation on all inputs
- **Authentication:** HMAC-SHA256 OTP hashing with `timingSafeEqual` and JSON Web Tokens (`jsonwebtoken`)
- **Security:** Helmet HTTP protection headers, dynamic CORS validation, and 10kb JSON payload size capping
- **Testing:** Vitest 5.x with Supertest 7.x

---

## 🏗️ Architecture & Project Structure

MiniLedger adheres to a clean client-server architecture with strict separation of concerns:

```text
MiniLedger/
├── Backend/                        # Node.js + Express REST API
│   ├── prisma/
│   │   ├── migrations/             # Timestamped SQL migrations
│   │   └── schema.prisma           # Database schema (User, Loan models)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── prisma.ts           # PrismaClient instance & connection pooling
│   │   │   └── validation.ts       # Zod schemas (phone, OTP, loan payloads)
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts   # JWT verification & req.userId attachment
│   │   ├── routes/
│   │   │   ├── authRoutes.ts       # /auth/send-otp, /auth/verify-otp
│   │   │   └── loanRoutes.ts       # /loans, /loans/summary, /loans/:id/repay
│   │   ├── services/
│   │   │   └── authService.ts      # HMAC OTP store, attempt tracker & cooldown
│   │   ├── app.ts                  # Express configuration, Helmet, CORS & routes
│   │   └── server.ts               # Network listener bound to 0.0.0.0
│   ├── tests/
│   │   └── api.test.ts             # 12 Vitest + Supertest integration tests
│   ├── .env.example                # Backend environment template
│   └── package.json
│
├── mobile/                         # React Native / Expo Application
│   ├── app/
│   │   ├── _layout.tsx             # Root Expo Router layout
│   │   └── index.tsx               # Session recovery & screen coordinator
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts           # Type-safe API client with SecureStore integration
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx     # Phone + individual OTP digit boxes
│   │   │   ├── DashboardScreen.tsx # Navy hero card, loan list, and repaid actions
│   │   │   └── AddLoanScreen.tsx   # Label-above-input loan creation form
│   │   └── theme.ts                # Centralized design tokens (colors, typography, radii)
│   ├── banner.png                  # Repository hero banner
│   ├── page.png                    # App preview collage
│   ├── .env.example                # Mobile environment template
│   └── package.json
│
├── .gitignore                      # Comprehensive root Git exclusions
└── README.md                       # Project documentation
```

---

## 📋 Prerequisites

Ensure the following tools are installed on your workstation before setup:

- **Node.js** (v18.0.0 or v20.x LTS) & **npm** (v9+)
- **PostgreSQL** (v14+ running locally or via Docker)
- **Expo Go** app installed on your physical iOS or Android mobile device
- **Git**

---

## 🚀 Installation & Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/AdityaSarse/MiniLedger.git
cd MiniLedger
```

---

### 2. Configure & Run Backend

#### A. Install Backend Dependencies
```bash
cd Backend
npm install
```

#### B. Setup Environment Variables
Create a `.env` file in the `Backend` directory:
```bash
cp .env.example .env
```

Configure your local database credentials and cryptographic secrets:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/miniledger?schema=public"
PORT=5000
JWT_SECRET="replace_with_a_long_random_jwt_secret_key"
OTP_HASH_SECRET="replace_with_a_different_random_secret_for_otp_hashing"
OTP_EXPIRY_MINUTES=5
CORS_ORIGINS=""
```

> [!TIP]
> If your PostgreSQL password contains special symbols (such as `@`, `#`, or `/`), make sure to URL-encode them in the `DATABASE_URL`.

#### C. Database Migration & Prisma Generation
Create the `miniledger` database in PostgreSQL, then apply migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

#### D. Start Backend Server
```bash
npm run dev
```

The backend server starts on port `5000` listening on `0.0.0.0` (all network interfaces).

Verify the health check in your browser or terminal:
```bash
curl http://localhost:5000/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "app": "MiniLedger"
}
```

---

### 3. Configure & Run Mobile Application

#### A. Install Mobile Dependencies
Open a second terminal window:
```bash
cd mobile
npm install
```

#### B. Setup Environment Variables
Create a `.env` file in the `mobile` directory:
```bash
cp .env.example .env
```

Set the backend API URL using your computer's **Local Network IP address**:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000
```

> [!IMPORTANT]
> **Connecting from a physical phone:**
> 1. Connect both your development computer and your mobile phone to the **same Wi-Fi network**.
> 2. Find your computer's LAN IP:
>    - **Windows:** Run `ipconfig` in PowerShell and look for `IPv4 Address` under your active Wi-Fi adapter (e.g., `192.168.x.x` or `10.x.x.x`).
>    - **macOS / Linux:** Run `ifconfig` or `ip a`.
> 3. Replace `192.168.1.100` in `mobile/.env` with your actual LAN IP.
> 4. Ensure Windows Defender Firewall allows incoming connections on port `5000`.

#### C. Launch Expo Development Server
```bash
npx expo start --clear
```

Open **Expo Go** on your phone:
- **Android:** Scan the QR code shown in your terminal.
- **iOS:** Open the native Camera app and tap the Expo banner.

---

## 📡 API Reference

All protected endpoints require an `Authorization` header containing a valid Bearer token:
```http
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### 1. Request OTP
- **Method:** `POST`
- **Path:** `/auth/send-otp`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "phone": "+919876543210"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "OTP sent successfully"
  }
  ```
- **Terminal Output (Mock Delivery):**
  ```text
  [MiniLedger] Mock OTP for +919876543210: 482915
  ```

#### 2. Verify OTP & Receive Token
- **Method:** `POST`
- **Path:** `/auth/verify-otp`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "phone": "+919876543210",
    "otp": "482915"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cm7d0abc1234567890",
      "phone": "+919876543210"
    }
  }
  ```

#### 3. Session Validation
- **Method:** `GET`
- **Path:** `/auth/me`
- **Auth Required:** Yes
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Authenticated successfully",
    "userId": "cm7d0abc1234567890"
  }
  ```

---

### Loan Management Endpoints

#### 4. Create Loan
- **Method:** `POST`
- **Path:** `/loans`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "friendName": "Rahul Sharma",
    "amount": 2500,
    "dueDate": "2026-11-30T00:00:00.000Z"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "message": "Loan created successfully",
    "loan": {
      "id": "loan_cm7d1xyz987654321",
      "userId": "cm7d0abc1234567890",
      "friendName": "Rahul Sharma",
      "amount": "2500.00",
      "dueDate": "2026-11-30T00:00:00.000Z",
      "status": "PENDING",
      "repaidAt": null,
      "createdAt": "2026-10-23T00:30:00.000Z",
      "updatedAt": "2026-10-23T00:30:00.000Z"
    }
  }
  ```

#### 5. List Authenticated User's Loans
- **Method:** `GET`
- **Path:** `/loans`
- **Auth Required:** Yes
- **Success Response (`200 OK`):**
  ```json
  {
    "count": 1,
    "loans": [
      {
        "id": "loan_cm7d1xyz987654321",
        "userId": "cm7d0abc1234567890",
        "friendName": "Rahul Sharma",
        "amount": "2500.00",
        "dueDate": "2026-11-30T00:00:00.000Z",
        "status": "PENDING",
        "repaidAt": null,
        "createdAt": "2026-10-23T00:30:00.000Z"
      }
    ]
  }
  ```

#### 6. Financial Summary Metrics
- **Method:** `GET`
- **Path:** `/loans/summary`
- **Auth Required:** Yes
- **Calculation Details:**
  - `totalLent`: Aggregate sum of all loans created by the user (both pending and repaid).
  - `totalRepaid`: Aggregate sum of loans with `status = "REPAID"`.
  - `overdueAmount`: Aggregate sum of loans with `status = "PENDING"` and `dueDate < current_timestamp`.
- **Success Response (`200 OK`):**
  ```json
  {
    "totalLent": 7500,
    "totalRepaid": 5000,
    "overdueAmount": 2500
  }
  ```

#### 7. Mark Loan as Repaid
- **Method:** `PATCH`
- **Path:** `/loans/:id/repay`
- **Auth Required:** Yes
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Loan marked as repaid",
    "loan": {
      "id": "loan_cm7d1xyz987654321",
      "status": "REPAID",
      "repaidAt": "2026-10-23T01:00:00.000Z"
    }
  }
  ```
- **Error Response (`409 Conflict`):** Returned if the loan has already been marked as repaid.

---

## 🔒 Security & Architecture Principles

- **HMAC OTP Storage:** In-memory OTPs are hashed using SHA-256 HMAC with an isolated secret (`OTP_HASH_SECRET`). Plaintext OTPs are never retained in server state.
- **Timing-Safe Comparison:** OTP hashes are verified using `crypto.timingSafeEqual` to safeguard against timing side-channel attacks.
- **Brute-Force Protection:** Rate limiting enforces a **60-second resend cooldown** and limits failed verification attempts to **5 tries** before automatic invalidation.
- **Mock OTP Transparency:** Designed for local evaluation; OTPs are outputted directly to the backend terminal log.
- **Tenant Isolation:** Every loan query (`SELECT`, `UPDATE`, `AGGREGATE`) is explicitly scoped to `authReq.userId`. Users cannot read or modify another user's loan data.
- **Defensive HTTP Configuration:** Express uses Helmet for protective HTTP headers and restricts request bodies to `10kb`.
- **Hardware-Backed Device Storage:** JWTs are stored in iOS Keychain and Android Keystore via `expo-secure-store`, preventing token extraction from disk backups.

---

## 🧪 Automated Testing

MiniLedger maintains a comprehensive integration test suite built with **Vitest** and **Supertest**, directly validating the Express application against a dedicated test database (`miniledger_test`).

### Run Tests
```bash
cd Backend
npm test
```

### Verified Test Suite (12 Passing Tests)

```text
 ✓ tests/api.test.ts (12 tests) 284ms
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

 Test Files  1 passed (1)
      Tests  12 passed (12)
```

---

## 🗺️ Known Limitations & Future Roadmap

- [ ] **Production SMS Gateway:** Transition mock OTP console delivery to a live SMS provider (Twilio, AWS SNS, or Firebase Auth).
- [ ] **Distributed Cache:** Migrate in-memory OTP stores and rate limits to Redis for horizontal backend clustering.
- [ ] **Push Reminders:** Implement Expo push notifications to proactively alert lenders 24 hours prior to a loan's due date.
- [ ] **Partial Repayments:** Support installment-based repayments with an audit log of micro-payments.
- [ ] **Receipt & Proof Upload:** Attach transaction screenshots or UPI payment receipts to loans via cloud object storage (S3/R2).
- [ ] **Export Records:** Generate monthly PDF or CSV ledger statements for download.

---

## 👤 Author

**Aditya Sarse**
- GitHub: [@AdityaSarse](https://github.com/AdityaSarse)
- Project Repository: [AdityaSarse/MiniLedger](https://github.com/AdityaSarse/MiniLedger)

---

---

## 📄 License

This project was developed as a take-home assignment.