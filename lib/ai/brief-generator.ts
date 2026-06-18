import type { AiBrief, Product } from "@/lib/types/domain";
import { PROMPT_VERSIONS } from "./prompt-versions";
import { getAiConfig } from "./config";
import { callAiJson } from "./call-ai-json";
import { productAnalyzerSystemPrompt } from "./prompts/product-analyzer";
import { logAiTask } from "./logger";

export async function generateProductBrief(product: Product): Promise<AiBrief> {
  const config = getAiConfig();
  const started = Date.now();
  const fallback: AiBrief = {
    product_summary: `${product.title} เหมาะสำหรับคอนเทนต์รีวิวแบบใช้งานจริง เน้นคุณสมบัติที่ตรวจสอบได้`,
    target_audience: "ผู้ซื้อ Shopee ที่กำลังเปรียบเทียบสินค้าและต้องการข้อมูลที่ชัดเจน",
    pain_points: ["ไม่แน่ใจว่าสินค้าเหมาะกับตนเองหรือไม่", "ต้องการเห็นจุดเด่นและข้อควรพิจารณาก่อนซื้อ"],
    key_benefits: ["อธิบายประโยชน์แบบไม่กล่าวอ้างเกินจริง", "ช่วยวางโครงเรื่องสำหรับคลิปรีวิวสั้น"],
    usp: "เล่าให้เห็นการใช้งานจริงพร้อมคำเตือน Affiliate ที่โปร่งใส",
    content_angles: ["แกะกล่องและลองใช้", "เหมาะกับใคร", "ข้อดีและข้อควรพิจารณา"],
    hook_ideas: ["ก่อนซื้อสินค้านี้ควรรู้อะไร", "ลองใช้แล้วเหมาะกับใคร"],
    risk_level: product.risk_flags?.length ? "HIGH" : "LOW",
    creator_note: "หลีกเลี่ยงคำการันตีผลลัพธ์และใส่ disclosure ทุกครั้ง",
    prompt_version: PROMPT_VERSIONS.productAnalyzer,
    ai_provider: config.provider,
    ai_model: config.provider === "openai" ? config.model : "mock-local"
  };

  return callAiJson<AiBrief>({
    systemPrompt: productAnalyzerSystemPrompt,
    userPrompt: JSON.stringify(product),
    fallback,
    onFallback: async (error) => {
      await logAiTask({
        task_type: "brief_generation",
        prompt_version: fallback.prompt_version,
        ai_provider: "openai",
        ai_model: config.model,
        input_payload: product,
        output_payload: fallback,
        error_message: error instanceof Error ? error.message : "Unknown OpenAI error",
        latency_ms: Date.now() - started,
        status: "fallback"
      });
    }
  });
}
