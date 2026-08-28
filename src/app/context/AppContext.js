"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getProducts, getOrders } from "../db";
import { useAuth } from "./AuthContext";
import { supabase } from "../../supabase";

const AppContext = createContext();

export function AppProvider({ children }) {
  const { requireLogin, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orient_cart");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse cart on init", e);
        }
      }
    }
    return [];
  });
  const [wishlist, setWishlist] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orient_wishlist");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });
  const [orders, setOrders] = useState([]);

  // Load products states on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(getProducts());
        }
      } catch (err) {
        console.error("CRITICAL: Error fetching products from Supabase in AppContext:", err);
        setProducts(getProducts());
      }
    };
    
    fetchProducts();
  }, []);

  // Sync user specific data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
          if (data) {
            if (data.wishlist) setWishlist(data.wishlist);
          }
          
          // Fetch orders for this user
          const { data: dbOrders } = await supabase.from('orders').select('*').eq('guest_email', user.email);
          if (dbOrders && dbOrders.length > 0) {
            const localOrders = getOrders();
            // Map the DB schema back to what the frontend expects
            const mappedOrders = dbOrders.map(dbOrder => {
              const matchedLocal = localOrders.find(lo => lo.id === dbOrder.order_number || lo.id === dbOrder.id);
              return {
                id: dbOrder.order_number || dbOrder.id,
                date: dbOrder.created_at,
                customerName: dbOrder.guest_email ? dbOrder.guest_email.split('@')[0] : 'Customer',
                customerEmail: dbOrder.guest_email,
                shippingAddress: dbOrder.shipping_address?.raw_text || 'N/A',
                delivery_otp: dbOrder.shipping_address?.delivery_otp || null,
                total: dbOrder.final_total || 0,
                items: matchedLocal ? matchedLocal.items : [], 
                status: (dbOrder.order_status === 'NEW' || dbOrder.order_status === 'PAYMENT_PENDING') ? 'Pending' : (dbOrder.order_status === 'PACKED' ? 'Packed' : (dbOrder.order_status === 'DISPATCHED' ? 'Shipped' : (dbOrder.order_status === 'DELIVERED' ? 'Delivered' : 'Pending'))),
              };
            });
            const sorted = mappedOrders.sort((a,b) => new Date(b.date) - new Date(a.date));
            setOrders(sorted);
          } else {
            // Fallback to local storage matching user's email
            const localOrders = getOrders();
            const userOrders = localOrders.filter(o => o.customerEmail === user.email);
            setOrders(userOrders);
          }
        } catch (error) {
          console.error("Error fetching user data from Supabase", error);
        }
      } else {
        // If logged out, load local wishlist if exists
        setOrders([]);
        const savedWishlist = localStorage.getItem("orient_wishlist");
        if (savedWishlist) {
          try {
            setWishlist(JSON.parse(savedWishlist));
          } catch (e) {}
        } else {
          setWishlist([]);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Save cart to localstorage whenever it changes
  useEffect(() => {
    localStorage.setItem("orient_cart", JSON.stringify(cart));
  }, [cart]);

  // Sync wishlist to Supabase/Local
  useEffect(() => {
    const syncWishlist = async () => {
      if (user) {
        try {
          await supabase.from('users').upsert({ id: user.id, wishlist });
        } catch (error) {
          console.error("Error syncing wishlist to Supabase", error);
        }
      } else {
        localStorage.setItem("orient_wishlist", JSON.stringify(wishlist));
      }
    };
    syncWishlist();
  }, [wishlist, user]);

  // Sync orders to Supabase
  useEffect(() => {
    const syncOrders = async () => {
      if (user) {
        try {
          await supabase.from('users').upsert({ id: user.id, orders });
        } catch (error) {
          console.error("Error syncing orders to Supabase", error);
        }
      }
    };
    syncOrders();
  }, [orders, user]);

  // Cart operations
  const addToCart = (product, qty = 1) => {
    if (!requireLogin("Orient Crockeries says: Firstly login to use add to cart feature, please.")) return false; // Mandate login to add to cart
    
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: qty }];
    });
    return true;
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const addOrder = (order) => {
    setOrders(prev => [...prev, order]);
  };

  // Wishlist operations
  const toggleWishlist = (product) => {
    if (!requireLogin("Orient Crockeries says: Please login to use wishlist feature")) return false; // Mandate login to wishlist
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some((item) => item.id === product.id);
      if (exists) {
        return prevWishlist.filter((item) => item.id !== product.id);
      }
      return [...prevWishlist, product];
    });
    return true;
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  // Get total items and total price of cart
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        products,
        setProducts,
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        wishlist,
        toggleWishlist,
        isInWishlist,
        cartSubtotal,
        cartItemCount,
        orders,
        addOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}


// clear local storage on mount temporarily
if (typeof window !== 'undefined') { localStorage.removeItem('orient_products'); }
