# Stage Effects Campaign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first-stage upgrade for `大地編 / 大地をゆるがずワンワンステージ`: stage data, experience-to-clear progress, summon cooldowns, hit effects, and start/clear presentation.

**Architecture:** Keep the runtime as a single static `game.html`, but make the inside more data-driven through `STAGES` and explicit state fields. Preserve completed responsibilities: right-side ally base, left-side enemy base, three ally buttons, three enemy types, local image assets, no external communication, and GitHub Pages deployment.

**Tech Stack:** Static HTML/CSS/JavaScript, Canvas 2D, dependency-free Node.js verification scripts, GitHub Pages.

---

## Current Responsibility Audit

Already implemented and must be preserved:

- `game.html`: single-file playable browser game.
- `index.html`: public entry point.
- `assets/`: local ally/enemy PNG assets.
- `scripts/verify-game-contract.js`: contract checks for side layout, first-stage values, character labels, local sprites, enemy spawn mix, and JS syntax.
- Current allies: `まるねこ`, `かたいねこ`, `こうげきねこ`.
- Current enemies: `ぴょこネコ`, `にょろゴースト`, `わちゃわちゃトリオ`.
- Current battle loop: money income, enemy spawning, movement, automatic attacks, base HP, win/lose banner.
- Safety posture: no external scripts, no network calls, no storage APIs, local assets only.

Not implemented yet:

- `STAGES` data model.
- Runtime `大地編` and `大地をゆるがずワンワンステージ` presentation.
- Stage experience meter and target-clear condition.
- Per-unit summon cooldowns.
- Visual effects array and hit/base/clear effect rendering.
- README documentation for stage/chapter/experience plan.

## File Structure

Modify:

- `game.html`
  - Add `経験値` stat and stage/chapter UI.
  - Add `STAGES`, stage-derived reset state, experience state, cooldown state, effects state.
  - Add hit/base/clear effects drawing.
  - Add intro and clear overlays.

- `scripts/verify-game-contract.js`
  - Update hardcoded-value checks to protect stage data.
  - Add contract checks for stage name, chapter, experience, cooldowns, effects, and safety.

- `README.md`
  - Document the first chapter, first stage name, experience clear goal, and per-run experience rule.

Create:

- `scripts/verify-game-runtime.js`
  - Dependency-free mock-DOM verifier for summon cooldown and experience behavior.

Do not create build tooling, dependency manifests, save files, stage select UI, sound assets, or VPS deployment scripts.

---

### Task 1: Add Failing Contract Tests

**Files:**
- Modify: `scripts/verify-game-contract.js`

- [ ] **Step 1: Add helper assertions**

Add after `stateNumber`:

```js
function containsAny(source, expectedItems, label) {
  for (const expected of expectedItems) {
    contains(source, expected, label);
  }
}

function noForbiddenBrowserApis(source) {
  const forbidden = ["fetch(", "XMLHttpRequest", "localStorage", "sessionStorage", "eval("];
  for (const entry of forbidden) {
    assert(!source.includes(entry), `game.html must not include ${entry}`);
  }
}
```

- [ ] **Step 2: Add new contract assertions**

Add before `new Function(script);`:

