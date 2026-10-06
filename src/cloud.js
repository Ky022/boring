function read(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}
let configured = read("astral-api-base");
export const cloud = {
  base: configured,
  user: null,
  revision: 0,
  rating: 1000,
  guild: null,
  token: "",
  status: "offline",
};
function sessionKey() {
  return "astral-session:" + cloud.base;
}
export function connect(base) {
  const url = new URL(base);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("服务器网址必须是 HTTPS");
  cloud.base = url.origin;
  cloud.token = read(sessionKey());
  cloud.user = null;
  cloud.status = "offline";
  try {
    localStorage.setItem("astral-api-base", cloud.base);
  } catch {}
}
export async function api(path, data) {
  if (!cloud.base) throw new Error("尚未连接云端服务器");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(cloud.base + "/api" + path, {
      method: data === undefined ? "GET" : "POST",
      headers: {
        ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(cloud.token ? { Authorization: "Bearer " + cloud.token } : {}),
      },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
      signal: controller.signal,
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("这不是可用的游戏服务器");
    }
    if (!response.ok) {
      const error = new Error(result.error || "请求失败");
      error.status = response.status;
      throw error;
    }
    return result;
  } catch (e) {
    if (e instanceof TypeError || e.name === "AbortError")
      throw new Error("服务器连接失败，未确认的操作请先刷新云端存档");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
function accept(data) {
  cloud.user = data.user || cloud.user;
  cloud.revision = data.revision ?? cloud.revision;
  cloud.rating = data.rating ?? cloud.rating;
  if ("guild" in data) cloud.guild = data.guild;
  cloud.status = "online";
  return data;
}
export async function signIn(mode, username, password) {
  const result = await api("/" + mode, { username, password });
  cloud.token = result.token;
  try {
    localStorage.setItem(sessionKey(), cloud.token);
  } catch {}
  return accept(result);
}
export async function refreshCloud() {
  return accept(await api("/me"));
}
export async function mutate(action) {
  const payload = {
    requestId: crypto.randomUUID(),
    revision: cloud.revision,
    action,
  };
  let result;
  try {
    result = await api("/action", payload);
  } catch (e) {
    if (e.status) throw e;
    result = await api("/action", payload);
  }
  return accept(result);
}
export async function signOut() {
  await api("/logout", {});
  try {
    localStorage.removeItem(sessionKey());
  } catch {}
  cloud.token = "";
  cloud.user = null;
  cloud.guild = null;
  cloud.status = "offline";
}
export async function bootCloud() {
  if (!cloud.base && (location.hostname.endsWith('.workers.dev') || location.port === '8787')) connect(location.origin);
  if (!cloud.base) {
    try {
      const config = await fetch('./online-config.json').then(r => r.json());
      if (config.apiBase) connect(config.apiBase);
    } catch {}
  }
  cloud.token = cloud.base ? read(sessionKey()) : '';
  if (cloud.token) return refreshCloud();
  return null;
}
