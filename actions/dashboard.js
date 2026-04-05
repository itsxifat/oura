'use server'

import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import { assertAdmin } from '@/lib/security';

export async function getDashboardStats() {
  try { await assertAdmin(); } catch { return { error: 'Unauthorized' }; }
  await connectDB();

  try {
    const revenueResult = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const totalUsers = await User.countDocuments({});
    const lowStockItems = await Product.countDocuments({ stock: { $lte: 5 } });

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderId totalAmount status createdAt guestInfo')
      .lean();

    return {
      revenue: totalRevenue,
      pendingOrders,
      totalUsers,
      lowStockItems,
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
      systemStatus: 'Online'
    };
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return { error: 'Failed to fetch stats' };
  }
}
