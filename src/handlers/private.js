const context = require("../context");
const { getProfile } = require("../profile");

async function handlePrivateMessage(event, sendAction, askDeepSeek, images = [], mediaRepo) {
  const message = String(event.raw_message || "").trim();
  console.log(`[私聊 ${event.user_id}] ${event.sender?.nickname || "用户"}: ${message}`);

  if (!message || !askDeepSeek) return;
  context.add(event, "user", message);
  const profile = getProfile(event);
  try {
    const reply = await askDeepSeek(message, images, context.get(event), profile);
    context.add(event, "assistant", reply);
    const recent = context.get(event).map((item) => item.content).join(" ");
    const clearMood = /哈哈|笑死|太逗|开心|谢谢|感谢|惊讶|哇|无语|加油/.test(`${recent} ${reply}`);
    const sticker = clearMood && mediaRepo?.randomSticker();
    sendAction("send_private_msg", {
      user_id: event.user_id,
      message: sticker ? [{ type: "text", data: { text: reply } }, sticker] : reply,
    });
  } catch (error) {
    console.error("私聊 AI 回复失败:", error.message);
  }
}

module.exports = { handlePrivateMessage };
