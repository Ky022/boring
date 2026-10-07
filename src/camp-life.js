import { heroes } from './game.js';
import { gameIcon } from './hero-ui.js';
const lines={骑士:'放心出发，前排交给我。',战士:'休整好了，再去挑战一次！',游侠:'前面那条小路，我去探探。',法师:'今天的遗迹会有什么秘密呢？',治疗:'回来记得休息，我会照顾大家。'};
// Bounds stay inside the walkable strip, below shortcuts and above the action tray.
export function campPoint(order,count,phase=0){return{x:7+(order+.5)*80/Math.max(1,count)+Math.sin(phase+order)*3,y:8+((order%3)*12)+Math.cos(phase+order)*5};}
export function wireCamp(root,openHero,lowMotion=false){
 const people=[...root.querySelectorAll('[data-camp-hero]')], timers=new Set();let stopped=false;
 const reduced=lowMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const schedule=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!stopped)fn();},ms);timers.add(id);};
 for(const [index,node]of people.entries()){
  const id=Number(node.dataset.campHero),h=heroes[id],count=node.parentElement.children.length;
  let phase=0,paused=false;
  const place=()=>{const p=campPoint(index%count,count,phase);node.style.left=p.x+'%';node.style.top=p.y+'px';};place();
  const wander=()=>{if(!node.isConnected)return;if(!document.hidden&&!paused&&!node.closest('.r-home')?.querySelector('.home-drawer')){phase+=1.3;node.classList.toggle('camp-facing-left',Math.sin(phase+index)<0);node.classList.add('camp-walking');place();schedule(()=>node.classList.remove('camp-walking'),1600);}schedule(wander,3500+(index%3)*700);};
  if(!reduced)schedule(wander,900+(index%6)*350);
  node.onclick=()=>{paused=true;node.classList.remove('camp-walking');root.querySelector('.camp-dialogue')?.remove();const bubble=document.createElement('div');bubble.className='camp-dialogue';bubble.innerHTML=`<b>${h.name}</b><p>${lines[h.role]}</p><button>${gameIcon('collection')}查看伙伴 ›</button><button class="camp-dialogue-close" aria-label="关闭对话">×</button>`;node.closest('.r-home').append(bubble);bubble.querySelector('button').onclick=()=>openHero(id);bubble.querySelector('.camp-dialogue-close').onclick=()=>{bubble.remove();paused=false;};schedule(()=>{bubble.remove();paused=false;},6000);};
 }
 return()=>{stopped=true;timers.forEach(clearTimeout);timers.clear();};
}
export function wireHeroSwipe(root,next){const scene=root.querySelector('.hero-dossier');if(!scene)return;let start;scene.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;start={x:e.clientX,y:e.clientY};});scene.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)next(dx<0?1:-1);});scene.addEventListener('pointercancel',()=>start=null);}
