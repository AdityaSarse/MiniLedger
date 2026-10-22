import "dotenv/config";
import { prisma } from "./lib/prisma";

async function main() {
  await prisma.$connect();

  const count = await prisma.user.count();

  console.log("PostgreSQL connected successfully!");
  console.log("Users:", count);
}

main()
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
