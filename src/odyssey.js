// Persistent progression lives inside the existing authoritative save transaction.
export const boons = [
 {id:'blade',name:'锋刃祝福',text:'全队攻击 +12%',icon:'sword'},
 {id:'vitality',name:'生命祝福',text:'全队生命 +18%，恢复部分伤势',icon:'heart'},
 {id:'spring',name:'泉水祝福',text:'全队治疗 +25%',icon:'water'},
 {id:'guard',name:'守卫祝福',text:'全队护盾效果 +25%',icon:'shield'},
 {id:'crit',name:'鹰眼祝福',text:'全队暴击率 +8%',icon:'arrow'},
 {id:'rest',name:'营地休整',text:'全队恢复最大生命的35%',icon:'home'},
];
export const trials = [
 {name:'灼热遗迹',effects:['burn'],element:'火',hint:'灼烧持续伤害，净化与治疗可以提高续航'},
 {name:'霜封遗迹',effects:['freeze'],element:'水',hint:'敌人会控制，带净化或用风属性克制'},
 {name:'坚岩遗迹',effects:['guard'],element:'风',hint:'敌人有护盾，破盾英雄能打开局面'},
 {name:'暮影遗迹',effects:['drain'],element:'暗',hint:'敌人吸血，集中输出与控制限制恢复'},
 {name:'回声遗迹',effects:['chain'],element:'光',hint:'敌人连击，多目标治疗与护盾更有价值'},
];
export const utcDay=(now=Date.now())=>new Date(now).toISOString().slice(0,10);
export function trialForDay(day=utcDay()) {return trials[[...day].reduce((n,c)=>n+c.charCodeAt(0),0)%trials.length];}
export function odysseyFresh(){return {version:1,wishlist:[],shards:0,stars:{},milestones:[],spent:{},sweep:{day:'',count:0},run:null};}
export function ensureOdyssey(s){s.odyssey??=odysseyFresh();return s.odyssey;}
const rec=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const num=(v,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const unique=(a)=>Array.isArray(a)&&new Set(a).size===a.length;
export function validOdyssey(o,s){
 if(o===undefined)return true; // older saves are upgraded on load
 if(!rec(o)||o.version!==1||!unique(o.wishlist)||o.wishlist.length>3||!o.wishlist.every(id=>num(id,37))||!num(o.shards)||!rec(o.stars)||!unique(o.milestones)||!rec(o.spent)||!rec(o.sweep))return false;
 if(!Object.entries(o.stars).every(([stage,n])=>/^[1-9]\d*$/.test(stage)&&+stage<=s.cleared&&num(n,3)&&n>0))return false;
 if(!o.milestones.every(n=>num(n,12)&&n>0&&s.cleared>=n*3))return false;
 if(!Object.entries(o.spent).every(([id,v])=>s.collection[id]&&rec(v)&&['coins','experience','books'].every(k=>num(v[k]))&&num(v.baseLevel,50)&&v.baseLevel>=1&&num(v.baseSkill,5)))return false;
 if(typeof o.sweep.day!=='string'||!num(o.sweep.count,10))return false;
 if(o.raid!==undefined&&(!rec(o.raid)||typeof o.raid.day!=='string'||!num(o.raid.hits,5)))return false;
 if(o.weekly!==undefined&&(!rec(o.weekly)||typeof o.weekly.week!=='string'||!num(o.weekly.floor,5)))return false;
 const r=o.run;if(r===null)return true;
 if(r.route!==undefined&&r.route!==null&&!['trail','elite','spring'].includes(r.route))return false;
 if(r.riskWins!==undefined&&!num(r.riskWins,6))return false;
 return rec(r)&&typeof r.day==='string'&&num(r.tier,3)&&r.tier>0&&num(r.node,6)&&['active','pending','claimed'].every(k=>typeof r[k]==='boolean')&&unique(r.team)&&r.team.length>0&&r.team.length<=6&&r.team.every(id=>num(id,37)&&s.collection[id])&&Array.isArray(r.positions)&&r.positions.length===6&&JSON.stringify(r.positions.filter(id=>id!==null))===JSON.stringify(r.team)&&unique(r.positions.filter(id=>id!==null))&&rec(r.hp)&&Object.keys(r.hp).length===r.team.length&&r.team.every(id=>num(r.hp[id],1000))&&Array.isArray(r.boons)&&r.boons.length<=5&&r.boons.every(id=>boons.some(b=>b.id===id))&&(!r.pending||r.active&&r.node>0&&r.node<6);
}
export function recordSpent(s,id,key,amount){const o=ensureOdyssey(s);o.spent[id]??={coins:0,experience:0,books:0,baseLevel:s.levels[id]||1,baseSkill:s.skills[id]||0};o.spent[id][key]+=amount;}
export function expeditionChoices(run){const seed=[...run.day].reduce((n,c)=>n+c.charCodeAt(0),run.node*7+run.tier);return [0,2,4].map(i=>boons[(seed+i)%boons.length]);}
export function expeditionReward(tier){return {coins:1200*tier,shards:8*tier,tickets:tier,stones:6*tier};}
export function expeditionEnemies(run){const theme=trialForDay(run.day),total=(55+run.node*32+(run.tier-1)*150)*(run.route==='elite'?1.25:run.route==='spring'?1.1:1);return Array.from({length:run.node===5?1:3},(_,i)=>({name:run.node===5?theme.name+'守门人':['遗迹前锋','遗迹守卫','遗迹术士'][i],kind:run.node===5?2:i,phase:run.node===5,role:run.node===5?'法师':i===1?'骑士':'战士',element:theme.element,power:Math.round(total/(run.node===5?1:3)),skill:theme.name+' · 秘术',ability:{effects:theme.effects,multiplier:1.1},hint:theme.hint}));}
export function odysseyAction(s,a,rng,ctx){
 const o=ensureOdyssey(s),done=result=>({handled:true,result}),day=utcDay();
 if(a.type==='wishlist'){
  if(!unique(a.ids)||a.ids.length>3||!a.ids.every(id=>Number.isInteger(id)&&['SSR','UR'].includes(ctx.heroes[id]?.rarity)))throw Error('心愿最多选择三位 SSR / UR 英雄');
  o.wishlist=[...a.ids];return done({wishlist:o.wishlist});
 }
 if(a.type==='shardRecruit'){
  const h=ctx.heroes[a.id];if(!Number.isInteger(a.id)||!h||!['SSR','UR'].includes(h.rarity))throw Error('只能兑换 SSR / UR 英雄');
  const cost=h.rarity==='UR'?250:80;if(o.shards<cost)throw Error('英雄碎片不足');
  o.shards-=cost;s.collection[h.id]=(s.collection[h.id]||0)+1;return done({id:h.id,cost});
 }
 if(a.type==='trainingReset'){
  if(!Number.isInteger(a.id)||!s.collection[a.id])throw Error('尚未拥有角色');
  const paid=o.spent[a.id]||{coins:0,experience:0,books:0,baseLevel:s.levels[a.id]||1,baseSkill:s.skills[a.id]||0};
  if(!['coins','experience','books'].some(k=>paid[k]>0))throw Error('没有本版本可返还的培养投入，旧培养保留');
  for(const k of ['coins','experience','books'])s[k]+=paid[k];
  s.levels[a.id]=paid.baseLevel;s.skills[a.id]=paid.baseSkill;delete o.spent[a.id];return done({...paid,id:a.id});
 }
 if(a.type==='chapterReward'){
  if(!Number.isInteger(a.chapter)||a.chapter<1||a.chapter>12||s.cleared<a.chapter*3)throw Error('先通关整章');
  if(o.milestones.includes(a.chapter))throw Error('章节奖励已领取');
  o.milestones.push(a.chapter);const reward={tickets:2,coins:500+a.chapter*100,shards:5};s.tickets+=reward.tickets;s.coins+=reward.coins;o.shards+=reward.shards;return done(reward);
 }
 if(a.type==='campaignSweep'){
  if(!Number.isInteger(a.stage)||!Number.isInteger(a.count)||![1,5].includes(a.count)||!((o.stars[a.stage]||0)>=3)||a.stage>s.cleared)throw Error('三星通关后可扫荡，单次1或5次');
  const used=o.sweep.day===day?o.sweep.count:0;if(used+a.count>10)throw Error('今日主线扫荡次数已用完');
  const cost=50*a.count;if(s.coins<cost)throw Error('金币不足');
  o.sweep={day,count:used+a.count};s.coins-=cost;
  const reward={stones:2*a.count,experience:a.count};s.stones+=reward.stones;s.experience+=reward.experience;return done({...reward,cost,sweep:true});
 }
 if(a.type==='expeditionStart'){
  if(!s.team.length)throw Error('请先组队');
  if(!Number.isInteger(a.tier)||a.tier<1||a.tier>3||s.cleared<(a.tier-1)*12)throw Error('远征难度尚未解锁');
  if(o.run?.active&&o.run.day===day)throw Error('当前远征未结束，请继续或放弃');
  const claimed=o.run?.day===day&&o.run.claimed;
  const team=[...s.team],positions=s.formation?[...s.formation]:Array.from({length:6},(_,i)=>team[i]??null);
  o.run={day,tier:a.tier,node:0,active:true,pending:false,claimed:!!claimed,team,positions,hp:Object.fromEntries(team.map(id=>[id,1000])),boons:[]};return done({started:true});
 }
 if(a.type==='expeditionAbandon'){
  if(!o.run?.active)throw Error('没有进行中的远征');o.run.active=false;o.run.pending=false;return done({abandoned:true});
 }
 if(a.type==='expeditionBoon'){
  const r=o.run;if(!r||r.day!==day||!r.active||!r.pending)throw Error('当前不能选择祝福');
  if(!expeditionChoices(r).some(b=>b.id===a.boon))throw Error('祝福无效');
  r.boons.push(a.boon);r.pending=false;
  if(['rest','vitality'].includes(a.boon))for(const id of r.team)r.hp[id]=Math.min(1000,r.hp[id]+(a.boon==='rest'?350:180));return done({boon:a.boon});
 }
 if(a.type==='expeditionRoute'){
  const r=o.run;if(!r||r.day!==day||!r.active||r.pending||r.route)throw Error('本场路线已经确定或不能选择');
  if(!['trail','elite','spring'].includes(a.route))throw Error('路线无效');
  r.route=a.route;if(a.route==='spring')for(const id of r.team)r.hp[id]=Math.min(1000,r.hp[id]+150);
  return done({route:r.route});
 }
 if(a.type==='expeditionFight'){
  const r=o.run;if(!r||r.day!==day||!r.active||r.pending||r.node>=6)throw Error('请开始远征或先选择祝福');
  const counts=id=>r.boons.filter(b=>b===id).length;
  const units=ctx.combatTeam({...s,team:r.team,formation:r.positions}).map(u=>({...u,initialFraction:r.hp[u.id]/1000,gearBonus:{...u.gearBonus,attack:(u.gearBonus?.attack||0)+counts('blade')*.12,hp:(u.gearBonus?.hp||0)+counts('vitality')*.18,heal:(u.gearBonus?.heal||0)+counts('spring')*.25,shield:(u.gearBonus?.shield||0)+counts('guard')*.25,crit:(u.gearBonus?.crit||0)+counts('crit')*.08}}));
  const combat=ctx.simulateCombat(units,expeditionEnemies(r),rng);
  for(const u of combat.players)r.hp[u.id]=Math.max(0,Math.round(u.hp/u.maxHp*1000));
  let loot={};if(combat.won){if(r.route==='elite')r.riskWins=(r.riskWins||0)+1;r.route=null;r.node++;if(r.node<6)r.pending=true;else{r.active=false;if(!r.claimed){loot=expeditionReward(r.tier);loot.coins+=(r.riskWins||0)*200;loot.shards+=(r.riskWins||0)*2;s.coins+=loot.coins;s.tickets+=loot.tickets;s.stones+=loot.stones;o.shards+=loot.shards;r.claimed=true;}}}else{r.active=false;r.pending=false;}
  ctx.dailyState(s).battles++;return done({...combat,expedition:true,node:r.node,loot,reward:0,coins:0});
 }
 return {handled:false};
}
