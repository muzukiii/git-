function getProfile(event) {
  const sender = event.sender || {};
  const name = String(sender.card || sender.nickname || event.user_id || "朋友").trim() || "朋友";
  const qq = String(event.user_id || "");
  return {
    name,
    address: `${name}哥哥`,
    qq,
    avatarUrl: qq ? `https://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(qq)}&s=640` : "",
    groupName: event.message_type === "group" ? String(event.group_name || `群聊 ${event.group_id}`) : "",
  };
}

module.exports = { getProfile };
