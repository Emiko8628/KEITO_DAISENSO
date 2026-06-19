const fs = require("fs");
const assert = require("assert");
const vm = require("vm");

const html = fs.readFileSync("game.html", "utf8");
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);

assert(scriptMatch, "game.html must include an inline script block");

function createElement(id) {
  const element = {
    id,
    disabled: false,
    listeners: {},
    style: {
      values: {},
      setProperty(name, value) {
        this.values[name] = String(value);
      }
    },
    addEventListener(type, callback) {
      this.listeners[type] = callback;
    },
    click() {
      if (this.listeners.click) this.listeners.click();
    }
  };
  let textContent = "";
  let innerHTML = "";
  Object.defineProperty(element, "textContent", {
    get() {
      return textContent;
    },
    set(value) {
      textContent = String(value);
    }
  });
  Object.defineProperty(element, "innerHTML", {
    get() {
      return innerHTML;
    },
    set(value) {
      innerHTML = String(value);
    }
  });
  return element;
}

function createCanvasContext() {
  const gradient = { addColorStop() {} };
  return {
    beginPath() {},
    arc() {},
    clearRect() {},
    createLinearGradient() { return gradient; },
    drawImage() {},
    fill() {},
    fillRect() {},
    fillText() {},
    lineTo() {},
    moveTo() {},
    restore() {},
    rotate() {},
    roundRect() {},
    save() {},
    stroke() {},
    translate() {}
  };
}

const elements = new Map();
const ids = [
  "game",
  "stageChapter",
  "stageName",
  "money",
  "allyBase",
  "enemyBase",
  "defeats",
  "experience",
  "message",
  "spawnNeko",
  "spawnTank",
  "spawnBattle",
  "restart"
];

for (const id of ids) {
  elements.set(id, createElement(id));
}

elements.get("game").width = 960;
elements.get("game").height = 480;
elements.get("game").getContext = () => createCanvasContext();

const sandbox = {
  console,
  crypto: {
    randomUUID: () => "runtime-id"
  },
  document: {
    getElementById(id) {
      const element = elements.get(id);
      assert(element, `unexpected document id: ${id}`);
      return element;
    },
    createElement(tagName) {
      if (tagName !== "canvas") return createElement(tagName);
      return {
        width: 0,
        height: 0,
        getContext: () => createCanvasContext()
      };
    }
  },
  Math,
  performance: {
    now: () => 1000
  },
  requestAnimationFrame() {}
};

const scriptWithProbe = scriptMatch[1].replace(
  "  loadCharacterSprites();\n  resetGame();\n  requestAnimationFrame(loop);",
  [
    "  loadCharacterSprites();",
    "  resetGame();",
    "  globalThis.__keitoRuntimeProbe = {",
    "    addExperience,",
    "    checkResult,",
    "    getState: () => state",
    "  };",
    "  requestAnimationFrame(loop);"
  ].join("\n")
);

vm.runInNewContext(scriptWithProbe, sandbox, { filename: "game.html" });

assert.strictEqual(elements.get("stageChapter").textContent, "大地編");
assert.strictEqual(elements.get("stageName").textContent, "大地をゆるがずワンワンステージ");
assert.strictEqual(elements.get("money").textContent, "180");
assert.strictEqual(elements.get("experience").textContent, "0 / 100");
assert.strictEqual(elements.get("spawnNeko").disabled, false);

elements.get("spawnNeko").click();
assert.strictEqual(elements.get("money").textContent, "130", "summoning まるねこ should spend 50");
assert.strictEqual(elements.get("spawnNeko").textContent, "まるねこ 50", "cooldown should not add waiting seconds to the label");
assert.ok(
  !/あと|秒/.test(elements.get("spawnNeko").textContent),
  "summon button should not show waiting seconds"
);
assert.strictEqual(elements.get("spawnNeko").disabled, true, "cooling down unit should be disabled");
assert.notStrictEqual(
  elements.get("spawnNeko").style.values["--cooldown-fill"],
  "100%",
  "cooling down unit should use a visual progress bar"
);

elements.get("spawnNeko").click();
assert.strictEqual(elements.get("money").textContent, "130", "cooldown should block repeated spending");

elements.get("restart").click();
assert.strictEqual(elements.get("money").textContent, "180", "restart should reset money");
assert.strictEqual(elements.get("experience").textContent, "0 / 100", "restart should reset experience");
assert.strictEqual(elements.get("spawnNeko").textContent, "まるねこ 50", "restart should reset summon label");
assert.strictEqual(elements.get("spawnNeko").disabled, false, "restart should reset cooldown");

sandbox.__keitoRuntimeProbe.addExperience(100, 480, 120);
sandbox.__keitoRuntimeProbe.checkResult();
assert.strictEqual(sandbox.__keitoRuntimeProbe.getState().result, "win", "experience target should clear the stage");
assert.match(
  sandbox.__keitoRuntimeProbe.getState().message,
  /経験値MAX! 大地をゆるがずワンワンステージ クリア/,
  "clear message should mention experience and stage name"
);

console.log("game runtime verification passed");
