'use client';

import './proposal.css';
import { useEffect } from 'react';

export default function ProposalPage() {
  useEffect(() => {
    document.body.classList.remove('preload');
    // JavaScript for Digisoft Proposal Landing Page

document.addEventListener('DOMContentLoaded', () => {
  initChatBot();
  initJourneyStepper();
  initChecklistTabs();
  initTimelineTabs();
});

// 1. WhatsApp & AI Bot Simulator Logic
const initChatBot = () => {
  const chatArea = document.getElementById('chat-area');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-chat-btn');
  const promptChips = document.querySelectorAll('.chip-btn');

  if (!chatArea || !chatInput || !sendBtn) return;

  // Bot response database matching use cases
  const botReplies = {
    "suggest a dinner set for 6 people under ₹5,000": 
      `Sure! I recommend our *Royal Gold Bone China Dinner Set (24-piece)*. 
      
      💰 *Price:* ₹4,599 (Originally ₹5,499)
      📦 *Contents:* 6 Dinner Plates, 6 Side Plates, 6 Veg Bowls, and 6 Soup Spoons.
      ✨ *Features:* Luxury gold border finish, lightweight, and durable.
      
      Would you like me to send a direct WhatsApp check-out link for this? 🛒`,

    "show gift ideas for housewarming": 
      `Here are our top 3 premium housewarming gifts:
      
      1. *Artisan Ceramic Teapot Set* (₹1,850) - Classic design with 4 matching cups.
      2. *Crystal Scented Candle Combo* (₹1,200) - Luxury Lavender & Amber jars.
      3. *Premium Glassware Set* (₹2,499) - 6 crystal wine glasses.
      
      I can customize any of these with a gold-embossed greeting tag! 🎁`,

    "do you have microwave-safe bowls?": 
      `Yes, absolutely! 🥣
      
      All our *Artisan Ceramic Bowls* and *Bone China Plates* are certified 100% microwave and dishwasher safe. 
      
      In our central ERP system, these are tag-marked as "Microwave-Safe" so you can buy with confidence!`,

    "can i order bulk return gifts for a wedding?": 
      `Congratulations! 🌸 Yes, we specialize in bulk orders for weddings and corporate events.
      
      We offer:
      ✅ Customized gift hampers (combos)
      ✅ Custom logo or name engraving
      ✅ Special volume discounts (up to 35% off)
      ✅ Fragile packaging tag protection
      
      I have recorded your request as a priority lead. Would you like me to arrange a callback from our bulk sales manager? 📞`,

    "क्या यह हिंदी में बात कर सकता है?": 
      `जी हाँ! मैं आपसे हिंदी में भी बात कर सकता हूँ। 🌸 
      
      मैं आपकी सहायता डिनर सेट, कस्टमाइज्ड गिफ्ट्स और बल्क आर्डर्स ढूँढने में कर सकता हूँ। 
      
      क्या आप आज कोई खास उपहार देखना पसंद करेंगे?`
  };

  // Append a message to the chat container
  const appendMessage = (sender, text) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${sender}`;
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    return msgDiv;
  };

  // Bot response simulation with typing delay
  const handleBotResponse = (userText) => {
    // Show typing indicator
    const typingIndicator = appendMessage('typing', 'Digisoft AI is typing...');
    
    // Find matching answer or return default
    const normalizedText = userText.toLowerCase().trim().replace(/[?.,]/g, '');
    let reply = "I didn't quite catch that. You can test one of the prompt chips on the left, or ask me about 'dinner sets', 'microwave safe', or 'bulk orders'! 😊";
    
    // Check match
    for (const key in botReplies) {
      if (normalizedText.includes(key.toLowerCase().trim().replace(/[?.,]/g, '')) || key.toLowerCase().includes(normalizedText)) {
        reply = botReplies[key];
        break;
      }
    }

    setTimeout(() => {
      // Remove typing indicator
      typingIndicator.remove();
      // Add bot reply
      appendMessage('bot', reply);
    }, 1200);
  };

  // Submit user chat message
  const submitMessage = () => {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';
    handleBotResponse(text);
  };

  // Event Listeners
  sendBtn.addEventListener('click', submitMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      submitMessage();
    }
  });

  // Prompt chips click listener
  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      appendMessage('user', query);
      handleBotResponse(query);
    });
  });
};

// 2. Journey Stepper Logic
const initJourneyStepper = () => {
  const steps = document.querySelectorAll('.journey-step');
  const detailsBox = document.getElementById('journey-details');
  if (steps.length === 0 || !detailsBox) return;

  const stepDetails = {
    "1": "<b>Step 1 - Discovery:</b> Customer lands on your e-commerce storefront looking for crockery or clicks a targeted Instagram/Facebook ad that triggers a Click-to-WhatsApp session.",
    "2": "<b>Step 2 - AI Nudge:</b> The AI bot starts an instant conversational sequence on WhatsApp, helping the user filter products by size, price, or occasion, qualifications, and answers FAQs instantly.",
    "3": "<b>Step 3 - Checkout:</b> The customer adds a 24-piece dinner set to their shopping cart and completes the payment directly inside WhatsApp using integrated payment links or selects Cash on Delivery (COD).",
    "4": "<b>Step 4 - ERP Log:</b> The order is instantly piped into your warehouse ERP database. Stock levels adjust in real-time on the website to prevent over-selling, and a GST-compliant invoice is raised.",
    "5": "<b>Step 5 - Delivery & Dispatch:</b> The courier integration schedules a pickup, prints the fragile-tagged shipping labels, and the system automatically sends the tracking link and PDF invoice directly to the customer's WhatsApp chat."
  };

  steps.forEach(step => {
    step.addEventListener('click', () => {
      // Remove active from all
      steps.forEach(s => s.classList.remove('active'));
      // Add active to current
      step.classList.add('active');
      
      const stepNum = step.getAttribute('data-step');
      detailsBox.innerHTML = stepDetails[stepNum] || "";
    });
  });
};

// 3. Checklist Tabs Toggle
const initChecklistTabs = () => {
  const tabErp = document.getElementById('tab-erp-btn');
  const tabBot = document.getElementById('tab-bot-btn');
  const contentErp = document.getElementById('content-erp');
  const contentBot = document.getElementById('content-bot');

  if (!tabErp || !tabBot || !contentErp || !contentBot) return;

  tabErp.addEventListener('click', () => {
    tabErp.classList.add('active');
    tabBot.classList.remove('active');
    contentErp.classList.add('active');
    contentBot.classList.remove('active');
  });

  tabBot.addEventListener('click', () => {
    tabBot.classList.add('active');
    tabErp.classList.remove('active');
    contentBot.classList.add('active');
    contentErp.classList.remove('active');
  });
};

// 4. Timeline Phase Tabs Toggle
const initTimelineTabs = () => {
  const tabs = document.querySelectorAll('.phase-tab-btn');
  const contents = document.querySelectorAll('.phase-content');
  if (tabs.length === 0 || contents.length === 0) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // Remove active from all content panels
      contents.forEach(c => c.classList.remove('active'));

      // Add active to selected tab
      tab.classList.add('active');
      // Show corresponding content
      const phaseNum = tab.getAttribute('data-phase');
      const targetContent = document.getElementById(`phase-${phaseNum}-content`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
};

// Mobile Hamburger Toggle logic
const menuToggle = document.getElementById('proposal-menu-toggle');
const navMenu = document.getElementById('proposal-nav-links');
if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    if (navMenu.classList.contains('active')) {
      navMenu.classList.remove('active');
      menuToggle.classList.remove('open');
    }
  });
}

window.addEventListener('load', () => {
  document.body.classList.remove('preload');
});

  }, []);

  return (
    <>
      
  {/* Nav Bar */}
  <nav className="proposal-nav">
    <div className="logo">DIGISOFT <span className="badge">PROPOSAL</span></div>
    <ul className="nav-links" id="proposal-nav-links">
      <li><a href="/" style={{"display":"flex","alignItems":"center","gap":"4px"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>Storefront</a></li>
      <li><a href="/whatsapp" style={{"display":"flex","alignItems":"center","gap":"4px"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>WhatsApp Sim</a></li>
      <li><a href="/admin" style={{"display":"flex","alignItems":"center","gap":"4px"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>Admin ERP</a></li>
    </ul>
    <div className="nav-icons">
      <div className="sim-badge" style={{"background":"rgba(197, 160, 89, 0.1)","color":"var(--primary)","padding":"6px 14px","borderRadius":"50px","fontSize":"0.8rem","fontWeight":"600","border":"1px solid rgba(197, 160, 89, 0.25)"}}>
        Interactive Document
      </div>
      <div id="proposal-menu-toggle" className="proposal-menu-toggle" style={{"cursor":"pointer","display":"none","marginLeft":"15px"}}>
        <svg className="icon-bars" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <svg className="icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{"display":"none"}}>
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    </div>
  </nav>

  {/* Hero Section */}
  <section className="proposal-section proposal-hero">
    <div className="hero-container">
      <div className="hero-pill">
        <i className="fa-solid fa-gift"></i> Digify Soft Solutions Partnership Proposal
      </div>
      <h1>Premium Gift Shop E-Commerce & WhatsApp AI Bot</h1>
      <p className="subtitle">A complete digital solution that transforms customer experience, automates warehouse and dispatch checklists, and handles conversational sales directly on WhatsApp.</p>
      
      <div className="proposal-benefits-summary">
        <div className="summary-card">
          <i className="fa-solid fa-mobile-screen-button"></i>
          <h3>WhatsApp Commerce</h3>
          <p>Browse catalog, manage shopping carts, and place orders natively within WhatsApp.</p>
        </div>
        <div className="summary-card">
          <i className="fa-solid fa-robot"></i>
          <h3>Multilingual AI Agent</h3>
          <p>Instant answers to queries, bulk inquiry qualifiers, and smart customer handover in English & Hindi.</p>
        </div>
        <div className="summary-card">
          <i className="fa-solid fa-boxes-stacked"></i>
          <h3>Real-time ERP Sync</h3>
          <p>Keep inventory numbers, product pricing, and fragile packaging checklists in complete sync.</p>
        </div>
      </div>
    </div>
  </section>

  {/* Stepper Journey Visualizer */}
  <section className="proposal-section" style={{"background":"rgba(255,255,255,0.01)","borderTop":"1px solid var(--glass-border)","borderBottom":"1px solid var(--glass-border)"}}>
    <div className="section-container">
      <span className="section-tag">User Experience Flow</span>
      <h2 style={{"fontSize":"2.5rem","marginBottom":"1.5rem","fontWeight":"700"}}>End-to-End Customer Journey</h2>
      <p style={{"color":"var(--text-muted)","marginBottom":"3rem","maxWidth":"800px"}}>Click on any step below to see how customer orders, WhatsApp notifications, and warehouse ERP interact in real-time.</p>

      <div className="journey-visualizer-container">
        <div className="journey-flow">
          <div className="journey-step active" data-step="1">
            <div className="step-num">1</div>
            <h4>Discovery</h4>
            <p>Storefront Visit / Ads</p>
          </div>
          <div className="journey-step" data-step="2">
            <div className="step-num">2</div>
            <h4>AI Nudge</h4>
            <p>WhatsApp Help</p>
          </div>
          <div className="journey-step" data-step="3">
            <div className="step-num">3</div>
            <h4>Checkout</h4>
            <p>Direct Cart Order</p>
          </div>
          <div className="journey-step" data-step="4">
            <div className="step-num">4</div>
            <h4>ERP Log</h4>
            <p>Stock & Invoice Sync</p>
          </div>
          <div className="journey-step" data-step="5">
            <div className="step-num">5</div>
            <h4>Delivery</h4>
            <p>AWB & PDF Invoice</p>
          </div>
        </div>

        <div className="journey-step-details" id="journey-details">
          <b>Step 1 - Discovery:</b> Customer lands on your e-commerce storefront looking for crockery or clicks a targeted Instagram/Facebook ad that triggers a Click-to-WhatsApp session.
        </div>
      </div>
    </div>
  </section>

  {/* Interactive AI Bot Sandbox */}
  <section className="proposal-section" id="ai-bot">
    <div className="section-container">
      <div className="ai-grid">
        <div className="ai-info-side">
          <span className="section-tag">Interactive Preview</span>
          <h2>Multilingual Sales Assistant</h2>
          <p>Try the simulated AI bot on the phone mockup. It demonstrates real-time responses to queries regarding crockery catalog, custom gifts, bulk orders, and bilingual communication.</p>

          <div className="ai-use-cases">
            <h4>Tap to Test Prompt Chips:</h4>
            <div className="use-case-chips">
              <button className="chip-btn" data-query="suggest a dinner set for 6 people under ₹5,000">Dinner Set under ₹5,000</button>
              <button className="chip-btn" data-query="show gift ideas for housewarming">Housewarming Gift Ideas</button>
              <button className="chip-btn" data-query="do you have microwave-safe bowls?">Microwave-safe bowls</button>
              <button className="chip-btn" data-query="can i order bulk return gifts for a wedding?">Bulk Wedding Hampers</button>
              <button className="chip-btn" data-query="क्या यह हिंदी में बात कर सकता है?">Talk in Hindi (हिंदी)</button>
            </div>
          </div>

          <div className="ai-capabilities-list">
            <div className="capability-item">
              <i className="fa-solid fa-bolt"></i>
              <div>
                <h5>Instant FAQ & Product Recommendations</h5>
                <p>Retrieves specific SKU options matching customer constraints from Firestore.</p>
              </div>
            </div>
            <div className="capability-item">
              <i className="fa-solid fa-language"></i>
              <div>
                <h5>Bilingual Processing</h5>
                <p>Smooth translation and support in English and Hindi to capture a wider customer base.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="ai-sandbox-mock">
          <div className="smartphone-frame">
            <div className="phone-speaker"></div>
            <div className="phone-screen">
              <div className="whatsapp-header">
                <i className="fa-solid fa-chevron-left"></i>
                <div className="avatar">DA</div>
                <div className="contact-name">
                  <h4>Digisoft AI Assistant</h4>
                  <span>Online</span>
                </div>
                <div className="header-actions">
                  <i className="fa-solid fa-video"></i>
                  <i className="fa-solid fa-phone"></i>
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </div>
              </div>
              <div className="chat-messages" id="chat-area">
                <div className="system-time">TODAY</div>
                <div className="msg system">
                  🔒 Messages are end-to-end encrypted. No one outside this chat can read them.
                </div>
                <div className="msg bot">
                  Namaste! Welcome to *Digisoft Gift Shop*. 🙏
                  
                  I am your AI assistant. How can I help you pick the perfect crockery sets or design personalized gift combos today?
                </div>
              </div>
              <div className="chat-input-bar">
                <i className="fa-regular fa-face-smile"></i>
                <i className="fa-solid fa-paperclip"></i>
                <input type="text" id="chat-input" placeholder="Type message..." autocomplete="off" />
                <button id="send-chat-btn">
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Architecture Mapping Section */}
  <section className="proposal-section" style={{"background":"rgba(255,255,255,0.01)","borderTop":"1px solid var(--glass-border)","borderBottom":"1px solid var(--glass-border)"}}>
    <div className="section-container">
      <span className="section-tag">System Design</span>
      <h2 style={{"fontSize":"2.5rem","marginBottom":"1.5rem","fontWeight":"700","textAlign":"center"}}>Integrations & Infrastructure Map</h2>
      <p style={{"color":"var(--text-muted)","marginBottom":"4rem","textAlign":"center","maxWidth":"800px","marginLeft":"auto","marginRight":"auto"}}>Our tech stack connects the catalog, orders, logistics pipeline, and customer notifications together.</p>

      <div className="arch-grid">
        <div className="arch-card">
          <div className="arch-card-icon"><i className="fa-solid fa-shop"></i></div>
          <h4>Storefront Front-End</h4>
          <ul>
            <li>Vite & Vanilla JS</li>
            <li>Dynamic Badging</li>
            <li>Fragile labels</li>
          </ul>
        </div>

        <div className="arch-pipelines">
          <div className="pipeline">
            <span className="pipeline-label">Sync Orders & Catalog</span>
            <div className="flow-line">
              <span className="pulse"></span>
            </div>
          </div>
          <div className="pipeline">
            <span className="pipeline-label">WhatsApp Notifications</span>
            <div className="flow-line reverse">
              <span className="pulse"></span>
            </div>
          </div>
        </div>

        <div className="arch-card">
          <div className="arch-card-icon"><i className="fa-solid fa-server"></i></div>
          <h4>Firebase Database</h4>
          <ul>
            <li>Firestore Registry</li>
            <li>Auth Verification</li>
            <li>Real-time listeners</li>
          </ul>
        </div>

        <div className="arch-pipelines">
          <div className="pipeline">
            <span className="pipeline-label">Checklist Validations</span>
            <div className="flow-line">
              <span className="pulse"></span>
            </div>
          </div>
          <div className="pipeline">
            <span className="pipeline-label">BlueDart Courier APIs</span>
            <div className="flow-line reverse">
              <span className="pulse"></span>
            </div>
          </div>
        </div>

        <div className="arch-card">
          <div className="arch-card-icon"><i className="fa-solid fa-warehouse"></i></div>
          <h4>Warehouse ERP</h4>
          <ul>
            <li>Invoice Engine</li>
            <li>Safety Checklists</li>
            <li>Status pipeline</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  {/* Feature Checklists Tabs */}
  <section className="proposal-section" id="features">
    <div className="section-container">
      <span className="section-tag">Scope of Work</span>
      <h2 style={{"fontSize":"2.5rem","marginBottom":"1rem","fontWeight":"700","textAlign":"center"}}>Technical Feature Scope</h2>
      <p style={{"color":"var(--text-muted)","marginBottom":"3rem","textAlign":"center","maxWidth":"800px","marginLeft":"auto","marginRight":"auto"}}>Review the structural items bundled into this project split by system layers.</p>

      <div className="checklist-tabs">
        <button className="tab-btn active" id="tab-erp-btn">Storefront & ERP Dashboard</button>
        <button className="tab-btn" id="tab-bot-btn">WhatsApp Commerce & AI Agent</button>
      </div>

      <div className="checklist-box">
        {/* ERP Content */}
        <div className="checklist-tab-content active" id="content-erp">
          <div className="checklist-grid">
            <div className="checklist-col">
              <h4>Storefront Portal UI</h4>
              <ul className="styled-checklist">
                <li><i className="fa-solid fa-circle-check"></i> Premium responsive storefront layout</li>
                <li><i className="fa-solid fa-circle-check"></i> Advanced product filtering and category catalogs</li>
                <li><i className="fa-solid fa-circle-check"></i> Smart badging (Best Seller, Fragile, New Arrival)</li>
                <li><i className="fa-solid fa-circle-check"></i> Promotional discounts and coupon rule engine</li>
              </ul>
            </div>
            <div className="checklist-col">
              <h4>Operations ERP Panel</h4>
              <ul className="styled-checklist">
                <li><i className="fa-solid fa-circle-check"></i> Active Orders Queue with dispatch state toggles</li>
                <li><i className="fa-solid fa-circle-check"></i> Automatic GST invoice calculator & print layouts</li>
                <li><i className="fa-solid fa-circle-check"></i> Inventory Master Registry (SKU details, base prices)</li>
                <li><i className="fa-solid fa-circle-check"></i> Low stock trigger thresholds & warning notifications</li>
              </ul>
            </div>
          </div>
        </div>

        {/* WhatsApp / Bot Content */}
        <div className="checklist-tab-content" id="content-bot">
          <div className="checklist-grid">
            <div className="checklist-col">
              <h4>WhatsApp API Channel</h4>
              <ul className="styled-checklist">
                <li><i className="fa-solid fa-circle-check"></i> Meta WhatsApp Cloud API credentials setup</li>
                <li><i className="fa-solid fa-circle-check"></i> Automated alerts (Order confirmation, Dispatch, Delivery)</li>
                <li><i className="fa-solid fa-circle-check"></i> PDF Doc Invoices push on shipment creation</li>
                <li><i className="fa-solid fa-circle-check"></i> Abandoned Cart customer recovery alerts</li>
              </ul>
            </div>
            <div className="checklist-col">
              <h4>Sales AI Chatbot</h4>
              <ul className="styled-checklist">
                <li><i className="fa-solid fa-circle-check"></i> Gemini NLP models setup for customer intents</li>
                <li><i className="fa-solid fa-circle-check"></i> Multilingual interaction in English & Hindi</li>
                <li><i className="fa-solid fa-circle-check"></i> WhatsApp Native Checkout & checkout via text</li>
                <li><i className="fa-solid fa-circle-check"></i> Lead pipeline logs & manual dashboard routing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Project 15-Day Timeline Details */}
  <section className="proposal-section section-timeline" id="timeline">
    <div className="section-container">
      <span className="section-tag">Implementation Roadmap</span>
      <h2 style={{"fontSize":"2.5rem","marginBottom":"1.5rem","fontWeight":"700"}}>15-Day Milestone Phases</h2>
      <p style={{"color":"var(--text-muted)","marginBottom":"3rem","maxWidth":"800px"}}>We follow a structured phase-by-phase implementation schedule to ensure zero downtime and smooth operations.</p>

      <div className="timeline-container">
        <div className="timeline-phases-nav">
          <button className="phase-tab-btn active" data-phase="1">
            <span className="phase-badge">Phase 1</span>
            <span className="phase-title">Days 1–4: Foundation Setup</span>
          </button>
          <button className="phase-tab-btn" data-phase="2">
            <span className="phase-badge">Phase 2</span>
            <span className="phase-title">Days 5–8: Web Storefront</span>
          </button>
          <button className="phase-tab-btn" data-phase="3">
            <span className="phase-badge">Phase 3</span>
            <span className="phase-title">Days 9–12: WhatsApp & AI</span>
          </button>
          <button className="phase-tab-btn" data-phase="4">
            <span className="phase-badge">Phase 4</span>
            <span className="phase-title">Days 13–15: Launch Prep</span>
          </button>
        </div>

        <div className="timeline-card">
          {/* Phase 1 Content */}
          <div className="phase-content active" id="phase-1-content">
            <div className="phase-summary-grid">
              <div className="phase-info">
                <h3>Architecture, UI Style System & Database</h3>
                <p className="phase-desc">Setup and configuration of core frameworks, branding rules, database schemas, and admin ERP components.</p>
                <div className="phase-highlights">
                  <div className="highlight-item">
                    <i className="fa-solid fa-code"></i>
                    <div>
                      <h5>Firebase Integration</h5>
                      <p>Active Real-time Firebase Firestore tables setup for catalog and order registry.</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <i className="fa-solid fa-palette"></i>
                    <div>
                      <h5>Responsive Design System</h5>
                      <p>Sleek dark themes, gold overlays, glassmorphic containers, and premium fonts styling.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="days-list">
                <div className="day-row">
                  <span className="day-number">Day 1</span>
                  <div className="day-details">
                    <h4>Research & Feasibility Assessment</h4>
                    <p>Competitor catalog study, workflow planning, design system guidelines document.</p>
                  </div>
                </div>
                <div className="day-row">
                  <span className="day-number">Day 2</span>
                  <div className="day-details">
                    <h4>UI / UX Branding Designs</h4>
                    <p>Figma mockups creation, storefront templates styling, responsiveness breakpoints.</p>
                  </div>
                </div>
                <div className="day-row">
                  <span className="day-number">Day 3</span>
                  <div className="day-details">
                    <h4>Database Schema & ERP Dashboards</h4>
                    <p>Firestore collections indexing, order updates listener, admin authentication setup.</p>
                  </div>
                </div>
                <div className="day-row">
                  <span className="day-number">Day 4</span>
                  <div className="day-details">
                    <h4>ERP Integrations</h4>
                    <p>Warehouse safety validation workflow, stock count replacer algorithm implementation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 2 Content */}
          <div className="phase-content" id="phase-2-content">
            <div className="phase-summary-grid">
              <div className="phase-info">
                <h3>Storefront UI, Shopping Cart & Checkout Flow</h3>
                <p className="phase-desc">Creating the primary storefront pages, sorting catalogs, coupon code validator logic, and payment modules integration.</p>
                <div className="phase-highlights">
                  <div className="highlight-item">
                    <i className="fa-solid fa-cart-shopping"></i>
                    <div>
                      <h5>Checkout Rules</h5>
                      <p>Smart subtotal calculator handling taxes, loyalty point credits, and checkout fields checks.</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <i className="fa-solid fa-tags"></i>
                    <div>
                      <h5>Dynamic Badging & Badges</h5>
                      <p>Real-time badging on catalog items based on stock alerts, fragility, and promotional events.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="days-list">
                <div className="day-row">
                  <span className="day-number">Day 5</span>
                  <div className="day-details">
                    <h4>Storefront UI Completion</h4>
                    <p>Homepage banners, product grid lists, categories navigation controls, details cards.</p>
                  </div>
                </div>
                <div className="day-row">
                  <span className="day-number">Day 6</span>
                  <div className="day-details">
                    <h4>Advanced Filters & Badging</h4>
                    <p>Search indexing filters, category sorting options, Fragile and Low Stock stickers setup.</p>
                  </div>
                </div>
                <div className="day-row">
                  <span className="day-number">Day 7</span>
                  <div className="day-details">
                    <h4>Shopping Cart & Coupon Engines</h4>
                    <p>Multi-item cart lists, coupon code apply trigger, discount calculations validation.</p>
                  </div>
                </div>
                <div className="day-row">
                  <span className="day-number">Day 8</span>
                  <div className="day-details">
                    <h4>Payment Gateway Integration</h4>
                    <p>Sandbox setup for cards, UPI apps, netbanking, and wallets with invoice alerts trigger.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 3 Content */}
          <div className="phase-content" id="phase-3-content">
            <div className="phase-summary-grid">
              <div className="phase-info">
                <h3>WhatsApp Business APIs & Gemini NLP Bot</h3>
                <p className="phase-desc">Setting up Meta Business accounts, automated updates triggers, and configuring the AI chatbot to catalog orders directly inside WhatsApp.</p>
                <div className="phase-highlights">
                  <div className="highlight-item">
                    <i className="fa-brands fa-whatsapp"></i>
                    <div>
                      <h5>Meta Cloud APIs</h5>
                      <p>Verified WhatsApp Business profile hooks, transaction message templates approval.</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <i className="fa-solid fa-brain"></i>
                    <div>
                      <h5>AI Chatbot Engine</h5>
                      <p>Gemini integration for answering product stock FAQs and qualifying customer details.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="days-list">
                <div className="day-row">
                  <span className="day-number">Day 9</span>
                  <div className="day-details">
                    <h4>WhatsApp API Config</h4>
                    <p>Webhook configuration, order templates registration, trigger logic for dispatch updates.</p>
                  </div>
                </div>
                <div className="day-row">
                  <span className="day-number">Day 10</span>
                  <div className="day-details">
                    <h4>Multilingual Sales Bot</h4>
                    <p>Gemini NLP prompts setup, bilingual translation layers, FAQ list indexing in Firestore.</p>
                  </div>
                </div>
                <div className="day-row">
                  <span className="day-number">Day 11</span>
                  <div className="day-details">
                    <h4>WhatsApp Native Checkout</h4>
                    <p>Vite-whatsapp database listeners, text-based catalog browsing and order confirmations.</p>
                  </div>
                </div>
                <div className="day-row">
                  <span className="day-number">Day 12</span>
                  <div className="day-details">
                    <h4>Intelligent Lead Routing</h4>
                    <p>Human operator dashboard redirect triggers, offline agent email notifications pipeline.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 4 Content */}
          <div className="phase-content" id="phase-4-content">
            <div className="phase-summary-grid">
              <div className="phase-info">
                <h3>Logistics, Speed Optimization & Testing</h3>
                <p className="phase-desc">Courier airway bill integration, database caching setup, page audits, and overall bug fixing rounds.</p>
                <div className="phase-highlights">
                  <div className="highlight-item">
                    <i className="fa-solid fa-truck-ramp-box"></i>
                    <div>
                      <h5>BlueDart Express APIs</h5>
                      <p>Shipment creation webhook, instant tracking link calculations, invoice attachments.</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <i className="fa-solid fa-gauge-high"></i>
                    <div>
                      <h5>Performance Auditing</h5>
                      <p>Image compressions, SEO tags optimization, CDN delivery validation.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="days-list">
                <div className="day-row">
                  <span className="day-number">Day 13</span>
                  <div className="day-details">
                    <h4>Logistics Partner API Integrations</h4>
                    <p>BlueDart Express API keys hook, fragile label tag prints, AWB routing setup.</p>
                  </div>
                </div>
                <div className="day-row">
                  <span className="day-number">Day 14</span>
                  <div className="day-details">
                    <h4>SEO & Page Optimization</h4>
                    <p>Meta title tags, search schema configurations, image resizing, caching scripts.</p>
                  </div>
                </div>
                <div className="day-row">
                  <span className="day-number">Day 15</span>
                  <div className="day-details">
                    <h4>End-to-End Testing & Launch</h4>
                    <p>Checkout simulations, Firestore stress load tests, admin dashboard login audit, deployment.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Pricing Details Section */}
  <section className="proposal-section section-cta text-center" id="costing" style={{"background":"radial-gradient(circle at 50% 120%, rgba(197, 160, 89, 0.1), transparent 50%)","borderTop":"1px solid var(--glass-border)"}}>
    <div className="section-container">
      <span className="badge-accent">Commercial Quote & Costings</span>
      <h2>Project Investment Budget</h2>
      <p className="cta-subtitle" style={{"marginBottom":"3rem"}}>A transparent pricing structure covering core development deliverables and standard operational API/hosting budgets.</p>

      <div style={{"maxWidth":"900px","margin":"0 auto 3rem auto","background":"var(--bg-card)","border":"1px solid var(--glass-border)","borderRadius":"20px","overflow":"hidden"}}>
        <table style={{"width":"100%","borderCollapse":"collapse","textAlign":"left","fontSize":"1rem"}}>
          <thead>
            <tr style={{"background":"rgba(255,255,255,0.02)","borderBottom":"1px solid var(--glass-border)"}}>
              <th style={{"padding":"18px 24px","color":"var(--primary)","fontWeight":"700","textTransform":"uppercase","fontSize":"0.85rem","letterSpacing":"1px"}}>Scope Component</th>
              <th style={{"padding":"18px 24px","color":"var(--primary)","fontWeight":"700","textTransform":"uppercase","fontSize":"0.85rem","letterSpacing":"1px"}}>Details / Deliverables</th>
              <th style={{"padding":"18px 24px","color":"var(--primary)","fontWeight":"700","textTransform":"uppercase","fontSize":"0.85rem","letterSpacing":"1px","textAlign":"right"}}>Cost (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{"borderBottom":"1px solid var(--glass-border)"}}>
              <td style={{"padding":"20px 24px","fontWeight":"700"}}>Development Fee</td>
              <td style={{"padding":"20px 24px","color":"var(--text-muted)","fontSize":"0.9rem"}}>Storefront, Cart & checkout system, Admin ERP control panel, AI bot setup, BlueDart & Firebase integration.</td>
              <td style={{"padding":"20px 24px","fontWeight":"700","textAlign":"right","color":"var(--primary)"}}>₹1,80,000</td>
            </tr>
            <tr style={{"borderBottom":"1px solid var(--glass-border)","background":"rgba(255,255,255,0.01)"}}>
              <td style={{"padding":"20px 24px","fontWeight":"700"}}>Firebase Backend (Hosting/DB)</td>
              <td style={{"padding":"20px 24px","color":"var(--text-muted)","fontSize":"0.9rem"}}>Firebase spark plan (free for initial launch). Future pay-as-you-go based on active catalog visits.</td>
              <td style={{"padding":"20px 24px","fontWeight":"700","textAlign":"right","color":"#25d366"}}>FREE Tier</td>
            </tr>
            <tr style={{"borderBottom":"1px solid var(--glass-border)"}}>
              <td style={{"padding":"20px 24px","fontWeight":"700"}}>WhatsApp API (Meta charges)</td>
              <td style={{"padding":"20px 24px","color":"var(--text-muted)","fontSize":"0.9rem"}}>User-initiated service chats are ~₹0.29; marketing template updates are ~₹0.70 per session. Paid directly to Meta.</td>
              <td style={{"padding":"20px 24px","fontWeight":"700","textAlign":"right","color":"var(--text-main)"}}>Pay-as-you-go</td>
            </tr>
            <tr style={{"borderBottom":"1px solid var(--glass-border)","background":"rgba(255,255,255,0.01)"}}>
              <td style={{"padding":"20px 24px","fontWeight":"700"}}>AI Prompt Tokens (Gemini API)</td>
              <td style={{"padding":"20px 24px","color":"var(--text-muted)","fontSize":"0.9rem"}}>Runs on Gemini 1.5 Flash API token counts. First 1,500 chats per month fit inside free developer keys.</td>
              <td style={{"padding":"20px 24px","fontWeight":"700","textAlign":"right","color":"#25d366"}}>FREE (Tier 1)</td>
            </tr>
            <tr style={{"background":"rgba(197, 160, 89, 0.05)"}}>
              <td style={{"padding":"20px 24px","fontWeight":"800","color":"var(--primary)"}}>Total One-time Project cost</td>
              <td style={{"padding":"20px 24px","fontWeight":"600","fontSize":"0.9rem"}}>Includes code handover, responsive testing adjustments, and initial server launch pipeline support.</td>
              <td style={{"padding":"20px 24px","fontWeight":"800","textAlign":"right","color":"var(--primary)","fontSize":"1.25rem"}}>₹1,80,000</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="seo-card">
        <i className="fa-solid fa-circle-check"></i>
        <div>
          <h4>Complete Maintenance & Hosting Assistance Included</h4>
          <p>We supply 30 days of post-launch bug fixing support, basic SEO meta description indexing audits, and assistance linking your official corporate domain name to standard DNS settings.</p>
        </div>
      </div>

      <div className="cta-actions">
        <a href="/" className="btn btn-primary btn-large">Accept Proposal</a>
        <a href="/whatsapp" className="btn btn-outline btn-large">Try Simulator</a>
      </div>
    </div>
  </section>

  {/* Footer */}
  <footer style={{"marginTop":"50px"}}>
    <div className="footer-bottom">
      <p>© 2026 Digisoft E-Commerce & ERP Systems. All rights reserved.</p>
      <div className="dev-credit">
        Designed for <span>Digisoft Gift Shop Website</span>
      </div>
    </div>
  </footer>

  

    </>
  );
}
