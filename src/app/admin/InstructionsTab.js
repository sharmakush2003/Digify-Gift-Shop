'use client';
import React from 'react';

export default function InstructionsTab() {
  return (
    <div className="erp-content-box" style={{ padding: '30px' }}>
      <div className="panel-header" style={{ marginBottom: '20px' }}>
        <h3>Documentation & System Instructions</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Learn how to manage inventory, orders, coupons, and revenue tracking.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
       
        {/* Orders & Revenue */}
        <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
          <h4 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--primary)' }}>
            <i className="fa-solid fa-dolly" style={{ marginRight: '8px' }}></i>
            Orders Queue & Revenue
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            The <strong>Orders Queue</strong> is where you manage incoming customer purchases.
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
            <li><strong>Pending Orders:</strong> New orders appear here. Click "Pack SKU" when the item is packed in the warehouse.</li>
            <li><strong>Packed Orders:</strong> Ready for dispatch. Click "Ship to Delivery Man" to hand it over to the delivery executive. This auto-generates a secure 6-digit Delivery OTP.</li>
            <li><strong>Shipped Orders:</strong> Currently with the delivery rider. The rider uses the Delivery App to enter the OTP and mark it as Delivered.</li>
            <li><strong>Consolidated Revenue:</strong> The top dashboard cards show total cash volume cleared and active deliveries. These automatically update based on "SUCCESS" payments and "Delivered" statuses.</li>
          </ul>
        </div>

        {/* Coupons & Promos */}
        <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
          <h4 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--primary)' }}>
            <i className="fa-solid fa-ticket" style={{ marginRight: '8px' }}></i>
            Coupons & Promos
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Create and manage promotional discounts for marketing campaigns.
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
            <li><strong>Add Coupon:</strong> Open the Coupons tab, enter a unique code (e.g. WELCOME50), set the discount type (Flat or Percentage), and save.</li>
            <li><strong>Edit limits:</strong> You can set a <em>Usage Limit</em> (how many total times it can be used) and <em>Min Order Value</em>.</li>
            <li><strong>Status:</strong> Use the Active/Inactive toggle switch to instantly turn a promotion on or off without deleting it.</li>
          </ul>
        </div>

        {/* Bulk Upload Instructions */}
        <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
          <h4 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--primary)' }}>
            <i className="fa-solid fa-file-csv" style={{ marginRight: '8px' }}></i>
            Bulk Upload via CSV
          </h4>
          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
            <li>Open the <strong>Inventory Registry</strong> tab.</li>
            <li>Click <strong>Bulk Import</strong>. Download the CSV Template from Step 1.</li>
            <li>Fill the CSV carefully. Leave non-applicable fields blank.</li>
            <li>In Step 1 of the popup, <strong>upload all images</strong>. Ensure image names match SKUs (e.g., `201_1.webp`).</li>
            <li>In Step 2, upload the <strong>CSV file</strong>.</li>
            <li>Click <strong>Start Bulk Import</strong>. The system will auto-match images to products based on SKUs.</li>
          </ol>
        </div>

        {/* Single Product Instructions */}
        <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
          <h4 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--primary)' }}>
            <i className="fa-solid fa-plus-circle" style={{ marginRight: '8px' }}></i>
            Manage Single Products
          </h4>
          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
            <li><strong>Add Product:</strong> Click <strong>Single Add</strong> in the Inventory tab. Fill Name, Price, Stock. Upload images and click Save.</li>
            <li><strong>Edit Product:</strong> Click <strong>Edit Product</strong> next to any item in the inventory list. You can update stock levels, prices, or add new images.</li>
            <li><strong>Delete Product:</strong> Use the Delete (trash) icon next to the edit button to permanently remove an item from the catalog. <em>Note: This action cannot be undone.</em></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
