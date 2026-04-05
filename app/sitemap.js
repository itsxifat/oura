import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // regenerate every hour

const BASE = 'https://oura-lifestyle.com';

export default async function sitemap() {
  await connectDB();

  const [products, categories] = await Promise.all([
    Product.find({}, 'slug updatedAt').lean(),
    Category.find({}, 'slug updatedAt').lean(),
  ]);

  const staticRoutes = [
    { url: BASE,                    lastModified: new Date(), changeFrequency: 'daily',  priority: 1.0 },
    { url: `${BASE}/product`,       lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE}/category`,      lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  const productRoutes = products.map((p) => ({
    url: `${BASE}/product/${p.slug}`,
    lastModified: p.updatedAt || new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${BASE}/category/${c.slug}`,
    lastModified: c.updatedAt || new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
