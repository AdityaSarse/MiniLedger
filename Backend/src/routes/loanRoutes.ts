import { Router } from "express";
import { prisma } from "../lib/prisma";
import { createLoanSchema } from "../lib/validation";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware";

const router = Router();

// POST /loans — Create a loan
router.post("/", authMiddleware, async (req, res) => {
  const authReq = req as AuthRequest;

  const parsed = createLoanSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid loan details",
      errors: parsed.error.issues,
    });
  }

  try {
    const loan = await prisma.loan.create({
      data: {
        userId: authReq.userId!,
        friendName: parsed.data.friendName,
        amount: parsed.data.amount,
        dueDate: new Date(parsed.data.dueDate),
      },
    });

    return res.status(201).json({
      message: "Loan created successfully",
      loan,
    });
  } catch (error) {
    console.error("Create loan failed:", error);

    return res.status(500).json({
      message: "Could not create loan",
    });
  }
});

// GET /loans — List the authenticated user's loans
router.get("/", authMiddleware, async (req, res) => {
  const authReq = req as AuthRequest;

  try {
    const loans = await prisma.loan.findMany({
      where: {
        userId: authReq.userId!,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      count: loans.length,
      loans,
    });
  } catch (error) {
    console.error("Fetch loans failed:", error);

    return res.status(500).json({
      message: "Could not fetch loans",
    });
  }
});

// GET /loans/summary — Calculate lent, repaid, and overdue totals
router.get("/summary", authMiddleware, async (req, res) => {
  const authReq = req as AuthRequest;

  try {
    const now = new Date();

    const [totalLent, totalRepaid, overdue] = await Promise.all([
      prisma.loan.aggregate({
        where: {
          userId: authReq.userId!,
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.loan.aggregate({
        where: {
          userId: authReq.userId!,
          status: "REPAID",
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.loan.aggregate({
        where: {
          userId: authReq.userId!,
          status: "PENDING",
          dueDate: {
            lt: now,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return res.status(200).json({
      totalLent: Number(totalLent._sum.amount ?? 0),
      totalRepaid: Number(totalRepaid._sum.amount ?? 0),
      overdueAmount: Number(overdue._sum.amount ?? 0),
    });
  } catch (error) {
    console.error("Summary failed:", error);

    return res.status(500).json({
      message: "Could not calculate summary",
    });
  }
});

// PATCH /loans/:id/repay — Mark a loan as repaid
router.patch("/:id/repay", authMiddleware, async (req, res) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;

  try {
    const loan = await prisma.loan.findFirst({
      where: {
        id,
        userId: authReq.userId!,
      },
    });

    if (!loan) {
      return res.status(404).json({
        message: "Loan not found",
      });
    }

    if (loan.status === "REPAID") {
      return res.status(409).json({
        message: "Loan has already been repaid",
      });
    }

    const updatedLoan = await prisma.loan.updateMany({
      where: {
        id,
        userId: authReq.userId!,
        status: "PENDING",
      },
      data: {
        status: "REPAID",
        repaidAt: new Date(),
      },
    });

    if (updatedLoan.count === 0) {
      return res.status(409).json({
        message: "Loan status changed; please refresh and try again",
      });
    }

    const result = await prisma.loan.findFirst({
      where: {
        id,
        userId: authReq.userId!,
      },
    });

    return res.status(200).json({
      message: "Loan marked as repaid",
      loan: result,
    });
  } catch (error) {
    console.error("Repayment failed:", error);

    return res.status(500).json({
      message: "Could not update loan",
    });
  }
});

export default router;
