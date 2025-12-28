-- Add new OrderStatus enum values for the updated workflow
-- Note: PostgreSQL doesn't support removing enum values easily, so we just add the new ones

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DECLINED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_DELIVERY';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

