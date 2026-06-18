import { getAiConfig } from "./config";

export async function callOpenAiJson(systemPrompt: string, userPrompt: string) {
  const config = getAiConfig();
  if (config.provider !== "openai" || !config.apiKey) {
    throw new Error("OpenAI provider is not enabled");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty JSON response");
  }
  return JSON.parse(content) as unknown;
}
