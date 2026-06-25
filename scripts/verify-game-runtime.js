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
    dataset: {},
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
    ellipse() {},
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
  "viewerCount",
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
const trackedEvents = [];
const loadedScripts = [];
const audienceRequests = [];

function createAudienceFetch(requests, counts = [2]) {
  return async (url, options = {}) => {
    requests.push({
      url,
      method: options.method,
      headers: options.headers,
      body: options.body,
      cache: options.cache
    });
    const count = counts.length ? counts.shift() : 2;
    return new Response(JSON.stringify({ count, ttlSeconds: 60 }), {
      status: 200,
      headers: {
        "content-type": "application/json"
      }
    });
  };
}

function createRuntimeElements() {
  const runtimeElements = new Map();
  for (const id of ids) {
    runtimeElements.set(id, createElement(id));
  }
  runtimeElements.get("game").width = 960;
  runtimeElements.get("game").height = 480;
  runtimeElements.get("game").getContext = () => createCanvasContext();
  return runtimeElements;
}

function createRuntime(scriptSource, options = {}) {
  const runtimeElements = createRuntimeElements();
  const trackedEvents = [];
  const loadedScripts = [];
  const audienceRequests = [];
  const runtimeIntervals = [];
  const runtimeSandbox = {
    console,
    crypto: {
      randomUUID: () => "runtime-id"
    },
    document: {
      getElementById(id) {
        const element = runtimeElements.get(id);
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
      },
      head: {
        appendChild(element) {
          loadedScripts.push(element);
          return element;
        }
      }
    },
    Math,
    performance: {
      now: () => 1000
    },
    fetch: options.fetch || createAudienceFetch(audienceRequests),
    requestAnimationFrame() {},
    setInterval(callback) {
      runtimeIntervals.push(callback);
      return runtimeIntervals.length;
    },
    clearInterval() {},
    trackedEvents,
    loadedScripts,
    audienceRequests
  };

  runtimeSandbox.window = options.window || {
    dataLayer: trackedEvents,
    gtag(...args) {
      trackedEvents.push(args);
    }
  };

  vm.runInNewContext(scriptSource, runtimeSandbox, { filename: "game.html" });

  return {
    elements: runtimeElements,
    sandbox: runtimeSandbox,
    loadedScripts,
    trackedEvents,
    audienceRequests
  };
}

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
    },
    head: {
      appendChild(element) {
        loadedScripts.push(element);
        return element;
      }
    }
  },
  Math,
  performance: {
    now: () => 1000
  },
  fetch: createAudienceFetch(audienceRequests),
  requestAnimationFrame() {},
  setInterval() {
    return 1;
  },
  clearInterval() {},
  trackedEvents,
  loadedScripts,
  audienceRequests
};

sandbox.window = {
  dataLayer: trackedEvents,
  gtag(...args) {
    trackedEvents.push(args);
  }
};

const scriptWithProbe = scriptMatch[1].replace(
  "  loadCharacterSprites();\n  loadStageBackgrounds();\n  loadBaseImages();\n  initializeAnalyticsProvider();\n  resetGame();\n  initializeLiveAudience();\n  requestAnimationFrame(loop);",
  [
    "  loadCharacterSprites();",
    "  loadStageBackgrounds();",
    "  loadBaseImages();",
    "  initializeAnalyticsProvider();",
    "  resetGame();",
    "  initializeLiveAudience();",
    "  globalThis.__keitoRuntimeProbe = {",
    "    addExperience,",
    "    checkResult,",
    "    getAnalyticsConfig: () => ANALYTICS_CONFIG,",
    "    getLiveAudienceConfig: () => LIVE_AUDIENCE_CONFIG,",
    "    getAudienceRequests: () => audienceRequests,",
    "    getLoadedScripts: () => loadedScripts,",
    "    getState: () => state,",
    "    getTrackedEvents: () => trackedEvents,",
    "    trackLiveAudienceHeartbeat,",
    "    trackGameEvent",
    "  };",
    "  requestAnimationFrame(loop);"
  ].join("\n")
);

assert(
  scriptMatch[1].includes("function drawBaseImage") &&
    scriptMatch[1].includes("if (drawBaseImage(x, team)) return;") &&
    scriptMatch[1].includes("function drawCanvasBaseStructure") &&
    scriptMatch[1].includes("const BASE_IMAGE_GROUND_Y = GROUND_Y + 34"),
  "base rendering should prefer image assets while keeping a canvas fallback"
);

