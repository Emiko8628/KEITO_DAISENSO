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

function numberConstant(name) {
  const match = script.match(new RegExp(`const ${name} = ([^;]+);`));
  assert(match, `missing constant ${name}`);
  const value = Function("WIDTH", `return (${match[1]});`)(960);
  assert.strictEqual(typeof value, "number", `${name} must resolve to a number`);
  return value;
}

function stateNumber(name) {
  const match = script.match(new RegExp(`${name}: ([0-9.]+),`));
  assert(match, `missing state value ${name}`);
  return Number(match[1]);
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
  stateNumber("enemyBaseHp"),
  70,
  "first course enemy base HP should be low enough for a quick first win"
);

assert.strictEqual(
  stateNumber("money"),
  180,
  "first course should start with enough money to summon quickly"
);

contains(
  script,
  'state.enemySpawnTimer = Math.max(3800, 5200 - state.elapsed * 0.01);',
  "first course enemy pacing"
);

contains(
  script,
  'state.units.push(createFighter(kind, type, ALLY_BASE_X - 58, "ally"));',
  "ally spawn side"
);

contains(
  script,
  'state.enemies.push(createFighter("enemy", type, ENEMY_BASE_X + 24, "enemy"));',
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

contains(
  script,
  "const ENEMY_SPAWN_TABLE = [",
  "weighted enemy spawn table"
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
