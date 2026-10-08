# V6 mobile presentation

All screens share the `mobile` CSS layer, declared after existing layers in `mobile-redesign.css`. Palette: warm paper, muted forest green, restrained borders. Original 38 hero illustrations are retained. This is a presentation and navigation release; it does not introduce level sharing or change reward balance.

- Camp: compact in-world destination, smaller objective line, one main campaign action, more visible scene, walking companions and three swipeable districts.
- Collection: readable four-column cards, recruitment hint for small collections, stable scrollable grid rows, readable hero names, full-screen portrait without the old HUD gap.
- Cultivation: taller portrait and three resource-aware tabs; reset, equipment and support move into a tools disclosure.
- Equipment/workshop: six pixel item icons, matching slot placeholders, comparison and enhancement, empty-slot routes directly to dungeons or shop.
- Formation: larger touch grips, clear selected slot and highlighted drag destination/removal surface; original tap and drag actions remain available.
- Campaign: forest scene, route-like stage nodes, concise chapter reward and encounter; dungeons, tower, expedition and weekly screens use the same controls.
- Summon: readable currency/cost/action grouping and pity, matching wishlist and exchange cards.
- Welfare/inbox/tasks: consistent readable reward tiles, task cards and claim controls.
- Guild/friends/chat/arena/account: shared headers, cards, type scale and action styles.
- Combat: full-height battlefield, live six-member portrait/health/action strip, landscape corresponding to encounter, no large return button during animation. Results expose the return button. Enemy damage, rewards and saves still use the authoritative combat result.

Validation: domain suite, 320×568 and 390×844 browser operation checks, gallery selection, ticket ten-pull, three formation drag operations, equipment buy/equip/enhance, live battle HUD, cloud reload, two-account guild/friends/chat/arena, committed-action response-loss recovery. Screenshots reviewed for core scenes and welfare/community.

## V7 art and combat follow-up

Original pixel camp artwork reserves an open ground plane for companions, with tavern/training/smith shortcuts tied to existing navigation. Twelve original spell illustrations replace generic skill symbols through a role/element mapping. The original hero atlas supplies resting poses so action-sheet edges do not appear in card and equipment screens; the initial trio uses timed action frames in battle and while walking. Actions begin at their anticipation frame rather than a global-clock offset. Battle presentation groups contiguous multi-target results without changing their order or the authoritative outcome; role projectiles, recovery and shield effects distinguish actions. Background contrast is reduced so actors and numbers stand out. Cultivation previews show actual basic-life changes as well as power changes.

This release retains all 38 approved hero portraits and saves. It does not add level sharing or claim that all 38 heroes have full animation sets. Those are separate gameplay/content targets.

## V8 refinement of existing features

Prototype action-sheet switching is removed from runtime. All 38 heroes retain one consistent original sprite model, with small translate-only attack/cast/walk effects. Battle presentation separates wind-up/projectile travel from hit results, updates health only at impact, emits one sound per grouped action and shows absorbed hits as shield blocks. Skipping cancels delayed hit results and removes transient effects before setting the authoritative final state. Existing combat calculations and rewards are unchanged.

Cultivation retains the selected tab after an upgrade. Equipment slots expose their selected state; enhancement is disabled when coins or stones are insufficient. Phone typography, spacing and roster touch surfaces are simplified. No new gameplay systems or schema changes.

Additional verification: recorded 320×568 and 390×844 browser sessions checked stable sprites, retained skill tab, slot selection, material guards, impact timing and skip during a travelling projectile. Existing domain and mobile checks remain in use.
