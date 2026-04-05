import './globals.css';
import Navbar from '@/components/Navbar';
import { CartProvider } from '@/lib/context/CartContext';
import SessionProvider from '@/components/SessionProvider';
import FooterWrapper from '@/components/FooterWrapper';
import VisitTracker from '@/components/VisitTracker';
import { Toaster } from 'react-hot-toast'; // ✅ Import the Toaster

export const metadata = {
  metadataBase: new URL('https://oura-lifestyle.com'),
  icons: {
    icon: '/Icon1.png',
    shortcut: '/Icon1.png',
    apple: '/Icon1.png',
  },
  title: {
    default: 'OURA — Engineered for the Modern Aesthetic',
    template: '%s | OURA',
  },
  description: 'OURA is a premium fashion brand engineered for the modern aesthetic. Shop curated luxury menswear — T-Shirts, Polos, and exclusive collections. Free delivery across Bangladesh.',
  keywords: [
    'OURA', 'OURA lifestyle', 'oura-lifestyle.com',
    'premium fashion Bangladesh', 'luxury menswear Bangladesh',
    'mens t-shirt Bangladesh', 'mens polo shirt Bangladesh',
    'online fashion store BD', 'designer clothing Bangladesh',
    'modern aesthetic fashion', 'curated luxury clothing',
  ],
  authors: [{ name: 'OURA' }],
  creator: 'OURA',
  publisher: 'OURA',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'OURA',
    url: 'https://oura-lifestyle.com',
    title: 'OURA — Engineered for the Modern Aesthetic',
    description: 'Premium fashion brand engineered for the modern aesthetic. Shop curated luxury menswear in Bangladesh.',
    images: [{ url: 'https://oura-lifestyle.com/logo.png', width: 400, height: 400, alt: 'OURA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OURA — Engineered for the Modern Aesthetic',
    description: 'Premium fashion brand engineered for the modern aesthetic. Shop curated luxury menswear in Bangladesh.',
    images: ['https://oura-lifestyle.com/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: {
    canonical: 'https://oura-lifestyle.com',
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: 'OURA',
  url: 'https://oura-lifestyle.com',
  logo: 'https://oura-lifestyle.com/logo.png',
  image: 'https://oura-lifestyle.com/logo.png',
  description: 'OURA is a premium fashion brand engineered for the modern aesthetic. Curated luxury menswear — T-Shirts, Polos, and exclusive collections in Bangladesh.',
  slogan: 'Engineered for the Modern Aesthetic',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'BD',
    addressLocality: 'Dhaka',
  },
  sameAs: [
    // Add your Facebook/Instagram URLs here, e.g.:
    // 'https://www.facebook.com/groups/yourgroup',
    // 'https://www.instagram.com/oura_lifestyle',
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <SessionProvider>
          <CartProvider>
            <Toaster position="top-right" reverseOrder={false} />
            <VisitTracker />
            <main>
              {children}
            </main>
            <FooterWrapper />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}