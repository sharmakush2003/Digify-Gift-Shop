'use client';

import './WhatsAppFloating.css';
import { useState, useEffect, useRef } from 'react';
import { getProducts } from '../db';


// ---- Constants ----
const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Diwali', 'Housewarming', 'Corporate', 'Baby Shower', 'Farewell'];

const HAMPER_BUNDLES = [
  { label: 'Crockery Starter Pack', description: 'Tea cups + Dinner plates + Serving tray', priceRange: '₹1,200–₹2,500' },
  { label: 'Luxury Gifting Box', description: 'Customized mug + Artisan candle + Chocolate', priceRange: '₹800–₹1,800' },
  { label: 'Home Décor Combo', description: 'Crystal vase + Wall art + Scented diffuser', priceRange: '₹1,500–₹3,000' },
  { label: 'Wedding Hamper Set', description: 'Bone china set + Gold frame + Silk wrap', priceRange: '₹2,500–₹6,000' },
  { label: 'Corporate Gifting Pack', description: 'Leather journal + Pen set + Gift tag', priceRange: '₹500–₹1,200' },
];

const INITIAL_GREETING = `Namaste! 🙏 Welcome to **Digify Gift Shop**.\n\nI'm your AI assistant. I can help you:\n• 🎁 Find the perfect gift for any occasion\n• 📦 Browse our crockery & hamper bundles\n• 🚚 Track your order status\n• 💬 Answer any product questions\n\nHow can I assist you today?`;

const QUICK_CHIPS = [
  { label: '🎁 Browse Gifts', query: 'browse gifts' },
  { label: '📦 Hamper Bundles', query: 'hamper bundles' },
  { label: '🥂 Wedding Gifts', query: 'wedding gifts' },
];

// ---- Utility ----
const formatTime = () => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

const parseMarkdown = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

