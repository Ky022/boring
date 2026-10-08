import './endgame.css';
import {difficultyView,randomRelicView,collectionChallengeView} from './endgame-ui.js';
import {endgameState,skins} from './endgame.js';
let difficultyMode='hard',difficultyStage=1;
import './cute-ui.css';
import './refinement.css';
import './polish.css';
import {skillArt,actionGroups} from './art-direction.js';
import './mobile-redesign.css';
import './core-ui.css';
import {growthView} from './growth-ui.js';
import './voyage.css';
import {wireCamp,wireHeroSwipe} from './camp-life.js';
import {weeklyView as voyageWeeklyView} from './weekly-ui.js';
import "./reboot.css";
import { rebootHome, rebootSummon, rebootCampaign, expeditionView } from "./reboot-ui.js";
import { growthGoals, summarizePulls } from "./journey.js";
import { worldScene, screenBanner, campaignMap, teamStrip, accountBanner, wireWorld } from "./world-ui.js";
import { galleryView, heroDetailView, heroSkills, gameIcon } from "./hero-ui.js";
import {
  illustration,
  formationView,
  forgeView,
  dungeonView,
  welfareView,
  rewardDots,
  wireRevamp,
  openEquipmentRevamp,
} from "./revamp-ui.js";
import { rewardText, formationPositions } from "./progression.js";
import { districtArt } from "./town.js";
import { portrait, sprite, scenery, monster } from "./pixel.js";
import {
  heroes,
  rarities,
  fresh,
  power,
  enemyPower,
  migrate,
  applyAction,
  level,
  upgradeCost,
  teamPower,
  idleReward,
  starCost,
  dailyTasks,
  dailyState,
  chapters,
  maxStage,
  stageEnemies,
  formationBonuses,
  combatTeam,
  simulateCombat,
} from "./game.js";
import {
  cloud,
  api,
  connect,
  signIn,
  signOut,
  refreshCloud,
  mutate,
  bootCloud,
} from "./cloud.js";
let growthPanel="level";
const key = "astral-cards-v1";
let state = fresh(),
  tab = "home",
  townPage = 1,
  selectedHero = 8,
  collectionMode = "heroes",
  heroDetailOpen = false,
  heroCodex = false,
  heroElement = "全部",
  heroGalleryScroll = 0,
  homeDrawer = "",
  summonPanel = "summon",
  summonCurrency = "auto",
  communityPanel = "guild",
  rosterFilter = "全部",
  rosterSort = "power",
  rosterRole = "全部",
  chapterPage = null,
  adventureMode = "campaign",
  selectedFriend = "",
  friendsList = [],
  results = [],
  report = null,
  notice = "",
  storageWarning = "";
try {
  const saved = JSON.parse(localStorage.getItem(key));
  const restored = migrate(saved);
  if (restored) {
    state = restored;
    if (saved.idleClaimAt === undefined)
      localStorage.setItem(key, JSON.stringify(state));
  }
} catch {
  storageWarning = "浏览器存储不可用，进度可能无法保存。";
}
function save() {
  if (cloud.user) return;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    storageWarning = "无法保存进度，请检查浏览器存储权限。";
  }
}
const $ = document.querySelector("#app");
function card(h, compact = false) {
  return `<article class="card ${h.rarity} ${compact ? "compact" : ""}" style="--accent:${rarities[h.rarity].color}"><span class="rarity">${h.rarity}</span><span class="card-stars">${"★".repeat(state.stars?.[h.id] || 0) || "✦".repeat({ R: 2, SR: 3, SSR: 4, UR: 5 }[h.rarity])}</span><div class="portrait" data-detail="${h.id}" tabindex="0" role="button" aria-label="查看${h.name}详情">${compact?sprite(h):illustration(h)}<div class="portrait-shine"></div></div><div class="card-info"><small>${h.title} · ${h.element} · Lv.${level(state, h.id)}</small><h3>${h.name}</h3><div class="stats">⚔ ${power(state, h.id)} <span>${state.collection[h.id] ? `已拥有 ×${state.collection[h.id]}` : "未拥有"}</span></div></div></article>`;
}
let busy = false,
  socialData = { messages: [], opponents: [], history: [] },
  chatChannel = "world",
  chatError = "";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
