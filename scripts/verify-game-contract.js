const fs = require("fs");
const assert = require("assert");

const html = fs.readFileSync("game.html", "utf8");
const readme = fs.readFileSync("README.md", "utf8");
const worker = fs.readFileSync("workers/live-audience.mjs", "utf8");
const wrangler = fs.readFileSync("wrangler.toml", "utf8");
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);

assert(scriptMatch, "game.html must include an inline script block");

const script = scriptMatch[1];
const requiredEnemySprites = [
  { name: "ぴょこネコ", file: "assets/enemy-pyoko-neko.png", assetRef: "GAME_ASSETS.enemies.pyoko" },
  { name: "にょろゴースト", file: "assets/enemy-nyoro-ghost.png", assetRef: "GAME_ASSETS.enemies.nyoro" },
  { name: "わちゃわちゃトリオ", file: "assets/enemy-wachawacha-trio.png", assetRef: "GAME_ASSETS.enemies.trio" }
];
const requiredBeachEnemySprites = [
  { name: "うみぴょこネコ", file: "assets/enemy-beach-pyoko-neko.png", assetRef: "GAME_ASSETS.enemies.beachPyoko" },
  { name: "しおかぜゴースト", file: "assets/enemy-beach-nyoro-ghost.png", assetRef: "GAME_ASSETS.enemies.beachNyoro" },
  { name: "なみのりトリオ", file: "assets/enemy-beach-wachawacha-trio.png", assetRef: "GAME_ASSETS.enemies.beachTrio" }
];
const requiredAllySprites = [
  { name: "まるねこ", file: "assets/ally-neko-v2.png", assetRef: "GAME_ASSETS.allies.neko", buttonId: "spawnNeko", buttonText: "まるねこ 50" },
  { name: "かたいねこ", file: "assets/ally-tank-neko-v2.png", assetRef: "GAME_ASSETS.allies.tank", buttonId: "spawnTank", buttonText: "かたいねこ 80" },
  { name: "こうげきねこ", file: "assets/ally-battle-neko-v2.png", assetRef: "GAME_ASSETS.allies.battle", buttonId: "spawnBattle", buttonText: "こうげきねこ 110" },
  { name: "あしながうみネコ", file: "assets/ally-ashinaga-umi-neko-v3.png", assetRef: "GAME_ASSETS.allies.ashinaga", buttonId: "spawnAshinaga", buttonText: "あしながうみネコ 140" }
];
const requiredStageBackgrounds = [
  {
    name: "first stage",
    file: "assets/stage-earth-wanwan-background.png",
    assetRef: "GAME_ASSETS.backgrounds.earthWanwan"
  },
  {
    name: "second stage",
    file: "assets/stage-beach-background.png",
    assetRef: "GAME_ASSETS.backgrounds.beach"
  }
];
const requiredBaseSprites = [
  "assets/base-ally-blue-castle-v2.png",
  "assets/base-enemy-stage-1-gold-castle-v2.png",
  "assets/base-enemy-stage-2-beach-castle.png",
  "assets/base-enemy-stage-3-forest-castle.png",
  "assets/base-enemy-stage-4-ghost-castle.png"
];

function numberConstant(name) {
  const match = script.match(new RegExp(`const ${name} = ([^;]+);`));
  assert(match, `missing constant ${name}`);
  const value = Function("WIDTH", `return (${match[1]});`)(960);
  assert.strictEqual(typeof value, "number", `${name} must resolve to a number`);
  return value;
}

function contains(source, expected, label) {
  assert(
    source.includes(expected),
    `${label} must include: ${expected}`
  );
}

function pngHasAlpha(file) {
  const png = fs.readFileSync(file);
  assert.strictEqual(png.toString("ascii", 1, 4), "PNG", `${file} must be a PNG file`);
  assert.strictEqual(png.toString("ascii", 12, 16), "IHDR", `${file} must include a PNG IHDR chunk`);
  return png[25] === 4 || png[25] === 6;
}

