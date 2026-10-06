const palettes = [
  ["#cec3ff", "#56378d", "#fff1d5"],
  ["#ff9f79", "#822339", "#ffe0aa"],
  ["#db9cff", "#432054", "#efddff"],
  ["#9cecff", "#26577e", "#effbff"],
  ["#8aaaff", "#243577", "#ffe2a4"],
  ["#cc9bff", "#543583", "#e8cfff"],
  ["#99edd5", "#245b5e", "#dcfff4"],
  ["#ffaabc", "#823e62", "#ffe4dd"],
  ["#bfe289", "#345b48", "#eeffce"],
  ["#ffc58e", "#775340", "#ffe8c1"],
  ["#fae1a3", "#605081", "#fff5d9"],
  ["#adcee5", "#364d65", "#e0eef9"],
];
const ornaments = [
  '<path d="M142 129l10-22 26 10 25-10 17 22-39-8Z" fill="LIGHT"/><path d="M153 110a26 26 0 1 0 39 0a22 22 0 1 1-39 0" fill="LIGHT"/>',
  '<path d="M116 170l-22-49 28 12-5-32 30 24M233 173l33-49-29 8 8-28-33 23" fill="LIGHT"/><path d="M148 218l31 25 32-25-17 37h-33Z" fill="DARK"/>',
  '<path d="M102 173Q86 83 179 77Q265 92 254 185L225 145Q181 112 132 149Z" fill="DARK" stroke="LIGHT" stroke-width="2"/><path d="M135 201l42 20 42-20-7 35-33 18-37-20Z" fill="DARK"/>',
  '<path d="M124 141l10-49 28 24 17-55 19 55 28-24 10 49Z" fill="LIGHT"/><path d="M175 84h7v36h-7M165 99h28" stroke="DARK" stroke-width="3"/>',
  '<path d="M117 191l-7-42 17-28h103l16 33-9 40-17-29-40-10-40 10Z" fill="LIGHT"/><path d="M180 115l-14 28h14l-7 25 29-36h-17l11-17Z" fill="#ffe29a"/>',
  '<path d="M100 133l39-38 4-53 44 65 65 31Z" fill="DARK" stroke="LIGHT" stroke-width="2"/><circle cx="155" cy="192" r="13" fill="none" stroke="DARK" stroke-width="3"/><circle cx="200" cy="192" r="13" fill="none" stroke="DARK" stroke-width="3"/><path d="M168 190h19" stroke="DARK" stroke-width="3"/>',
  '<path d="M133 154Q86 147 94 86Q133 103 135 146M232 152Q279 136 269 83Q230 106 230 150" fill="LIGHT"/><path d="M123 183l-20 20 31 6M226 183l29 16-30 10" fill="LIGHT"/>',
  '<path d="M132 152l-16-29 20-9 4-25 25 21 21-37 15 38 31-20-3 29 22 11-25 22" fill="LIGHT"/><circle cx="147" cy="220" r="8" fill="LIGHT"/><circle cx="210" cy="220" r="8" fill="LIGHT"/>',
  '<path d="M113 187l-26-24 42 7M230 187l34-24-44 7" fill="LIGHT"/><path d="M138 146q35-67 81 1-16-14-38-10-31-3-43 9" fill="DARK"/><path d="M170 131l15-21 9 26Z" fill="LIGHT"/>',
  '<path d="M132 174l-16-27 15-16 27-11 30 6 33-6 20 25-17 29-18-27-30 8-26-6Z" fill="#aa674b"/><path d="M137 237l40 29-8 18-34-19Z" fill="LIGHT"/>',
  '<circle cx="181" cy="98" r="30" fill="none" stroke="LIGHT" stroke-width="4"/><path d="M127 158l-20-18 6-15 23 11M222 158l27-18-6-15-23 11" fill="LIGHT"/>',
  '<path d="M115 199v-60l26-33h74l27 34v60l-28-16-35-7-37 7Z" fill="LIGHT"/><path d="M118 190l22-25 39 9 37-9 22 25-26 42h-65Z" fill="DARK"/><path d="M148 192h63M167 206h26" stroke="LIGHT" stroke-width="4"/>',
];
const costumes = [
  '<path d="M143 293l35 63 36-63M150 353l-17 82M207 353l18 82" fill="none" stroke="LIGHT" stroke-width="4"/><circle cx="179" cy="365" r="19" fill="none" stroke="LIGHT" stroke-width="3"/>',
  '<path d="M131 289l-21 61 38-22 31 50 39-51 29 25-20-63-48 23Z" fill="LIGHT" opacity=".7"/><path d="M113 368l23 19-13 34 35-21 27 36 22-36 27 17-8-34 22-25" fill="#fba363"/>',
  '<path d="M112 276L247 356M109 294L236 374" stroke="LIGHT" stroke-width="8"/><path d="M149 350h44v45h-44Z" fill="DARK" stroke="LIGHT"/>',
  '<path d="M125 297l51 85 55-85-20 104h-61Z" fill="LIGHT" opacity=".5"/><path d="M153 345l25 24 26-24M177 319v73M149 372h56" stroke="LIGHT" stroke-width="3"/>',
  '<path d="M121 283l57 40 56-40-20 90-37 19-37-19Z" fill="LIGHT" opacity=".7"/><path d="M183 302l-25 49h19l-6 36 39-56h-19l12-29Z" fill="#ffdf88"/>',
  '<path d="M137 294h83l-7 106h-68Z" fill="DARK" stroke="LIGHT" stroke-width="2"/><path d="M152 316h48M154 333h37M157 350h38" stroke="LIGHT"/>',
  '<path d="M107 287Q136 265 174 308Q208 270 245 283L226 336 179 356 124 330Z" fill="LIGHT" opacity=".65"/><path d="M145 370q31-35 62 0-28-12-62 0" fill="LIGHT"/>',
  '<path d="M129 303Q180 338 228 304L222 379Q178 353 137 380Z" fill="LIGHT" opacity=".6"/><path d="M163 342l16-20 17 20-17 15Z" fill="#ffe9c9"/>',
  '<path d="M122 283Q175 253 235 283L218 327 177 349 135 324Z" fill="LIGHT" opacity=".6"/><path d="M149 359l26 24 33-39-22 57-32-9Z" fill="LIGHT"/>',
  '<path d="M123 284l57 36 53-36-14 50-41 34-42-34Z" fill="LIGHT" opacity=".7"/><path d="M173 326h13v39h-13ZM160 338h39v9h-39Z" fill="DARK"/>',
  '<path d="M127 288l51 42 53-42-5 90-46 36-47-36Z" fill="LIGHT" opacity=".35"/><path d="M178 323l10 21 22 3-16 16 4 24-20-12-21 12 4-24-16-16 22-3Z" fill="LIGHT"/>',
  '<path d="M120 283l59 23 60-23-10 97-51 31-46-31Z" fill="LIGHT" opacity=".8"/><path d="M155 331h50l-5 41-22 14-19-14Z" fill="DARK"/>',
];
const weapons = [
  '<path d="M268 153v279" stroke="LIGHT" stroke-width="7"/><path d="M269 96a34 34 0 1 0 26 53a27 27 0 1 1-26-53" fill="LIGHT"/>',
  '<path d="M255 81l-14 212 18 26 20-26-15-212Z" fill="LIGHT"/><path d="M229 318h63v12h-63M260 330v87" stroke="LIGHT" stroke-width="7"/>',
  '<path d="M255 142Q344 281 253 411M256 145l2 264M219 263h93M294 251l18 12-18 12" fill="none" stroke="LIGHT" stroke-width="6"/>',
  '<path d="M268 146v284" stroke="LIGHT" stroke-width="6"/><path d="M268 66l29 54-29 54-29-54Z" fill="LIGHT"/><path d="M268 80v79M252 118h32" stroke="#fff" stroke-width="3"/>',
  '<path d="M272 76v354" stroke="LIGHT" stroke-width="6"/><path d="M272 60l-22 59 22-11 20 9Z" fill="LIGHT"/><path d="M273 136l-26 36 19-5-9 22 31-39-18 7Z" fill="#ffe8a4"/>',
  '<path d="M240 318l58-12 14 76-61 9Z" fill="DARK" stroke="LIGHT" stroke-width="3"/><path d="M254 337l18-11 16 22-19 22Z" fill="LIGHT"/><path d="M298 306l-9 66 23 10" fill="none" stroke="LIGHT"/>',
  '<path d="M250 150l29 14-11 60 18 48-16 61-26-23 16-73-21-44Z" fill="LIGHT"/><path d="M256 162l1 163" stroke="#eefee9" stroke-width="2"/>',
  '<path d="M268 173v257" stroke="LIGHT" stroke-width="6"/><path d="M257 180Q225 145 243 119L265 154Q251 105 273 89Q298 137 277 157Q303 126 317 147Q308 181 277 184Z" fill="LIGHT"/>',
  '<path d="M260 165Q321 283 258 407M260 166v240" fill="none" stroke="LIGHT" stroke-width="5"/><path d="M225 276h74M287 266l12 10-12 10" fill="none" stroke="LIGHT" stroke-width="3"/>',
  '<path d="M262 171l-12 137 13 27 15-27-8-137Z" fill="LIGHT"/><path d="M239 331h48M263 335v72" stroke="LIGHT" stroke-width="6"/>',
  '<path d="M270 183v247" stroke="LIGHT" stroke-width="6"/><path d="M244 126h52v63h-52Z" fill="DARK" stroke="LIGHT" stroke-width="3"/><path d="M270 137l6 15 15 3-12 9 3 15-12-8-12 8 3-15-12-9 15-3Z" fill="LIGHT"/>',
  '<path d="M228 274l71-18 15 103-49 64-46-53Z" fill="DARK" stroke="LIGHT" stroke-width="7"/><path d="M236 289l50-14 11 77-31 46-33-36Z" fill="LIGHT" opacity=".4"/><path d="M264 294v76M244 322h43" stroke="LIGHT" stroke-width="7"/>',
];
let serial = 0;
export function portrait(hero, enemy = false) {
  const id = `art${serial++}`;
  const [light, dark, skin] = enemy
    ? ["#ff8379", "#622343", "#d9b6d5"]
    : palettes[hero.id];
  const short = [1, 4, 9, 11].includes(hero.id);
  const hair = short
    ? "M118 180Q105 113 170 112Q233 98 245 175L216 148L201 169L184 137L164 164L147 148Z"
    : "M112 200Q93 118 166 108Q245 91 251 191L271 350L215 321L209 172Q166 144 132 194L143 327L96 349Z";
  const deco = (value) =>
    value.replaceAll("LIGHT", light).replaceAll("DARK", dark);
  return `<svg class="hero-art" viewBox="0 0 360 480" role="img" aria-label="${enemy ? "星境守卫" : hero.title + " " + hero.name}"><defs><linearGradient id="${id}bg" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="#101626"/></linearGradient><linearGradient id="${id}hair" x2=".8" y2="1"><stop stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="${id}cape" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".5" stop-color="${dark}"/><stop offset="1" stop-color="#14172c"/></linearGradient><radialGradient id="${id}glow"><stop stop-color="${light}" stop-opacity=".45"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient></defs><rect width="360" height="480" fill="url(#${id}bg)"/><circle cx="190" cy="186" r="175" fill="url(#${id}glow)"/><g fill="none" stroke="${light}" opacity=".28"><circle cx="180" cy="200" r="133"/><circle cx="180" cy="200" r="145" stroke-dasharray="3 12"/><path d="M180 37L321 280H39Z"/><path d="M40 70L320 340M320 70L40 340"/></g><g fill="${light}" opacity=".7"><path d="M55 107l4 12 12 4-12 4-4 12-4-12-12-4 12-4ZM300 75l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/><circle cx="308" cy="230" r="2"/><circle cx="44" cy="273" r="2"/><circle cx="94" cy="45" r="2"/></g><path d="M126 258Q177 233 229 259L310 467H43Z" fill="url(#${id}cape)"/><path d="M133 271L98 463H56L108 307ZM218 267L259 463H307L246 306Z" fill="${dark}"/><path d="M150 238L149 267L180 292L209 266L205 232" fill="${skin}"/><path d="${hair}" fill="url(#${id}hair)"/><path d="M137 166Q139 142 176 141Q216 142 218 168L210 216Q180 259 146 217Z" fill="${skin}"/><path d="M136 175Q138 134 176 134Q219 129 222 180L202 159L193 173L174 148L154 176L148 164Z" fill="url(#${id}hair)"/><path d="M150 189l17-3M190 186l17 3" stroke="${dark}" stroke-width="4" stroke-linecap="round"/><path d="M154 190l9 1M194 191l9-1" stroke="${light}" stroke-width="3"/><path d="M171 219q9 5 18-1" fill="none" stroke="#b47783" stroke-width="2"/><path d="M178 194l-4 13h7" fill="none" stroke="#be9398"/>${deco(ornaments[enemy ? 1 : hero.id])}<path d="M144 265L178 291L211 265L236 298L213 338L231 459H125L145 338L120 297Z" fill="${dark}"/><path d="M144 265L179 299L212 265M132 301L155 329L144 399M226 301L204 329L215 399" fill="none" stroke="${light}" stroke-width="3"/><path d="M179 297l13 25-13 25-13-25Z" fill="${light}"/><path d="M133 394L224 394L228 413H128Z" fill="${light}" opacity=".7"/><path d="M134 273L120 297L93 317L104 340L138 327M225 273L242 300L260 326L244 346L215 322" fill="${light}" opacity=".7"/>${deco(costumes[enemy ? 1 : hero.id])}${deco(weapons[enemy ? 1 : hero.id])}<path d="M239 333q17-12 28 4l-1 19-23-1" fill="${skin}"/><path d="M134 354q-15 5-30-6l-14 24 27 12 24-15" fill="${skin}"/><g fill="${light}" opacity=".3"><path d="M0 455L65 430L95 480H0ZM360 420L312 448L274 480H360Z"/></g><rect y="440" width="360" height="40" fill="#0b1025" opacity=".25"/></svg>`;
}
