const risky = ['weight loss','whitening','medicine','supplement','investment','lottery','ลดน้ำหนัก','ขาว','ยา','อาหารเสริม','ลงทุน','หวย'];
export function detectProductRisk(title: string, category = ''): string[] { const text = `${title} ${category}`.toLowerCase(); return risky.filter((w) => text.includes(w.toLowerCase())); }
export const SHOPEE_HOSTNAMES = new Set(['shopee.co.th','shopee.co.id','shopee.sg','shopee.com.my','shopee.ph','shopee.vn','shp.ee']);
export function looksLikeShopeeLink(link: string): boolean {
  try {
    const url = new URL(link.trim());
    return (url.protocol === 'https:' || url.protocol === 'http:') && SHOPEE_HOSTNAMES.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
