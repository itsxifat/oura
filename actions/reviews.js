'use server';

import mongoose from 'mongoose';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { revalidatePath } from 'next/cache';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

// Helper to find product robustly
async function findProductRobust(productId, orderId) {
  let product = await Product.findById(productId);
  if (product) return product;

  if (orderId) {
    const order = await Order.findById(orderId);
    if (order) {
      const targetItem = order.items.find(i => i._id && i._id.toString() === productId);
      if (targetItem) {
         const realProductId = targetItem.product || targetItem.productId;
         if (realProductId) {
             product = await Product.findById(realProductId);
         }
      }
    }
  }
  return product;
}

export async function getOrderReview({ productId, orderId }) {
  await connectDB();
  try {
    if (!productId || !orderId) return { found: false };
    const product = await findProductRobust(productId, orderId);
    if (!product) return { found: false };

    const review = product.reviews?.find(r => r.orderId && r.orderId.toString() === orderId.toString());
    
    if (review) {
        return { 
            found: true, 
            rating: review.rating, 
            comment: review.comment, 
            editCount: review.editCount || 0 
        };
    }
    return { found: false };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

export async function submitReview({ productId, rating, comment, orderId }) {
  try {
    await connectDB();
    if (!orderId || !productId || !rating) return { success: false, error: 'Missing Data' };

    const order = await Order.findById(orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const product = await findProductRobust(productId, orderId);
    if (!product) return { success: false, error: 'Product not found.' };

    const reviewerName = order.guestInfo ? `${order.guestInfo.firstName} ${order.guestInfo.lastName}` : 'Verified Customer';

    const existingReviewIndex = product.reviews.findIndex(r => r.orderId && r.orderId.toString() === orderId.toString());

    if (existingReviewIndex >= 0) {
        // Edit Mode
        const existingReview = product.reviews[existingReviewIndex];
        if ((existingReview.editCount || 0) >= 3) {
            return { success: false, error: "Maximum edit limit (3) reached." };
        }
        product.reviews[existingReviewIndex].rating = Number(rating);
        product.reviews[existingReviewIndex].comment = comment;
        product.reviews[existingReviewIndex].editCount = (existingReview.editCount || 0) + 1;
        product.reviews[existingReviewIndex].updatedAt = new Date();
    } else {
        // Create Mode
        const isDup = product.reviews.find(r => r.orderId?.toString() === orderId.toString());
        if(isDup) return { success: false, error: "Review already exists." };

        product.reviews.push({
            user: reviewerName,
            rating: Number(rating),
            comment,
            orderId: orderId.toString(),
            editCount: 0,
            createdAt: new Date()
        });
    }

    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((a, b) => a + b.rating, 0) / product.reviews.length;

    await product.save();
    
    revalidatePath(`/product/${product.slug}`);
    revalidatePath('/account/orders'); 
    
    return { success: true };
  } catch (error) {
    console.error('Review Action Error:', error);
    return { success: false, error: 'Submission Error' };
  }
}