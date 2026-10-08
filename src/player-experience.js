// Recommendations use trained power and actual skill effects, never hidden rarity bonuses.
export function heroBuild(hero){
 const effects=new Set(hero.ability?.effects||[]);
 const focus=effects.has('revive')?'复活救场':effects.has('purify')?'净化续航':effects.has('burn')?'灼烧压血':effects.has('freeze')?'控制压制':effects.has('break')?'破盾攻坚':effects.has('execute')?'残血收割':effects.has('guard')?'团队守护':effects.has('counter')?'承伤反击':effects.has('chain')?'多目标清场':effects.has('double')?'连续追击':hero.role==='治疗'?'治疗续航':'稳定输出';
 return{focus,position:['骑士','战士'].includes(hero.role)?'前排':'后排',set:hero.role==='治疗'?'月泉':hero.role==='骑士'?'坚岩':'焰羽',partner:effects.has('burn')?'配合收割英雄':effects.has('execute')?'配合灼烧英雄':effects.has('freeze')?'配合追击英雄':effects.has('counter')?'配合护盾与治疗':effects.has('purify')?'应对灼烧和控制':effects.has('break')?'应对护盾敌人':'补充骑士与治疗'};
}
export function recommendSquad(pool,enemies=[]){
 const chosen=[],enemyEffects=new Set(enemies.flatMap(u=>u.ability?.effects||[]));
 const pick=predicate=>{const list=pool.filter(u=>!chosen.includes(u)&&predicate(u)).sort((a,b)=>b.power-a.power);if(list[0])chosen.push(list[0]);};
 pick(u=>u.role==='骑士');pick(u=>u.role==='治疗');
 const max=Math.max(1,...pool.map(u=>u.power));
 for(const [needed,effect] of [[enemyEffects.has('guard'),'break'],[enemyEffects.has('burn')||enemyEffects.has('freeze'),'purify']])if(needed&&!chosen.some(u=>(u.ability?.effects||[]).includes(effect)))pick(u=>u.power>=max*.55&&(u.ability?.effects||[]).includes(effect));
 if(chosen.some(u=>(u.ability?.effects||[]).includes('burn')))pick(u=>u.power>=max*.55&&(u.ability?.effects||[]).includes('execute'));
 for(const u of [...pool].sort((a,b)=>b.power-a.power))if(chosen.length<6&&!chosen.includes(u))chosen.push(u);
 return chosen.slice(0,6).sort((a,b)=>Number(['骑士','战士'].includes(b.role))-Number(['骑士','战士'].includes(a.role))||b.power-a.power).map(u=>u.id);
}
export function battleReview(outcome){
 const allies=outcome.players||[],events=outcome.events||[],notes=[];
 if(outcome.conditionFailed)notes.push('已击败敌人，但挑战条件未满足：'+outcome.condition);
 const fallen=allies.filter(u=>u.hp===0);if(fallen.length)notes.push(`${fallen.map(u=>u.name).join('、')}倒下；优先检查前排装备与治疗。`);
 const controls=events.filter(e=>e.side==='e'&&e.status==='control').length;
 if(controls)notes.push(`敌方造成${controls}次控制，可用净化英雄减少行动损失。`);
 const burn=events.filter(e=>e.side==='e'&&e.status==='ignite').length;if(burn)notes.push(`受到${burn}次灼烧施加；净化和持续治疗有帮助。`);
 const blocked=events.filter(e=>e.side==='p'&&e.absorbed>0).reduce((n,e)=>n+e.absorbed,0);if(blocked)notes.push(`敌方护盾吸收${blocked}伤害，试着带破盾技能。`);
 if(outcome.rounds>8)notes.push(`用了${outcome.rounds}回合；集中培养主输出或组合灼烧与收割，争取速度星。`);
 if(!notes.length)notes.push(outcome.won?'全队节奏稳定，可以挑战下一关或更高难度。':'检查等级、装备和属性克制，再调整队伍。');
 return notes.slice(0,3);
}