function functionSection(name, nextName) {
  const start = script.indexOf(`function ${name}`);
  assert(start >= 0, `missing function ${name}`);
  if (!nextName) return script.slice(start);
  const end = script.indexOf(`function ${nextName}`, start + 1);
  assert(end > start, `missing function ${nextName} after ${name}`);
  return script.slice(start, end);
}

const allyBaseX = numberConstant("ALLY_BASE_X");
const enemyBaseX = numberConstant("ENEMY_BASE_X");
const attackBaseSection = functionSection("attackBase", "updateFighter");
const updateFighterSection = functionSection("updateFighter", "addEffect");
const removeDefeatedSection = functionSection("removeDefeated", "updateGame");
const checkResultSection = functionSection("checkResult", "updateUI");
const updateUISection = functionSection("updateUI", "drawBackground");
const drawBaseSection = functionSection("drawBase", "drawBaseStructure");
const drawBaseImageSection = functionSection("drawBaseImage", "drawCanvasBaseStructure");
const drawCanvasBaseStructureSection = functionSection("drawCanvasBaseStructure", "drawFighter");
const drawFighterSection = functionSection("drawFighter", "drawFighterShadow");
const drawEffectsSection = functionSection("drawEffects", "drawStageIntro");

assert(
  allyBaseX > enemyBaseX,
  "first course must place the player's base on the right and enemy base on the left"
);

assert.strictEqual(
  enemyBaseX - 44,
  960 - (allyBaseX + 44),
  "player and enemy base label margins should be mirrored"
);

contains(
  script,
  "const GAME_ASSETS = Object.freeze",
  "central game asset registry"
);

contains(
  script,
  "bases: Object.freeze",
  "base asset registry"
);

contains(
  script,
  "backgrounds: Object.freeze",
  "background asset registry"
);

contains(
  script,
  "allies: Object.freeze",
  "ally asset registry"
);

contains(
  script,
  "enemies: Object.freeze",
  "enemy asset registry"
);

contains(
  script,
  "const STAGES = [",
  "stage data"
);

contains(
  script,
  "const FIGHTER_GROUND_Y = GROUND_Y + 24",
  "fighter ground contact line should match the visible floor edge"
);

contains(
  script,
  'chapter: "大地編"',
  "first chapter name"
);

contains(
  script,
  'name: "大地をゆるがすワンワンステージ"',
  "first stage name"
);

for (const background of requiredStageBackgrounds) {
  assert(
    fs.existsSync(background.file),
    `missing ${background.name} background asset: ${background.file}`
  );
  contains(script, background.file, `${background.name} background asset path`);
  contains(script, `background: ${background.assetRef}`, `${background.name} background image`);
}

contains(
  script,
  "targetExperience: 100",
  "first stage experience target"
);

contains(
  script,
  "enemyBaseHp: 70",
  "first course enemy base HP should be low enough for a quick first win"
);

contains(
  script,
  "startMoney: 180",
  "first course should start with enough money to summon quickly"
);

contains(
  script,
  "enemySpawnMinMs: 3800",
  "first course minimum enemy pacing"
);

contains(
  script,
  "enemySpawnBaseMs: 5200",
  "first course enemy pacing"
);

contains(
  script,
  'id: "beach-defense-01"',
  "second stage id"
);

contains(
  script,
  'chapter: "海辺編"',
  "second chapter name"
);

contains(
  script,
  'name: "ざぶざぶビーチ防衛戦"',
  "second stage name"
);

contains(
  script,
  "targetExperience: 120",
  "second stage experience target"
);

contains(
  script,
  "enemyBaseHp: 95",
  "second stage enemy base HP"
);

contains(
  script,
  "clearBonus: 150",
  "second stage clear bonus"
);

contains(
  script,
  "enemySpawnFirstMs: 2300",
  "second stage first enemy pacing"
);

contains(
  script,
  "enemySpawnBaseMs: 4700",
  "second stage enemy pacing"
);

contains(
  script,
  "enemySpawnMinMs: 3400",
  "second stage minimum enemy pacing"
);

contains(
  script,
  'label: "うみぴょこネコ"',
  "second stage pyoko variant label"
);

