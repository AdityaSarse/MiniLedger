import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/authRoutes";
import loanRoutes from "./routes/loanRoutes";
import { authMiddleware, type AuthRequest } from "./middleware/authMiddleware";

const app = express();

app.use(helmet());

// Configure allowed origins
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header (such as native apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Check explicit allowed origins if configured
      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow local development origins (localhost, 127.0.0.1, LAN IPs)
      if (
        allowedOrigins.length === 0 ||
        process.env.NODE_ENV !== "production" ||
        /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", app: "MiniLedger" });
});

app.use("/auth", authRoutes);
app.use("/loans", loanRoutes);

app.get(
  "/auth/me",
  authMiddleware,
  (req, res) => {
    res.json({
      message: "Authenticated successfully",
      userId: (req as AuthRequest).userId,
    });
  }
);

export default app;
