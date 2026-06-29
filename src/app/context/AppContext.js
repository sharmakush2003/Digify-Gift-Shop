"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getProducts } from "../db";
import { useAuth } from "./AuthContext";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

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
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ ...doc.data() });
        });
        
        if (productsData.length > 0) {
          setProducts(productsData);
        } else {
          setProducts(getProducts());
        }
      } catch (err) {
        console.error("Error fetching products from Firestore:", err);
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

  // Sync user specific data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.wishlist) setWishlist(data.wishlist);
            if (data.orders) setOrders(data.orders);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore", error);
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

  // Sync wishlist to Firestore/Local
  useEffect(() => {
    if (user) {
      try {
        setDoc(doc(db, "users", user.uid), { wishlist }, { merge: true });
      } catch (error) {
        console.error("Error syncing wishlist to Firestore", error);
      }
    } else {
      localStorage.setItem("orient_wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  // Sync orders to Firestore
  useEffect(() => {
    if (user) {
      try {
        setDoc(doc(db, "users", user.uid), { orders }, { merge: true });
      } catch (error) {
        console.error("Error syncing orders to Firestore", error);
      }
    }
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

