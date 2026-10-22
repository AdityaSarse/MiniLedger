import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

type OtpRecord = {
  otpHash: string;
  expiresAt: number;
  nextAllowedAt: number;
  attempts: number;
};

const otpStore = new Map<string, OtpRecord>();

const JWT_SECRET = process.env.JWT_SECRET;
const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET;

if (!JWT_SECRET) throw new Error("JWT_SECRET is missing from .env");
if (!OTP_HASH_SECRET) {
  throw new Error("OTP_HASH_SECRET is missing from .env");
}

const OTP_EXPIRY_MS =
  Number(process.env.OTP_EXPIRY_MINUTES ?? 5) * 60 * 1000;

const OTP_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function hashOtp(phone: string, otp: string): string {
  return createHmac("sha256", OTP_HASH_SECRET!)
    .update(`${phone}:${otp}`)
    .digest("hex");
}

function matchesOtp(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");

  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export async function sendOtp(phone: string) {
  const now = Date.now();
  const existing = otpStore.get(phone);

  if (existing && now < existing.nextAllowedAt) {
    throw new Error("Please wait before requesting another OTP");
  }

  const otp = randomInt(100000, 1000000).toString();

  otpStore.set(phone, {
    otpHash: hashOtp(phone, otp),
    expiresAt: now + OTP_EXPIRY_MS,
    nextAllowedAt: now + OTP_COOLDOWN_MS,
    attempts: 0,
  });

  // Required for the mock OTP assignment. Never log OTPs in production.
  console.log(`[MiniLedger] Mock OTP for ${phone}: ${otp}`);

  return { message: "OTP sent successfully" };
}

export async function verifyOtp(phone: string, otp: string) {
  const record = otpStore.get(phone);

  if (!record || Date.now() >= record.expiresAt) {
    otpStore.delete(phone);
    throw new Error("OTP is invalid or expired");
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(phone);
    throw new Error("Too many OTP attempts. Request a new OTP");
  }

  record.attempts++;

  const suppliedHash = hashOtp(phone, otp);

  if (!matchesOtp(record.otpHash, suppliedHash)) {
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(phone);
      throw new Error("Too many OTP attempts. Request a new OTP");
    }

    throw new Error("Invalid OTP");
  }

  otpStore.delete(phone);

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  const token = jwt.sign(
    { userId: user.id },
    JWT_SECRET!,
    { expiresIn: "1d" }
  );

  return {
    message: "Login successful",
    token,
    user: { id: user.id, phone: user.phone },
  };
}
