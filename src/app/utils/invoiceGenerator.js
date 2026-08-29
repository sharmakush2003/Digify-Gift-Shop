import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoicePDF = (order) => {
  const doc = new jsPDF();
  
  // Company Details (Static)
  const companyName = "ORIENT CROCKERIES";
  const addressLine1 = "22, Industrial Area, Patel Nagar";
  const addressLine2 = "Geejgarh Vihar Colony, Bais Godam";
  const addressLine3 = "Jaipur, Rajasthan 302006";
  const phone = "093145 00229";
  const gstin = "PENDING_GSTIN"; // Placeholder until user provides it

  // --- HEADER ---
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 34, 34);
  doc.text(companyName, 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(addressLine1, 14, 30);
  doc.text(addressLine2, 14, 35);
  doc.text(addressLine3, 14, 40);
  doc.text(`Phone: ${phone}`, 14, 45);
  doc.text(`GSTIN: ${gstin}`, 14, 50);

  // --- INVOICE TITLE & META ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 34, 34);
  doc.text("TAX INVOICE", 140, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Order ID: ${order.id || order.orderId || "N/A"}`, 140, 30);
  doc.text(`Date: ${new Date(order.created_at || order.date || Date.now()).toLocaleDateString()}`, 140, 35);
  doc.text(`Status: ${order.status || "N/A"}`, 140, 40);

  // --- CUSTOMER DETAILS ---
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 55, 196, 55);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 65);
  doc.setFont("helvetica", "normal");
  doc.text(order.customerName || order.customer_name || "Guest User", 14, 72);
  doc.text(order.customerPhone || order.customer_phone || "No Phone", 14, 77);
  // Add shipping address if available
  if (order.shippingAddress || order.shipping_address) {
    const addr = order.shippingAddress || order.shipping_address;
    doc.text(addr.substring(0, 50), 14, 82);
    if(addr.length > 50) doc.text(addr.substring(50, 100), 14, 87);
  }

  // --- ITEMS TABLE ---
  const items = order.items || order.cart || [];
  
  const tableColumn = ["Item", "Qty", "Price", "GST", "Total"];
  const tableRows = [];

  let subtotal = 0;

  items.forEach(item => {
    // Handling different cart structures
    const name = item.name || item.title || "Unknown Item";
    const qty = item.quantity || item.qty || 1;
    const price = item.price || 0;
    const gstRate = item.gst_percentage || 18; // Default to 18% if not provided
    
    // Reverse calculating base price and GST
    // Assuming 'price' is GST inclusive for simpler math on this zero-storage version
    const itemTotal = price * qty;
    subtotal += itemTotal;

    const invoiceItemData = [
      name.substring(0, 30) + (name.length > 30 ? "..." : ""),
      qty.toString(),
      `Rs. ${price.toFixed(2)}`,
      `${gstRate}%`,
      `Rs. ${itemTotal.toFixed(2)}`
    ];
    tableRows.push(invoiceItemData);
  });

  autoTable(doc, {
    startY: 95,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [34, 34, 34] },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  const finalY = doc.lastAutoTable.finalY || 95;

  // --- TOTALS ---
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const shipping = order.shippingFee || order.shipping_fee || 0;
  const discount = order.promoDiscount || order.promo_discount || 0;
  const grandTotal = order.totalAmount || order.total || order.total_amount || (subtotal + shipping - discount);

  doc.text(`Subtotal:`, 140, finalY + 10);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, 170, finalY + 10);
  
  if (discount > 0) {
    doc.text(`Discount:`, 140, finalY + 16);
    doc.text(`- Rs. ${discount.toFixed(2)}`, 170, finalY + 16);
  }

  if (shipping > 0) {
    doc.text(`Shipping:`, 140, finalY + 22);
    doc.text(`Rs. ${shipping.toFixed(2)}`, 170, finalY + 22);
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total:`, 140, finalY + 30);
  doc.text(`Rs. ${grandTotal.toFixed(2)}`, 170, finalY + 30);

  // --- FOOTER ---
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for shopping with Orient Crockeries!", 105, 280, null, null, "center");
  doc.text("This is a computer generated invoice and does not require a physical signature.", 105, 285, null, null, "center");

  // Save the PDF
  const filename = `Invoice_Orient_${order.id || order.orderId || "X"}.pdf`;
  doc.save(filename);
};
