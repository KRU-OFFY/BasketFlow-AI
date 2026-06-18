import type { AiBrief, ReviewScript } from "@/lib/types/domain";
import { PROMPT_VERSIONS } from "./prompt-versions";
import { getAiConfig } from "./config";
import { callAiJson } from "./call-ai-json";
import { scriptGeneratorSystemPrompt } from "./prompts/script-generator";
import { logAiTask } from "./logger";

export const THAI_AFFILIATE_DISCLOSURE = "คลิปนี้มีลิงก์ Affiliate หากสั่งซื้อผ่านลิงก์ ผู้จัดทำอาจได้รับค่าคอมมิชชัน โดยไม่มีค่าใช้จ่ายเพิ่มเติมสำหรับผู้ซื้อ";

export async function generateReviewScript(params: {
  title: string;
  duration: 15 | 30 | 60 | 90;
  brief?: AiBrief | null;
}): Promise<ReviewScript> {
  const config = getAiConfig();
  const started = Date.now();
  const hook = `${params.title} เหมาะกับใคร มาดูก่อนกดสั่งซื้อ`;
  const fallback: ReviewScript = {
    hook,
    problem: "หลายคนอยากรู้ว่าสินค้านี้ตอบโจทย์การใช้งานจริงหรือไม่",
    product_intro: `วันนี้เรามาดู ${params.title} แบบสั้น กระชับ และไม่อวยเกินจริง`,
    benefits: "สรุปจุดเด่นจากข้อมูลสินค้าและประสบการณ์ใช้งานที่ตรวจสอบได้",
    use_case: "เหมาะสำหรับผู้ชมที่ต้องการเปรียบเทียบก่อนตัดสินใจซื้อบน Shopee",
    cta: "ถ้าสนใจ ตรวจสอบรายละเอียด ราคา และเงื่อนไขล่าสุดได้ที่ลิงก์หน้าคลิป",
    affiliate_disclosure: THAI_AFFILIATE_DISCLOSURE,
    full_script: `${hook}\nหลายคนอยากรู้ว่าสินค้านี้ตอบโจทย์จริงไหม วันนี้เราสรุปจุดเด่น ข้อควรพิจารณา และวิธีเลือกซื้ออย่างปลอดภัย\n${THAI_AFFILIATE_DISCLOSURE}`,
    subtitle_lines: [hook, "สรุปจุดเด่นแบบไม่กล่าวอ้างเกินจริง", THAI_AFFILIATE_DISCLOSURE],
    prompt_version: PROMPT_VERSIONS.scriptGenerator,
    ai_provider: config.provider,
    ai_model: config.provider === "openai" ? config.model : "mock-local"
  };

  return callAiJson<ReviewScript>({
    systemPrompt: scriptGeneratorSystemPrompt,
    userPrompt: JSON.stringify(params),
    fallback,
    onFallback: async (error) => {
      await logAiTask({
        task_type: "script_generation",
        prompt_version: fallback.prompt_version,
        ai_provider: "openai",
        ai_model: config.model,
        input_payload: params,
        output_payload: fallback,
        error_message: error instanceof Error ? error.message : "Unknown OpenAI error",
        latency_ms: Date.now() - started,
        status: "fallback"
      });
    }
  });
}
