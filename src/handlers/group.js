const context = require("../context");

async function handleGroupMessage(event, sendAction, askDeepSeek, images = [], mediaRepo) {
  const message = String(event.raw_message || "").replace(/\[CQ:at,qq=\d+(?:,[^\]]+)?\]\s*/g, "").trim();
  console.log(`[群 ${event.group_id}] ${event.sender?.nickname || event.user_id}: ${message}`);

  const botId = String(event.self_id || "");
  const mentionedBot = Array.isArray(event.message)
    ? event.message.some((segment) => segment.type === "at" && String(segment.data?.qq) === botId)
    : new RegExp(`\\[CQ:at,qq=${botId}(?:,|\\])`).test(message);
  if (!mentionedBot) return;
  context.add(event, "user", message);

  if (message === "/help") {
    sendAction("send_group_msg", {
      group_id: event.group_id,
      message: "可用命令：/help",
    });
    return;
  }

  if (!message || !askDeepSeek) return;
  try {
    const reply = await askDeepSeek(message, images, context.get(event));
    context.add(event, "assistant", reply);
    const recent = context.get(event).map((item) => item.content).join(" ");
    const clearMood = /哈哈|笑死|太逗|开心|谢谢|感谢|惊讶|哇|无语|加油/.test(`${recent} ${reply}`);
    const sticker = clearMood && mediaRepo?.randomImage();
    sendAction("send_group_msg", {
      group_id: event.group_id,
      message: sticker ? [{ type: "text", data: { text: reply } }, { type: "image", data: { file: sticker } }] : reply,
    });
  } catch (error) {
    console.error("群聊 AI 回复失败:", error.message);
  }
}

module.exports = { handleGroupMessage };
