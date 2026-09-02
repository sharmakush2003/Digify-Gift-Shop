/**
 * Utility functions for parsing and formatting YouTube and Instagram URLs.
 */

export function parseVideoUrl(url) {
  if (!url || typeof url !== 'string') {
    return { type: 'none', embedUrl: null, originalUrl: null, videoId: null };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { type: 'none', embedUrl: null, originalUrl: null, videoId: null };
  }

  // 1. Check YouTube
  // Handles:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    const isShort = trimmed.toLowerCase().includes('/shorts/');
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`,
      originalUrl: trimmed,
      isShort
    };
  }

  // 2. Check Instagram
  // Handles:
  // - https://www.instagram.com/reel/REEL_ID/
  // - https://www.instagram.com/p/POST_ID/
  // - https://instagr.am/p/POST_ID/
  const igMatch = trimmed.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/i);
  if (igMatch && igMatch[1]) {
    const reelId = igMatch[1];
    return {
      type: 'instagram',
      videoId: reelId,
      embedUrl: `https://www.instagram.com/reel/${reelId}/embed`,
      originalUrl: trimmed,
      isShort: true
    };
  }

  // 3. Fallback for generic video link
  return {
    type: 'other',
    videoId: null,
    embedUrl: trimmed,
    originalUrl: trimmed,
    isShort: false
  };
}