```js
contains(script, "const STAGES = [", "stage data model");
contains(script, 'chapter: "大地編"', "first chapter name");
contains(script, 'name: "大地をゆるがずワンワンステージ"', "first stage name");
contains(script, "targetExperience: 100", "first stage experience target");
contains(script, "enemyDefeatExperience:", "enemy defeat experience table");
contains(script, "baseHitExperienceRate: 1", "base hit experience rate");
contains(script, "experience: 0", "experience starts at zero");
contains(script, "targetExperience: stage.targetExperience", "stage target experience state");
contains(script, "summonCooldowns:", "summon cooldown state");
contains(script, "effects: []", "effects state");
contains(script, "function addExperience", "experience helper");
contains(script, "function addEffect", "effect helper");
contains(script, "function updateEffects", "effect update helper");
contains(script, "function drawEffects", "effect renderer");
contains(script, "stageIntroTimer", "stage intro timer");
contains(script, "経験値MAX!", "experience clear text");
contains(script, "大地をゆるがずワンワンステージ クリア", "stage clear message");
contains(html, '<div class="stat"><span>経験値</span><strong id="experience">0 / 100</strong></div>', "experience stat tile");
contains(html, 'id="stageChapter"', "stage chapter UI");
contains(html, 'id="stageName"', "stage name UI");
containsAny(script, ["summonCooldownMs: 1400", "summonCooldownMs: 2600", "summonCooldownMs: 3200"], "ally summon cooldown tuning");
contains(script, "startMoney: 180", "first course starting money");
contains(script, "enemyBaseHp: 70", "first course enemy base HP");
contains(script, "enemySpawnMinMs: 3800", "first course enemy pacing minimum");
contains(script, "enemySpawnBaseMs: 5200", "first course enemy pacing base");
noForbiddenBrowserApis(html);
```

- [ ] **Step 3: Verify RED**

Run:

```bash
node scripts/verify-game-contract.js
```

Expected: FAIL with a missing item such as `stage data model must include: const STAGES = [`.

Do not commit the failing test by itself. Keep it in the working tree until Task 2 makes the stage-data assertions pass.

---

### Task 2: Add Stage Data And Stage UI

**Files:**
- Modify: `game.html`
- Modify: `scripts/verify-game-contract.js`

- [ ] **Step 1: Add stage and experience UI**

Replace the subtitle with:

```html
<p class="subtitle"><span id="stageChapter">大地編</span>｜<span id="stageName">大地をゆるがずワンワンステージ</span></p>
```

Add after the `撃破数` stat:

```html
<div class="stat"><span>経験値</span><strong id="experience">0 / 100</strong></div>
```

Change `.stats` to:

```css
.stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(88px, 1fr));
  gap: 8px;
  min-width: min(640px, 100%);
}
```

- [ ] **Step 2: Add UI references**

Add to `ui`:

```js
stageChapter: document.getElementById("stageChapter"),
stageName: document.getElementById("stageName"),
experience: document.getElementById("experience"),
```

- [ ] **Step 3: Add `STAGES` before `UNIT_TYPES`**

```js
const STAGES = [
  {
    id: "earth-wanwan-01",
    chapter: "大地編",
    name: "大地をゆるがずワンワンステージ",
    startMoney: 180,
    allyBaseHp: 100,
    enemyBaseHp: 70,
    targetExperience: 100,
    clearBonus: 120,
    enemyDefeatExperience: { pyoko: 18, nyoro: 30, trio: 26 },
    baseHitExperienceRate: 1,
    enemySpawnFirstMs: 2600,
    enemySpawnBaseMs: 5200,
    enemySpawnMinMs: 3800,
    enemySpawnTable: [
      { kind: "pyoko", weight: 70 },
      { kind: "nyoro", weight: 20 },
      { kind: "trio", weight: 10 }
    ]
  }
];
```

Remove the separate `ENEMY_SPAWN_TABLE` constant.

- [ ] **Step 4: Replace `resetGame()`**

```js
function currentStage() {
  return STAGES[0];
}

function resetGame() {
  const stage = currentStage();
  state = {
    stageIndex: 0,
    money: stage.startMoney,
    allyBaseHp: stage.allyBaseHp,
    enemyBaseHp: stage.enemyBaseHp,
    experience: 0,
    targetExperience: stage.targetExperience,
    defeats: 0,
    units: [],
    enemies: [],
    floatingTexts: [],
    effects: [],
    summonCooldowns: { neko: 0, tank: 0, battle: 0 },
    elapsed: 0,
    stageIntroTimer: 2200,
    enemySpawnTimer: stage.enemySpawnFirstMs,
    incomeTimer: 0,
    gameOver: false,
    result: "playing",
    message: `${stage.chapter}：${stage.name}`
  };
  lastTime = performance.now();
  updateUI();
}
```

