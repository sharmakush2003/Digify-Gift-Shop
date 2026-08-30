import parsedProducts from './parsed_products.json';

const CACHE_VERSION = '1.3';

export const getProducts = () => {
  if (typeof window === 'undefined') return [...parsedProducts];
  let data = localStorage.getItem('orient_products');
  let version = localStorage.getItem('orient_products_version');
  
  if (!data || version !== CACHE_VERSION) {
    const combined = [...parsedProducts];
    localStorage.setItem('orient_products', JSON.stringify(combined));
    localStorage.setItem('orient_products_version', CACHE_VERSION);
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

const INITIAL_DEMO_ORDERS = [
  {
    id: "ORD-882193",
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    customerName: "Anjali Gupta",
    customerPhone: "+91 98765 43210",
    shippingAddress: "B-12, Green Park, New Delhi",
    items: [{ id: "P101", name: "Royal Ceramic Dinner Set", price: 2490, qty: 1 }],
    subtotal: 2490,
    shipping: 0,
    discount: 0,
    total: 2490,
    status: "Shipped",
    courierStatus: "In Transit",
    paymentStatus: "Paid"
  },
  {
    id: "ORD-771822",
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    customerName: "Vikram Mehta",
    customerPhone: "+91 98112 34567",
    shippingAddress: "45, Civil Lines, Jaipur, Rajasthan",
    items: [{ id: "P102", name: "Porcelain Tea Cups (Set of 6)", price: 1850, qty: 1 }],
    subtotal: 1850,
    shipping: 0,
    discount: 0,
    total: 1850,
    status: "Pending",
    courierStatus: "In Warehouse",
    paymentStatus: "Paid"
  },
  {
    id: "ORD-654109",
    date: new Date(Date.now() - 3600000 * 18).toISOString(),
    customerName: "Pooja Verma",
    customerPhone: "+91 99201 88374",
    shippingAddress: "Sector 15, Gurgaon, Haryana",
    items: [{ id: "P103", name: "Crystal Wine Glasses Set", price: 3200, qty: 1 }],
    subtotal: 3200,
    shipping: 0,
    discount: 0,
    total: 3200,
    status: "Packed",
    courierStatus: "In Warehouse",
    paymentStatus: "Paid"
  },
  {
    id: "ORD-512034",
    date: new Date(Date.now() - 3600000 * 22).toISOString(),
    customerName: "Rohan Kapoor",
    customerPhone: "+91 97110 44521",
    shippingAddress: "Model Town, Ludhiana, Punjab",
    items: [{ id: "P104", name: "Handcrafted Acacia Wood Bowl", price: 1150, qty: 1 }],
    subtotal: 1150,
    shipping: 0,
    discount: 0,
    total: 1150,
    status: "Shipped",
    courierStatus: "In Transit",
    paymentStatus: "Paid"
  },
  {
    id: "ORD-409182",
    date: new Date(Date.now() - 3600000 * 30).toISOString(),
    customerName: "Neha Saxena",
    customerPhone: "+91 98300 12903",
    shippingAddress: "Aliganj, Lucknow, UP",
    items: [{ id: "P105", name: "Golden Cutlery Set", price: 980, qty: 1 }],
    subtotal: 980,
    shipping: 0,
    discount: 0,
    total: 980,
    status: "Shipped",
    courierStatus: "In Transit",
    paymentStatus: "Paid"
  },
  {
    id: "ORD-312901",
    date: new Date(Date.now() - 3600000 * 36).toISOString(),
    customerName: "Amit Trivedi",
    customerPhone: "+91 94150 99812",
    shippingAddress: "MG Road, Indore, MP",
    items: [{ id: "P106", name: "Opalware Soup Bowls Set", price: 1450, qty: 1 }],
    subtotal: 1450,
    shipping: 0,
    discount: 0,
    total: 1450,
    status: "Shipped",
    courierStatus: "In Transit",
    paymentStatus: "Paid"
  },
  {
    id: "ORD-201823",
    date: new Date(Date.now() - 3600000 * 50).toISOString(),
    customerName: "Suresh Joshi",
    customerPhone: "+91 98290 33412",
    shippingAddress: "C-Scheme, Jaipur, Rajasthan",
    items: [{ id: "P107", name: "Designer Glass Pitcher", price: 723, qty: 1 }],
    subtotal: 723,
    shipping: 0,
    discount: 0,
    total: 723,
    status: "Delivered",
    courierStatus: "Delivered",
    paymentStatus: "Paid"
  },
  {
    id: "ORD-109283",
    date: new Date(Date.now() - 3600000 * 60).toISOString(),
    customerName: "Kavita Reddy",
    customerPhone: "+91 99887 66543",
    shippingAddress: "Banjara Hills, Hyderabad, Telangana",
    items: [{ id: "P108", name: "Ceramic Coffee Mugs Pair", price: 450, qty: 1 }],
    subtotal: 450,
    shipping: 0,
    discount: 0,
    total: 450,
    status: "Delivered",
    courierStatus: "Delivered",
    paymentStatus: "Paid"
  }
];

export const getOrders = () => {
  if (typeof window === 'undefined') return INITIAL_DEMO_ORDERS;
  let data = localStorage.getItem('orient_orders');
  if (!data) {
    localStorage.setItem('orient_orders', JSON.stringify(INITIAL_DEMO_ORDERS));
    return INITIAL_DEMO_ORDERS;
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
