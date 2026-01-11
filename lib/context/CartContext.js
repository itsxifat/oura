'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { calculateCart } from '@/app/actions'; 

// Fix: Provide default values to prevent "Cannot destructure... as it is undefined" crashes
const CartContext = createContext({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  applyCouponCode: () => {},
  removeCoupon: () => {},
  cartCount: 0,
  cartTotal: 0,
  discountTotal: 0,
  grandTotal: 0,
  appliedCoupon: null,
  manualCode: '',
  couponError: null,
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [totals, setTotals] = useState({ cartTotal: 0, discountTotal: 0, grandTotal: 0 });
  const [appliedCoupon, setAppliedCoupon] = useState(null); 
  const [manualCode, setManualCode] = useState(''); 
  const [couponError, setCouponError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load Data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('oura_cart'); // Changed storage key for new brand
      const savedCode = localStorage.getItem('oura_manual_code');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedCode) setManualCode(savedCode);
      setIsLoaded(true);
    }
  }, []);

  // 2. Save & Calculate
  useEffect(() => {
    if (!isLoaded) return;
    
    localStorage.setItem('oura_cart', JSON.stringify(cart));
    if (manualCode) localStorage.setItem('oura_manual_code', manualCode);
    else localStorage.removeItem('oura_manual_code');

    const timer = setTimeout(async () => {
       if (cart.length === 0) {
         setTotals({ cartTotal: 0, discountTotal: 0, grandTotal: 0 });
         setAppliedCoupon(null);
         return;
       }
       // Ensure calculateCart exists/is imported correctly, or handle error
       try {
         const res = await calculateCart(cart, manualCode);
         if (res) {
            setTotals({
                cartTotal: res.cartTotal,
                discountTotal: res.discountTotal,
                grandTotal: res.grandTotal
            });
            setAppliedCoupon(res.appliedCoupon);
            setCouponError(res.error); 
         }
       } catch (err) {
         console.error("Cart Calculation Error", err);
       }
    }, 400);

    return () => clearTimeout(timer);
  }, [cart, manualCode, isLoaded]);

  // Actions
  const addToCart = (product, quantity = 1, size = null) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(i => i._id === product._id && i.selectedSize === size);
      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + quantity };
        return newCart;
      }
      return [...prev, { ...product, quantity, selectedSize: size }];
    });
  };

  const removeFromCart = (id, size) => setCart(prev => prev.filter(i => !(i._id === id && i.selectedSize === size)));
  const updateQuantity = (id, size, qty) => { if (qty < 1) return; setCart(prev => prev.map(i => (i._id === id && i.selectedSize === size ? { ...i, quantity: qty } : i))); };
  const applyCouponCode = (code) => setManualCode(code);
  const removeCoupon = () => { setManualCode(''); setCouponError(null); };
  const clearCart = () => { setCart([]); setManualCode(''); };

  // Derived for Navbar Badge
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart, addToCart, removeFromCart, updateQuantity, clearCart,
        applyCouponCode, removeCoupon, cartCount,
        cartTotal: totals.cartTotal,
        discountTotal: totals.discountTotal,
        grandTotal: totals.grandTotal,
        appliedCoupon, manualCode, couponError,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);