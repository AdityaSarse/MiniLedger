import { z } from "zod";

function normalizePhoneNumber(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const cleaned = raw.trim().replace(/[\s-]/g, "");
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (!cleaned.startsWith("+") && /^\d+$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return cleaned;
}

export const phoneSchema = z.object({
  phone: z.preprocess(
    normalizePhoneNumber,
    z.string().regex(
      /^\+[1-9]\d{7,14}$/,
      "Enter a valid 10-digit mobile number or full international format (e.g. +919876543210)",
    ),
  ),
});

export const verifyOtpSchema = z.object({
  phone: z.preprocess(
    normalizePhoneNumber,
    z.string().regex(/^\+[1-9]\d{7,14}$/, "Valid phone number required"),
  ),
  otp: z.string().regex(/^\d{6}$/, "OTP must be six digits"),
});

export const createLoanSchema = z.object({
  friendName: z
    .string()
    .trim()
    .min(1, "Friend name is required")
    .max(100, "Friend name must be 100 characters or fewer"),

  amount: z.coerce
    .number()
    .finite()
    .positive("Amount must be greater than zero")
    .max(9999999999.99, "Amount is too large")
    .refine(
      (value) => Math.round(value * 100) === value * 100,
      "Amount can have at most two decimal places",
    ),

  dueDate: z.iso.datetime({
    offset: true,
    message: "Due date must be a valid ISO datetime",
  }),
});
