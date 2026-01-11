'use client';

import { useCart } from '@/lib/context/CartContext';
import { useEffect, useState } from 'react';

export default function CartCount() {
  const { cart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // Prevent hydration mismatch

  // Sum total quantity, not just number of items
  const count = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
      {count > 9 ? '9+' : count}
    </span>
  );
}