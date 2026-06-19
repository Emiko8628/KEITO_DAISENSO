const fs = require("fs");
const assert = require("assert");

const html = fs.readFileSync("game.html", "utf8");
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

const allyBaseX = numberConstant("ALLY_BASE_X");
const enemyBaseX = numberConstant("ENEMY_BASE_X");

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
  'chapter: "大地編"',
  "first chapter name"
);

contains(
  script,
  'name: "大地をゆるがすワンワンステージ"',
  "first stage name"
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
  "state.experience >= state.targetExperience",
  "experience-based clear condition"
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
  "経験値MAX!",
  "experience clear text"
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