contains(
  script,
  'label: "しおかぜゴースト"',
  "second stage nyoro variant label"
);

contains(
  script,
  'label: "なみのりトリオ"',
  "second stage trio variant label"
);

contains(
  script,
  'label: "あしながうみネコ"',
  "ashinaga ally label"
);

[
  ["ぴょこネコ", "hp: 42", "attack: 8"],
  ["にょろゴースト", "hp: 84", "attack: 12"],
  ["わちゃわちゃトリオ", "hp: 64", "attack: 15"],
  ["うみぴょこネコ", "hp: 50", "attack: 9"],
  ["しおかぜゴースト", "hp: 96", "attack: 14"],
  ["なみのりトリオ", "hp: 74", "attack: 17"]
].forEach(([label, hp, attack]) => {
  const labelIndex = script.indexOf(`label: "${label}"`);
  assert(labelIndex >= 0, `${label} enemy label must exist`);
  const enemyBlock = script.slice(labelIndex, script.indexOf("}", labelIndex));
  contains(enemyBlock, hp, `${label} tuned HP`);
  contains(enemyBlock, attack, `${label} tuned attack`);
});

[
  ["あしながうみネコ", "cost: 140", "hp: 120", "attack: 30", "range: 58"]
].forEach(([label, cost, hp, attack, range]) => {
  const labelIndex = script.indexOf(`label: "${label}"`);
  assert(labelIndex >= 0, `${label} ally label must exist`);
  const allyBlock = script.slice(labelIndex, script.indexOf("}", labelIndex));
  contains(allyBlock, cost, `${label} ally cost`);
  contains(allyBlock, hp, `${label} ally HP`);
  contains(allyBlock, attack, `${label} ally attack`);
  contains(allyBlock, range, `${label} ally range`);
});

assert(
  !script.includes("beachAshinaga") &&
    !script.includes("enemy-beach-ashinaga-neko.png") &&
    !fs.existsSync("assets/enemy-beach-ashinaga-neko.png"),
  "あしながうみネコ must not remain an enemy definition or enemy asset"
);

contains(
  script,
  'pyoko: 18',
  "first stage pyoko experience"
);

contains(
  script,
  'nyoro: 30',
  "first stage nyoro experience"
);

contains(
  script,
  'trio: 26',
  "first stage trio experience"
);

contains(
  script,
  'beachPyoko: 20',
  "second stage pyoko variant experience"
);

contains(
  script,
  'beachNyoro: 32',
  "second stage nyoro variant experience"
);

contains(
  script,
  'beachTrio: 28',
  "second stage trio variant experience"
);

contains(
  script,
  '{ kind: "beachPyoko", weight: 55 }',
  "second stage pyoko variant spawn weight"
);

contains(
  script,
  '{ kind: "beachNyoro", weight: 30 }',
  "second stage nyoro variant spawn weight"
);

contains(
  script,
  '{ kind: "beachTrio", weight: 15 }',
  "second stage trio variant spawn weight"
);

assert(
  !script.includes("spriteTint") && !script.includes('globalCompositeOperation = "source-atop"'),
  "stage 2 enemy variants should not tint or recolor existing sprites"
);

contains(
  script,
  'state.units.push(createFighter(kind, type, ALLY_BASE_X - 58, "ally"));',
  "ally spawn side"
);

contains(
  script,
  'state.enemies.push(createFighter(enemy.kind, enemy.type, ENEMY_BASE_X + 24, "enemy"));',
  "enemy spawn side"
);

contains(
  script,
  "y: FIGHTER_GROUND_Y",
  "fighters should stand on the same visual ground line as bases"
);

contains(
  script,
  'actor.x += actor.team === "ally" ? -actor.speed * dt : actor.speed * dt;',
  "movement direction"
);

for (const sprite of requiredEnemySprites) {
  assert(
    fs.existsSync(sprite.file),
    `missing enemy sprite asset: ${sprite.file}`
  );
  contains(script, `label: "${sprite.name}"`, `${sprite.name} enemy label`);
  contains(script, `sprite: ${sprite.assetRef}`, `${sprite.name} enemy sprite`);
}

