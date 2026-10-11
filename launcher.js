require("dotenv").config();

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const lockPath = path.join(__dirname, ".bot.pid");
try {
  const fd = fs.openSync(lockPath, "wx");
  fs.writeFileSync(fd, String(process.pid));
  fs.closeSync(fd);
} catch {
  console.error("机器人已有实例运行，本次启动已取消。");
  process.exit(1);
}

function releaseLock() {
  try { fs.unlinkSync(lockPath); } catch {}
}
process.on("exit", releaseLock);
process.on("SIGINT", () => { releaseLock(); process.exit(0); });
process.on("SIGTERM", () => { releaseLock(); process.exit(0); });

const proxy = process.env.DEEPSEEK_PROXY;
if (proxy) {
  process.env.HTTPS_PROXY = proxy;
  process.env.HTTP_PROXY = proxy;
}
process.env.NO_PROXY = [process.env.NO_PROXY, "127.0.0.1", "localhost"]
  .filter(Boolean)
  .join(",");

const child = spawn(process.execPath, ["--use-env-proxy", "src/index.js"], {
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error("启动机器人失败:", error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
