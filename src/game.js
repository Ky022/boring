export const rarities = {R:{rate:70,color:'#8daac3',power:24},SR:{rate:24,color:'#bb8fff',power:42},SSR:{rate:5,color:'#ffc766',power:68},UR:{rate:1,color:'#ff87b7',power:100}};
export const heroes = [
 ['露米','月光祭司','☾','UR'],['烬','焰羽剑圣','♜','UR'],['绯夜','暮色游侠','➶','SSR'],['白霜','霜境女王','❄','SSR'],['雷恩','雷鸣骑士','ϟ','SSR'],['紫苑','秘术学者','✧','SR'],['青岚','风之旅人','༄','SR'],['珊瑚','潮汐医师','❀','SR'],['艾可','森林守卫','♧','R'],['罗伊','见习剑士','⚔','R'],['米娅','星灯使者','✦','R'],['诺亚','石盾卫士','⬡','R']
].map(([name,title,icon,rarity],id)=>({id,name,title,icon,rarity}));
export function fresh(){return {version:1,gems:3000,pity:0,collection:{8:1,9:1,10:1},team:[8,9,10],stage:1,cleared:0};}
export function summon(state,count,rng=Math.random){
 if(![1,10].includes(count)||state.gems<count*150) throw new Error('星钻不足');
 state.gems-=count*150; const result=[];
 for(let i=0;i<count;i++){
  state.pity++; const roll=rng()*100;
  let rarity=state.pity>=50?'SSR':roll<1?'UR':roll<6?'SSR':roll<30?'SR':'R';
  if(count===10&&i===9&&result.every(h=>h.rarity==='R')&&rarity==='R')rarity='SR';
  if(rarity==='SSR'||rarity==='UR')state.pity=0;
  const pool=heroes.filter(h=>h.rarity===rarity); const hero=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];
  state.collection[hero.id]=(state.collection[hero.id]||0)+1;result.push(hero);
 }return result;
}
export function power(state,id){return rarities[heroes[id].rarity].power+Math.min(10,(state.collection[id]||1)-1)*8;}
export function enemyPower(stage){return 45+stage*25;}
export function battle(state,rng=Math.random){
 if(!state.team.length)throw new Error('请先编成队伍');
 const strength=state.team.reduce((sum,id)=>sum+power(state,id),0);
 const dealt=Math.round(strength*(0.9+rng()*0.2)); const target=enemyPower(state.stage); const won=dealt>=target;
 let reward=0;if(won){reward=state.stage>state.cleared?350:60;state.gems+=reward;state.cleared=Math.max(state.cleared,state.stage);}
 return {won,dealt,target,reward};
}
export function validSave(s){return s&&s.version===1&&Number.isSafeInteger(s.gems)&&s.gems>=0&&Number.isInteger(s.pity)&&s.pity>=0&&s.pity<50&&Number.isInteger(s.stage)&&s.stage>=1&&s.stage<=12&&Number.isInteger(s.cleared)&&s.cleared>=0&&s.cleared<=12&&s.stage<=Math.min(12,s.cleared+1)&&s.collection&&Object.entries(s.collection).every(([id,n])=>heroes[Number(id)]&&Number.isInteger(n)&&n>0)&&Array.isArray(s.team)&&s.team.length<=3&&new Set(s.team).size===s.team.length&&s.team.every(id=>Number.isInteger(id)&&heroes[id]&&s.collection[id]);}