// ---- Main Component ----
export default function WhatsAppFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [products, setProducts] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customizerChips, setCustomizerChips] = useState([]);
  const [selectedChips, setSelectedChips] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasShownGreeting = useRef(false);

  // Local product listener
  useEffect(() => {
    setProducts(getProducts());
  }, []);

  // Show greeting when chat opens (only once per session)
  useEffect(() => {
    if (isOpen && !hasShownGreeting.current) {
      hasShownGreeting.current = true;
      setTimeout(() => {
        addBotMessage(INITIAL_GREETING);
      }, 400);
    }
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 300);
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        document.body.classList.add('modal-open');
      }
    } else {
      if (typeof window !== 'undefined') {
        document.body.classList.remove('modal-open');
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.classList.remove('modal-open');
      }
    };
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Helper: add bot message
  const addBotMessage = (text, extra = null) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'bot', text, extra, time: formatTime() },
    ]);
  };

  // Helper: add user message
  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'user', text, time: formatTime() },
    ]);
  };

  // Core: Generate AI response
  const generateResponse = async (userText) => {
    setIsTyping(true);
    const norm = userText.toLowerCase().trim();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          products: products.slice(0, 8).map((p) => ({
            name: p.name,
            price: p.price,
            category: p.category,
            stock: p.stock,
            department: p.department,
          })),
        }),
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();

      setIsTyping(false);

      // Show product cards if relevant
      let extra = null;
      if (
        norm.includes('product') ||
        norm.includes('browse') ||
        norm.includes('show') ||
        norm.includes('gift') ||
        norm.includes('crockery') ||
        norm.includes('dinner') ||
        norm.includes('hamper')
      ) {
        const filtered = products
          .filter((p) => p.stock > 0)
          .slice(0, 3);
        if (filtered.length > 0) {
          extra = { type: 'products', items: filtered };
        }
      }

      if (norm.includes('hamper') || norm.includes('bundle')) {
        extra = { type: 'hampers', items: HAMPER_BUNDLES.slice(0, 3) };
      }

      addBotMessage(data.reply || "I'm here to help! What are you looking for?", extra);
    } catch (_err) {
      // Fallback local responses if API fails
      setIsTyping(false);
      const fallbackReply = getFallbackReply(norm, products);
      addBotMessage(fallbackReply.text, fallbackReply.extra);
    }
  };

  // Local fallback if /api/chat unavailable
  const getFallbackReply = (norm, prods) => {
    if (norm.includes('track') || norm.includes('order')) {
      return {
        text: 'To track your order, please visit our **WhatsApp Simulator** page or contact us.\n👉 Type your Order ID like: *"Track OD-123456"*',
        extra: null,
      };
    }
    if (norm.includes('hamper') || norm.includes('bundle')) {
      return {
        text: 'Here are our popular **Gift Hamper Bundles** for all occasions! 🎁',
        extra: { type: 'hampers', items: HAMPER_BUNDLES.slice(0, 3) },
      };
    }
    if (norm.includes('wedding') || norm.includes('anniversary')) {
      const items = prods.filter((p) => p.stock > 0 && (p.category || '').toLowerCase().includes('wedding')).slice(0, 3);
      return {
        text: "Congratulations! 🥂 Here are our top **Wedding & Anniversary Gifts**:",
        extra: items.length > 0 ? { type: 'products', items } : null,
      };
    }
    if (norm.includes('browse') || norm.includes('product') || norm.includes('gift')) {
      const items = prods.filter((p) => p.stock > 0).slice(0, 3);
      return {
        text: "Here's a selection from our **premium collection** 🛍️",
        extra: items.length > 0 ? { type: 'products', items } : null,
      };
    }
    if (norm.includes('price') || norm.includes('cost') || norm.includes('how much')) {
      return {
        text: "Our products range from **₹45** (Crystal Candles) to **₹899** (Diamond Earrings). Browse the storefront for full pricing. 💰",
        extra: null,
      };
    }
    if (norm.includes('microwave') || norm.includes('dishwasher')) {
      const items = prods.filter((p) => p.microwave && p.stock > 0).slice(0, 2);
      return {
        text: "Yes! 🥣 All our **Artisan Ceramic** and **Bone China** products are certified microwave & dishwasher safe.",
        extra: items.length > 0 ? { type: 'products', items } : null,
      };
    }
    if (norm.includes('bulk') || norm.includes('wholesale') || norm.includes('corporate')) {
      return {
        text: "We specialize in **bulk & corporate gifting** with up to 35% volume discount! 🏢\n\nContact us via WhatsApp for custom quotes:\n📞 **+91-XXXXXXXXXX**",
        extra: null,
      };
    }
    if (norm.includes('customize') || norm.includes('personali') || norm.includes('engrav')) {
      return {
        text: "Yes! We offer **personalization** on most products 🎨\n\n• Custom name engraving\n• Logo printing for corporate orders\n• Gold-foil greeting tags\n• Signature gift wrapping\n\nReach us at: **support@digisoftgiftshop.com**",
        extra: null,
      };
    }
    if (norm.includes('occasion')) {
      return {
        text: "Let me help you pick the **perfect gift for your occasion**! 🎉 Select one below:",
        extra: { type: 'occasion_picker' },
      };
    }
    return {
      text: "I'm here to help! 😊 You can:\n• **Browse gifts** by category\n• Ask about **hamper bundles**\n• **Track your order**\n• Get **bulk pricing** info\n\nWhat would you like to explore?",
      extra: null,
    };
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;
    addUserMessage(text);
    setInputValue('');
    generateResponse(text);
  };

  const handleChipClick = (query) => {
    addUserMessage(query);
    generateResponse(query);
  };

  const handleOccasionSelect = (occasion) => {
    setSelectedOccasion(occasion);
    addUserMessage(`Looking for ${occasion} gifts`);
    generateResponse(`I need ${occasion} gift ideas`);
    setShowCustomizer(false);
  };

  const toggleGiftChip = (chip) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleGiftSearch = () => {
    const query = `Show me ${selectedChips.join(', ')} gifts${selectedOccasion ? ` for ${selectedOccasion}` : ''}`;
    addUserMessage(query);
    generateResponse(query);
    setShowCustomizer(false);
    setSelectedChips([]);
  };

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  // Render extra content in message
  const renderExtra = (extra) => {
    if (!extra) return null;

    if (extra.type === 'products') {
      return (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {extra.items.map((p) => (
            <a
              key={p.id}
              href={`#product-container`}
              className="chat-product-card"
              style={{ textDecoration: 'none' }}
              onClick={(e) => {
                e.preventDefault();
                if (typeof window !== 'undefined' && window.openProductDetailsFromChat) {
                  window.openProductDetailsFromChat(p.id);
                  setIsOpen(false); // Optionally close chat
                }
              }}
            >
              <img
                src={p.image}
                alt={p.name}
                className="chat-product-img"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=80'; }}
              />
              <div className="chat-product-info">
                <h5>{p.name}</h5>
                <span className="price">₹{p.price?.toLocaleString('en-IN')}</span>
              </div>
            </a>
          ))}
          <a
            href="#product-container"
            onClick={() => setIsOpen(false)}
            style={{
              fontSize: '0.75rem',
              color: 'var(--chat-primary)',
              fontWeight: '600',
              textDecoration: 'none',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View all products →
          </a>
        </div>
      );
    }

    if (extra.type === 'hampers') {
      return (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {extra.items.map((h, idx) => (
            <div key={idx} className="chat-product-card" style={{ flexDirection: 'column', alignItems: 'flex-start', cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <span style={{ fontSize: '1.1rem' }}>🎁</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--chat-text)' }}>{h.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--chat-muted)' }}>{h.description}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--chat-primary)', fontWeight: '600' }}>{h.priceRange}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (extra.type === 'occasion_picker') {
      return (
        <div className="gift-customizer" style={{ marginTop: '8px' }}>
          <h6>🎉 Select Your Occasion</h6>
          <div className="gift-option-chips">
            {OCCASIONS.map((occ) => (
              <button
                key={occ}
                className={`gift-option-chip ${selectedOccasion === occ ? 'selected' : ''}`}
                onClick={() => handleOccasionSelect(occ)}
              >
                {occ}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Chat Panel */}
      <div className={`digify-chat-panel ${isOpen ? 'open' : ''}`} role="dialog" aria-label="Digify Gift Shop Chat">
        {/* Header */}
        <div className="digify-chat-header">
          <div className="chat-header-avatar">DG</div>
          <div className="chat-header-info">
            <h4>
              Digify Assistant
              <span className="chat-verified-badge" aria-label="Verified">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            </h4>
            <p>
              <span className="online-dot"></span>
              Online • Gift Shop AI
            </p>
          </div>
          <div className="chat-header-actions">
            <button
              className="chat-hdr-btn"
              title="Gift Customizer"
              onClick={() => setShowCustomizer((v) => !v)}
              aria-label="Open gift customizer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12v10H4V12"></path>
                <path d="M2 7h20v5H2z"></path>
                <path d="M12 22V7"></path>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
              </svg>
            </button>
            <button
              className="chat-hdr-btn"
              title="Close Chat"
              onClick={toggleOpen}
              aria-label="Close chat"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Gift Customizer Panel */}
        {showCustomizer && (
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--chat-border)', background: 'rgba(0,0,0,0.25)' }}>
            <div className="gift-customizer">
              <h6>🎁 Custom Gift Builder</h6>

              {/* Occasion */}
              <div className="chat-selector-group">
                <span className="chat-selector-label">Occasion</span>
                <select
                  className="chat-select"
                  value={selectedOccasion}
                  onChange={(e) => setSelectedOccasion(e.target.value)}
                >
                  <option value="">Select Occasion...</option>
                  {OCCASIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {/* Filter Chips */}
              <div className="chat-selector-group">
                <span className="chat-selector-label">Preferences</span>
                <div className="gift-option-chips">
                  {['Under ₹1,000', 'Under ₹2,500', 'Premium', 'Eco-friendly', 'Personalized', 'Fragile-safe', 'Microwave-safe', 'Bulk Order'].map((chip) => (
                    <button
                      key={chip}
                      className={`gift-option-chip ${selectedChips.includes(chip) ? 'selected' : ''}`}
                      onClick={() => toggleGiftChip(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGiftSearch}
                disabled={!selectedOccasion && selectedChips.length === 0}
                style={{
                  marginTop: '4px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #C5A059, #D4AF37)',
                  border: 'none',
                  borderRadius: '50px',
                  color: '#000',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: (!selectedOccasion && selectedChips.length === 0) ? 0.5 : 1,
                  fontFamily: 'Outfit, sans-serif',
                  transition: 'all 0.25s ease',
                }}
              >
                Find Perfect Gift →
              </button>
            </div>
          </div>
        )}

        {/* Quick Chips */}
        <div className="digify-quick-chips">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.query}
              className="quick-chip"
              onClick={() => handleChipClick(chip.query)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="digify-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`digify-msg ${msg.sender}`}>
              <div
                className="msg-bubble"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
              />
              {renderExtra(msg.extra)}
              <div className={`msg-time ${msg.sender === 'user' ? 'user' : ''}`}>
                {msg.time}
                {msg.sender === 'user' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00aaff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 6 9 17 4 12"></polyline>
                    <polyline points="22 6 14 17 9 12"></polyline>
                  </svg>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="digify-typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="digify-chat-input-area">
          <div className="chat-input-row">
            <input
              ref={inputRef}
              className="chat-input-field"
              type="text"
              placeholder="Ask about gifts, prices, or orders..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <div className="chat-powered-by">
            Powered by <span>Digify AI</span> • Groq LLaMA 3
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        className={`digify-chat-fab ${isOpen ? 'open' : ''}`}
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close chat' : 'Open Digify Gift Shop chat'}
        id="digify-chat-fab-btn"
      >
        {/* Chat Icon */}
        <svg
          className="fab-icon-chat"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        {/* Close Icon */}
        <svg
          className="fab-icon-close"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>

        {/* Unread Badge */}
        {hasUnread && <span className="fab-unread-badge visible">1</span>}
      </button>
    </>
  );
}