async function main() {
vm.runInNewContext(scriptWithProbe, sandbox, { filename: "game.html" });
await sandbox.__keitoRuntimeProbe.trackLiveAudienceHeartbeat();

assert.strictEqual(elements.get("stageChapter").textContent, "大地編");
assert.strictEqual(elements.get("stageName").textContent, "大地をゆるがすワンワンステージ");
assert.strictEqual(elements.get("money").textContent, "180");
assert.strictEqual(elements.get("viewerCount").textContent, "2");
assert.strictEqual(
  sandbox.__keitoRuntimeProbe.getAudienceRequests().at(-1).url,
  "https://keito-daisenso-live-audience.futunex1115.workers.dev/heartbeat",
  "live audience heartbeat should use the configured Worker endpoint"
);
assert.deepStrictEqual(
  JSON.parse(sandbox.__keitoRuntimeProbe.getAudienceRequests().at(-1).body),
  { sessionId: "runtime-id" },
  "live audience heartbeat should send only the page-scoped session id"
);
assert.strictEqual(elements.get("experience").textContent, "0 / 100");
assert.strictEqual(elements.get("spawnNeko").disabled, false);
assert.match(
  elements.get("message").innerHTML,
  /左の敵拠点/,
  "opening message should teach enemy-base destruction as the goal"
);

elements.get("spawnNeko").click();
assert.strictEqual(elements.get("money").textContent, "130", "summoning まるねこ should spend 50");
assert.strictEqual(elements.get("viewerCount").textContent, "2", "summoning should not fake audience changes locally");
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
assert.strictEqual(elements.get("viewerCount").textContent, "2", "restart should keep the latest live audience count");
assert.strictEqual(elements.get("experience").textContent, "0 / 100", "restart should reset experience");
assert.strictEqual(elements.get("spawnNeko").textContent, "まるねこ 50", "restart should reset summon label");
assert.strictEqual(elements.get("spawnNeko").disabled, false, "restart should reset cooldown");
assert.strictEqual(sandbox.__keitoRuntimeProbe.getState().experienceNoticeShown, false, "restart should reset experience notice state");
assert.deepStrictEqual(
  sandbox.__keitoRuntimeProbe
    .getTrackedEvents()
    .filter((event) => event[0] === "event")
    .map((event) => event[1]),
  ["game_open", "first_summon"],
  "enabled analytics should keep one game_open and one first_summon after restart"
);

sandbox.__keitoRuntimeProbe.addExperience(100, 480, 120);
sandbox.__keitoRuntimeProbe.checkResult();
assert.strictEqual(sandbox.__keitoRuntimeProbe.getState().result, "playing", "experience target should not clear the stage");
assert.strictEqual(sandbox.__keitoRuntimeProbe.getState().gameOver, false, "experience target should not stop the battle");
assert.strictEqual(sandbox.__keitoRuntimeProbe.getState().experienceNoticeShown, true, "experience target should show a one-time notice");
assert.match(
  sandbox.__keitoRuntimeProbe.getState().message,
  /経験値がたまったよ！/,
  "experience target should update the message without clearing"
);
const noticeCount = sandbox.__keitoRuntimeProbe
  .getState()
  .floatingTexts
  .filter((text) => text.text === "経験値がたまったよ！").length;
sandbox.__keitoRuntimeProbe.addExperience(100, 480, 120);
assert.strictEqual(
  sandbox.__keitoRuntimeProbe
    .getState()
    .floatingTexts
    .filter((text) => text.text === "経験値がたまったよ！").length,
  noticeCount,
  "experience notice should not repeat after the target is already reached"
);

sandbox.__keitoRuntimeProbe.getState().enemyBaseHp = 0;
sandbox.__keitoRuntimeProbe.checkResult();
assert.strictEqual(sandbox.__keitoRuntimeProbe.getState().result, "win", "destroying the enemy base should clear the stage");
assert.match(
  sandbox.__keitoRuntimeProbe.getState().message,
  /BOSS撃破! 大地をゆるがすワンワンステージ クリア/,
  "clear message should mention base destruction and stage name"
);

elements.get("restart").click();
sandbox.__keitoRuntimeProbe.getState().allyBaseHp = 0;
sandbox.__keitoRuntimeProbe.checkResult();
assert.strictEqual(sandbox.__keitoRuntimeProbe.getState().result, "lose", "destroying the ally base should lose the stage");
assert.match(
  sandbox.__keitoRuntimeProbe.getState().message,
  /作戦を立て直そう/,
  "lose message should remain available"
);

const {
  elements: enabledElements,
  sandbox: enabledSandbox
} = createRuntime(scriptWithProbe);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(enabledSandbox.__keitoRuntimeProbe.getAnalyticsConfig())),
  {
    enabled: true,
    provider: "google_analytics",
    measurementId: "G-930NR1L6KX",
    scriptSrc: "https://www.googletagmanager.com/gtag/js?id=G-930NR1L6KX"
  },
  "analytics config should use the confirmed Google Analytics provider values"
);

