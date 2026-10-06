const cells={home:0,summon:1,collection:2,adventure:3,social:4,arena:5,welfare:6,mail:7,task:8,idle:9,gift:10,friends:11,forge:12,formation:13,tower:14,coin:15};
export function paintedIcon(kind,extra='') {
 const cell=cells[kind]??6,x=cell%4,y=Math.floor(cell/4);
 const href=new URL('art/ui-icons.webp',document.baseURI).href;
 return `<svg class="painted-icon ${extra}" viewBox="${x} ${y} 1 1" aria-hidden="true"><defs><clipPath id="painted-ui-${cell}"><rect x="${x+0.01}" y="${y+(cell===7?0.07:0.01)}" width="0.98" height="${cell===7?0.92:0.98}"/></clipPath></defs><image href="${href}" width="4" height="4" preserveAspectRatio="none" clip-path="url(#painted-ui-${cell})"/></svg>`;
}
