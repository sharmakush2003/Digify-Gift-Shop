"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  fetchProducts,
  updateOrderStatus,
  getOrders
} from "../db";
import { supabase } from "../../supabase";
import CouponsTab from "./CouponsTab";
import InstructionsTab from "./InstructionsTab";
import PromoPopupTab from "./PromoPopupTab";
import UsersTab from "./UsersTab";
import { generateInvoicePDF } from "../utils/invoiceGenerator";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import Papa from "papaparse";
import { getProductMediaUrls } from "../utils/imageUtils";
import ConfirmModal from "./ConfirmModal";
import "./admin.css";

export default function AdminPage() {
  const { login } = useAuth();
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Tab & Search states
  const [activeTab, setActiveTab] = useState("orders"); // "orders" | "inventory"
  const [orderFilter, setOrderFilter] = useState("Active"); // "Active" | "Delivered" | "All"
  const [orderSearch, setOrderSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);

  // Data states (locally stored)
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const prevOrdersCountRef = useRef(null);
  const lastChimedOrderIdRef = useRef(null);

  // Editing modals states
  const [editingProduct, setEditingProduct] = useState(null);
  const [aligningImage, setAligningImage] = useState(null); // { url, fit, x, y }
  const [showComboModal, setShowComboModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // New Combo hamper states
  const [newComboName, setNewComboName] = useState("");
  const [newComboPrice, setNewComboPrice] = useState("");
  const [newComboStock, setNewComboStock] = useState("");
  const [newComboImage, setNewComboImage] = useState("");
  const [newComboDept, setNewComboDept] = useState("Gifting");
  const [newComboCat, setNewComboCat] = useState("Gift Hampers");
  const [newComboSub, setNewComboSub] = useState("Combos");
  const [comboSelectedProducts, setComboSelectedProducts] = useState([
    { id: 1, productId: "", quantity: 1 },
    { id: 2, productId: "", quantity: 1 }
  ]);

  const handleAddComboRow = () => {
    setComboSelectedProducts(prev => [
      ...prev,
      { id: Date.now() + Math.random(), productId: "", quantity: 1 }
    ]);
  };

  const handleRemoveComboRow = (id) => {
    if (comboSelectedProducts.length <= 1) {
      triggerToast("At least one product must be included in the hamper!", "warning");
      return;
    }
    setComboSelectedProducts(prev => prev.filter(item => item.id !== id));
  };

  const handleComboProductChange = (id, productId) => {
    setComboSelectedProducts(prev =>
      prev.map(item => item.id === id ? { ...item, productId } : item)
    );
  };

  const handleComboQuantityChange = (id, quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    setComboSelectedProducts(prev =>
      prev.map(item => item.id === id ? { ...item, quantity: qty } : item)
    );
  };

  // Calculate base price total of all selected items
  const comboBasePrice = comboSelectedProducts.reduce((sum, item) => {
    const prod = productsList.find(p => String(p.id) === String(item.productId));
    return sum + (prod ? (parseFloat(prod.price) || 0) * item.quantity : 0);
  }, 0);


  // New Review manual input states
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");

  // Toast Notification states
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info"); // 'success' | 'error' | 'warning' | 'info'
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef(null);

  // Luxury Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    subMessage: "This action cannot be undone.",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "danger",
    item: null,
    isLoading: false,
    onConfirm: null
  });

  // Bulk JSON Import states
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [jsonInputText, setJsonInputText] = useState("");
  const [jsonValidationResult, setJsonValidationResult] = useState(null);
  const [isJsonImporting, setIsJsonImporting] = useState(false);

  // Add Product & Filter States
  const [expandedAdminOrderId, setExpandedAdminOrderId] = useState(null);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    stockStatus: "Available",
    department: "Crockery & Dining",
    barcode: "",
    hsn: "",
    gst: 18,
    description: "",
    fragile: false,
    microwave: false,
    category: "General",
    search_tags: "",
    video_enabled: false,
    youtube_url: "",
    instagram_url: ""
  });

  // Single Upload & Custom Department/Category states
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [isEditCustomDept, setIsEditCustomDept] = useState(false);
  const [isEditCustomCat, setIsEditCustomCat] = useState(false);

  const [singleUploadImages, setSingleUploadImages] = useState([]);
  const [isSingleUploading, setIsSingleUploading] = useState(false);
  const [singleUploadStatus, setSingleUploadStatus] = useState("");

  const loadDbData = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      let productsData = (data || []).map(p => {
        const media = getProductMediaUrls(p);
        let warrantyVal = p.warranty;
        if (!warrantyVal && typeof window !== 'undefined') {
          try {
            const warrantyMap = JSON.parse(localStorage.getItem('orient_product_warranties') || '{}');
            warrantyVal = warrantyMap[p.id] || warrantyMap[String(p.id)];
          } catch (err) {}
        }
        let imageSettingsVal = p.image_settings;
        if ((!imageSettingsVal || Object.keys(imageSettingsVal).length === 0) && typeof window !== 'undefined') {
          try {
            const localMap = JSON.parse(localStorage.getItem('orient_image_settings') || '{}');
            imageSettingsVal = localMap[p.id] || localMap[String(p.id)] || {};
          } catch (err) {}
        }
        const rawImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image && p.image !== '/placeholder.jpg' ? [p.image] : []);
        const cappedImages = rawImages.slice(0, 5);
        return {
          ...p,
          images: cappedImages,
          image: cappedImages.length > 0 ? cappedImages[0] : (p.image || '/placeholder.jpg'),
          warranty: warrantyVal || "No Warranty",
          youtube_url: p.youtube_url || media.youtube_url || '',
          instagram_url: p.instagram_url || media.instagram_url || '',
          image_settings: imageSettingsVal || {}
        };
      });
      // Sort products by ID or keep original order
      productsData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      setProductsList(productsData);
    } catch (e) {
      console.warn("Failed to load products from Supabase", e);
      // Removed fallback to getProducts() to ensure only real database data or nothing is shown
      setProductsList([]);
    }
    
    try {
      // Fetch orders via secure server-side API (uses service-role key after verifying admin session)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        console.warn('No admin session token found — skipping orders fetch.');
        setOrdersList([]);
        return;
      }

      const ordersResponse = await fetch('/api/admin/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const ordersResult = await ordersResponse.json();
      if (!ordersResult.success) {
        console.warn('Admin orders API error:', ordersResult.message);
        setOrdersList([]);
        return;
      }
      const ordersSource = ordersResult.orders || [];


      let dbOrdersFormatted = ordersSource.map(dbOrder => {
        const nameFromAddr = typeof dbOrder.shipping_address === 'object' ? dbOrder.shipping_address?.name : null;
        const custName = nameFromAddr || dbOrder.customer_name || dbOrder.name || (dbOrder.guest_email ? dbOrder.guest_email.split('@')[0] : 'Customer');
        const custPhone = dbOrder.guest_phone || (typeof dbOrder.shipping_address === 'object' ? dbOrder.shipping_address?.phone : null) || dbOrder.phone || 'N/A';
        const isPickup = dbOrder.shipping_address?.delivery_method === 'pickup' || 
                         (dbOrder.shipping_address?.raw_text && dbOrder.shipping_address.raw_text.toLowerCase().includes('pickup')) ||
                         dbOrder.delivery_method === 'pickup';

        let extractedItems = [];
        if (dbOrder.order_items && dbOrder.order_items.length > 0) {
          extractedItems = dbOrder.order_items.map(i => ({
            name: i.products?.name || i.product_name || `Orient Premium Crockery SKU #${i.product_id}`,
            quantity: i.quantity || i.qty || 1,
            price: i.price_at_time || (i.total_price / (i.quantity || 1)) || 0
          }));
        } else if (dbOrder.items && dbOrder.items.length > 0) {
          extractedItems = dbOrder.items;
        } else {
          const itemPrice = dbOrder.final_total || dbOrder.total_mrp || 875;
          extractedItems = [{
            name: "Orient Crockery Premium Luxury Dinner Collection",
            quantity: 1,
            price: itemPrice
          }];
        }

        return {
          id: dbOrder.order_number || dbOrder.id,
          _docId: dbOrder.id,
          date: dbOrder.created_at,
          customerName: custName,
          customerPhone: custPhone,
          shippingAddress: dbOrder.shipping_address?.raw_text || (typeof dbOrder.shipping_address === 'string' ? dbOrder.shipping_address : 'N/A'),
          deliveryMethod: isPickup ? 'pickup' : 'delivery',
          items: extractedItems,
          subtotal: dbOrder.total_mrp || dbOrder.final_total || 0,
          shipping: dbOrder.shipping_charge || 0,
          discount: dbOrder.discount_amount || 0,
          total: dbOrder.final_total || 0,
          status: (dbOrder.order_status === 'NEW' || dbOrder.order_status === 'PAYMENT_PENDING') ? 'Pending' : (dbOrder.order_status === 'PACKED' ? 'Packed' : (dbOrder.order_status === 'DISPATCHED' ? 'Shipped' : (dbOrder.order_status === 'DELIVERED' ? 'Delivered' : 'Pending'))),
          courierStatus: isPickup ? 'Store Self Pickup' : 'In Warehouse',
          paymentStatus: dbOrder.payment_status === 'SUCCESS' ? 'Paid' : 'Pending'
        };
      });

      let allOrders = [...dbOrdersFormatted];
      allOrders.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      const newestOrder = allOrders[0];
      if (newestOrder && newestOrder.date) {
        const orderTime = new Date(newestOrder.date).getTime();
        const THREE_MINUTES = 3 * 60 * 1000;
        if (Date.now() - orderTime < THREE_MINUTES && lastChimedOrderIdRef.current !== newestOrder.id) {
          lastChimedOrderIdRef.current = newestOrder.id;
          triggerToast(`🛎️ New Order Received! (${newestOrder.id} - ${newestOrder.customerName || 'Customer'})`);
          playOrderChime();
        }
      }
      prevOrdersCountRef.current = allOrders.length;
      setOrdersList(allOrders);

    } catch (e) {
      console.warn("Failed to load orders from Supabase", e);
      setOrdersList([]);
    }
  };

  const [soundEnabled, setSoundEnabled] = useState(true);

  const playOrderChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.log("Audio notification trigger", e);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    // Check if session was active
    const wasLoggedIn = localStorage.getItem("orient_is_admin") === "true";
    if (wasLoggedIn) {
      if (window.innerWidth <= 768) {
        localStorage.removeItem("orient_is_admin");
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoggedIn(true);
      }
    }
    loadDbData();

    // 1. Smart 2-Minute Polling (Paused when tab is hidden or minimized)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDbData();
      }
    }, 120000);

    // 2. Instant Re-sync on Focus (Fetches instantly the moment you click back into the tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDbData();
      }
    };
    const handleFocus = () => {
      loadDbData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const triggerToast = (msg, type = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 3800);
  };

  // Authentication logic
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setAuthError("Admin portal is strictly restricted to laptops and desktops.");
      return;
    }

    setAuthError("");
    
    // NOTE: Developer bypass removed. Admins MUST authenticate via Supabase Auth.
    
    try {
      const userCredential = await login(loginEmail, loginPassword);
      if (userCredential && userCredential.user) {
        const user = userCredential.user;
        const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
        const isAdmin = userData && userData.role === "admin";
        
        if (isAdmin) {
          setIsLoggedIn(true);
          setAuthError("");
          localStorage.setItem("orient_is_admin", "true");
          triggerToast("Logged in successfully to Orient ERP");
        } else {
          setAuthError("Account does not have administrator privileges.");
        }
      }
    } catch (error) {
      setAuthError("Invalid credentials. Access Denied.");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSingleUploading(true);
    setSingleUploadStatus("Uploading images...");
    try {
      const uploadedImageUrls = [];
      if (singleUploadImages.length > 0) {
        const imagesToUpload = singleUploadImages.slice(0, 5);
        for (const file of imagesToUpload) {
          const options = { maxSizeMB: 2.0, maxWidthOrHeight: 2048, initialQuality: 0.92, useWebWorker: true };
          let fileToUpload = file;
          try {
            fileToUpload = await imageCompression(file, options);
          } catch (compErr) {
            console.warn("Compression skipped, uploading original:", compErr);
          }
          const fileExt = file.name.split('.').pop();
          const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, fileToUpload);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
          uploadedImageUrls.push(data.publicUrl);
        }
      }

      setSingleUploadStatus("Saving to database...");
      const id = Date.now().toString().slice(-6); // generate pseudo ID
      const newProductRecord = {
        id: id,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        department: newProduct.department,
        category: newProduct.category,
        barcode: newProduct.barcode,
        hsn: newProduct.hsn,
        gst: parseFloat(newProduct.gst),
        description: newProduct.description,
        fragile: newProduct.fragile,
        microwave: newProduct.microwave,
        search_tags: newProduct.search_tags || '',
        video_enabled: Boolean(newProduct.video_enabled),
        youtube_url: newProduct.video_enabled ? (newProduct.youtube_url || '') : '',
        instagram_url: newProduct.video_enabled ? (newProduct.instagram_url || '') : '',
        image: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : '/placeholder.jpg',
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : ['/placeholder.jpg']
      };

      const { error: insertErr } = await supabase.from('products').insert(newProductRecord);
      if (insertErr) throw insertErr;

      triggerToast("Product added successfully!");
      setShowAddProductModal(false);
      setNewProduct({
        name: "", price: "", stock: "", stockStatus: "Available", department: "Crockery & Dining",
        barcode: "", hsn: "", gst: 18, description: "", fragile: false, microwave: false, category: "General",
        search_tags: "",
        video_enabled: false,
        youtube_url: "", instagram_url: ""
      });
      setSingleUploadImages([]);
      loadDbData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to add product: " + err.message);
    } finally {
      setIsSingleUploading(false);
      setSingleUploadStatus("");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("orient_is_admin");
    triggerToast("Logged out successfully");
  };

  const handleDeleteProduct = (productId) => {
    const prod = productsList.find(p => String(p.id) === String(productId));
    const prodName = prod?.name || `Product #${productId}`;

    setConfirmModal({
      isOpen: true,
      title: "Delete Product",
      message: `Are you sure you want to permanently delete "${prodName}"?`,
      subMessage: "This product will be immediately removed from the live online catalog and store inventory database. This action cannot be reversed.",
      confirmText: "Yes, Delete Product",
      cancelText: "Keep Product",
      type: "danger",
      item: prod ? {
        id: prod.id,
        name: prod.name,
        price: prod.price,
        image: prod.image,
        category: prod.category || prod.department,
        stock: prod.stock
      } : { id: productId, name: `Product #${productId}` },
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const { error } = await supabase.from('products').delete().eq('id', productId);
          if (error) throw error;
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          triggerToast(`Product #${productId} deleted successfully`, "success");
          loadDbData();
        } catch (err) {
          console.error("Delete product error:", err);
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
          const errMsg = err?.message || "";
          if (errMsg.includes("foreign key") || errMsg.includes("violates foreign key") || err?.code === "23503") {
            triggerToast("Cannot Delete: This product has already been ordered by customers and is recorded in order invoices. Please change its Stock to 0 or 'Out of Stock' to hide it.", "warning");
          } else if (errMsg.includes("row-level security") || errMsg.includes("violates row-level security")) {
            triggerToast("Database Security Notice: Supabase RLS permission required. Please ensure you are logged into Admin or update Supabase RLS policies.", "error");
          } else {
            triggerToast("Failed to delete product: " + errMsg, "error");
          }
        }
      }
    });
  };

  const handleStartEditProduct = (p) => {
    const media = getProductMediaUrls(p);
    const prodName = p?.name || `Product #${p.id}`;

    setConfirmModal({
      isOpen: true,
      title: "Edit Product",
      message: `Do you want to edit specifications for "${prodName}"?`,
      subMessage: "Proceeding will open the editor where you can modify pricing, stock levels, images, warranty, and reviews.",
      confirmText: "Proceed to Edit",
      cancelText: "Cancel",
      type: "info",
      item: {
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category || p.department,
        stock: p.stock
      },
      isLoading: false,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setEditingProduct({ 
          ...p,
          search_tags: p.search_tags || "",
          youtube_url: p.youtube_url || media.youtube_url || "",
          instagram_url: p.instagram_url || media.instagram_url || ""
        });
      }
    });
  };

  const recoverTrappedOrders = async () => {
    if (typeof window === 'undefined') return;
    const trappedStr = localStorage.getItem("orient_orders");
    if (!trappedStr) {
      alert("No trapped orders found in this browser's local storage.");
      return;
    }
    try {
      const trappedOrders = JSON.parse(trappedStr);
      if (!Array.isArray(trappedOrders) || trappedOrders.length === 0) {
         alert("No trapped orders found.");
         return;
      }
      
      const confirmSync = window.confirm(`Found ${trappedOrders.length} orders in this browser's local storage. Do you want to sync them to the live database now?`);
      if (!confirmSync) return;

      triggerToast(`Starting sync for ${trappedOrders.length} orders... Please wait.`, "info");
      let successCount = 0;
      let skipCount = 0;

      for (const order of trappedOrders) {
        // Skip if already in live database
        if (ordersList.some(o => o.id === order.id || o.id === order.order_number)) {
          skipCount++;
          continue;
        }

        const payload = {
            order: order,
            method: order.paymentId === 'COD' ? 'COD' : 'Online'
        };

        const res = await fetch('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success || (data.message && data.message.includes("duplicate key"))) {
            successCount++;
        }
      }
      
      alert(`Sync Complete! Successfully added ${successCount} new orders to the live database. (Skipped ${skipCount} already existing orders).`);
      loadDbData();
    } catch (e) {
      console.error(e);
      alert("Error recovering orders: " + e.message);
    }
  };

  const handleProcessOrder = async (orderId, nextStatus, docId) => {
    let otpGenerated = null;
    try {
      const courierStatus = nextStatus === "Packed" ? "In Warehouse" : (nextStatus === "Shipped" ? "In Transit" : "Delivered");
      const currentOrder = ordersList.find(o => o.id === orderId);
      const paymentStatus = nextStatus === "Delivered" ? "SUCCESS" : (currentOrder && currentOrder.paymentStatus === "Paid" ? "SUCCESS" : (currentOrder ? currentOrder.paymentStatus : "SUCCESS"));

      // Optimistically update the UI to prevent perceived unresponsiveness
      setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus, courierStatus, paymentStatus } : o));

      // Get session token for admin API authorization
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Call secure server-side API to update database permanently
      const response = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderId,
          nextStatus,
          docId,
          paymentStatus
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to update order status");
      }
      if (result.otpGenerated) {
        otpGenerated = result.otpGenerated;
      }
      // Re-sync data from DB in background
      loadDbData();
    } catch (e) {
      console.warn("Failed to update order status in Supabase", e);
      updateOrderStatus(orderId, nextStatus); // Fallback
      loadDbData();
    }
    
    // Play sound chime and trigger custom milestone toast
    playOrderChime();
    if (nextStatus === "Packed") {
      triggerToast(`📦 Order ${orderId} Packed Successfully! Item wrapped & ready in Warehouse.`);
    } else if (nextStatus === "Shipped") {
      triggerToast(`🚚 Order ${orderId} Dispatched to Delivery Partner! OTP: ${otpGenerated || "Generated"}`);
    } else if (nextStatus === "Delivered") {
      triggerToast(`🎉 Order ${orderId} Delivered Successfully! Customer receipt signed.`);
    } else {
      triggerToast(`Order ${orderId} status updated to ${nextStatus}`);
    }
  };

  // Metric computations
  const allTimeRevenue = ordersList.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  
  const todayStr = new Date().toDateString();
  const todayOrders = ordersList.filter(o => o.date && new Date(o.date).toDateString() === todayStr);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyOrdersCount = ordersList.filter(o => {
    if (!o.date) return false;
    const d = new Date(o.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const totalOrdersCount = ordersList.length;
  // Active Dispatches are warehouse orders requiring action (Pending & Packed)
  const activeDispatchesCount = ordersList.filter(o => o.status === "Pending" || o.status === "Packed").length;
  const pendingOrdersCount = ordersList.filter(o => o.status === "Pending").length;
  const packedOrdersCount = ordersList.filter(o => o.status === "Packed").length;
  const pendingDispatchesCount = packedOrdersCount;
  const shippedOrdersCount = ordersList.filter(o => o.status === "Shipped").length;
  const deliveredOrdersCount = ordersList.filter(o => o.status === "Delivered").length;
  const lowStockCount = productsList.filter(p => p.stock < 5).length;

  // Cutoff date for recent orders (48 hours ago)
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - TWO_DAYS_MS);

  // Filters for order listing (Supports status filters & Calendar Date Range filter)
  const filteredOrders = ordersList.filter(order => {
    const matchesSearch = !orderSearch.trim() || 
                          (order.id && order.id.toLowerCase().includes(orderSearch.toLowerCase())) ||
                          (order.customerName && order.customerName.toLowerCase().includes(orderSearch.toLowerCase())) ||
                          (order.customerPhone && order.customerPhone.includes(orderSearch));
    
    const matchesStatus = orderFilter === "All" ||
                          (orderFilter === "Active" && (order.status === "Pending" || order.status === "Packed")) ||
                          (orderFilter === "Pending" && order.status === "Pending") ||
                          (orderFilter === "Packed" && order.status === "Packed") ||
                          (orderFilter === "Shipped" && order.status === "Shipped") ||
                          (orderFilter === "Delivered" && order.status === "Delivered") ||
                          (orderFilter === "Today" && order.date && new Date(order.date).toDateString() === todayStr);

    const orderTime = order.date ? new Date(order.date).getTime() : 0;
    const startTime = startDateFilter ? new Date(startDateFilter + "T00:00:00").getTime() : null;
    const endTime = endDateFilter ? new Date(endDateFilter + "T23:59:59").getTime() : null;

    const matchesDateRange = (!startTime || orderTime >= startTime) && (!endTime || orderTime <= endTime);
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Paginated orders for clean display (10 per page default)
  const paginatedOrders = filteredOrders.slice((ordersCurrentPage - 1) * ordersPerPage, ordersCurrentPage * ordersPerPage);

  // Dynamic Unique Departments and Categories
  const defaultDepts = ["Crockery & Dining", "Glassware & Barware", "Cookware", "Woodcraft", "Home Décor", "Gifting"];
  const defaultCats = ["General", "Dinner Sets", "Tea & Coffee Sets", "Bowls & Plates", "Wine Glasses", "Cutlery", "Vases & Decor", "Hampers"];
  
  const allDepartments = Array.from(new Set([
    ...defaultDepts,
    ...productsList.map(p => p.department).filter(Boolean)
  ]));

  const allCategories = Array.from(new Set([
    ...defaultCats,
    ...productsList.map(p => p.category).filter(Boolean)
  ]));

  const exportOrdersToCSV = () => {
    // Export all past orders (older than 48 hours)
    const pastOrders = ordersList.filter(o => new Date(o.date) < cutoffDate);
    
    if (pastOrders.length === 0) {
      triggerToast("No past orders available for export.");
      return;
    }

    const headers = ["Order ID", "Customer Name", "Mobile Number", "Date", "Invoice Total", "Status", "Courier Status"];
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const order of pastOrders) {
      const row = [
        order.id,
        `"${order.customerName}"`,
        `"${order.customerPhone}"`,
        `"${new Date(order.date).toLocaleString()}"`,
        order.total,
        order.status,
        order.courierStatus
      ];
      csvRows.push(row.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `past_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filters for products inventory
  const filteredProducts = productsList.filter(p => 
    p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    (p.barcode && p.barcode.includes(inventorySearch)) ||
    (p.category && p.category.toLowerCase().includes(inventorySearch.toLowerCase())) ||
    (p.search_tags && p.search_tags.toLowerCase().includes(inventorySearch.toLowerCase()))
  );

  // Edit stock update
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSingleUploading(true);
    setSingleUploadStatus("Uploading images...");
    
    let uploadedImageUrls = [...(editingProduct.images || [])];
    if (uploadedImageUrls.length > 5) {
      uploadedImageUrls = uploadedImageUrls.slice(0, 5);
    }
    
    const availableSlots = 5 - uploadedImageUrls.length;
    if (singleUploadImages && singleUploadImages.length > 0 && availableSlots > 0) {
      const filesToUpload = singleUploadImages.slice(0, availableSlots);
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const options = { maxSizeMB: 2.0, maxWidthOrHeight: 2048, initialQuality: 0.92, useWebWorker: true };
        try {
          const compressedFile = await imageCompression(file, options);
          const fileName = `${Date.now()}_${file.name}`;
          const { error } = await supabase.storage.from('product-images').upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });
          if (!error) {
            const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
            uploadedImageUrls.push(publicUrlData.publicUrl);
          }
        } catch (err) { console.error("Upload error:", err); }
      }
    }

    // Calculate ratings based on edited review entries
    const reviews = editingProduct.reviews || [];
    let rating = editingProduct.rating || 0;
    if (reviews.length > 0) {
      const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
      rating = Math.round((totalRatings / reviews.length) * 10) / 10;
    }

    const updated = {
      ...editingProduct,
      images: uploadedImageUrls,
      image: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : (editingProduct.image || '/placeholder.jpg'),
      price: parseFloat(editingProduct.price),
      stock: editingProduct.stockStatus === "Out of Stock" ? 0 : parseInt(editingProduct.stock),
      soldCount: parseInt(editingProduct.soldCount) || 0,
      gst: parseFloat(editingProduct.gst) || 18,
      rating,
      reviewCount: reviews.length,
      search_tags: editingProduct.search_tags || '',
      video_enabled: Boolean(editingProduct.video_enabled),
      youtube_url: editingProduct.video_enabled ? (editingProduct.youtube_url || '') : '',
      instagram_url: editingProduct.video_enabled ? (editingProduct.instagram_url || '') : '',
      image_settings: editingProduct.image_settings || {}
    };
    
    // Remove temporary UI fields that might not exist in Supabase schema to prevent PGRST204 errors
    delete updated.stockStatus;

    const updateProductInSupabase = async () => {
      try {
        const { error } = await supabase.from('products').upsert(updated);
        if (error) throw error;
        loadDbData();
        setEditingProduct(null);
        setSingleUploadImages([]);
        setIsSingleUploading(false);
        triggerToast(`Updated Product: ${updated.name}`, "success");
      } catch (error) {
        console.error("Error updating product in Supabase", error);
        const errMsg = error?.message || "";
        if (errMsg.includes("row-level security") || errMsg.includes("violates row-level security")) {
          triggerToast("Database Security Notice: Supabase RLS permission required to save product updates. Please check Admin session or Supabase RLS policy.", "error");
        } else {
          triggerToast("Failed to update product: " + errMsg, "error");
        }
        setIsSingleUploading(false);
      }
    };
    
    updateProductInSupabase();
  };

  // Add review manually to product stock
  const handleAddReviewManually = (e) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewText.trim()) return;

    const newRev = {
      id: "rev_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      reviewerName: newReviewAuthor.trim(),
      rating: parseInt(newReviewRating),
      comment: newReviewText.trim(),
      timestamp: new Date().toISOString()
    };

    setEditingProduct(prev => ({
      ...prev,
      reviews: [...(prev.reviews || []), newRev]
    }));

    setNewReviewAuthor("");
    setNewReviewText("");
    setNewReviewRating(5);
  };

  const handleDeleteReview = (revId) => {
    setEditingProduct(prev => ({
      ...prev,
      reviews: (prev.reviews || []).filter(r => r.id !== revId)
    }));
  };

  // Add combo hamper
  const handleAddCombo = async (e) => {
    e.preventDefault();
    const validSelections = comboSelectedProducts.filter(item => item.productId !== "");
    if (validSelections.length === 0) {
      triggerToast("Please select at least one existing product to create a combo!", "warning");
      return;
    }
    if (!newComboName || !newComboPrice || !newComboStock) {
      triggerToast("Please fill in core hamper details (Title, Price, Stock).", "warning");
      return;
    }

    setIsSingleUploading(true);
    setSingleUploadStatus("Uploading images...");
    
    let uploadedImageUrls = [];
    
    if (singleUploadImages && singleUploadImages.length > 0) {
      for (let i = 0; i < singleUploadImages.length; i++) {
        const file = singleUploadImages[i];
        const options = { maxSizeMB: 2.0, maxWidthOrHeight: 2048, initialQuality: 0.92, useWebWorker: true };
        try {
          const compressedFile = await imageCompression(file, options);
          const fileName = `${Date.now()}_${file.name}`;
          const { error } = await supabase.storage.from('product-images').upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });
          if (!error) {
            const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
            uploadedImageUrls.push(publicUrlData.publicUrl);
          }
        } catch (err) { console.error("Upload error:", err); }
      }
    }

    const bundleProductDetails = validSelections.map(item => {
      const prod = productsList.find(p => String(p.id) === String(item.productId));
      return prod ? `${item.quantity}x ${prod.name}` : null;
    }).filter(Boolean).join(", ");

    const firstSelectedProd = productsList.find(p => String(p.id) === String(validSelections[0]?.productId));
    const defaultImage = firstSelectedProd?.image || firstSelectedProd?.images?.[0] || "/images/acacia_wood_casserole.png";

    const newId = productsList.length > 0 ? Math.max(...productsList.map(p => p.id)) + 1 : 101;
    const newCombo = {
      id: newId,
      name: newComboName,
      price: parseFloat(newComboPrice),
      stock: parseInt(newComboStock),
      image: uploadedImageUrls[0] || newComboImage || defaultImage,
      department: newComboDept || "Gifting",
      category: newComboCat || "Gift Hampers",
      subCategory: newComboSub || "Combos",
      fragile: true,
      microwave: false,
      barcode: "000" + Math.floor(Math.random() * 900000 + 100000),
      hsn: "9505",
      gst: 18,
      soldCount: 0,
      description: `Curated Gift Hamper / Combo Box. Includes: ${bundleProductDetails}.`,
      rating: 5.0,
      reviewCount: 0,
      reviews: [],
      images: uploadedImageUrls.length > 0 ? uploadedImageUrls : (newComboImage ? [newComboImage] : [defaultImage])
    };

    const addComboToSupabase = async () => {
      try {
        await supabase.from('products').upsert(newCombo);
        loadDbData();
        setShowComboModal(false);
        setNewComboName("");
        setNewComboPrice("");
        setNewComboStock("");
        setNewComboImage("");
        setComboSelectedProducts([
          { id: 1, productId: "", quantity: 1 },
          { id: 2, productId: "", quantity: 1 }
        ]);
        setSingleUploadImages([]);
        setIsSingleUploading(false);
        triggerToast(`Registered new Gift Hamper: ${newComboName}`);
      } catch (error) {
        console.error("Error adding combo to Supabase", error);
        triggerToast("Failed to add hamper");
        setIsSingleUploading(false);
      }
    };
    
    addComboToSupabase();
  };

  // JSON Bulk Product Import Handlers
  const SAMPLE_JSON_TEMPLATE = [
    {
      "name": "Orient Royal Gold Rim Dinner Set (18 Pcs)",
      "department": "Crockery & Dining",
      "category": "Dinner Sets",
      "price": 3499,
      "stock": 25,
      "fragile": true,
      "microwave": false,
      "barcode": "890123456789",
      "hsn": "6911",
      "gst": 18,
      "description": "Handcrafted luxury bone china dinner collection with 24k gold leaf accents.",
      "image": "/placeholder.jpg"
    },
    {
      "name": "La Coppera Pure Hammered Copper Jug (1.5L)",
      "department": "Serveware",
      "category": "Jugs & Pitchers",
      "price": 1299,
      "stock": 40,
      "fragile": false,
      "microwave": false,
      "barcode": "890987654321",
      "hsn": "7418",
      "gst": 18,
      "description": "Pure hammered Ayurvedic copper water jug with anti-bacterial health benefits.",
      "image": "/placeholder.jpg"
    }
  ];

  // Smart JSON Sanitizer & Cleaner
  const sanitizeJsonString = (raw) => {
    if (!raw) return "";
    let cleaned = raw;
    // 1. Convert smart/curly quotes to standard double quotes
    cleaned = cleaned.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
    // 2. Fix empty key values like "image": \s*[,}\]] -> "image": ""
    cleaned = cleaned.replace(/"([^"]+)"\s*:\s*(?=[\,\}\]])/g, '"$1": ""');
    // 3. Fix empty keys followed by newlines
    cleaned = cleaned.replace(/"([^"]+)"\s*:\s*[\r\n]+\s*(?=[\,\}\]])/g, '"$1": ""\n');
    // 4. Remove trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1');
    return cleaned;
  };

  const diagnoseJsonError = (raw) => {
    const lines = raw.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check for key without value e.g. "image":
      if (/"([^"]+)"\s*:\s*$/.test(line.trim()) || /"([^"]+)"\s*:\s*(?:,|})/.test(line.trim())) {
        const match = line.match(/"([^"]+)"\s*:/);
        if (match && !line.includes('""') && !line.includes("''") && !line.includes('null') && !line.includes('true') && !line.includes('false') && !/\d+/.test(line.split(':')[1] || '')) {
          return `Line ${i + 1}: The field "${match[1]}" was left blank without quotes or value. Either delete that line, or write "${match[1]}": "" (empty quotes).`;
        }
      }
    }
    return null;
  };

  const handleAutoFixJson = () => {
    if (!jsonInputText.trim()) {
      triggerToast("Please paste JSON first.", "warning");
      return;
    }
    const cleaned = sanitizeJsonString(jsonInputText);
    try {
      const parsed = JSON.parse(cleaned);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonInputText(formatted);
      setJsonValidationResult({ valid: true, count: Array.isArray(parsed) ? parsed.length : 1 });
      triggerToast("✨ JSON auto-fixed and formatted successfully!", "success");
    } catch (err) {
      const hint = diagnoseJsonError(jsonInputText) || err.message;
      setJsonValidationResult({ valid: false, error: hint });
      triggerToast("Could not auto-fix: " + hint, "error");
    }
  };

  const handleCopySampleJson = () => {
    const formatted = JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2);
    setJsonInputText(formatted);
    setJsonValidationResult(null);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(formatted);
    }
    triggerToast("Sample JSON template loaded & copied to clipboard!", "success");
  };

  const handleValidateJson = () => {
    if (!jsonInputText.trim()) {
      setJsonValidationResult({ valid: false, error: "Please paste a JSON array of products first." });
      triggerToast("Please paste a JSON array first.", "warning");
      return;
    }

    // Try direct parse first
    try {
      const parsed = JSON.parse(jsonInputText);
      if (!Array.isArray(parsed)) {
        setJsonValidationResult({ valid: false, error: "JSON must be an Array of product objects: [ { ... }, { ... } ]" });
        triggerToast("Invalid format: JSON must be an array [ ... ]", "error");
        return;
      }
      if (parsed.length === 0) {
        setJsonValidationResult({ valid: false, error: "JSON array is empty. Please add at least 1 product object." });
        triggerToast("JSON array is empty.", "warning");
        return;
      }
      setJsonValidationResult({ valid: true, count: parsed.length });
      triggerToast(`✓ JSON is valid! Found ${parsed.length} product(s) ready for import.`, "success");
      return;
    } catch (directErr) {
      // Try with auto-sanitizer
      const cleaned = sanitizeJsonString(jsonInputText);
      try {
        const parsedClean = JSON.parse(cleaned);
        if (Array.isArray(parsedClean) && parsedClean.length > 0) {
          setJsonValidationResult({ 
            valid: true, 
            count: parsedClean.length, 
            warning: "Detected minor syntax issues (like empty values or trailing commas). Click 'Auto-Fix & Format' or Import directly." 
          });
          triggerToast(`✓ Valid (${parsedClean.length} products). Minor syntax auto-corrected!`, "success");
          return;
        }
      } catch (_) {}

      // Detailed diagnostics
      const hint = diagnoseJsonError(jsonInputText);
      const errorMsg = hint ? hint : `JSON Syntax Error: ${directErr.message}. (Tip: Click 'Auto-Fix & Format' or ensure all keys have valid values like \"\" or numbers).`;
      setJsonValidationResult({ valid: false, error: errorMsg });
      triggerToast(hint || "Invalid JSON syntax. Click 'Auto-Fix' or check quotes.", "error");
    }
  };

  const handleImportJsonToSupabase = async () => {
    if (!jsonInputText.trim()) {
      triggerToast("Please paste your JSON array first.", "warning");
      return;
    }
    let parsedData = [];
    try {
      // Use sanitizer to be forgiving with empty fields / commas
      const cleaned = sanitizeJsonString(jsonInputText);
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        triggerToast("JSON must be a non-empty array of products.", "warning");
        return;
      }
      parsedData = parsed;
    } catch (err) {
      const hint = diagnoseJsonError(jsonInputText);
      triggerToast(hint || ("Cannot import: " + err.message), "error");
      setJsonValidationResult({ valid: false, error: hint || err.message });
      return;
    }

    setIsJsonImporting(true);
    try {
      const existingMaxId = productsList.length > 0 ? Math.max(...productsList.map(p => parseInt(p.id) || 0)) : 200;
      
      const newProducts = parsedData.map((item, index) => {
        const prodId = item.id ? parseInt(item.id) : (existingMaxId + 1 + index);
        const img = item.image || (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '/placeholder.jpg');
        const imgs = Array.isArray(item.images) && item.images.length > 0 ? item.images : [img];

        return {
          id: prodId,
          name: item.name || `Imported Product #${prodId}`,
          price: parseFloat(item.price) || 0,
          stock: parseInt(item.stock) || 0,
          department: item.department || "Crockery & Dining",
          category: item.category || "General",
          subCategory: item.subCategory || "Plates",
          fragile: Boolean(item.fragile),
          microwave: Boolean(item.microwave),
          barcode: item.barcode || ("000" + Math.floor(Math.random() * 900000 + 100000)),
          hsn: item.hsn || "9505",
          gst: parseFloat(item.gst) || 18,
          soldCount: parseInt(item.soldCount) || 0,
          description: item.description || "Premium dining collection by Orient Crockeries.",
          rating: parseFloat(item.rating) || 5.0,
          reviewCount: parseInt(item.reviewCount) || 0,
          reviews: Array.isArray(item.reviews) ? item.reviews : [],
          search_tags: item.search_tags || "",
          image: img,
          images: imgs,
          warranty: item.warranty || "1 Year Brand Warranty"
        };
      });

      const { error } = await supabase.from('products').upsert(newProducts);
      if (error) throw error;

      loadDbData();
      setShowBulkUploadModal(false);
      setJsonInputText("");
      setJsonValidationResult(null);
      triggerToast(`🎉 Successfully imported ${newProducts.length} products to database!`, "success");
    } catch (err) {
      console.error("JSON Import Error:", err);
      triggerToast("Failed to import products: " + err.message, "error");
    } finally {
      setIsJsonImporting(false);
    }
  };

  if (isMobile) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        padding: '24px', 
        textAlign: 'center', 
        background: 'radial-gradient(circle at 50% 30%, #172554 0%, #0b1329 70%, #030712 100%)',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          maxWidth: "460px",
          width: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          padding: "2.5rem 2rem",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)"
        }}>
          {/* Security Icon Badge */}
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #1e3a8a 0%, #172554 100%)",
            border: "1px solid #3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem auto",
            color: "#60a5fa",
            fontSize: "2rem",
            boxShadow: "0 0 30px rgba(59, 130, 246, 0.3)"
          }}>
            <i className="fa-solid fa-laptop-code"></i>
          </div>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(234, 88, 12, 0.15)",
            border: "1px solid rgba(234, 88, 12, 0.4)",
            color: "#fb923c",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "0.74rem",
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            marginBottom: "1rem"
          }}>
            <i className="fa-solid fa-shield-halved"></i>
            <span>Security Policy Restriction</span>
          </div>

          <h2 style={{ 
            fontFamily: "var(--font-serif)", 
            fontSize: "1.8rem", 
            color: "#ffffff", 
            marginBottom: "0.8rem",
            letterSpacing: "-0.5px"
          }}>
            Laptop & Desktop Only
          </h2>

          <p style={{ 
            color: "#94a3b8", 
            fontSize: "0.92rem", 
            lineHeight: "1.6", 
            marginBottom: "1.8rem" 
          }}>
            For enterprise security, financial record privacy, and complex inventory management, the <b>Orient Crockery Admin Console</b> is strictly restricted to laptops and desktop screens.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link 
              href="/" 
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "13px 20px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "0.9rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
              }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Return to Customer Store</span>
            </Link>

            <a 
              href="https://automatexai.co.in/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                textDecoration: "none",
                marginTop: "6px"
              }}
            >
              Protected by AutomateX Cloud Security
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        backgroundColor: "#0b1329",
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Left Side - Luxury Brand Showcase (Matching Reference Screenshot) */}
        <div style={{
          flex: "1.1",
          background: "radial-gradient(circle at 20% 30%, #172554 0%, #0b1329 70%, #030712 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "3.5rem 4rem",
          position: "relative",
          overflow: "hidden",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          {/* Top Header badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 2 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.06)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              padding: "8px 16px",
              borderRadius: "12px"
            }}>
              <i className="fa-solid fa-store" style={{ color: "#38bdf8", fontSize: "1.1rem" }}></i>
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#f8fafc", letterSpacing: "0.5px" }}>ORIENT CROCKERIES</div>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>OFFICIAL STORE PORTAL</div>
              </div>
            </div>

            <a 
              href="https://automatexai.co.in/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                padding: "8px 14px",
                borderRadius: "12px",
                textDecoration: "none",
                color: "#ffffff"
              }}
            >
              <i className="fa-solid fa-microchip" style={{ color: "#38bdf8", fontSize: "0.95rem" }}></i>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#ffffff" }}>AutomateX</div>
                <div style={{ fontSize: "0.62rem", color: "#38bdf8", textTransform: "uppercase", fontWeight: "600" }}>OFFICIAL DEVELOPER</div>
              </div>
            </a>
          </div>

          {/* Center Content */}
          <div style={{ position: "relative", zIndex: 2, margin: "auto 0" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(56, 189, 248, 0.1)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              padding: "6px 14px",
              borderRadius: "20px",
              color: "#38bdf8",
              fontSize: "0.75rem",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "1.2rem"
            }}>
              <i className="fa-solid fa-code"></i> ENGINEERED BY AUTOMATEX
            </div>

            <h1 style={{ 
              color: "#f8fafc", 
              fontSize: "3rem", 
              fontFamily: "var(--font-serif)", 
              marginBottom: "1rem", 
              letterSpacing: "-0.5px",
              lineHeight: "1.15" 
            }}>
              Orient Crockery <span style={{ color: "#fbbf24" }}>Admin</span>
            </h1>

            <p style={{ fontSize: "1.05rem", color: "#94a3b8", maxWidth: "480px", lineHeight: "1.6", marginBottom: "2rem" }}>
              Secure central portal for managing store inventory, live price updates, custom gift hampers, and Orient Crockery retail operations.
            </p>

            {/* Feature Highlights */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "480px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#e2e8f0", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-bolt" style={{ color: "#38bdf8", width: "16px" }}></i>
                <span>Real-time Supabase Cloud Database Sync</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#e2e8f0", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-file-csv" style={{ color: "#34d399", width: "16px" }}></i>
                <span>Bulk CSV & JSON Inventory Management</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#e2e8f0", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-shield-halved" style={{ color: "#a78bfa", width: "16px" }}></i>
                <span>Cloudflare Edge SSL Protection & Fast CDN</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#e2e8f0", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-headset" style={{ color: "#fbbf24", width: "16px" }}></i>
                <span>24/7 Dedicated AutomateX Developer Support</span>
              </div>
            </div>
          </div>

          {/* Bottom Live System Indicator */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            borderTop: "1px solid rgba(255, 255, 255, 0.08)", 
            paddingTop: "1.2rem", 
            zIndex: 2,
            fontSize: "0.8rem",
            color: "#64748b"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", fontWeight: "600" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block", boxShadow: "0 0 10px #10b981" }}></span>
              System Status: Fully Operational
            </div>
            <div>Cloudflare Edge SSL Protected</div>
          </div>

          {/* Decorative background glow */}
          <div style={{
            position: "absolute",
            top: "20%",
            left: "10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(0,0,0,0) 70%)",
            zIndex: 1,
            pointerEvents: "none"
          }}></div>
        </div>

        {/* Right Side - Login Form & AutomateX Support Card */}
        <div style={{
          flex: "0.9",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ffffff",
          padding: "3rem 2rem",
          overflowY: "auto"
        }}>
          <div style={{ width: "100%", maxWidth: "420px" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ 
                width: "56px", 
                height: "56px", 
                backgroundColor: "#f1f5f9", 
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.2rem auto",
                color: "#0f172a",
                fontSize: "1.4rem",
                border: "1px solid #e2e8f0"
              }}>
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h2 style={{ fontSize: "1.75rem", color: "#0f172a", marginBottom: "0.3rem", fontWeight: "800", letterSpacing: "-0.5px" }}>Welcome Back</h2>
              <p style={{ color: "#64748b", fontSize: "0.92rem", margin: 0 }}>Please enter your credentials to access the dashboard.</p>
            </div>
            
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Admin Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                    <i className="fa-regular fa-envelope"></i>
                  </div>
                  <input 
                    type="email" 
                    placeholder="admin@orient.com" 
                    required 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                    style={{ 
                      width: '100%', 
                      padding: '12px 14px 12px 42px', 
                      border: '1.5px solid #e2e8f0', 
                      borderRadius: '10px', 
                      fontSize: '0.95rem', 
                      backgroundColor: '#f8fafc', 
                      color: '#0f172a',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#0f172a'; e.target.style.backgroundColor = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Password
                  </label>
                  <a 
                    href="https://wa.me/917425016636?text=Hi%20AutomateX%2C%20I%20forgot%20my%20Orient%20Crockeries%20admin%20password." 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.75rem", color: "#2563eb", textDecoration: "none", fontWeight: "600" }}
                  >
                    Forgot Password?
                  </a>
                </div>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                    <i className="fa-solid fa-lock"></i>
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password" 
                    required 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                    style={{ 
                      width: '100%', 
                      padding: '12px 42px 12px 42px', 
                      border: '1.5px solid #e2e8f0', 
                      borderRadius: '10px', 
                      fontSize: '0.95rem', 
                      backgroundColor: '#f8fafc', 
                      color: '#0f172a',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#0f172a'; e.target.style.backgroundColor = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: "50%", 
                      transform: "translateY(-50%)",
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      color: '#94a3b8',
                      padding: "5px"
                    }}
                  >
                    <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>

              {authError && (
                <div style={{ 
                  backgroundColor: "#fef2f2", 
                  border: "1px solid #fecaca", 
                  color: "#dc2626", 
                  padding: "10px 12px", 
                  borderRadius: "8px", 
                  fontSize: "0.85rem", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px"
                }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{authError}</span>
                </div>
              )}
              
              <button 
                type="submit" 
                style={{ 
                  marginTop: "0.5rem",
                  width: "100%",
                  padding: "13px",
                  backgroundColor: "#0f172a",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.25)"
                }}
              >
                Sign In to Dashboard
              </button>
            </form>

            {/* Need Help? AutomateX Support Card (Matching Reference Screenshot) */}
            <div style={{
              marginTop: "1.5rem",
              padding: "16px",
              borderRadius: "14px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <i className="fa-solid fa-headset" style={{ color: "#059669" }}></i>
                  <span>Need Help? AutomateX Support</span>
                </div>
                <span style={{ fontSize: "0.68rem", fontWeight: "700", backgroundColor: "#ecfdf5", color: "#059669", padding: "2px 8px", borderRadius: "12px", border: "1px solid #a7f3d0" }}>
                  24/7 Priority
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                <a 
                  href="tel:+917425016636"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 10px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    color: "#0f172a",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    textDecoration: "none"
                  }}
                >
                  <i className="fa-solid fa-phone" style={{ color: "#16a34a", fontSize: "0.8rem" }}></i>
                  <span>+91 7425016636</span>
                </a>

                <a 
                  href="https://wa.me/917425016636?text=Hi%20AutomateX%2C%20I%20need%20assistance%20with%20Orient%20Crockeries%20portal."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 10px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    color: "#0f172a",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    textDecoration: "none"
                  }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ color: "#10b981", fontSize: "0.88rem" }}></i>
                  <span>WhatsApp</span>
                </a>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <a 
                  href="tel:+919424466992"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 10px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    color: "#475569",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    textDecoration: "none"
                  }}
                >
                  <i className="fa-solid fa-phone-volume" style={{ color: "#3b82f6", fontSize: "0.75rem" }}></i>
                  <span>Alternate: +91 9424466992</span>
                </a>

                <a 
                  href="mailto:support@digifysoft.in"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 10px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    color: "#475569",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  <i className="fa-solid fa-envelope" style={{ color: "#ef4444", fontSize: "0.75rem" }}></i>
                  <span>support@digifysoft.in</span>
                </a>

                <a 
                  href="https://automatexai.co.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "6px 10px",
                    backgroundColor: "#f1f5f9",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "6px",
                    color: "#2563eb",
                    fontSize: "0.74rem",
                    fontWeight: "700",
                    textDecoration: "none"
                  }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem" }}></i>
                  <span>Visit AutomateX Portal (automatexai.co.in)</span>
                </a>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <p style={{ color: "#64748b", fontSize: "0.78rem", margin: 0 }}>
                &copy; {new Date().getFullYear()} Orient Crockery. Developed & Managed by <a href="https://automatexai.co.in/" target="_blank" rel="noopener noreferrer" style={{ color: "#0f172a", fontWeight: "700", textDecoration: "none" }}>AutomateX</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-page-wrapper" style={{ minHeight: "100vh", backgroundColor: "#f8fafc", margin: 0, padding: 0 }}>
      <div className="erp-page" style={{ 
        maxWidth: "1440px", 
        margin: "0 auto", 
        backgroundColor: "var(--bg-main)", 
        minHeight: "100vh", 
        boxShadow: "0 0 40px rgba(0,0,0,0.03)",
        position: "relative",
        paddingBottom: "5rem"
      }}>
        {/* Floating Support Button */}
        <div style={{
          position: "fixed",
          bottom: "24px",
          left: "24px",
          backgroundColor: "#0f172a",
          color: "#fff",
          padding: "10px 18px",
          borderRadius: "30px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          zIndex: 9999,
          border: "1px solid rgba(255, 255, 255, 0.15)"
        }}>
          <div style={{
            backgroundColor: "#fbbf24",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontSize: "0.85rem"
          }}>
            <i className="fa-solid fa-headset"></i>
          </div>
          <div>
            <div style={{ fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>AutomateX Support</div>
            <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#fff" }}>
              <a href="tel:+917425016636" style={{ color: "inherit", textDecoration: "none" }}>+91 7425016636</a>
            </div>
          </div>
        </div>

        {/* Top Header Console Bar matching Reference Screenshot */}
        <div style={{
          backgroundColor: "#0b1329",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "14px 6%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          {/* Left: Developer Badge */}
          <a 
            href="https://automatexai.co.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              padding: "6px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.12)"
            }}
          >
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "0.85rem"
            }}>
              <i className="fa-solid fa-microchip"></i>
            </div>
            <div>
              <div style={{ fontSize: "0.84rem", fontWeight: "800", color: "#ffffff" }}>AutomateX</div>
              <div style={{ fontSize: "0.62rem", color: "#38bdf8", fontWeight: "700", textTransform: "uppercase" }}>OFFICIAL DEVELOPER</div>
            </div>
          </a>

          {/* Center: Orient Crockeries Admin Console Pill */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#172554",
            border: "1px solid #1e3a8a",
            padding: "8px 20px",
            borderRadius: "30px",
            boxShadow: "0 0 20px rgba(37, 99, 235, 0.2)"
          }}>
            <i className="fa-solid fa-store" style={{ color: "#38bdf8", fontSize: "1rem" }}></i>
            <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#ffffff", letterSpacing: "1px" }}>
              ORIENT CROCKERIES
            </span>
            <span style={{
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "#93c5fd",
              fontSize: "0.65rem",
              fontWeight: "800",
              padding: "3px 8px",
              borderRadius: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              ADMIN CONSOLE
            </span>
          </div>

          {/* Right: Status & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34d399",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "0.78rem",
              fontWeight: "700"
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block", boxShadow: "0 0 8px #10b981" }}></span>
              LIVE DATABASE
            </div>

            <Link 
              href="/" 
              target="_blank" 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#f8fafc",
                padding: "6px 14px",
                borderRadius: "10px",
                fontSize: "0.82rem",
                fontWeight: "600",
                textDecoration: "none"
              }}
            >
              <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.75rem" }}></i>
              <span>View Store</span>
            </Link>

            <button 
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#ef4444",
                border: "none",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "10px",
                fontSize: "0.82rem",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>

      {/* Header Stats Bar */}
      <div className="erp-dashboard-header" style={{ padding: "1.5rem clamp(14px, 2.5vw, 36px) 2rem clamp(14px, 2.5vw, 36px)" }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "2.5rem",
          background: "linear-gradient(to right, #ffffff, #fafafa)",
          padding: "1.5rem 2rem",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
          border: "1px solid #eaeaea",
          borderLeft: "6px solid #d4af37",
          borderRight: "6px solid #111"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <img 
              src="/images/logo.jpg" 
              alt="Orient Crockeries Logo" 
              style={{ 
                width: "65px", 
                height: "65px", 
                borderRadius: "12px", 
                border: "1px solid #eaeaea", 
                objectFit: "contain",
                backgroundColor: "#fff",
                padding: "2px"
              }} 
            />
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.2rem", margin: 0, color: "#111", letterSpacing: "-0.5px" }}>
                Orient Crockery <span style={{ color: "#d4af37" }}>Admin</span>
              </h2>
              <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "0.9rem", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                Enterprise Product Management System
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              backgroundColor: '#fffbeb', 
              border: '1px solid #fef3c7', 
              padding: '8px 12px', 
              borderRadius: '8px', 
              color: '#d97706', 
              fontSize: '0.75rem', 
              fontWeight: '600',
              maxWidth: '280px',
              lineHeight: '1.3'
            }}>
              <i className="fa-solid fa-bell-on"></i>
              <span>New orders trigger sound notifications. Keep this panel open to receive them.</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket"></i> Logout Portal
            </button>
          </div>
        </div>

        {/* Metric widgets grid */}
        <div className="erp-metrics-grid">
          
          {/* Card 1: All-Time Revenue */}
          <div 
            className="metric-card-pro" 
            onClick={() => { setActiveTab("orders"); setOrderFilter("All"); }}
            style={{ cursor: "pointer", borderColor: (activeTab === "orders" && orderFilter === "All") ? "var(--primary)" : "#e2e8f0" }}
          >
            <div className="metric-card-header">
              <span className="metric-card-title">All-Time Revenue</span>
              <div className="metric-icon-avatar gold"><i className="fa-solid fa-wallet"></i></div>
            </div>
            <div className="metric-card-value">₹{allTimeRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="metric-card-subtext">Cumulative cleared store sales</div>
          </div>

          {/* Card 2: Total Orders (All Time) */}
          <div 
            className="metric-card-pro" 
            onClick={() => { setActiveTab("orders"); setOrderFilter("All"); }}
            style={{ cursor: "pointer", borderColor: (activeTab === "orders" && orderFilter === "All") ? "#2563eb" : "#e2e8f0" }}
          >
            <div className="metric-card-header">
              <span className="metric-card-title">All-Time Total Orders</span>
              <div className="metric-icon-avatar blue"><i className="fa-solid fa-boxes-stacked"></i></div>
            </div>
            <div className="metric-card-value">{totalOrdersCount}</div>
            <div className="metric-card-subtext">Lifetime customer transactions</div>
          </div>

          {/* Card 3: Today's Orders */}
          <div 
            className="metric-card-pro" 
            onClick={() => { setActiveTab("orders"); setOrderFilter("Today"); }}
            style={{ cursor: "pointer", borderColor: (activeTab === "orders" && orderFilter === "Today") ? "#059669" : "#e2e8f0" }}
          >
            <div className="metric-card-header">
              <span className="metric-card-title">Today's Total Orders</span>
              <div className="metric-icon-avatar green"><i className="fa-solid fa-calendar-day"></i></div>
            </div>
            <div className="metric-card-value">{todayOrders.length}</div>
            <div className="metric-card-subtext">Orders placed today</div>
          </div>

          {/* Card 4: Monthly Orders */}
          <div 
            className="metric-card-pro" 
            onClick={() => { setActiveTab("orders"); }}
            style={{ cursor: "pointer", borderColor: "#e2e8f0" }}
          >
            <div className="metric-card-header">
              <span className="metric-card-title">Monthly Total Orders</span>
              <div className="metric-icon-avatar" style={{ backgroundColor: "#f3e8ff", color: "#9333ea" }}><i className="fa-solid fa-calendar-days"></i></div>
            </div>
            <div className="metric-card-value">{monthlyOrdersCount}</div>
            <div className="metric-card-subtext">Orders placed this month</div>
          </div>

          {/* Card 5: Pending Orders */}
          <div 
            className="metric-card-pro" 
            onClick={() => { setActiveTab("orders"); setOrderFilter("Pending"); }}
            style={{ cursor: "pointer", borderColor: (activeTab === "orders" && orderFilter === "Pending") ? "#ea580c" : "#e2e8f0" }}
          >
            <div className="metric-card-header">
              <span className="metric-card-title">Pending Orders</span>
              <div className="metric-icon-avatar amber"><i className="fa-solid fa-clock-rotate-left"></i></div>
            </div>
            <div className="metric-card-value">{pendingOrdersCount}</div>
            <div className="metric-card-subtext">Awaiting admin processing</div>
          </div>

          {/* Card 6: Pending Dispatches (Packed) */}
          <div 
            className="metric-card-pro" 
            onClick={() => { setActiveTab("orders"); setOrderFilter("Packed"); }}
            style={{ cursor: "pointer", borderColor: (activeTab === "orders" && orderFilter === "Packed") ? "#f59e0b" : "#e2e8f0" }}
          >
            <div className="metric-card-header">
              <span className="metric-card-title">Pending Dispatches</span>
              <div className="metric-icon-avatar" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}><i className="fa-solid fa-box"></i></div>
            </div>
            <div className="metric-card-value">{pendingDispatchesCount}</div>
            <div className="metric-card-subtext">Packed, waiting for pickup</div>
          </div>

          {/* Card 7: Active Dispatches (Pending & Packed) */}
          <div 
            className="metric-card-pro" 
            onClick={() => { setActiveTab("orders"); setOrderFilter("Active"); setOrdersCurrentPage(1); }}
            style={{ cursor: "pointer", borderColor: (activeTab === "orders" && orderFilter === "Active") ? "#4f46e5" : "#e2e8f0" }}
          >
            <div className="metric-card-header">
              <span className="metric-card-title">Active Dispatches</span>
              <div className="metric-icon-avatar indigo"><i className="fa-solid fa-truck-fast"></i></div>
            </div>
            <div className="metric-card-value">{activeDispatchesCount}</div>
            <div className="metric-card-subtext">Action required in warehouse</div>
          </div>

        </div>
      </div>

      <div className="erp-main-section" style={{ padding: "0 clamp(14px, 2.5vw, 36px)" }}>
        {/* Tabs list */}
        <div className="erp-tabs-container">
          <div className="erp-tabs">
          <button 
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <i className="fa-solid fa-dolly"></i> <span>Orders Queue</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <i className="fa-solid fa-users"></i> <span>Users & Customers</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            <i className="fa-solid fa-boxes-stacked"></i> <span>Inventory Registry</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === "coupons" ? "active" : ""}`}
            onClick={() => setActiveTab("coupons")}
          >
            <i className="fa-solid fa-ticket"></i> <span>Coupons & Promos</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === "promo-popup" ? "active" : ""}`}
            onClick={() => setActiveTab("promo-popup")}
          >
            <i className="fa-solid fa-bullhorn"></i> <span>Promo Popup</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === "instructions" ? "active" : ""}`}
            onClick={() => setActiveTab("instructions")}
          >
            <i className="fa-solid fa-headset"></i> <span>Help & Developer Support</span>
          </button>
          </div>
        </div>

        {/* Tab 1: Orders Queue */}
        {activeTab === "orders" && (
          <div className="erp-content-box">
            <div className="panel-header" style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0 }}>Shipment Dispatches Queue</h3>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '0.72rem', 
                      fontWeight: '700', 
                      color: '#059669', 
                      backgroundColor: '#ecfdf5', 
                      border: '1px solid #a7f3d0', 
                      padding: '2px 10px', 
                      borderRadius: '12px' 
                    }}>
                      <span className="status-indicator online" style={{ width: '6px', height: '6px' }}></span>
                      Live Auto-Sync: 2m (Smart Pause)
                    </span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "4px 0 0 0" }}>Change statuses to trigger simulated BlueDart tracking logs</p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={recoverTrappedOrders}
                    title="Recover missing orders trapped in this browser"
                    style={{ 
                      height: '40px', 
                      padding: '0 16px',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      backgroundColor: '#ef4444',
                      borderColor: '#ef4444',
                      color: 'white'
                    }}
                  >
                    <i className="fa-solid fa-cloud-arrow-up"></i> Sync Local Orders
                  </button>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={loadDbData}
                    style={{ 
                      height: '40px', 
                      padding: '0 16px',
                      borderColor: 'var(--primary)', 
                      color: 'var(--primary)',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '8px',
                      fontWeight: '600'
                    }}
                  >
                    <i className="fa-solid fa-arrows-rotate"></i> Refresh Data
                  </button>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={exportOrdersToCSV}
                    style={{ 
                      height: '40px', 
                      padding: '0 16px',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '8px',
                      fontWeight: '600'
                    }}
                  >
                    <i className="fa-solid fa-file-csv"></i> Export CSV
                  </button>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', color: '#94a3b8', fontSize: '0.85rem' }}></i>
                    <input 
                      type="text" 
                      className="loyalty-input" 
                      placeholder="Search ID, customer, phone..." 
                      style={{ width: "220px", height: "40px", paddingLeft: "34px", borderRadius: "8px", fontSize: "0.85rem" }}
                      value={orderSearch}
                      onChange={(e) => { setOrderSearch(e.target.value); setOrdersCurrentPage(1); }}
                    />
                  </div>

                  {/* Calendar Date Range Selector */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '40px', flexWrap: 'nowrap' }}>
                    <i className="fa-solid fa-calendar-days" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}></i>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>From:</span>
                    <input 
                      type="date" 
                      value={startDateFilter} 
                      onChange={(e) => { setStartDateFilter(e.target.value); setOrdersCurrentPage(1); }}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 6px', fontSize: '0.78rem', color: '#1e293b', background: '#ffffff' }} 
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>To:</span>
                    <input 
                      type="date" 
                      value={endDateFilter} 
                      onChange={(e) => { setEndDateFilter(e.target.value); setOrdersCurrentPage(1); }}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 6px', fontSize: '0.78rem', color: '#1e293b', background: '#ffffff' }} 
                    />
                    {(startDateFilter || endDateFilter) && (
                      <button 
                        type="button"
                        onClick={() => { setStartDateFilter(""); setEndDateFilter(""); setOrdersCurrentPage(1); }}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Clear Date Range Filter"
                      >
                        <i className="fa-solid fa-xmark"></i> Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Filter Quick Pills Bar */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '6px' }}>Filter Status:</span>
                {[
                  { label: "Active Dispatches", value: "Active", icon: "fa-truck-fast", count: activeDispatchesCount },
                  { label: "Pending", value: "Pending", icon: "fa-clock-rotate-left", count: pendingOrdersCount },
                  { label: "Packed", value: "Packed", icon: "fa-box", count: packedOrdersCount },
                  { label: "Shipped", value: "Shipped", icon: "fa-paper-plane", count: shippedOrdersCount },
                  { label: "Delivered", value: "Delivered", icon: "fa-circle-check", count: deliveredOrdersCount },
                  { label: "Today's Orders", value: "Today", icon: "fa-calendar-day", count: todayOrders.length },
                  { label: "All Transactions", value: "All", icon: "fa-list", count: totalOrdersCount }
                ].map(filterBtn => (
                  <button
                    key={filterBtn.value}
                    onClick={() => { setOrderFilter(filterBtn.value); setOrdersCurrentPage(1); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      border: orderFilter === filterBtn.value ? '1.5px solid var(--primary)' : '1px solid #cbd5e1',
                      backgroundColor: orderFilter === filterBtn.value ? '#f0f4ff' : '#ffffff',
                      color: orderFilter === filterBtn.value ? 'var(--primary)' : '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: orderFilter === filterBtn.value ? '0 2px 8px rgba(67,24,255,0.12)' : 'none'
                    }}
                  >
                    <i className={`fa-solid ${filterBtn.icon}`} style={{ fontSize: '0.75rem' }}></i>
                    {filterBtn.label}
                    <span style={{ 
                      backgroundColor: orderFilter === filterBtn.value ? 'var(--primary)' : '#e2e8f0', 
                      color: orderFilter === filterBtn.value ? '#ffffff' : '#475569', 
                      borderRadius: '10px', 
                      padding: '1px 7px', 
                      fontSize: '0.72rem', 
                      fontWeight: '700' 
                    }}>
                      {filterBtn.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="table-responsive">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Fulfillment</th>
                    <th>Customer Name</th>
                    <th>Date</th>
                    <th>Invoice Total</th>
                    <th>Status</th>
                    <th>Courier Logs</th>
                    <th>Next Milestone Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        No orders recorded matching criteria. Place a mock checkout to populate this panel.
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map(order => {
                      const isExpanded = expandedAdminOrderId === order.id;
                      return (
                        <React.Fragment key={order.id}>
                          <tr style={{ background: isExpanded ? "#f8fafc" : "transparent", cursor: "pointer" }} onClick={() => setExpandedAdminOrderId(isExpanded ? null : order.id)}>
                            <td style={{ fontWeight: "700" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize: "0.75rem", color: "var(--primary)" }}></i>
                                <span>{order.id}</span>
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              {order.deliveryMethod === 'pickup' ? (
                                <span style={{ backgroundColor: "#e8f5e9", color: "#1b5e20", border: "1px solid #a5d6a7", padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center" }}>
                                  <i className="fa-solid fa-store" style={{ marginRight: "4px" }}></i> Self Pickup
                                </span>
                              ) : (
                                <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center" }}>
                                  <i className="fa-solid fa-truck" style={{ marginRight: "4px" }}></i> Home Delivery
                                </span>
                              )}
                            </td>
                            <td style={{ fontWeight: "600" }}>
                              <div style={{ color: "#0f172a", fontSize: "0.88rem", fontWeight: "700" }}>{order.customerName}</div>
                              {order.customerPhone && order.customerPhone !== 'N/A' ? (
                                <a 
                                  href={`tel:${order.customerPhone.replace(/[^0-9+]/g, '')}`} 
                                  className="phone-call-link"
                                  title="Click to Call Customer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <i className="fa-solid fa-phone"></i>
                                  <span>{order.customerPhone}</span>
                                </a>
                              ) : (
                                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>No Phone</span>
                              )}
                            </td>
                            <td style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>{new Date(order.date).toLocaleString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                            <td style={{ fontWeight: "700", color: "var(--primary)", whiteSpace: "nowrap" }}>₹{order.total.toFixed(2)}</td>
                            <td>
                              <span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span>
                            </td>
                            <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>{order.courierStatus}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", minWidth: "180px" }}>
                                {order.status === "Pending" && (
                                  <button 
                                    className="btn btn-outline btn-sm" 
                                    style={{ borderColor: "#00aaff", color: "#00aaff", padding: "4px 8px", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                                    onClick={() => handleProcessOrder(order.id, "Packed", order._docId)}
                                  >
                                    <i className="fa-solid fa-box"></i> Pack SKU
                                  </button>
                                )}
                                {order.status === "Packed" && (
                                  <button 
                                    className="btn btn-outline btn-sm" 
                                    style={{ borderColor: "var(--primary)", color: "var(--primary)", padding: "4px 8px", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                                    onClick={() => handleProcessOrder(order.id, "Shipped", order._docId)}
                                  >
                                    <i className="fa-solid fa-truck-fast"></i> Ship / Dispatch
                                  </button>
                                )}

                                <button 
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: "4px 8px", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                                  onClick={() => generateInvoicePDF(order)}
                                  title="Download Official Orient Crockery Tax Receipt PDF"
                                >
                                  <i className="fa-solid fa-file-pdf"></i> Print Tax Receipt
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Order Card Detail View */}
                          {isExpanded && (
                            <tr>
                              <td colSpan="8" style={{ background: "#f1f5f9", padding: "14px 16px" }}>
                                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1.5px solid #e2e8f0", paddingBottom: "10px", gap: "8px" }}>
                                    <h4 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "#0f172a" }}>
                                      Order Items Card ({order.id})
                                    </h4>
                                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                                      Fulfillment Mode: <b style={{ color: order.deliveryMethod === 'pickup' ? '#2e7d32' : '#0284c7' }}>{order.deliveryMethod === 'pickup' ? '🏪 Self Pickup (Store)' : '🚚 Home Delivery'}</b>
                                    </span>
                                  </div>

                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                                    {/* Items List */}
                                    <div>
                                      <h5 style={{ margin: "0 0 8px 0", fontSize: "0.85rem", textTransform: "uppercase", color: "#475569" }}>Purchased SKUs</h5>
                                      {order.items && order.items.length > 0 ? (
                                        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                                          {order.items.map((item, idx) => (
                                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: idx === order.items.length - 1 ? "none" : "1px solid #f1f5f9", fontSize: "0.85rem" }}>
                                              <span style={{ fontWeight: "600", color: "#1e293b" }}>
                                                <span style={{ color: "var(--primary)", marginRight: "8px", fontWeight: "700" }}>{item.quantity}x</span>
                                                {item.name}
                                              </span>
                                              <span style={{ fontWeight: "700", color: "#0f172a" }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Item details synced in ERP Database</p>
                                      )}
                                      <div style={{ marginTop: "10px", fontSize: "0.82rem", color: "#475569", wordBreak: "break-word" }}>
                                        <b>Destination Address:</b> {order.shippingAddress}
                                      </div>
                                    </div>

                                    {/* Bill Summary Box */}
                                    <div style={{ background: "#fafaf9", padding: "14px", borderRadius: "8px", border: "1px solid #e7e5e4" }}>
                                      <h5 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", textTransform: "uppercase", color: "#44403c" }}>Bill Breakdown</h5>
                                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.84rem" }}>
                                        <span style={{ color: "#78716c" }}>Subtotal (MRP):</span>
                                        <span style={{ fontWeight: "600" }}>₹{order.subtotal ? order.subtotal.toFixed(2) : order.total.toFixed(2)}</span>
                                      </div>
                                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.84rem" }}>
                                        <span style={{ color: "#78716c" }}>Delivery Charges:</span>
                                        <span style={{ fontWeight: "600", color: order.deliveryMethod === 'pickup' ? '#2e7d32' : '#1c1917' }}>
                                          {order.deliveryMethod === 'pickup' ? '₹0.00 (Self Pickup)' : `₹${(order.shipping || 0).toFixed(2)}`}
                                        </span>
                                      </div>
                                      {order.discount > 0 && (
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.84rem", color: "#16a34a" }}>
                                          <span>Discount:</span>
                                          <span>-₹{order.discount.toFixed(2)}</span>
                                        </div>
                                      )}
                                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "8px", borderTop: "1.5px solid #d6d3d1", fontWeight: "700", fontSize: "1rem", color: "#1c1917" }}>
                                        <span>Grand Total:</span>
                                        <span style={{ color: "var(--primary)" }}>₹{order.total.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredOrders.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '16px 4px 4px 4px',
                marginTop: '12px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Showing <b style={{ color: '#0f172a' }}>{Math.min((ordersCurrentPage - 1) * ordersPerPage + 1, filteredOrders.length)}</b> to <b style={{ color: '#0f172a' }}>{Math.min(ordersCurrentPage * ordersPerPage, filteredOrders.length)}</b> of <b style={{ color: '#0f172a' }}>{filteredOrders.length}</b> orders
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Per page:</span>
                  <select
                    value={ordersPerPage}
                    onChange={(e) => {
                      setOrdersPerPage(parseInt(e.target.value));
                      setOrdersCurrentPage(1);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      background: '#ffffff',
                      color: '#1e293b',
                      cursor: 'pointer'
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>

                  <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                    <button
                      onClick={() => setOrdersCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={ordersCurrentPage === 1}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: ordersCurrentPage === 1 ? '#f1f5f9' : '#ffffff',
                        color: ordersCurrentPage === 1 ? '#94a3b8' : '#334155',
                        cursor: ordersCurrentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fa-solid fa-chevron-left" style={{ fontSize: '0.7rem' }}></i> Prev
                    </button>

                    {Array.from({ length: Math.ceil(filteredOrders.length / ordersPerPage) }, (_, idx) => idx + 1)
                      .filter(page => {
                        const totalP = Math.ceil(filteredOrders.length / ordersPerPage);
                        return page === 1 || page === totalP || Math.abs(page - ordersCurrentPage) <= 1;
                      })
                      .map((page, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        return (
                          <React.Fragment key={page}>
                            {prevPage && page - prevPage > 1 && (
                              <span style={{ padding: '4px 6px', color: '#94a3b8', fontSize: '0.8rem' }}>...</span>
                            )}
                            <button
                              onClick={() => setOrdersCurrentPage(page)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: ordersCurrentPage === page ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                                background: ordersCurrentPage === page ? 'var(--primary)' : '#ffffff',
                                color: ordersCurrentPage === page ? '#ffffff' : '#334155',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '700'
                              }}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      onClick={() => setOrdersCurrentPage(prev => Math.min(Math.ceil(filteredOrders.length / ordersPerPage), prev + 1))}
                      disabled={ordersCurrentPage >= Math.ceil(filteredOrders.length / ordersPerPage)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: ordersCurrentPage >= Math.ceil(filteredOrders.length / ordersPerPage) ? '#f1f5f9' : '#ffffff',
                        color: ordersCurrentPage >= Math.ceil(filteredOrders.length / ordersPerPage) ? '#94a3b8' : '#334155',
                        cursor: ordersCurrentPage >= Math.ceil(filteredOrders.length / ordersPerPage) ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Next <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }}></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Inventory */}
        {activeTab === "inventory" && (
          <div className="erp-content-box">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3>Product Registry Management</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Configure prices, adjust stock levels, and review user submissions</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input 
                  type="text" 
                  className="loyalty-input" 
                  placeholder="Search name, category, barcode..." 
                  style={{ width: "260px", borderRadius: "8px" }}
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
                <button className="btn btn-outline btn-sm" onClick={() => setShowBulkUploadModal(true)} style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                  <i className="fa-solid fa-file-import"></i> Bulk Import
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddProductModal(true)}>
                  <i className="fa-solid fa-plus"></i> Single Add
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowComboModal(true)}>
                  <i className="fa-solid fa-circle-plus"></i> Create Gift Hamper
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>SKU ID</th>
                    <th>Image</th>
                    <th>Product Title</th>
                    <th>Department</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock status</th>
                    <th>Flags</th>
                    <th>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td>#SKU-{p.id}</td>
                      <td>
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          style={{ width: "40px", height: "40px", objectFit: "cover", border: "1px solid var(--border)" }} 
                        />
                      </td>
                      <td style={{ fontWeight: "600" }}>{p.name}</td>
                      <td>{p.department}</td>
                      <td>{p.category}</td>
                      <td>₹{p.price.toFixed(2)}</td>
                      <td style={{ 
                        color: (p.stock < 5 || p.stockStatus === 'Out of Stock') ? "var(--error)" : "inherit",
                        fontWeight: (p.stock < 5 || p.stockStatus === 'Out of Stock') ? "bold" : "normal"
                      }}>
                        {p.stockStatus === 'Out of Stock' || p.stock === 0 ? "Out of Stock" : `${p.stock} units left`}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {p.fragile && <span style={{ background: "rgba(169,68,66,0.1)", color: "var(--error)", padding: "2px 6px", fontSize: "0.65rem", fontWeight: "700" }}>FRAGILE</span>}
                          {p.microwave && <span style={{ background: "rgba(58,95,67,0.1)", color: "var(--success)", padding: "2px 6px", fontSize: "0.65rem", fontWeight: "700" }}>MICROWAVE SAFE</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button 
                            className="btn btn-outline btn-sm" 
                            onClick={() => handleStartEditProduct(p)}
                          >
                            <i className="fa-regular fa-pen-to-square"></i> Edit
                          </button>
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ borderColor: "var(--error)", color: "var(--error)" }}
                            onClick={() => handleDeleteProduct(p.id)}
                            title="Delete Product"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Coupons */}
        {activeTab === "coupons" && <CouponsTab />}

        {/* Tab 4: Promo Popup Manager */}
        {activeTab === "promo-popup" && <PromoPopupTab />}

        {/* Tab 5: Instructions */}
        {activeTab === "instructions" && <InstructionsTab />}
      </div>
      {/* Add Product Modal Form */}
      {showAddProductModal && (
        <div className="modal-overlay active" onClick={() => { setShowAddProductModal(false); setSingleUploadImages([]); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px", gridTemplateColumns: "1fr", maxHeight: "90vh", overflowY: "auto" }}>
            <button className="modal-close-btn" onClick={() => { setShowAddProductModal(false); setSingleUploadImages([]); }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            
            <form onSubmit={handleAddProduct} style={{ padding: "1.5rem" }}>
              <span className="modal-meta-label">Inventory Management</span>
              <h2 className="modal-title" style={{ fontSize: "1.6rem", marginBottom: "0.8rem" }}>Create Single Product</h2>
              
              {/* Instructions Booklet Box */}
              <div style={{ background: "rgba(184, 134, 11, 0.05)", padding: "14px 16px", borderRadius: "10px", border: "1px dashed var(--primary)", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "var(--dark)", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="fa-solid fa-circle-info" style={{ color: "var(--primary)" }}></i> Instructions & Setup Steps
                </h4>
                <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", color: "#555", lineHeight: "1.6" }}>
                  <li><b>Product Essentials:</b> Enter the product title name, retail price (₹), and initial stock count.</li>
                  <li><b>Inventory Details:</b> Set stock status (Available/Out of Stock), Barcode, HSN Code, and GST Rate (%).</li>
                  <li><b>Department & Category:</b> Assign to a specific department (e.g. Crockery, Cookware, Woodcraft).</li>
                  <li><b>Product Images:</b> Upload high-quality photo files or paste an image URL path before submitting.</li>
                </ol>
              </div>
              
              <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="form-group full-width">
                  <span className="form-label">Product Name</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
                    placeholder="Enter product title..."
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Price (₹)</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    required
                    placeholder="e.g. 1500"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Stock Units</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    required
                    placeholder="e.g. 50"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Stock Status</span>
                  <select 
                    className="sort-select"
                    value={newProduct.stockStatus}
                    onChange={(e) => setNewProduct({ ...newProduct, stockStatus: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
                <div className="form-group">
                  <span className="form-label">Barcode</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 8901234567"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">HSN Code</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 69111010"
                    value={newProduct.hsn}
                    onChange={(e) => setNewProduct({ ...newProduct, hsn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">GST Rate (%)</span>
                  <select 
                    className="sort-select"
                    style={{ width: "100%", padding: "10px 14px" }}
                    value={newProduct.gst || "18"}
                    onChange={(e) => setNewProduct({ ...newProduct, gst: e.target.value })}
                  >
                    <option value="5">5% GST</option>
                    <option value="18">18% GST</option>
                    <option value="0">0% (Exempted)</option>
                    <option value="12">12% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>
                <div className="form-group full-width" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {/* Department Selector / Custom Creator */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span className="form-label" style={{ marginBottom: 0 }}>Department</span>
                      {isCustomDept && (
                        <button 
                          type="button" 
                          onClick={() => { setIsCustomDept(false); setNewProduct({ ...newProduct, department: allDepartments[0] || "Crockery & Dining" }); }}
                          style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.72rem", cursor: "pointer", fontWeight: "700" }}
                        >
                          [Select Existing]
                        </button>
                      )}
                    </div>
                    {isCustomDept ? (
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Type custom department..."
                        value={newProduct.department}
                        onChange={(e) => setNewProduct({ ...newProduct, department: e.target.value })}
                        required
                      />
                    ) : (
                      <select 
                        className="sort-select"
                        style={{ width: "100%", padding: "10px 12px" }}
                        value={newProduct.department}
                        onChange={(e) => {
                          if (e.target.value === "__ADD_CUSTOM__") {
                            setIsCustomDept(true);
                            setNewProduct({ ...newProduct, department: "" });
                          } else {
                            setNewProduct({ ...newProduct, department: e.target.value });
                          }
                        }}
                      >
                        {allDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                        <option value="__ADD_CUSTOM__">➕ Add Custom Department...</option>
                      </select>
                    )}
                  </div>

                  {/* Category Selector / Custom Creator */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span className="form-label" style={{ marginBottom: 0 }}>Category</span>
                      {isCustomCat && (
                        <button 
                          type="button" 
                          onClick={() => { setIsCustomCat(false); setNewProduct({ ...newProduct, category: allCategories[0] || "General" }); }}
                          style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.72rem", cursor: "pointer", fontWeight: "700" }}
                        >
                          [Select Existing]
                        </button>
                      )}
                    </div>
                    {isCustomCat ? (
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Type custom category..."
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        required
                      />
                    ) : (
                      <select 
                        className="sort-select"
                        style={{ width: "100%", padding: "10px 12px" }}
                        value={newProduct.category}
                        onChange={(e) => {
                          if (e.target.value === "__ADD_CUSTOM__") {
                            setIsCustomCat(true);
                            setNewProduct({ ...newProduct, category: "" });
                          } else {
                            setNewProduct({ ...newProduct, category: e.target.value });
                          }
                        }}
                      >
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__ADD_CUSTOM__">➕ Add Custom Category...</option>
                      </select>
                    )}
                  </div>
                </div>
                <div className="form-group full-width" style={{ marginTop: "10px" }}>
                  <span className="form-label">Product Description</span>
                  <textarea 
                    className="form-input" 
                    rows="3"
                    placeholder="Enter detailed description here..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    style={{ resize: "vertical", width: "100%" }}
                  />
                </div>
                <div className="form-group full-width" style={{ marginTop: "10px" }}>
                  <span className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Search Tags / Keywords</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "normal" }}>Comma-separated</span>
                  </span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. mug, blue, cup, premium, ceramic, handmade"
                    value={newProduct.search_tags || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, search_tags: e.target.value })}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                    Keywords help customers discover this product when searching in the catalog.
                  </span>
                </div>
                <div className="form-group full-width" style={{ marginTop: "10px" }}>
                  <div style={{ background: "#eff6ff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #bfdbfe", marginBottom: "8px", fontSize: "0.8rem", color: "#1e40af" }}>
                    <i className="fa-solid fa-circle-info" style={{ marginRight: "6px" }}></i>
                    <b>Notice:</b> You can add a <b>maximum of 5 images</b> per product.
                  </div>
                  <span className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Upload Product Images (Max 5)</span>
                    <span style={{ fontSize: "0.75rem", color: singleUploadImages.length > 5 ? "#ef4444" : "#059669", fontWeight: "700" }}>
                      {singleUploadImages.length}/5 Selected
                    </span>
                  </span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 5) {
                        triggerToast("Maximum 5 images allowed per product. First 5 images selected.", "warning");
                        setSingleUploadImages(files.slice(0, 5));
                      } else {
                        setSingleUploadImages(files);
                      }
                    }}
                    disabled={isSingleUploading}
                    className="form-input"
                    style={{ paddingTop: "6px" }}
                  />
                  {singleUploadImages.length > 0 && (
                    <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "#059669", fontWeight: "500" }}>
                      <i className="fa-solid fa-circle-check"></i> {singleUploadImages.length} image(s) selected (Max 5)
                    </p>
                  )}
                </div>
                <div className="form-group full-width" style={{ flexDirection: "row", gap: "20px", marginTop: "10px" }}>
                  <label className="filter-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={newProduct.fragile}
                      onChange={(e) => setNewProduct({ ...newProduct, fragile: e.target.checked })}
                    />
                    <span>Fragile Handling</span>
                  </label>
                  <label className="filter-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={newProduct.microwave}
                      onChange={(e) => setNewProduct({ ...newProduct, microwave: e.target.checked })}
                    />
                    <span>Microwave Safe</span>
                  </label>
                </div>

                {/* Product Social Reel & Video Links Box */}
                {/* Product Video / Reel Showcase with ON/OFF Toggle Switch */}
                <div className="form-group full-width" style={{ 
                  background: newProduct.video_enabled ? "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)" : "#f8fafc", 
                  padding: "1rem", 
                  borderRadius: "12px", 
                  border: newProduct.video_enabled ? "1.5px solid #3b82f6" : "1.5px solid #cbd5e1", 
                  marginTop: "10px",
                  transition: "all 0.2s ease"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="fa-solid fa-video" style={{ color: newProduct.video_enabled ? "#2563eb" : "#94a3b8" }}></i> 
                      <span>Product Video & Reel Showcase</span>
                    </h4>

                    {/* Toggle Switch */}
                    <label style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      cursor: "pointer", 
                      fontSize: "0.78rem", 
                      fontWeight: "800", 
                      backgroundColor: newProduct.video_enabled ? "#dbeafe" : "#f1f5f9",
                      color: newProduct.video_enabled ? "#1d4ed8" : "#64748b",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      border: newProduct.video_enabled ? "1px solid #93c5fd" : "1px solid #cbd5e1",
                      userSelect: "none"
                    }}>
                      <input 
                        type="checkbox" 
                        checked={Boolean(newProduct.video_enabled)}
                        onChange={(e) => setNewProduct({ ...newProduct, video_enabled: e.target.checked })}
                        style={{ accentColor: "#2563eb", width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <span>{newProduct.video_enabled ? "SHOWCASE ENABLED (ON)" : "DISABLED (OFF)"}</span>
                    </label>
                  </div>

                  <p style={{ margin: "0 0 12px 0", fontSize: "0.78rem", color: "#64748b" }}>
                    {newProduct.video_enabled 
                      ? "Paste live Instagram Reel or YouTube Video link to display video player in customer modal." 
                      : "Video demo is currently turned OFF. Toggle ON if you wish to attach a video demo."}
                  </p>

                  {newProduct.video_enabled && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div className="form-group">
                        <span className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
                          <i className="fa-brands fa-instagram" style={{ color: "#e1306c" }}></i> Instagram Reel / Post URL
                        </span>
                        <input 
                          type="url" 
                          className="form-input" 
                          placeholder="https://www.instagram.com/reel/..."
                          value={newProduct.instagram_url || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, instagram_url: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <span className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
                          <i className="fa-brands fa-youtube" style={{ color: "#ff0000" }}></i> YouTube Video / Shorts URL
                        </span>
                        <input 
                          type="url" 
                          className="form-input" 
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={newProduct.youtube_url || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, youtube_url: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={isSingleUploading}>
                {isSingleUploading ? singleUploadStatus || "Creating..." : "Create Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal Form */}
      {editingProduct && (
        <div className="modal-overlay active" onClick={() => { setEditingProduct(null); setSingleUploadImages([]); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px", gridTemplateColumns: "1fr", maxHeight: "90vh", overflowY: "auto", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <button className="modal-close-btn" onClick={() => { setEditingProduct(null); setSingleUploadImages([]); }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            
            <form onSubmit={handleUpdateProduct} style={{ padding: "1.5rem" }}>
              <span className="modal-meta-label">Edit Specifications</span>
              <h2 className="modal-title" style={{ fontSize: "1.6rem", marginBottom: "1.2rem" }}>
                Edit Product — SKU #{editingProduct.id}
              </h2>
              
              <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="form-group full-width">
                  <span className="form-label">Product Name</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <span className="form-label">Product Description</span>
                  <textarea 
                    className="form-input" 
                    rows="3"
                    placeholder="Enter detailed description here..."
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    style={{ resize: "vertical", width: "100%" }}
                  />
                </div>

                <div className="form-group full-width" style={{ marginTop: "10px" }}>
                  <span className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Search Tags / Keywords</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "normal" }}>Comma-separated</span>
                  </span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. mug, blue, cup, premium, ceramic, handmade"
                    value={editingProduct.search_tags || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, search_tags: e.target.value })}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                    Keywords help customers discover this product when searching in the catalog.
                  </span>
                </div>

                <div className="form-group">
                  <span className="form-label">Price (₹)</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <span className="form-label">Stock Units</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <span className="form-label">Stock Status</span>
                  <select 
                    className="sort-select"
                    value={editingProduct.stockStatus || "Available"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockStatus: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div className="form-group">
                  <span className="form-label">Barcode</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingProduct.barcode || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <span className="form-label">HSN Code</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingProduct.hsn || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, hsn: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <span className="form-label">GST Rate (%)</span>
                  <select 
                    className="sort-select"
                    style={{ width: "100%", padding: "10px 14px" }}
                    value={editingProduct.gst || "18"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gst: e.target.value })}
                  >
                    <option value="5">5% GST</option>
                    <option value="18">18% GST</option>
                    <option value="0">0% (Exempted)</option>
                    <option value="12">12% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>

                <div className="form-group full-width" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {/* Department Selector / Custom Creator */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span className="form-label" style={{ marginBottom: 0 }}>Department</span>
                      {isEditCustomDept && (
                        <button 
                          type="button" 
                          onClick={() => { setIsEditCustomDept(false); setEditingProduct({ ...editingProduct, department: allDepartments[0] || "Crockery & Dining" }); }}
                          style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.72rem", cursor: "pointer", fontWeight: "700" }}
                        >
                          [Select Existing]
                        </button>
                      )}
                    </div>
                    {isEditCustomDept ? (
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Type custom department..."
                        value={editingProduct.department || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, department: e.target.value })}
                        required
                      />
                    ) : (
                      <select 
                        className="sort-select"
                        style={{ width: "100%", padding: "10px 12px" }}
                        value={editingProduct.department || ""}
                        onChange={(e) => {
                          if (e.target.value === "__ADD_CUSTOM__") {
                            setIsEditCustomDept(true);
                            setEditingProduct({ ...editingProduct, department: "" });
                          } else {
                            setEditingProduct({ ...editingProduct, department: e.target.value });
                          }
                        }}
                      >
                        {allDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                        <option value="__ADD_CUSTOM__">➕ Add Custom Department...</option>
                      </select>
                    )}
                  </div>

                  {/* Category Selector / Custom Creator */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span className="form-label" style={{ marginBottom: 0 }}>Category</span>
                      {isEditCustomCat && (
                        <button 
                          type="button" 
                          onClick={() => { setIsEditCustomCat(false); setEditingProduct({ ...editingProduct, category: allCategories[0] || "General" }); }}
                          style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.72rem", cursor: "pointer", fontWeight: "700" }}
                        >
                          [Select Existing]
                        </button>
                      )}
                    </div>
                    {isEditCustomCat ? (
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Type custom category..."
                        value={editingProduct.category || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        required
                      />
                    ) : (
                      <select 
                        className="sort-select"
                        style={{ width: "100%", padding: "10px 12px" }}
                        value={editingProduct.category || "General"}
                        onChange={(e) => {
                          if (e.target.value === "__ADD_CUSTOM__") {
                            setIsEditCustomCat(true);
                            setEditingProduct({ ...editingProduct, category: "" });
                          } else {
                            setEditingProduct({ ...editingProduct, category: e.target.value });
                          }
                        }}
                      >
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__ADD_CUSTOM__">➕ Add Custom Category...</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="form-group full-width">
                  <div style={{ background: "#e0f2fe", padding: "10px 14px", borderRadius: "10px", border: "1px solid #bae6fd", marginBottom: "12px", fontSize: "0.82rem", color: "#0369a1", lineHeight: "1.4" }}>
                    <i className="fa-solid fa-circle-info" style={{ marginRight: "6px", color: "#0284c7" }}></i>
                    <b>Main Cover Image Rule:</b> Maximum <b>5 Images</b> allowed per product. Position <b>#1</b> serves as the <b>Main Catalog Display Image</b> across the entire store. Use <code>◀ Left</code> and <code>▶ Right</code> to adjust image sequence.
                  </div>

                  <span className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Existing Images & Display Sequence</span>
                    <span style={{ fontSize: "0.75rem", color: (editingProduct.images?.length || 0) >= 5 ? "#ef4444" : "#4318ff", fontWeight: "700", backgroundColor: (editingProduct.images?.length || 0) >= 5 ? "#fee2e2" : "#e0e7ff", padding: "3px 10px", borderRadius: "12px" }}>
                      {Math.min(5, editingProduct.images?.length || (editingProduct.image && editingProduct.image !== '/placeholder.jpg' ? 1 : 0))}/5 Images Used
                    </span>
                  </span>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "10px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}>
                    {(() => {
                      const currentImages = editingProduct.images?.length > 0 ? editingProduct.images : (editingProduct.image && editingProduct.image !== '/placeholder.jpg' ? [editingProduct.image] : []);
                      if (currentImages.length === 0) {
                        return <p style={{ fontSize: "0.9rem", color: "#64748b", margin: 0, fontStyle: "italic" }}>No images currently attached to this product.</p>;
                      }
                      const settingsMap = editingProduct.image_settings || {};
                      return currentImages.map((imgUrl, idx) => {
                        const imgConfig = settingsMap[imgUrl] || { fit: 'cover', x: 50, y: 50 };
                        return (
                          <div key={idx} style={{ position: "relative", width: "110px", height: "120px", borderRadius: "8px", overflow: "hidden", border: idx === 0 ? "2px solid #2563eb" : "1.5px solid #cbd5e1", backgroundColor: "#fff", display: "flex", flexDirection: "column" }}>
                            {/* Position Badge */}
                            <div style={{ position: "absolute", top: "4px", left: "4px", background: idx === 0 ? "#2563eb" : "rgba(15, 23, 42, 0.75)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem", fontWeight: "700", zIndex: 10 }}>
                              {idx === 0 ? "★ Cover #1" : `#${idx + 1}`}
                            </div>

                            <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
                              <img 
                                src={imgUrl} 
                                alt={`Product ${idx}`} 
                                style={{ 
                                  width: "100%", 
                                  height: "100%", 
                                  objectFit: imgConfig.fit || "cover", 
                                  objectPosition: `${imgConfig.x ?? 50}% ${imgConfig.y ?? 50}%`,
                                  transform: imgConfig.zoom && imgConfig.zoom !== 1 ? `scale(${imgConfig.zoom})` : 'none'
                                }} 
                              />
                              <button 
                                type="button"
                                title="Delete Image"
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Remove Image",
                                    message: "Are you sure you want to remove this photo from the product gallery?",
                                    subMessage: "The image will be removed once you click Save Changes.",
                                    confirmText: "Remove Image",
                                    cancelText: "Cancel",
                                    type: "warning",
                                    item: {
                                      image: currentImages[idx],
                                      name: `Gallery Image #${idx + 1}`
                                    },
                                    isLoading: false,
                                    onConfirm: () => {
                                      const newImages = currentImages.filter((_, i) => i !== idx);
                                      setEditingProduct({ 
                                        ...editingProduct, 
                                        images: newImages, 
                                        image: newImages.length > 0 ? newImages[0] : '/placeholder.jpg' 
                                      });
                                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                      triggerToast("Image removed from gallery", "info");
                                    }
                                  });
                                }}
                                style={{ 
                                  position: "absolute", top: "4px", right: "4px", background: "#ef4444", 
                                  color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", 
                                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", 
                                  fontSize: "0.7rem", zIndex: 10
                                }}
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </div>

                            {/* Reordering & Align Toolbar */}
                            <div style={{ display: "flex", gap: "2px", background: "#0f172a", padding: "2px" }}>
                              <button 
                                type="button"
                                title="Move Left"
                                disabled={idx === 0}
                                onClick={() => {
                                  if (idx === 0) return;
                                  const arr = [...currentImages];
                                  const temp = arr[idx];
                                  arr[idx] = arr[idx - 1];
                                  arr[idx - 1] = temp;
                                  setEditingProduct({ ...editingProduct, images: arr, image: arr[0] });
                                }}
                                style={{ flex: 1, background: idx === 0 ? "#334155" : "#1e293b", color: "#fff", border: "none", borderRadius: "3px", padding: "3px 0", fontSize: "0.65rem", cursor: idx === 0 ? "not-allowed" : "pointer" }}
                              >
                                ◀
                              </button>

                              <button 
                                type="button"
                                title="Adjust Alignment & Fit"
                                onClick={() => {
                                  setAligningImage({
                                    url: imgUrl,
                                    index: idx,
                                    fit: imgConfig.fit || 'cover',
                                    x: imgConfig.x !== undefined ? imgConfig.x : 50,
                                    y: imgConfig.y !== undefined ? imgConfig.y : 50,
                                    zoom: imgConfig.zoom !== undefined ? imgConfig.zoom : 1
                                  });
                                }}
                                style={{ flex: 1.5, background: "#2563eb", color: "#fff", border: "none", borderRadius: "3px", padding: "3px 0", fontSize: "0.62rem", fontWeight: "600", cursor: "pointer" }}
                              >
                                Align
                              </button>

                              <button 
                                type="button"
                                title="Move Right"
                                disabled={idx === currentImages.length - 1}
                                onClick={() => {
                                  if (idx >= currentImages.length - 1) return;
                                  const arr = [...currentImages];
                                  const temp = arr[idx];
                                  arr[idx] = arr[idx + 1];
                                  arr[idx + 1] = temp;
                                  setEditingProduct({ ...editingProduct, images: arr, image: arr[0] });
                                }}
                                style={{ flex: 1, background: idx === currentImages.length - 1 ? "#334155" : "#1e293b", color: "#fff", border: "none", borderRadius: "3px", padding: "3px 0", fontSize: "0.65rem", cursor: idx === currentImages.length - 1 ? "not-allowed" : "pointer" }}
                              >
                                ▶
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className="form-group full-width">
                  <span className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Upload New / Additional Images (Max 5 Total)</span>
                    <span style={{ fontSize: "0.75rem", color: (editingProduct.images?.length || 0) >= 5 ? "#ef4444" : "#059669", fontWeight: "700" }}>
                      {(editingProduct.images?.length || 0)}/5 Used
                    </span>
                  </span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const currentCount = editingProduct.images?.length || 0;
                      const availableSlots = 5 - currentCount;
                      if (availableSlots <= 0) {
                        triggerToast("Maximum limit of 5 images per product reached! Remove an existing image first.", "warning");
                        setSingleUploadImages([]);
                        return;
                      }
                      if (files.length > availableSlots) {
                        triggerToast(`Maximum 5 images allowed per product. Only the first ${availableSlots} selected image(s) will be uploaded.`, "warning");
                        setSingleUploadImages(files.slice(0, availableSlots));
                      } else {
                        setSingleUploadImages(files);
                      }
                    }}
                    disabled={isSingleUploading || (editingProduct.images?.length || 0) >= 5}
                    className="form-input"
                  />
                  {(editingProduct.images?.length || 0) >= 5 ? (
                    <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem", color: "#ef4444", fontWeight: "600" }}>
                      <i className="fa-solid fa-circle-exclamation"></i> Maximum 5 images limit reached. Remove an existing image to upload new ones.
                    </p>
                  ) : singleUploadImages.length > 0 && (
                    <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem", color: "#059669", fontWeight: "500" }}>
                      <i className="fa-solid fa-circle-check"></i> {singleUploadImages.length} new image(s) ready to insert (Total will be {((editingProduct.images?.length || 0) + singleUploadImages.length)}/5)
                    </p>
                  )}
                </div>
                
                <div className="form-group full-width" style={{ display: "flex", flexWrap: "wrap", gap: "25px", alignItems: "center", margin: "5px 0" }}>
                  <label className="filter-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={editingProduct.fragile}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fragile: e.target.checked })}
                    />
                    <span>Fragile Handling</span>
                  </label>
                  <label className="filter-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={editingProduct.microwave}
                      onChange={(e) => setEditingProduct({ ...editingProduct, microwave: e.target.checked })}
                    />
                    <span>Microwave Safe</span>
                  </label>

                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155" }}>Warranty:</span>
                    <select 
                      className="sort-select"
                      style={{ padding: "6px 12px", borderRadius: "6px" }}
                      value={(editingProduct.warranty && !["No Warranty", "6 Months Brand Warranty", "1 Year Brand Warranty", "2 Years Replacement Warranty", "5 Years Orient Guarantee", "Lifetime Craftsmanship Warranty"].includes(editingProduct.warranty)) ? "Custom" : (editingProduct.warranty || "No Warranty")}
                      onChange={(e) => {
                        if (e.target.value === "Custom") {
                          setEditingProduct({ ...editingProduct, warranty: "" });
                        } else {
                          setEditingProduct({ ...editingProduct, warranty: e.target.value });
                        }
                      }}
                    >
                      <option value="No Warranty">No Warranty</option>
                      <option value="6 Months Brand Warranty">6 Months Brand Warranty</option>
                      <option value="1 Year Brand Warranty">1 Year Brand Warranty</option>
                      <option value="2 Years Replacement Warranty">2 Years Replacement Warranty</option>
                      <option value="5 Years Orient Guarantee">5 Years Orient Guarantee</option>
                      <option value="Lifetime Craftsmanship Warranty">Lifetime Craftsmanship Warranty</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {(editingProduct.warranty !== undefined && !["No Warranty", "6 Months Brand Warranty", "1 Year Brand Warranty", "2 Years Replacement Warranty", "5 Years Orient Guarantee", "Lifetime Craftsmanship Warranty"].includes(editingProduct.warranty)) && (
                      <input 
                        type="text"
                        value={editingProduct.warranty}
                        onChange={(e) => setEditingProduct({ ...editingProduct, warranty: e.target.value })}
                        placeholder="e.g. 3 Months Warranty"
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", width: "180px" }}
                      />
                    )}
                  </div>
                </div>

                {/* Product Video / Reel Showcase with ON/OFF Toggle Switch */}
                <div className="form-group full-width" style={{ 
                  background: editingProduct.video_enabled ? "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)" : "#f8fafc", 
                  padding: "1rem", 
                  borderRadius: "12px", 
                  border: editingProduct.video_enabled ? "1.5px solid #3b82f6" : "1.5px solid #cbd5e1",
                  transition: "all 0.2s ease"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="fa-solid fa-video" style={{ color: editingProduct.video_enabled ? "#2563eb" : "#94a3b8" }}></i> 
                      <span>Product Video & Reel Showcase</span>
                    </h4>

                    {/* Toggle Switch */}
                    <label style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      cursor: "pointer", 
                      fontSize: "0.78rem", 
                      fontWeight: "800", 
                      backgroundColor: editingProduct.video_enabled ? "#dbeafe" : "#f1f5f9",
                      color: editingProduct.video_enabled ? "#1d4ed8" : "#64748b",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      border: editingProduct.video_enabled ? "1px solid #93c5fd" : "1px solid #cbd5e1",
                      userSelect: "none"
                    }}>
                      <input 
                        type="checkbox" 
                        checked={Boolean(editingProduct.video_enabled)}
                        onChange={(e) => setEditingProduct({ ...editingProduct, video_enabled: e.target.checked })}
                        style={{ accentColor: "#2563eb", width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <span>{editingProduct.video_enabled ? "SHOWCASE ENABLED (ON)" : "DISABLED (OFF)"}</span>
                    </label>
                  </div>

                  <p style={{ margin: "0 0 12px 0", fontSize: "0.78rem", color: "#64748b" }}>
                    {editingProduct.video_enabled 
                      ? "Paste live Instagram Reel or YouTube Video link to display video player in customer modal." 
                      : "Video demo is currently turned OFF. Toggle ON if you wish to attach a video demo."}
                  </p>

                  {editingProduct.video_enabled && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div className="form-group">
                        <span className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
                          <i className="fa-brands fa-instagram" style={{ color: "#e1306c" }}></i> Instagram Reel / Post URL
                        </span>
                        <input 
                          type="url" 
                          className="form-input" 
                          placeholder="https://www.instagram.com/reel/..."
                          value={editingProduct.instagram_url || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, instagram_url: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <span className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
                          <i className="fa-brands fa-youtube" style={{ color: "#ff0000" }}></i> YouTube Video / Shorts URL
                        </span>
                        <input 
                          type="url" 
                          className="form-input" 
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={editingProduct.youtube_url || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, youtube_url: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Reviews Management Box */}
                <div className="form-group full-width" style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1.5px solid #cbd5e1" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fa-solid fa-star" style={{ color: "#f59e0b" }}></i> Customer Reviews Management
                  </h4>
                  
                  {/* Manual Review Injection */}
                  <div style={{ padding: "12px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "1rem" }}>
                    <span className="modal-meta-label" style={{ fontSize: "0.75rem", marginBottom: "8px" }}>Inject Custom Review</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "10px", marginBottom: "8px" }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Reviewer Name (e.g. Ananya Sharma)"
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        style={{ width: "100%" }}
                      />
                      <select 
                        className="sort-select" 
                        value={newReviewRating} 
                        onChange={(e) => setNewReviewRating(parseInt(e.target.value))}
                        style={{ width: "100%", padding: "8px" }}
                      >
                        <option value="5">5 ★★★★★</option>
                        <option value="4">4 ★★★★</option>
                        <option value="3">3 ★★★</option>
                      </select>
                    </div>
                    <textarea 
                      rows="2" 
                      className="form-input" 
                      placeholder="Write customer review comment..."
                      style={{ resize: "vertical", width: "100%" }}
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                    />
                    <button 
                      type="button"
                      className="btn btn-outline btn-sm btn-full" 
                      style={{ marginTop: "8px", padding: "6px" }}
                      onClick={handleAddReviewManually}
                    >
                      + Insert Customer Review
                    </button>
                  </div>

                  {/* Attached Reviews List with Delete */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(!editingProduct.reviews || editingProduct.reviews.length === 0) ? (
                      <p style={{ fontStyle: "italic", fontSize: "0.8rem", color: "#64748b", margin: 0 }}>No customer reviews attached.</p>
                    ) : (
                      editingProduct.reviews.map((rev, rIdx) => (
                        <div key={rev.id || rIdx} style={{ fontSize: "0.83rem", padding: "10px 12px", background: "#fff", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "600", marginBottom: "4px", color: "#1e293b" }}>
                            <span>{rev.reviewerName} ({rev.rating}★)</span>
                            <button 
                              type="button"
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: "Delete Customer Review",
                                  message: `Are you sure you want to delete the review by "${rev.reviewerName}" (${rev.rating}★)?`,
                                  subMessage: "This review will be permanently removed from this product's page.",
                                  confirmText: "Delete Review",
                                  cancelText: "Cancel",
                                  type: "danger",
                                  isLoading: false,
                                  onConfirm: () => {
                                    const updatedRevs = editingProduct.reviews.filter((_, i) => i !== rIdx);
                                    setEditingProduct({ ...editingProduct, reviews: updatedRevs });
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                    triggerToast("Review deleted", "info");
                                  }
                                });
                              }}
                              style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
                            >
                              <i className="fa-solid fa-trash-can"></i> Delete
                            </button>
                          </div>
                          <p style={{ color: "#475569", margin: 0 }}>{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-full" 
                disabled={isSingleUploading}
                style={{ 
                  padding: "14px", 
                  fontSize: "1.05rem", 
                  borderRadius: "8px", 
                  fontWeight: "600"
                }}
              >
                {isSingleUploading ? (
                  <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Saving Changes...</span>
                ) : (
                  <span><i className="fa-solid fa-floppy-disk" style={{ marginRight: "8px" }}></i> Save Product Updates</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Gift Hamper / Combo Modal */}
      {showComboModal && (
        <div className="modal-overlay active" onClick={() => { setShowComboModal(false); setSingleUploadImages([]); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px", gridTemplateColumns: "1fr", maxHeight: "90vh", overflowY: "auto" }}>
            <button className="modal-close-btn" onClick={() => { setShowComboModal(false); setSingleUploadImages([]); }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <form onSubmit={handleAddCombo} className="modal-content-side" style={{ padding: "1.5rem" }}>
              <span className="modal-meta-label">Hamper & Combo Registration</span>
              <h2 className="modal-title" style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>Register Gift Hamper / Combo</h2>
              
              {/* Instructions Booklet Box */}
              <div style={{ background: "rgba(184, 134, 11, 0.05)", padding: "14px 16px", borderRadius: "10px", border: "1px dashed var(--primary)", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "var(--dark)", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="fa-solid fa-circle-info" style={{ color: "var(--primary)" }}></i> Instructions & Setup Steps
                </h4>
                <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", color: "#555", lineHeight: "1.6" }}>
                  <li><b>Select Products:</b> Click "+ Add Product" and select existing items from your store catalog dropdown.</li>
                  <li><b>Set Quantities:</b> Set the item quantities. The system auto-calculates the Combined Base Price total.</li>
                  <li><b>Pricing & Title:</b> Enter a Hamper Title (or click "Auto-Generate Title") and specify your final Combo Offer Price.</li>
                  <li><b>Image Upload:</b> Upload a custom hamper photo, or leave blank to auto-use the photo of the first item.</li>
                </ol>
              </div>

              {/* Product Selection Section */}
              <div style={{ background: "#f8f9fa", padding: "1.2rem", borderRadius: "10px", border: "1px solid #e9ecef", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--primary)" }}>
                    <i className="fa-solid fa-boxes-stacked" style={{ marginRight: "6px" }}></i>
                    Select Products to Include ({comboSelectedProducts.length} Items)
                  </h4>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={handleAddComboRow}
                    style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                  >
                    <i className="fa-solid fa-plus"></i> Add Product
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {comboSelectedProducts.map((row, index) => {
                    const selectedProd = productsList.find(p => String(p.id) === String(row.productId));
                    return (
                      <div 
                        key={row.id} 
                        style={{ 
                          display: "grid", 
                          gridTemplateColumns: "30px 1fr 90px 90px 36px", 
                          gap: "8px", 
                          alignItems: "center", 
                          background: "white", 
                          padding: "8px 12px", 
                          borderRadius: "8px", 
                          border: "1px solid #dee2e6" 
                        }}
                      >
                        <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#888" }}>#{index + 1}</span>
                        <select 
                          className="sort-select" 
                          value={row.productId} 
                          onChange={(e) => handleComboProductChange(row.id, e.target.value)}
                          style={{ width: "100%", fontSize: "0.85rem", padding: "6px" }}
                        >
                          <option value="">-- Choose Product --</option>
                          {productsList.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} — ₹{p.price} ({p.department || "General"})
                            </option>
                          ))}
                        </select>
                        <div>
                          <input 
                            type="number" 
                            min="1" 
                            className="form-input" 
                            value={row.quantity} 
                            onChange={(e) => handleComboQuantityChange(row.id, e.target.value)}
                            style={{ fontSize: "0.85rem", padding: "6px", textAlign: "center" }}
                            title="Quantity"
                          />
                        </div>
                        <div style={{ fontSize: "0.85rem", fontWeight: "bold", textAlign: "right", color: "var(--primary)" }}>
                          ₹{selectedProd ? (parseFloat(selectedProd.price) * row.quantity).toLocaleString() : 0}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveComboRow(row.id)}
                          style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "0.9rem" }}
                          title="Remove item"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Combined Total Summary */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #ccc" }}>
                  <span style={{ fontSize: "0.9rem", color: "#555" }}>
                    Combined Base Price Total:
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--dark)" }}>
                      ₹{comboBasePrice.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewComboPrice(comboBasePrice.toString())}
                      style={{ display: "block", fontSize: "0.7rem", color: "var(--primary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginTop: "2px" }}
                    >
                      Use Base Price
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Hamper Core Details */}
              <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="form-group full-width">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="form-label">Hamper Title Name</span>
                    <button
                      type="button"
                      onClick={() => {
                        const names = comboSelectedProducts
                          .map(r => productsList.find(p => String(p.id) === String(r.productId))?.name)
                          .filter(Boolean);
                        if (names.length > 0) {
                          setNewComboName(`${names.join(" + ")} Hamper`);
                        }
                      }}
                      style={{ fontSize: "0.7rem", color: "var(--primary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                      Auto-Generate Title
                    </button>
                  </div>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="E.g. Royal Diwali Tea & Dinner Combo Set"
                    value={newComboName} 
                    onChange={(e) => setNewComboName(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <span className="form-label">Combo Offer Price (₹)</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    placeholder="2500"
                    value={newComboPrice} 
                    onChange={(e) => setNewComboPrice(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <span className="form-label">Stock Units</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    placeholder="10"
                    value={newComboStock} 
                    onChange={(e) => setNewComboStock(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <span className="form-label">Department</span>
                  <select 
                    className="sort-select"
                    value={newComboDept}
                    onChange={(e) => setNewComboDept(e.target.value)}
                  >
                    <option value="Gifting">Gifting</option>
                    <option value="Crockery & Dining">Crockery & Dining</option>
                    <option value="Cookware">Cookware</option>
                    <option value="Woodcraft">Woodcraft</option>
                    <option value="Home Décor">Home Décor</option>
                  </select>
                </div>

                <div className="form-group">
                  <span className="form-label">Category Group</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Gift Hampers"
                    value={newComboCat}
                    onChange={(e) => setNewComboCat(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <span className="form-label">Upload Custom Hamper Image (Optional)</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) => setSingleUploadImages(Array.from(e.target.files))}
                    disabled={isSingleUploading}
                    className="form-input"
                    style={{ paddingTop: "6px" }}
                  />
                  {singleUploadImages.length > 0 && (
                    <p style={{ margin: "5px 0 0 0", fontSize: "0.75rem", color: "var(--primary)" }}>
                      {singleUploadImages.length} image(s) selected
                    </p>
                  )}
                </div>

                <div className="form-group full-width">
                  <span className="form-label">Or Image URL Path (Optional)</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Leave blank to use image of first selected item"
                    value={newComboImage} 
                    onChange={(e) => setNewComboImage(e.target.value)} 
                    disabled={singleUploadImages.length > 0}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={isSingleUploading}>
                {isSingleUploading ? "Registering Combo..." : "Register Combo in Database"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal for Print Review */}
      {invoiceOrder && (
        <div className="modal-overlay active" onClick={() => setInvoiceOrder(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "750px", gridTemplateColumns: "1fr", maxHeight: "90vh", padding: "10px" }}>
            <button className="modal-close-btn" onClick={() => setInvoiceOrder(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="modal-content-side" style={{ overflowY: "auto", maxHeight: "80vh" }}>
              
              {/* Printed invoice wrapper */}
              <div style={{ border: "1px solid var(--border)", padding: "2rem", backgroundColor: "white", color: "black" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1.5px solid black", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: "bold" }}>ORIENT</span>
                    <span style={{ display: "block", fontSize: "0.55rem", letterSpacing: "2px", textTransform: "uppercase" }}>Crockeries</span>
                    <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "5px" }}>Delhi Warehouse Outlet, IN</p>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.8rem" }}>
                    <h3 style={{ fontFamily: "var(--font-serif)", color: "var(--primary)" }}>TAX INVOICE</h3>
                    <p>Reference ID: <b>{invoiceOrder.id}</b></p>
                    <p>Date: <b>{new Date(invoiceOrder.date).toLocaleDateString()}</b></p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "1.5rem", fontSize: "0.8rem" }}>
                  <div>
                    <h4>Delivery To</h4>
                    <p><b>{invoiceOrder.customerName}</b><br />{invoiceOrder.shippingAddress}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <h4>Courier Carrier</h4>
                    <p>BlueDart Air Cargo<br />Status: {invoiceOrder.courierStatus}</p>
                  </div>
                </div>

                <table className="invoice-table" style={{ fontSize: "0.8rem" }}>
                  <thead>
                    <tr>
                      <th>Piece Description</th>
                      <th>Barcode</th>
                      <th>Qty</th>
                      <th style={{ textAlign: "right" }}>Inclusive Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceOrder.items.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td style={{ color: "#666" }}>{item.barcode}</td>
                        <td>{item.quantity}</td>
                        <td style={{ textAlign: "right" }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ width: "240px", marginLeft: "auto", fontSize: "0.8rem", marginTop: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Subtotal</span>
                    <span>₹{invoiceOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Discounts</span>
                    <span>-₹{(invoiceOrder.discount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Shipping Fee</span>
                    <span>{invoiceOrder.shipping === 0 ? "FREE" : `₹${invoiceOrder.shipping.toFixed(2)}`}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1.5px solid black", fontWeight: "bold", fontSize: "1.1rem" }}>
                    <span>Grand Total</span>
                    <span>₹{invoiceOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
                <button className="btn btn-outline" onClick={() => generateInvoicePDF(invoiceOrder)}>
                  <i className="fa-solid fa-file-pdf"></i> Download PDF Invoice
                </button>
                <button className="btn btn-primary" onClick={() => setInvoiceOrder(null)}>
                  Close Review
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Bulk Product Import (JSON) Modal Matching Reference Screenshot */}
      {showBulkUploadModal && (
        <div className="modal-overlay active" onClick={() => !isJsonImporting && setShowBulkUploadModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "750px", gridTemplateColumns: "1fr", maxHeight: "90vh", overflowY: "auto", borderRadius: "18px" }}>
            {!isJsonImporting && (
              <button className="modal-close-btn" onClick={() => setShowBulkUploadModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
            
            <div className="modal-content-side" style={{ padding: "1.8rem" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.4rem", color: "#4318ff", fontWeight: "800" }}>&lt;/&gt;</span>
                <h2 className="modal-title" style={{ fontSize: "1.5rem", margin: 0, fontWeight: "800", color: "#0f172a" }}>
                  Bulk Product Import (JSON)
                </h2>
              </div>
              
              {/* Helpful Information Notice Box */}
              <div style={{ 
                background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", 
                padding: "14px 18px", 
                borderRadius: "12px", 
                border: "1px solid #bbf7d0", 
                marginBottom: "1.2rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px"
              }}>
                <i className="fa-solid fa-boxes-stacked" style={{ color: "#16a34a", fontSize: "1.2rem", marginTop: "3px" }}></i>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", color: "#166534", fontSize: "0.92rem", fontWeight: "700" }}>
                    Fast Structured Bulk Importer
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#374151", lineHeight: "1.5" }}>
                    Paste a structured JSON array below to quickly create or update catalog products. You can leave default/placeholder images now, and easily upload high-resolution photos individually anytime by clicking <b>"Edit"</b> on any product row.
                  </p>
                </div>
              </div>

              {/* Action Bar above Textarea */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ fontSize: "0.86rem", fontWeight: "700", color: "#334155" }}>
                    Paste JSON Array Below:
                  </label>
                  {jsonValidationResult?.valid && (
                    <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "700" }}>
                      ✓ {jsonValidationResult.count} Products Ready
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    type="button"
                    onClick={handleAutoFixJson}
                    title="Automatically fix missing quotes, empty values, or trailing commas"
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #86efac",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "#166534",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#16a34a" }}></i>
                    <span>Auto-Fix & Format JSON</span>
                  </button>

                  <button 
                    type="button"
                    onClick={handleCopySampleJson}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "#334155",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                  >
                    <i className="fa-regular fa-copy" style={{ color: "#4318ff" }}></i>
                    <span>Copy Sample JSON Template</span>
                  </button>
                </div>
              </div>

              {/* JSON Textarea Editor */}
              <div style={{ position: "relative", marginBottom: "1rem" }}>
                <textarea 
                  rows={11}
                  value={jsonInputText}
                  onChange={(e) => {
                    setJsonInputText(e.target.value);
                    setJsonValidationResult(null);
                  }}
                  placeholder={`[\n  {\n    "name": "Orient Royal Dinner Set",\n    "department": "Crockery & Dining",\n    "category": "Dinner Sets",\n    "price": 3499,\n    "stock": 25,\n    "fragile": true,\n    "microwave": false,\n    "barcode": "890123456789",\n    "hsn": "6911",\n    "gst": 18,\n    "description": "Handcrafted luxury bone china dinner collection.",\n    "image": "/placeholder.jpg"\n  }\n]`}
                  style={{
                    width: "100%",
                    fontFamily: "'Fira Code', 'Consolas', monospace",
                    fontSize: "0.84rem",
                    lineHeight: "1.5",
                    padding: "14px",
                    borderRadius: "10px",
                    border: jsonValidationResult?.valid === false ? "1.5px solid #ef4444" : (jsonValidationResult?.valid ? "1.5px solid #10b981" : "1.5px solid #cbd5e1"),
                    backgroundColor: "#0f172a",
                    color: "#f8fafc",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px", fontSize: "0.76rem", color: "#64748b" }}>
                  <span>💡 <b>Field Tip:</b> All fields are optional except for basic product info. You can omit <code>"image"</code> or write <code>""</code>.</span>
                  <span>Click <b>"Auto-Fix & Format"</b> if any formatting error occurs.</span>
                </div>
              </div>

              {/* Validation Status Notice */}
              {jsonValidationResult && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  marginBottom: "1.2rem",
                  backgroundColor: jsonValidationResult.valid ? "#ecfdf5" : "#fef2f2",
                  border: jsonValidationResult.valid ? "1px solid #a7f3d0" : "1px solid #fecaca",
                  color: jsonValidationResult.valid ? "#065f46" : "#991b1b",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <i className={`fa-solid ${jsonValidationResult.valid ? "fa-circle-check" : "fa-circle-exclamation"}`}></i>
                  <span>{jsonValidationResult.valid ? `JSON is valid! ${jsonValidationResult.count} products will be inserted/updated in Supabase.` : jsonValidationResult.error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button 
                  type="button" 
                  onClick={handleValidateJson}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#334155",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <i className="fa-regular fa-eye"></i>
                  <span>Validate & Preview JSON</span>
                </button>

                <button 
                  type="button" 
                  onClick={handleImportJsonToSupabase}
                  disabled={isJsonImporting}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "0.92rem",
                    cursor: isJsonImporting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                    opacity: isJsonImporting ? 0.7 : 1
                  }}
                >
                  {isJsonImporting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Importing to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>Import JSON to Supabase</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Users & Customers */}
      {activeTab === "users" && <UsersTab />}

      {/* Tab 5: Instructions */}
      {activeTab === "instructions" && <InstructionsTab />}

      {/* Floating Luxury Toast Notification Banner */}
      <div 
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 99999,
          display: showToast ? "flex" : "none",
          alignItems: "center",
          gap: "14px",
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          color: "#ffffff",
          padding: "14px 22px",
          borderRadius: "16px",
          border: toastType === "success" 
            ? "1px solid rgba(16, 185, 129, 0.4)" 
            : (toastType === "error" 
                ? "1px solid rgba(239, 68, 68, 0.4)" 
                : (toastType === "warning" 
                    ? "1px solid rgba(245, 158, 11, 0.4)" 
                    : "1px solid rgba(67, 24, 255, 0.4)")),
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35), 0 0 20px rgba(0, 0, 0, 0.2)",
          maxWidth: "480px",
          animation: showToast ? "adminConfirmFadeIn 0.3s ease" : "none",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <div style={{
          width: "38px",
          height: "38px",
          minWidth: "38px",
          borderRadius: "50%",
          backgroundColor: toastType === "success" 
            ? "rgba(16, 185, 129, 0.2)" 
            : (toastType === "error" 
                ? "rgba(239, 68, 68, 0.2)" 
                : (toastType === "warning" 
                    ? "rgba(245, 158, 11, 0.2)" 
                    : "rgba(67, 24, 255, 0.2)")),
          border: toastType === "success" 
            ? "1px solid rgba(16, 185, 129, 0.6)" 
            : (toastType === "error" 
                ? "1px solid rgba(239, 68, 68, 0.6)" 
                : (toastType === "warning" 
                    ? "1px solid rgba(245, 158, 11, 0.6)" 
                    : "1px solid rgba(67, 24, 255, 0.6)")),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: toastType === "success" 
            ? "#34d399" 
            : (toastType === "error" 
                ? "#f87171" 
                : (toastType === "warning" 
                    ? "#fbbf24" 
                    : "#818cf8")),
          fontSize: "1.1rem"
        }}>
          {toastType === "success" && <i className="fa-solid fa-circle-check"></i>}
          {toastType === "error" && <i className="fa-solid fa-circle-xmark"></i>}
          {toastType === "warning" && <i className="fa-solid fa-triangle-exclamation"></i>}
          {toastType === "info" && <i className="fa-solid fa-bell-concierge"></i>}
        </div>
        <div style={{ flexGrow: 1 }}>
          <div style={{ 
            fontSize: "0.72rem", 
            fontWeight: "700", 
            textTransform: "uppercase", 
            letterSpacing: "1px", 
            color: toastType === "success" ? "#34d399" : (toastType === "error" ? "#f87171" : (toastType === "warning" ? "#fbbf24" : "#818cf8")),
            marginBottom: "2px" 
          }}>
            {toastType === "success" ? "Operation Successful" : (toastType === "error" ? "System Error" : (toastType === "warning" ? "Notice" : "Orient System Alert"))}
          </div>
          <div style={{ fontSize: "0.88rem", fontWeight: "500", color: "#f8fafc", lineHeight: "1.4" }}>
            {toastMessage}
          </div>
        </div>
        <button 
          onClick={() => setShowToast(false)}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: "1.2rem",
            cursor: "pointer",
            padding: "0 0 0 8px",
            lineHeight: 1
          }}
        >
          &times;
        </button>
      </div>
      </div>

      {/* Image Alignment & Fit Modal */}
      {aligningImage && (
        <div className="image-align-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setAligningImage(null); }}>
          <div className="image-align-modal-card">
            <div className="image-align-header">
              <h3><i className="fa-solid fa-sliders" style={{ color: "#4318ff" }}></i> Image Alignment & Fit Editor</h3>
              <button 
                type="button"
                onClick={() => setAligningImage(null)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#64748b" }}
              >
                &times;
              </button>
            </div>

            <div className="image-align-body">
              {/* Controls */}
              <div className="align-controls-section">
                <div className="align-control-group">
                  <label>Image Fitting Mode</label>
                  <div className="fit-option-buttons">
                    <button 
                      type="button" 
                      className={`fit-btn ${aligningImage.fit === 'cover' ? 'active' : ''}`}
                      onClick={() => setAligningImage({ ...aligningImage, fit: 'cover' })}
                    >
                      Cover (Fill & Crop)
                    </button>
                    <button 
                      type="button" 
                      className={`fit-btn ${aligningImage.fit === 'contain' ? 'active' : ''}`}
                      onClick={() => setAligningImage({ ...aligningImage, fit: 'contain' })}
                    >
                      Contain (Whole Image)
                    </button>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                    {aligningImage.fit === 'cover' ? 'Scales to fill frame. Use sliders below to align product center.' : 'Fits entire image inside frame without cropping.'}
                  </span>
                </div>

                <div className="align-control-group">
                  <label>
                    <span>Vertical Position (Y-Axis)</span>
                    <span style={{ color: "#4318ff", fontWeight: "700" }}>{aligningImage.y}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={aligningImage.y} 
                    onChange={(e) => setAligningImage({ ...aligningImage, y: parseInt(e.target.value) })}
                    className="align-slider"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#94a3b8" }}>
                    <span>0% (Top)</span>
                    <span>50% (Center)</span>
                    <span>100% (Bottom)</span>
                  </div>
                </div>

                <div className="align-control-group">
                  <label>
                    <span>Horizontal Position (X-Axis)</span>
                    <span style={{ color: "#4318ff", fontWeight: "700" }}>{aligningImage.x}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={aligningImage.x} 
                    onChange={(e) => setAligningImage({ ...aligningImage, x: parseInt(e.target.value) })}
                    className="align-slider"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#94a3b8" }}>
                    <span>0% (Left)</span>
                    <span>50% (Center)</span>
                    <span>100% (Right)</span>
                  </div>
                </div>

                <div className="align-control-group">
                  <label>
                    <span>Image Zoom / Scale</span>
                    <span style={{ color: "#4318ff", fontWeight: "700" }}>{Math.round((aligningImage.zoom || 1) * 100)}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="100" 
                    max="250" 
                    step="5"
                    value={Math.round((aligningImage.zoom || 1) * 100)} 
                    onChange={(e) => setAligningImage({ ...aligningImage, zoom: parseFloat(e.target.value) / 100 })}
                    className="align-slider"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#94a3b8" }}>
                    <span>100% (Normal)</span>
                    <span>175%</span>
                    <span>250% (Zoomed)</span>
                  </div>
                </div>

                {/* Helpful tip box explaining CSS behavior */}
                <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 12px", borderRadius: "8px", fontSize: "0.78rem", color: "#1e40af", marginTop: "4px" }}>
                  <strong><i className="fa-solid fa-circle-info"></i> How Alignment Works:</strong>
                  <ul style={{ margin: "4px 0 0 16px", padding: 0, lineHeight: 1.4 }}>
                    <li><strong>Cover (Fill & Crop):</strong> On tall/portrait images, height crops vertically so Y-axis shifts up/down. To enable X-axis movement on portrait photos, increase <strong>Zoom</strong> above 100%.</li>
                    <li><strong>Contain (Whole Image):</strong> On tall/portrait images, sides have empty space so X-axis shifts left/right. To enable Y-axis movement, increase <strong>Zoom</strong> above 100%.</li>
                  </ul>
                </div>
              </div>

              {/* Live Customer Panel Preview */}
              <div className="align-preview-section">
                <div className="align-preview-badge">
                  <i className="fa-solid fa-eye"></i> Live Customer Panel View
                </div>
                <div className="preview-card-frame">
                  <div className="preview-img-container">
                    <img 
                      src={aligningImage.url} 
                      alt="Live Preview" 
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: aligningImage.fit, 
                        objectPosition: `${aligningImage.x}% ${aligningImage.y}%`,
                        transform: aligningImage.zoom && aligningImage.zoom !== 1 ? `scale(${aligningImage.zoom})` : 'none'
                      }} 
                    />
                  </div>
                  <div className="preview-card-details">
                    <div className="preview-card-title">{editingProduct?.name || 'Product Title'}</div>
                    <div className="preview-card-price">₹{editingProduct?.price || '999'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="image-align-footer">
              <button 
                type="button"
                onClick={() => setAligningImage({ ...aligningImage, fit: 'cover', x: 50, y: 50, zoom: 1 })}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f1f5f9", color: "#475569", fontWeight: "600", cursor: "pointer" }}
              >
                Reset Defaults
              </button>
              <button 
                type="button"
                onClick={() => {
                  const updatedSettings = {
                    ...(editingProduct.image_settings || {}),
                    [aligningImage.url]: {
                      fit: aligningImage.fit,
                      x: aligningImage.x,
                      y: aligningImage.y,
                      zoom: aligningImage.zoom || 1
                    }
                  };
                  setEditingProduct({ ...editingProduct, image_settings: updatedSettings });
                  setAligningImage(null);
                  triggerToast("Image alignment updated!");
                }}
                style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#4318ff", color: "#fff", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 12px rgba(67, 24, 255, 0.3)" }}
              >
                <i className="fa-solid fa-check"></i> Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Luxury Admin Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        subMessage={confirmModal.subMessage}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        item={confirmModal.item}
        isLoading={confirmModal.isLoading}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}
