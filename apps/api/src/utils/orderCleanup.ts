import { prisma, OrderStatus } from '@fusionaura/db';

/**
 * Delete orders that have been completed, declined, or cancelled for more than 14 days
 * This should be run as a scheduled job (cron) daily
 */
export async function cleanupOldOrders(): Promise<{ deleted: number; errors: number }> {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const statusesToDelete: OrderStatus[] = [
    OrderStatus.COMPLETED,
    OrderStatus.DECLINED,
    OrderStatus.CANCELLED,
  ];

  try {
    // Find orders to delete
    const ordersToDelete = await prisma.order.findMany({
      where: {
        status: {
          in: statusesToDelete,
        },
        updatedAt: {
          lte: fourteenDaysAgo,
        },
      },
      select: {
        id: true,
        orderNumber: true,
      },
    });

    if (ordersToDelete.length === 0) {
      console.log('No old orders to delete');
      return { deleted: 0, errors: 0 };
    }

    console.log(`Found ${ordersToDelete.length} orders to delete (older than 14 days)`);

    // Delete order items first (cascade should handle this, but being explicit)
    const orderIds = ordersToDelete.map((o: { id: string; orderNumber: string }) => o.id);
    
    await prisma.orderItem.deleteMany({
      where: {
        orderId: {
          in: orderIds,
        },
      },
    });

    // Delete orders
    const result = await prisma.order.deleteMany({
      where: {
        id: {
          in: orderIds,
        },
      },
    });

    console.log(`✅ Deleted ${result.count} old orders`);
    
    return { deleted: result.count, errors: 0 };
  } catch (error) {
    console.error('Error cleaning up old orders:', error);
    return { deleted: 0, errors: 1 };
  }
}

/**
 * Run cleanup manually (for testing or manual triggers)
 */
export async function runCleanup() {
  console.log('🧹 Starting order cleanup...');
  const result = await cleanupOldOrders();
  console.log(`✅ Cleanup complete: ${result.deleted} deleted, ${result.errors} errors`);
  return result;
}

