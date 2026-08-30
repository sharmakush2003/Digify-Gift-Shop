"use client";

import React, { useState, useEffect } from "react";
import { 
  fetchProducts,
  updateOrderStatus,
  getOrders
} from "../db";
import { supabase } from "../../supabase";
import CouponsTab from "./CouponsTab";
import InstructionsTab from "./InstructionsTab";
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

  // Editing modals states
  const [editingProduct, setEditingProduct] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // New Combo hamper states
  const [newComboName, setNewComboName] = useState("");
  const [newComboPrice, setNewComboPrice] = useState("");
  const [newComboStock, setNewComboStock] = useState("");
  const [newComboImage, setNewComboImage] = useState("");
  const [newComboDept, setNewComboDept] = useState("Crockery & Dining");
  const [newComboCat, setNewComboCat] = useState("Dinnerware");
  const [newComboSub, setNewComboSub] = useState("Dinner Sets");

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
      setProductsList(getProducts()); // Fallback
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
      
      // Merge with local storage orders so recent tests aren't lost
      const localOrders = getOrders();
      if (localOrders && localOrders.length > 0) {
        // Only add local orders that aren't already in Supabase (by ID or UUID)
        const supabaseOrderIds = new Set(ordersData.flatMap(o => [o.order_number, o.id, o._docId]).filter(Boolean));
        const missingLocalOrders = localOrders.filter(o => !supabaseOrderIds.has(o.id));
        ordersData = [...ordersData, ...missingLocalOrders];
      }

      if (!ordersData || ordersData.length === 0) {
        ordersData = getOrders();
      }

      ordersData.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
      setOrdersList(ordersData);
    } catch (e) {
      console.warn("Failed to load orders from Supabase", e);
      setOrdersList(getOrders()); // Fallback
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
    
    return () => window.removeEventListener('resize', handleResize);
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

      // Handle OTP generation when marking as Shipped
      let otpGenerated = null;
      let newShippingAddress = null;
      
      const { data: dbRecord } = await supabase.from('orders').select('shipping_address').eq('order_number', orderId).single();
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

      await supabase.from('orders').update(updateData).eq('order_number', orderId);

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
    }
    loadDbData();
    triggerToast(`Order ${orderId} marked as ${nextStatus}`);
  };

  // Metric computations
  const allTimeRevenue = ordersList.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  
  const todayStr = new Date().toDateString();
  const todayOrders = ordersList.filter(o => o.date && new Date(o.date).toDateString() === todayStr);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  
  const totalOrdersCount = ordersList.length;
  const activeOrdersCount = ordersList.filter(o => o.status !== "Delivered").length;
  const pendingOrdersCount = ordersList.filter(o => o.status === "Pending").length;
  const lowStockCount = productsList.filter(p => p.stock < 5).length;

  // Cutoff date for recent orders (48 hours ago)
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - TWO_DAYS_MS);

  // Filters for order listing (Only last 2 days)
  const filteredOrders = ordersList.filter(order => {
    const orderDate = new Date(order.date);
    if (orderDate < cutoffDate) return false;

    const matchesSearch = order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          order.customerName.toLowerCase().includes(orderSearch.toLowerCase());
    
    const matchesStatus = orderFilter === "All" ||
                          (orderFilter === "Active" && order.status !== "Delivered") ||
                          (orderFilter === "Delivered" && order.status === "Delivered");
    
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
    if (!newComboName || !newComboPrice || !newComboStock) {
      alert("Please fill in core hamper details.");
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

    const newId = productsList.length > 0 ? Math.max(...productsList.map(p => p.id)) + 1 : 101;
    const newCombo = {
      id: newId,
      name: newComboName,
      price: parseFloat(newComboPrice),
      stock: parseInt(newComboStock),
      image: newComboImage || "/images/acacia_wood_casserole.png",
      department: newComboDept,
      category: newComboCat,
      subCategory: newComboSub,
      fragile: true,
      microwave: false,
      barcode: "000" + Math.floor(Math.random() * 900000 + 100000),
      hsn: "9505",
      gst: 18,
      soldCount: 0,
      description: "Luxurious curated dining hamper by Orient Crockeries.",
      rating: 5.0,
      reviewCount: 0,
      reviews: [],
      images: uploadedImageUrls.length > 0 ? uploadedImageUrls : (newComboImage ? [newComboImage] : [])
    };
    if (uploadedImageUrls.length > 0) {
      newCombo.image = uploadedImageUrls[0];
    }

    const addComboToSupabase = async () => {
      try {
        await supabase.from('products').upsert(newCombo);
        loadDbData();
        setShowComboModal(false);
        setNewComboName("");
        setNewComboPrice("");
        setNewComboStock("");
        setNewComboImage("");
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
    <div className="erp-page" style={{ marginTop: "60px", minHeight: "100vh", backgroundColor: "var(--bg-main)", paddingBottom: "5rem" }}>
      {/* Header Stats Bar */}
      <div className="erp-dashboard-header" style={{ padding: "4rem 6% 2rem 6%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem" }}>Orient Crockery Product Management System</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Operations Registry &bull; Local Storage Mode</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i> Logout Portal
          </button>
        </div>

        {/* Metric widgets grid */}
        <div className="erp-metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "1.5rem" }}>
          {/* Card 1: All-Time Revenue */}
          <div className="metric-card-pro">
            <div className="metric-card-header">
              <span className="metric-card-title">All-Time Revenue</span>
              <div className="metric-icon-avatar gold">
                <i className="fa-solid fa-wallet"></i>
              </div>
            </div>
            <div className="metric-card-value">₹{allTimeRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="metric-card-subtext">Cumulative cleared store sales</div>
          </div>

          {/* Card 2: Today's Revenue */}
          <div className="metric-card-pro">
            <div className="metric-card-header">
              <span className="metric-card-title">Today's Revenue</span>
              <div className="metric-icon-avatar green">
                <i className="fa-solid fa-chart-line"></i>
              </div>
            </div>
            <div className="metric-card-value">₹{todayRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="metric-card-subtext">{todayOrders.length} {todayOrders.length === 1 ? 'order' : 'orders'} placed today</div>
          </div>

          {/* Card 3: Total Orders Till Today */}
          <div className="metric-card-pro">
            <div className="metric-card-header">
              <span className="metric-card-title">Total Orders</span>
              <div className="metric-icon-avatar blue">
                <i className="fa-solid fa-boxes-stacked"></i>
              </div>
            </div>
            <div className="metric-card-value">{totalOrdersCount}</div>
            <div className="metric-card-subtext">Lifetime customer transactions</div>
          </div>

          {/* Card 4: Active Orders */}
          <div className="metric-card-pro">
            <div className="metric-card-header">
              <span className="metric-card-title">Active Dispatches</span>
              <div className="metric-icon-avatar indigo">
                <i className="fa-solid fa-truck-fast"></i>
              </div>
            </div>
            <div className="metric-card-value">{activeOrdersCount}</div>
            <div className="metric-card-subtext">In packing &amp; dispatch queue</div>
          </div>

          {/* Card 5: Pending Orders */}
          <div className="metric-card-pro">
            <div className="metric-card-header">
              <span className="metric-card-title">Pending Orders</span>
              <div className="metric-icon-avatar amber">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>
            </div>
            <div className="metric-card-value">{pendingOrdersCount}</div>
            <div className="metric-card-subtext">Awaiting admin processing</div>
          </div>

          {/* Card 6: Low Stock Items */}
          <div className="metric-card-pro">
            <div className="metric-card-header">
              <span className="metric-card-title">Low Stock Alert</span>
              <div className={`metric-icon-avatar ${lowStockCount > 0 ? 'red' : 'green'}`}>
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
            </div>
            <div className="metric-card-value" style={{ color: lowStockCount > 0 ? "#dc2626" : "inherit" }}>{lowStockCount}</div>
            <div className="metric-card-subtext">Products below 5 units stock</div>
          </div>
        </div>
      </div>

      <div className="erp-main-section" style={{ padding: "0 6%" }}>
        {/* Tabs list */}
        <div className="erp-tabs" style={{ display: "flex", gap: "1rem", marginBottom: "25px" }}>
          <button 
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <i className="fa-solid fa-dolly"></i> Orders Queue
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
            className={`tab-btn ${activeTab === "instructions" ? "active" : ""}`}
            onClick={() => setActiveTab("instructions")}
          >
            <i className="fa-solid fa-book-open"></i> Help & Instructions
          </button>
        </div>

        {/* Tab 1: Orders Queue */}
        {activeTab === "orders" && (
          <div className="erp-content-box">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3>Shipment Dispatches Queue</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Change statuses to trigger simulated BlueDart tracking logs</p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={loadDbData}
                  style={{ height: '38px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <i className="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={exportOrdersToCSV}
                  style={{ height: '38px' }}
                >
                  <i className="fa-solid fa-file-csv"></i> Export Past Orders
                </button>
                <select 
                  className="sort-select"
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  style={{ borderRadius: "8px" }}
                >
                  <option value="Active">Active Dispatches</option>
                  <option value="Delivered">Completed Deliveries</option>
                  <option value="All">All Transactions</option>
                </select>
                <input 
                  type="text" 
                  className="loyalty-input" 
                  placeholder="Search by ID or customer..." 
                  style={{ width: "240px", borderRadius: "8px" }}
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
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
                              onClick={() => setInvoiceOrder(order)}
                            >
                              <i className="fa-solid fa-receipt"></i> Print Tax Receipt
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
      </div>
      {/* Modals are placed below main */}

      {/* Add Product Modal Form */}
      {showAddProductModal && (
        <div className="modal-overlay active" onClick={() => { setShowAddProductModal(false); setSingleUploadImages([]); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <button className="modal-close-btn" onClick={() => { setShowAddProductModal(false); setSingleUploadImages([]); }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            
            <form onSubmit={handleAddProduct} style={{ padding: "20px", overflowY: "auto", maxHeight: "80vh" }}>
              <span className="modal-meta-label">Add a new product</span>
              <h2 className="modal-title" style={{ fontSize: "1.6rem" }}>Create Single Product</h2>
              
              <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="form-group full-width">
                  <span className="form-label">Product Name</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
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
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">HSN Code</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newProduct.hsn}
                    onChange={(e) => setNewProduct({ ...newProduct, hsn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">GST Rate (%)</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newProduct.gst}
                    onChange={(e) => setNewProduct({ ...newProduct, gst: e.target.value })}
                  />
                </div>
                <div className="form-group">
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "1000px", gridTemplateColumns: "1.4fr 1fr", overflow: "hidden", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <button className="modal-close-btn" onClick={() => { setEditingProduct(null); setSingleUploadImages([]); }} style={{ zIndex: 10, backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            
            <form onSubmit={handleUpdateProduct} className="modal-content-side" style={{ borderRight: "1px solid #eaeaea", overflowY: "auto", maxHeight: "85vh", background: "linear-gradient(to bottom right, #ffffff, #fcfcfc)", padding: "2.5rem" }}>
              <div style={{ marginBottom: "2rem", borderBottom: "2px solid #f0f0f0", paddingBottom: "1rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "#d4af37" }}>Edit Specifications</span>
                <h2 style={{ fontSize: "1.8rem", color: "#111", fontFamily: "var(--font-serif)", marginTop: "0.5rem" }}>
                  SKU #{editingProduct.id}
                </h2>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
                
                {/* SECTION 1: General Info */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontSize: "1rem", color: "#475569", marginBottom: "15px", fontWeight: "600", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>General Information</h3>
                  <div className="form-group full-width" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "15px", marginBottom: "15px" }}>
                    <span className="form-label" style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "8px" }}>Product Name</span>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      style={{ borderRadius: "6px", border: "2px solid #000", padding: "10px", fontSize: "0.95rem", width: "100%", backgroundColor: "#fff", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}
                    />
                  </div>
                  <div className="form-group full-width" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "15px" }}>
                    <span className="form-label" style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "8px" }}>Product Description</span>
                    <textarea 
                      className="form-input" 
                      rows="3"
                      placeholder="Enter detailed description here..."
                      value={editingProduct.description || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      style={{ resize: "vertical", width: "100%", borderRadius: "6px", border: "2px solid #000", padding: "10px", fontSize: "0.95rem", lineHeight: "1.5", backgroundColor: "#fff", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}
                    />
                  </div>
                </div>

                {/* SECTION 2: Pricing & Inventory */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontSize: "1rem", color: "#475569", marginBottom: "15px", fontWeight: "600", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>Pricing & Inventory</h3>
                  <div className="form-grid" style={{ rowGap: "1.2rem", columnGap: "1rem" }}>
                    <div className="form-group" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "15px" }}>
                      <span className="form-label" style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "8px" }}>Price (₹)</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        style={{ borderRadius: "6px", border: "2px solid #000", padding: "10px", fontSize: "0.95rem", width: "100%", backgroundColor: "#fff", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}
                      />
                    </div>
                    <div className="form-group" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "15px" }}>
                      <span className="form-label" style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "8px" }}>Stock Units</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                        style={{ borderRadius: "6px", border: "2px solid #000", padding: "10px", fontSize: "0.95rem", width: "100%", backgroundColor: "#fff", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}
                      />
                    </div>
                    <div className="form-group" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "15px" }}>
                      <span className="form-label" style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "8px" }}>Stock Status</span>
                      <select 
                        className="sort-select"
                        value={editingProduct.stockStatus || "Available"}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stockStatus: e.target.value })}
                        style={{ borderRadius: "6px", border: "2px solid #000", padding: "10px", fontSize: "0.95rem", width: "100%", backgroundColor: "#fff", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}
                      >
                        <option value="Available">Available</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "15px" }}>
                      <span className="form-label" style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "8px" }}>Barcode</span>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={editingProduct.barcode || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                        style={{ borderRadius: "6px", border: "2px solid #000", padding: "10px", fontSize: "0.95rem", width: "100%", backgroundColor: "#fff", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Taxation & Category */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontSize: "1rem", color: "#475569", marginBottom: "15px", fontWeight: "600", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>Classification & Tax</h3>
                  <div className="form-grid" style={{ rowGap: "1.2rem", columnGap: "1rem" }}>
                    <div className="form-group" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "15px" }}>
                      <span className="form-label" style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "8px" }}>HSN Code</span>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={editingProduct.hsn || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, hsn: e.target.value })}
                        style={{ borderRadius: "6px", border: "2px solid #000", padding: "10px", fontSize: "0.95rem", width: "100%", backgroundColor: "#fff", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}
                      />
                    </div>
                    <div className="form-group" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "15px" }}>
                      <span className="form-label" style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "8px" }}>GST Rate (%)</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={editingProduct.gst || 18}
                        onChange={(e) => setEditingProduct({ ...editingProduct, gst: e.target.value })}
                        style={{ borderRadius: "6px", border: "2px solid #000", padding: "10px", fontSize: "0.95rem", width: "100%", backgroundColor: "#fff", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}
                      />
                    </div>
                    <div className="form-group" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "15px" }}>
                      <span className="form-label" style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "8px" }}>Department</span>
                      <select 
                        className="sort-select"
                        value={editingProduct.department}
                        onChange={(e) => setEditingProduct({ ...editingProduct, department: e.target.value })}
                        style={{ borderRadius: "6px", border: "2px solid #000", padding: "10px", fontSize: "0.95rem", width: "100%", backgroundColor: "#fff", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}
                      >
                        <option value="Gifting">Gifting</option>
                        <option value="Crockery & Dining">Crockery & Dining</option>
                        <option value="Cookware">Cookware</option>
                        <option value="Woodcraft">Woodcraft</option>
                        <option value="Home Décor">Home Décor</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Media & Handling */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontSize: "1rem", color: "#475569", marginBottom: "15px", fontWeight: "600", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>Media & Handling</h3>
                  
                  {/* Existing Images Gallery */}
                  <div className="form-group full-width">
                    <span className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "600", color: "#333" }}>
                      <span>Existing Images</span>
                      <span style={{ fontSize: "0.75rem", color: "#e63946", fontWeight: "500", backgroundColor: "#ffe3e3", padding: "3px 8px", borderRadius: "12px" }}>Click 'X' to delete</span>
                    </span>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "10px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      {(() => {
                        const currentImages = editingProduct.images?.length > 0 ? editingProduct.images : (editingProduct.image && editingProduct.image !== '/placeholder.jpg' ? [editingProduct.image] : []);
                        if (currentImages.length === 0) {
                          return <p style={{ fontSize: "0.9rem", color: "#64748b", margin: 0, fontStyle: "italic" }}>No images currently attached to this product.</p>;
                        }
                        return currentImages.map((imgUrl, idx) => (
                          <div key={idx} style={{ position: "relative", width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1", backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
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
                                color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", 
                                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", 
                                fontSize: "0.7rem", transition: "transform 0.2s", zIndex: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                              }}
                              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="form-group full-width" style={{ marginTop: "15px" }}>
                    <span className="form-label" style={{ fontWeight: "600", color: "#333" }}>Upload New / Additional Images</span>
                    <div style={{ padding: "10px", border: "1px dashed #cbd5e1", borderRadius: "12px", backgroundColor: "#f8fafc" }}>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={(e) => setSingleUploadImages(Array.from(e.target.files))}
                        disabled={isSingleUploading}
                        className="form-input"
                        style={{ border: "none", padding: "5px", background: "transparent", width: "100%" }}
                      />
                    </div>
                    {singleUploadImages.length > 0 && (
                      <p style={{ margin: "8px 0 0 0", fontSize: "0.85rem", color: "#059669", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px" }}>
                        <i className="fa-solid fa-circle-check"></i> {singleUploadImages.length} new image(s) ready to insert
                      </p>
                    )}
                  </div>
                  
                  <div className="form-group full-width" style={{ flexDirection: "row", gap: "25px", marginTop: "15px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <label className="filter-checkbox-label" style={{ fontWeight: "500", color: "#333" }}>
                      <input 
                        type="checkbox" 
                        checked={editingProduct.fragile}
                        onChange={(e) => setEditingProduct({ ...editingProduct, fragile: e.target.checked })}
                        style={{ accentColor: "var(--primary)" }}
                      />
                      <span>Fragile Handling</span>
                    </label>
                    <label className="filter-checkbox-label" style={{ fontWeight: "500", color: "#333" }}>
                      <input 
                        type="checkbox" 
                        checked={editingProduct.microwave}
                        onChange={(e) => setEditingProduct({ ...editingProduct, microwave: e.target.checked })}
                        style={{ accentColor: "var(--primary)" }}
                      />
                      <span>Microwave Safe</span>
                    </label>
                  </div>
                </div>
                
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-full" 
                disabled={isSingleUploading}
                style={{ 
                  background: "linear-gradient(135deg, #111, #333)", 
                  color: "#fff", 
                  padding: "14px", 
                  fontSize: "1.05rem", 
                  borderRadius: "8px", 
                  fontWeight: "600",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  transition: "all 0.3s"
                }}
              >
                {isSingleUploading ? (
                  <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Saving Changes...</span>
                ) : (
                  <span><i className="fa-solid fa-floppy-disk" style={{ marginRight: "8px" }}></i> Save Product Updates</span>
                )}
              </button>
            </form>

            {/* Editing Product Reviews Side panel */}
            <div className="modal-content-side" style={{ overflowY: "auto", maxHeight: "80vh" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", marginBottom: "1rem" }}>Product Reviews Review</h3>
              
              {/* Manual Review additions */}
              <div style={{ padding: "12px", border: "1px solid var(--border)", backgroundColor: "var(--bg-alt)", marginBottom: "1.5rem" }}>
                <span className="modal-meta-label">Inject Customer Review</span>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input 
                    type="text" 
                    className="loyalty-input" 
                    placeholder="Author Name"
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                  />
                  <select 
                    className="sort-select" 
                    value={newReviewRating} 
                    onChange={(e) => setNewReviewRating(parseInt(e.target.value))}
                    style={{ padding: "4px" }}
                  >
                    <option value="5">5★</option>
                    <option value="4">4★</option>
                    <option value="3">3★</option>
                  </select>
                </div>
                <textarea 
                  rows="2" 
                  className="form-input" 
                  placeholder="Review review details..."
                  style={{ resize: "none", fontSize: "0.8rem", width: "100%", padding: "6px" }}
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                />
                <button 
                  className="btn btn-outline btn-sm btn-full" 
                  style={{ marginTop: "8px", padding: "4px" }}
                  onClick={handleAddReviewManually}
                >
                  Insert Review
                </button>
              </div>

              {/* Reviews List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(!editingProduct.reviews || editingProduct.reviews.length === 0) ? (
                  <p style={{ fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-muted)" }}>No customer reviews injected.</p>
                ) : (
                  editingProduct.reviews.map(rev => (
                    <div key={rev.id} style={{ fontSize: "0.8rem", padding: "8px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", marginBottom: "4px" }}>
                        <span>{rev.reviewerName} ({rev.rating}★)</span>
                        <button 
                          onClick={() => handleDeleteReview(rev.id)}
                          style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </div>
                      <p style={{ color: "var(--text-muted)" }}>{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gift Hamper / Combo Modal */}
      {showComboModal && (
        <div className="modal-overlay active" onClick={() => { setShowComboModal(false); setSingleUploadImages([]); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px", gridTemplateColumns: "1fr" }}>
            <button className="modal-close-btn" onClick={() => { setShowComboModal(false); setSingleUploadImages([]); }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <form onSubmit={handleAddCombo} className="modal-content-side">
              <span className="modal-meta-label">Hamper Registration</span>
              <h2 className="modal-title" style={{ fontSize: "1.6rem", marginBottom: "1.5rem" }}>Register Gift Hamper / Combo</h2>
              
              <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="form-group full-width">
                  <span className="form-label">Hamper Title Name</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="E.g. Diwali Teapot Gold Premium Set"
                    value={newComboName} 
                    onChange={(e) => setNewComboName(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Price (₹)</span>
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
                  <span className="form-label">Upload Product Images</span>
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
                <div className="form-group full-width" style={{ marginTop: "10px" }}>
                  <span className="form-label">Or Image URL Path</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="/images/acacia_wood_casserole.png"
                    value={newComboImage} 
                    onChange={(e) => setNewComboImage(e.target.value)} 
                    disabled={singleUploadImages.length > 0}
                  />
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
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={isSingleUploading}>
                {isSingleUploading ? "Registering..." : "Register in Database"}
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

      {/* Tab 4: Instructions */}
      {activeTab === "instructions" && <InstructionsTab />}

      {/* Floating Toast Notification */}
      <div className={`toast toast-success ${showToast ? "show" : ""}`}>
        <i className="fa-solid fa-circle-check" style={{ color: "var(--primary)", fontSize: "1.1rem" }}></i>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
