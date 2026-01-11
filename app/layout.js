import './globals.css';
import Navbar from '@/components/Navbar';
import { CartProvider } from '@/lib/context/CartContext';
import SessionProvider from '@/components/SessionProvider';
import FooterWrapper from '@/components/FooterWrapper';
import { Toaster } from 'react-hot-toast'; // ✅ Import the Toaster

export const metadata = {
  title: 'ANAQA',
  description: 'Premium Fashion Store',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          <CartProvider>
            
            {/* ✅ The Toaster component must be here. 
                It is invisible until a toast is triggered.
            */}
            <Toaster position="top-right" reverseOrder={false} />
            
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