async function dispatch(action) {
  $.dataset.saving="true";
  if (cloud.user) {
    if (selectedFriend && ["battle", "elite", "tower"].includes(action.type))
      action = { ...action, supportFriend: selectedFriend };
    const data = await mutate(action);
    storageWarning="";
    state = migrate(data.state) || data.state;
    return data.result;
  }
  const result = applyAction(state, action);
  save();
  return result;
}
async function run(task) {
  if (busy) return;
  busy = true;
  $.querySelectorAll("button").forEach((b) => (b.disabled = true));
  try {
    await task();
  } catch (e) {
    notice = e.message;
    if(cloud.user&&!e.status){storageWarning="连接中断：操作结果待确认，请刷新云端存档后继续。";}
    if (e.status === 409 && cloud.user) {
      try {
        state = (await refreshCloud()).state;
        storageWarning="";
      } catch {}
    }
  } finally {
    busy = false;
    delete $.dataset.saving;
    render();
  }
}
function revampContext() {
  return {
    root: $,
    getState: () => state,
    dispatch,
    run,
    render,
    modal,
    setNotice: (v) => (notice = v),
    showBattle,
    isBusy: () => busy,
    navigateEquipment: destination => {if(destination==='daily'){tab='adventure';adventureMode='daily';}else{tab='collection';collectionMode='forge';}render();if(destination==='shop')$.querySelector('[data-forge-panel="shop"]')?.click();},
  };
}
let stopCamp=()=>{};
let liteMode=false;try{liteMode=localStorage.getItem("astral-lite-mode")==="1";}catch{}
function render() {
  stopCamp();
  document.body.classList.toggle("lite-mode",liteMode);
  $.classList.toggle('hero-detail-open', tab === 'collection' && collectionMode === 'heroes' && heroDetailOpen);
  $.classList.toggle('hero-gallery-open', tab === 'collection' && collectionMode === 'heroes' && !heroDetailOpen);
  const retainedDetails =
    $.dataset.screen === tab
      ? [
          ".preset-details",
          ".formation-options",
          ".equipment-shop",
          ".adventure-options",
          ".summon-rules",
        ].map((selector) => [selector, $.querySelector(selector)?.open])
      : [];
  const scrollSelectors = [
    "#content",
    ".screen-panel",
    ".home-drawer",
    ".avatar-roster",
    ".hero-gallery-grid",
    ".inline-formation-roster",
  ];
  const retained =
    $.dataset.screen === tab
      ? scrollSelectors.map((selector) => [
          selector,
          $.querySelector(selector)?.scrollTop || 0,
        ])
      : [];
  $.dataset.screen = tab;
  $.innerHTML = `<header class="game-hud"><button class="player-avatar" style="border-color:${skins[endgameState(state).skin]?.color||'#e7d2a1'}" data-tab="account" aria-label="玩家账号">${sprite(heroes[state.team[0]??8])}</button><button class="r-traveler" data-tab="account"><b>${esc(cloud.user?.username||'星灯旅人')}</b><small>${esc(endgameState(state).title)||(cloud.user?'云端存档':'游客存档')} · V11</small></button><div class="hud-resources"><div class="wallet">${gameIcon("summon")}<b>${state.gems.toLocaleString()}</b></div><div class="coin-wallet"><span>●</span><b>${state.coins.toLocaleString()}</b></div></div><button class="sound-toggle" id="sound-toggle" aria-label="切换音效">${soundOn?'♫':'♪'}</button>${document.documentElement.requestFullscreen?'<button class="fullscreen-button" data-fullscreen aria-label="切换全屏">⛶</button>':''}</header><main class="game-stage"><section id="content">${tab === "home" ? homeView() : tab === "summon" ? summonView() : tab === "collection" ? collectionView() : tab === "adventure" ? adventureView() : tab === "social" ? socialView() : tab === "arena" ? arenaView() : accountView()}</section></main><nav class="game-dock">${[
    ["home", "⌂", "营地"],
    ["summon", "✧", "召唤"],
    ["collection", "⚔", "英雄"],
    ["adventure", "➶", "冒险"],
    ["social", "♜", "旅团"],

  ]
    .map(
      ([id, icon, label]) =>
        `<button data-tab="${id}" class="${tab === id ? "active" : ""}" aria-label="${label}">${gameIcon(id)}<small>${label}</small></button>`,
    )
    .join(
      "",
    )}</nav>${storageWarning ? `<p class="storage-notice">${esc(storageWarning)}</p>` : ""}${notice ? `<div class="game-toast" role="status">${esc(notice)}</div>` : ""}`;
  $.querySelector('.endgame-page .scene-tabs .active')?.scrollIntoView({block:'nearest',inline:'nearest'});
  wireWorld($);
  stopCamp=wireCamp($,id=>{selectedHero=id;tab="collection";collectionMode="heroes";heroDetailOpen=true;render();},liteMode);
  wireHeroSwipe($,direction=>$.querySelector(`[data-hero-step="${direction}"]`)?.click());
  $.querySelectorAll("[data-expedition-route]").forEach(b=>b.onclick=()=>run(async()=>{await dispatch({type:"expeditionRoute",route:b.dataset.expeditionRoute});notice="本场路线已确定";}));
  $.querySelectorAll('[data-difficulty-mode]').forEach(b=>b.onclick=()=>{difficultyMode=b.dataset.difficultyMode;difficultyStage=Math.min(36,endgameState(state)[difficultyMode]+1);render();});
  const ds=$.querySelector('[data-difficulty-stage]');if(ds)ds.onchange=()=>{difficultyStage=Number(ds.value);render();};
  $.querySelectorAll('[data-difficulty-fight]').forEach(b=>b.onclick=()=>run(async()=>{const r=await dispatch({type:'difficultyFight',mode:b.dataset.difficultyFight,stage:Number(b.dataset.difficultyLevel)});if(r.won)difficultyStage=r.nextDifficultyStage;showBattle(r);}));
  $.querySelectorAll('[data-collection-fight]').forEach(b=>b.onclick=()=>run(async()=>showBattle(await dispatch({type:'collectionFight',id:b.dataset.collectionFight}))));
  const rs=$.querySelector('[data-relic-start]');if(rs)rs.onclick=()=>run(async()=>{await dispatch({type:'relicStart'});notice='新的遗迹路线已生成';});
  $.querySelectorAll('[data-relic-route]').forEach(b=>b.onclick=()=>run(async()=>{await dispatch({type:'relicRoute',route:b.dataset.relicRoute});}));
  $.querySelectorAll('[data-relic-boon]').forEach(b=>b.onclick=()=>run(async()=>{await dispatch({type:'relicBoon',id:b.dataset.relicBoon});notice='强化已生效';}));
  const rf=$.querySelector('[data-relic-fight]');if(rf)rf.onclick=()=>run(async()=>showBattle(await dispatch({type:'relicFight'})));
  const title=$.querySelector('[data-endgame-title]');if(title)title.onchange=()=>run(async()=>{await dispatch({type:'cosmeticEquip',title:title.value});});
  const skin=$.querySelector('[data-endgame-skin]');if(skin)skin.onchange=()=>run(async()=>{await dispatch({type:'cosmeticEquip',skin:skin.value});});
  const weekFight=$.querySelector("[data-weekly-fight]");if(weekFight)weekFight.onclick=()=>run(async()=>{const r=await dispatch({type:"weeklyFight"});showBattle(r);notice=r.won?"本周挑战进度已保存":"可以调整阵容后重试";});
  const collect=$.querySelector("[data-daily-collect]");if(collect)collect.onclick=()=>run(async()=>{const r=await dispatch({type:"dailyCollect"});notice=`任务领取：${r.gems}星钻 · ${r.coins}金币`;});
  const lite=$.querySelector("[data-lite-mode]");if(lite)lite.onclick=()=>{liteMode=!liteMode;try{localStorage.setItem("astral-lite-mode",liteMode?"1":"0");}catch{}render();};
  $.querySelectorAll('[data-summon-panel]').forEach(b=>b.onclick=()=>{summonPanel=b.dataset.summonPanel;render();});
  $.querySelectorAll('[data-summon-currency]').forEach(b=>b.onclick=()=>{summonCurrency=b.dataset.summonCurrency;render();});
  $.querySelectorAll('[data-wish]').forEach(b=>b.onclick=()=>run(async()=>{
    const id=Number(b.dataset.wish),ids=[...state.odyssey.wishlist];
    if(ids.includes(id))ids.splice(ids.indexOf(id),1);else ids.push(id);
    await dispatch({type:'wishlist',ids});notice='心愿单已保存';
  }));
  $.querySelectorAll('[data-shard-recruit]').forEach(b=>b.onclick=()=>run(async()=>{const r=await dispatch({type:'shardRecruit',id:Number(b.dataset.shardRecruit)});notice=`获得${heroes[r.id].name} · 心愿又近一步`; }));
  $.querySelectorAll('[data-chapter-reward]').forEach(b=>b.onclick=()=>run(async()=>{const r=await dispatch({type:'chapterReward',chapter:Number(b.dataset.chapterReward)});notice=`章节奖励：${r.tickets}张券 · ${r.shards}碎片 · ${r.coins}金币`; }));
  $.querySelectorAll('[data-campaign-sweep]').forEach(b=>b.onclick=()=>run(async()=>{const r=await dispatch({type:'campaignSweep',stage:state.stage,count:Number(b.dataset.campaignSweep)});notice=`扫荡完成：强化石${r.stones} · 经验药剂${r.experience}`; }));
  $.querySelectorAll('[data-expedition-start]').forEach(b=>b.onclick=()=>run(async()=>{await dispatch({type:'expeditionStart',tier:Number(b.dataset.expeditionStart)});notice='远征出发，途中生命会继承';}));
  $.querySelectorAll('[data-expedition-boon]').forEach(b=>b.onclick=()=>run(async()=>{await dispatch({type:'expeditionBoon',boon:b.dataset.expeditionBoon});notice='祝福已加入本次远征';}));
  const expeditionFight=$.querySelector('[data-expedition-fight]');
  if(expeditionFight)expeditionFight.onclick=()=>run(async()=>{const r=await dispatch({type:'expeditionFight'});showBattle(r);notice=r.won?'远征战斗胜利，进度已保存':'本次远征结束，可以重新出发';});
  const abandon=$.querySelector('[data-expedition-abandon]');
  if(abandon)abandon.onclick=()=>{const m=modal('<h2>放弃本次远征？</h2><p>本次生命与祝福将结束，可以重新出发。已领取的每日奖励保持记录。</p><button class="secondary" data-confirm-abandon>确认放弃</button><button class="primary" data-close>继续远征</button>','放弃远征');m.dialog.querySelector('[data-confirm-abandon]').onclick=()=>{m.end();run(async()=>{await dispatch({type:'expeditionAbandon'});notice='本次远征已结束';});};};
  wirePortraitLoading($);
  const full = $.querySelector("[data-fullscreen]");
  if (full)
    full.onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        notice = "此浏览器暂不支持全屏，可添加到手机主屏幕使用";
        render();
      }
    };
  for (const [selector, open] of retainedDetails) {
    const node = $.querySelector(selector);
    if (node && open !== undefined) node.open = open;
  }
  for (const [selector, top] of retained) {
    const node = $.querySelector(selector);
    if (node) node.scrollTop = top;
  }
  $.querySelectorAll('[data-goal]').forEach(b=>b.onclick=()=>{
    const goal=growthGoals(state)[Number(b.dataset.goal)];if(!goal)return;
    tab=goal.tab;homeDrawer='';
    if(tab==='collection'){collectionMode=goal.mode||'heroes';heroDetailOpen=goal.hero!==undefined;if(goal.hero!==undefined)selectedHero=goal.hero;}
    if(tab==='adventure')adventureMode=goal.mode||'campaign';
    render();
  });
  wireTown();
  wireRevamp(revampContext());
  $.querySelectorAll("[data-adventure-mode]").forEach(
    (b) =>
      (b.onclick = () => {
        adventureMode = b.dataset.adventureMode;
        if(adventureMode==='challenge')difficultyStage=Math.min(36,endgameState(state)[difficultyMode]+1);
        tab="adventure";
        render();
      }),
  );
  const presetMount = $.querySelector("#preset-mount");
  if (presetMount) presetMount.innerHTML = presetView();
  $.querySelectorAll("[data-ticket-pull]").forEach(ticketButton =>
    ticketButton.onclick = () =>
      run(async () => {
        const before = {...state.collection};
        results = await dispatch({ type: "ticketSummon", count: Number(ticketButton.dataset.ticketPull) });
        showSummon(summarizePulls(results,before));
        notice = "召唤券招募完成";
      }));
  $.querySelectorAll("[data-collection-mode]").forEach(
    (b) =>
      (b.onclick = () => {
        collectionMode = b.dataset.collectionMode;
        heroDetailOpen = false;
        render();
      }),
  );
  $.querySelectorAll("[data-select-hero]").forEach(
    (b) =>
      (b.onclick = () => {
        selectedHero = Number(b.dataset.selectHero);
        heroGalleryScroll = $.querySelector('.hero-gallery-grid')?.scrollTop || 0;
        heroDetailOpen = true;
        render();
      }),
  );
  $.querySelectorAll('[data-hero-back]').forEach(b => b.onclick = () => {
    heroDetailOpen = false;
    render();
    const list = $.querySelector('.hero-gallery-grid');
    if (list) list.scrollTop = heroGalleryScroll;
  });
  $.querySelectorAll('[data-gallery-mode]').forEach(b => b.onclick = () => { heroCodex = b.dataset.galleryMode === 'codex'; render(); });
  const codexButton = $.querySelector('[data-gallery-codex]');
  if (codexButton) codexButton.onclick = () => { heroCodex = !heroCodex; render(); };
  $.querySelectorAll('[data-hero-filter]').forEach(b => b.onclick = () => { heroElement = b.dataset.heroFilter; render(); });
  $.querySelectorAll('[data-hero-step]').forEach(b => b.onclick = () => {
    const ids = heroes.filter(h => (heroCodex || state.collection[h.id]) && (heroElement === '全部' || h.element === heroElement) && (rosterRole === '全部' || h.role === rosterRole)).sort((a,b) => Number(!!state.collection[b.id]) - Number(!!state.collection[a.id]) || heroSortValue(b) - heroSortValue(a)).map(h => h.id);
    const index = ids.indexOf(selectedHero);
    selectedHero = ids[(index + Number(b.dataset.heroStep) + ids.length) % ids.length] ?? selectedHero;
    render();
  });
  $.querySelectorAll('[data-hero-growth]').forEach(b => b.onclick = () => openHero(Number(b.dataset.heroGrowth)));
  $.querySelectorAll('[data-hero-skill]').forEach(b => b.onclick = () => {
    const skill = heroSkills(heroes[selectedHero])[Number(b.dataset.heroSkill)];
    const demo=simulateCombat([combatTeam(state).find(u=>u.id===selectedHero)||{...heroes[selectedHero],power:100,position:0}],[{name:"训练木偶",role:"骑士",element:"风",power:180}],()=>.99);
    const previewEvents=demo.events.filter(e=>e.actor==="p0"&&e.round===3);
    modal(`<div class="hero-info-dialog"><div class="v-skill-preview">${sprite(heroes[selectedHero])}<span>→</span>${monster(0)}</div><small>技能演示 · 第三回合释放</small><p>${previewEvents.map(e=>esc(e.skill)).filter((v,i,a)=>a.indexOf(v)===i).join(" · ")||"请在战斗中查看技能效果"}</p>${skillArt(heroes[selectedHero],Number(b.dataset.heroSkill))}<small>英雄技能</small><h2>${skill.name}</h2><p>${skill.text}</p><button class="primary" data-close>关闭</button></div>`, skill.name);
  });
  $.querySelectorAll('[data-hero-story]').forEach(b => b.onclick = () => {
    const h = heroes[Number(b.dataset.heroStory)];
    modal(`<div class="hero-info-dialog">${sprite(h)}<small>${h.faction} · ${h.role}</small><h2>${h.name} · ${h.title}</h2><p>${h.story}</p><button class="primary" data-close>返回</button></div>`, '英雄档案');
  });
  $.querySelectorAll("[data-home-drawer]").forEach(
    (b) =>
      (b.onclick = () => {
        homeDrawer = b.dataset.homeDrawer;
        render();
      }),
  );
  const closeDrawer = $.querySelector("[data-dismiss-drawer]");
  if (closeDrawer)
    closeDrawer.onclick = () => {
      homeDrawer = "";
      render();
    };
  $.querySelectorAll("[data-community-panel]").forEach(
    (b) =>
      (b.onclick = () => {
        communityPanel = b.dataset.communityPanel;
        render();
        if (cloud.user) loadSocial();
      }),
  );
  $.querySelector("#sound-toggle").onclick = () => {
    soundOn = !soundOn;
    render();
    if (soundOn) tone(660, 0.16);
  };
  $.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        tab = b.dataset.tab;
        if (tab === "adventure")
          chapterPage = Math.floor((state.stage - 1) / 3);
        if (b.dataset.buildingKind === "tower") adventureMode = "tower";
        else if (tab === "adventure") adventureMode = "campaign";
        if (b.dataset.buildingKind === "friends") communityPanel = "friends";
        else if (tab === "social") communityPanel = "guild";
        if (b.dataset.buildingKind === "forge") collectionMode = "forge";
        else if (b.dataset.buildingKind === "formation")
          collectionMode = "formation";
        else if (b.dataset.buildingKind === "workshop")
          collectionMode = "heroes";
        if (b.dataset.streetHero) {
          selectedHero = Number(b.dataset.streetHero);
          collectionMode = "heroes";
          heroDetailOpen = true;
        }
        homeDrawer = "";
        notice = "";
        render();
        if (cloud.user && ["social", "arena", "adventure"].includes(tab))
          loadSocial();
      }),
  );
  $.querySelectorAll("[data-pull]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const before = {...state.collection};
          results = await dispatch({ type: "summon", count: +b.dataset.pull });
          notice = `召唤完成，获得 ${results.length} 位伙伴！`;
          showSummon(summarizePulls(results,before));
        })),
  );
  $.querySelectorAll("[data-team]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const id = +b.dataset.team;
          const positions = formationPositions(state),
            index = positions.indexOf(id);
          if (index >= 0) positions[index] = null;
          else {
            const preferred =
              heroes[id].role === "治疗"
                ? [3, 4, 5, 0, 1, 2]
                : [0, 1, 2, 3, 4, 5];
            const position = preferred.find((i) => positions[i] === null);
            if (position === undefined)
              throw Error("队伍最多 6 人，请到阵容页点站位替换");
            positions[position] = id;
          }
          await dispatch({ type: "formation", positions });
          notice = "队伍已更新";
        })),
  );
  $.querySelectorAll("[data-stage]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          await dispatch({ type: "stage", stage: +b.dataset.stage });
          report = null;
          chapterPage = Math.floor((state.stage - 1) / 3);
        })),
  );
  $.querySelectorAll("[data-upgrade]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const result = await dispatch({
            type: "upgrade",
            id: +b.dataset.upgrade,
          });
          notice = `${heroes[result.id].name} 升至 Lv.${result.level}`;
        })),
  );
  $.querySelectorAll("[data-buy]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const g = await dispatch({ type: "buy", item: b.dataset.buy });
          notice = `获得装备：${g.name}`;
        })),
  );
  $.querySelectorAll("[data-equip]").forEach(
    (b) =>
      (b.onclick = () =>
        openEquipmentRevamp(
          +b.dataset.equip,
          revampContext(),
          b.dataset.equipSlot || "weapon",
        )),
  );
  $.querySelectorAll("[data-duel]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const duel = await dispatch({
            type: "arena",
            opponent: b.dataset.duel,
          });
          notice = `${duel.won ? "竞技胜利" : "竞技落败"}：${duel.dealt} vs ${duel.target}，金币 +${duel.coins}，积分 ${duel.ratingDelta > 0 ? "+" : ""}${duel.ratingDelta}`;
          await loadSocial(false);
          showBattle(duel);
        })),
  );
  const fight = $.querySelector("#fight");
  if (fight)
    fight.onclick = () =>
      run(async () => {
        report = await dispatch({ type: "battle" });
        chapterPage = Math.floor((state.stage - 1) / 3);
        notice = `${report.won ? "挑战成功，金币 +" + report.coins : "挑战失败，再接再厉"}`;
        showBattle(report);
      });
  const next = $.querySelector("#next");
  if (next)
    next.onclick = () =>
      run(async () => {
        await dispatch({
          type: "stage",
          stage: Math.min(maxStage, state.cleared + 1),
        });
        chapterPage = Math.floor((state.stage - 1) / 3);
        report = null;
      });
  $.querySelectorAll("[data-detail]").forEach((b) => {
    b.onclick = () => openHero(+b.dataset.detail);
    b.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openHero(+b.dataset.detail);
      }
    };
  });
  $.querySelectorAll("[data-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        rosterFilter = b.dataset.filter;
        render();
      }),
  );
  $.querySelectorAll("[data-task]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await dispatch({ type: "daily", task: b.dataset.task });
          notice = `领取成功：✦${r.gems} ◈${r.coins}`;
        })),
  );
  $.querySelectorAll("[data-forge]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await dispatch({ type: "forge", item: b.dataset.forge });
          notice = `${r.name} 强化至 +${r.level}`;
        })),
  );
  $.querySelectorAll("[data-move]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const team = [...state.team],
            index = team.indexOf(+b.dataset.move),
            next = index + Number(b.dataset.direction);
          if (next < 0 || next >= team.length) return;
          [team[index], team[next]] = [team[next], team[index]];
          await dispatch({ type: "team", team });
          notice = "阵容顺序已调整：前三位前排，后三位后排";
        })),
  );
  const towerButton = $.querySelector("[data-tower]");
  if (towerButton)
    towerButton.onclick = () =>
      run(async () => {
        const r = await dispatch({ type: "tower" });
        notice = r.won
          ? `星灯塔第 ${r.floor} 层通关，✦${r.reward} ◈${r.coins}`
          : "星灯塔挑战失败，培养阵容后再战";
        showBattle(r);
      });
  const equipAll = $.querySelector("[data-auto-equip]");
  if (equipAll)
    equipAll.onclick = () =>
      run(async () => {
        await dispatch({ type: "loadoutAuto" });
        notice = `六部位一键穿戴完成，队伍战力 ${teamPower(state)}`;
      });
  $.querySelectorAll("[data-preset-form]").forEach(
    (form) =>
      (form.onsubmit = (e) => {
        e.preventDefault();
        run(async () => {
          const r = await dispatch({
            type: "presetSave",
            slot: Number(form.dataset.presetForm),
            name: new FormData(form).get("name"),
          });
          notice = `已保存 ${r.name}`;
        });
      }),
  );
  $.querySelectorAll("[data-preset-load]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await dispatch({
            type: "presetLoad",
            slot: Number(b.dataset.presetLoad),
          });
          notice = `已切换到 ${r.name}`;
        })),
  );
  for (const [selector, key] of [
    ["#roster-sort", "sort"],
    ["#roster-role", "role"],
  ]) {
    const el = $.querySelector(selector);
    if (el)
      el.onchange = () => {
        if (key === "sort") rosterSort = el.value;
        else rosterRole = el.value;
        render();
      };
  }
  const chapterSelect = $.querySelector("#chapter-select");
  if (chapterSelect)
    chapterSelect.onchange = () => {
      chapterPage = Number(chapterSelect.value);
      render();
    };
  const supportSelect = $.querySelector("#support-select");
  if (supportSelect)
    supportSelect.onchange = () => {
      selectedFriend = supportSelect.value;
    };
  const elite = $.querySelector("[data-elite]");
  if (elite)
    elite.onclick = () =>
      run(async () => {
        const r = await dispatch({ type: "elite" });
        notice = r.won
          ? `精英通关：✦${r.reward} ◈${r.coins}`
          : "精英挑战失败，请查看战斗建议";
        showBattle(r);
      });
  $.querySelectorAll("[data-share-hero]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          await dispatch({
            type: "shareHero",
            id: Number(b.dataset.shareHero),
          });
          notice = "已更新好友支援英雄";
        })),
  );
  const friendForm = $.querySelector("#friend-form");
  if (friendForm)
    friendForm.onsubmit = (e) => {
      e.preventDefault();
      const username = new FormData(friendForm).get("username");
      run(async () => {
        friendsList = (await api("/friends/request", { username })).friends;
        notice = "好友申请已发送，对方接受后可以借用英雄";
      });
    };
  $.querySelectorAll("[data-friend-action]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await api("/friends/" + b.dataset.friendAction, {
            id: b.dataset.friendId,
          });
          friendsList = r.friends;
          if (
            !friendsList.some(
              (f) => f.id === selectedFriend && f.status === "accepted",
            )
          )
            selectedFriend = "";
          notice =
            b.dataset.friendAction === "accept"
              ? "已成为好友"
              : "好友或申请已移除";
        })),
  );
  const refreshFriends = $.querySelector("[data-refresh-friends]");
  if (refreshFriends)
    refreshFriends.onclick = () =>
      run(async () => {
        friendsList = (await api("/friends")).friends;
        notice = "好友列表已刷新";
      });
  $.querySelectorAll("[data-weekly-claim]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await dispatch({
            type: "guildClaim",
            task: b.dataset.weeklyClaim,
          });
          notice = `合作奖励：✦${r.reward} ◈${r.coins}`;
        })),
  );
  const idleButton = $.querySelector("#claim-idle");
  if (idleButton)
    idleButton.onclick = () =>
      run(async () => {
        const reward = await dispatch({ type: "idle" });
        notice = `放置收益已领取：金币 +${reward.coins}，星钻 +${reward.gems}`;
      });
  wireOnline();
}
function wireTown() {
  const scroller = $.querySelector(".town-scroll");
  if (!scroller) return;
  requestAnimationFrame(() => {
    scroller.scrollLeft = scroller.clientWidth * townPage;
  });
  let frame = 0;
  scroller.addEventListener(
    "scroll",
    () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!scroller.isConnected) return;
        townPage = Math.max(
          0,
          Math.min(2, Math.round(scroller.scrollLeft / scroller.clientWidth)),
        );
        $.querySelectorAll("[data-town-dot]").forEach((b) => {
          b.classList.toggle("active", Number(b.dataset.townDot) === townPage);
          b.setAttribute(
            "aria-pressed",
            String(Number(b.dataset.townDot) === townPage),
          );
        });
        $.querySelectorAll(".district-art").forEach(
          (art, i) =>
            (art.style.transform = `translateX(${(scroller.scrollLeft - i * scroller.clientWidth) * 0.045}px)`),
        );
      });
    },
    { passive: true },
  );
  const move = (i) =>
    scroller.scrollTo({
      left: scroller.clientWidth * Math.max(0, Math.min(2, i)),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  $.querySelectorAll("[data-town-dot]").forEach(
    (b) => (b.onclick = () => move(Number(b.dataset.townDot))),
  );
  $.querySelectorAll("[data-town-step]").forEach(
    (b) => (b.onclick = () => move(townPage + Number(b.dataset.townStep))),
  );
  scroller.onkeydown = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      move(townPage + (e.key === "ArrowRight" ? 1 : -1));
    }
  };
}
function homeView() {
  const idle=idleReward(state);
  const drawer=homeDrawer?`<div class="home-drawer"><button class="drawer-close" data-dismiss-drawer aria-label="关闭">×</button>${["welfare","mail","achievements"].includes(homeDrawer)?welfareView(state,homeDrawer):homeDrawer==="daily"?dailyView():`<div class="idle-full">${gameIcon("shield")}<h2>营地补给箱</h2><p>金币 <b id="idle-coins">${idle.coins}</b> · 星钻 <b id="idle-gems">${idle.gems}</b></p><small>最多累积八小时</small><button class="primary" id="claim-idle" ${idle.minutes?"":"disabled"}>领取补给</button></div>`}</div>`:'';
  return rebootHome(state,drawer);
}
function summonView(){return rebootSummon(state,summonPanel,summonCurrency);}
function heroSortValue(h) {
  return rosterSort === "level"
    ? level(state, h.id)
    : rosterSort === "stars"
      ? state.stars[h.id] || 0
      : rosterSort === "rarity"
        ? { R: 1, SR: 2, SSR: 3, UR: 4 }[h.rarity]
        : power(state, h.id);
}
function synergyView() {
  const b = formationBonuses(combatTeam(state));
  return `<div class="synergy-panel"><b>阵营共鸣</b><p>${b.length ? b.map((s) => `${s.faction} ${s.count}人 · 攻击与生命 +${s.bonus * 100}%`).join(" / ") : "同阵营三人 +10% 攻击与生命，五人 +20%。可在英雄详情查看阵营。"}</p></div>`;
}
function presetView() {
  return `<section class="preset-board"><div class="section-heading"><h3>小队方案</h3><button class="primary" data-auto-equip ${!state.team.length ? "disabled" : ""}>一键装备</button></div>${synergyView()}<p>按阵容顺序分配最佳空闲装备，保留未上阵角色的装备。</p><div class="preset-grid">${[0, 1, 2].map((i) => `<form data-preset-form="${i}"><input name="name" maxlength="12" aria-label="阵容 ${i + 1} 名称" value="${esc(state.presets?.[i]?.name || "阵容 " + (i + 1))}"><small>${state.presets?.[i]?.team.map((id) => heroes[id].name).join(" · ") || "空的阵容槽"}</small><div><button class="secondary" type="submit" ${!state.team.length ? "disabled" : ""}>保存当前阵容</button><button class="secondary" type="button" data-preset-load="${i}" ${!state.presets?.[i] ? "disabled" : ""}>切换</button></div></form>`).join("")}</div></section>`;
}
function collectionView() {
  const h = heroes[selectedHero] || heroes[8];
  const modeNav = `<div class="scene-tabs">${[
    ["heroes", "英雄"],
    ["formation", "阵容"],
    ["forge", "工坊"],
  ]
    .map(
      ([id, name]) =>
        `<button data-collection-mode="${id}" class="${collectionMode === id ? "active" : ""}">${name}</button>`,
    )
    .join("")}</div>`;
  if (collectionMode === "formation") return formationView(state, modeNav);
  if (collectionMode === "forge") return forgeView(state, modeNav, h.id);
  if (heroDetailOpen) return heroDetailView(state, h.id);
  return galleryView(state, {
    modeNav, filter: heroElement, role: rosterRole, sort: rosterSort,
    codex: heroCodex, sortValue: heroSortValue,
  });
}
function supportView() {
  if (!cloud.user)
    return `<div class="support-picker"><p>登录账号可添加好友，每天借用支援英雄三次。</p><button class="secondary" data-tab="account">登录</button></div>`;
  const remaining =
    state.supportDay === new Date().toISOString().slice(0, 10)
      ? 3 - state.supportUses
      : 3;
  if (
    remaining === 0 ||
    !friendsList.some((f) => f.id === selectedFriend && f.status === "accepted")
  )
    selectedFriend = "";
  return `<div class="support-picker"><label>好友支援 · 今日剩余 ${remaining} 次<select id="support-select" ${remaining === 0 ? "disabled" : ""}><option value="">使用自己的队伍</option>${friendsList
    .filter((f) => f.status === "accepted")
    .map(
      (f) =>
        `<option value="${esc(f.id)}" ${selectedFriend === f.id ? "selected" : ""}>${esc(f.name)} · ${esc(f.support.name)}</option>`,
    )
    .join(
      "",
    )}</select></label><p>未满六人则加入，满六人替换最后一位；战力上限为自己最强英雄的 1.5 倍。可用于主线、精英与试炼塔。</p><button class="secondary" data-tab="social">管理好友</button></div>`;
}
function adventureView() {
  const nav = `<div class="scene-tabs">${[
    ["campaign", "主线"],
    ["expedition", "遗迹远征"],
    ["daily", "日常副本"],
    ["tower", "试炼塔"],
    ["weekly", "随机遗迹"],
    ["challenge", "困难／噩梦"],
    ["collectionTrial", "收藏试炼"],
  ]
    .map(
      ([k, n]) =>
        `<button data-adventure-mode="${k}" class="${adventureMode === k ? "active" : ""}">${n}</button>`,
    )
    .join("")}</div>`;
  if (adventureMode === "weekly") return randomRelicView(state,nav);
  if(adventureMode==='weeklyLegacy')return voyageWeeklyView(state,nav);
  if(adventureMode==='challenge')return difficultyView(state,nav,difficultyMode,difficultyStage);
  if(adventureMode==='collectionTrial')return collectionChallengeView(state,nav);
  if (adventureMode === "expedition") return expeditionView(state,nav);
  if (adventureMode === "daily")
    return `<div class="adventure-subscreen">${nav}${dungeonView(state)}</div>`;
  if (adventureMode === "tower")
    return `<div class="adventure-subscreen">${nav}<div class="tower-scene">${worldScene("town-center")}<h2>星灯试炼塔</h2><b>${state.tower} / 30 层</b></div><div class="tower-panel"><div><h3>挑战第 ${Math.min(30, state.tower + 1)} 层</h3><p>首通可领取星钻与金币</p><p>队伍战力 ${teamPower(state)}</p></div><button class="primary" data-tower ${!state.team.length || state.tower >= 30 ? "disabled" : ""}>开始挑战</button></div><button class="secondary" data-tab="collection">调整阵容与装备</button></div>`;

  const page=chapterPage??Math.floor((state.stage-1)/3);
  return rebootCampaign(state,nav,page,supportView());
}
function dailyView() {
  const d = dailyState(state);
  return `<section class="daily-board"><div class="section-heading"><div><h2>冒险委托</h2><button class="secondary" data-daily-collect>领取已完成任务</button><p>每日早上 8 点刷新 · 马来西亚时间</p></div><button class="primary" data-task="signin" ${d.signed ? "disabled" : ""}>${d.signed ? "✓ 已签到" : "签到 ✦150"}</button></div>${dailyTasks.map((t) => `<div class="daily-task"><div><b>${t.name}</b><small>${Math.min(d[t.key], t.goal)} / ${t.goal} · ✦${t.gems} ◈${t.coins}</small><progress value="${Math.min(d[t.key], t.goal)}" max="${t.goal}"></progress></div><button class="secondary" data-task="${t.id}" ${d.claimed.includes(t.id) || d[t.key] < t.goal ? "disabled" : ""}>${d.claimed.includes(t.id) ? "已领取" : "领取"}</button></div>`).join("")}</section>`;
}
function openHero(id) {
  const h = heroes[id];
  const m = modal(
    growthView(state,id),
    "英雄详情",
  );
  m.dialog.classList.add("v-growth-page");
  m.dialog.classList.add('core-growth-page');
  for(const button of m.dialog.querySelectorAll('[data-growth-tab]'))button.onclick=()=>{growthPanel=button.dataset.growthTab;for(const t of m.dialog.querySelectorAll('[data-growth-tab]'))t.setAttribute('aria-selected',String(t===button));for(const pane of m.dialog.querySelectorAll('[data-growth-pane]'))pane.hidden=pane.dataset.growthPane!==button.dataset.growthTab;};
  m.dialog.querySelector(`[data-growth-tab="${growthPanel}"]`)?.click();
  for(const button of m.dialog.querySelectorAll('[data-growth-level]'))button.onclick=()=>run(async()=>{await dispatch({type:'levelBatch',id,count:Number(button.dataset.growthLevel)});m.end();openHero(id);notice='等级与资源已保存';});
  for(const button of m.dialog.querySelectorAll('[data-growth-source]'))button.onclick=()=>{m.end();tab='adventure';adventureMode='daily';render();};
  m.dialog.querySelector('[data-growth-summon]').onclick=()=>{m.end();tab='summon';render();};
  const equipment=m.dialog.querySelector('[data-growth-equipment]');if(equipment)equipment.onclick=()=>{m.end();openEquipmentRevamp(id,revampContext());};

    const reset=m.dialog.querySelector('[data-training-reset]');
  if(reset)reset.onclick=()=>{const paid=state.odyssey.spent[id];const confirm=modal(`<h2>重置${h.name}培养？</h2><p>返还金币 ${paid?.coins||0} · 技能书 ${paid?.books||0} · 药剂 ${paid?.experience||0}</p><p>回到 Lv.${paid?.baseLevel||level(state,id)}、技能 Lv.${(paid?.baseSkill??state.skills[id]??0)+1}；星级和装备保留。</p><button class="secondary" data-reset-confirm ${paid?'':'disabled'}>确认重置</button><button class="primary" data-close>保留当前培养</button>`,'培养重置');confirm.dialog.querySelector('[data-reset-confirm]').onclick=()=>{confirm.end();m.end();run(async()=>{await dispatch({type:'trainingReset',id});notice='培养资源已返还';});};};
  for (const [selector, type] of [
    ["[data-skill-up]", "skillUp"],
    ["[data-exp-use]", "experienceUse"],
  ]) {
  m.dialog.querySelector(selector).onclick = () =>
      run(async () => {
        await dispatch({ type, id });
        m.end();
        openHero(id);
        notice = "英雄培养已保存";
      });
  }
  const share = m.dialog.querySelector("[data-profile-share]");
  if (share)
    share.onclick = async () => {
      if (busy) return;
      busy = true;
      try {
        await dispatch({ type: "shareHero", id });
        share.textContent = "✓ 已设为好友支援";
      } catch (e) {
        m.dialog.querySelector(".profile-status").textContent = e.message;
      } finally {
        busy = false;
      }
    };
  m.dialog.querySelector("[data-star]").onclick = async () => {
    if (busy) return;
    busy = true;
    try {
      const r = await dispatch({ type: "star", id });
      m.end();
      render();
      openHero(id);
      notice = `${h.name} 升至 ${r.stars} 星，战力 +${r.gain}`;
    } catch (e) {
      m.dialog.querySelector(".profile-status").textContent = e.message;
    } finally {
      busy = false;
    }
  };
}
function accountView() {
  return `${accountBanner(cloud.user)}<section class="v-settings"><b>手机体验</b><button class="secondary" data-lite-mode>${liteMode?"轻量模式已开启":"开启轻量模式"}</button><small>减少环境动画与战斗播放；不影响进度和奖励</small></section><div class="section-heading"><div><h2>旅人账号</h2><p>游客存档保留在此设备；云端账号使用独立存档，注册从初始队伍开始。</p></div><span class="pill">${cloud.user ? "☁ 云端已连接" : "本地试玩模式"}</span></div><div class="online-panel">${cloud.user ? `<h3>${esc(cloud.user.username)}</h3><p>金币、星钻、角色、装备与关卡进度保存在云端数据库。账号可在朋友手机上重新登录。请保管昵称和密码；当前没有邮件找回功能。</p><p>竞技积分 ${cloud.rating} · 存档版本 ${cloud.revision}</p><button class="secondary" id="refresh-cloud">刷新云端存档</button> <button class="secondary" id="logout">退出账号</button>` : `<div class="auth-intro">${gameIcon("book")}<h3>把星光带到每一台设备</h3><p>${cloud.base ? "服务器已配置，注册后即可使用联网功能。" : "当前公开网站仍是游客版本。数据库上线后，连接服务器即可与朋友一起玩。"}</p></div><form id="auth-form"><label>昵称<input name="username" autocomplete="username" minlength="2" maxlength="20" required placeholder="例如：星海旅人"></label><label>密码<input name="password" type="password" autocomplete="current-password" minlength="8" maxlength="72" required placeholder="至少 8 个字符，请记好"></label><div class="hero-actions"><button class="primary" name="mode" value="login" ${!cloud.base ? "disabled" : ""}>登录</button><button class="secondary" name="mode" value="register" ${!cloud.base ? "disabled" : ""}>注册新账号</button></div></form>`}<details class="connection-settings"><summary>服务器连接设置</summary><p>这里需要已部署的游戏服务器网址。Cloudflare 网站可以直接自动连接。</p><form id="connect-form"><label>游戏服务器 HTTPS 网址<input name="endpoint" type="url" placeholder="https://astral-cards-online.你的账号.workers.dev" value="${esc(cloud.base)}" required></label><button class="secondary">连接并检查</button></form></details></div>`;
}
function loginRequired(title) {
  return `${screenBanner(title,"与朋友一起开启新的冒险",title.includes("竞技")?"arena":"social","town-west")}<div class="online-panel auth-intro">${gameIcon("social")}<h2>${title}</h2><p>登录账号，就能和朋友一起玩，进度也会保存。</p><button class="primary" data-tab="account">前往账号</button></div>`;
}
function messagesHTML() {
  return socialData.messages.length
    ? socialData.messages
        .map(
          (m) =>
            `<div class="chat-message ${m.sender === cloud.user?.id ? "mine" : ""}"><div><b>${esc(m.name)}</b><time>${new Date(m.time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</time></div><p>${esc(m.text)}</p></div>`,
        )
        .join("")
    : '<p class="chat-empty">星海安静，发出第一条消息吧。</p>';
}
function friendsView() {
  return `<section class="friends-panel"><div class="section-heading"><div><h2>冒险好友</h2><p>最多 50 位好友与申请 · 接受后开放英雄支援</p></div><button class="secondary" data-refresh-friends>刷新</button></div><form id="friend-form"><input name="username" minlength="2" maxlength="20" required placeholder="输入朋友的游戏昵称" aria-label="好友昵称"><button class="primary">添加好友</button></form><div class="friends-list">${friendsList.map((f) => `<article class="friend-card"><div class="friend-portrait">${portrait(f.support)}</div><div><b>${esc(f.name)}</b><small>${f.status === "accepted" ? "好友 · 战力 " + f.power : f.incoming ? "收到好友申请" : "等待对方接受"}</small><p>支援 ${esc(f.support.name)} · Lv.${f.support.level}</p><div>${f.status === "pending" && f.incoming ? `<button class="primary" data-friend-action="accept" data-friend-id="${esc(f.id)}">接受</button>` : ""}<button class="secondary" data-friend-action="remove" data-friend-id="${esc(f.id)}">${f.status === "accepted" ? "移除" : f.incoming ? "拒绝" : "取消申请"}</button></div></div></article>`).join("") || "<p>还没有好友，输入昵称向朋友发送申请。</p>"}</div></section>`;
}
function weeklyView(g) {
  const w = g.weekly;
  if (!w) return "";
  return `<section class="weekly-panel"><h3>公会每周委托</h3><p>周一早上 8 点刷新 · 本周参与一次 Boss 挑战后可领奖</p><div class="weekly-tasks">${w.tasks.map((t) => `<div class="daily-task"><div><b>${esc(t.name)}</b><small>${Math.min(t.progress, t.goal).toLocaleString()} / ${t.goal.toLocaleString()} · ✦${t.gems} ◈${t.coins}</small><progress value="${Math.min(t.progress, t.goal)}" max="${t.goal}"></progress></div><button class="secondary" data-weekly-claim="${t.id}" ${t.claimed || t.progress < t.goal || !w.participated ? "disabled" : ""}>${t.claimed ? "已领取" : "领取"}</button></div>`).join("")}</div></section>`;
}
function socialView() {
  if (!cloud.user) return loginRequired("公会与聊天");
  const g = cloud.guild;
  return (
    `<div class="community-screen" data-community="${communityPanel}"><div class="community-scene">${worldScene("town-west")}<h2>星海旅团</h2></div><div class="scene-tabs">${[
      ["guild", "公会"],
      ["friends", "好友"],
      ["chat", "聊天"],
    ]
      .map(
        ([id, name]) =>
          `<button data-community-panel="${id}" class="${communityPanel === id ? "active" : ""}">${name}</button>`,
      )
      .join("")}</div><div class="community-body" data-guild-section="boss"><div class="guild-section-tabs"><button data-guild-section="boss" class="active">${gameIcon("arena")}公会 Boss</button><button data-guild-section="tasks">${gameIcon("book")}每周任务</button><button data-guild-section="members">${gameIcon("social")}公会成员</button></div>` +
    `<div class="section-heading"><div><h2>星海公会</h2><p>分享邀请码，与朋友一起挑战守卫。</p></div><span class="pill">${g ? g.members.length + " / 30 位成员" : "尚未加入公会"}</span></div>${g ? `<div class="guild-banner"><span class="guild-crest">${gameIcon("social")}</span><div><h2>${esc(g.name)}</h2><p>邀请码 <b>${esc(g.code)}</b> <button id="copy-code" class="secondary">复制</button></p><small>所有成员的伤害共同累计，击败后立即开启下一轮。</small></div><button id="leave-guild" class="secondary">退出</button></div><div class="boss-panel"><div class="boss-portrait">${monster(2)}</div><div><small>GUILD RAID · ROUND ${g.bossRound}</small><h3>远古星渊守卫</h3><div class="hp-track"><div class="hp-fill" style="width:${(g.bossHp / g.bossMax) * 100}%"></div></div><p>${g.bossHp.toLocaleString()} / ${g.bossMax.toLocaleString()} HP</p><p>每日5次 · 入场100金币 · 奖励150金币与星钻。<br>轮换护盾、控制、灼烧机制，最后一击额外奖励。</p></div><button id="boss-attack" class="primary" ${state.odyssey.raid?.day===new Date().toISOString().slice(0,10)&&state.odyssey.raid.hits>=5?'disabled':''}>合作挑战 · 今日 ${state.odyssey.raid?.day===new Date().toISOString().slice(0,10)?state.odyssey.raid.hits:0}/5</button></div>${weeklyView(g)}<div class="member-list guild-members">${g.members.map((m) => `<div class="guild-member"><div class="member-portraits">${(m.team || []).map((h) => sprite(h)).join("")}</div><b>${esc(m.name)} ${m.id === g.owner ? "♛" : ""}</b><span>战力 ${m.power} · 贡献 ${m.contribution}</span></div>`).join("")}</div>` : `<div class="guild-forms"><form id="create-guild"><h3>创建你的公会</h3><label>公会名称<input name="name" minlength="2" maxlength="20" required placeholder="例如：月光冒险团"></label><button class="primary">创建公会</button></form><form id="join-guild"><h3>加入朋友的公会</h3><label>8 位邀请码<input name="code" minlength="8" maxlength="8" required placeholder="输入朋友的邀请码"></label><button class="secondary">加入公会</button></form></div>`}${friendsView()}<div class="chat-panel"><div class="chat-top"><h3>旅人聊天室</h3><div><button class="secondary ${chatChannel === "world" ? "selected" : ""}" data-channel="world">世界</button><button class="secondary ${chatChannel === "guild" ? "selected" : ""}" data-channel="guild" ${!g ? "disabled" : ""}>公会</button><button id="refresh-chat" class="secondary">刷新</button></div></div><p class="chat-status" role="status">${esc(chatError) || "每 5 秒更新 · 最多显示最近 60 条消息"}</p><div class="chat-messages" aria-live="polite">${messagesHTML()}</div><form id="chat-form"><input name="message" maxlength="300" required placeholder="和朋友说点什么…" aria-label="聊天消息" autocomplete="off"><button class="primary">发送</button></form></div></div></div>`
  );
}
function arenaView() {
  if (!cloud.user) return loginRequired("星辉竞技场");
  return `${screenBanner("星辉竞技场","挑战其他旅人的小队，争夺竞技荣誉","arena","town-west")}<div class="section-heading"><div><h2>星辉竞技场</h2><p>挑战其他玩家保存的小队，赢取竞技积分。</p></div><span class="pill">积分 ${cloud.rating} · UTC 每日 5 次</span></div><p>当前队伍战力 ${teamPower(state)} · 今日已挑战 ${state.arenaDay === new Date().toISOString().slice(0, 10) ? state.arenaAttempts : 0} / 5 · 胜利奖励 200 金币，失败也获得 80 金币。</p><button class="secondary" id="refresh-arena">刷新对手</button><p class="arena-ranking-note">优先匹配接近你战力与积分的对手 · 最多显示30位</p><div class="arena-list">${socialData.opponents.length ? socialData.opponents.map((o, index) => `<article><div class="opponent-team">${o.team.map((h) => portrait(h)).join("")}</div><div><h3>#${index + 1} ${esc(o.name)}</h3><p>战力 ${o.power} · 积分 ${o.rating}</p></div><button class="primary" data-duel="${esc(o.id)}">挑战</button></article>`).join("") : "<p>暂无对手，请邀请朋友注册账号，再刷新。</p>"}</div><h3 class="section-title">最近对战</h3><div class="member-list">${socialData.history.map((h) => `<div><b>${h.won ? "胜利" : "落败"} · ${esc(h.opponent)}</b><span>${h.dealt} vs ${h.target} · 金币 +${h.coins}</span></div>`).join("") || "<p>还没有对战记录。</p>"}</div>`;
}
async function loadSocial(repaint = true) {
  if (!cloud.user) return;
  const current = tab;
  const userId = cloud.user.id;
  try {
    if (current === "social") {
      const [guild, chat, friends] = await Promise.all([
        api("/guild"),
        api("/chat?channel=" + chatChannel),
        api("/friends"),
      ]);
      if (tab !== current || cloud.user?.id !== userId || (busy && repaint))
        return;
      cloud.guild = guild.guild;
      friendsList = friends.friends;
      socialData.messages = chat.messages;
      chatError = "";
    } else if (current === "adventure") {
      const data = await api("/friends");
      if (tab !== current || cloud.user?.id !== userId) return;
      friendsList = data.friends;
    } else if (current === "arena") {
      const data = await api("/arena");
      if (tab !== current || cloud.user?.id !== userId || (busy && repaint))
        return;
      socialData.opponents = data.opponents;
      socialData.history = data.history;
    }
    if (repaint && !document.activeElement?.closest("form")) render();
  } catch (e) {
    chatError = e.message;
    notice = e.message;
    if(cloud.user&&!e.status){storageWarning="连接中断：操作结果待确认，请刷新云端存档后继续。";}
    if (repaint) render();
  }
}
function wireOnline() {
  const authForm = $.querySelector("#auth-form");
  if (authForm)
    authForm.onsubmit = (e) => {
      e.preventDefault();
      const data = new FormData(authForm),
        mode = e.submitter?.value || "login";
      run(async () => {
        const result = await signIn(
          mode,
          data.get("username"),
          data.get("password"),
        );
        state = migrate(result.state) || result.state;
        chapterPage = null;
        adventureMode = "campaign";
        friendsList = [];
        selectedFriend = "";
        results = [];
        report = null;
        socialData = { messages: [], opponents: [], history: [] };
        notice =
          mode === "register" ? "账号已创建，云端存档已建立" : "已载入云端存档";
      });
    };
  const connectForm = $.querySelector("#connect-form");
  if (connectForm)
    connectForm.onsubmit = (e) => {
      e.preventDefault();
      const endpoint = new FormData(connectForm).get("endpoint");
      run(async () => {
        if (cloud.user) throw new Error("请先退出当前账号再切换服务器");
        connect(endpoint);
        await api("/health");
        notice = "数据库连接成功，可以注册或登录";
      });
    };
  const logout = $.querySelector("#logout");
  if (logout)
    logout.onclick = () =>
      run(async () => {
        await signOut();
        try {
          state = migrate(JSON.parse(localStorage.getItem(key))) || fresh();
        } catch {
          state = fresh();
        }
        friendsList = [];
        selectedFriend = "";
        results = [];
        report = null;
        chapterPage = null;
        adventureMode = "campaign";
        notice = "已退出云端账号，返回原有游客存档";
      });
  const refresh = $.querySelector("#refresh-cloud");
  if (refresh)
    refresh.onclick = () =>
      run(async () => {
        state = (await refreshCloud()).state;
        storageWarning="";
        notice = "已载入最新云端存档";
      });
  const create = $.querySelector("#create-guild");
  if (create)
    create.onsubmit = (e) => {
      e.preventDefault();
      const name = new FormData(create).get("name");
      run(async () => {
        cloud.guild = (await api("/guild/create", { name })).guild;
        notice = "公会已建立，分享邀请码给朋友";
      });
    };
  const join = $.querySelector("#join-guild");
  if (join)
    join.onsubmit = (e) => {
      e.preventDefault();
      const code = new FormData(join).get("code");
      run(async () => {
        cloud.guild = (await api("/guild/join", { code })).guild;
        notice = "已加入公会";
      });
    };
  const leave = $.querySelector("#leave-guild");
  if (leave)
    leave.onclick = () =>
      run(async () => {
        await api("/guild/leave", {});
        cloud.guild = null;
        chatChannel = "world";
        socialData.messages = [];
        await loadSocial(false);
        notice = "已退出公会";
      });
  const copy = $.querySelector("#copy-code");
  if (copy)
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(cloud.guild.code);
        notice = "邀请码已复制";
      } catch {
        notice = "邀请码：" + cloud.guild.code;
      }
      render();
    };
  const attack = $.querySelector("#boss-attack");
  if (attack)
    attack.onclick = () =>
      run(async () => {
        const result = await dispatch({ type: "boss" });
        showBattle(result);
        notice = `造成 ${result.damage} 点伤害！${result.defeated ? "守卫击败，新一轮已开启。" : ""}获得 ${result.reward} 星钻、150 金币`;
      });
  $.querySelectorAll("[data-channel]").forEach(
    (b) =>
      (b.onclick = () => {
        chatChannel = b.dataset.channel;
        socialData.messages = [];
        render();
        loadSocial();
      }),
  );
  const chat = $.querySelector("#chat-form");
  if (chat)
    chat.onsubmit = (e) => {
      e.preventDefault();
      const text = new FormData(chat).get("message");
      run(async () => {
        const result = await api("/chat", { channel: chatChannel, text });
        socialData.messages = result.messages;
        chatError = "";
        notice = "";
      });
    };
  for (const id of ["refresh-chat", "refresh-arena"]) {
    const button = $.querySelector("#" + id);
    if (button) button.onclick = () => loadSocial();
  }
}
setInterval(async () => {
  if (!cloud.user || tab !== "social" || busy || document.hidden) return;
  try {
    const channel = chatChannel;
    const userId = cloud.user.id;
    const [data, guildData] = await Promise.all([
      api("/chat?channel=" + channel),
      api("/guild"),
    ]);
    if (
      tab === "social" &&
      chatChannel === channel &&
      cloud.user?.id === userId &&
      !busy
    ) {
      const g = guildData.guild;
      cloud.guild = g;
      if (g) {
        const boss = $.querySelector(".boss-panel");
        if (boss) {
          boss.querySelector(".hp-fill").style.width =
            (g.bossHp / g.bossMax) * 100 + "%";
          boss.querySelector("p").textContent =
            g.bossHp.toLocaleString() +
            " / " +
            g.bossMax.toLocaleString() +
            " HP";
          boss.querySelector("small").textContent =
            "GUILD RAID · ROUND " + g.bossRound;
        }
        const members = $.querySelector(".member-list");
        if (members)
          members.innerHTML = g.members
            .map(
              (m) =>
                `<div class="guild-member"><div class="member-portraits">${(m.team || []).map((h) => sprite(h)).join("")}</div><b>${esc(m.name)} ${m.id === g.owner ? "♛" : ""}</b><span>战力 ${m.power} · 贡献 ${m.contribution}</span></div>`,
            )
            .join("");
        const weekly = $.querySelector(".weekly-panel");
        if (weekly) {
          weekly.outerHTML = weeklyView(g);
          $.querySelectorAll("[data-weekly-claim]").forEach(
            (b) =>
              (b.onclick = () =>
                run(async () => {
                  const r = await dispatch({
                    type: "guildClaim",
                    task: b.dataset.weeklyClaim,
                  });
                  notice = `合作奖励：✦${r.reward} ◈${r.coins}`;
                })),
          );
        }
        const count = $.querySelector(".section-heading .pill");
        if (count) count.textContent = g.members.length + " / 30 位成员";
      }
      socialData.messages = data.messages;
      const node = $.querySelector(".chat-messages");
      if (node) {
        const bottom =
          node.scrollHeight - node.scrollTop - node.clientHeight < 45;
        node.innerHTML = messagesHTML();
        if (bottom) node.scrollTop = node.scrollHeight;
      }
      const status = $.querySelector(".chat-status");
      if (status) status.textContent = "每 5 秒更新 · 最多显示最近 60 条消息";
    }
  } catch (e) {
    const status = $.querySelector(".chat-status");
    if (status) status.textContent = e.message;
  }
}, 5000);
setInterval(() => {
  if (tab !== "home" || busy) return;
  const reward = idleReward(state);
  const coins = $.querySelector("#idle-coins"),
    gems = $.querySelector("#idle-gems"),
    button = $.querySelector("#claim-idle");
  if (coins) coins.textContent = reward.coins;
  if (gems) gems.textContent = reward.gems;
  if (button) button.disabled = reward.minutes < 1;
}, 60000);
let soundOn = false,
  audio;