for (const sprite of requiredBeachEnemySprites) {
  assert(
    fs.existsSync(sprite.file),
    `missing beach enemy sprite asset: ${sprite.file}`
  );
  contains(script, sprite.file, `${sprite.name} beach enemy sprite asset`);
  contains(script, `label: "${sprite.name}"`, `${sprite.name} beach enemy label`);
  contains(script, `sprite: ${sprite.assetRef}`, `${sprite.name} beach enemy sprite`);
}

for (const sprite of requiredAllySprites) {
  assert(
    fs.existsSync(sprite.file),
    `missing ally sprite asset: ${sprite.file}`
  );
  contains(script, `label: "${sprite.name}"`, `${sprite.name} ally label`);
  contains(script, `sprite: ${sprite.assetRef}`, `${sprite.name} ally sprite`);
  contains(html, `id="${sprite.buttonId}"`, `${sprite.name} summon button id`);
  contains(html, `>${sprite.buttonText}</button>`, `${sprite.name} summon button text`);
  assert(
    pngHasAlpha(sprite.file),
    `${sprite.name} sprite must contain a real alpha channel`
  );
}

for (const opaqueSprite of [
  "assets/ally-neko.png",
  "assets/ally-tank-neko.png",
  "assets/ally-battle-neko.png",
  "assets/ally-ashinaga-umi-neko.png"
]) {
  assert(
    !fs.existsSync(opaqueSprite),
    `cached opaque ally sprite must stay removed: ${opaqueSprite}`
  );
}

contains(
  script,
  "function drawCharacterSprite",
  "shared character sprite renderer"
);

contains(
  script,
  "function loadStageBackgrounds",
  "stage background image loader"
);

contains(
  script,
  "function drawStageBackgroundImage",
  "stage background image renderer"
);

contains(
  script,
  "drawFallbackBackground();",
  "stage background should keep a fallback if the image is unavailable"
);

contains(
  script,
  "function drawFighterShadow",
  "fighter ground shadow renderer"
);

contains(
  script,
  "shadowWidth * 1.2",
  "fighter shadow should have a soft contact layer"
);

contains(
  script,
  "rgba(0, 0, 0, 0.58)",
  "fighter shadow center should be visible on the dark ground"
);

contains(
  script,
  "rgba(255, 255, 255, 0.12)",
  "fighter shadow should include a subtle rim so it reads on dark terrain"
);

contains(
  script,
  "ctx.ellipse(0, 0, shadowWidth * 1.2, 5",
  "fighter shadow should be flattened directly under the feet"
);

contains(
  script,
  "function drawBaseStructure",
  "structured base renderer"
);

for (const sprite of requiredBaseSprites) {
  assert(
    fs.existsSync(sprite),
    `missing base sprite asset: ${sprite}`
  );
  contains(script, sprite, `${sprite} base sprite reference`);
}

contains(
  script,
  "const ALLY_BASE_SPRITE = GAME_ASSETS.bases.ally",
  "shared ally base sprite"
);

contains(
  script,
  "enemyBaseSprite: GAME_ASSETS.bases.enemyStage1",
  "first stage enemy base sprite"
);

contains(
  script,
  "const FUTURE_ENEMY_BASE_SPRITES = Object.freeze",
  "future enemy base sprite registry"
);

contains(
  script,
  "GAME_ASSETS.bases.enemyStage2",
  "stage 2 future base should use central asset registry"
);

contains(
  script,
  "GAME_ASSETS.bases.enemyStage3",
  "stage 3 future base should use central asset registry"
);

contains(
  script,
  "GAME_ASSETS.bases.enemyStage4",
  "stage 4 future base should use central asset registry"
);

contains(
  script,
  "const STAGE_MAP = Object.freeze",
  "stage map navigation source of truth"
);

contains(
  script,
  'id: "earth-wanwan-01"',
  "stage map first node id"
);

contains(
  script,
  'status: "playable"',
  "stage map playable status"
);

contains(
  script,
  "stageIndex: 0",
  "stage map playable node should point to the first real stage"
);

