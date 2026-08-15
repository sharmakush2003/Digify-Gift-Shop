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
