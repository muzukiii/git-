async function handlePrivateMessage(event, sendAction, askDeepSeek) {
  const message = String(event.raw_message || "").trim();
  console.log(`[私聊 ${event.user_id}] ${event.sender?.nickname || "用户"}: ${message}`);

  if (!message || !askDeepSeek) return;
  try {
    const reply = await askDeepSeek(message);
    sendAction("send_private_msg", { user_id: event.user_id, message: reply });
  } catch (error) {
    console.error("私聊 AI 回复失败:", error.message);
  }
}

module.exports = { handlePrivateMessage };
