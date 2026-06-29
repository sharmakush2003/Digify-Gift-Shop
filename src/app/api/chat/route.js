import { NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are a friendly, knowledgeable AI assistant for Digify Gift Shop — a premium Indian e-commerce store selling luxury gifts, crockery, dinnerware, hampers, and customized gifts.

Your persona:
- Name: Digify AI
- Tone: Warm, professional, helpful, slightly celebratory (use tasteful emojis)
- Language: English (support Hindi phrases if the user writes in Hindi)

Your capabilities:
- Recommend specific products from the current catalog (provided in each message)
- Suggest gift hamper bundles for specific occasions
- Answer questions about microwave-safe, fragile, or premium products
- Help with bulk/corporate orders (mention up to 35% off for bulk)
- Guide users to track orders by redirecting to /whatsapp page
- Handle FAQ about return policy, delivery timelines

Always:
- Keep replies concise (2-4 short paragraphs max)
- Use markdown bold (**text**) for product names and prices
- End with a clear call to action or question to keep conversation flowing
- When listing products, mention price in ₹ format

Never:
- Invent prices not in the provided catalog
- Promise specific delivery dates (say "typically 3-5 business days")
- Discuss competitors

If the user asks to place an order, direct them to the storefront at the root URL.`;

export async function POST(request) {
  try {
    const { message, products = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      // Return a graceful local fallback if no key is configured
      return NextResponse.json({
        reply: getLocalFallback(message, products),
      });
    }

    // Build catalog context for the model
    const catalogContext = products.length > 0
      ? `\n\nCurrent product catalog (in stock):\n${products
          .filter((p) => p.stock > 0)
          .map((p) => `• ${p.name} — ₹${p.price} (${p.department || p.category})`)
          .join('\n')}`
      : '';

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT + catalogContext,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 350,
        temperature: 0.75,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Digify Chat API] Groq error:', response.status, errorBody);
      // Fall back to local response on API error
      return NextResponse.json({
        reply: getLocalFallback(message, products),
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || getLocalFallback(message, products);

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[Digify Chat API] Error:', err);
    return NextResponse.json(
      { reply: "I'm having a moment! 😅 Please try again or browse our storefront directly." },
      { status: 200 } // return 200 with fallback so client doesn't crash
    );
  }
}

// Local intelligent fallback responses
function getLocalFallback(message, products) {
  const norm = message.toLowerCase();

  if (norm.includes('track') || norm.includes('order')) {
    return 'To track your order, visit our **WhatsApp Simulator** page where you\'ll get real-time updates on packaging and dispatch! 🚚\n\nYou can also type your order ID in the format: *"Track OD-XXXXXX"*';
  }

  if (norm.includes('hamper') || norm.includes('bundle') || norm.includes('combo')) {
    return 'We have amazing **Gift Hamper Bundles** starting from ₹800! 🎁\n\nOur most popular bundles include:\n• **Crockery Starter Pack** — ₹1,200–₹2,500\n• **Luxury Gifting Box** — ₹800–₹1,800\n• **Wedding Hamper Set** — ₹2,500–₹6,000\n\nWould you like details on any of these?';
  }

  if (norm.includes('wedding') || norm.includes('anniversary')) {
    const weddingProducts = products.filter(
      (p) => p.stock > 0 && (p.category || '').toLowerCase().includes('wedding')
    );
    const productList = weddingProducts.length > 0
      ? weddingProducts.slice(0, 2).map((p) => `• **${p.name}** — ₹${p.price}`).join('\n')
      : '• **Diamond Stud Earrings** — ₹899\n• **Luxury Watch Set** — ₹450';
    return `Congratulations! 🥂 Here are our top picks for **Wedding & Anniversary**:\n\n${productList}\n\nWe also offer custom engraving and gold-foil gift wrapping. Shall I help you pick the perfect one?`;
  }

  if (norm.includes('microwave') || norm.includes('dishwasher')) {
    return 'Absolutely! 🥣 All our **Artisan Ceramic Bowls**, **Bone China Plates**, and **Ceramic Mugs** are certified **100% microwave & dishwasher safe**.\n\nLook for the microwave-safe badge on each product card on our storefront.';
  }

  if (norm.includes('bulk') || norm.includes('corporate') || norm.includes('wholesale')) {
    return 'We love bulk orders! 🏢 For **corporate & bulk gifting** we offer:\n\n✅ Up to **35% volume discount**\n✅ Custom logo engraving or printing\n✅ Fragile-safe packaging with labels\n✅ Dedicated account manager\n\nContact us at **support@digisoftgiftshop.com** for a custom quote!';
  }

  if (norm.includes('price') || norm.includes('cost') || norm.includes('how much')) {
    const minPrice = products.length > 0 ? Math.min(...products.map((p) => p.price)) : 45;
    const maxPrice = products.length > 0 ? Math.max(...products.map((p) => p.price)) : 899;
    return `Our products are priced from **₹${minPrice}** to **₹${maxPrice}**, covering everything from crystal candles to luxury watch sets! 💎\n\nBrowse the storefront for complete pricing and to filter by budget.`;
  }

  if (norm.includes('diwali') || norm.includes('festival')) {
    return 'Diwali gifting is our specialty! 🪔✨\n\nOur **Festival Gift Collection** includes:\n• **Golden Eternal Rose** — ₹129\n• **Crystal Scented Candle** — ₹45\n• **Artisan Chocolate Box** — ₹85\n\nWe also offer beautiful Diwali-themed packaging and bulk return gift arrangements!';
  }

  const inStockCount = products.filter((p) => p.stock > 0).length;
  const topProduct = products.find((p) => p.stock > 0);

  if (topProduct) {
    return `Hello! 🙏 I'm Digify AI, your gift concierge!\n\nWe currently have **${inStockCount} products** in stock, including the popular **${topProduct.name}** (₹${topProduct.price}).\n\nYou can ask me about:\n• 🎁 Gift recommendations by occasion\n• 📦 Hamper bundles\n• 🚚 Order tracking\n• 💬 Product specifications\n\nWhat are you looking for today?`;
  }

  return `Namaste! 🙏 I'm Digify AI, here to help you find the perfect gift!\n\nYou can ask me about our **premium crockery**, **gift hampers**, **customized gifts**, or get help with your **order tracking**.\n\nWhat can I assist you with today?`;
}
