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

  // Data states (locally stored)
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const prevOrdersCountRef = useRef(null);
  const lastChimedOrderIdRef = useRef(null);

  // Editing modals states
  const [editingProduct, setEditingProduct] = useState(null);
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
      alert("At least one product must be included in the hamper!");
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
  const [showToast, setShowToast] = useState(false);

  // Bulk Upload states
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkImages, setBulkImages] = useState([]);
  const [bulkCsvFile, setBulkCsvFile] = useState(null);
  const [bulkUploadStatus, setBulkUploadStatus] = useState("");
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Add Product State
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
    category: "General"
  });

  // Single Upload states
  const [singleUploadImages, setSingleUploadImages] = useState([]);
  const [isSingleUploading, setIsSingleUploading] = useState(false);
  const [singleUploadStatus, setSingleUploadStatus] = useState("");

  const loadDbData = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      let productsData = data || [];
      // Sort products by ID or keep original order
      productsData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      setProductsList(productsData);
    } catch (e) {
      console.warn("Failed to load products from Supabase", e);
      // Removed fallback to getProducts() to ensure only real database data or nothing is shown
      setProductsList([]);
    }
    
    try {
      const { data, error } = await supabase.from('orders').select('*');
      if (error) throw error;
      let ordersData = data ? data.map(dbOrder => {
        const nameFromAddr = typeof dbOrder.shipping_address === 'object' ? dbOrder.shipping_address?.name : null;
        const custName = nameFromAddr || dbOrder.customer_name || dbOrder.name || (dbOrder.guest_email ? dbOrder.guest_email.split('@')[0] : 'Customer');
        const custPhone = dbOrder.guest_phone || (typeof dbOrder.shipping_address === 'object' ? dbOrder.shipping_address?.phone : null) || dbOrder.phone || 'N/A';

        return {
          id: dbOrder.order_number || dbOrder.id,
          _docId: dbOrder.id,
          date: dbOrder.created_at,
          customerName: custName,
          customerPhone: custPhone,
          shippingAddress: dbOrder.shipping_address?.raw_text || (typeof dbOrder.shipping_address === 'string' ? dbOrder.shipping_address : 'N/A'),
          items: [],
          subtotal: dbOrder.total_mrp || 0,
          shipping: dbOrder.shipping_charge || 0,
          discount: dbOrder.discount_amount || 0,
          total: dbOrder.final_total || 0,
          status: (dbOrder.order_status === 'NEW' || dbOrder.order_status === 'PAYMENT_PENDING') ? 'Pending' : (dbOrder.order_status === 'PACKED' ? 'Packed' : (dbOrder.order_status === 'DISPATCHED' ? 'Shipped' : (dbOrder.order_status === 'DELIVERED' ? 'Delivered' : 'Pending'))),
          courierStatus: 'In Warehouse'
        };
      }) : [];
      
      // Sort orders by date
      ordersData.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
      
      // Auto-trigger sound chime & toast popup if a new order was created recently (within last 3 minutes)
      const newestOrder = ordersData[0];
      if (newestOrder && newestOrder.date) {
        const orderTime = new Date(newestOrder.date).getTime();
        const THREE_MINUTES = 3 * 60 * 1000;
        if (Date.now() - orderTime < THREE_MINUTES && lastChimedOrderIdRef.current !== newestOrder.id) {
          lastChimedOrderIdRef.current = newestOrder.id;
          triggerToast(`🛎️ New Order Received! (${newestOrder.id} - ${newestOrder.customerName || 'Customer'})`);
          playOrderChime();
        }
      }
      prevOrdersCountRef.current = ordersData.length;

      setOrdersList(ordersData);
    } catch (e) {
      console.warn("Failed to load orders from Supabase", e);
      // Removed fallback to getOrders() so only real database data or nothing is shown
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

    // 1. Ultra-Light Auto-Refresh (Polling every 2 minutes as requested)
    const pollInterval = setInterval(() => {
      loadDbData();
    }, 120000);

    // 2. Supabase Realtime WebSockets for instant updates (<100ms)
    const channel = supabase
      .channel('realtime-orders-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        loadDbData();
        if (payload.eventType === 'INSERT') {
          triggerToast("🛎️ New Order Received!");
          playOrderChime();
        }
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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
        for (const file of singleUploadImages) {
          const fileExt = file.name.split('.').pop();
          const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
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
        image: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : '/placeholder.jpg'
      };

      const { error: insertError } = await supabase.from('products').insert(newProductRecord);
      if (insertError) throw insertError;

      triggerToast("Product added successfully!");
      setShowAddProductModal(false);
      setNewProduct({
        name: "", price: "", stock: "", stockStatus: "Available", department: "Crockery & Dining",
        barcode: "", hsn: "", gst: 18, description: "", fragile: false, microwave: false, category: "General"
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

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm(`Are you sure you want to delete Product #${productId}? This cannot be undone.`)) {
      return;
    }
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      triggerToast("Product deleted successfully");
      loadDbData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to delete product: " + err.message);
    }
  };

  const handleProcessOrder = async (orderId, nextStatus, docId) => {
    try {
      const courierStatus = nextStatus === "Packed" ? "In Warehouse" : (nextStatus === "Shipped" ? "In Transit" : "Delivered");
      const currentOrder = ordersList.find(o => o.id === orderId);
      const paymentStatus = nextStatus === "Delivered" ? "SUCCESS" : (currentOrder && currentOrder.paymentStatus === "Paid" ? "SUCCESS" : (currentOrder ? currentOrder.paymentStatus : "SUCCESS"));

      // Optimistically update the UI to prevent perceived unresponsiveness
      setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus, courierStatus, paymentStatus } : o));

      // Handle OTP generation when marking as Shipped
      let otpGenerated = null;
      let newShippingAddress = null;
      
      const { data: dbRecord } = await supabase.from('orders').select('shipping_address').eq('id', docId).single();
      if (dbRecord && dbRecord.shipping_address) {
        newShippingAddress = { ...dbRecord.shipping_address };
        if (nextStatus === "Shipped" && !newShippingAddress.delivery_otp) {
          otpGenerated = Math.floor(100000 + Math.random() * 900000).toString();
          newShippingAddress.delivery_otp = otpGenerated;
        }
      }

      const updateData = {
        order_status: nextStatus === 'Pending' ? 'NEW' : (nextStatus === 'Packed' ? 'PACKED' : (nextStatus === 'Shipped' ? 'DISPATCHED' : 'DELIVERED')),
        payment_status: paymentStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING'
      };
      
      if (newShippingAddress) {
        updateData.shipping_address = newShippingAddress;
      }

      const { error: updateError } = await supabase.from('orders').update(updateData).eq('id', docId);
      if (updateError) {
        console.error("Supabase update error:", updateError);
        throw updateError;
      }

      // Trigger Google Sheets Webhook Update
      try {
        const webhookUrl = "https://script.google.com/macros/s/AKfycbxIM1-jcgl3NUqhoYt7IQIHY9LI6z0IT7c3WI_ZSJwajYORUbgKLnTnw5GJLBbhj-OY8g/exec";
        await fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update",
            orderId: orderId,
            status: nextStatus,
            courierStatus: courierStatus,
            paymentStatus: paymentStatus
          })
        });
      } catch (err) {
        console.error("Error syncing update to Google Sheets:", err);
      }
    } catch (e) {
      console.warn("Failed to update order status in Supabase", e);
      updateOrderStatus(orderId, nextStatus); // Fallback
      // Revert optimistic update if database actually failed
      loadDbData();
    }
    
    // Play sound chime and trigger custom milestone toast
    playOrderChime();
    if (nextStatus === "Packed") {
      triggerToast(`📦 Order ${orderId} Packed Successfully! Item wrapped & ready in Warehouse.`);
    } else if (nextStatus === "Shipped") {
      triggerToast(`🚚 Order ${orderId} Dispatched via BlueDart Courier! OTP: ${otpGenerated || "Generated"}`);
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
  const activeDispatchesCount = ordersList.filter(o => o.status === "Shipped").length; // Shipped but not delivered
  const pendingDispatchesCount = ordersList.filter(o => o.status === "Packed").length; // Packed but not shipped
  const pendingOrdersCount = ordersList.filter(o => o.status === "Pending").length;
  const lowStockCount = productsList.filter(p => p.stock < 5).length;

  // Cutoff date for recent orders (48 hours ago)
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - TWO_DAYS_MS);

  // Filters for order listing (Supports status filters: Active, Pending, Packed, Shipped, Delivered, Today, All)
  const filteredOrders = ordersList.filter(order => {
    const matchesSearch = !orderSearch.trim() || 
                          (order.id && order.id.toLowerCase().includes(orderSearch.toLowerCase())) ||
                          (order.customerName && order.customerName.toLowerCase().includes(orderSearch.toLowerCase())) ||
                          (order.customerPhone && order.customerPhone.includes(orderSearch));
    
    const matchesStatus = orderFilter === "All" ||
                          (orderFilter === "Active" && order.status !== "Delivered") ||
                          (orderFilter === "Pending" && order.status === "Pending") ||
                          (orderFilter === "Packed" && order.status === "Packed") ||
                          (orderFilter === "Shipped" && order.status === "Shipped") ||
                          (orderFilter === "Delivered" && order.status === "Delivered") ||
                          (orderFilter === "Today" && order.date && new Date(order.date).toDateString() === todayStr);
    
    return matchesSearch && matchesStatus;
  });

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
    p.barcode.includes(inventorySearch) ||
    p.category.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  // Edit stock update
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSingleUploading(true);
    setSingleUploadStatus("Uploading images...");
    
    let uploadedImageUrls = [...(editingProduct.images || [])];
    
    if (singleUploadImages && singleUploadImages.length > 0) {
      for (let i = 0; i < singleUploadImages.length; i++) {
        const file = singleUploadImages[i];
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
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
      reviewCount: reviews.length
    };
    
    // Remove temporary UI fields that might not exist in Supabase schema to prevent PGRST204 errors
    delete updated.stockStatus;

    const updateProductInSupabase = async () => {
      try {
        await supabase.from('products').upsert(updated);
        loadDbData();
        setEditingProduct(null);
        setSingleUploadImages([]);
        setIsSingleUploading(false);
        triggerToast(`Updated Product: ${updated.name}`);
      } catch (error) {
        console.error("Error updating product in Supabase", error);
        triggerToast("Failed to update product");
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
      alert("Please select at least one existing product from the dropdown to create a combo!");
      return;
    }
    if (!newComboName || !newComboPrice || !newComboStock) {
      alert("Please fill in core hamper details (Title, Price, Stock).");
      return;
    }

    setIsSingleUploading(true);
    setSingleUploadStatus("Uploading images...");
    
    let uploadedImageUrls = [];
    
    if (singleUploadImages && singleUploadImages.length > 0) {
      for (let i = 0; i < singleUploadImages.length; i++) {
        const file = singleUploadImages[i];
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
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

  const handleBulkUploadSubmit = async () => {
    if (!bulkCsvFile) {
      alert("Please upload the CSV file first.");
      return;
    }
    setIsBulkUploading(true);
    setBulkUploadStatus("Starting bulk process...");

    try {
      // 1. Process & Upload Images
      const uploadedImageUrls = {}; // Map of filename -> URL
      
      if (bulkImages && bulkImages.length > 0) {
        for (let i = 0; i < bulkImages.length; i++) {
          setBulkUploadStatus(`Uploading photo ${i + 1} of ${bulkImages.length}... please wait`);
          const file = bulkImages[i];
          const options = {
            maxSizeMB: 0.2, // Compress to 200KB max
            maxWidthOrHeight: 800,
            useWebWorker: true,
          };
          
          try {
            const compressedFile = await imageCompression(file, options);
            const fileName = `${Date.now()}_${file.name}`;
            
            const { data, error } = await supabase.storage
              .from('product-images')
              .upload(fileName, compressedFile, {
                cacheControl: '3600',
                upsert: false
              });
              
            if (error) {
              console.error("Error uploading image:", error);
              continue; // Skip failed image
            }
            
            const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
            uploadedImageUrls[file.name] = publicUrlData.publicUrl;
            
          } catch (err) {
            console.error("Compression error:", err);
          }
        }
      }

      // 2. Parse CSV
      setBulkUploadStatus("Parsing CSV file...");
      Papa.parse(bulkCsvFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data;
          setBulkUploadStatus(`Found ${rows.length} products. Linking images and saving to database...`);
          
          const newProducts = rows.map((row, index) => {
            const newId = productsList.length > 0 ? Math.max(...productsList.map(p => p.id)) + 1 + index : 101 + index;
            let finalImageUrl = "/images/acacia_wood_casserole.png"; // fallback
            let finalImageUrls = [];
            
            const exactMatch = row.Image_File_Name && uploadedImageUrls[row.Image_File_Name];
            if (exactMatch) {
              finalImageUrl = uploadedImageUrls[row.Image_File_Name];
              finalImageUrls.push(finalImageUrl);
            } else {
              // Fuzzy match based on SKU ID (handles 201_1.webp, 201_2.webp, etc.)
              const fuzzyKeys = Object.keys(uploadedImageUrls).filter(key => key.includes(String(row.id)));
              if (fuzzyKeys.length > 0) {
                fuzzyKeys.sort(); // Sort to keep 201_1 before 201_2
                finalImageUrls = fuzzyKeys.map(key => uploadedImageUrls[key]);
                finalImageUrl = finalImageUrls[0];
              }
            }

            return {
              id: parseInt(row.id) || newId,
              name: row.name || "Untitled Product",
              price: parseFloat(row.price) || 0,
              stock: parseInt(row.stock) || 0,
              image: finalImageUrl,
              images: finalImageUrls,
              department: row.department || "Crockery & Dining",
              category: row.category || "Serveware",
              subCategory: row.subCategory || "Plates",
              fragile: row.fragile === "true" || row.fragile === "TRUE" || row.fragile === true,
              microwave: row.microwave === "true" || row.microwave === "TRUE" || row.microwave === true,
              barcode: row.barcode || "000" + Math.floor(Math.random() * 900000 + 100000),
              hsn: row.hsn || "9505",
              gst: parseFloat(row.gst) || 18,
              soldCount: parseInt(row.soldCount) || 0,
              description: row.description || "Luxurious dining product by Orient Crockeries.",
              rating: parseFloat(row.rating) || 5.0,
              reviewCount: parseInt(row.reviewCount) || 0,
              reviews: []
            };
          });

          // 3. Batch Insert to Supabase
          try {
             const { error } = await supabase.from('products').upsert(newProducts);
             if (error) throw error;
             
             loadDbData();
             setShowBulkUploadModal(false);
             setBulkImages([]);
             setBulkCsvFile(null);
             triggerToast(`Successfully bulk imported ${newProducts.length} products!`);
          } catch (dbError) {
             console.error("Database insert error:", dbError);
             setBulkUploadStatus("Error saving to database. Check console.");
          } finally {
             setIsBulkUploading(false);
          }
        },
        error: (err) => {
          console.error("CSV Parse Error:", err);
          setBulkUploadStatus("Error parsing CSV.");
          setIsBulkUploading(false);
        }
      });
      
    } catch (err) {
      console.error("Bulk upload general error:", err);
      setBulkUploadStatus("An unexpected error occurred.");
      setIsBulkUploading(false);
    }
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', textAlign: 'center', background: 'var(--bg-main)' }}>
        <div>
          <i className="fa-solid fa-desktop" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'white', marginBottom: '10px' }}>Desktop Only</h2>
          <p style={{ color: 'var(--text-muted)' }}>The Admin portal is strictly restricted to laptops and desktops for security and layout reasons.</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        backgroundColor: "#f5f7fa",
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Left Side - Branding (Hidden on small screens, but Admin is desktop only anyway) */}
        <div style={{
          flex: 1,
          backgroundColor: "#000",
          backgroundImage: "linear-gradient(135deg, #111 0%, #222 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4rem",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "relative", zIndex: 2 }}>
            <h1 style={{ color: "white", fontSize: "3.5rem", fontFamily: "var(--font-serif)", marginBottom: "1rem", letterSpacing: "2px" }}>
              Orient <span style={{ color: "#d4af37" }}>Admin</span>
            </h1>
            <p style={{ fontSize: "1.2rem", color: "#aaa", maxWidth: "400px", lineHeight: "1.6", marginBottom: "3rem" }}>
              Secure portal for managing inventory, tracking orders, and overseeing Orient Crockeries operations.
            </p>
          </div>
          {/* Decorative elements */}
          <div style={{
            position: "absolute",
            top: "-10%",
            right: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, rgba(0,0,0,0) 70%)",
            zIndex: 1
          }}></div>
        </div>

        {/* Right Side - Login Form */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ffffff",
          padding: "2rem"
        }}>
          <div style={{ width: "100%", maxWidth: "420px" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div style={{ 
                width: "60px", 
                height: "60px", 
                backgroundColor: "#f5f7fa", 
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem auto",
                color: "#111",
                fontSize: "1.5rem"
              }}>
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h2 style={{ fontSize: "1.8rem", color: "#111", marginBottom: "0.5rem", fontWeight: "600" }}>Welcome Back</h2>
              <p style={{ color: "#666", fontSize: "0.95rem" }}>Please enter your credentials to access the dashboard.</p>
            </div>
            
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#444", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#999" }}>
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
                      padding: '14px 15px 14px 45px', 
                      border: '1.5px solid #eaeaea', 
                      borderRadius: '8px', 
                      fontSize: '1rem', 
                      backgroundColor: '#fff', 
                      color: '#333',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#111'}
                    onBlur={(e) => e.target.style.borderColor = '#eaeaea'}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#444", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#999" }}>
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
                      padding: '14px 45px 14px 45px', 
                      border: '1.5px solid #eaeaea', 
                      borderRadius: '8px', 
                      fontSize: '1rem', 
                      backgroundColor: '#fff', 
                      color: '#333',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#111'}
                    onBlur={(e) => e.target.style.borderColor = '#eaeaea'}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '15px', 
                      top: "50%", 
                      transform: "translateY(-50%)",
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      color: '#999',
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
                  padding: "12px", 
                  borderRadius: "6px", 
                  fontSize: "0.85rem", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  marginTop: "5px"
                }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{authError}</span>
                </div>
              )}
              
              <button 
                type="submit" 
                style={{ 
                  marginTop: "1rem",
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#111",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#333"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#111"}
              >
                Sign In to Dashboard
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <p style={{ color: "#888", fontSize: "0.85rem", margin: "0 0 5px 0" }}>
                &copy; {new Date().getFullYear()} Orient Crockeries. All rights reserved.
              </p>
              <p style={{ color: "#aaa", fontSize: "0.8rem", margin: 0 }}>
                Developed & Managed by <strong style={{ color: "#444" }}>Digify Soft Solution</strong>
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
        maxWidth: "1400px", 
        margin: "0 auto", 
        backgroundColor: "var(--bg-main)", 
        minHeight: "100vh", 
        borderLeft: "1px solid #cbd5e1", 
        borderRight: "1px solid #cbd5e1", 
        boxShadow: "0 0 40px rgba(0,0,0,0.03)",
        position: "relative",
        paddingBottom: "5rem"
      }}>
        {/* Support floating button */}
        <div style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          backgroundColor: "#111",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: "30px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          zIndex: 999,
          border: "1px solid #333"
        }}>
          <div style={{
            backgroundColor: "#d4af37",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontSize: "0.9rem"
          }}>
            <i className="fa-solid fa-headset"></i>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Developer Support</div>
            <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#fff" }}><a href="tel:+917425016636" style={{ color: "inherit", textDecoration: "none" }}>+91 7425016636</a></div>
            <div style={{ fontSize: "0.8rem", color: "#888" }}><a href="mailto:support@digifysoft.in" style={{ color: "inherit", textDecoration: "none" }}>support@digifysoft.in</a></div>
          </div>
        </div>

      {/* Header Stats Bar */}
      <div className="erp-dashboard-header" style={{ padding: "1.5rem 6% 2rem 6%" }}>
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

          {/* Card 7: Active Dispatches (Shipped) */}
          <div 
            className="metric-card-pro" 
            onClick={() => { setActiveTab("orders"); setOrderFilter("Shipped"); }}
            style={{ cursor: "pointer", borderColor: (activeTab === "orders" && orderFilter === "Shipped") ? "#4f46e5" : "#e2e8f0" }}
          >
            <div className="metric-card-header">
              <span className="metric-card-title">Active Dispatches</span>
              <div className="metric-icon-avatar indigo"><i className="fa-solid fa-truck-fast"></i></div>
            </div>
            <div className="metric-card-value">{activeDispatchesCount}</div>
            <div className="metric-card-subtext">Currently in transit</div>
          </div>

        </div>
      </div>

      <div className="erp-main-section" style={{ padding: "0 6%" }}>
        {/* Tabs list */}
        <div className="erp-tabs-container">
          <div className="erp-tabs">
          <button 
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <i className="fa-solid fa-dolly"></i> Orders Queue
          </button>
          <button 
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <i className="fa-solid fa-users"></i> Users & Customers
          </button>
          <button 
            className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            <i className="fa-solid fa-boxes-stacked"></i> Inventory Registry
          </button>
          <button 
            className={`tab-btn ${activeTab === "coupons" ? "active" : ""}`}
            onClick={() => setActiveTab("coupons")}
          >
            <i className="fa-solid fa-ticket"></i> Coupons & Promos
          </button>
          <button 
            className={`tab-btn ${activeTab === "promo-popup" ? "active" : ""}`}
            onClick={() => setActiveTab("promo-popup")}
          >
            <i className="fa-solid fa-bullhorn"></i> Promo Popup Manager
          </button>
          <button 
            className={`tab-btn ${activeTab === "instructions" ? "active" : ""}`}
            onClick={() => setActiveTab("instructions")}
          >
            <i className="fa-solid fa-book-open"></i> Help & Instructions
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
                      Live Auto-Sync: 2m
                    </span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "4px 0 0 0" }}>Change statuses to trigger simulated BlueDart tracking logs</p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
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
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Status Filter Quick Pills Bar */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '6px' }}>Filter Status:</span>
                {[
                  { label: "Active Dispatches", value: "Active", icon: "fa-truck-fast", count: activeDispatchesCount },
                  { label: "Pending", value: "Pending", icon: "fa-clock-rotate-left", count: pendingOrdersCount },
                  { label: "Packed", value: "Packed", icon: "fa-box", count: ordersList.filter(o => o.status === "Packed").length },
                  { label: "Shipped", value: "Shipped", icon: "fa-paper-plane", count: ordersList.filter(o => o.status === "Shipped").length },
                  { label: "Delivered", value: "Delivered", icon: "fa-circle-check", count: ordersList.filter(o => o.status === "Delivered").length },
                  { label: "Today's Orders", value: "Today", icon: "fa-calendar-day", count: todayOrders.length },
                  { label: "All Transactions", value: "All", icon: "fa-list", count: totalOrdersCount }
                ].map(filterBtn => (
                  <button
                    key={filterBtn.value}
                    onClick={() => setOrderFilter(filterBtn.value)}
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
                      <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        No orders recorded matching criteria. Place a mock checkout to populate this panel.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: "700" }}>{order.id}</td>
                        <td style={{ fontWeight: "600" }}>
                          <div style={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: "700" }}>{order.customerName}</div>
                          {order.customerPhone && order.customerPhone !== 'N/A' ? (
                            <a 
                              href={`tel:${order.customerPhone.replace(/[^0-9+]/g, '')}`} 
                              className="phone-call-link"
                              title="Click to Call Customer"
                            >
                              <i className="fa-solid fa-phone"></i>
                              <span>{order.customerPhone}</span>
                            </a>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>No Phone</span>
                          )}
                        </td>
                        <td>{new Date(order.date).toLocaleString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                        <td>₹{order.total.toFixed(2)}</td>
                        <td>
                          <span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{order.courierStatus}</td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {order.status === "Pending" && (
                              <button 
                                className="btn btn-outline btn-sm" 
                                style={{ borderColor: "#00aaff", color: "#00aaff" }}
                                onClick={() => handleProcessOrder(order.id, "Packed", order._docId)}
                              >
                                <i className="fa-solid fa-box"></i> Pack SKU
                              </button>
                            )}
                            {order.status === "Packed" && (
                              <button 
                                className="btn btn-outline btn-sm" 
                                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                                onClick={() => handleProcessOrder(order.id, "Shipped", order._docId)}
                              >
                                <i className="fa-solid fa-truck-fast"></i> Ship to Delivery Man
                              </button>
                            )}

                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => generateInvoicePDF(order)}
                              title="Download Official Orient Crockery Tax Receipt PDF"
                            >
                              <i className="fa-solid fa-file-pdf"></i> Print Tax Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
                            onClick={() => setEditingProduct({ ...p })}
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
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="18"
                    value={newProduct.gst}
                    onChange={(e) => setNewProduct({ ...newProduct, gst: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <span className="form-label">Department</span>
                  <select 
                    className="sort-select"
                    value={newProduct.department}
                    onChange={(e) => setNewProduct({ ...newProduct, department: e.target.value })}
                  >
                    <option value="Gifting">Gifting</option>
                    <option value="Crockery & Dining">Crockery & Dining</option>
                    <option value="Cookware">Cookware</option>
                    <option value="Woodcraft">Woodcraft</option>
                    <option value="Home Décor">Home Décor</option>
                  </select>
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
                  <span className="form-label">Upload Images</span>
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
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editingProduct.gst || 18}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gst: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <span className="form-label">Department</span>
                  <select 
                    className="sort-select"
                    value={editingProduct.department}
                    onChange={(e) => setEditingProduct({ ...editingProduct, department: e.target.value })}
                  >
                    <option value="Gifting">Gifting</option>
                    <option value="Crockery & Dining">Crockery & Dining</option>
                    <option value="Cookware">Cookware</option>
                    <option value="Woodcraft">Woodcraft</option>
                    <option value="Home Décor">Home Décor</option>
                  </select>
                </div>

                {/* Existing Images Gallery */}
                <div className="form-group full-width">
                  <span className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Existing Images</span>
                    <span style={{ fontSize: "0.75rem", color: "#e63946", fontWeight: "500", backgroundColor: "#ffe3e3", padding: "3px 8px", borderRadius: "12px" }}>Click 'X' to delete</span>
                  </span>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "10px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}>
                    {(() => {
                      const currentImages = editingProduct.images?.length > 0 ? editingProduct.images : (editingProduct.image && editingProduct.image !== '/placeholder.jpg' ? [editingProduct.image] : []);
                      if (currentImages.length === 0) {
                        return <p style={{ fontSize: "0.9rem", color: "#64748b", margin: 0, fontStyle: "italic" }}>No images currently attached to this product.</p>;
                      }
                      return currentImages.map((imgUrl, idx) => (
                        <div key={idx} style={{ position: "relative", width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}>
                          <img src={imgUrl} alt={`Product ${idx}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          <button 
                            type="button"
                            title="Delete Image"
                            onClick={() => {
                              if (window.confirm("Remove this image?")) {
                                const newImages = currentImages.filter((_, i) => i !== idx);
                                setEditingProduct({ 
                                  ...editingProduct, 
                                  images: newImages, 
                                  image: newImages.length > 0 ? newImages[0] : '/placeholder.jpg' 
                                });
                              }
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
                      ));
                    })()}
                  </div>
                </div>

                <div className="form-group full-width">
                  <span className="form-label">Upload New / Additional Images</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) => setSingleUploadImages(Array.from(e.target.files))}
                    disabled={isSingleUploading}
                    className="form-input"
                  />
                  {singleUploadImages.length > 0 && (
                    <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem", color: "#059669", fontWeight: "500" }}>
                      <i className="fa-solid fa-circle-check"></i> {singleUploadImages.length} new image(s) ready to insert
                    </p>
                  )}
                </div>
                
                <div className="form-group full-width" style={{ flexDirection: "row", gap: "25px", margin: "5px 0" }}>
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
                </div>

                {/* Customer Reviews Management Box */}
                <div className="form-group full-width" style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1.5px solid #cbd5e1" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fa-solid fa-star" style={{ color: "#f59e0b" }}></i> Customer Reviews Management
                  </h4>
                  
                  {/* Manual Review additions */}
                  <div style={{ padding: "10px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                    <span className="modal-meta-label" style={{ fontSize: "0.75rem" }}>Inject Customer Review</span>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Author Name"
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <select 
                        className="sort-select" 
                        value={newReviewRating} 
                        onChange={(e) => setNewReviewRating(parseInt(e.target.value))}
                        style={{ width: "80px" }}
                      >
                        <option value="5">5★</option>
                        <option value="4">4★</option>
                        <option value="3">3★</option>
                      </select>
                    </div>
                    <textarea 
                      rows="2" 
                      className="form-input" 
                      placeholder="Review details..."
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
                      + Insert Review
                    </button>
                  </div>

                  {/* Reviews List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(!editingProduct.reviews || editingProduct.reviews.length === 0) ? (
                      <p style={{ fontStyle: "italic", fontSize: "0.8rem", color: "#64748b", margin: 0 }}>No customer reviews attached.</p>
                    ) : (
                      editingProduct.reviews.map(rev => (
                        <div key={rev.id} style={{ fontSize: "0.8rem", padding: "8px 12px", background: "#fff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", marginBottom: "4px", color: "#1e293b" }}>
                            <span>{rev.reviewerName} ({rev.rating}★)</span>
                            <button 
                              type="button"
                              onClick={() => handleDeleteReview(rev.id)}
                              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "bold" }}
                            >
                              Delete
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

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="modal-overlay active" onClick={() => !isBulkUploading && setShowBulkUploadModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", gridTemplateColumns: "1fr" }}>
            {!isBulkUploading && (
              <button className="modal-close-btn" onClick={() => setShowBulkUploadModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
            
            <div className="modal-content-side">
              <span className="modal-meta-label">Advanced Tools</span>
              <h2 className="modal-title" style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>Bulk Import Products</h2>
              
              <div style={{ background: "rgba(184, 134, 11, 0.05)", padding: "15px", borderRadius: "8px", border: "1px dashed var(--primary)", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--dark)", fontSize: "1rem" }}><i className="fa-solid fa-circle-info" style={{ color: "var(--primary)" }}></i> Instructions</h4>
                <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
                  <li>Name your product images exactly as their SKU IDs (e.g. <b>201.jpg</b> or <b>201.png</b>).</li>
                  <li>Select all your images at once in Step 1. The system will automatically compress them and upload them.</li>
                  <li>Select your formatted CSV file in Step 2.</li>
                  <li>Click "Start Bulk Import". Please do not close the window while it is uploading.</li>
                </ol>
              </div>

              <div className="form-group full-width" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Step 1: Upload Images (Multiple allowed)</label>
                <div style={{ border: "1px solid var(--border)", padding: "10px", borderRadius: "8px", background: "var(--bg-surface)" }}>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => setBulkImages(Array.from(e.target.files))}
                    disabled={isBulkUploading}
                    style={{ width: "100%", fontSize: "0.9rem" }}
                  />
                  {bulkImages.length > 0 && (
                    <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "var(--primary)", fontWeight: "600" }}>
                      {bulkImages.length} image(s) selected for auto-compression.
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group full-width" style={{ marginBottom: "2rem" }}>
                <label className="form-label">Step 2: Upload CSV File</label>
                <div style={{ border: "1px solid var(--border)", padding: "10px", borderRadius: "8px", background: "var(--bg-surface)" }}>
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={(e) => setBulkCsvFile(e.target.files[0])}
                    disabled={isBulkUploading}
                    style={{ width: "100%", fontSize: "0.9rem" }}
                  />
                  {bulkCsvFile && (
                    <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "var(--primary)", fontWeight: "600" }}>
                      {bulkCsvFile.name} ready for import.
                    </p>
                  )}
                </div>
              </div>

              {bulkUploadStatus && (
                <div style={{ padding: "10px", marginBottom: "1rem", borderRadius: "4px", background: "var(--bg-main)", border: "1px solid var(--border)", fontSize: "0.85rem", textAlign: "center" }}>
                  {isBulkUploading ? <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px", color: "var(--primary)" }}></i> : null}
                  {bulkUploadStatus}
                </div>
              )}

              <button 
                className="btn btn-primary btn-full" 
                onClick={handleBulkUploadSubmit}
                disabled={isBulkUploading || !bulkCsvFile}
                style={{ opacity: (isBulkUploading || !bulkCsvFile) ? 0.6 : 1 }}
              >
                {isBulkUploading ? "Processing..." : "Start Bulk Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Coupons */}
      {activeTab === "coupons" && <CouponsTab />}

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
          backdropFilter: "blur(12px)",
          color: "#ffffff",
          padding: "14px 22px",
          borderRadius: "14px",
          border: "1px solid rgba(217, 119, 6, 0.4)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35), 0 0 20px rgba(217, 119, 6, 0.2)",
          maxWidth: "480px",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <div style={{
          width: "36px",
          height: "36px",
          minWidth: "36px",
          borderRadius: "50%",
          backgroundColor: "rgba(217, 119, 6, 0.2)",
          border: "1px solid rgba(217, 119, 6, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fbbf24",
          fontSize: "1.1rem"
        }}>
          <i className="fa-solid fa-bell-concierge"></i>
        </div>
        <div style={{ flexGrow: 1 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "#fbbf24", marginBottom: "2px" }}>
            Orient System Alert
          </div>
          <div style={{ fontSize: "0.9rem", fontWeight: "500", color: "#f8fafc", lineHeight: "1.4" }}>
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
    </div>
  );
}
