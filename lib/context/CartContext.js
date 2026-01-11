'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { calculateCart } from '@/app/actions'; 

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
  
  // Use ref to prevent infinite loop of updates
  const isSyncing = useRef(false);

  // 1. Load Data from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('oura_cart'); 
      const savedCode = localStorage.getItem('oura_manual_code');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedCode) setManualCode(savedCode);
      setIsLoaded(true);
    }
  }, []);

  // 2. Save & Calculate (AND SYNC DATA)
  useEffect(() => {
    if (!isLoaded) return;
    
    // Save current state to LS
    localStorage.setItem('oura_cart', JSON.stringify(cart));
    if (manualCode) localStorage.setItem('oura_manual_code', manualCode);
    else localStorage.removeItem('oura_manual_code');

    const timer = setTimeout(async () => {
       if (cart.length === 0) {
         setTotals({ cartTotal: 0, discountTotal: 0, grandTotal: 0 });
         setAppliedCoupon(null);
         return;
       }

       // Prevent re-triggering if we are currently updating from server
       if (isSyncing.current) return;

       try {
         isSyncing.current = true;
         const res = await calculateCart(cart, manualCode);
         
         if (res) {
            setTotals({
                cartTotal: res.cartTotal,
                discountTotal: res.discountTotal,
                grandTotal: res.grandTotal
            });
            setAppliedCoupon(res.appliedCoupon);
            setCouponError(res.error); 

            // --- SYNC FIX: Update local cart with fresh DB data (Tags, Price) ---
            // Only update if data actually changed to prevent loops
            if (res.validatedCart && JSON.stringify(res.validatedCart) !== JSON.stringify(cart)) {
                // We create a map of quantities to preserve user intent if stock allows
                // But generally validatedCart has the corrected quantities already
                setCart(res.validatedCart);
            }
         }
       } catch (err) {
         console.error("Cart Sync Error", err);
       } finally {
         isSyncing.current = false;
       }
    }, 500); // Slightly increased debounce to 500ms

    return () => clearTimeout(timer);
  }, [cart, manualCode, isLoaded]);

  // Actions
  const addToCart = (product, quantity = 1, size = null) => {
    setCart((prev) => {
      // Create a unique key for variant
      const existingIndex = prev.findIndex(i => i._id === product._id && i.selectedSize === size);
      
      if (existingIndex >= 0) {
        const newCart = [...prev];
        const newQty = newCart[existingIndex].quantity + quantity;
        // Basic optimistic check (real check happens on server sync)
        newCart[existingIndex] = { ...newCart[existingIndex], quantity: newQty };
        return newCart;
      }
      
      // Add new item
      return [...prev, { ...product, quantity, selectedSize: size }];
    });
  };

  const removeFromCart = (id, size) => setCart(prev => prev.filter(i => !(i._id === id && i.selectedSize === size)));
  
  const updateQuantity = (id, size, qty) => { 
      if (qty < 1) return; 
      setCart(prev => prev.map(i => (i._id === id && i.selectedSize === size ? { ...i, quantity: qty } : i))); 
  };
  
  const applyCouponCode = (code) => setManualCode(code);
  const removeCoupon = () => { setManualCode(''); setCouponError(null); };
  const clearCart = () => { setCart([]); setManualCode(''); };

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