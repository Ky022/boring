const iconCells={home:0,summon:1,collection:2,adventure:3,social:4,arena:2,gift:5,mail:6,sword:7,robe:8,book:9,shield:10,star:11};
export function cuteIcon(kind,extra=''){
 const index=iconCells[kind];if(index===undefined)return null;
 const url=new URL('art/cute-icons.webp',document.baseURI).href;
 return `<svg class="game-icon cute-icon ${extra}" viewBox="${index%4*320} ${190+Math.floor(index/4)*320} 320 320" overflow="hidden" aria-hidden="true"><image href="${url}" width="1280" height="1280" preserveAspectRatio="none"/></svg>`;
}
// Measured opaque bounds of each isolated character; never expose a neighboring cell.
const heroCells=[[21,18,157,182],[191,29,153,172],[390,29,152,172],[575,17,163,184],[785,15,175,186],[1003,21,164,180],[1197,35,163,166],[1386,16,168,185],[17,236,154,174],[197,226,169,184],[388,223,180,187],[587,231,182,179],[788,228,179,183],[999,225,180,185],[1195,234,176,176],[1385,220,181,190],[15,429,173,176],[200,425,159,179],[384,431,194,174],[595,433,175,172],[799,442,185,163],[990,433,189,172],[1208,432,169,173],[1393,431,176,174],[11,623,169,158],[178,620,190,161],[389,624,183,157],[589,620,182,161],[794,619,172,163],[997,620,182,162],[1205,620,173,162],[1391,619,176,163],[11,797,153,160],[190,791,174,166],[403,797,166,160],[594,793,168,164],[794,795,198,162],[1003,795,169,164],[1183,792,196,167],[1391,797,178,161]];
let spriteInstance=0;
export function cuteCharacter(hero,classes=''){
 const clipId=`cute-cell-${hero.id}-${++spriteInstance}`;
 const [x,y,width,height]=heroCells[hero.id],size=Math.max(width,height)+12,url=new URL('art/cute-heroes.webp',document.baseURI).href;
 return `<span class="pixel-character cute-character ${classes}" role="img" aria-label="${hero.name} · ${hero.title}"><svg viewBox="${x+width/2-size/2} ${y+height-size+6} ${size} ${size}" style="overflow:hidden" aria-hidden="true"><defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath></defs><image href="${url}" width="1586" height="992" preserveAspectRatio="none" clip-path="url(#${clipId})"/></svg></span>`;
}
