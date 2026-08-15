"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getProducts } from "../db";
import { useAuth } from "./AuthContext";
import { supabase } from "../../supabase";

const AppContext = createContext();

export function AppProvider({ children }) {
  const { requireLogin, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);

  // Load products & customer/cart/wishlist states on mount
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

    const savedCart = localStorage.getItem("orient_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Sync user specific data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
          if (data) {
            if (data.wishlist) setWishlist(data.wishlist);
            if (data.orders) setOrders(data.orders);
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