- [ ] **Step 5: Update enemy selection**

Replace `chooseEnemyType()`:

```js
function chooseEnemyType() {
  const table = currentStage().enemySpawnTable;
  const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return { kind: entry.kind, type: ENEMY_TYPES[entry.kind] };
  }
  return { kind: "pyoko", type: ENEMY_TYPES.pyoko };
}
```

Replace `spawnEnemy()`:

```js
function spawnEnemy() {
  if (state.gameOver) return;
  const enemy = chooseEnemyType();
  state.enemies.push(createFighter(enemy.kind, enemy.type, ENEMY_BASE_X + 24, "enemy"));
}
```

Replace enemy spawn timer reset:

```js
const stage = currentStage();
state.enemySpawnTimer = Math.max(stage.enemySpawnMinMs, stage.enemySpawnBaseMs - state.elapsed * 0.01);
```

- [ ] **Step 6: Update `updateUI()`**

Add:

```js
const stage = currentStage();
ui.stageChapter.textContent = stage.chapter;
ui.stageName.textContent = stage.name;
ui.experience.textContent = `${Math.floor(state.experience)} / ${state.targetExperience}`;
```

- [ ] **Step 7: Verify and commit**

Run:

```bash
node scripts/verify-game-contract.js
```

Expected: stage-data assertions pass. The command may still fail for cooldown/effect helpers that are intentionally added later.

Commit when all stage-data and UI assertions are passing:

```bash
git add game.html scripts/verify-game-contract.js
git commit -m "feat: add first stage data model"
```

---

### Task 3: Add Runtime Verifier And Experience Clear Behavior

**Files:**
- Create: `scripts/verify-game-runtime.js`
- Modify: `game.html`

- [ ] **Step 1: Create runtime verifier**

Create `scripts/verify-game-runtime.js`:

```js
const fs = require("fs");
const assert = require("assert");

const html = fs.readFileSync("game.html", "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const elements = new Map();

function makeElement(id) {
  if (elements.has(id)) return elements.get(id);
  const element = {
    id,
    textContent: "",
    innerHTML: "",
    disabled: false,
    listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    click() { if (this.listeners.click) this.listeners.click(); }
  };
  elements.set(id, element);
  return element;
}

global.document = {
  getElementById(id) {
    if (id === "game") {
      return {
        width: 960,
        height: 480,
        getContext() {
          return new Proxy({}, {
            get(target, prop) {
              if (prop === "createLinearGradient") return () => ({ addColorStop() {} });
              if (!(prop in target)) target[prop] = () => {};
              return target[prop];
            },
            set(target, prop, value) {
              target[prop] = value;
              return true;
            }
          });
        }
      };
    }
    return makeElement(id);
  },
  createElement() {
    return {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage() {},
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        putImageData() {}
      })
    };
  }
};
global.performance = { now: () => 0 };
global.crypto = { randomUUID: () => "test-id" };
global.requestAnimationFrame = () => {};

new Function(script)();

assert.strictEqual(makeElement("experience").textContent, "0 / 100", "experience starts at zero");
makeElement("spawnNeko").click();
assert.strictEqual(makeElement("money").textContent, "130", "summoning spends money");
makeElement("spawnNeko").click();
assert.strictEqual(makeElement("money").textContent, "130", "cooldown blocks immediate double summon");
assert(makeElement("message").innerHTML.includes("準備中"), "cooldown message appears");
assert(makeElement("spawnNeko").textContent.includes("あと"), "cooldown label appears");
makeElement("restart").click();
assert.strictEqual(makeElement("experience").textContent, "0 / 100", "restart resets experience");

console.log("runtime verification passed");
```

Run:

```bash
node scripts/verify-game-runtime.js
```

Expected: FAIL until cooldown behavior is complete.

