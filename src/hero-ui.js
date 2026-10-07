import {skillArt} from './art-direction.js';
import { heroes, level, power, upgradeCost, rarities, combatTeam } from './game.js';
import { heroIdentity } from './journey.js';
import { sprite } from './pixel.js';
import { illustration } from './revamp-ui.js';

const paths = {
  home: 'M8 28L24 10L40 28H35V42H28V31H20V42H13V28Z M21 6H27V14H21Z',
  summon: 'M24 3L36 15L32 34L24 45L16 34L12 15Z M12 15H36 M24 3V45 M12 15L24 34L36 15',
  collection: 'M9 5L14 8L35 32L32 35L8 14Z M34 5L40 11L16 35L12 31Z M5 28L20 43 M27 29L41 43 M7 39L11 43 M35 39L39 43',
  adventure: 'M24 4L29 18L43 24L29 30L24 44L18 30L4 24L18 18Z M24 4V44 M4 24H43 M24 18L30 24L24 30L18 24Z',
  social: 'M9 42V22H16V42 M19 42V9L24 4L29 9V42 M32 42V22H39V42 M6 42H42 M8 22L12 16L17 22 M31 22L36 16L40 22 M22 15H26 M22 23H26 M22 31H26',
  arena: 'M8 7L24 3L40 7V25L34 36L24 45L14 36L8 25Z M24 12L28 21L37 22L30 28L32 37L24 32L16 37L18 28L11 22L20 21Z',
  light: 'M24 3L27 15L39 10L33 22L45 24L33 27L39 39L27 33L24 45L21 33L9 39L15 27L3 24L15 21L9 9L21 15Z',
  fire: 'M25 3C36 16 41 23 37 35C33 45 13 46 10 34C6 24 15 16 18 12L20 24C25 20 28 12 25 3Z M24 27C30 31 31 36 25 40C18 38 17 34 24 27Z',
  dark: 'M30 4C11 6 6 20 10 32C14 46 34 46 41 33C26 37 18 23 30 4Z M34 6L36 13L43 15L36 18L34 25L31 18L25 15L31 13Z',
  water: 'M24 3C21 11 8 22 8 30C8 48 40 48 40 30C40 22 27 11 24 3Z M14 31C14 37 20 39 24 39 M24 12L31 26',
  wind: 'M6 13H31C44 13 39 2 32 6 M4 23H39C48 23 45 38 36 35 M9 32H25C34 32 30 45 23 42',
  sword: 'M32 4L42 6L25 29L19 34L13 28L18 22Z M8 24L25 40 M17 33L8 43',
  heart: 'M24 43L6 25C-2 13 13 1 24 13C35 1 50 13 42 25Z',
  star: 'M24 3L29 17L44 18L33 28L36 44L24 35L12 44L15 28L4 18L19 17Z',
  shield: 'M8 8L24 3L40 8V25L33 36L24 44L15 36L8 25Z M24 10V36 M13 21H35',
  arrow: 'M13 5C42 11 42 37 13 43L23 24Z M6 24H43 M36 17L43 24L36 31',
  book: 'M4 9L23 14L44 9V38L24 43L4 38Z M24 14V43 M10 17L18 19 M10 25L18 27 M30 19L38 17 M30 27L38 25',
  robe: 'M16 5L24 10L32 5L44 18L36 25L32 20L35 43H13L16 20L12 25L4 18Z M20 11L24 21L28 11 M24 21V42',
  mail: 'M4 11H44V38H4Z M4 11L24 28L44 11 M4 38L17 25 M44 38L31 25',
};
export function gameIcon(kind, extra = '') {
  const id = `ui-gold-${kind}`;
  return `<svg class="game-icon ${extra}" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="${id}" x2=".25" y2="1"><stop stop-color="#fff5d0"/><stop offset=".45" stop-color="#d8b875"/><stop offset=".5" stop-color="#fff2b3"/><stop offset="1" stop-color="#977346"/></linearGradient></defs><path d="${paths[kind] || paths.star}" fill="url(#${id})" stroke="#554434" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}
const elements = { 光: ['light', '#e3b651'], 火: ['fire', '#b84c38'], 暗: ['dark', '#8058a3'], 水: ['water', '#4a9bb7'], 风: ['wind', '#659e56'] };
export function elementBadge(element) {
  const [kind, color] = elements[element];
  return `<span class="element-seal" style="--element:${color}">${gameIcon(kind)}</span>`;
}
function frame() {
  return `<svg class="hero-card-frame" viewBox="0 0 100 154" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="card-metal" x2="0" y2="1"><stop stop-color="#b9ad9b"/><stop offset=".25" stop-color="#71645a"/><stop offset=".55" stop-color="#b4a890"/><stop offset="1" stop-color="#65554c"/></linearGradient></defs><path d="M4 16L19 12L23 6L42 6L50 1L58 6L77 6L81 12L96 16V142L86 147H14L4 142Z M10 22V132L18 137H82L90 132V22L74 18H26Z" fill-rule="evenodd" fill="url(#card-metal)" stroke="#493e38" stroke-width="2"/><path d="M9 21L26 16L28 11H43L50 7L57 11H72L74 16L91 21V136L83 141H17L9 136Z" fill="#705b4518" stroke="#e6d4ad" stroke-width="1"/><path d="M10 22V132L18 137H82L90 132V22L74 18H26Z" fill="none" stroke="#4b3d35" stroke-width="2"/><path d="M2 39L8 35V114L2 118 M98 39L92 35V114L98 118" fill="none" stroke="#c8b99d" stroke-width="2"/><path d="M17 146H83L76 153H24Z" fill="#51443d" stroke="#b4a085"/><path d="M31 149H69" stroke="#d9c191"/></svg>`;
}
function stars(s, h) {
  const n = s.stars[h.id] || 0;
  return `<span class="hero-stars ${n >= 3 ? 'ascended' : ''}" aria-label="${n}星">${n ? '★'.repeat(n) : '✦'}<i>${h.rarity}</i></span>`;
}
export function galleryView(s, { modeNav, filter, role, sort, codex, sortValue }) {
  const list = heroes.filter(h => (codex || s.collection[h.id]) && (filter === '全部' || h.element === filter) && (role === '全部' || h.role === role))
    .sort((a,b) => Number(!!s.collection[b.id])-Number(!!s.collection[a.id]) || sortValue(b)-sortValue(a));
  return `<section class="hero-gallery">${modeNav}<div class="gallery-heading"><div><span>HERO COLLECTION</span><h2>${codex ? '英雄图鉴' : '我的英雄'}</h2></div><b>${Object.keys(s.collection).filter(id => s.collection[id]).length}<small> / ${heroes.length}</small></b><button data-gallery-codex aria-label="切换英雄与图鉴">${gameIcon(codex ? 'collection' : 'book')}</button></div><div class="hero-gallery-grid" role="region" aria-label="英雄卡牌">${list.map(h => `<button class="hero-tile ${!s.collection[h.id] ? 'hero-unowned' : ''}" data-select-hero="${h.id}" aria-label="${h.name}，${h.rarity}，${s.collection[h.id] ? `等级${level(s,h.id)}` : '未获得'}" style="--rarity:${rarities[h.rarity].color}"><div class="tile-interior"></div>${frame()}<span class="tile-level">Lv.${s.collection[h.id] ? level(s,h.id) : '1'}</span>${elementBadge(h.element)}<div class="tile-pedestal"></div><div class="tile-character">${sprite(h)}</div>${s.team.includes(h.id) ? '<span class="tile-deployed">上阵中</span>' : s.supportHero === h.id ? '<span class="tile-support">助战中</span>' : !s.collection[h.id] ? '<span class="tile-locked">未召唤</span>' : ''}<span class="tile-role">${h.role}</span><span class="tile-name">${h.name}</span>${stars(s,h)}</button>`).join('') || '<div class="gallery-empty">这个分类还没有英雄<br>试试图鉴或其他属性</div>'}</div>${!codex&&list.length<12?`<aside class="collection-next"><span>${gameIcon('summon')}</span><div><b>寻找下一位伙伴</b><p>收集不同职业，尝试新的小队配合</p></div><button class="secondary" data-tab="summon">前往召唤 ›</button></aside>`:''}<div class="gallery-controls"><div class="element-filters" aria-label="属性筛选"><button data-hero-filter="全部" class="${filter === '全部' ? 'active' : ''}" aria-label="全部属性" aria-pressed="${filter === '全部'}">ALL</button>${Object.keys(elements).map(e => `<button data-hero-filter="${e}" class="${filter === e ? 'active' : ''}" aria-label="${e}属性" aria-pressed="${filter === e}">${elementBadge(e)}</button>`).join('')}</div><div class="gallery-sort"><select id="roster-sort" aria-label="角色排序">${[['power','战力排序'],['level','等级排序'],['stars','星级排序'],['rarity','稀有度排序']].map(([k,n]) => `<option value="${k}" ${sort === k ? 'selected' : ''}>${n}</option>`).join('')}</select><select id="roster-role" aria-label="职业筛选">${['全部','骑士','战士','游侠','法师','治疗'].map(r=>`<option ${role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div></div><div class="gallery-bottom-tabs"><button data-gallery-mode="owned" class="${!codex ? 'active' : ''}">${gameIcon('collection')}英雄</button><button data-gallery-mode="codex" class="${codex ? 'active' : ''}">${gameIcon('book')}图鉴</button></div></section>`;
}
export function heroSkills(h) {
  return [
    { name: '普通攻击', icon: h.role === '游侠' ? 'arrow' : h.role === '法师' || h.role === '治疗' ? 'star' : 'sword', text: '自动战斗中对敌方目标发动普通攻击。普通攻击优先选择前排目标；游侠的专属技能优先攻击后排。' },
    { name: h.skill, icon: elements[h.element][0], text: h.skillDescription },
    { name: '职业觉醒', icon: {骑士:'shield',战士:'sword',游侠:'arrow',法师:'book',治疗:'heart'}[h.role], text: `三星解锁${{骑士:'群体护盾',战士:'吸血',游侠:'追击',法师:'破盾',治疗:'持续恢复'}[h.role]}职业被动。` },
    { name: '阵营共鸣', icon: 'arena', text: `${h.faction}同阵营三人：攻击和生命 +10%；五人：+20%。需实际编入战斗阵容。` },
  ];
}
export function heroDetailView(s, id) {
  const h = heroes[id], owned = !!s.collection[id], p = power(s,id);
  const unit = combatTeam({...s,team:[id],formation:null})[0];
  const hp = Math.round((p*4+25)*(1+(unit.gearBonus?.hp || 0)));
  const skills = heroSkills(h);
  return `<section class="hero-dossier" style="--accent:${rarities[h.rarity].color};--element:${elements[h.element][1]}"><div class="dossier-art">${illustration(h)}</div><div class="dossier-vignette"></div><header class="dossier-heading"><button data-hero-back class="dossier-back" aria-label="返回英雄列表">‹</button><div class="dossier-nameplate">${elementBadge(h.element)}<div><small>${h.title}</small><h2>${h.name}</h2></div><b>${h.rarity}</b></div><div class="hero-identity">${heroIdentity(h)}</div><div class="dossier-stars">${'★'.repeat(s.stars[id] || 0) || '☆'.repeat(5)}</div></header><div class="dossier-side-tools"><button data-hero-growth="${id}" aria-label="培养英雄">${gameIcon('star')}<small>培养</small></button><button data-equip="${id}" ${!owned ? 'disabled' : ''} aria-label="查看六部位装备">${gameIcon('robe')}<small>装备</small></button><button data-hero-story="${id}" aria-label="英雄故事">${gameIcon('book')}<small>档案</small></button></div><button class="dossier-arrow prev" data-hero-step="-1" aria-label="上一位英雄">‹</button><button class="dossier-arrow next" data-hero-step="1" aria-label="下一位英雄">›</button><div class="dossier-foot"><div class="dossier-identity"><div class="dossier-pixel">${sprite(h)}<span>${h.element} · ${h.role}</span></div><div class="dossier-power"><span>${owned ? `Lv.<b>${level(s,id)}</b>` : '尚未召唤'}</span><strong>${p.toLocaleString()}</strong><small>战力 · ${h.faction}</small></div></div><div class="dossier-stats"><span>${gameIcon('sword')}<b>${p}</b><small>战力</small></span><span>${gameIcon('heart')}<b>${hp}</b><small>基础生命</small></span><span>${gameIcon('star')}<b>${Math.round((.15+(unit.gearBonus?.crit||0))*100)}%</b><small>暴击</small></span></div><div class="dossier-skills">${skills.map((k,i)=>`<button data-hero-skill="${i}" aria-label="查看${k.name}"><span class="skill-medallion skill-${i}">${skillArt(h,i)}<b>${i === 1 ? (s.skills[id]||0)+1 : i === 2 ? (s.stars[id]>=3 ? '已觉醒' : '3★') : i === 3 ? '羁绊' : '1'}</b></span><small>${k.name}</small></button>`).join('')}</div><div class="dossier-actions"><button data-team="${id}" ${!owned ? 'disabled' : ''}>${stateTeamLabel(s,id)}</button><button class="dossier-upgrade" data-upgrade="${id}" ${!owned || level(s,id)>=50 || s.coins<upgradeCost(s,id) ? 'disabled' : ''}>升级<small>金币 ${upgradeCost(s,id)}</small></button><button data-hero-growth="${id}" ${!owned ? 'disabled' : ''}>升星 · 培养</button></div><footer class="dossier-footer"><button data-hero-back>‹ 返回英雄</button><span>星辉小队 · ${owned ? '已获得' : '图鉴预览'}</span><button data-equip="${id}" ${!owned ? 'disabled' : ''}>${gameIcon('robe')}装备</button></footer></div></section>`;
}
function stateTeamLabel(s,id) { return s.team.includes(id) ? '✓ 已上阵' : '加入队伍'; }
