const risky = ['weight loss','whitening','medicine','supplement','investment','lottery','ลดน้ำหนัก','ขาว','ยา','อาหารเสริม','ลงทุน','หวย'];
export function detectProductRisk(title: string, category = ''): string[] { const text = `${title} ${category}`.toLowerCase(); return risky.filter((w) => text.includes(w.toLowerCase())); }
export function looksLikeShopeeLink(link: string): boolean { return /^https?:\/\/(s\.)?(shopee\.|shp\.ee)/i.test(link); }
