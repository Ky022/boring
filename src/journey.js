import { heroes, chapters, maxStage, combatTeam } from './game.js';
import { equipmentCombat } from './progression.js';

export const effectLabels = {chain:'连锁',bless:'祝福',burn:'灼烧',drain:'吸血',freeze:'控制',counter:'反击',break:'破盾',double:'追击',execute:'收割',regen:'再生',purify:'净化',guard:'守护',revive:'复活',teamHeal:'群疗'};
export function heroIdentity(h) { return `${h.role} · ${h.ability.effects.map(e=>effectLabels[e]).join(' / ')}`; }
export function growthGoals(s) {
  const goals=[];
  if(s.team.length<6) goals.push({title:'补齐六人小队',detail:`已上阵 ${s.team.length}/6 · 拖动英雄加入站位`,tab:'collection',mode:'formation'});
  const target=Math.min(maxStage,(Math.floor(s.cleared/3)+1)*3);
  if(s.cleared<maxStage) goals.push({title:`通关${chapters[Math.floor((target-1)/3)]}`,detail:`进度 ${Math.min(s.cleared,target)}/${target} · 每章第三关挑战 Boss`,tab:'adventure'});
  const unawakened=s.team.find(id=>(s.stars[id]||0)<3);
  if(unawakened!==undefined) goals.push({title:`培养${heroes[unawakened].name}`,detail:'三星解锁职业被动 · 升级、升星和技能各有收益',tab:'collection',hero:unawakened});
  if(s.items.length<6)goals.push({title:'收集六部位装备',detail:'遗落兵工厂掉落装备 · 衣服、头盔、裤子、鞋子均可穿戴',tab:'adventure',mode:'daily'});
  if(!goals.length)goals.push({title:'挑战精英与试炼塔',detail:'尝试不同阵容 · 与公会伙伴挑战共同目标',tab:'adventure',mode:'tower'});
  return goals;
}
export function teamInsights(s) {
  const units=combatTeam(s), roles=new Set(units.map(u=>u.role)), effects=new Set(units.flatMap(u=>u.ability.effects));
  const notes=[];
  if(!roles.has('骑士'))notes.push('缺少骑士：前排承伤较高');
  if(!roles.has('治疗'))notes.push('缺少治疗：持续战斗续航不足');
  if(effects.has('burn')&&effects.has('execute'))notes.push('灼烧＋收割：持续伤害压低血线，再锁定残血');
  if(effects.has('guard')&&effects.has('counter'))notes.push('护盾＋反击：保护前排，受到攻击后还击');
  if(effects.has('freeze')&&effects.has('double'))notes.push('控制＋追击：限制敌人行动，集中输出');
  if(effects.has('purify'))notes.push('已带净化：可应对灼烧与控制');
  return notes.length?notes:['可尝试搭配控制、破盾、治疗与追击'];
}
export function setProgress(s,id) {
  const gear=equipmentCombat(s,id).gearBonus;
  const counts={};for(const uid of Object.values(s.loadouts[id]||{})){const item=s.items.find(i=>i.id===uid);if(item)counts[item.set]=(counts[item.set]||0)+1;}
  return {counts,gear};
}
export function summarizePulls(pulls,collection) {
  const seen=new Set(Object.keys(collection).filter(id=>collection[id]>0).map(Number));
  return pulls.map(h=>{const isNew=!seen.has(h.id);seen.add(h.id);return {...h,isNew};});
}
