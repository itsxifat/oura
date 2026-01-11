import { getCategories } from '@/app/actions';
import CategoryClient from './CategoryClient';

export default async function CategoriesPage() {
  const categoriesTree = await getCategories();
  return <CategoryClient categories={categoriesTree} />;
}