function handlePrivateMessage(event, sendAction) {
  const message = String(event.raw_message || "").trim();
  console.log(`[私聊 ${event.user_id}] ${event.sender?.nickname || "用户"}: ${message}`);

  if (message === "你好") {
    sendAction("send_private_msg", {
      user_id: event.user_id,
      message: "你好！机器人已收到你的消息。",
    });
  }
}

module.exports = { handlePrivateMessage };