contains(
  script,
  'id: "beach-defense-01"',
  "stage map second playable node id"
);

contains(
  script,
  'chapter: "海辺編"',
  "stage map second playable chapter"
);

contains(
  script,
  "stageIndex: 1",
  "stage map second playable node should point to the second real stage"
);

contains(
  script,
  'id: "forest-preview-01"',
  "stage map third preview node id"
);

contains(
  script,
  'chapter: "森編"',
  "stage map third preview chapter"
);

contains(
  script,
  'id: "ghost-night-preview-01"',
  "stage map fourth preview node id"
);

contains(
  script,
  'chapter: "おばけ屋敷編"',
  "stage map fourth preview chapter"
);

contains(
  script,
  'status: "locked"',
  "stage map locked preview status"
);

contains(
  html,
  'id="stageMap"',
  "stage map view"
);

contains(
  html,
  'id="battleView"',
  "battle view boundary"
);

contains(
  html,
  'id="startStage0"',
  "playable first stage start control"
);

contains(
  html,
  'id="lockedStage1"',
  "second stage start control"
);

contains(
  html,
  'id="lockedStage2"',
  "locked third stage preview control"
);

contains(
  html,
  'id="lockedStage3"',
  "locked fourth stage preview control"
);

contains(
  html,
  'data-stage-map-action="start"',
  "stage map start action marker"
);

contains(
  html,
  'data-stage-map-action="locked"',
  "stage map locked action marker"
);

contains(
  html,
  "準備中",
  "locked stage preview copy"
);

contains(
  script,
  "baseSprite: GAME_ASSETS.bases.enemyStage1",
  "stage map first base should use central asset registry"
);

contains(
  script,
  "baseSprite: GAME_ASSETS.bases.enemyStage2",
  "stage map second base should use central asset registry"
);

contains(
  script,
  "baseSprite: GAME_ASSETS.bases.enemyStage3",
  "stage map third base should use central asset registry"
);

contains(
  script,
  "baseSprite: GAME_ASSETS.bases.enemyStage4",
  "stage map fourth base should use central asset registry"
);

contains(
  script,
  "const playableStageIds = new Set(STAGES.map((stage) => stage.id));",
  "stage map playable nodes should be validated against stage data"
);

contains(
  script,
  "const stageMapPlayableNodes = STAGE_MAP.filter((node) => node.status === \"playable\");",
  "stage map playable node set"
);

contains(
  script,
  "stageMapPlayableNodes.every((node) => playableStageIds.has(node.id))",
  "playable stage map nodes must point to real stage ids"
);

contains(
  script,
  "function createInitialState",
  "selected stage initial-state boundary"
);

contains(
  script,
  "function startStage",
  "stage map start boundary"
);

contains(
  script,
  "function selectStageMapNode",
  "stage map selection boundary"
);

contains(
  script,
  "function renderStageMap",
  "stage map rendering boundary"
);

contains(
  script,
  "function showStageMap",
  "stage map visibility boundary"
);

contains(
  script,
  "function showBattleView",
  "battle view visibility boundary"
);

contains(
  script,
  "const baseImageCache = new Map",
  "base image cache"
);

contains(
  script,
  "function loadBaseImages",
  "base image loader"
);

contains(
  script,
  "function drawBaseImage",
  "base image renderer"
);

contains(
  script,
  "baseImageCache.set(sprite, prepareSprite(image));",
  "base image loader should remove generated-image checkerboard backgrounds"
);

contains(
  script,
  "const BASE_IMAGE_GROUND_Y = GROUND_Y + 34",
  "image bases should use an explicit ground contact line"
);

contains(
  drawBaseImageSection,
  "const dy = BASE_IMAGE_GROUND_Y - drawHeight;",
  "image bases should sit directly on the ground contact line"
);

assert(
  !drawBaseImageSection.includes("ctx.ellipse") &&
    !drawBaseImageSection.includes("rgba(0, 0, 0"),
  "image bases should not draw a separate fake shadow"
);

contains(
  script,
  "if (drawBaseImage(x, team)) return;",
  "base drawing should prefer loaded image assets"
);

