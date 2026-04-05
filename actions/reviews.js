'use server';

import mongoose from 'mongoose';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { revalidatePath } from 'next/cache';
import { assertSession, isValidObjectId, sanitizeString } from '@/lib/security';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

async function findProductRobust(productId, orderId) {
  let product = await Product.findById(productId);
  if (product) return product;

  if (orderId) {
    const order = await Order.findById(orderId);
    if (order) {
      const targetItem = order.items.find(i => i._id && i._id.toString() === productId);
      if (targetItem) {
        const realId = targetItem.product || targetItem.productId;
        if (realId) product = await Product.findById(realId);
      }
    }
  }
  return product;
}

export async function getOrderReview({ productId, orderId }) {
  // Auth check: only authenticated users can fetch reviews
  let session;
  try { session = await assertSession(); } catch { return { found: false }; }
  if (!isValidObjectId(productId) || !isValidObjectId(orderId)) return { found: false };

  await connectDB();
  try {
    // Verify the order belongs to the requesting user
    const order = await Order.findById(orderId).select('user').lean();
    if (!order) return { found: false };
    if (order.user?.toString() !== session.user.id) return { found: false };

    const product = await findProductRobust(productId, orderId);
    if (!product) return { found: false };

    const review = product.reviews?.find(r => r.orderId?.toString() === orderId);
    if (review) {
      return { found: true, rating: review.rating, comment: review.comment, editCount: review.editCount || 0 };
    }
    return { found: false };
  } catch (error) {
    return { found: false };
  }
}

export async function submitReview({ productId, rating, comment, orderId }) {
  let session;
  try { session = await assertSession(); } catch { return { success: false, error: 'Unauthorized' }; }
  if (!isValidObjectId(productId) || !isValidObjectId(orderId)) {
    return { success: false, error: 'Invalid IDs' };
  }

  const safeRating = Number(rating);
  if (!safeRating || safeRating < 1 || safeRating > 5) {
    return { success: false, error: 'Rating must be between 1 and 5' };
  }
  const safeComment = sanitizeString(comment, 1000);

  try {
    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) return { success: false, error: 'Order not found' };

    // Verify the order belongs to the requesting user
    if (order.user?.toString() !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify the order is delivered before allowing a review
    if (order.status !== 'Delivered') {
      return { success: false, error: 'You can only review delivered orders' };
    }

    const product = await findProductRobust(productId, orderId);
    if (!product) return { success: false, error: 'Product not found.' };

    const reviewerName = order.guestInfo
      ? `${order.guestInfo.firstName} ${order.guestInfo.lastName}`
      : 'Verified Customer';

    const existingIndex = product.reviews.findIndex(r => r.orderId?.toString() === orderId);

    if (existingIndex >= 0) {
      const existing = product.reviews[existingIndex];
      if ((existing.editCount || 0) >= 3) {
        return { success: false, error: 'Maximum edit limit (3) reached.' };
      }
      product.reviews[existingIndex].rating = safeRating;
      product.reviews[existingIndex].comment = safeComment;
      product.reviews[existingIndex].editCount = (existing.editCount || 0) + 1;
      product.reviews[existingIndex].updatedAt = new Date();
    } else {
      const isDup = product.reviews.find(r => r.orderId?.toString() === orderId);
      if (isDup) return { success: false, error: 'Review already exists.' };
      product.reviews.push({
        user: reviewerName,
        rating: safeRating,
        comment: safeComment,
        orderId: orderId.toString(),
        editCount: 0,
        createdAt: new Date(),
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
    return { success: false, error: 'Submission error' };
  }
}
