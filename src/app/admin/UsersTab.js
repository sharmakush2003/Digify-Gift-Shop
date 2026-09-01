"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../supabase";

export default function UsersTab() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsersAndCustomers = async () => {
    setLoading(true);
    try {
      // 1. Fetch from customers table
      const { data: customersData } = await supabase.from('customers').select('*');
      
      // 2. Fetch from users table to get all registered users
      const { data: usersData } = await supabase.from('users').select('*');

      // 3. Fetch from orders table to extract addresses and guest details
      const { data: ordersData } = await supabase.from('orders').select('*');

      const userMap = new Map();

      // Process public.users table entries (ignoring admins)
      if (usersData) {
        usersData.forEach(u => {
          if (u.role === 'admin') return;
          userMap.set(u.id, {
            id: u.id,
            name: `User (${u.id.slice(0, 8)})`,
            phone: 'N/A',
            email: 'N/A',
            address: 'N/A',
            ordersCount: 0,
            totalSpent: 0,
            type: 'Registered',
            isNew: true
          });
        });
      }

      // Process customers table entries
      if (customersData) {
        customersData.forEach(c => {
          const key = c.id || c.phone_number || c.email;
          const existing = userMap.get(c.id) || userMap.get(key);
          if (existing) {
            if (c.full_name) existing.name = c.full_name;
            if (c.phone_number) existing.phone = c.phone_number;
            if (c.email) existing.email = c.email;
          } else {
            userMap.set(key, {
              id: c.id,
              name: c.full_name || 'Customer',
              phone: c.phone_number || 'N/A',
              email: c.email || 'N/A',
              address: 'N/A',
              ordersCount: 0,
              totalSpent: 0,
              type: 'Registered',
              isNew: true
            });
          }
        });
      }

      // Then process orders table to enrich address, order counts, and include guest buyers
      if (ordersData) {
        ordersData.forEach(order => {
          const addr = typeof order.shipping_address === 'object' ? order.shipping_address : null;
          const phone = order.guest_phone || addr?.phone || order.phone || '';
          const formattedPhone = phone ? (phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`) : '';
          const email = order.guest_email || '';
          const name = addr?.name || order.customer_name || order.name || (email ? email.split('@')[0] : 'Customer');

          // Address formatting
          let formattedAddress = 'N/A';
          if (addr) {
            const parts = [
              addr.street || addr.address || addr.addressLine1,
              addr.city,
              addr.state,
              addr.pincode || addr.zip
            ].filter(Boolean);
            if (parts.length > 0) formattedAddress = parts.join(', ');
          }

          // Key matching: match orders strictly by customer_id or email
          const key = order.customer_id || (email && email !== 'N/A' ? email : '') || (formattedPhone && formattedPhone !== 'N/A' ? formattedPhone : order.id);

          let existing = null;
          if (order.customer_id) {
            existing = userMap.get(order.customer_id);
          }
          if (!existing && email && email !== 'N/A') {
            existing = Array.from(userMap.values()).find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
          }

          if (existing) {
            if (name && name !== 'Customer' && (existing.name === 'Customer' || existing.name.startsWith('User ('))) {
              existing.name = name;
            }
            if (existing.phone === 'N/A' && formattedPhone) existing.phone = formattedPhone;
            if (existing.email === 'N/A' && email) existing.email = email;
            if (existing.address === 'N/A' && formattedAddress !== 'N/A') existing.address = formattedAddress;
            existing.ordersCount += 1;
            existing.totalSpent += (parseFloat(order.final_total) || 0);
          } else {
            userMap.set(key, {
              id: order.customer_id || order.id,
              name: name,
              phone: formattedPhone || 'N/A',
              email: email || 'N/A',
              address: formattedAddress,
              ordersCount: 1,
              totalSpent: (parseFloat(order.final_total) || 0),
              type: order.customer_id ? 'Registered' : 'Guest'
            });
          }
        });
      }

      setUsersList(Array.from(userMap.values()));
    } catch (err) {
      console.error("Error loading users list:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsersAndCustomers();

    // Real-time listener for orders, customers, and users tables
    const channel = supabase
      .channel('admin-users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchUsersAndCustomers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchUsersAndCustomers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchUsersAndCustomers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredUsers = usersList.filter(u => {
    const hasContact = (u.phone && u.phone !== 'N/A') || (u.email && u.email !== 'N/A');
    if (!hasContact) return false;

    return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const exportToCSV = () => {
    const headers = ["Name", "Mobile Number", "Email Address", "Address", "Orders Count", "Total Spent (INR)", "Type"];
    const rows = filteredUsers.map(u => [
      `"${u.name}"`,
      `"${u.phone}"`,
      `"${u.email}"`,
      `"${u.address.replace(/"/g, '""')}"`,
      u.ordersCount,
      u.totalSpent,
      u.type
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="erp-content-box">
      <div className="panel-header" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.3rem" }}>Users & Customer Registry</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "4px 0 0 0" }}>
              Directory of all registered customers & buyers with contact details
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={fetchUsersAndCustomers}
              className="btn-secondary" 
              style={{ padding: "8px 16px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
            >
              <i className="fa-solid fa-rotate-right"></i> Refresh
            </button>
            <button 
              onClick={exportToCSV}
              className="btn-primary" 
              style={{ padding: "8px 16px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
            >
              <i className="fa-solid fa-file-csv"></i> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "1.5rem" }}>
        <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: "600" }}>Total Registered Users</span>
          <h4 style={{ margin: "4px 0 0 0", fontSize: "1.4rem", color: "#0f172a" }}>
            {usersList.filter(u => (u.phone && u.phone !== 'N/A') || (u.email && u.email !== 'N/A')).length}
          </h4>
        </div>
        <div style={{ background: "#f0fdf4", padding: "14px 18px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#166534", fontWeight: "600" }}>Active Buyers</span>
          <h4 style={{ margin: "4px 0 0 0", fontSize: "1.4rem", color: "#14532d" }}>
            {usersList.filter(u => ((u.phone && u.phone !== 'N/A') || (u.email && u.email !== 'N/A')) && u.ordersCount > 0).length}
          </h4>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: "1rem" }}>
        <input 
          type="text"
          placeholder="Search by Name, Mobile Number, Email or Address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            fontSize: "0.9rem",
            outline: "none"
          }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading users directory...</div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No users found matching your search.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="erp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left", fontSize: "0.8rem", color: "#475569" }}>
                <th style={{ padding: "12px 14px" }}>CUSTOMER NAME</th>
                <th style={{ padding: "12px 14px" }}>MOBILE NUMBER</th>
                <th style={{ padding: "12px 14px" }}>EMAIL ADDRESS</th>
                <th style={{ padding: "12px 14px" }}>ADDRESS</th>
                <th style={{ padding: "12px 14px" }}>ORDERS</th>
                <th style={{ padding: "12px 14px" }}>TOTAL SPENT</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "0.85rem" }}>
                  <td style={{ padding: "12px 14px", fontWeight: "600", color: "#1e293b" }}>
                    {u.name}
                    {u.type === 'Registered' && (
                      <span style={{ marginLeft: "8px", background: "#e0f2fe", color: "#0369a1", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px" }}>
                        Registered
                      </span>
                    )}
                    {(u.isNew || u.ordersCount === 0) && (
                      <span style={{ marginLeft: "6px", background: "#dcfce7", color: "#15803d", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                        ✨ Newly Added
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#334155" }}>{u.phone}</td>
                  <td style={{ padding: "12px 14px", color: "#334155" }}>{u.email}</td>
                  <td style={{ padding: "12px 14px", color: u.address === 'N/A' ? '#94a3b8' : '#475569', maxWidth: "250px" }}>{u.address}</td>
                  <td style={{ padding: "12px 14px", textAlign: "center" }}>
                    <span style={{ background: u.ordersCount === 0 ? "#fef3c7" : "#f1f5f9", color: u.ordersCount === 0 ? "#b45309" : "#1e293b", padding: "3px 8px", borderRadius: "12px", fontWeight: "600" }}>
                      {u.ordersCount}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: "600", color: u.totalSpent === 0 ? '#94a3b8' : '#059669' }}>
                    ₹{u.totalSpent.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
