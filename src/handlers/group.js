function handleGroupMessage(event, sendAction) {
  const message = String(event.raw_message || "").trim();
  console.log(`[群 ${event.group_id}] ${event.sender?.nickname || event.user_id}: ${message}`);

  if (message === "/help") {
    sendAction("send_group_msg", {
      group_id: event.group_id,
      message: "可用命令：/help",
    });
  }
}

module.exports = { handleGroupMessage };
