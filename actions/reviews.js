'use server';

import mongoose from 'mongoose';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { revalidatePath } from 'next/cache';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export async function submitReview({ productId, rating, comment, orderId }) {
  try {
    await connectDB();

    // Debug Log: Check what ID we received
    console.log("SERVER ACTION: Review Attempt", { productId, orderId });

    if (!orderId || !productId || !rating) return { success: false, error: 'Missing Data' };

    const order = await Order.findById(orderId);
    if (!order) return { success: false, error: 'Order not found' };

    // Find Product - Try direct ID first
    let product = await Product.findById(productId);
    
    // FAILSAFE: If ID not found, maybe 'productId' passed was the orderItem._id?
    // Let's try to find the product ID inside the Order's item array
    if (!product) {
      const targetItem = order.items.find(i => i._id.toString() === productId);
      if (targetItem && targetItem.productId) {
         console.log("Found real Product ID via Order Item:", targetItem.productId);
         product = await Product.findById(targetItem.productId);
      }
    }

    if (!product) {
      console.error(`SERVER ACTION: Product lookup failed for ID: ${productId}`);
      return { success: false, error: 'Product no longer exists.' };
    }

    // Add Review
    const reviewerName = order.guestInfo ? `${order.guestInfo.firstName} ${order.guestInfo.lastName}` : 'Verified Customer';
    
    // Duplicate Check
    const isDup = product.reviews.find(r => r.user === reviewerName && r.comment === comment);
    if (isDup) return { success: false, error: 'Duplicate review.' };

    product.reviews.push({
      user: reviewerName,
      rating: Number(rating),
      comment,
      createdAt: new Date()
    });

    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((a, b) => a + b.rating, 0) / product.reviews.length;

    await product.save();
    revalidatePath(`/product/${product.slug}`);
    
    return { success: true };

  } catch (error) {
    console.error('Server Action Error:', error);
    return { success: false, error: 'Submission Error' };
  }
}