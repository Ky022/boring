import { heroes, migrate, power, teamPower } from "../src/game.js";
const stmt = (db, sql, ...args) => db.prepare(sql).bind(...args);
const fail = (message, status = 400) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
export function weekKey(now = Date.now()) {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
export const weeklyTasks = [
  {
    id: "damage",
    key: "damage",
    goal: 3000,
    name: "全公会造成 3,000 点伤害",
    gems: 150,
    coins: 500,
  },
  {
    id: "hits",
    key: "hits",
    goal: 10,
    name: "全公会挑战 Boss 十次",
    gems: 150,
    coins: 500,
  },
  {
    id: "kills",
    key: "kills",
    goal: 1,
    name: "共同击败一轮 Boss",
    gems: 300,
    coins: 800,
  },
];
export async function weeklyData(db, guildId, userId) {
  const week = weekKey();
  const progress = (await stmt(
    db,
    "SELECT damage,hits,kills FROM guild_weeks WHERE guild_id=? AND week=?",
    guildId,
    week,
  ).first()) || { damage: 0, hits: 0, kills: 0 };
  const own = await stmt(
    db,
    "SELECT hits FROM guild_week_members WHERE guild_id=? AND week=? AND account_id=?",
    guildId,
    week,
    userId,
  ).first();
  const claimed = (
    await stmt(
      db,
      "SELECT task FROM guild_claims WHERE account_id=? AND week=?",
      userId,
      week,
    ).all()
  ).results.map((r) => r.task);
  return {
    week,
    ...progress,
    participated: !!own?.hits,
    tasks: weeklyTasks.map((t) => ({
      ...t,
      progress: progress[t.key],
      claimed: claimed.includes(t.id),
    })),
  };
}
export async function friendsData(db, userId) {
  const rows = (
    await stmt(
      db,
      "SELECT f.*,a.id AS friend_id,a.username,p.state_json,p.rating FROM friendships f JOIN accounts a ON a.id=CASE WHEN f.low_id=? THEN f.high_id ELSE f.low_id END JOIN players p ON p.account_id=a.id WHERE f.low_id=? OR f.high_id=? ORDER BY f.status,f.created_ms DESC",
      userId,
      userId,
      userId,
    ).all()
  ).results;
  return {
    friends: rows.map((r) => {
      const s = migrate(JSON.parse(r.state_json)),
        id = s.supportHero ?? s.team[0] ?? Number(Object.keys(s.collection)[0]);
      return {
        id: r.friend_id,
        name: r.username,
        status: r.status,
        incoming: r.requester !== userId,
        rating: r.rating,
        power: teamPower(s),
        team: s.team.map((id) => heroes[id]),
        support: {
          ...heroes[id],
          power: power(s, id),
          level: s.levels[id] || 1,
        },
      };
    }),
  };
}
export async function friendshipAction(db, user, path, input) {
  if (path === "/api/friends/request") {
    const name = String(input.username || "").trim();
    if (!name || name.length > 20) fail("请输入好友昵称");
    const target = await stmt(
      db,
      "SELECT id FROM accounts WHERE username=?",
      name,
    ).first();
    if (!target) fail("找不到这个昵称", 404);
    if (target.id === user.id) fail("不能添加自己");
    const [low, high] = [user.id, target.id].sort();
    const existing = await stmt(
      db,
      "SELECT status FROM friendships WHERE low_id=? AND high_id=?",
      low,
      high,
    ).first();
    if (existing)
      fail(
        existing.status === "accepted" ? "已经是好友" : "好友申请已存在",
        409,
      );
    const result = await stmt(
      db,
      "INSERT INTO friendships(low_id,high_id,requester,status,created_ms) SELECT ?,?,?,'pending',? WHERE (SELECT COUNT(*) FROM friendships WHERE low_id=? OR high_id=?)<50 AND (SELECT COUNT(*) FROM friendships WHERE low_id=? OR high_id=?)<50 ON CONFLICT(low_id,high_id) DO NOTHING",
      low,
      high,
      user.id,
      Date.now(),
      user.id,
      user.id,
      target.id,
      target.id,
    ).run();
    if (!result.meta.changes) fail("好友列表已满或申请刚被更新", 409);
  } else {
    if (typeof input.id !== "string") fail("好友编号无效");
    const [low, high] = [user.id, input.id].sort();
    if (path === "/api/friends/accept") {
      const r = await stmt(
        db,
        "UPDATE friendships SET status='accepted' WHERE low_id=? AND high_id=? AND status='pending' AND requester<>?",
        low,
        high,
        user.id,
      ).run();
      if (!r.meta.changes) fail("没有可接受的好友申请", 409);
    } else if (path === "/api/friends/remove") {
      await stmt(
        db,
        "DELETE FROM friendships WHERE low_id=? AND high_id=?",
        low,
        high,
      ).run();
    } else fail("好友操作无效", 404);
  }
  return friendsData(db, user.id);
}
export async function borrowHero(db, userId, friendId, state) {
  if (typeof friendId !== "string") fail("支援好友编号无效");
  const [low, high] = [userId, friendId].sort();
  if (
    !(await stmt(
      db,
      "SELECT 1 FROM friendships WHERE low_id=? AND high_id=? AND status='accepted'",
      low,
      high,
    ).first())
  )
    fail("只能借用已接受好友的支援英雄", 403);
  if (!state.team.length) fail("请先编成队伍");
  const day = new Date().toISOString().slice(0, 10);
  if (state.supportDay !== day) {
    state.supportDay = day;
    state.supportUses = 0;
  }
  if (state.supportUses >= 3) fail("今日三次好友支援已用完");
  const row = await stmt(
    db,
    "SELECT state_json FROM players WHERE account_id=?",
    friendId,
  ).first();
  const s = migrate(JSON.parse(row.state_json));
  const id = s.supportHero ?? s.team[0] ?? Number(Object.keys(s.collection)[0]);
  const cap = Math.round(
    Math.max(...state.team.map((id) => power(state, id))) * 1.5,
  );
  state.supportUses++;
  return { ...heroes[id], power: Math.min(power(s, id), cap), friendId };
}
