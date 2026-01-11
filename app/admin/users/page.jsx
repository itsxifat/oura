import { getUsers } from '@/app/actions';
import UserClient from './UserClient';

export default async function UsersPage({ searchParams }) {
  // Fix: await searchParams in Next.js 15+
  const params = await searchParams;
  const query = params?.q || '';
  
  const users = await getUsers(query);

  return <UserClient initialUsers={users} />;
}