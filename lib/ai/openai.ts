import { aiConfig, shouldUseOpenAI } from './config.ts';
export async function callOpenAIJson<T>(prompt: string): Promise<T> {
  if (!shouldUseOpenAI()) throw new Error('OpenAI disabled');
  const res = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${aiConfig.apiKey}`}, body: JSON.stringify({ model: aiConfig.model, response_format:{type:'json_object'}, messages:[{role:'user', content:prompt}] }) });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content) as T;
}
