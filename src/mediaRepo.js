const crypto = require("node:crypto");

function parseRepo(url) {
  const match = String(url || "").match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/);
  if (!match) throw new Error("MEDIA_REPO_URL 格式无效");
  return { owner: match[1], repo: match[2] };
}

function createMediaRepo({ repoUrl, token }) {
  if (!repoUrl || !token) {
    console.warn("未配置 MEDIA_REPO_URL 或 MEDIA_REPO_TOKEN，媒体仓库功能未启用。");
    return null;
  }

  const repo = parseRepo(repoUrl);
  const api = `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "onebot-node-bot",
  };
  let images = [];

  async function loadIndex() {
    try {
      const response = await fetch(`${api}/index.json`, { headers });
      if (!response.ok) return;
      const data = await response.json();
      images = JSON.parse(Buffer.from(data.content, "base64").toString("utf8"));
    } catch (error) {
      console.error("读取媒体仓库索引失败:", error.message);
    }
  }

  async function put(path, content, message, sha) {
    const response = await fetch(`${api}/${path}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ message, content, ...(sha ? { sha } : {}) }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`GitHub HTTP ${response.status}: ${detail.slice(0, 240)}`);
    }
    return response.json();
  }

  async function saveIndex(retry = true) {
    let sha;
    try {
      const response = await fetch(`${api}/index.json`, { headers });
      if (response.ok) sha = (await response.json()).sha;
    } catch {}
    try {
      await put("index.json", Buffer.from(JSON.stringify(images, null, 2)).toString("base64"), "Update media index", sha);
    } catch (error) {
      if (!retry || !String(error.message).includes("GitHub HTTP 422")) throw error;
      await loadIndex();
      await saveIndex(false);
    }
  }

  return {
    async addImages(urls) {
      await loadIndex();
      for (const url of urls || []) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          const buffer = Buffer.from(await response.arrayBuffer());
          const hash = crypto.createHash("sha256").update(buffer).digest("hex");
          const type = response.headers.get("content-type") || "image/jpeg";
          const ext = type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
          const name = `images/${hash}.${ext}`;
          if (!images.some((item) => item.path === name)) {
            await put(name, buffer.toString("base64"), "Add QQ image");
            images.push({ path: name, url: `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/main/${name}` });
          }
        } catch (error) {
          console.error("上传图片失败:", error.message);
        }
      }
      await saveIndex();
    },
    randomImage() {
      return images.length ? images[Math.floor(Math.random() * images.length)].url : null;
    },
  };
}

module.exports = { createMediaRepo };
