'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();

  // List of paths where the footer should be HIDDEN
  const hiddenPaths = ['/admin', '/login', '/signup', '/verify'];

  // Check if current path starts with any of the hidden paths
  const isHidden = hiddenPaths.some((path) => pathname?.startsWith(path));

  if (isHidden) {
    return null;
  }

  return <Footer />;
}