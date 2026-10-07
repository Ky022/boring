export function skillArtIndex(hero,slot=1){
 if(slot===0)return {战士:0,骑士:0,游侠:1,法师:2,治疗:3}[hero.role]??0;
 if(slot===2)return {骑士:8,战士:9,游侠:10,法师:6,治疗:3}[hero.role]??8;
 if(slot===3)return 11;
 if(hero.role==='治疗')return 3;
 if(hero.role==='骑士')return 8;
 return {火:4,水:5,暗:6,光:7,风:10}[hero.element]??2;
}
export function skillArt(hero,slot=1){const i=skillArtIndex(hero,slot),url=new URL('art/skill-icons.webp',document.baseURI).href;return `<svg class="skill-art" viewBox="${i%4*100+4} ${Math.floor(i/4)*100+4} 92 92" overflow="hidden" aria-hidden="true"><image href="${url}" width="400" height="300" preserveAspectRatio="none"/></svg>`;}
export function actionGroups(events){const groups=[];for(const event of events){const prior=groups.at(-1);const key=`${event.round}:${event.actor}:${event.skill}:${event.status||''}`;if(prior?.key===key)prior.events.push(event);else groups.push({key,events:[event]});}return groups;}