function tone(freq, duration = 0.15) {
  if (!soundOn) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch {}
}
function wirePortraitLoading(root) {
  root.querySelectorAll('.painted-character image').forEach(image => {
    const art = image.closest('.painted-character');
    const loading = document.createElement('span');
    loading.className = 'portrait-loading';
    loading.textContent = '立绘加载中…';
    art.append(loading);
    const probe = new Image();
    probe.src = image.getAttribute('href');
    probe.decode().then(() => loading.remove()).catch(() => {
      loading.textContent = '立绘未能加载，请重新打开';
    });
  });
}
function modal(content, label) {
  const dialog = document.createElement("dialog");
  dialog.className = "cinematic";
  dialog.setAttribute("aria-label", label);
  dialog.innerHTML = content;
  wirePortraitLoading(dialog);
  document.body.append(dialog);
  const timers = [];
  let closed = false;
  const end = () => {
    if (closed) return;
    closed = true;
    timers.forEach(clearTimeout);
    dialog.close();
    dialog.remove();
  };
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    end();
  });
  dialog.querySelector("[data-close]").onclick = end;
  dialog.showModal();
  const after = (fn, ms) =>
    timers.push(
      setTimeout(() => {
        if (!closed) fn();
      }, ms),
    );
  return { dialog, after, end };
}
function showSummon(pulls) {
  const best = pulls.reduce((a, b) =>
    ({ R: 0, SR: 1, SSR: 2, UR: 3 })[a.rarity] >
    { R: 0, SR: 1, SSR: 2, UR: 3 }[b.rarity]
      ? a
      : b,
  );
  const reduced = liteMode || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const m = modal(
    `<div class="summon-cinema" style="--accent:${rarities[best.rarity].color}"><div class="cinema-heading"><small>STELLAR SUMMON</small><h2>伙伴集结</h2><p>获得 ${pulls.length} 位 · 新英雄 ${pulls.filter(h=>h.isNew).length} 位 · 结果已保存</p></div><div class="summon-gate"><div class="gate-ring"></div><div class="gate-core">✧</div></div><div class="reveal-grid ${pulls.length === 1 ? "single" : ""}">${pulls.map((h, i) => `<button class="reveal-slot" data-reveal="${i}" aria-label="揭晓第 ${i + 1} 张卡牌"><div class="card-back"><span>✧</span><small>ASTRAL</small></div><div class="card-front"><span class="pull-kind ${h.isNew?'new':'duplicate'}">${h.isNew?'新英雄':'重复 · 可升星'}</span>${card(h, true)}</div></button>`).join("")}</div><div class="cinema-actions"><button class="secondary" data-all>全部揭晓</button><button class="secondary" data-pull-grow>培养${best.name}</button><button class="primary" data-close>收下伙伴</button></div></div>`,
    "召唤结果",
  );
  m.dialog.querySelector('[data-pull-grow]').onclick=()=>{m.end();tab='collection';collectionMode='heroes';selectedHero=best.id;heroDetailOpen=true;render();};
  const reveal = (i) => {
    const el = m.dialog.querySelector(`[data-reveal="${i}"]`);
    if (el.classList.contains("revealed")) return;
    el.classList.add("revealed");
    tone({ R: 440, SR: 550, SSR: 740, UR: 880 }[pulls[i].rarity], 0.24);
  };
  m.dialog
    .querySelectorAll("[data-reveal]")
    .forEach((el) => (el.onclick = () => reveal(+el.dataset.reveal)));
  m.dialog.querySelector("[data-all]").onclick = () =>
    pulls.forEach((_, i) => reveal(i));
  pulls.forEach((_, i) =>
    m.after(() => reveal(i), reduced ? 0 : 650 + i * 180),
  );
}
function combatStatsView(outcome) {
  const rows = outcome.stats || [];
  const side = (key) => {
    const list = rows.filter((r) => r.side === key),
      max = Math.max(1, ...list.map((r) => r.damage));
    return list
      .map(
        (r) =>
          `<div class="combat-stat-row"><div><b>${esc(r.name)}</b><span>伤害 ${r.damage.toLocaleString()} · 治疗 ${r.healing.toLocaleString()}</span><div class="stat-bar"><i style="width:${(r.damage / max) * 100}%"></i></div><small>护盾 ${r.shielding.toLocaleString()} · 承伤 ${r.taken.toLocaleString()}</small></div></div>`,
      )
      .join("");
  };
  const allies=rows.filter(r=>r.side==='p');
  const highlights=[['damage','输出核心'],['healing','治疗贡献'],['shielding','护盾贡献']].map(([key,label])=>{const best=[...allies].sort((a,b)=>b[key]-a[key])[0];return best?.[key]>0?`<span>${label} · ${esc(best.name)} ${best[key].toLocaleString()}</span>`:'';}).join('');
  return `<section class="combat-stats"><h3>本队战斗统计</h3><div class="combat-highlights">${highlights}</div>${side("p")}<details><summary>敌方战斗统计</summary>${side("e")}</details>${outcome.tips?.length ? `<div class="battle-advice"><h3>阵容建议</h3><ul>${outcome.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}</section>`;
}
function showBattle(outcome) {
  const reduced = liteMode || matchMedia("(prefers-reduced-motion: reduce)").matches;
  let speed = 1;
  try {
    speed = Number(localStorage.getItem("astral-combat-speed")) || 1;
  } catch {}
  if (![1, 2, 4].includes(speed)) speed = 1;
  const units = [...outcome.players, ...outcome.enemies];
  const unit = (u, enemy, index) =>
    `<div class="combat-unit ${enemy ? "enemy-unit" : "ally-unit"}" data-unit="${u.unitId}" style="grid-column:${enemy ? ((u.position ?? index) < 3 ? 1 : 2) : ((u.position ?? index) < 3 ? 2 : 1)};grid-row:${((u.position ?? index) % 3) + 1}">${enemy && !outcome.opponent ? monster(u.kind || 0) : sprite(heroes[u.id])}<b>${esc(u.name)}${u.support ? " · 支援" : ""}</b><div class="hp-track"><div class="hp-fill"></div></div><small class="unit-hp">${u.maxHp}</small><span class="unit-damage"></span></div>`;
  const title = outcome.difficulty
    ? (outcome.difficulty==='hard'?'困难主线':'噩梦主线')+' · 第'+outcome.stage+'关'
    : outcome.collectionTrial
      ? '收藏试炼 · '+outcome.collectionTrial
      : outcome.randomRelic
        ? '随机遗迹 · 第'+Math.min(9,outcome.floor+(outcome.won?0:1))+'场'
        : outcome.opponent
    ? "ARENA · " + esc(outcome.opponent)
    : outcome.floor
      ? "TOWER " + outcome.floor
      : outcome.dungeon
        ? "DAILY · 日常副本"
        : outcome.elite
          ? "ELITE " + outcome.stage
          : "CHAPTER " + (outcome.stage || state.stage);
  const m = modal(
    `<div class="battle-cinema"><div class="cinema-heading"><small>${title}</small><h2>${outcome.boss?'首领挑战':'小队出击'}</h2></div><button class="battle-exit" data-battle-exit aria-label="返回游戏">×</button><div class="combat-controls"><span>自动战斗</span>${[1, 2, 4].map((n) => `<button class="secondary ${speed === n ? "selected" : ""}" data-speed="${n}" aria-pressed="${speed === n}">×${n}</button>`).join("")}<button class="secondary" data-skip>跳过动画</button></div><div class="combat-arena">${worldScene(outcome.opponent?"formation-court":"battle-forest")}<div class="combat-party">${outcome.players.map((u, i) => unit(u, false, i)).join("")}</div><div class="combat-enemies">${outcome.enemies.map((u, i) => unit(u, true, i)).join("")}</div><span class="round-counter">AUTO · ROUND 1</span><div class="skill-cut-in" hidden></div></div><p class="combat-log" role="status">伙伴们已做好准备……</p><div class="mobile-party-hud">${outcome.players.map(u=>`<article data-hud-unit="${u.unitId}"><div class="mobile-hud-portrait">${sprite(heroes[u.id])}</div><b>${esc(u.name)}</b><progress max="${u.maxHp}" value="${u.initialHp}"></progress><small>Lv.${u.level||level(state,u.id)}</small></article>`).join("")}</div><div class="combat-outcome" hidden><h2>${outcome.raid?"贡献已记录":outcome.won ? "挑战成功" : "暂时撤退"}</h2><p>${outcome.raid?`共同首领伤害 ${outcome.damage} · ${outcome.defeated?"首领击败！":"伙伴们继续加油。"}`:outcome.won ? "伙伴们凯旋归来！" : "暂时撤退，培养伙伴后再战。"} ✦ +${outcome.reward || 0} · ◈ +${outcome.coins || 0}</p>${outcome.loot ? `<p class="loot-reward">${rewardText(Object.fromEntries(Object.entries(outcome.loot).filter(([k]) => k !== "item")))}${outcome.loot.item ? " · 装备：" + outcome.loot.item.name : ""}</p>` : ""}${outcome.conditionFailed?`<p class="endgame-condition">战斗获胜，但未满足挑战条件：${esc(outcome.condition)}</p>`:''}${outcome.stars?`<p class="r-result-stars">${'★'.repeat(outcome.stars)}${'☆'.repeat(3-outcome.stars)} · 主线评级</p>`:''}${outcome.expedition?`<p>遗迹 ${outcome.node}/6 · ${outcome.loot?.shards?`结算 ${outcome.loot.shards}碎片、${outcome.loot.tickets}张券`:'返回后继续远征或选择祝福'}</p>`:''}${outcome.nextStage && outcome.won ? `<p>已选中第 ${outcome.nextStage} 关，返回后可继续挑战。</p>` : ""}${combatStatsView(outcome)}</div><button class="primary" data-close>返回${outcome.opponent ? "竞技场" : outcome.raid?"公会":tab === "collection" && collectionMode === "formation" ? "阵容" : "冒险"}</button></div>`,
    "自动战斗与统计",
  );
  m.dialog.classList.add("battle-fullscreen");
  m.dialog.querySelector("[data-battle-exit]").onclick = m.end;
  const labels = {
    warning: "首领蓄力",
    phase: "第二阶段",
    control: "束缚",
    stun: "眩晕",
    ignite: "灼烧",
    counter: "反击",
    regen: "再生",
    purify: "净化",
    break: "破盾",
  };
  for(const u of units){const node=m.dialog.querySelector(`[data-unit="${u.unitId}"]`);node.querySelector('.hp-fill').style.width=(u.initialHp/u.maxHp*100)+'%';node.querySelector('.unit-hp').textContent=u.initialHp;node.classList.toggle('fallen',u.initialHp===0);}
  const skillShown = new Set();
  function animate(event, audible=true) {
    const actor = m.dialog.querySelector(`[data-unit="${event.actor}"]`),
      target = m.dialog.querySelector(`[data-unit="${event.target}"]`);
    if (!actor || !target) return;
    const caster = units.find((u) => u.unitId === event.actor),
      key = event.round + ":" + event.actor;
    if (
      event.round % 3 === 0 &&
      event.skill !== "普通攻击" &&
      !event.status &&
      !skillShown.has(key)
    ) {
      skillShown.add(key);
      const banner = m.dialog.querySelector(".skill-cut-in");
      banner.innerHTML = `${caster?.id !== undefined ? illustration(heroes[caster.id], true) : ""}<div><small>${esc(caster?.name || "敌人")}</small><b>${esc(event.skill)}</b></div>`;
      banner.hidden = false;
      banner.classList.remove("show");
      void banner.offsetWidth;
      banner.classList.add("show");
      m.after(() => (banner.hidden = true), 750 / speed);
    }
    if (event.damage > 0) {
      target.classList.remove("hit-flash");
      void target.offsetWidth;
      target.classList.add("hit-flash");
    }
    target.dataset.effect=event.heal?'heal':event.shield||event.absorbed?'shield':event.damage>0?'hit':'';
    m.after(()=>delete target.dataset.effect,350/speed);
    if(event.status==='warning'){actor.dataset.warning='true';if(!actor.querySelector('.unit-intent'))actor.insertAdjacentHTML('beforeend','<span class="unit-intent">下一回合释放技能</span>');}
    else if(event.round%3===0){actor.dataset.warning='false';actor.querySelector('.unit-intent')?.remove();}

    target.querySelector(".hp-fill").style.width =
      Math.max(0, (event.hp / event.maxHp) * 100) + "%";
    target.querySelector(".unit-hp").textContent = Math.max(0, event.hp);
    for(const n of m.dialog.querySelectorAll('[data-hud-unit]'))n.classList.toggle('active',n.dataset.hudUnit===event.actor);
    const hud=m.dialog.querySelector(`[data-hud-unit="${event.target}"]`);if(hud){hud.querySelector('progress').value=Math.max(0,event.hp);hud.classList.toggle('down',event.hp===0);}

    target.classList.toggle("fallen", event.hp === 0);
    const number = target.querySelector(".unit-damage");
    number.textContent = event.revive
      ? "复活 +" + event.heal
      : event.shield
        ? "护盾 +" + event.shield
        : event.heal !== undefined
          ? "+" + event.heal
          : event.damage===0&&event.absorbed>0
            ? "抵挡 " + event.absorbed
            : event.damage !== undefined
            ? (event.critical ? "暴击 " : "") +
              (event.advantage ? "克制 " : "") +
              "−" +
              event.damage
            : labels[event.status] || event.skill;
    number.className = "unit-damage";
    void number.offsetWidth;
    number.className =
      "unit-damage pop " + (event.heal !== undefined ? "healing" : "");
    target.classList.toggle("shielded", !!event.shieldRemaining);
    target.classList.toggle(
      "controlled",
      event.controlled ?? ["control", "stun"].includes(event.status),
    );
    actor.dataset.element =
      units.find((u) => u.unitId === event.actor)?.element || "";
    m.dialog.querySelector(".combat-log").textContent =
      (units.find((u) => u.unitId === event.actor)?.name || "伙伴") +
      " · " +
      event.skill +
      " " +
      number.textContent;
    m.dialog.querySelector(".round-counter").textContent =
      "第 " + event.round + " 回合 · " + event.skill;
    if(audible)tone(event.heal ? 660 : event.critical ? 320 : 220, 0.08);
  }
  function prepare(group){
    const event=group.events[0],actor=m.dialog.querySelector(`[data-unit="${event.actor}"]`),caster=units.find(u=>u.unitId===event.actor);
    if(!actor||event.status||reduced)return;
    actor.dataset.action=event.heal?'heal':event.shield?'guard':caster?.role==='法师'?'cast':caster?.role==='游侠'?'shoot':'strike';
    actor.style.setProperty('--lunge',event.side==='p'?'7px':'-7px');actor.classList.remove('attacking');void actor.offsetWidth;actor.classList.add('attacking');m.after(()=>actor.classList.remove('attacking'),300/speed);
    for(const result of group.events){
      const target=m.dialog.querySelector(`[data-unit="${result.target}"]`);
      if(!target||actor===target||!(result.damage!==undefined||result.heal||result.shield))continue;
      const box=m.dialog.getBoundingClientRect(),a=actor.getBoundingClientRect(),t=target.getBoundingClientRect(),fx=document.createElement('i');
      fx.className='role-projectile';fx.dataset.role=result.heal?'治疗':result.shield?'骑士':caster?.role||'战士';fx.style.left=(a.left+a.width/2-box.left)+'px';fx.style.top=(a.top+a.height*.5-box.top)+'px';m.dialog.append(fx);
      fx.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${t.left+t.width/2-a.left-a.width/2}px,${t.top+t.height*.5-a.top-a.height*.5}px)`,opacity:.3}],{duration:Math.max(40,160/speed),fill:'forwards'});m.after(()=>fx.remove(),Math.max(40,160/speed));
    }
  }
  let index = 0,
    finished = false;
  const events = outcome.events || [], groups=actionGroups(events),
    step = Math.min(650, Math.max(300, 12000 / Math.max(1, groups.length)));
  function finish() {
    m.dialog.querySelector(".battle-cinema").classList.add("finished");
    if (finished) return;
    finished = true;
    for(const fx of m.dialog.querySelectorAll('.role-projectile,.battle-impact'))fx.remove();
    for(const unit of m.dialog.querySelectorAll('.combat-unit')){unit.classList.remove('attacking','hit-flash');delete unit.dataset.effect;}
    index = groups.length;
    for (const u of units) {
      const node = m.dialog.querySelector(`[data-unit="${u.unitId}"]`);
      node.querySelector(".hp-fill").style.width =
        Math.max(0, (u.hp / u.maxHp) * 100) + "%";
      node.querySelector(".unit-hp").textContent = u.hp;
      node.classList.toggle("fallen", u.hp === 0);
    }
    m.dialog.querySelector(".combat-outcome").hidden = false;
    m.dialog
      .querySelector(".combat-outcome")
      .classList.add(outcome.won ? "victory" : "defeat");
    m.dialog.querySelector(".round-counter").textContent =
      outcome.rounds + " ROUNDS · " + (outcome.won ? "CLEAR" : "FAILED");
    m.dialog.querySelector(".combat-log").textContent = outcome.won
      ? "战斗结束，奖励已保存。"
      : "战斗结束，可在下方查看阵容建议。";
    m.dialog.querySelector("[data-skip]").disabled = true;
    tone(outcome.won ? 880 : 160, 0.3);
  }
  function advance() {
    if (finished) return;
    if (index >= groups.length) {
      finish();
      return;
    }
    const group=groups[index++],delay=reduced?0:Math.max(40,160/speed);
    prepare(group);
    m.after(()=>{if(finished)return;group.events.forEach((event,i)=>animate(event,i===0));m.after(advance,Math.max(40,step/speed-delay));},delay);
  }
  m.dialog.querySelectorAll("[data-speed]").forEach(
    (b) =>
      (b.onclick = () => {
        speed = Number(b.dataset.speed);
        try {
          localStorage.setItem("astral-combat-speed", String(speed));
        } catch {}
        m.dialog.querySelectorAll("[data-speed]").forEach((el) => {
          el.classList.toggle("selected", Number(el.dataset.speed) === speed);
          el.setAttribute(
            "aria-pressed",
            String(Number(el.dataset.speed) === speed),
          );
        });
      }),
  );
  m.dialog.querySelector("[data-skip]").onclick = finish;
  if (reduced) finish();
  else m.after(advance, 250);
}

window.addEventListener("resize", () => {
  const scroller = $.querySelector(".town-scroll");
  if (scroller) scroller.scrollLeft = scroller.clientWidth * townPage;
});

render();

bootCloud()
  .then((data) => {
    if (data) {
      state = migrate(data.state) || data.state;
      render();
    }
  })
  .catch((e) => {
    notice = "云端连接失败：" + e.message;
    render();
  });
