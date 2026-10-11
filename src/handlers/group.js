async function handleGroupMessage(event, sendAction, askDeepSeek) {
  const message = String(event.raw_message || "").trim();
  console.log(`[群 ${event.group_id}] ${event.sender?.nickname || event.user_id}: ${message}`);

  if (message === "/help") {
    sendAction("send_group_msg", {
      group_id: event.group_id,
      message: "可用命令：/help",
    });
    return;
  }

  if (!message || !askDeepSeek) return;
  try {
    const reply = await askDeepSeek(message);
    sendAction("send_group_msg", { group_id: event.group_id, message: reply });
  } catch (error) {
    console.error("群聊 AI 回复失败:", error.message);
  }
}

module.exports = { handleGroupMessage };
