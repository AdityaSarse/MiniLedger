import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/authRoutes";
import loanRoutes from "./routes/loanRoutes";
import { authMiddleware, type AuthRequest } from "./middleware/authMiddleware";

const app = express();

app.use(helmet());

// Configure an explicit origin if you have a known client origin.
// Native React Native requests do not normally send browser CORS headers.
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as native apps
      // and local command-line tools.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
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
