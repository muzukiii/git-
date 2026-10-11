const fs = require("node:fs");
const path = require("node:path");

const endpoint = "https://api.deepseek.com/chat/completions";
const defaultPersona = "你是一个简洁、友好的 QQ 群聊和私聊 AI 助手。请保持自然、尊重和有帮助。";

function loadPersona() {
  const file = path.join(__dirname, "..", "PERSONA.txt");
  try {
    const persona = fs.readFileSync(file, "utf8").trim();
    return persona || defaultPersona;
  } catch {
    return defaultPersona;
  }
}

function createDeepSeekClient({ apiKey, model, visionModel }) {
  if (!apiKey) {
    console.warn("未配置 DEEPSEEK_API_KEY，AI 回复功能未启用。");
    return null;
  }

  return async function askDeepSeek(message, images = [], history = [], profile = {}) {
    const userContent = images.length
      ? [
          { type: "text", text: message || "请描述这张图片，并结合聊天上下文回答。" },
          ...images.map((url) => ({ type: "image_url", image_url: { url } })),
        ]
      : message;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: images.length ? visionModel || model : model,
        messages: [
          { role: "system", content: `${loadPersona()}\n结合最近对话理解语境，只输出最终回复。当前对象信息：昵称“${profile.name || "朋友"}”，建议称呼“${profile.address || "朋友哥哥"}”，QQ号“${profile.qq || "未知"}”，所在群“${profile.groupName || "私聊"}”。头像地址：${profile.avatarUrl || "未知"}。请自然使用称呼，不要机械重复。` },
          ...history,
          { role: "user", content: userContent },
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
