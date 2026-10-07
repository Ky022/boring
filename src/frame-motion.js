const poses={idle:[0,1],walk:[2,3],attack:[4,5,6],cast:[7,8,6],heal:[7,8,6],hit:[9,10],fallen:[11]};
export function setFrameMotion(node,pose,duration=450){const sprite=node?.querySelector('[data-frame-hero]');if(sprite){sprite.dataset.motion=pose;sprite.dataset.motionUntil=String(Date.now()+duration);}}
export function wireFrameCharacters(root,lite=false){
 const update=()=>{for(const el of root.querySelectorAll('[data-frame-hero]')){const id=Number(el.dataset.frameHero),now=Date.now();let pose=el.closest('.fallen')?'fallen':!lite&&Number(el.dataset.motionUntil)>now?el.dataset.motion:!lite&&el.closest('.camp-walking')?'walk':'idle';let sequence=poses[pose]||poses.idle;if(id===8&&pose==='hit')sequence=[10];const f=sequence[lite?0:Math.floor(now/150)%sequence.length],row=(id-8)*2+Math.floor(f/6),col=f%6;el.querySelector('svg').setAttribute('viewBox',`${col*1024/6+6} ${row*1024/6+17} ${1024/6-12} ${1024/6-32}`);}};
 update();const timer=setInterval(update,150);return()=>clearInterval(timer);
}
