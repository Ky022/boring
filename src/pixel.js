const palettes = [
  ["#efe1ff", "#9f78c4", "#64518b", "#fff0c4"],
  ["#ed8a4a", "#be382f", "#672c39", "#efc574"],
  ["#847bc8", "#45325c", "#282b44", "#daa1bf"],
  ["#daefff", "#6fbfdd", "#3d709c", "#f8dda7"],
  ["#bda74b", "#5283ae", "#29466f", "#e7c361"],
  ["#8f69bd", "#554080", "#34335d", "#c5a4e4"],
  ["#d3e3a1", "#5b9b83", "#356758", "#e3d087"],
  ["#f5b4b2", "#439b9b", "#2c677a", "#fff0c6"],
  ["#a5c975", "#5a8050", "#345746", "#d9c393"],
  ["#b67848", "#ae633f", "#593f3b", "#efe0b6"],
  ["#ffe28f", "#a686c2", "#5a4e7f", "#f5eac8"],
  ["#728ca6", "#667a91", "#3c465f", "#d6ba89"],
];
export function pixelCharacter(hero, classes = "") {
  const url = new URL('art/pixel-heroes.webp', document.baseURI).href;
  // Art-directed row bounds keep every full weapon inside its own viewport.
  const rows = [0, 258, 493, 718, 916, 1121], row = Math.floor(hero.id / 8);
  const cols = [0, 172, 345, 518, 700, 876, 1055, 1235, 1403], col = hero.id % 8;
  const bounds = `x="${cols[col]+14}" y="${rows[row]}" width="${hero.id === 0 ? 130 : cols[col+1]-cols[col]-28}" height="${rows[row+1]-rows[row]}"`;
  return `<span class="pixel-character ${classes}" role="img" aria-label="${hero.name} · ${hero.title}" style="--sprite-x:${col / 7 * 100}%;--sprite-y:${row / 4 * 100}%"><svg viewBox="${cols[col]} ${rows[row]} ${cols[col + 1] - cols[col]} ${rows[row + 1] - rows[row]}" aria-hidden="true" overflow="hidden"><defs><clipPath id="pixel-clip-${hero.id}"><rect ${bounds}/></clipPath></defs><image href="${url}" width="1403" height="1121" clip-path="url(#pixel-clip-${hero.id})"/></svg></span>`;
}
export function sprite(hero, { background = false, enemy = false } = {}) {
  if (!enemy) return pixelCharacter(hero, `hero-art pixel-sprite ${background ? "framed" : ""}`);
  const n = enemy
    ? 1
    : hero.id < 12
      ? hero.id
      : { 骑士: 11, 战士: 1, 游侠: 6, 法师: 5, 治疗: 7 }[hero.role];
  const variant = enemy ? 0 : Math.floor(hero.id / 12);
  const [hair, cloth, shade, trim] = enemy
    ? ["#a0a4ad", "#6e4760", "#342f4a", "#fd826f"]
    : palettes[(n + variant * 3) % 12];
  let p = "";
  const rect = (x, y, w, h, c) =>
    (p += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`);
  const block = (x, y, w, h, c) => {
    rect(x - 1, y - 1, w + 2, h + 2, "#222739");
    rect(x, y, w, h, c);
  };
  if (background) {
    rect(0, 0, 40, 48, shade);
    rect(2, 2, 36, 44, "#171f35");
    for (let i = 0; i < 15; i++)
      rect(((i * 13 + n * 3) % 36) + 2, ((i * 7 + n * 5) % 38) + 3, 1, 1, trim);
    rect(5, 39, 30, 5, "#2e364c");
  }
  // Ground shadow, cloak and boots.
  rect(8, 43, 23, 3, "#18222b66");
  rect(9, 26, 23, 14, shade);
  rect(7, 31, 4, 10, cloth);
  rect(30, 29, 3, 13, cloth);
  block(13, 38, 6, 6, shade);
  block(22, 38, 6, 6, shade);
  rect(12, 43, 7, 2, trim);
  rect(22, 43, 7, 2, trim);
  // Silhouette, eyes and hair are deliberately different for each companion.
  block(12, 12, 17, 15, hair);
  block(14, 17, 12, 11, "#efc59f");
  rect(14, 26, 12, 2, "#c78c79");
  rect(16, 20, 2, 2, "#202639");
  rect(23, 20, 2, 2, "#202639");
  rect(20, 25, 3, 1, "#bd7c77");
  rect(12, 12, 17, 4, hair);
  rect(13, 16, 4, 3, hair);
  rect(24, 16, 4, 3, hair);
  if ([0, 2, 3, 5, 7, 10].includes(n)) {
    rect(10, 16, 3, 17, hair);
    rect(28, 15, 3, 19, hair);
    rect(9, 30, 5, 5, shade);
    rect(27, 31, 5, 5, shade);
  } else {
    rect(11, 12, 3, 8, hair);
    rect(27, 12, 3, 7, hair);
    rect(14, 10, 12, 3, hair);
  }
  block(13, 29, 15, 11, cloth);
  rect(15, 31, 3, 8, shade);
  rect(24, 31, 3, 8, shade);
  rect(18, 29, 5, 2, trim);
  rect(19, 32, 3, 5, trim);
  rect(13, 38, 15, 2, trim);
  block(9, 29, 4, 7, cloth);
  block(28, 29, 4, 7, cloth);
  rect(9, 36, 4, 3, "#efc59f");
  rect(29, 36, 3, 3, "#efc59f");
  switch (n) {
    case 0:
      rect(14, 9, 12, 2, trim);
      rect(17, 6, 7, 2, trim);
      rect(15, 7, 2, 3, trim);
      rect(22, 7, 2, 3, trim);
      rect(16, 9, 8, 1, "#b1a6ec");
      rect(34, 17, 2, 23, trim);
      rect(32, 10, 5, 7, "#fff1c7");
      rect(34, 10, 3, 5, shade);
      rect(33, 30, 3, 2, "#efc59f");
      break;
    case 1:
      rect(10, 10, 3, 5, "#f37d47");
      rect(27, 8, 3, 7, "#f37d47");
      rect(8, 8, 3, 3, trim);
      rect(30, 6, 2, 4, trim);
      rect(17, 29, 7, 7, "#a43832");
      rect(34, 15, 3, 18, "#ffe091");
      rect(35, 12, 1, 3, "#fff0ae");
      rect(32, 32, 7, 2, trim);
      rect(34, 34, 2, 7, shade);
      rect(32, 19, 1, 8, "#fc824c");
      break;
    case 2:
      rect(9, 11, 22, 6, shade);
      rect(12, 8, 17, 4, shade);
      rect(13, 26, 15, 4, shade);
      rect(29, 16, 2, 3, trim);
      rect(32, 18, 2, 3, trim);
      rect(35, 21, 2, 13, trim);
      rect(32, 34, 2, 4, trim);
      rect(29, 38, 2, 2, trim);
      rect(30, 19, 1, 20, "#d8bbbe");
      rect(30, 28, 8, 1, "#ceae8b");
      break;
    case 3:
      rect(12, 10, 17, 3, "#d8f8ff");
      rect(12, 7, 3, 4, "#d8f8ff");
      rect(25, 7, 3, 4, "#d8f8ff");
      rect(18, 4, 5, 6, "#d8f8ff");
      rect(18, 14, 4, 2, "#80a7e2");
      rect(34, 18, 2, 23, trim);
      rect(32, 10, 6, 7, "#a8e3fa");
      rect(34, 8, 2, 11, "#e7faff");
      rect(31, 13, 8, 2, "#e7faff");
      break;
    case 4:
      rect(11, 11, 19, 6, "#678baa");
      rect(11, 16, 4, 5, "#42627e");
      rect(25, 16, 5, 5, "#42627e");
      rect(20, 9, 2, 5, trim);
      rect(17, 32, 7, 5, "#e6d16b");
      rect(34, 10, 2, 31, trim);
      rect(32, 11, 6, 5, "#adc5d6");
      rect(34, 5, 2, 8, "#d8e4f2");
      break;
    case 5:
      rect(8, 10, 25, 4, shade);
      rect(12, 7, 17, 4, shade);
      rect(16, 3, 9, 5, shade);
      rect(18, 0, 4, 4, shade);
      rect(18, 8, 7, 2, trim);
      rect(15, 20, 4, 3, "#604d70");
      rect(22, 20, 4, 3, "#604d70");
      rect(19, 21, 3, 1, trim);
      block(31, 28, 7, 10, "#865b85");
      rect(32, 30, 5, 2, trim);
      rect(33, 34, 3, 3, trim);
      break;
    case 6:
      rect(9, 14, 4, 3, trim);
      rect(28, 14, 5, 3, trim);
      rect(9, 10, 3, 4, "#c8e3b1");
      rect(6, 8, 4, 3, "#c8e3b1");
      rect(5, 5, 3, 4, "#c8e3b1");
      rect(14, 29, 13, 3, "#cee2ad");
      rect(32, 19, 5, 3, "#bce4cb");
      rect(31, 22, 3, 11, "#a3ceae");
      rect(33, 33, 4, 3, "#bce4cb");
      rect(31, 36, 2, 5, trim);
      break;
    case 7:
      rect(13, 10, 14, 3, "#ffa8b2");
      rect(12, 7, 3, 4, "#ffa8b2");
      rect(18, 5, 3, 6, "#ffa8b2");
      rect(25, 7, 3, 4, "#ffa8b2");
      rect(14, 32, 13, 4, "#cfebde");
      rect(18, 32, 5, 1, "#60b6b6");
      rect(34, 16, 2, 25, trim);
      rect(32, 11, 6, 6, "#98dbd2");
      rect(34, 7, 2, 6, "#e6ffe8");
      rect(31, 13, 8, 2, "#e6ffe8");
      break;
    case 8:
      rect(11, 12, 19, 4, shade);
      rect(17, 9, 8, 3, shade);
      rect(24, 7, 2, 4, "#c9e4a3");
      rect(11, 20, 3, 2, "#e6bf93");
      rect(28, 20, 3, 2, "#e6bf93");
      rect(15, 30, 11, 3, "#a3b66f");
      rect(33, 17, 2, 3, trim);
      rect(35, 20, 2, 15, trim);
      rect(33, 35, 2, 3, trim);
      rect(32, 19, 1, 18, "#bdaa83");
      rect(30, 28, 8, 1, trim);
      break;
    case 9:
      rect(13, 10, 15, 4, hair);
      rect(20, 9, 9, 2, hair);
      rect(16, 30, 9, 3, "#ccd9dd");
      rect(35, 22, 2, 13, "#d5e5e8");
      rect(33, 35, 6, 2, trim);
      rect(35, 37, 2, 4, shade);
      break;
    case 10:
      rect(15, 5, 11, 2, trim);
      rect(14, 7, 2, 3, trim);
      rect(26, 7, 2, 3, trim);
      rect(15, 10, 11, 1, trim);
      rect(17, 31, 7, 6, "#fbe3a4");
      rect(34, 19, 2, 22, trim);
      block(31, 13, 7, 8, "#a17984");
      rect(33, 15, 3, 4, "#ffde8e");
      rect(32, 12, 5, 1, trim);
      break;
    case 11:
      rect(11, 11, 19, 8, "#a3bac4");
      rect(15, 10, 11, 2, trim);
      rect(12, 22, 17, 7, shade);
      rect(16, 23, 10, 2, "#8ea3b7");
      block(30, 28, 8, 13, shade);
      rect(31, 29, 6, 10, "#a1b0c2");
      rect(33, 30, 2, 9, trim);
      rect(31, 33, 6, 2, trim);
      rect(14, 29, 13, 8, "#a5b9c7");
      break;
  }
  if (variant) {
    const marks = ["#79d6ef", "#f8c46b", "#ec94c6"];
    rect(18, 15, 5, 2, marks[variant - 1]);
    rect(7, 28, 3, 9, trim);
    rect(29, 40, 4, 2, marks[variant - 1]);
    if (hero.role === "骑士") {
      block(3, 30, 7, 10, cloth);
      rect(5, 32, 3, 6, trim);
    }
    if (hero.role === "法师") {
      rect(3, 9, 3, 3, marks[variant - 1]);
      rect(6, 5, 2, 2, trim);
    }
    if (hero.role === "治疗") {
      rect(5, 18, 5, 2, trim);
      rect(7, 16, 1, 6, trim);
    }
  }
  return `<svg class="hero-art pixel-sprite ${background ? "framed" : ""}" viewBox="0 0 40 48" shape-rendering="crispEdges" role="img" aria-label="${enemy ? "星渊守卫" : hero.name + " · " + hero.title}">${p}</svg>`;
}
export function portrait(hero, enemy = false) {
  return sprite(hero, { background: true, enemy });
}
export function scenery(theme = "town") {
  let out = "";
  const r = (x, y, w, h, c) =>
    (out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`);
  const poly = (points, c) =>
    (out += `<polygon points="${points}" fill="${c}"/>`);
  const night = theme === "night" || theme === "town-night";
  r(0, 0, 384, 240, night ? "#27394d" : "#83bcc1");
  r(0, 34, 384, 51, night ? "#3a4d5d" : "#abd7cb");
  r(0, 85, 384, 55, night ? "#516268" : "#b7cfb6");
  for (let i = 0; i < 8; i++) {
    const x = (i * 59) % 380,
      y = 16 + ((i * 11) % 40);
    r(x, y, 28, 6, night ? "#6e839180" : "#e3e9ca");
    r(x + 6, y - 4, 15, 4, night ? "#6e839180" : "#e3e9ca");
  }
  poly(
    "0,136 30,100 48,119 92,73 140,122 171,96 215,139 266,88 323,123 354,82 384,133 384,174 0,174",
    night ? "#3d5b60" : "#78988a",
  );
  poly(
    "0,139 62,119 95,134 160,111 219,146 295,123 351,138 384,117 384,189 0,189",
    night ? "#3f645a" : "#5c8877",
  );
  r(0, 160, 384, 80, night ? "#36574c" : "#78a16c");
  r(0, 186, 384, 54, night ? "#446353" : "#86a66e");
  const tree = (x, y, size = 1) => {
    r(x + 8 * size, y + 17 * size, 6 * size, 21 * size, "#635443");
    r(x + 10 * size, y + 20 * size, 2 * size, 17 * size, "#927650");
    r(x, y + 8 * size, 22 * size, 15 * size, "#365c54");
    r(x + 3 * size, y + 2 * size, 16 * size, 20 * size, "#477561");
    r(x + 5 * size, y, 12 * size, 17 * size, "#5d8d68");
    r(x + 5 * size, y + 3 * size, 5 * size, 7 * size, "#79a872");
  };
  if (theme === "town" || theme === "town-night") {
    poly("154,130 216,130 236,240 137,240", "#baab81");
    for (let y = 150; y < 240; y += 10)
      for (let x = 143; x < 231; x += 17)
        r(x + (y % 20 ? 5 : 0), y, 12, 3, "#ac9c77");
    const house = (x, y, w, h, roof) => {
      r(x - 3, y + h - 3, w + 6, 5, "#526c54");
      r(x, y, w, h, "#e4cf9f");
      r(x + 4, y + 3, w - 8, h - 3, "#ccb785");
      r(x, y, w, 4, "#78634a");
      r(x, y, 3, h, "#78634a");
      r(x + w - 3, y, 3, h, "#78634a");
      r(x + Math.floor(w / 2) - 5, y + h - 20, 10, 20, "#5b5a50");
      r(x + Math.floor(w / 2) - 4, y + h - 18, 7, 16, "#7b7056");
      for (const dx of [8, w - 16]) {
        r(x + dx, y + 12, 8, 10, "#6c7e7e");
        r(x + dx + 1, y + 13, 6, 7, "#e9d192");
        r(x + dx + 4, y + 13, 1, 8, "#68594a");
      }
      poly(
        `${x - 6},${y} ${x + w / 2},${y - 25} ${x + w + 6},${y} ${x + w + 6},${y + 5} ${x - 6},${y + 5}`,
        roof,
      );
      for (let n = 1; n < 5; n++)
        r(x + 3 + n * 4, y - 20 + n * 4, w - 6 - n * 8, 2, "#ffffff18");
      r(x + w - 16, y - 22, 6, 12, "#675444");
    };
    house(24, 118, 72, 52, "#75678c");
    house(269, 119, 79, 54, "#5b8693");
    house(67, 62, 48, 46, "#bc7d65");
    house(277, 71, 45, 42, "#a07377");
    r(163, 54, 58, 78, "#bbcab3");
    r(167, 50, 50, 74, "#d6d5af");
    r(157, 50, 70, 7, "#59777b");
    r(165, 40, 11, 13, "#d5d0ab");
    r(184, 40, 13, 13, "#d5d0ab");
    r(207, 40, 11, 13, "#d5d0ab");
    r(179, 108, 25, 24, "#5e7478");
    r(183, 104, 17, 27, "#526569");
    r(175, 65, 10, 14, "#7b9a9a");
    r(199, 65, 10, 14, "#7b9a9a");
    r(189, 44, 4, 25, "#8d745b");
    r(193, 44, 16, 9, "#9f637e");
    r(193, 51, 10, 5, "#9f637e");
    r(160, 163, 62, 9, "#688b88");
    r(165, 159, 53, 8, "#9bb9a9");
    r(171, 160, 39, 4, "#7dc4c7");
    r(186, 144, 8, 16, "#bbccc1");
    r(180, 141, 20, 4, "#a7c3b7");
    r(188, 130, 4, 13, "#97cbcd");
    tree(2, 86, 2);
    tree(339, 91, 2);
    tree(7, 177, 1.5);
    tree(329, 188, 1.5);
    r(114, 162, 3, 20, "#6b6151");
    r(118, 162, 11, 3, "#6b6151");
    r(124, 164, 6, 8, "#d7b677");
    r(103, 165, 10, 11, "#a98371");
    r(104, 167, 8, 6, "#dcd1a4");
  } else {
    for (const [x, y, size] of [
      [0, 85, 2],
      [322, 66, 2],
      [42, 106, 1.5],
      [264, 92, 1.5],
      [5, 164, 1],
      [349, 161, 1],
    ])
      tree(x, y, size);
    r(0, 221, 384, 19, "#647452");
    for (let i = 0; i < 20; i++)
      r((i * 29) % 380, 206 + ((i * 13) % 24), 5, 3, "#a3ac76");
  }
  for (let i = 0; i < 30; i++) {
    const x = (i * 37 + 12) % 384,
      y = 174 + ((i * 19) % 62);
    r(x, y, 2, 3, "#b7bd79");
    if (i % 4 === 0) {
      r(x, y - 2, 2, 2, "#e7c09f");
      r(x + 2, y, 2, 2, "#c3918d");
    }
  }
  return `<svg class="pixel-scene" viewBox="0 0 384 240" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" aria-hidden="true">${out}</svg>`;
}
export function monster(kind = 0) {
  const index = Math.max(0, Math.min(2, Number(kind) || 0));
  const x = index * 724;
  const url = new URL("art/enemies.webp", document.baseURI).href;
  return `<svg class="hero-art pixel-sprite monster" viewBox="${x} 0 724 724" role="img" aria-label="${["荆棘史莱姆", "荒林哥布林", "石甲守卫"][index]}"><defs><clipPath id="enemy-cell-${index}"><rect x="${x}" y="0" width="724" height="724"/></clipPath></defs><image href="${url}" width="2172" height="724" clip-path="url(#enemy-cell-${index})"/></svg>`;
}
