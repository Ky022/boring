import {gameIcon} from './hero-ui.js';
import {sprite} from './pixel.js';
import {heroes, level, power, enemyPower, chapters, maxStage} from './game.js';
export function worldScene(name, cls='') {
 return `<div class="world-scene ${cls}"><img src="${new URL(`art/${name}.webp`,document.baseURI).href}" alt="" draggable="false"></div>`;
}
export function screenBanner(title, subtitle, icon='adventure', scene='town-center') {
 return `<div class="world-banner">${worldScene(scene)}<div class="banner-scrim"></div><div class="world-banner-title">${gameIcon(icon)}<div><small>ASTRAL CHRONICLES</small><h2>${title}</h2><p>${subtitle}</p></div></div></div>`;
}
export function rewardTiles(r) {
 const labels={gems:['summon','星钻'],coins:['star','金币'],tickets:['mail','召唤券'],stones:['shield','强化石'],skillBooks:['book','技能书'],experience:['water','经验药剂']};
 return `<div class="reward-tiles">${Object.entries(r||{}).filter(([k,n])=>labels[k]&&n>0).map(([k,n])=>`<span class="reward-tile">${gameIcon(labels[k][0])}<b>×${n.toLocaleString()}</b><small>${labels[k][1]}</small></span>`).join('')}</div>`;
}
export function campaignMap(s,page) {
 return `<div class="world-route">${worldScene('battle-forest')}<div class="route-title"><small>CHAPTER ${String(page+1).padStart(2,'0')}</small><h2>${chapters[page]}</h2><span>${s.cleared>=page*3+3?'章节已完成':'沿着星灯前进'}</span></div><svg class="route-line" viewBox="0 0 360 360" preserveAspectRatio="none" aria-hidden="true"><path d="M74 274Q100 220 190 200T270 85" fill="none" stroke="#384c37" stroke-width="12"/><path d="M74 274Q100 220 190 200T270 85" fill="none" stroke="#efd59c" stroke-width="5" stroke-dasharray="8 7"/></svg>${[page*3+1,page*3+2,page*3+3].map((n,i)=>`<button data-stage="${n}" class="route-node node-${i} ${n===s.stage?'current':''} ${n<=s.cleared?'cleared':''}" ${n>s.cleared+1?'disabled':''}>${gameIcon(i===2?'arena':'adventure')}<b>${n%3===0?'BOSS':`第 ${n} 关`}</b><small>${n<=s.cleared?'已通关':n>s.cleared+1?'未解锁':'挑战此关'}</small></button>`).join('')}</div>`;
}
export function teamStrip(s) {
 return `<div class="world-team-strip">${s.team.map(id=>`<span>${sprite(heroes[id])}<small>${heroes[id].name}</small></span>`).join('')}</div>`;
}
export function accountBanner(user) {
 return `${screenBanner('旅人档案',user?'云端存档 · 随时继续冒险':'创建旅人身份，与朋友一起冒险','book','town-west')}`;
}
let forgePanel="bag",guildSection="boss";
export function wireWorld(root) {
 const forge=root.querySelector(".world-forge");if(forge){forge.dataset.panel=forgePanel;forge.querySelectorAll("[data-forge-panel]").forEach(b=>b.classList.toggle("active",b.dataset.forgePanel===forgePanel));}
 const guild=root.querySelector(".community-body");if(guild){guild.dataset.guildSection=guildSection;guild.querySelectorAll("[data-guild-section]").forEach(b=>b.classList.toggle("active",b.dataset.guildSection===guildSection));}
 const slot=root.querySelector('[data-bag-filter]'),quality=root.querySelector('[data-quality-filter]');
 const filter=()=>root.querySelectorAll('.equipment-card[data-slot]').forEach(c=>c.hidden=(slot&&slot.value!=='all'&&c.dataset.slot!==slot.value)||(quality&&quality.value!=='all'&&c.dataset.quality!==quality.value));
 if(slot)slot.onchange=filter;if(quality)quality.onchange=filter;
 root.querySelectorAll('[data-forge-panel]').forEach(b=>b.onclick=()=>{const screen=b.closest('.world-forge');screen.dataset.panel=b.dataset.forgePanel;forgePanel=b.dataset.forgePanel;screen.querySelectorAll('[data-forge-panel]').forEach(x=>x.classList.toggle('active',x===b));});
 root.querySelectorAll('[data-guild-section]').forEach(b=>b.onclick=()=>{const body=b.closest('.community-body');body.dataset.guildSection=b.dataset.guildSection;guildSection=b.dataset.guildSection;body.querySelectorAll('[data-guild-section]').forEach(x=>x.classList.toggle('active',x===b));});
}