contains(
  script,
  "drawCanvasBaseStructure(x, hp, team);",
  "base drawing should keep a canvas fallback"
);

contains(
  script,
  "function drawBaseHpText",
  "base HP should be rendered as numeric text above castles"
);

contains(
  drawBaseSection,
  "drawBaseHpText(x, hp, maxHp);",
  "base drawing should use numeric current/max HP text"
);

assert(
  !drawBaseSection.includes("drawHpBar"),
  "base drawing should not render a gauge bar"
);

assert(
  !drawFighterSection.includes("drawHpBar"),
  "fighters should keep internal HP without rendering overhead HP bars"
);

assert(
  !script.includes("function drawHpBar"),
  "battle canvas should not include the old HP gauge renderer"
);

assert(
  !drawCanvasBaseStructureSection.includes('fillText(isAlly ? "HOME" : "BOSS"'),
  "canvas fallback bases should not show HOME/BOSS labels"
);

contains(
  script,
  'summonCooldownMs: 1400',
  "まるねこ summon cooldown"
);

contains(
  script,
  'summonCooldownMs: 2600',
  "かたいねこ summon cooldown"
);

contains(
  script,
  'summonCooldownMs: 3200',
  "こうげきねこ summon cooldown"
);

contains(
  script,
  "summonCooldowns:",
  "summon cooldown state"
);

contains(
  script,
  "function addExperience",
  "experience helper"
);

contains(
  script,
  "const ANALYTICS_CONFIG = {",
  "analytics config boundary"
);

contains(
  script,
  "enabled: true",
  "analytics provider must be enabled only in the provider enablement PR"
);

contains(
  script,
  'provider: "google_analytics"',
  "analytics provider must be Google Analytics"
);

contains(
  script,
  'measurementId: "G-930NR1L6KX"',
  "Google Analytics measurement ID"
);

contains(
  script,
  'scriptSrc: "https://www.googletagmanager.com/gtag/js?id=G-930NR1L6KX"',
  "Google tag script URL"
);

contains(
  script,
  "function trackGoogleAnalyticsEvent",
  "Google Analytics event adapter"
);

contains(
  script,
  "send_page_view: false",
  "Google Analytics automatic page_view should stay disabled"
);

contains(
  html,
  "Google Analyticsで利用状況を計測し、現在の参戦人数表示のため匿名の一時信号を送信します。個人情報やゲーム内入力内容は保存しません。",
  "analytics-enabled footer copy"
);

contains(
  readme,
  "Google Analyticsを有効にする場合のみ、game_open / first_summon / stage_clear を送信します",
  "README analytics disclosure"
);

contains(
  script,
  "const ANALYTICS_EVENTS = Object.freeze",
  "analytics event names should be centralized"
);

contains(
  script,
  "game_open",
  "analytics should support game_open"
);

contains(
  script,
  "first_summon",
  "analytics should support first_summon"
);

contains(
  script,
  "stage_clear",
  "analytics should support stage_clear"
);

contains(
  script,
  "function trackGameEvent",
  "single analytics tracking entrypoint"
);

contains(
  script,
  "function trackNoopEvent",
  "safe analytics disabled adapter"
);

contains(
  script,
  "const analyticsSession = {",
  "analytics page-session state should live outside resetGame"
);

assert(
  !script.includes("localStorage") && !script.includes("sessionStorage") && !script.includes("document.cookie"),
  "game must not add browser storage identifiers"
);

