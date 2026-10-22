import "dotenv/config";
import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../src/app";
import { prisma } from "../src/lib/prisma";

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET must be configured for tests");
}

let userId: string;
let token: string;
let phone: string;

let userBId: string;
let tokenB: string;
let phoneB: string;

beforeAll(async () => {
  await prisma.$connect();

  phone = `+9199${Date.now().toString().slice(-8)}`;
  const user = await prisma.user.create({
    data: { phone },
  });
  userId = user.id;
  token = jwt.sign({ userId }, secret, { expiresIn: "1h" });

  phoneB = `+9198${(Date.now() + 1).toString().slice(-8)}`;
  const userB = await prisma.user.create({
    data: { phone: phoneB },
  });
  userBId = userB.id;
  tokenB = jwt.sign({ userId: userBId }, secret, { expiresIn: "1h" });
});

beforeEach(async () => {
  await prisma.loan.deleteMany({
    where: { userId: { in: [userId, userBId] } },
  });
});

afterAll(async () => {
  await prisma.loan.deleteMany({ where: { userId: { in: [userId, userBId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, userBId] } } });
  await prisma.$disconnect();
});

describe("MiniLedger API", () => {
  it("returns a healthy status", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("rejects invalid phone number on send-otp", async () => {
    const res = await request(app)
      .post("/auth/send-otp")
      .send({ phone: "invalid-number" });

    expect(res.status).toBe(400);
  });

  it("rejects invalid OTP on verify-otp", async () => {
    const testPhone = `+9197${Date.now().toString().slice(-8)}`;
    await request(app).post("/auth/send-otp").send({ phone: testPhone });

    const res = await request(app)
      .post("/auth/verify-otp")
      .send({ phone: testPhone, otp: "000000" });

    expect(res.status).toBe(401);
  });

  it("rejects expired JWT token", async () => {
    const expiredToken = jwt.sign({ userId }, secret, { expiresIn: "-1s" });

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated loan requests", async () => {
    const res = await request(app).get("/loans");

    expect(res.status).toBe(401);
  });

  it("creates a loan for the authenticated user", async () => {
    const res = await request(app)
      .post("/loans")
      .set("Authorization", `Bearer ${token}`)
      .send({
        friendName: "Rahul",
        amount: 2500,
        dueDate: "2026-10-30T00:00:00.000Z",
      });

    expect(res.status).toBe(201);
    expect(res.body.loan.friendName).toBe("Rahul");
    expect(Number(res.body.loan.amount)).toBe(2500);
    expect(res.body.loan.userId).toBe(userId);
  });

  it("rejects an invalid loan", async () => {
    const res = await request(app)
      .post("/loans")
      .set("Authorization", `Bearer ${token}`)
      .send({
        friendName: "",
        amount: -100,
        dueDate: "invalid",
      });

    expect(res.status).toBe(400);
  });

  it("lists only the authenticated user's loans and does not expose other users' loans", async () => {
    // Loan for User A
    await prisma.loan.create({
      data: {
        userId,
        friendName: "Priya",
        amount: "1200.00",
        dueDate: new Date("2026-11-30T00:00:00.000Z"),
      },
    });

    // Loan for User B
    await prisma.loan.create({
      data: {
        userId: userBId,
        friendName: "Secret Friend of B",
        amount: "9999.00",
        dueDate: new Date("2026-11-30T00:00:00.000Z"),
      },
    });

    const res = await request(app)
      .get("/loans")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.loans[0].friendName).toBe("Priya");
  });

  it("does not allow one user to repay another user's loan", async () => {
    // Create loan owned by User B
    const loanB = await prisma.loan.create({
      data: {
        userId: userBId,
        friendName: "User B Friend",
        amount: "5000.00",
        dueDate: new Date("2026-12-01T00:00:00.000Z"),
        status: "PENDING",
      },
    });

    // User A attempts to repay User B's loan
    const res = await request(app)
      .patch(`/loans/${loanB.id}/repay`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);

    // Verify loan B status is still PENDING in database
    const verifyLoan = await prisma.loan.findUnique({
      where: { id: loanB.id },
    });
    expect(verifyLoan?.status).toBe("PENDING");
  });

  it("marks a loan as repaid", async () => {
    const loan = await prisma.loan.create({
      data: {
        userId,
        friendName: "Amit",
        amount: "800.00",
        dueDate: new Date("2026-11-30T00:00:00.000Z"),
      },
    });

    const res = await request(app)
      .patch(`/loans/${loan.id}/repay`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.loan.status).toBe("REPAID");
    expect(res.body.loan.repaidAt).toBeTruthy();
  });

  it("returns 409 when loan is repaid twice", async () => {
    const loan = await prisma.loan.create({
      data: {
        userId,
        friendName: "Double Repay Friend",
        amount: "1500.00",
        dueDate: new Date("2026-11-30T00:00:00.000Z"),
        status: "REPAID",
        repaidAt: new Date(),
      },
    });

    const res = await request(app)
      .patch(`/loans/${loan.id}/repay`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Loan has already been repaid");
  });

  it("calculates summary correctly and excludes repaid loans from overdue amount", async () => {
    await prisma.loan.createMany({
      data: [
        {
          userId,
          friendName: "Overdue Pending Friend",
          amount: "1000.00",
          dueDate: new Date("2020-01-01T00:00:00.000Z"),
          status: "PENDING",
        },
        {
          userId,
          friendName: "Overdue But Repaid Friend",
          amount: "500.00",
          dueDate: new Date("2020-01-01T00:00:00.000Z"),
          status: "REPAID",
          repaidAt: new Date(),
        },
        {
          userId,
          friendName: "Future Pending Friend",
          amount: "2000.00",
          dueDate: new Date("2030-01-01T00:00:00.000Z"),
          status: "PENDING",
        },
      ],
    });

    const res = await request(app)
      .get("/loans/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalLent).toBe(3500);
    expect(res.body.totalRepaid).toBe(500);
    expect(res.body.overdueAmount).toBe(1000);
  });
});