- [ ] **Step 2: Add experience helper**

Add after `addFloatingText()`:

```js
function addExperience(amount, x = WIDTH / 2, y = 96) {
  if (state.gameOver || amount <= 0) return;
  const before = state.experience;
  state.experience = Math.min(state.targetExperience, state.experience + amount);
  if (state.experience > before) {
    addFloatingText(x, y, `EXP +${Math.ceil(state.experience - before)}`, "#ffd166");
  }
}
```

- [ ] **Step 3: Add experience sources**

In `removeDefeated()`, before `return false;`:

```js
const stage = currentStage();
addExperience(stage.enemyDefeatExperience[enemy.kind] || 0, enemy.x, enemy.y - 62);
```

In the ally branch of `attackBase(actor)`, replace base damage with:

```js
const damage = Math.min(actor.attack, state.enemyBaseHp);
state.enemyBaseHp = Math.max(0, state.enemyBaseHp - actor.attack);
addExperience(damage * currentStage().baseHitExperienceRate, baseX, GROUND_Y - 90);
addFloatingText(baseX, GROUND_Y - 70, `-${actor.attack}`, "#ffd166");
if (state.enemyBaseHp <= 0) {
  addExperience(state.targetExperience - state.experience, baseX, GROUND_Y - 112);
}
```

- [ ] **Step 4: Update clear condition**

At the top of `checkResult()`:

```js
if (state.gameOver) return;
```

Replace the win branch with:

```js
if (state.experience >= state.targetExperience) {
  state.gameOver = true;
  state.result = "win";
  state.money += currentStage().clearBonus;
  state.message = `経験値MAX! ${currentStage().name} クリア。勝利ボーナス +${currentStage().clearBonus}！`;
}
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
```

Expected: experience assertions pass; runtime may still fail on cooldown until Task 4.

Commit when experience assertions are green:

```bash
git add game.html scripts/verify-game-runtime.js
git commit -m "feat: add stage experience progress"
```

---

### Task 4: Add Summon Cooldowns

**Files:**
- Modify: `game.html`
- Modify: `scripts/verify-game-runtime.js`

- [ ] **Step 1: Tune ally stats and cooldowns**

Apply:

```js
// まるねこ
speed: 0.82,
summonCooldownMs: 1400,

// かたいねこ
hp: 190,
attack: 7,
speed: 0.36,
summonCooldownMs: 2600,

// こうげきねこ
attack: 42,
speed: 0.58,
summonCooldownMs: 3200,
```

- [ ] **Step 2: Add cooldown helpers**

Add after `spendMoney()`:

```js
function canSummon(kind) {
  const type = UNIT_TYPES[kind];
  return !state.gameOver && state.money >= type.cost && state.summonCooldowns[kind] <= 0;
}

function formatSummonLabel(kind) {
  const type = UNIT_TYPES[kind];
  const remaining = state.summonCooldowns[kind];
  if (remaining > 0 && !state.gameOver) {
    return `${type.label} あと${(remaining / 1000).toFixed(1)}秒`;
  }
  return `${type.label} ${type.cost}`;
}
```

- [ ] **Step 3: Replace `spawnUnit()`**

```js
function spawnUnit(kind) {
  const type = UNIT_TYPES[kind];
  if (!canSummon(kind)) {
    state.message = state.gameOver
      ? state.message
      : state.summonCooldowns[kind] > 0
        ? `${type.label}は準備中。あと少し待とう。`
        : "お金が足りない。敵を倒すか少し待とう。";
    updateUI();
    return;
  }
  spendMoney(type.cost);
  state.summonCooldowns[kind] = type.summonCooldownMs;
  state.units.push(createFighter(kind, type, ALLY_BASE_X - 58, "ally"));
  state.message = `${type.label}を召喚した。`;
  updateUI();
}
```

- [ ] **Step 4: Tick cooldowns and update labels**

In `updateGame()`:

