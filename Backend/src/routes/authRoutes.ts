import { Router } from "express";
import { phoneSchema, verifyOtpSchema } from "../lib/validation";
import { sendOtp, verifyOtp } from "../services/authService";

const router = Router();

router.post("/send-otp", async (req, res) => {
  const parsed = phoneSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message || "Invalid phone number",
      errors: parsed.error.issues,
    });
  }

  try {
    const result = await sendOtp(parsed.data.phone);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send OTP";
    return res.status(400).json({ message });
  }
});

router.post("/verify-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.issues,
    });
  }

  try {
    const result = await verifyOtp(
      parsed.data.phone,
      parsed.data.otp,
    );

    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Login failed";

    return res.status(401).json({ message });
  }
});

export default router;
