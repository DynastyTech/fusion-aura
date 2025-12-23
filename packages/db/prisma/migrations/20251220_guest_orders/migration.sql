-- AlterTable: Make userId optional for guest orders
ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL;