```js
Object.keys(state.summonCooldowns).forEach((kind) => {
  state.summonCooldowns[kind] = Math.max(0, state.summonCooldowns[kind] - deltaMs);
});
```

In `updateUI()`:

```js
ui.spawnNeko.textContent = formatSummonLabel("neko");
ui.spawnTank.textContent = formatSummonLabel("tank");
ui.spawnBattle.textContent = formatSummonLabel("battle");
ui.spawnNeko.disabled = !canSummon("neko");
ui.spawnTank.disabled = !canSummon("tank");
ui.spawnBattle.disabled = !canSummon("battle");
```

- [ ] **Step 5: Verify and commit**

```bash
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
git add game.html scripts/verify-game-runtime.js
git commit -m "feat: add summon cooldowns"
```

---

### Task 5: Add Combat Effects

**Files:**
- Modify: `game.html`

- [ ] **Step 1: Add effect helpers**

Add after `addFloatingText()`:

```js
function addEffect(type, x, y, color, team = "neutral", life = 28) {
  state.effects.push({ type, x, y, color, team, life, maxLife: life });
}

function updateEffects(dt) {
  state.effects.forEach((effect) => {
    effect.life -= dt;
  });
  state.effects = state.effects.filter((effect) => effect.life > 0);
}
```

- [ ] **Step 2: Add hit effects**

After `target.hitFlash = 8;`:

```js
addEffect(actor.team === "ally" ? "slash" : "impact", target.x, target.y - target.height * 0.55, actor.team === "ally" ? "#ffd166" : "#ff8787", actor.team);
addEffect("spark", target.x, target.y - target.height * 0.5, "#f6f7fb", actor.team, 18);
```

After base damage text:

```js
addEffect("baseHit", baseX, GROUND_Y - 82, actor.team === "ally" ? "#ffd166" : "#ff8787", actor.team, 32);
```

- [ ] **Step 3: Add `drawEffects()`**

Add before `drawFloatingTexts()`:

```js
function drawEffects() {
  for (const effect of state.effects) {
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.max(0, effect.life / effect.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = effect.color;
    ctx.fillStyle = effect.color;
    ctx.lineWidth = 4;

    if (effect.type === "slash") {
      ctx.beginPath();
      ctx.moveTo(effect.x - 18, effect.y + 12);
      ctx.lineTo(effect.x + 18, effect.y - 12);
      ctx.stroke();
    } else if (effect.type === "impact" || effect.type === "baseHit") {
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 10 + progress * 22, 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === "spark") {
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI * 2 * i) / 6;
        ctx.beginPath();
        ctx.moveTo(effect.x, effect.y);
        ctx.lineTo(effect.x + Math.cos(angle) * (8 + progress * 14), effect.y + Math.sin(angle) * (8 + progress * 14));
        ctx.stroke();
      }
    } else if (effect.type === "clearBurst") {
      for (let i = 0; i < 10; i += 1) {
        const angle = (Math.PI * 2 * i) / 10;
        ctx.beginPath();
        ctx.moveTo(effect.x + Math.cos(angle) * 36, effect.y + Math.sin(angle) * 22);
        ctx.lineTo(effect.x + Math.cos(angle) * (56 + progress * 28), effect.y + Math.sin(angle) * (34 + progress * 18));
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
```

Call `updateEffects(dt);` after `updateFloatingTexts(dt);`, and call `drawEffects();` after fighters and before `drawFloatingTexts();`.

Add clear burst in the win branch:

```js
addEffect("clearBurst", WIDTH / 2, 204, "#ffd166", "ally", 72);
```

- [ ] **Step 4: Verify and commit**

```bash
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
git add game.html
git commit -m "feat: add combat effects"
```

---

### Task 6: Add Stage Intro And Clear Presentation

**Files:**
- Modify: `game.html`

- [ ] **Step 1: Tick intro timer**

In `updateGame(deltaMs)`:

