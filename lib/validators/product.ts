const HIGH_RISK_TERMS = ["weight loss", "whitening", "medicine", "supplement", "investment", "lottery", "ลดน้ำหนัก", "ผิวขาว", "ยา", "อาหารเสริม", "ลงทุน", "หวย"];

export function looksLikeShopeeLink(value: string) {
  return /shopee\./i.test(value) || /shp\.ee/i.test(value);
}

export function detectProductRisk(title: string, category = "") {
  const text = `${title} ${category}`.toLowerCase();
  return HIGH_RISK_TERMS.filter((term) => text.includes(term.toLowerCase()));
}

export function validateProductInput(input: { title: string; shopee_affiliate_link: string; category?: string }) {
  const errors: string[] = [];
  if (!input.title.trim()) errors.push("กรุณากรอกชื่อสินค้า");
  if (!input.shopee_affiliate_link.trim()) errors.push("กรุณากรอกลิงก์ Shopee Affiliate");
  if (input.shopee_affiliate_link && !looksLikeShopeeLink(input.shopee_affiliate_link)) {
    errors.push("ลิงก์ควรเป็นลิงก์ Shopee หรือ Shopee Affiliate");
  }
  return { errors, riskFlags: detectProductRisk(input.title, input.category) };
}
