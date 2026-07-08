export interface OrderContact {
  label: string;
  phone: string;
}

export const ORDER_CONTACTS: OrderContact[] = [
  { label: '+241 76471085', phone: '24176471085' },
  { label: '+241 062186541', phone: '241062186541' },
  { label: '+241 077961650', phone: '241077961650' },
];

export const DEFAULT_PRODUCT_IMAGE = '/uploads/WhatsApp Image 2026-07-01 at 20.31.11.jpeg';

export const API_BASE = 'https://mon-vrai-backend.onrender.com';

export function productImageUrl(imageUrl?: string): string {
  return `${API_BASE}${imageUrl || DEFAULT_PRODUCT_IMAGE}`;
}
