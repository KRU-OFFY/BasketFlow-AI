export type AiProvider = "mock" | "openai";

export function getAiConfig() {
  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase() as AiProvider;
  const apiKey = process.env.OPENAI_API_KEY;
  return {
    provider: provider === "openai" && apiKey ? "openai" : "mock",
    requestedProvider: provider,
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    apiKey
  };
}
