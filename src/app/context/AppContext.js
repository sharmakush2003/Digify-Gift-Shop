"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getProducts, getOrders } from "../db";
import { useAuth } from "./AuthContext";
import { supabase } from "../../supabase";
import { getProductMediaUrls } from "../utils/imageUtils";

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
          const merged = data.map(p => {
            const media = getProductMediaUrls(p);
            let warrantyVal = p.warranty;
            if (!warrantyVal && typeof window !== 'undefined') {
              try {
                const warrantyMap = JSON.parse(localStorage.getItem('orient_product_warranties') || '{}');
                warrantyVal = warrantyMap[p.id] || warrantyMap[String(p.id)];
              } catch (err) {}
            }
            return {
              ...p,
              warranty: warrantyVal || "No Warranty",
              youtube_url: p.youtube_url || media.youtube_url || '',
              instagram_url: p.instagram_url || media.instagram_url || ''
            };
          });
          setProducts(merged);
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
          const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
          if (data && data.wishlist) {
            setWishlist(data.wishlist);
          }
          
          // Fetch all orders from Supabase & LocalStorage for this user
          const { data: dbOrders } = await supabase.from('orders').select('*');
          const localOrders = getOrders() || [];
          
          let combinedOrders = [];
          
          if (dbOrders && dbOrders.length > 0) {
            // Filter DB orders matching user's email (case insensitive) or phone
            const userDbOrders = dbOrders.filter(dbOrder => {
              const emailMatch = dbOrder.guest_email && user.email && 
                dbOrder.guest_email.trim().toLowerCase() === user.email.trim().toLowerCase();
              const phoneMatch = dbOrder.guest_phone && (user.phoneNumber || user.email) && 
                (user.email.includes(dbOrder.guest_phone) || (user.phoneNumber && user.phoneNumber.includes(dbOrder.guest_phone)));
              const isLocalMatch = localOrders.some(lo => lo.id === dbOrder.order_number || lo.id === dbOrder.id);
              return emailMatch || phoneMatch || isLocalMatch;
            });

            combinedOrders = userDbOrders.map(dbOrder => {
              const matchedLocal = localOrders.find(lo => lo.id === dbOrder.order_number || lo.id === dbOrder.id);
              return {
                id: dbOrder.order_number || dbOrder.id,
                date: dbOrder.created_at,
                customerName: typeof dbOrder.shipping_address === 'object' ? dbOrder.shipping_address?.name : (dbOrder.guest_email ? dbOrder.guest_email.split('@')[0] : 'Customer'),
                customerEmail: dbOrder.guest_email || user.email,
                customerPhone: dbOrder.guest_phone || (typeof dbOrder.shipping_address === 'object' ? dbOrder.shipping_address?.phone : 'N/A'),
                shippingAddress: typeof dbOrder.shipping_address === 'object' ? dbOrder.shipping_address?.raw_text : (typeof dbOrder.shipping_address === 'string' ? dbOrder.shipping_address : 'N/A'),
                total: dbOrder.final_total || 0,
                subtotal: dbOrder.total_mrp || dbOrder.final_total || 0,
                shippingFee: dbOrder.shipping_charge || 0,
                promoDiscount: dbOrder.discount_amount || 0,
                items: matchedLocal && matchedLocal.items ? matchedLocal.items : [],
                status: (dbOrder.order_status === 'NEW' || dbOrder.order_status === 'PAYMENT_PENDING') ? 'Pending' : (dbOrder.order_status === 'PACKED' ? 'Packed' : (dbOrder.order_status === 'DISPATCHED' ? 'Shipped' : (dbOrder.order_status === 'DELIVERED' ? 'Delivered' : 'Pending'))),
              };
            });
          }

          // Add any local orders that match user's email or phone or are in local storage
          localOrders.forEach(lo => {
            if (!combinedOrders.some(co => co.id === lo.id)) {
              combinedOrders.push(lo);
            }
          });

          combinedOrders.sort((a,b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
          setOrders(combinedOrders);
        } catch (error) {
          console.error("Error fetching user data from Supabase", error);
          setOrders(getOrders() || []);
        }
      } else {
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
