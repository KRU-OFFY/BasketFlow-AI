import type { AiLog, Product, ReviewProject } from "@/lib/types/domain";

export const demoProducts: Product[] = [
  {
    id: "demo-product-1",
    title: "กล้องไลฟ์สตรีม Mini Creator Cam",
    category: "Electronics",
    shopee_affiliate_link: "https://shopee.co.th/demo-affiliate",
    product_image_url: "https://placehold.co/600x400/312e81/ffffff?text=Creator+Cam",
    price: 1290,
    commission_rate: 8,
    risk_flags: [],
    created_at: new Date().toISOString()
  }
];

export const demoProjects: ReviewProject[] = [
  {
    id: "demo-project-1",
    product_id: "demo-product-1",
    title: "รีวิวกล้องไลฟ์สตรีมสำหรับครีเอเตอร์",
    status: "pending_approval",
    compliance_status: "PASS",
    approval_status: "pending",
    has_affiliate_disclosure: true,
    has_ai_content_label: true,
    created_at: new Date().toISOString()
  }
];

export const demoAiLogs: AiLog[] = [
  {
    id: "demo-log-1",
    task_type: "brief_generation",
    prompt_version: "product-analyzer-v1.0.0",
    ai_provider: "mock",
    ai_model: "mock-local",
    input_payload: { productId: "demo-product-1" },
    output_payload: { status: "success" },
    error_message: null,
    latency_ms: 12,
    status: "success",
    created_at: new Date().toISOString()
  }
];
