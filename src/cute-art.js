const iconCells={home:0,summon:1,collection:2,adventure:3,social:4,arena:2,gift:5,mail:6,sword:7,robe:8,book:9,shield:10,star:11};
export function cuteIcon(kind,extra=''){
 const index=iconCells[kind];if(index===undefined)return null;
 const url=new URL('art/cute-icons.webp',document.baseURI).href;
 return `<svg class="game-icon cute-icon ${extra}" viewBox="${index%4*320} ${190+Math.floor(index/4)*320} 320 320" overflow="hidden" aria-hidden="true"><image href="${url}" width="1280" height="1280" preserveAspectRatio="none"/></svg>`;
}
export function cuteCharacter(hero,classes=''){
 const col=hero.id%8,row=Math.floor(hero.id/8),edges=[0,245,446,646,827,1000],url=new URL('art/cute-heroes.webp',document.baseURI).href;
 return `<span class="pixel-character cute-character ${classes}" role="img" aria-label="${hero.name} · ${hero.title}"><svg viewBox="${col*200+2} ${edges[row]+3} 196 ${edges[row+1]-edges[row]-6}" overflow="hidden" aria-hidden="true"><image href="${url}" width="1600" height="1000" preserveAspectRatio="none"/></svg></span>`;
}
