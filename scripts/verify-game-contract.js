const fs = require("fs");
const assert = require("assert");

const html = fs.readFileSync("game.html", "utf8");
const readme = fs.readFileSync("README.md", "utf8");
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);

assert(scriptMatch, "game.html must include an inline script block");

const script = scriptMatch[1];
const requiredEnemySprites = [
  { name: "ぴょこネコ", file: "assets/enemy-pyoko-neko.png" },
  { name: "にょろゴースト", file: "assets/enemy-nyoro-ghost.png" },
  { name: "わちゃわちゃトリオ", file: "assets/enemy-wachawacha-trio.png" }
];
const requiredAllySprites = [
  { name: "まるねこ", file: "assets/ally-neko.png", buttonId: "spawnNeko", buttonText: "まるねこ 50" },
  { name: "かたいねこ", file: "assets/ally-tank-neko.png", buttonId: "spawnTank", buttonText: "かたいねこ 80" },
  { name: "こうげきねこ", file: "assets/ally-battle-neko.png", buttonId: "spawnBattle", buttonText: "こうげきねこ 110" }
];
const requiredStageBackground = "assets/stage-earth-wanwan-background.png";

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
const checkResultSection = functionSection("checkResult", "updateUI");

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

assert(
  fs.existsSync(requiredStageBackground),
  `missing first stage background asset: ${requiredStageBackground}`
);

contains(
  script,
  `background: "${requiredStageBackground}"`,
  "first stage background image"
);

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
  contains(script, `sprite: "${sprite.file}"`, `${sprite.name} enemy sprite`);
}

for (const sprite of requiredAllySprites) {
  assert(
    fs.existsSync(sprite.file),
    `missing ally sprite asset: ${sprite.file}`
  );
  contains(script, `label: "${sprite.name}"`, `${sprite.name} ally label`);
  contains(script, `sprite: "${sprite.file}"`, `${sprite.name} ally sprite`);
  contains(html, `id="${sprite.buttonId}"`, `${sprite.name} summon button id`);
  contains(html, `>${sprite.buttonText}</button>`, `${sprite.name} summon button text`);
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
  html,
  "Google Analyticsで利用状況を計測しています。ゲーム内の入力内容や個人情報は保存しません。",
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
  !script.includes("localStorage") && !script.includes("sessionStorage"),
  "analytics must not add browser storage identifiers"
);

const allowedExternalUrls = [
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

contains(
  html,
  'class="summon-deck"',
  "summon card deck"
);

contains(
  html,
  'class="summon-card"',
  "summon card controls"
);

contains(
  script,
  "function updateCooldownBars",
  "cooldown bars without countdown text"
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
