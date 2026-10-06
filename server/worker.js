import { fresh, migrate, applyAction, teamPower, heroes } from "../src/game.js";
class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const fail = (message, status = 400) => {
  throw new ApiError(message, status);
};
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
const hex = (bytes) =>
  Array.from(new Uint8Array(bytes), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
const digest = async (text) =>
  hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return hex(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: new TextEncoder().encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256,
    ),
  );
}
const stmt = (db, sql, ...args) => db.prepare(sql).bind(...args);
async function limited(db, key, max) {
  const window = Math.floor(Date.now() / 60000);
  const row = await stmt(
    db,
    "INSERT INTO rate_limits(key,window,hits) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN window=excluded.window THEN hits+1 ELSE 1 END,window=excluded.window RETURNING hits",
    key,
    window,
  ).first();
  if (row.hits > max) fail("操作太频繁，请稍后重试", 429);
}
async function body(request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    fail("需要 JSON 请求", 415);
  const text = await request.text();
  if (text.length > 4096) fail("请求过大", 413);
  try {
    const result = JSON.parse(text);
    if (!result || typeof result !== "object" || Array.isArray(result))
      fail("请求格式无效");
    return result;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    fail("请求格式无效");
  }
}
async function auth(request, db) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!token || token.length > 200) fail("请先登录", 401);
  const row = await stmt(
    db,
    "SELECT a.id,a.username FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_ms>?",
    await digest(token),
    Date.now(),
  ).first();
  if (!row) fail("登录已过期，请重新登录", 401);
  return row;
}
async function player(db, id) {
  const row = await stmt(
    db,
    "SELECT state_json,revision,rating FROM players WHERE account_id=?",
    id,
  ).first();
  if (!row) fail("存档不存在", 404);
  const state = migrate(JSON.parse(row.state_json));
  if (!state) fail("存档需要管理员修复", 500);
  return { state, revision: row.revision, rating: row.rating };
}
async function guildData(db, id) {
  const row = await stmt(
    db,
    "SELECT g.* FROM members m JOIN guilds g ON g.id=m.guild_id WHERE m.account_id=?",
    id,
  ).first();
  if (!row) return null;
  const members = (
    await stmt(
      db,
      "SELECT a.id,a.username,m.contribution,p.state_json,p.rating FROM members m JOIN accounts a ON a.id=m.account_id JOIN players p ON p.account_id=a.id WHERE m.guild_id=? ORDER BY m.contribution DESC",
      row.id,
    ).all()
  ).results;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    owner: row.owner_id,
    bossHp: row.boss_hp,
    bossRound: row.boss_round,
    bossMax: 3000 + Math.max(0, row.boss_round - 1) * 1000,
    revision: row.revision,
    members: members.map((m) => ({
      id: m.id,
      name: m.username,
      contribution: m.contribution,
      power: teamPower(migrate(JSON.parse(m.state_json))),
      rating: m.rating,
    })),
  };
}
async function me(db, user) {
  return {
    ...(await player(db, user.id)),
    user,
    guild: await guildData(db, user.id),
  };
}
async function login(db, action, input, request) {
  const username = String(input.username || "").trim(),
    password = input.password;
  if (!/^[\p{L}\p{N}_-]{2,20}$/u.test(username))
    fail("昵称需要 2–20 个字母、数字、汉字、_ 或 -");
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 72
  )
    fail("密码需要 8–72 个字符");
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  await limited(db, "auth:" + (await digest(ip)), 20);
  let account;
  if (action === "register") {
    if (
      await stmt(
        db,
        "SELECT id FROM accounts WHERE username=?",
        username,
      ).first()
    )
      fail("昵称已被使用", 409);
    const id = crypto.randomUUID(),
      salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await passwordHash(password, salt);
    try {
      await db.batch([
        stmt(
          db,
          "INSERT INTO accounts VALUES(?,?,?,?,?)",
          id,
          username,
          salt,
          hash,
          Date.now(),
        ),
        stmt(
          db,
          "INSERT INTO players(account_id,state_json,updated_ms) VALUES(?,?,?)",
          id,
          JSON.stringify(fresh()),
          Date.now(),
        ),
      ]);
    } catch {
      fail("昵称已被使用，请换一个", 409);
    }
    account = { id, username };
  } else {
    const row = await stmt(
      db,
      "SELECT * FROM accounts WHERE username=?",
      username,
    ).first();
    const salt = row?.salt || "dummy-login-salt";
    const hash = await passwordHash(password, salt);
    if (!row || hash !== row.password_hash) fail("昵称或密码错误", 401);
    account = { id: row.id, username: row.username };
  }
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  await db.batch([
    stmt(db, "DELETE FROM sessions WHERE expires_ms<?", Date.now()),
    stmt(
      db,
      "INSERT INTO sessions VALUES(?,?,?)",
      await digest(token),
      account.id,
      Date.now() + 7 * 86400000,
    ),
  ]);
  return { token, ...(await me(db, account)) };
}
async function gameAction(db, user, input) {
  if (!/^[a-f\d-]{36}$/i.test(input.requestId || "")) fail("请求编号无效");
  const cached = await stmt(
    db,
    "SELECT result_json FROM commands WHERE account_id=? AND request_id=?",
    user.id,
    input.requestId,
  ).first();
  if (cached) return JSON.parse(cached.result_json);
  const p = await player(db, user.id);
  if (input.revision !== p.revision)
    fail("存档已在其他设备更新，请刷新后重试", 409);
  const action = input.action;
  if (!action || typeof action.type !== "string") fail("操作无效");
  const state = p.state;
  let result,
    guild = null,
    statements = [],
    ratingDelta = 0;
  if (action.type === "boss") {
    guild = await guildData(db, user.id);
    if (!guild) fail("请先加入公会");
    if (!state.team.length) fail("请先编成队伍");
    if (state.coins < 100) fail("挑战需要 100 金币");
    if (guild.bossHp <= 0) fail("守卫已击败，请等待下一轮");
    const damage = Math.round(teamPower(state) * (0.9 + random() * 0.2)),
      defeated = damage >= guild.bossHp;
    state.coins -= 100;
    state.coins += 150;
    state.gems += defeated ? 200 : 20;
    const hp = defeated
      ? 3000 + guild.bossRound * 1000
      : Math.max(0, guild.bossHp - damage);
    result = { damage, defeated, reward: defeated ? 200 : 20, coins: 150 };
    statements.push(
      stmt(
        db,
        "UPDATE guilds SET boss_hp=?,boss_round=boss_round+?,revision=revision+1 WHERE id=? AND revision=? AND EXISTS(SELECT 1 FROM players WHERE account_id=? AND revision=?)",
        hp,
        defeated ? 1 : 0,
        guild.id,
        guild.revision,
        user.id,
        p.revision,
      ),
    );
  } else if (action.type === "arena") {
    if (action.opponent === user.id) fail("不能挑战自己");
    const opponent = await stmt(
      db,
      "SELECT a.username,p.state_json FROM accounts a JOIN players p ON p.account_id=a.id WHERE a.id=?",
      action.opponent || "",
    ).first();
    if (!opponent) fail("对手不存在", 404);
    if (!state.team.length) fail("请先编成队伍");
    const day = new Date().toISOString().slice(0, 10);
    if (state.arenaDay !== day) {
      state.arenaDay = day;
      state.arenaAttempts = 0;
    }
    if (state.arenaAttempts >= 5) fail("今日 5 次竞技挑战已用完，UTC 零点刷新");
    const defender = migrate(JSON.parse(opponent.state_json));
    if (!defender.team.length) fail("对手没有已保存的队伍");
    state.arenaAttempts++;
    const dealt = Math.round(teamPower(state) * (0.9 + random() * 0.2)),
      target = Math.round(teamPower(defender) * (0.9 + random() * 0.2)),
      won = dealt >= target;
    state.coins += won ? 200 : 80;
    ratingDelta = won ? 15 : -8;
    result = {
      won,
      dealt,
      target,
      reward: 0,
      coins: won ? 200 : 80,
      opponent: opponent.username,
      ratingDelta,
    };
  } else {
    try {
      result = applyAction(state, action, random);
    } catch (e) {
      fail(e.message);
    }
  }
  const output = {
    state,
    revision: p.revision + 1,
    rating: Math.max(0, p.rating + ratingDelta),
    result,
  };
  const guard = guild
    ? " AND EXISTS(SELECT 1 FROM guilds WHERE id=? AND revision=?)"
    : "";
  const args = [
    JSON.stringify(state),
    ratingDelta,
    Date.now(),
    input.requestId,
    user.id,
    p.revision,
  ];
  if (guild) args.push(guild.id, guild.revision + 1);
  statements.push(
    stmt(
      db,
      "UPDATE players SET state_json=?,revision=revision+1,rating=MAX(0,rating+?),updated_ms=?,last_command=? WHERE account_id=? AND revision=?" +
        guard,
      ...args,
    ),
  );
  statements.push(
    stmt(
      db,
      "INSERT INTO commands(account_id,request_id,result_json,created_ms) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM players WHERE account_id=? AND last_command=?)",
      user.id,
      input.requestId,
      JSON.stringify(output),
      Date.now(),
      user.id,
      input.requestId,
    ),
  );
  if (guild)
    statements.push(
      stmt(
        db,
        "UPDATE members SET contribution=contribution+? WHERE account_id=? AND guild_id=? AND EXISTS(SELECT 1 FROM commands WHERE account_id=? AND request_id=?)",
        result.damage,
        user.id,
        guild.id,
        user.id,
        input.requestId,
      ),
    );
  if (action.type === "arena")
    statements.push(
      stmt(
        db,
        "INSERT INTO duels(id,attacker,defender,result_json,created_ms) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM commands WHERE account_id=? AND request_id=?)",
        input.requestId,
        user.id,
        action.opponent,
        JSON.stringify(result),
        Date.now(),
        user.id,
        input.requestId,
      ),
    );
  try {
    const written = await db.batch(statements);
    if (!written[guild ? 1 : 0].meta.changes)
      fail("有人刚更新了数据，请刷新后重试", 409);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const existing = await stmt(
      db,
      "SELECT result_json FROM commands WHERE account_id=? AND request_id=?",
      user.id,
      input.requestId,
    ).first();
    if (existing) return JSON.parse(existing.result_json);
    throw e;
  }
  if (guild) output.guild = await guildData(db, user.id);
  return output;
}
async function route(request, env) {
  const url = new URL(request.url),
    db = env.DB,
    path = url.pathname,
    method = request.method;
  if (path === "/api/health" && method === "GET") {
    await stmt(db, "SELECT version FROM schema_metadata").first();
    return { ok: true, storage: "Cloudflare D1", schema: 1 };
  }
  if (["/api/register", "/api/login"].includes(path) && method === "POST")
    return login(db, path.slice(5), await body(request), request);
  const user = await auth(request, db);
  if (path === "/api/me" && method === "GET") return me(db, user);
  if (path === "/api/logout" && method === "POST") {
    await stmt(
      db,
      "DELETE FROM sessions WHERE token_hash=?",
      await digest(request.headers.get("Authorization").slice(7)),
    ).run();
    return { ok: true };
  }
  if (method === "POST") await limited(db, "actions:" + user.id, 60);
  if (path === "/api/action" && method === "POST")
    return gameAction(db, user, await body(request));
  if (path === "/api/guild" && method === "GET")
    return { guild: await guildData(db, user.id) };
  if (path === "/api/guild/create" && method === "POST") {
    const input = await body(request),
      name = String(input.name || "").trim();
    if (name.length < 2 || name.length > 20) fail("公会名称需要 2–20 个字");
    if (await guildData(db, user.id)) fail("请先退出当前公会");
    const id = crypto.randomUUID(),
      code = hex(crypto.getRandomValues(new Uint8Array(4))).toUpperCase();
    try {
      await db.batch([
        stmt(
          db,
          "INSERT INTO guilds(id,code,name,owner_id) VALUES(?,?,?,?)",
          id,
          code,
          name,
          user.id,
        ),
        stmt(
          db,
          "INSERT INTO members(account_id,guild_id) VALUES(?,?)",
          user.id,
          id,
        ),
      ]);
    } catch {
      fail("公会创建冲突，请刷新后重试", 409);
    }
    return { guild: await guildData(db, user.id) };
  }
  if (path === "/api/guild/join" && method === "POST") {
    const input = await body(request);
    if (await guildData(db, user.id)) fail("请先退出当前公会");
    const guild = await stmt(
      db,
      "SELECT id FROM guilds WHERE code=?",
      String(input.code || "")
        .trim()
        .toUpperCase(),
    ).first();
    if (!guild) fail("邀请码无效", 404);
    const result = await stmt(
      db,
      "INSERT INTO members(account_id,guild_id) SELECT ?,? WHERE (SELECT COUNT(*) FROM members WHERE guild_id=?)<30",
      user.id,
      guild.id,
      guild.id,
    ).run();
    if (!result.meta.changes) fail("公会已满（30 人）");
    return { guild: await guildData(db, user.id) };
  }
  if (path === "/api/guild/leave" && method === "POST") {
    const guild = await guildData(db, user.id);
    if (!guild) fail("尚未加入公会");
    await db.batch([
      stmt(
        db,
        "UPDATE guilds SET owner_id=COALESCE((SELECT account_id FROM members WHERE guild_id=? AND account_id<>? ORDER BY contribution DESC LIMIT 1),owner_id) WHERE id=? AND owner_id=?",
        guild.id,
        user.id,
        guild.id,
        user.id,
      ),
      stmt(db, "DELETE FROM members WHERE account_id=?", user.id),
      stmt(
        db,
        "DELETE FROM guilds WHERE id=? AND NOT EXISTS(SELECT 1 FROM members WHERE guild_id=?)",
        guild.id,
        guild.id,
      ),
    ]);
    return { guild: null };
  }
  if (path === "/api/chat" && ["GET", "POST"].includes(method)) {
    const input = method === "POST" ? await body(request) : null;
    const requested =
      method === "POST" ? input.channel : url.searchParams.get("channel");
    let channel = "world";
    if (requested === "guild") {
      const guild = await guildData(db, user.id);
      if (!guild) fail("请先加入公会", 403);
      channel = "guild:" + guild.id;
    } else if (requested !== "world") fail("聊天频道无效");
    if (method === "POST") {
      await limited(db, "chat:" + user.id, 10);
      const text = typeof input.text === "string" ? input.text.trim() : "";
      if (!text || text.length > 300) fail("消息需要 1–300 个字符");
      await stmt(
        db,
        "INSERT INTO messages(channel,sender_id,text,created_ms) VALUES(?,?,?,?)",
        channel,
        user.id,
        text,
        Date.now(),
      ).run();
    }
    const after = Number(url.searchParams.get("after") || 0);
    if (!Number.isSafeInteger(after) || after < 0) fail("消息游标无效");
    const rows = (
      await stmt(
        db,
        "SELECT m.id,m.text,m.created_ms AS time,a.username AS name,a.id AS sender FROM messages m JOIN accounts a ON a.id=m.sender_id WHERE m.channel=? AND m.id>? ORDER BY m.id DESC LIMIT 60",
        channel,
        after,
      ).all()
    ).results;
    return { messages: rows.reverse() };
  }
  if (path === "/api/arena" && method === "GET") {
    const rows = (
      await stmt(
        db,
        "SELECT a.id,a.username,p.rating,p.state_json FROM accounts a JOIN players p ON p.account_id=a.id WHERE a.id<>? ORDER BY p.rating DESC LIMIT 30",
        user.id,
      ).all()
    ).results;
    return {
      opponents: rows.map((r) => {
        const state = migrate(JSON.parse(r.state_json));
        return {
          id: r.id,
          name: r.username,
          rating: r.rating,
          power: teamPower(state),
          team: state.team.map((id) => heroes[id]),
        };
      }),
      history: (
        await stmt(
          db,
          "SELECT d.result_json,d.created_ms AS time,a.username AS opponent FROM duels d JOIN accounts a ON a.id=d.defender WHERE d.attacker=? ORDER BY d.created_ms DESC LIMIT 10",
          user.id,
        ).all()
      ).results.map((r) => ({
        ...JSON.parse(r.result_json),
        time: r.time,
        opponent: r.opponent,
      })),
    };
  }
  fail("接口不存在", 404);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const origin = request.headers.get("Origin");
    const allowed =
      !origin || origin === url.origin || origin === env.ALLOWED_ORIGIN;
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      Vary: "Origin",
    };
    if (origin && allowed) headers["Access-Control-Allow-Origin"] = origin;
    if (!allowed)
      return new Response(JSON.stringify({ error: "此来源未获授权" }), {
        status: 403,
        headers,
      });
    if (request.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: {
          ...headers,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Max-Age": "600",
        },
      });
    try {
      return new Response(JSON.stringify(await route(request, env)), {
        headers,
      });
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      if (status === 500) console.error("API failure:", error.name);
      return new Response(
        JSON.stringify({
          error:
            status === 500 ? "服务器暂时不可用，请稍后再试" : error.message,
        }),
        { status, headers },
      );
    }
  },
};
