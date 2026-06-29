'use client';

import './whatsapp.css';
import { useEffect, useRef } from 'react';
import { getOrders } from '../db';
import Link from 'next/link';

export default function WhatsappPage() {
  const prevOrdersRef = useRef([]);

  const initWhatsAppSim = () => {
    const chatArea = document.getElementById('sim-chat-area');
    const inputEl = document.getElementById('sim-input');
    const sendBtn = document.getElementById('sim-send-btn');
    const timeEl = document.getElementById('mock-time');
    const clearBtn = document.getElementById('clear-chats-btn');

    // Set mock time on phone status bar
    if (timeEl) {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false });
    }

    if (!chatArea || !inputEl || !sendBtn) return;

    // Append WhatsApp Chat Message bubble
    const appendMsg = (sender, text, hasPdf = false, pdfName = "", pdfSize = "", orderId = "") => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `msg ${sender}`;

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

      let pdfHtml = "";
      if (hasPdf) {
        pdfHtml = `
          <div class="pdf-doc-attachment" id="pdf-doc-${orderId}" title="Download GST Invoice PDF" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.06); border-radius: 8px; padding: 10px; margin-top: 8px; cursor: pointer; border: 1px solid var(--glass-border);">
            <div class="doc-info" style="display: flex; align-items: center; gap: 10px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4a4a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <div class="doc-name">
                <h5 style="margin: 0; font-size: 0.85rem; color: white;">${pdfName}</h5>
                <span style="font-size: 0.7rem; color: var(--text-muted);">${pdfSize} • PDF Document</span>
              </div>
            </div>
            <div class="doc-download-btn" style="color: var(--primary); display: flex; align-items: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="8 12 12 16 16 12"></polyline>
                <line x1="12" y1="8" x2="12" y2="16"></line>
              </svg>
            </div>
          </div>
        `;
      }

      msgDiv.innerHTML = `
        <div class="msg-content">${text.replace(/\n/g, '<br>')}</div>
        ${pdfHtml}
        <div style="text-align:right; font-size:0.6rem; color:rgba(255,255,255,0.4); margin-top:4px; display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
          ${timeStr} 
          ${sender === 'sent' ? `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00aaff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;">
              <polyline points="17 6 9 17 4 12"></polyline>
              <polyline points="22 6 14 17 9 12"></polyline>
            </svg>
          ` : ''}
        </div>
      `;

      chatArea.appendChild(msgDiv);
      chatArea.scrollTop = chatArea.scrollHeight;

      // PDF attachment click simulation
      if (hasPdf) {
        document.getElementById(`pdf-doc-${orderId}`)?.addEventListener('click', () => {
          alert(`Simulating Invoice download for ${pdfName}.\nOpening print format...`);
          let erpWin = window.open(`/admin`, '_blank');
          setTimeout(() => {
            if (erpWin && !erpWin.closed) {
              alert("Admin Dashboard opened. Go to 'Orders Queue' and click 'Invoice' to view and print the TAX receipt.");
            }
          }, 1500);
        });
      }

      return msgDiv;
    };

    const highlightGuide = (id) => {
      document.querySelectorAll('.trigger-guide-list li').forEach(li => li.classList.remove('highlight'));
      document.getElementById(id)?.classList.add('highlight');
    };

    // Load initial orders
    const initialOrders = getOrders();
    prevOrdersRef.current = initialOrders;

    // Local change listener loop running every 1.5 seconds
    const intervalId = setInterval(() => {
      const currentOrders = getOrders();
      const prevOrders = prevOrdersRef.current;

      currentOrders.forEach((o) => {
        const prevMatch = prevOrders.find((po) => po.id === o.id);

        if (!prevMatch) {
          // A brand new order was checked out!
          const itemsList = o.items.map(item => `• ${item.name} (x${item.quantity}) [${item.department || item.category || 'Gifts'}]`).join('\n');
          const text = `*Order Confirmed!* 🎉
          
Namaste *${o.customerName}*, we have received your order *${o.id}*.

🛍️ *Order Items:*
${itemsList}

💰 *Subtotal:* ₹${o.subtotal.toLocaleString('en-IN')}
🧾 *GST Charges:* ₹${o.gstAmount.toLocaleString('en-IN')}
⭐ *Total Amount:* ₹${o.total.toLocaleString('en-IN')}
💳 *Payment Mode:* Card / UPI (Paid)

We have registered your details in our ERP database under State GST codes. We are currently bubble-wrapping your fragile treasures! 📦`;
          
          appendMsg('received', text);
          highlightGuide('guide-checkout');
        } 
        else if (prevMatch.status !== o.status) {
          // Status has been updated in ERP dashboard!
          let msg = "";
          let hasPdf = false;
          let pdfName = "";
          let pdfSize = "";

          if (o.status === "Packed") {
            msg = `Hi *${o.customerName}*! 📦
            
Your order *${o.id}* has been successfully packed by our warehouse team. 

Our logistics checklist verified all items, attached fragile protection labels, and scanned barcodes into the master registry database. Ready for dispatch! 🚚`;
          } 
          else if (o.status === "Shipped") {
            msg = `Good news! 🚚 Your order *${o.id}* has been dispatched.
            
*Courier Partner:* BlueDart Express
*Tracking Airway Bill:* AWB-BD-${o.id.substring(4)}
*Tracking URL:* http://localhost:3000/tracking?orderId=${o.id}

Download your official TAX invoice PDF details attached below. 🧾`;
            hasPdf = true;
            pdfName = `TAX_INVOICE_${o.id}.pdf`;
            pdfSize = `${(120 + Math.random()*40).toFixed(1)} KB`;
          } 
          else if (o.status === "Delivered") {
            msg = `Delivered! 🎉
            
Hi *${o.customerName}*, our logistics team confirmed package *${o.id}* has been successfully delivered to your address:
📍 _${o.shippingAddress}_

Thank you for shopping with *Orient Crockeries*. Please let us know if you would like to order again! 🌸`;
          }

          if (msg) {
            appendMsg('received', msg, hasPdf, pdfName, pdfSize, o.id);
            highlightGuide('guide-erp');
          }
        }
      });

      prevOrdersRef.current = currentOrders;
    }, 1500);

    // 3. Abandoned Cart Nudge Simulator
    const checkAbandonedCart = () => {
      const hasEntered = sessionStorage.getItem('orient_checkout_entered');
      const abandonedCart = sessionStorage.getItem('orient_cart');
      
      if (hasEntered === 'true' && abandonedCart) {
        setTimeout(() => {
          const currentCart = sessionStorage.getItem('orient_cart');
          if (currentCart && JSON.parse(currentCart).length > 0) {
            const cartData = JSON.parse(currentCart);
            const firstItem = cartData[0]?.name || "premium dinnerware";
            
            const text = `Hi! 🛒 We noticed you left some premium items in your shopping cart, including *${firstItem}*.
            
Don't miss out! Complete checkout today and get free delivery on Jaipur orders.

Click here to resume your checkout instantly:
👉 [Resume Checkout - Orient Crockeries](http://localhost:3000/cart)`;
            
            appendMsg('received', text);
            highlightGuide('guide-abandoned');
            
            sessionStorage.removeItem('orient_checkout_entered');
          }
        }, 15000);
      }
    };
    checkAbandonedCart();

    // Reset Chat button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        chatArea.innerHTML = `
          <div class="date-header">TODAY</div>
          <div class="info-nudge">
            🔒 Messages are end-to-end encrypted. No one outside this chat can read them.
          </div>
          <div class="msg received">
            Namaste! Thank you for contacting *Orient Crockeries*. 🙏
            
            We are here to assist you. You will receive updates about your order invoices, packaging checklist validations, and courier tracking details directly in this thread. 🌸
          </div>
        `;
        document.querySelectorAll('.trigger-guide-list li').forEach(li => li.classList.remove('highlight'));
      });
    }

    // WhatsApp Auto AI Response simulator
    const handleAutoReply = (text) => {
      const normText = text.toLowerCase().trim();
      let reply = "";

      if (normText.includes("track") || normText.includes("order")) {
        const orders = getOrders();
        const match = normText.match(/ord-\d{6}/);
        if (match) {
          const orderId = match[0].toUpperCase();
          const o = orders.find(ord => ord.id === orderId);
          if (o) {
            reply = `🔍 *WhatsApp ERP Search:*
            
