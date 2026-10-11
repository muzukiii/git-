const fs = require("node:fs");
const path = require("node:path");

const cacheFile = path.join(__dirname, "..", "data", "stickers.json");
const maxStickers = 100;

function readStickers() {
  try {
    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  } catch {
    return [];
  }
}

function collectStickers(segments) {
  if (!Array.isArray(segments)) return;
  const stickers = readStickers();

  for (const segment of segments) {
    if (!segment || !["face", "mface", "image"].includes(segment.type)) continue;
    const data = segment.data || {};
    if (segment.type === "image" && !/动画表情|表情包|贴纸/.test(data.summary || "")) continue;

    const signature = `${segment.type}:${data.id || data.file || data.url || data.summary || "unknown"}`;
    if (stickers.some((item) => item.signature === signature)) continue;
    stickers.push({ signature, segment, savedAt: new Date().toISOString() });
  }

  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(stickers.slice(-maxStickers), null, 2));
}

function chooseSticker(reply) {
  const stickers = readStickers();
  if (!stickers.length) return null;

  const text = String(reply || "");
  let preferred;
  if (/哈哈|笑死|好笑|开心|太逗/.test(text)) preferred = ["face", "mface", "image"];
  else if (/谢谢|感谢|辛苦/.test(text)) preferred = ["face", "mface"];
  else if (/惊讶|居然|竟然|哇|天哪/.test(text)) preferred = ["mface", "face", "image"];
  else return null;

  const candidates = stickers.filter((item) => preferred.includes(item.segment.type));
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)].segment : null;
}

module.exports = { collectStickers, chooseSticker };