assert.strictEqual(
  enabledSandbox.__keitoRuntimeProbe.getLoadedScripts().length,
  1,
  "analytics loader should append exactly one provider script"
);
assert.strictEqual(
  enabledSandbox.__keitoRuntimeProbe.getLoadedScripts()[0].dataset.domain,
  undefined,
  "Google tag loader should not use a legacy data-domain"
);
assert.strictEqual(
  enabledSandbox.__keitoRuntimeProbe.getLoadedScripts()[0].src,
  "https://www.googletagmanager.com/gtag/js?id=G-930NR1L6KX",
  "analytics loader should use the confirmed script URL"
);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(
    enabledSandbox.__keitoRuntimeProbe
      .getTrackedEvents()
      .filter((event) => event[0] === "config")
  )),
  [["config", "G-930NR1L6KX", { send_page_view: false }]],
  "Google Analytics should be configured with the confirmed measurement ID"
);

assert.deepStrictEqual(
  enabledSandbox.__keitoRuntimeProbe
    .getTrackedEvents()
    .filter((event) => event[0] === "event")
    .map((event) => event[1]),
  ["game_open"],
  "enabled analytics should send one game_open after page start"
);

enabledElements.get("restart").click();
assert.deepStrictEqual(
  enabledSandbox.__keitoRuntimeProbe
    .getTrackedEvents()
    .filter((event) => event[0] === "event")
    .map((event) => event[1]),
  ["game_open"],
  "restart should not duplicate game_open"
);

enabledElements.get("spawnNeko").click();
enabledElements.get("restart").click();
enabledElements.get("spawnNeko").click();
assert.strictEqual(
  enabledSandbox.__keitoRuntimeProbe
    .getTrackedEvents()
    .filter((event) => event[0] === "event" && event[1] === "first_summon").length,
  1,
  "first_summon should be sent once per page session"
);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(
    enabledSandbox.__keitoRuntimeProbe
      .getTrackedEvents()
      .find((event) => event[0] === "event" && event[1] === "first_summon")[2]
  )),
  {
    stageId: "earth-wanwan-01",
    chapter: "大地編",
    stageName: "大地をゆるがすワンワンステージ",
    unitKind: "neko",
    unitLabel: "まるねこ"
  },
  "first_summon should send only allowlisted stage and unit props"
);

enabledSandbox.__keitoRuntimeProbe.getState().enemyBaseHp = 0;
enabledSandbox.__keitoRuntimeProbe.checkResult();
enabledSandbox.__keitoRuntimeProbe.checkResult();
assert.strictEqual(
  enabledSandbox.__keitoRuntimeProbe
    .getTrackedEvents()
    .filter((event) => event[0] === "event" && event[1] === "stage_clear").length,
  1,
  "stage_clear should be sent once per page session"
);

const {
  sandbox: propsSandbox
} = createRuntime(scriptWithProbe);
const beforeUnknownEventCount = propsSandbox.__keitoRuntimeProbe.getTrackedEvents().length;
propsSandbox.__keitoRuntimeProbe.trackGameEvent("unknown_event", {
  stageId: "earth-wanwan-01"
});
assert.strictEqual(
  propsSandbox.__keitoRuntimeProbe.getTrackedEvents().length,
  beforeUnknownEventCount,
  "unknown analytics events should be ignored"
);

propsSandbox.__keitoRuntimeProbe.trackGameEvent("first_summon", {
  stageId: "earth-wanwan-01",
  chapter: "大地編",
  stageName: "大地をゆるがすワンワンステージ",
  unitKind: "neko",
  unitLabel: "まるねこ",
  money: "999",
  hp: "10",
  x: "100",
  freeText: "should not leave the page"
});
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(propsSandbox.__keitoRuntimeProbe.getTrackedEvents().at(-1)[2])),
  {
    stageId: "earth-wanwan-01",
    chapter: "大地編",
    stageName: "大地をゆるがすワンワンステージ",
    unitKind: "neko",
    unitLabel: "まるねこ"
  },
  "analytics should drop non-allowlisted props"
);

const disabledScript = scriptWithProbe.replace(
  "enabled: true,\n    provider: \"google_analytics\",",
  "enabled: false,\n    provider: \"noop\","
);
const {
  sandbox: disabledSandbox
} = createRuntime(disabledScript);
assert.deepStrictEqual(
  disabledSandbox.__keitoRuntimeProbe.getTrackedEvents(),
  [],
  "disabled fallback should not send events when explicitly configured off"
);

const { elements: blockedElements, sandbox: blockedSandbox } = createRuntime(scriptWithProbe, {
  window: {
    dataLayer: [],
    gtag() {
      throw new Error("analytics blocked");
    }
  },
  fetch: async () => {
    throw new Error("live audience blocked");
  }
});

await blockedSandbox.__keitoRuntimeProbe.trackLiveAudienceHeartbeat();
assert.strictEqual(blockedElements.get("viewerCount").textContent, "--");
blockedElements.get("spawnNeko").click();
assert.strictEqual(blockedElements.get("money").textContent, "130");
assert.match(blockedElements.get("message").innerHTML, /まるねこを召喚した/);

console.log("game runtime verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
