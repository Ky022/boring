import {weekKey} from './weekly-trial.js';
export const rules=[
 {name:'荆棘守护',effects:['guard','counter'],role:'骑士',element:'风',hint:'护盾与反击：带破盾英雄和治疗，避免硬撞前排。'},
 {name:'霜潮禁锢',effects:['freeze','chain'],role:'法师',element:'水',hint:'控制与连锁攻击：净化、护盾和风属性输出更有效。'},
 {name:'余烬吞噬',effects:['burn','drain'],role:'战士',element:'火',hint:'灼烧与吸血：净化并集中击败后排治疗。'},
 {name:'暮影猎杀',effects:['double','break'],role:'游侠',element:'暗',hint:'追击与破盾：不要只依赖护盾，保护后排并补充治疗。'}
];
export const relicRoutes=[{id:'safe',name:'林间小径',hint:'敌人较弱，战后回复20%生命',scale:.85},{id:'risk',name:'守卫密室',hint:'敌人增强25%，战后获得额外强化石',scale:1.25},{id:'normal',name:'回声大厅',hint:'标准强度，战后获得额外金币',scale:1}];
export const relicBoons=[{id:'blade',name:'锋刃契约',hint:'全队攻击提高15%',key:'attack',value:.15},{id:'life',name:'生命泉眼',hint:'全队生命提高20%',key:'hp',value:.2},{id:'heal',name:'复苏祝福',hint:'治疗效果提高25%，全队回复25%生命',key:'heal',value:.25},{id:'guard',name:'守护徽记',hint:'护盾效果提高30%',key:'shield',value:.3},{id:'crit',name:'鹰眼符文',hint:'暴击率提高10%',key:'crit',value:.1}];
export const collectionTrials=[
 {id:'rookies',name:'平凡英雄',hint:'只用R英雄，至少3人',kind:'rarity',value:'R',min:3,power:520,title:'平凡的奇迹',skin:'forest'},
 {id:'rare',name:'星灯小队',hint:'只用R或SR英雄，至少4人',kind:'low',min:4,power:950,title:'星灯领航者',skin:'dawn'},
 {id:'forest',name:'风林集结',hint:'至少3位风林旅团英雄',kind:'faction',value:'风林旅团',min:3,power:1100,title:'风林守望者',skin:'forest'},
 {id:'moon',name:'圣域誓约',hint:'至少3位星灯圣域英雄',kind:'faction',value:'星灯圣域',min:3,power:1300,title:'圣域见证者',skin:'dawn'},
 {id:'rangers',name:'百步穿杨',hint:'至少3位游侠',kind:'role',value:'游侠',min:3,power:1450,title:'追风猎手',skin:'forest'},
 {id:'mages',name:'秘术议会',hint:'至少3位法师',kind:'role',value:'法师',min:3,power:1550,title:'星海贤者',skin:'moon'},
 {id:'guardians',name:'坚盾不倒',hint:'至少2位骑士、1位治疗，全部存活',kind:'guard',min:3,power:1700,title:'不落之盾',skin:'dawn'},
 {id:'balanced',name:'五职同行',hint:'五种职业全部上阵，8回合内获胜',kind:'balanced',min:5,power:1850,title:'全能旅团长',skin:'moon'}
];
export const skins={forest:{name:'风林头像框',color:'#7da958'},dawn:{name:'晨曦头像框',color:'#d8a04c'},moon:{name:'月辉头像框',color:'#a49be2'}};
export function endgameFresh(){return {hard:0,nightmare:0,stars:{},trials:[],titles:[],skins:[],title:'',skin:'',relic:{week:'',attempt:0,rewarded:[],completed:false,run:null}};}
export function endgameState(s){return s.endgame??=endgameFresh();}
const int=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const unique=(a)=>Array.isArray(a)&&a.every(v=>typeof v==='string')&&new Set(a).size===a.length;
export function validEndgame(e){if(e===undefined)return true;const r=e?.relic,run=r?.run;return !!e&&int(e.hard,36)&&int(e.nightmare,36)&&e.stars&&Object.entries(e.stars).every(([k,n])=>/^(hard|nightmare):([1-9]|[12]\d|3[0-6])$/.test(k)&&int(n,3))&&unique(e.trials)&&e.trials.every(id=>collectionTrials.some(t=>t.id===id))&&unique(e.titles)&&e.titles.every(t=>['破晓征服者','噩梦终结者','遗迹探路者',...collectionTrials.map(c=>c.title)].includes(t))&&unique(e.skins)&&e.skins.every(id=>skins[id])&&typeof e.title==='string'&&(!e.title||e.titles.includes(e.title))&&typeof e.skin==='string'&&(!e.skin||e.skins.includes(e.skin))&&r&&typeof r.week==='string'&&int(r.attempt,100000)&&Array.isArray(r.rewarded)&&new Set(r.rewarded).size===r.rewarded.length&&r.rewarded.every(n=>int(n,9)&&n>0)&&typeof r.completed==='boolean'&&(run===null||run&&int(run.node,9)&&typeof run.active==='boolean'&&typeof run.pending==='boolean'&&(!run.pending||run.active&&run.node>0&&run.node<9)&&unique(run.boons)&&run.boons.every(id=>relicBoons.some(b=>b.id===id))&&run.hp&&Object.values(run.hp).every(n=>int(n,1000))&&(!run.route||relicRoutes.some(x=>x.id===run.route)));}
export function seeded(seed){let n=2166136261;for(const c of String(seed))n=Math.imul(n^c.charCodeAt(0),16777619);return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};}
export function challengeEligible(trial,team){if(team.length<trial.min)return false;switch(trial.kind){case 'rarity':return team.every(h=>h.rarity===trial.value);case 'low':return team.every(h=>['R','SR'].includes(h.rarity));case 'faction':return team.filter(h=>h.faction===trial.value).length>=trial.min;case 'role':return team.filter(h=>h.role===trial.value).length>=trial.min;case 'guard':return team.filter(h=>h.role==='骑士').length>=2&&team.some(h=>h.role==='治疗');case 'balanced':return new Set(team.map(h=>h.role)).size===5;default:return false;}}
export function difficultyInfo(mode,stage){const rule=rules[Math.floor((stage-1)/3)%rules.length];return {...rule,stage,mode,boss:stage%3===0,total:Math.round((800+stage*55)*(mode==='nightmare'?1.65:1)),condition:mode==='nightmare'&&stage%3===0?'12回合内获胜且至少3位伙伴存活':'击败全部敌人'};}
export function challengeEnemies(info){const formationRandom=seeded(info.seed||'fixed'),count=info.boss?6:4,weights=info.boss?[.14,.14,.28,.14,.12,.18]:[.3,.25,.25,.2];return weights.map((weight,i)=>({name:i===2&&info.boss?info.name+'领主':i===count-1?'秘境医师':info.name+'守卫',power:Math.round(info.total*weight),position:i,role:i===count-1?'治疗':i===0?'骑士':i===2?info.role:info.seed&&formationRandom()>.6?'游侠':i===1?'战士':i===3?'游侠':'法师',element:info.seed&&i%2===1?['风','水','火','光','暗'][Math.floor(formationRandom()*5)]:info.element,phase:i===2&&info.boss,skill:i===count-1?'回声复苏':info.name,ability:{effects:i===count-1?['heal']:info.effects,multiplier:1.2,heal:.55}})).map(u=>({...u,kind:u.role==='骑士'?2:u.role==='治疗'?0:1}));}
function reward(s,loot){for(const k of ['coins','gems','tickets','stones','books'])s[k]+=(loot[k]||0);s.odyssey.shards+=(loot.shards||0);}
function unlock(e,title,skin){if(title&&!e.titles.includes(title))e.titles.push(title);if(skin&&!e.skins.includes(skin))e.skins.push(skin);}
export function relicState(s,now=Date.now()){const e=endgameState(s),key=weekKey(now);if(e.relic.week!==key)e.relic={week:key,attempt:0,rewarded:[],completed:false,run:null};return e.relic;}
export function relicEncounter(r,route='normal'){const random=seeded(`${r.week}:${r.attempt}:${r.run?.node||0}`),rule=rules[Math.floor(random()*rules.length)],node=r.run?.node||0;return{...rule,seed:`${r.week}:${r.attempt}:${node}`,boss:node%3===2,total:Math.round((900+node*150)*(relicRoutes.find(x=>x.id===route)?.scale||1)),node};}
export function relicChoices(r){const random=seeded(`${r.week}:${r.attempt}:${r.run.node}:boon`),pool=[...relicBoons].filter(b=>!r.run.boons.includes(b.id));return pool.sort((a,b)=>a.id.localeCompare(b.id)).map(b=>({b,n:random()})).sort((a,b)=>a.n-b.n).slice(0,3).map(x=>x.b);}
export function endgameAction(s,a,rng,ctx){if(!['difficultyFight','relicStart','relicRoute','relicFight','relicBoon','collectionFight','cosmeticEquip'].includes(a.type))return{handled:false};const e=endgameState(s);let result;
 const team=()=>{if(!s.team.length)throw Error('请先组队');return ctx.combatTeam(s);};
 if(a.type==='difficultyFight'){
  if(!['hard','nightmare'].includes(a.mode))throw Error('难度无效');if(s.cleared<36)throw Error('通关普通主线36关后开放困难');if(a.mode==='nightmare'&&e.hard<36)throw Error('通关困难36关后开放噩梦');if(!Number.isInteger(a.stage)||a.stage<1||a.stage>36||a.stage>e[a.mode]+1)throw Error('请先通关前一关');
  const info=difficultyInfo(a.mode,a.stage),combat=ctx.simulateCombat(team(),challengeEnemies(info),rng),survivors=combat.players.filter(u=>u.hp>0).length,passed=combat.won&&(a.mode!=='nightmare'||!info.boss||combat.rounds<=12&&survivors>=3),first=passed&&a.stage>e[a.mode];let loot={};
  if(passed){e[a.mode]=Math.max(e[a.mode],a.stage);e.stars[`${a.mode}:${a.stage}`]=Math.max(e.stars[`${a.mode}:${a.stage}`]||0,1+(survivors===combat.players.length?1:0)+(combat.rounds<=8?1:0));if(first){loot={gems:a.mode==='hard'?120:200,coins:800+a.stage*25,stones:5,shards:3,tickets:info.boss?1:0};reward(s,loot);if(a.stage===36)unlock(e,a.mode==='hard'?'破晓征服者':'噩梦终结者',a.mode==='hard'?'dawn':'moon');}}
  ctx.dailyState(s).battles++;result={...combat,won:passed,combatWon:combat.won,difficulty:a.mode,stage:a.stage,boss:info.boss,loot,condition:info.condition,conditionFailed:combat.won&&!passed,nextDifficultyStage:Math.min(36,e[a.mode]+1),reward:0,coins:0};
 }else if(a.type==='collectionFight'){
  if(s.cleared<12)throw Error('通关第四章后开放收藏挑战');const trial=collectionTrials.find(t=>t.id===a.id),units=team();if(!trial||!challengeEligible(trial,units))throw Error('队伍不符合挑战条件');const combat=ctx.simulateCombat(units,challengeEnemies({...rules[collectionTrials.indexOf(trial)%4],total:trial.power,boss:true}),rng),passed=combat.won&&(trial.kind!=='guard'||combat.players.every(u=>u.hp>0))&&(trial.kind!=='balanced'||combat.rounds<=8);let loot={};if(passed&&!e.trials.includes(trial.id)){e.trials.push(trial.id);loot={gems:300,coins:1800,tickets:2};reward(s,loot);unlock(e,trial.title,trial.skin);}ctx.dailyState(s).battles++;result={...combat,won:passed,combatWon:combat.won,collectionTrial:trial.name,condition:trial.hint,conditionFailed:combat.won&&!passed,loot,reward:0,coins:0};
 }else if(a.type==='cosmeticEquip'){
  if(a.title!==undefined&&a.title!==''&&!e.titles.includes(a.title))throw Error('称号尚未解锁');if(a.skin!==undefined&&a.skin!==''&&!e.skins.includes(a.skin))throw Error('外观尚未解锁');if(a.title!==undefined)e.title=a.title;if(a.skin!==undefined)e.skin=a.skin;result={title:e.title,skin:e.skin};
 }else{
  if(s.cleared<12)throw Error('通关第四章后开放随机遗迹');const r=relicState(s);
  if(a.type==='relicStart'){team();if(r.run?.active)throw Error('请完成当前远征后再开始');if(r.attempt>=100000)throw Error('本周尝试次数已达上限');r.attempt++;r.run={node:0,active:true,pending:false,route:null,boons:[],hp:{}};result={started:true};}
  else{const run=r.run;if(!run?.active)throw Error('请先开启遗迹');
   if(a.type==='relicRoute'){if(run.pending)throw Error('请先选择强化');if(!relicRoutes.some(x=>x.id===a.route))throw Error('路线无效');run.route=a.route;result={route:a.route};}
   else if(a.type==='relicBoon'){if(!run.pending)throw Error('当前没有可选强化');const choice=relicChoices(r).find(b=>b.id===a.id);if(!choice)throw Error('强化选项无效');run.boons.push(choice.id);if(choice.id==='heal')for(const id of Object.keys(run.hp))run.hp[id]=Math.min(1000,run.hp[id]+250);run.pending=false;result={boon:choice.id};}
   else{if(run.pending||!run.route)throw Error('请先选择强化与路线');const route=run.route,info=relicEncounter(r,route),units=team().map(u=>{const bonus={...u.gearBonus};for(const id of run.boons){const b=relicBoons.find(x=>x.id===id);bonus[b.key]=(bonus[b.key]||0)+b.value;}return{...u,gearBonus:bonus,initialFraction:(run.hp[u.id]??1000)/1000};});if(units.every(u=>u.initialFraction===0))throw Error('伙伴全部倒下，请更换阵容');const combat=ctx.simulateCombat(units,challengeEnemies(info),rng);for(const u of combat.players)run.hp[u.id]=Math.min(1000,Math.round(u.hp/u.maxHp*1000)+(combat.won&&route==='safe'?200:0));let loot={};if(combat.won){run.node++;if(!r.rewarded.includes(run.node)){r.rewarded.push(run.node);loot={coins:route==='normal'?900:650,stones:route==='risk'?8:4,shards:2};if(run.node===9&&!r.completed){loot.tickets=3;loot.gems=500;r.completed=true;unlock(e,'遗迹探路者','forest');}reward(s,loot);}run.pending=run.node%3===0&&run.node<9;run.active=run.node<9;}else run.active=false;run.route=null;ctx.dailyState(s).battles++;result={...combat,randomRelic:true,boss:info.boss,floor:run.node,loot,reward:0,coins:0};}
  }
 }
 return{handled:true,result};
}
