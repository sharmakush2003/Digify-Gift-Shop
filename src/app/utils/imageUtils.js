// Utility function to compute dynamic image styles (objectFit & objectPosition) based on saved product image_settings
export function getImageStyle(product, imgUrl, defaultFit = 'cover') {
  if (!product) return { objectFit: defaultFit, objectPosition: '50% 50%' };

  let settingsMap = product.image_settings;
  
  // Local storage fallback if database column hasn't updated
  if ((!settingsMap || Object.keys(settingsMap).length === 0) && typeof window !== 'undefined') {
    try {
      const localMap = JSON.parse(localStorage.getItem('orient_image_settings') || '{}');
      settingsMap = localMap[product.id];
    } catch (e) {
      console.warn("Could not read local image settings", e);
    }
  }

  const targetUrl = imgUrl || product.image;
  const config = settingsMap?.[targetUrl] || settingsMap?.[product.image] || {};

  const fit = config.fit || defaultFit;
  const x = config.x !== undefined ? config.x : 50;
  const y = config.y !== undefined ? config.y : 50;
  const zoom = config.zoom !== undefined ? config.zoom : 1;

  const style = {
    objectFit: fit,
    objectPosition: `${x}% ${y}%`
  };

  if (zoom && zoom !== 1) {
    style.transform = `scale(${zoom})`;
  }

  return style;
}

// Utility function to fetch product media URLs (YouTube & Instagram Reel) with database & localStorage fallback
export function getProductMediaUrls(product) {
  if (!product) return { youtube_url: '', instagram_url: '' };

  let youtube_url = product.youtube_url || '';
  let instagram_url = product.instagram_url || '';

  if (typeof window !== 'undefined' && product.id) {
    try {
      const localMap = JSON.parse(localStorage.getItem('orient_product_media_urls') || '{}');
      const saved = localMap[product.id] || localMap[String(product.id)] || localMap[Number(product.id)];
      if (saved) {
        if (!youtube_url && saved.youtube_url) youtube_url = saved.youtube_url;
        if (!instagram_url && saved.instagram_url) instagram_url = saved.instagram_url;
      }
    } catch (e) {
      console.warn("Could not read local product media URLs", e);
    }
  }

  return { youtube_url, instagram_url };
}
