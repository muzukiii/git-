require("dotenv").config();

const WebSocket = require("ws");
const { handleGroupMessage } = require("./handlers/group");
const { handlePrivateMessage } = require("./handlers/private");
const { createDeepSeekClient } = require("./deepseek");
const { createMediaRepo } = require("./mediaRepo");

const wsUrl = process.env.ONEBOT_WS_URL;
const token = process.env.ONEBOT_ACCESS_TOKEN;
const reconnectDelay = Number(process.env.RECONNECT_DELAY_MS || 5000);
const askDeepSeek = createDeepSeekClient({
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  visionModel: process.env.DEEPSEEK_VISION_MODEL || process.env.DEEPSEEK_MODEL || "deepseek-chat",
});
const mediaRepo = createMediaRepo({ repoUrl: process.env.MEDIA_REPO_URL, token: process.env.MEDIA_REPO_TOKEN });

if (!wsUrl) {
  console.error("缺少 ONEBOT_WS_URL，请复制 .env.example 为 .env 后配置。");
  process.exit(1);
}

let socket;
let stopping = false;

function connect() {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  console.log(`连接 OneBot: ${wsUrl}`);
  socket = new WebSocket(wsUrl, { headers });

  socket.on("open", () => console.log("OneBot WebSocket 已连接"));
  socket.on("message", async (data) => {
    try {
      const event = JSON.parse(data.toString());
      if (event.post_type !== "message") return;
      const images = Array.isArray(event.message)
        ? event.message
            .filter((segment) => segment.type === "image")
            .map((segment) => segment.data?.url)
            .filter(Boolean)
        : [];
      if (mediaRepo && images.length) await mediaRepo.addImages(images);

      if (event.message_type === "group") {
        handleGroupMessage(event, sendAction, askDeepSeek, images, mediaRepo);
      } else if (event.message_type === "private") {
        handlePrivateMessage(event, sendAction, askDeepSeek, images, mediaRepo);
      }
    } catch (error) {
      console.error("处理事件失败:", error.message);
    }
  });
  socket.on("error", (error) => console.error("WebSocket 错误:", error.message));
  socket.on("close", () => {
    if (!stopping) {
      console.log(`连接已断开，${reconnectDelay}ms 后重连`);
      setTimeout(connect, reconnectDelay);
    }
  });
}

function sendAction(action, params) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ action, params }));
}

function shutdown(signal) {
  stopping = true;
  console.log(`收到 ${signal}，正在退出`);
  if (socket) socket.close();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
connect();
