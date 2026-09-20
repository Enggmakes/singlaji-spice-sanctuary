import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string | null;
  url?: string;
  type?: 'website' | 'product';
}

const DEFAULT_TITLE = 'Singlaji Masala Store | Premium Pure Indian Spices';
const DEFAULT_DESC =
  'Pure, freshly ground Indian masalas & spices from Abohar. 100% natural, rich aroma, and authentic taste. Order online with Cash on Delivery.';
const DEFAULT_IMAGE = 'https://singlaji.in/og-preview.jpg';
const SITE_NAME = 'Singlaji Spices';

function setMetaTag(selector: string, attr: string, value: string) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    if (selector.startsWith('meta[property=')) {
      const propMatch = selector.match(/property="([^"]+)"/);
      if (propMatch) element.setAttribute('property', propMatch[1]);
    } else if (selector.startsWith('meta[name=')) {
      const nameMatch = selector.match(/name="([^"]+)"/);
      if (nameMatch) element.setAttribute('name', nameMatch[1]);
    }
    document.head.appendChild(element);
  }
  element.setAttribute(attr, value);
}

export function useSEO({ title, description, image, url, type = 'website' }: SEOProps) {
  useEffect(() => {
    const finalTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const finalDesc = description || DEFAULT_DESC;
    let finalImage = DEFAULT_IMAGE;

    if (image) {
      if (image.startsWith('http://') || image.startsWith('https://')) {
        finalImage = image;
      } else if (image.startsWith('/')) {
        finalImage = `https://singlaji.in${image}`;
      }
    }

    const finalUrl = url || window.location.href;

    // 1. Page Title
    document.title = finalTitle;

    // 2. Meta description
    setMetaTag('meta[name="description"]', 'content', finalDesc);

    // 3. Open Graph (WhatsApp, Facebook, LinkedIn)
    setMetaTag('meta[property="og:title"]', 'content', finalTitle);
    setMetaTag('meta[property="og:description"]', 'content', finalDesc);
    setMetaTag('meta[property="og:image"]', 'content', finalImage);
    setMetaTag('meta[property="og:image:secure_url"]', 'content', finalImage);
    setMetaTag('meta[property="og:url"]', 'content', finalUrl);
    setMetaTag('meta[property="og:type"]', 'content', type);
    setMetaTag('meta[property="og:site_name"]', 'content', SITE_NAME);

    // 4. Twitter Cards
    setMetaTag('meta[name="twitter:title"]', 'content', finalTitle);
    setMetaTag('meta[name="twitter:description"]', 'content', finalDesc);
    setMetaTag('meta[name="twitter:image"]', 'content', finalImage);

    // Cleanup on unmount (restore defaults)
    return () => {
      document.title = DEFAULT_TITLE;
      setMetaTag('meta[name="description"]', 'content', DEFAULT_DESC);
      setMetaTag('meta[property="og:title"]', 'content', DEFAULT_TITLE);
      setMetaTag('meta[property="og:description"]', 'content', DEFAULT_DESC);
      setMetaTag('meta[property="og:image"]', 'content', DEFAULT_IMAGE);
      setMetaTag('meta[property="og:image:secure_url"]', 'content', DEFAULT_IMAGE);
      setMetaTag('meta[name="twitter:title"]', 'content', DEFAULT_TITLE);
      setMetaTag('meta[name="twitter:description"]', 'content', DEFAULT_DESC);
      setMetaTag('meta[name="twitter:image"]', 'content', DEFAULT_IMAGE);
    };
  }, [title, description, image, url, type]);
}
