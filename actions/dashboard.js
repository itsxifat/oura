'use server'

import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';

export async function getDashboardStats() {
  await connectDB();

  try {
    // 1. Calculate Total Revenue (Only from Delivered/Paid orders)
    // We sum up the 'totalAmount' field from orders with status 'Delivered'
    const revenueResult = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // 2. Count Pending Orders
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });

    // 3. Count Total Users
    const totalUsers = await User.countDocuments({});

    // 4. Count Low Stock Items (Optional useful stat)
    const lowStockItems = await Product.countDocuments({ stock: { $lte: 5 } });

    // 5. Recent Activity (Last 5 Orders)
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
    console.error("Dashboard Stats Error:", error);
    return { error: "Failed to fetch stats" };
  }
}