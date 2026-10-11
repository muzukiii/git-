# Node.js OneBot QQ 机器人

一个面向 OneBot v11 的 Node.js 机器人骨架，支持群聊和私聊消息处理。

## 使用

要求：Node.js 18 或更高版本。

```powershell
npm install
Copy-Item .env.example .env
# 编辑 .env，填写 OneBot WebSocket 地址和访问令牌（如有）
npm start
```

机器人不会保存 QQ 账号信息。QQ 登录、OneBot 服务和账号相关配置由你负责。

默认行为：

- 私聊发送 `你好` 时回复问候语。
- 群聊发送 `/help` 时返回帮助信息。
- 其他消息只打印到控制台，便于继续开发业务逻辑。

## 目录

- `src/index.js`：WebSocket 客户端和事件分发
- `src/handlers/group.js`：群聊处理器
- `src/handlers/private.js`：私聊处理器
- `.env.example`：运行配置示例

