const endpoint = "https://api.deepseek.com/chat/completions";

function createDeepSeekClient({ apiKey, model }) {
  if (!apiKey) {
    console.warn("未配置 DEEPSEEK_API_KEY，AI 回复功能未启用。");
    return null;
  }

  return async function askDeepSeek(message) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "你是一个简洁、友好的 QQ 群聊和私聊助手。" },
          { role: "user", content: message },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek 返回内容为空");
    return content;
  };
}

module.exports = { createDeepSeekClient };
