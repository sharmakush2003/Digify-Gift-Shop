import parsedProducts from './parsed_products.json';

const initialGifts = [
  {
    id: 1,
    name: "Golden Eternal Rose",
    price: 129.00,
    image: "/images/rose.jpg",
    department: "Gifting",
    category: "Festival Gifts",
    subCategory: "Diwali Gifts",
    stock: 12,
    fragile: true,
    microwave: false,
    barcode: "00000001",
    hsn: "9506",
    gst: 18,
    capacity: "",
    soldCount: 45,
    description: "A beautifully hand-crafted golden rose, representing eternal love. Ideal for festival gifting.",
    rating: 4.8,
    reviewCount: 15,
    reviews: []
  },
  {
    id: 2,
    name: "Luxury Watch Set",
    price: 450.00,
    image: "/images/watch.jpg",
    department: "Gifting",
    category: "Gift Sets",
    subCategory: "Home Décor Gift Packs",
    stock: 6,
    fragile: true,
    microwave: false,
    barcode: "00000002",
    hsn: "9102",
    gst: 18,
    capacity: "",
    soldCount: 22,
    description: "Luxury timepiece set featuring a polished finish and elegant leather straps, perfect for corporate and wedding gifting.",
    rating: 4.9,
    reviewCount: 8,
    reviews: []
  },
  {
    id: 3,
    name: "Customized Leather Journal",
    price: 59.00,
    image: "/images/journal.jpg",
    department: "Gifting",
    category: "Wedding Gifts",
    subCategory: "Executive Gifts",
    stock: 20,
    fragile: false,
    microwave: false,
    barcode: "00000003",
    hsn: "4820",
    gst: 18,
    capacity: "",
    soldCount: 110,
    description: "Premium leather journal with refillable vintage paper, customized name engraving option, and custom bookmark.",
    rating: 4.7,
    reviewCount: 30,
    reviews: []
  },
  {
    id: 4,
    name: "Artisan Chocolate Box",
    price: 85.00,
    image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=1935&auto=format&fit=crop",
    department: "Gifting",
    category: "Wedding Gifts",
    subCategory: "Gift Hampers",
    stock: 15,
    fragile: false,
    microwave: false,
    barcode: "00000004",
    hsn: "9505",
    gst: 18,
    capacity: "",
    soldCount: 85,
    description: "An assortment of premium dark and milk chocolates hand-made by local confectioners, packaged in a custom gift wrap.",
    rating: 4.6,
    reviewCount: 18,
    reviews: []
  },
  {
    id: 5,
    name: "Diamond Stud Earrings",
    price: 899.00,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop",
    department: "Gifting",
    category: "Wedding Gifts",
    subCategory: "Wedding Gifts",
    stock: 3,
    fragile: true,
    microwave: false,
    barcode: "00000005",
    hsn: "9506",
    gst: 18,
    capacity: "",
    soldCount: 12,
    description: "Elegant 18k white gold diamond studs, featuring brilliant round-cut stones. Certificated premium wedding jewel.",
    rating: 5.0,
    reviewCount: 5,
    reviews: []
  },
  {
    id: 6,
    name: "Crystal Scented Candle",
    price: 45.00,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=1974&auto=format&fit=crop",
    department: "Home Décor",
    category: "Decorative Items",
    subCategory: "Showpieces",
    stock: 25,
    fragile: true,
    microwave: false,
    barcode: "00000006",
    hsn: "9506",
    gst: 18,
    capacity: "",
    soldCount: 120,
    description: "Highly aromatic soy-wax scented candle set in a premium crystal jar, providing a warm, comforting lavender scent.",
    rating: 4.5,
    reviewCount: 42,
    reviews: []
  },
  {
    id: 7,
    name: "Premium Bone China Set",
    price: 299.00,
    image: "/images/crockery_dinner_set.png",
    department: "Crockery & Dining",
    category: "Dinnerware",
    subCategory: "Dinner Sets",
    stock: 8,
    fragile: true,
    microwave: true,
    barcode: "00000007",
    hsn: "6911",
    gst: 18,
    capacity: "",
    soldCount: 30,
    description: "Exquisite 24-piece bone china dinnerware set with hand-painted gold borders. Microwave safe and scratch resistant.",
    rating: 4.9,
    reviewCount: 24,
    reviews: []
  },
  {
    id: 8,
    name: "Artisan Ceramic Teapot",
    price: 75.00,
    image: "/images/crockery_teapot.png",
    department: "Crockery & Dining",
    category: "Drinkware",
    subCategory: "Tea Cups & Saucers",
    stock: 10,
    fragile: true,
    microwave: true,
    barcode: "00000008",
    hsn: "6911",
    gst: 18,
    capacity: "",
    soldCount: 40,
    description: "Handcrafted stone ceramic teapot, designed with heat-retention walls and a convenient drip-free spout.",
    rating: 4.7,
    reviewCount: 16,
    reviews: []
  },
  {
    id: 9,
    name: "Crystal Wine Glass Set",
    price: 120.00,
    image: "/images/crockery_wine_glasses.png",
    department: "Crockery & Dining",
    category: "Drinkware",
    subCategory: "Wine Glasses",
    stock: 14,
    fragile: true,
    microwave: false,
    barcode: "00000009",
    hsn: "7013",
    gst: 18,
    capacity: "",
    soldCount: 65,
    description: "Set of 6 premium lead-free crystal wine glasses, featuring an elegant long stem and a wide bowl for red/white wines.",
    rating: 4.8,
    reviewCount: 19,
    reviews: []
  },
  {
    id: 10,
    name: "Matte Ceramic Plates",
    price: 85.00,
    image: "/images/crockery_plates.png",
    department: "Crockery & Dining",
    category: "Dinnerware",
    subCategory: "Dinner Plates",
    stock: 18,
    fragile: true,
    microwave: true,
    barcode: "00000010",
    hsn: "6911",
    gst: 18,
    capacity: "",
    soldCount: 50,
    description: "Sleek matte-finish ceramic dinner plates in slate gray, adding a modern aesthetic to your luxury dinner table.",
    rating: 4.4,
    reviewCount: 22,
    reviews: []
  }
];