```js
state.stageIntroTimer = Math.max(0, state.stageIntroTimer - deltaMs);
```

- [ ] **Step 2: Add intro overlay**

Add before `drawResultBanner()`:

```js
function drawStageIntro() {
  if (state.stageIntroTimer <= 0 || state.gameOver) return;
  const stage = currentStage();
  const alpha = Math.min(1, state.stageIntroTimer / 500);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(13, 17, 24, 0.72)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd166";
  ctx.font = "800 24px system-ui, sans-serif";
  ctx.fillText(stage.chapter, WIDTH / 2, 188);
  ctx.fillStyle = "#f6f7fb";
  ctx.font = "900 34px system-ui, sans-serif";
  ctx.fillText(stage.name, WIDTH / 2, 230);
  ctx.restore();
}
```

Call `drawStageIntro();` before `drawResultBanner();`.

- [ ] **Step 3: Update result banner text**

Inside `drawResultBanner()` use:

```js
ctx.fillText(state.result === "win" ? "STAGE CLEAR!" : "TRY AGAIN", WIDTH / 2, 194);
ctx.fillStyle = state.result === "win" ? "#ffd166" : "#ff8787";
ctx.font = "800 24px system-ui, sans-serif";
ctx.fillText(state.result === "win" ? "経験値MAX!" : currentStage().chapter, WIDTH / 2, 232);
ctx.fillStyle = "#f6f7fb";
ctx.font = "700 18px system-ui, sans-serif";
ctx.fillText(state.message, WIDTH / 2, 266);
```

- [ ] **Step 4: Verify and commit**

```bash
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
git add game.html
git commit -m "feat: add stage intro and clear presentation"
```

---

### Task 7: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update summary and add stage section**

Change opening description:

```md
ブラウザで動く、ステージ制に育てていくミニタワーディフェンスゲームです。
```

Add after `遊び方`:

```md
## 現在のステージ

- 編: 大地編
- ステージ: 大地をゆるがずワンワンステージ
- クリア条件: 経験値を100までためる

経験値はこのステージ内だけの進行メーターです。敵を倒したり敵拠点にダメージを与えたりすると増え、一定数たまるとクリア演出に入ります。
```

Add to feature list:

```md
- 大地編 / 大地をゆるがずワンワンステージ
- 経験値システム
- 召喚クールタイム
- 攻撃ヒット演出
- ステージ開始、クリア演出
```

- [ ] **Step 2: Verify and commit**

```bash
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
git add README.md
git commit -m "docs: describe first stage experience system"
```

---

### Task 8: Full Verification And Visual QA

**Files:**
- Read: `game.html`, `README.md`, `scripts/verify-game-contract.js`, `scripts/verify-game-runtime.js`
- Temporary: `qa-stage-effects-check.html`, `qa-stage-effects.png`

- [ ] **Step 1: Run verification**

```bash
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
git diff --check
```

Expected:

- `game contract verification passed`
- `runtime verification passed`
- no `git diff --check` output

- [ ] **Step 2: Run safety scan**

```bash
rg -n "fetch\\(|XMLHttpRequest|localStorage|sessionStorage|eval\\(|https?://|<script src" game.html index.html README.md scripts assets docs
```

Expected:

- No hits in `game.html`.
- README may contain the GitHub repository URL only.

- [ ] **Step 3: Create local visual QA screenshot**

Create:

```bash
cp game.html qa-stage-effects-check.html
```

Patch only the QA copy near the bottom, replacing:

```js
loadCharacterSprites();
resetGame();
requestAnimationFrame(loop);
```

with:

```js
loadCharacterSprites();
resetGame();
addExperience(100, WIDTH / 2, 120);
checkResult();
draw();
requestAnimationFrame(loop);
```

Capture:

```bash
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files --screenshot=/Users/akinoemiko/projects/keito/KEITO_DAISENSO/qa-stage-effects.png --window-size=1120,760 file:///Users/akinoemiko/projects/keito/KEITO_DAISENSO/qa-stage-effects-check.html
```