const allowedExternalUrls = [
  "https://keito-daisenso-live-audience.futunex1115.workers.dev/heartbeat",
  "https://www.googletagmanager.com/gtag/js?id=G-930NR1L6KX"
];
const externalUrls = Array.from(new Set(
  html.match(/https?:\/\/[^"'`\s<>)]+/g) || []
)).sort();
assert.deepStrictEqual(
  externalUrls,
  allowedExternalUrls,
  "game.html must only allow the selected Google tag script"
);

const legacyAnalyticsProvider = "plaus" + "ible";
assert(
  !script.includes(legacyAnalyticsProvider) &&
    !script.includes(legacyAnalyticsProvider[0].toUpperCase() + legacyAnalyticsProvider.slice(1)),
  "legacy analytics adapter must be removed when Google Analytics is selected"
);

assert(
  !script.includes("analytics: {"),
  "analytics page-session flags must not be reset with game state"
);

contains(
  script,
  "experienceNoticeShown: false",
  "experience notice state"
);

contains(
  script,
  "function maybeShowExperienceNotice",
  "one-time experience notice helper"
);

contains(
  script,
  "経験値がたまったよ！",
  "experience notice text"
);

contains(
  checkResultSection,
  "state.enemyBaseHp <= 0",
  "enemy-base destruction clear condition"
);

assert(
  !checkResultSection.includes("state.experience >= state.targetExperience"),
  "experience target must not be a terminal clear condition"
);

assert(
  !attackBaseSection.includes("addExperience(state.targetExperience - state.experience"),
  "destroying the enemy base must not force-fill remaining experience"
);

assert(
  !attackBaseSection.includes("`-${actor.attack}`") &&
    !updateFighterSection.includes("`-${actor.attack}`"),
  "attack damage numbers should not be rendered as floating text"
);

assert(
  !attackBaseSection.includes("addEffect(") &&
    !updateFighterSection.includes("addEffect(") &&
    !removeDefeatedSection.includes("addEffect("),
  "ordinary attack, base-hit, and defeated-enemy impact effects should stay hidden"
);

assert(
  !drawEffectsSection.includes('effect.type === "slash"') &&
    !drawEffectsSection.includes('effect.type === "impact"') &&
    !drawEffectsSection.includes('effect.type === "baseHit"'),
  "hit shockwave effect drawing branches should be removed"
);

assert(
  !script.includes("hitFlash") &&
    !script.includes("brightness(1.7)") &&
    !script.includes("ctx.filter =") &&
    !script.includes("drawCharacterSprite(fighter,"),
  "hit flash should stay disabled"
);

assert(
  !script.includes("addFloatingText") &&
    !script.includes("floatingTexts") &&
    !script.includes("drawFloatingTexts"),
  "combat progress numbers should stay internal and not render floating text"
);

assert(
  !script.includes("EXP +${gained}") && !script.includes("`+${enemy.reward}`"),
  "EXP and reward gains should not appear as floating battle numbers"
);

contains(
  html,
  'id="experience"',
  "experience HUD"
);

contains(
  html,
  'class="battle-hud"',
  "in-game battle HUD"
);

assert(
  !html.includes('id="allyBase"') &&
    !html.includes('id="enemyBase"') &&
    !html.includes(">HOME ") &&
    !html.includes(">BOSS "),
  "top HUD should not show HOME/BOSS base labels or duplicate base HP"
);

assert(
  !updateUISection.includes("allyBase") && !updateUISection.includes("enemyBase"),
  "top HUD updates should not duplicate base HP"
);

contains(
  html,
  'id="viewerCount"',
  "live audience counter"
);

contains(
  html,
  'class="audience-line"',
  "audience counter should live inside the HUD"
);

contains(
  readme,
  "現在の参戦人数を表示するため、Cloudflare Workerへ匿名の一時セッション信号を送信します",
  "README should disclose the anonymous live audience heartbeat"
);

contains(
  script,
  "const LIVE_AUDIENCE_CONFIG = {",
  "live audience config boundary"
);

contains(
  script,
  "endpoint: \"https://keito-daisenso-live-audience.futunex1115.workers.dev/heartbeat\"",
  "live audience endpoint"
);

contains(
  script,
  "function initializeLiveAudience",
  "live audience initializer"
);

contains(
  script,
  "function trackLiveAudienceHeartbeat",
  "live audience heartbeat"
);

assert(
  !script.includes("function estimateRealtimeAudience"),
  "live audience count must not use the old local presentation estimator"
);

contains(
  worker,
  "export class LiveAudienceRoom",
  "Cloudflare Durable Object live audience room"
);

contains(
  worker,
  "ALLOWED_ORIGINS",
  "Worker CORS allowlist"
);

contains(
  wrangler,
  'name = "keito-daisenso-live-audience"',
  "Cloudflare Worker deployment name"
);

contains(
  wrangler,
  'name = "LIVE_AUDIENCE_ROOM"',
  "Cloudflare Durable Object binding"
);

contains(
  wrangler,
  'ALLOWED_ORIGINS = "https://emiko8628.github.io,http://127.0.0.1:8765"',
  "Cloudflare Worker allowed origins"
);

contains(
  html,
  'class="battle-controls"',
  "battle control wrapper"
);

contains(
  html,
  'class="summon-deck"',
  "summon card deck"
);

contains(
  html,
  'aria-label="味方チーム"',
  "summon deck accessibility label"
);

contains(
  html,
  "grid-template-columns: repeat(5, minmax(116px, 1fr))",
  "summon deck should be prepared for a 5-column team layout"
);

contains(
  html,
  "grid-auto-rows: minmax(72px, auto)",
  "summon deck should be prepared for a second ally team row"
);

contains(
  html,
  'class="hud-actions"',
  "compact HUD action group"
);

contains(
  html,
  'aria-label="バトル操作と現在の参戦人数"',
  "HUD action group accessibility label"
);

contains(
  html,
  'id="restart" class="restart-button" type="button" aria-label="ステージをリスタート">↻ リスタート</button>',
  "compact restart action"
);

assert(
  html.indexOf('id="restart" class="restart-button"') < html.indexOf('class="audience-line"'),
  "restart action must appear immediately before the live audience display"
);

assert(!html.includes('class="command-row"'), "restart must not consume a row in the ally summon deck");

contains(
  html,
  'class="summon-card"',
  "summon card controls"
);

contains(
  html,
  ".summon-card::before",
  "summon card sprite pseudo element"
);

contains(
  html,
  "background: linear-gradient(180deg, #233348 0%, #182334 48%, #111823 100%)",
  "transparent ally summon card background"
);

contains(
  html,
  "background-image: var(--summon-icon)",
  "summon card sprite style"
);

contains(
  script,
  "function updateSummonButton",
  "summon card sprite and label updater"
);

contains(
  script,
  "button.style.setProperty(\"--summon-icon\", `url(\"${type.sprite}\")`)",
  "summon card should use UNIT_TYPES sprite"
);

contains(
  script,
  'updateSummonButton("ashinaga", ui.spawnAshinaga)',
  "あしながうみネコ summon UI updater"
);

contains(
  script,
  "function updateCooldownBars",
  "cooldown bars without countdown text"
);

contains(
  script,
  '["ashinaga", ui.spawnAshinaga]',
  "あしながうみネコ cooldown bar binding"
);

contains(
  script,
  'ui.spawnAshinaga.addEventListener("click", () => spawnUnit("ashinaga"));',
  "あしながうみネコ summon click binding"
);

assert(
  !script.includes("あと${(") && !script.includes("あと1."),
  "summon cooldown labels must not display waiting seconds"
);

contains(
  script,
  "BOSS撃破!",
  "base-destruction clear text"
);

contains(
  script,
  "stageIntroTimer:",
  "stage intro timer"
);

contains(
  script,
  "effects:",
  "effect state"
);

contains(
  script,
  "function addEffect",
  "effect creation"
);

contains(
  script,
  "function updateEffects",
  "effect lifecycle"
);

contains(
  script,
  "function drawEffects",
  "effect drawing"
);

contains(
  script,
  'addEffect("clearBurst"',
  "clear burst effect"
);

contains(
  script,
  '{ kind: "pyoko", weight: 70 }',
  "ぴょこネコ spawn weight"
);

contains(
  script,
  '{ kind: "nyoro", weight: 20 }',
  "にょろゴースト spawn weight"
);

contains(
  script,
  '{ kind: "trio", weight: 10 }',
  "わちゃわちゃトリオ spawn weight"
);

contains(
  script,
  "function prepareSprite",
  "runtime sprite background cleanup"
);

new Function(script);

console.log("game contract verification passed");
