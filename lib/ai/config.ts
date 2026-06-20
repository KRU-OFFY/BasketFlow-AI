export const aiConfig = { provider: process.env.AI_PROVIDER ?? 'mock', model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini', apiKey: process.env.OPENAI_API_KEY };
export function shouldUseOpenAI() { return aiConfig.provider === 'openai' && Boolean(aiConfig.apiKey); }