Inspect with `view_image` and confirm:

- header shows `大地編` and stage name
- HUD has `経験値`
- buttons fit without overflow
- clear overlay text fits
- effects do not cover controls
- bases still mirror left/right margins

Remove:

```bash
rm qa-stage-effects-check.html qa-stage-effects.png
```

- [ ] **Step 4: Commit QA fixes only if needed**

```bash
git status --short
git add game.html README.md scripts/verify-game-contract.js scripts/verify-game-runtime.js
git commit -m "fix: polish stage effects QA"
```

Skip this commit if no QA fixes were needed.

---

### Task 9: PR, Merge, Main Sync, And GitHub Pages Verification

**Files:**
- Git/GitHub only.

- [ ] **Step 1: Push implementation branch**

```bash
git push -u origin implement-stage-effects-campaign
```

- [ ] **Step 2: Create PR**

Title:

```text
Implement stage effects campaign
```

Body:

```md
## Summary
- Add first-stage data for 大地編 / 大地をゆるがずワンワンステージ.
- Add stage experience progress and experience-based clear animation.
- Add summon cooldowns, combat effects, stage intro, and clear presentation.
- Keep the game static, local-asset-only, and GitHub Pages friendly.

## Verification
- `node scripts/verify-game-contract.js`
- `node scripts/verify-game-runtime.js`
- `git diff --check`
- Safety scan for network/storage APIs
- Local Chrome screenshot QA

## Safety
- No external scripts, fetch, XHR, storage APIs, or save data.
- No new dependencies.
- Existing first-stage side layout and local image fallback preserved.
```

- [ ] **Step 3: Check PR**

```bash
PR_NUMBER="$(gh pr view --json number -q .number)"
gh pr view "$PR_NUMBER" --json state,mergeable,statusCheckRollup,url,headRefName,baseRefName
gh pr diff "$PR_NUMBER" --name-only
git diff origin/main...HEAD --stat
```

Expected changed files:

- `game.html`
- `README.md`
- `scripts/verify-game-contract.js`
- `scripts/verify-game-runtime.js`

- [ ] **Step 4: Merge PR**

```bash
PR_NUMBER="$(gh pr view --json number -q .number)"
gh pr merge "$PR_NUMBER" --squash --delete-branch
```

- [ ] **Step 5: Re-run local main verification**

```bash
git status --short --branch
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
```

- [ ] **Step 6: Verify GitHub Pages**

```bash
gh api repos/Emiko8628/KEITO_DAISENSO/pages
COMMIT="$(git rev-parse --short HEAD)"
curl -sL "https://emiko8628.github.io/KEITO_DAISENSO/game.html?v=$COMMIT" -o /private/tmp/keito-live-game-stage-effects.html
node -e "const fs=require('fs'); const html=fs.readFileSync('/private/tmp/keito-live-game-stage-effects.html','utf8'); const required=['大地編','大地をゆるがずワンワンステージ','経験値','経験値MAX!','summonCooldowns','drawEffects']; const missing=required.filter(s=>!html.includes(s)); if(missing.length){ console.error('live verification failed: '+missing.join(', ')); process.exit(1); } console.log('live verification passed');"
rm /private/tmp/keito-live-game-stage-effects.html
```

Expected:

- Pages status is `built`.
- live verification passes.

## Final Hole Check

- [ ] `git status --short --branch` is clean on main.
- [ ] No forbidden APIs in `game.html`.
- [ ] `STAGES` has exactly one playable stage.
- [ ] Visible first stage name matches `大地をゆるがずワンワンステージ`.
- [ ] Current ally visible names are `まるねこ`, `かたいねこ`, `こうげきねこ`.
- [ ] Old ally names appear only in historical docs/memory, not runtime UI.
- [ ] Experience is per-run and resets on restart.
- [ ] No VPS action is needed because deployment target is GitHub Pages.