export const getProducts = () => {
  if (typeof window === 'undefined') return [...initialGifts, ...parsedProducts];
  let data = localStorage.getItem('orient_products');
  if (!data) {
    const combined = [...initialGifts, ...parsedProducts];
    localStorage.setItem('orient_products', JSON.stringify(combined));
    return combined;
  }
  return JSON.parse(data);
};

export const saveProducts = (products) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('orient_products', JSON.stringify(products));
};

export const updateProduct = (id, updatedProduct) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...updatedProduct };
    saveProducts(products);
    return products[index];
  }
  return null;
};

export const getOrders = () => {
  if (typeof window === 'undefined') return [];
  let data = localStorage.getItem('orient_orders');
  if (!data) {
    const initialOrders = [];
    localStorage.setItem('orient_orders', JSON.stringify(initialOrders));
    return initialOrders;
  }
  return JSON.parse(data);
};

export const saveOrder = (order) => {
  if (typeof window === 'undefined') return;
  const orders = getOrders();
  orders.unshift(order); // Put new orders on top
  localStorage.setItem('orient_orders', JSON.stringify(orders));
  return order;
};

export const updateOrderStatus = (orderId, status) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    const courierStatus = status === "Packed" ? "In Warehouse" : (status === "Shipped" ? "In Transit" : "Delivered");
    const paymentStatus = status === "Delivered" ? "Paid" : orders[index].paymentStatus;
    
    orders[index] = {
      ...orders[index],
      status,
      courierStatus,
      paymentStatus
    };
    localStorage.setItem('orient_orders', JSON.stringify(orders));
    return orders[index];
  }
  return null;
};

export const getCustomers = () => {
  if (typeof window === 'undefined') return {};
  let data = localStorage.getItem('orient_customers');
  if (!data) {
    localStorage.setItem('orient_customers', JSON.stringify({}));
    return {};
  }
  return JSON.parse(data);
};

export const getCustomerLoyaltyPoints = (phone) => {
  const customers = getCustomers();
  return customers[phone] ? customers[phone].loyaltyPoints : 0;
};

export const updateCustomerLoyaltyPoints = (phone, name, email, pointsChange) => {
  if (typeof window === 'undefined') return;
  const customers = getCustomers();
  
  if (!customers[phone]) {
    customers[phone] = {
      name,
      email,
      phone,
      loyaltyPoints: Math.max(0, pointsChange),
      lastUpdated: new Date().toISOString()
    };
  } else {
    customers[phone] = {
      ...customers[phone],
      name: name || customers[phone].name,
      email: email || customers[phone].email,
      loyaltyPoints: Math.max(0, customers[phone].loyaltyPoints + pointsChange),
      lastUpdated: new Date().toISOString()
    };
  }
  
  localStorage.setItem('orient_customers', JSON.stringify(customers));
  return customers[phone];
};
