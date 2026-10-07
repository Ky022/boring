import { formationPositions } from './progression.js';
import { heroes } from './game.js';

// One shared move operation for roster replacement and occupied-slot swaps.
export function moveHero(positions, id, target) {
  const next = [...positions], source = next.indexOf(id);
  if (target === null) {
    if (source >= 0) next[source] = null;
    return next;
  }
  if (!Number.isInteger(target) || target < 0 || target > 5) return next;
  if (source >= 0) next[source] = next[target];
  next[target] = id;
  return next;
}

export function wireFormationDrag(ctx, selectPosition) {
  const root = ctx.root, screen = root.querySelector('.reference-formation');
  if (!screen) return;
  let pending = null, active = null, ghost = null, timer = null, suppressUntil = 0;
  const clearTargets = () => {
    screen.querySelectorAll('.drop-target,.drop-remove').forEach(n => n.classList.remove('drop-target','drop-remove'));
  };
  const cleanup = () => {
    clearTimeout(timer); timer = null;
    ghost?.remove(); ghost = null;
    document.body.classList.remove('formation-dragging'); clearTargets();
    pending = active = null;
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', finish);
    document.removeEventListener('pointercancel', cancel);
  };
  const hit = (x,y) => {
    const node = document.elementFromPoint(x,y);
    const slot = node?.closest('.formation-slots [data-position]');
    if (slot && screen.contains(slot)) return {slot, target:Number(slot.dataset.position)};
    const roster = node?.closest('.inline-formation-picker');
    if (roster && active?.source !== null) return {roster, target:null};
    return null;
  };
  const start = () => {
    if (!pending || ctx.isBusy() || !screen.isConnected) { cleanup(); return; }
    active = pending;
    ghost = document.createElement('div'); ghost.className = 'formation-drag-ghost';
    ghost.innerHTML = active.node.querySelector('.hero-art')?.outerHTML || '';
    document.body.append(ghost); document.body.classList.add('formation-dragging');
    ghost.style.left = `${active.x-32}px`; ghost.style.top = `${active.y-64}px`;
    active.node.setPointerCapture?.(active.pointerId);
  };
  const move = e => {
    if (!pending || e.pointerId !== pending.pointerId) return;
    if (!screen.isConnected) { cleanup(); return; }
    if (!active) {
      // Quick swipes scroll the roster; hold briefly to pick up a hero.
      if (Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>9) cleanup();
      return;
    }
    e.preventDefault(); ghost.style.left = `${e.clientX-32}px`; ghost.style.top = `${e.clientY-64}px`;
    clearTargets(); const target = hit(e.clientX,e.clientY);
    target?.slot?.classList.add('drop-target'); target?.roster?.classList.add('drop-remove');
  };
  const finish = e => {
    if (!pending || e.pointerId !== pending.pointerId) return;
    const drag = active, target = drag && hit(e.clientX,e.clientY);
    if (drag) { suppressUntil = performance.now()+500; e.preventDefault(); }
    cleanup();
    if (!drag || !target || ctx.isBusy()) return;
    const positions = formationPositions(ctx.getState()), next = moveHero(positions,drag.id,target.target);
    if (next.every((id,i)=>id===positions[i])) return;
    if (target.target !== null) selectPosition(target.target);
    ctx.run(async () => {
      await ctx.dispatch({type:'formation',positions:next});
      ctx.setNotice(`${heroes[drag.id].name}${target.target===null?'已下阵':'已就位'} · 阵容已保存`);
    });
  };
  const cancel = () => cleanup();
  screen.addEventListener('click', e => {
    if (performance.now()<suppressUntil) { e.preventDefault(); e.stopImmediatePropagation(); }
  },true);
  screen.addEventListener('pointerdown', e => {
    if (e.button !== 0 || pending || ctx.isBusy()) return;
    const node = e.target.closest('[data-position],[data-pick]');
    if (!node || !screen.contains(node)) return;
    const source = node.hasAttribute('data-position') ? Number(node.dataset.position) : null;
    const id = source === null ? Number(node.dataset.pick) : formationPositions(ctx.getState())[source];
    if (id === null || id === undefined) return;
    pending = {node,source,id,x:e.clientX,y:e.clientY,pointerId:e.pointerId};
    timer = setTimeout(start,180);
    document.addEventListener('pointermove',move,{passive:false});
    document.addEventListener('pointerup',finish);
    document.addEventListener('pointercancel',cancel);
  });
}
