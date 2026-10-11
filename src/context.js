const histories = new Map();
const maxTurns = 12;

function key(event) {
  return event.message_type === "group" ? `group:${event.group_id}` : `private:${event.user_id}`;
}

function add(event, role, content) {
  const history = histories.get(key(event)) || [];
  history.push({ role, content: String(content || "").slice(0, 2000) });
  histories.set(key(event), history.slice(-maxTurns));
}

function get(event) {
  return [...(histories.get(key(event)) || [])];
}

module.exports = { add, get };
