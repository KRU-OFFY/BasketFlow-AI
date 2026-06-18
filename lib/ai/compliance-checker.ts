import type { ComplianceResult } from "@/lib/types/domain";
import { PROMPT_VERSIONS } from "./prompt-versions";
import { getAiConfig } from "./config";
import { THAI_AFFILIATE_DISCLOSURE } from "./script-generator";

export const THAI_AI_CONTENT_LABEL = "วิดีโอนี้มีการใช้เสียงหรือภาพที่สร้างด้วย AI เพื่อประกอบการนำเสนอสินค้า";

const PROHIBITED_WORDS = ["หายขาด", "เห็นผลทันที", "ลดทันที", "ขาวถาวร", "ปลอดภัย 100%", "รวยเร็ว", "ไม่ต้องลงทุน", "การันตีผลลัพธ์", "ดีที่สุดในโลก"];

export function runRuleBasedCompliance(params: {
  script: string;
  usesAiVoiceOrAvatar?: boolean;
  hasAiContentLabel?: boolean;
}): ComplianceResult {
  const config = getAiConfig();
  const prohibited = PROHIBITED_WORDS.filter((word) => params.script.includes(word));
  const missing: string[] = [];
  if (!params.script.includes(THAI_AFFILIATE_DISCLOSURE)) missing.push("affiliate_disclosure");
  if (params.usesAiVoiceOrAvatar && !params.hasAiContentLabel) missing.push("ai_content_label");
  const status = prohibited.length ? "BLOCK" : missing.length ? "WARNING" : "PASS";
  const riskScore = Math.min(100, prohibited.length * 30 + missing.length * 15);

  return {
    status,
    risk_score: riskScore,
    issues: [
      ...prohibited.map((word) => `พบคำกล่าวอ้างต้องห้าม: ${word}`),
      ...missing.map((item) => `ขาดข้อกำหนด: ${item}`)
    ],
    prohibited_words: prohibited,
    missing_requirements: missing,
    suggested_fixes: prohibited.length
      ? ["ลบคำกล่าวอ้างที่เกินจริง", "ใช้ถ้อยคำตามหลักฐานและไม่รับประกันผลลัพธ์"]
      : missing.length
        ? ["เพิ่ม affiliate disclosure และ/หรือ AI content label ให้ครบ"]
        : ["พร้อมเข้าสู่ขั้นตอนอนุมัติ"],
    safe_rewrite: params.script
      .replaceAll("หายขาด", "อาจช่วยบรรเทาได้ตามเงื่อนไขการใช้งาน")
      .replaceAll("เห็นผลทันที", "ผลลัพธ์ขึ้นอยู่กับแต่ละบุคคล")
      .replaceAll("ปลอดภัย 100%", "ควรอ่านรายละเอียดและคำเตือนก่อนใช้งาน"),
    prompt_version: PROMPT_VERSIONS.complianceChecker,
    ai_provider: config.provider,
    ai_model: config.provider === "openai" ? config.model : "mock-local"
  };
}
