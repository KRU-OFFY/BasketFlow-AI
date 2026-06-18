import { getAiConfig } from "./config";
import { callOpenAiJson } from "./openai";

export async function callAiJson<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  fallback: T;
  onFallback?: (error: unknown) => Promise<void> | void;
}): Promise<T> {
  const config = getAiConfig();
  if (config.provider !== "openai") {
    return params.fallback;
  }

  try {
    return (await callOpenAiJson(params.systemPrompt, params.userPrompt)) as T;
  } catch (error) {
    await params.onFallback?.(error);
    return params.fallback;
  }
}
