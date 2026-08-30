import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const integerPart = Math.floor(num || 0);
  const decimalPart = Math.round(((num || 0) - integerPart) * 100);
  
  function convert(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  let word = 'Rupees ' + (convert(integerPart) || 'Zero');
  if (decimalPart > 0) {
    word += ' and ' + convert(decimalPart) + ' Paise';
  }
  return word + ' Only';
}

export const generateInvoicePDF = (order) => {
  if (!order) return;
  const doc = new jsPDF();
  
  // Brand Header Accent Bar
  doc.setFillColor(30, 58, 138); // Deep Navy #1e3a8a
  doc.rect(0, 0, 210, 5, "F");

  // --- TOP SUB-BANNER ---
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Computer-generated Tax Invoice • Orient Crockery Official Receipt", 14, 12);
  doc.text("Page 1 of 1", 196, 12, { align: "right" });

  // --- BRAND & INVOICE TITLE HEADER ---
  // Left: Orient Crockery Brand Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text("ORIENT CROCKERIES", 14, 22);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Premium Crockery, Glassware & Kitchenware", 14, 27);

  // Right: Document Badge
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("TAX INVOICE", 196, 22, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // Emerald badge
  doc.text("Original for Recipient", 196, 27, { align: "right" });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 31, 196, 31);

  // --- STORE DETAILS & INVOICE META GRID ---
  // Left Column: Store Details
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("ORIENT CROCKERIES", 14, 38);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("22, Industrial Area, Patel Nagar, Geejgarh Vihar Colony", 14, 43);
  doc.text("Bais Godam, Jaipur, Rajasthan – 302006", 14, 47);
  doc.text("GSTIN: 08AAAAA0000A1Z5  |  PAN: AAAAA0000A", 14, 51);
  doc.text("Phone: +91-93145 00229  |  Email: sales@orientcrockery.in", 14, 55);

  // Right Box: Meta Box (Invoice No, Date, Payment Mode)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(125, 34, 71, 24, 2, 2, "FD");

  const orderNum = order.order_number || order.id || order.orderId || "INV/26-27/00101";
  const orderDate = new Date(order.created_at || order.date || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Invoice No.:", 129, 40);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(String(orderNum), 160, 40);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Invoice Date:", 129, 45);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(String(orderDate), 160, 45);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Place of Supply:", 129, 50);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text("Rajasthan (08)", 160, 50);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Payment Mode:", 129, 55);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(String(order.payment_mode || order.paymentMode || "UPI Online"), 160, 55);

  // --- BILLED TO & SALES COUNTER GRID ---
  doc.line(14, 61, 196, 61);

  // Box 1: Billed To (Left)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text("BILLED TO", 14, 67);

  const custName = order.customerName || order.customer_name || (order.guest_email ? order.guest_email.split('@')[0] : "Retail Customer");
  const custPhone = order.customerPhone || order.guest_phone || "N/A";
  const rawAddr = order.shippingAddress || (typeof order.shipping_address === 'string' ? order.shipping_address : (order.shipping_address?.raw_text || "Jaipur, Rajasthan"));

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(String(custName), 14, 72);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Mobile: ${custPhone}`, 14, 76);
  doc.text(`GSTIN: Unregistered (Consumer)`, 14, 80);
  
  // Multiline address wrapping
  const splitAddr = doc.splitTextToSize(`Address: ${rawAddr}`, 90);
  doc.text(splitAddr, 14, 84);

  // Box 2: Store / Salesperson (Right)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text("STORE & SALES INFO", 125, 67);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Orient Crockery – Main Store", 125, 72);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Salesperson: Online Store Counter 01", 125, 76);
  doc.text("Customer Type: Retail Consumer", 125, 80);
  doc.text("Channel: Orient Web Store", 125, 84);

  // --- ITEMS TABLE ---
  const items = order.items && order.items.length > 0 ? order.items : (order.cart || [
    { name: "Orient Premium Crockery Item", qty: 1, price: order.total || order.final_total || 1000 }
  ]);

  const tableColumn = ["S.No.", "Item / Description", "HSN", "Qty", "Unit", "MRP (Rs.)", "Rate (Rs.)", "Disc. (Rs.)", "Taxable (Rs.)"];
  const tableRows = [];

  let totalMRP = 0;
  let totalTaxable = 0;

  items.forEach((item, index) => {
    const name = item.name || item.title || item.product_name || "Crockery Item";
    const qty = item.qty || item.quantity || 1;
    const price = item.price || item.mrp || 0;
    const mrp = Math.round(price * 1.15);
    const disc = (mrp - price) * qty;
    const taxable = price * qty;

    totalMRP += mrp * qty;
    totalTaxable += taxable;

    tableRows.push([
      (index + 1).toString(),
      name.substring(0, 35) + (name.length > 35 ? "..." : ""),
      "6912",
      qty.toString(),
      "Nos",
      mrp.toFixed(2),
      price.toFixed(2),
      disc > 0 ? disc.toFixed(2) : "–",
      taxable.toFixed(2)
    ]);
  });

  autoTable(doc, {
    startY: 93,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [30, 58, 138], 
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 55 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'right', cellWidth: 22 }
    },
    styles: { 
      fontSize: 8, 
      cellPadding: 3, 
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240]
    }
  });

  const finalY = doc.lastAutoTable.finalY || 130;

  // --- GST & TOTALS SUMMARY (SIDE-BY-SIDE) ---
  const grandTotal = Number(order.total || order.final_total || order.subtotal || totalTaxable) || 0;
  const gstTotal = Math.round(totalTaxable * 0.18);
  const cgst = Math.round(gstTotal / 2);
  const sgst = Math.round(gstTotal / 2);
  const shipping = Number(order.shipping || order.shipping_charge || 0);

  // Left Side: GST Breakdown Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, finalY + 5, 90, 28, 1, 1, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text("GST BREAKDOWN (18% GST Included)", 18, finalY + 11);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Taxable Value:  Rs. ${(totalTaxable - gstTotal).toFixed(2)}`, 18, finalY + 16);
  doc.text(`CGST @ 9%:        Rs. ${cgst.toFixed(2)}`, 18, finalY + 21);
  doc.text(`SGST @ 9%:        Rs. ${sgst.toFixed(2)}`, 18, finalY + 26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Tax:          Rs. ${gstTotal.toFixed(2)}`, 62, finalY + 26);

  // Right Side: Amount Summary Box
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  
  doc.text("Gross Taxable Value:", 125, finalY + 10);
  doc.text(`Rs. ${(totalTaxable - gstTotal).toFixed(2)}`, 196, finalY + 10, { align: "right" });

  doc.text("Total Tax (GST 18%):", 125, finalY + 15);
  doc.text(`Rs. ${gstTotal.toFixed(2)}`, 196, finalY + 15, { align: "right" });

  if (shipping > 0) {
    doc.text("Shipping Charge:", 125, finalY + 20);
    doc.text(`Rs. ${shipping.toFixed(2)}`, 196, finalY + 20, { align: "right" });
  }

  // Grand Total Highlight Bar
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(122, finalY + 24, 74, 9, 1, 1, "F");

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Grand Total:", 126, finalY + 30);
  doc.text(`Rs. ${grandTotal.toFixed(2)}`, 192, finalY + 30, { align: "right" });

  // --- AMOUNT IN WORDS ---
  const amountInWordsStr = numberToWords(grandTotal);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text("Amount in Words:", 14, finalY + 39);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(amountInWordsStr, 44, finalY + 39);

  // --- TERMS & CONDITIONS & SIGNATURE GRID ---
  doc.setDrawColor(226, 232, 240);
  doc.line(14, finalY + 43, 196, finalY + 43);

  // Left Column: Terms
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text("Terms & Conditions:", 14, finalY + 48);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("1. Goods once sold are subject to store return/exchange policy.", 14, 268);
  doc.text("2. Please check crockery items carefully before leaving store.", 14, 272);
  doc.text("3. Warranty, wherever applicable, is as per manufacturer terms.", 14, 276);
  doc.text("4. This is a computer-generated tax invoice.", 14, 280);

  // Right Column: Authorised Signatory Box
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("For ORIENT CROCKERIES", 196, 268, { align: "right" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Authorised Signatory", 196, 280, { align: "right" });

  // --- FOOTER POWERED BY BAR ---
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 285, 210, 12, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Powered by Orient Crockeries • Premium Tableware & Kitchenware", 105, 291, { align: "center" });

  // Save the PDF
  const filename = `Invoice_Orient_${order.id || order.order_number || "X"}.pdf`;
  doc.save(filename);
};