*Order ID:* ${o.id}
*Amount:* ₹${o.total.toFixed(2)}
*Status:* ${o.status}
*Courier Status:* ${o.courierStatus} (BlueDart)

Our central database shows your shipment is *${o.courierStatus}*. 🚚`;
          } else {
            reply = `I couldn't find order *${orderId}* in our database. Can you please verify the number?`;
          }
        } else {
          reply = `To track your shipment, please type your Order ID (e.g. *"Track ORD-123456"*).`;
        }
      }
      else if (normText.includes("pricing") || normText.includes("price") || normText.includes("ceramic") || normText.includes("casserole")) {
        reply = `You can browse pricing and stock levels directly on our storefront:
        👉 [Browse Crockery & Cookware - Store](http://localhost:3000/catalog)
        
        Our ceramic plates and sustainably sourced Acacia casseroles are currently in stock.`;
      }
      else {
        reply = `Thank you for messaging. This simulated WhatsApp Business API channel automates customer support:
        👉 Type: *"Track order ORD-XXXXXX"*
        👉 Check out in the store to trigger order alerts.`;
      }

      setTimeout(() => {
        appendMsg('received', reply);
      }, 1200);
    };

    // Send message triggers
    const submitSimChat = () => {
      const text = inputEl.value.trim();
      if (!text) return;

      appendMsg('sent', text);
      inputEl.value = '';
      handleAutoReply(text);
    };

    sendBtn.addEventListener('click', submitSimChat);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitSimChat();
    });

    return () => {
      clearInterval(intervalId);
    };
  };

  useEffect(() => {
    document.body.classList.remove('preload');
    initWhatsAppSim();
  }, []);

  return (
    <>
      {/* Nav Bar */}
      <nav className="whatsapp-nav">
        <div className="logo">ORIENT <span className="badge">WHATSAPP SIM</span></div>
        <ul className="nav-links" id="whatsapp-nav-links">
          <li><Link href="/" style={{"display":"flex","alignItems":"center","gap":"4px"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>Back to Store</Link></li>
          <li><Link href="/admin" style={{"display":"flex","alignItems":"center","gap":"4px"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>Admin Dashboard</Link></li>
        </ul>
        <div className="nav-icons">
          <div className="sim-badge"><span className="pulse"></span> Simulation Engine Online</div>
        </div>
      </nav>

      {/* Split Screen Grid */}
      <main className="whatsapp-main">
        <div className="section-container">
          <div className="whatsapp-layout-grid">
            
            {/* Info Column */}
            <div className="sim-info-panel">
              <div className="section-tag">Sales &amp; Support Channel</div>
              <h2>WhatsApp Commerce API Simulation</h2>
              <p>This smartphone mock represents a customer&apos;s WhatsApp app. It listens to operations performed on the <b>Storefront Checkout</b> and the <b>ERP Dashboard</b> to demonstrate automated notification pipelines.</p>
              
              <div className="trigger-logs-card">
                <h3>Event Logs &amp; Trigger Guide</h3>
                <ul className="trigger-guide-list">
                  <li id="guide-checkout">
                    <span className="guide-num">1</span>
                    <div>
                      <h4>Checkout Confirmed (Automatic Trigger)</h4>
                      <p>Place an order on the storefront. A WhatsApp order greeting and invoice summary will push here instantly.</p>
                    </div>
                  </li>
                  <li id="guide-abandoned">
                    <span className="guide-num">2</span>
                    <div>
                      <h4>Abandoned Cart Nudge (Automatic Trigger)</h4>
                      <p>Click &quot;Proceed to Checkout&quot; in the store cart, fill fields, but close/close-out. In 15 seconds, a nudge message with a coupon code pings here.</p>
                    </div>
                  </li>
                  <li id="guide-erp">
                    <span className="guide-num">3</span>
                    <div>
                      <h4>ERP Dispatch Pipeline (Admin Trigger)</h4>
                      <p>Go to the ERP Orders Queue. Mark your order as <b>Packed</b>, <b>Shipped</b>, or <b>Delivered</b>. Updates flow here in real-time.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="test-controls" style={{"marginTop":"2rem"}}>
                <button className="btn btn-outline" id="clear-chats-btn" style={{"width":"100%","justifyContent":"center","display":"flex","gap":"8px","alignItems":"center"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  Reset Chat History
                </button>
              </div>
            </div>

            {/* Phone Sandbox Mock */}
            <div className="phone-simulation-side">
              <div className="sim-smartphone">
                <div className="phone-notch">
                  <div className="speaker"></div>
                  <div className="camera"></div>
                </div>
                <div className="phone-status-bar">
                  <span className="time" id="mock-time">12:00</span>
                  <div className="icons" style={{"display":"flex","alignItems":"center","gap":"4px"}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                      <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                      <line x1="12" y1="20" x2="12.01" y2="20"></line>
                    </svg>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="2" y1="20" x2="2" y2="20"></line>
                      <line x1="6" y1="20" x2="6" y2="16"></line>
                      <line x1="10" y1="20" x2="10" y2="12"></line>
                      <line x1="14" y1="20" x2="14" y2="8"></line>
                      <line x1="18" y1="20" x2="18" y2="4"></line>
                    </svg>
                    <svg width="14" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
                      <line x1="22" y1="11" x2="22" y2="13"></line>
                      <line x1="6" y1="7" x2="6" y2="17"></line>
                    </svg>
                  </div>
                </div>
                <div className="whatsapp-frame-inner">
                  <div className="chat-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{"cursor":"pointer","color":"#fff"}}>
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    <div className="avatar" style={{"display":"flex","alignItems":"center","justifyContent":"center","background":"rgba(255,255,255,0.1)","color":"var(--primary)"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 12 20 22 4 22 4 12"></polyline>
                        <rect x="2" y="7" width="20" height="5"></rect>
                        <line x1="12" y1="22" x2="12" y2="7"></line>
                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                      </svg>
                    </div>
                    <div className="contact-info">
                      <h4 style={{"display":"flex","alignItems":"center","gap":"4px"}}>
                        Orient Alerts 
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </h4>
                      <span>Official Business Account</span>
                    </div>
                    <div className="header-actions" style={{"display":"flex","alignItems":"center","gap":"12px","color":"#fff"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                      </svg>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                      </svg>
                    </div>
                  </div>
                  <div className="chat-messages" id="sim-chat-area">
                    <div className="date-header">TODAY</div>
                    <div className="info-nudge">
                      🔒 Messages are end-to-end encrypted. No one outside this chat can read them.
                    </div>
                    <div className="msg received">
                      Namaste! Thank you for contacting *Orient Crockeries*. 🙏
                      
                      We are here to assist you. You will receive updates about your order invoices, packaging checklist validations, and courier tracking details directly in this thread. 🌸
                    </div>
                  </div>
                  <div className="input-panel" style={{"display":"flex","alignItems":"center","gap":"8px"}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{"color":"rgba(255,255,255,0.4)","cursor":"pointer"}}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                      <line x1="9" y1="9" x2="9.01" y2="9"></line>
                      <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{"color":"rgba(255,255,255,0.4)","cursor":"pointer"}}>
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                    <input type="text" id="sim-input" placeholder="Type a message..." autoComplete="off" />
                    <button id="sim-send-btn" style={{"display":"flex","alignItems":"center","justifyContent":"center"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
