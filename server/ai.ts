interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function isAIEnabled(): boolean {
  return !!(process.env.AI_BASE_URL && process.env.AI_MODEL);
}

export function aiProviderName(): string | null {
  if (!isAIEnabled()) return null;
  try {
    const host = new URL(process.env.AI_BASE_URL as string).hostname;
    return host;
  } catch {
    return process.env.AI_MODEL ?? "custom";
  }
}

export async function aiChat(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  if (!isAIEnabled()) {
    throw new Error("AI endpoint is not configured");
  }
  const base = (process.env.AI_BASE_URL as string).replace(/\/+$/, "");
  const url = `${base}/chat/completions`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AI_API_KEY
          ? { Authorization: `Bearer ${process.env.AI_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 320,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI endpoint returned ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("AI endpoint returned an empty response");
    }
    return content;
  } finally {
    clearTimeout(timeout);
  }
}
