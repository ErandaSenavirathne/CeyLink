-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "ServiceStatus" NOT NULL DEFAULT 'PENDING';
