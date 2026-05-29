const STORAGE_KEY = "golf-agent-round-v1";

const COURSES = [
  {
    id: "taiwan-golf",
    name: "台灣高爾夫俱樂部",
    type: "standard18",
    zones: [
      { id: "front", name: "前九", holes: buildHoles([4, 5, 3, 4, 4, 3, 5, 4, 4], [392, 505, 176, 410, 365, 158, 520, 388, 402]) },
      { id: "back", name: "後九", holes: buildHoles([4, 4, 3, 5, 4, 4, 5, 3, 4], [380, 421, 164, 532, 390, 405, 548, 182, 430]) }
    ]
  },
  {
    id: "sunrise-36",
    name: "揚昇高爾夫鄉村俱樂部",
    type: "multi",
    zones: [
      { id: "east", name: "東區", holes: buildHoles([4, 5, 4, 3, 4, 5, 3, 4, 4], [401, 540, 386, 172, 418, 558, 155, 399, 430]) },
      { id: "west", name: "西區", holes: buildHoles([5, 4, 3, 4, 4, 5, 4, 3, 4], [526, 382, 168, 412, 395, 545, 420, 180, 405]) },
      { id: "south", name: "南區", holes: buildHoles([4, 4, 5, 3, 4, 4, 3, 5, 4], [398, 410, 552, 160, 435, 374, 188, 530, 415]) },
      { id: "north", name: "北區", holes: buildHoles([4, 3, 5, 4, 4, 5, 3, 4, 4], [390, 175, 560, 408, 377, 522, 170, 442, 400]) }
    ]
  },
  {
    id: "miramar-27",
    name: "美麗華高爾夫鄉村俱樂部",
    type: "multi",
    zones: [
      { id: "a", name: "A 區", holes: buildHoles([4, 4, 5, 3, 4, 5, 4, 3, 4], [420, 395, 548, 170, 410, 535, 400, 155, 435]) },
      { id: "b", name: "B 區", holes: buildHoles([5, 4, 3, 4, 4, 4, 5, 3, 4], [545, 392, 185, 405, 422, 370, 560, 178, 415]) },
      { id: "c", name: "C 區", holes: buildHoles([4, 5, 4, 3, 4, 4, 5, 3, 4], [388, 555, 430, 162, 408, 390, 525, 172, 445]) }
    ]
  },
  {
    id: "gold-coast",
    name: "黃金海岸高爾夫球場",
    type: "standard18",
    zones: [
      { id: "front", name: "前九", holes: buildHoles([4, 5, 4, 3, 4, 4, 5, 3, 4], [420, 565, 395, 185, 410, 430, 560, 178, 450]) },
      { id: "back", name: "後九", holes: buildHoles([4, 4, 3, 5, 4, 4, 3, 5, 4], [405, 420, 190, 545, 410, 395, 175, 540, 339]) }
    ]
  },
  {
    id: "lungtan",
    name: "龍潭高爾夫俱樂部",
    type: "standard18",
    zones: [
      { id: "front", name: "前九", holes: buildHoles([4, 4, 3, 5, 4, 4, 3, 5, 4], [363, 410, 208, 518, 410, 346, 177, 539, 449]) },
      { id: "back", name: "後九", holes: buildHoles([4, 4, 3, 4, 5, 4, 3, 4, 5], [404, 424, 205, 413, 563, 420, 195, 466, 539]) }
    ]
  }
];

const DEFAULT_STATE = {
  courseId: "taiwan-golf",
  frontZoneId: "front",
  backZoneId: "back",
  currentHole: 0,
  players: [
    { id: "p1", name: "A", mode: "fixed", handicap: 18 },
    { id: "p2", name: "B", mode: "fixed", handicap: 18 },
    { id: "p3", name: "C", mode: "peoria", handicap: 0 },
    { id: "p4", name: "", mode: "fixed", handicap: 18 }
  ],
  scores: {},
  olympic: {},
  snake: { bank: 0, trigger: 4, big: {}, history: [] },
  skinsMode: "gross"
};

let state = loadState();
state.snake = { bank: 0, trigger: 4, big: {}, history: [], ...(state.snake || {}) };
state.snake.trigger = Math.max(2, Math.min(4, Number(state.snake.trigger) || 4));
state.snake.history = Array.isArray(state.snake.history) ? state.snake.history : [];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function buildHoles(pars, yards) {
  return pars.map((par, index) => ({ no: index + 1, par, yards: yards[index] }));
}

function loadState() {
  try {
    return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function activePlayers() {
  return state.players.filter((player) => player.name.trim());
}

function course() {
  return COURSES.find((item) => item.id === state.courseId) || COURSES[0];
}

function zoneById(id) {
  return course().zones.find((zone) => zone.id === id) || course().zones[0];
}

function roundHoles() {
  return [...zoneById(state.frontZoneId).holes, ...zoneById(state.backZoneId).holes].map((hole, index) => ({
    ...hole,
    roundNo: index + 1,
    zoneName: index < 9 ? zoneById(state.frontZoneId).name : zoneById(state.backZoneId).name
  }));
}

function scoreFor(playerId, holeIndex) {
  return state.scores[playerId]?.[holeIndex] || 0;
}

function setScore(playerId, holeIndex, value) {
  state.scores[playerId] = state.scores[playerId] || {};
  state.scores[playerId][holeIndex] = Math.max(0, value);
  saveAndRender();
}

function grossTotal(playerId, through = 18) {
  return Array.from({ length: through }, (_, index) => scoreFor(playerId, index)).reduce((sum, value) => sum + value, 0);
}

function peoriaHandicap(playerId) {
  const holes = roundHoles();
  const scoredCount = holes.filter((_, index) => scoreFor(playerId, index) > 0).length;
  if (scoredCount < 18) return 0;
  const excluded = [1, 4, 6, 10, 13, 16];
  const counted = holes.reduce((sum, hole, index) => {
    if (excluded.includes(index)) return sum;
    return sum + Math.min(scoreFor(playerId, index), hole.par + 3);
  }, 0);
  const countedPar = holes.reduce((sum, hole, index) => (excluded.includes(index) ? sum : sum + hole.par), 0);
  return Math.max(0, Math.round((counted - countedPar) * 1.5));
}

function playerHandicap(player) {
  return player.mode === "peoria" ? peoriaHandicap(player.id) : Number(player.handicap) || 0;
}

function netTotal(playerId, through = 18) {
  const player = state.players.find((item) => item.id === playerId);
  return grossTotal(playerId, through) - playerHandicap(player);
}

function netHoleScore(player, holeIndex) {
  const gross = scoreFor(player.id, holeIndex);
  if (!gross) return 0;
  const holeShare = Math.floor(playerHandicap(player) / 18);
  const extra = holeIndex < playerHandicap(player) % 18 ? 1 : 0;
  return gross - holeShare - extra;
}

function skinsScores() {
  const players = activePlayers();
  const totals = Object.fromEntries(players.map((player) => [player.id, 0]));
  roundHoles().forEach((_, holeIndex) => {
    const played = players.filter((player) => scoreFor(player.id, holeIndex) > 0);
    if (played.length < 2) return;
    const values = played.map((player) => ({
      player,
      value: state.skinsMode === "net" ? netHoleScore(player, holeIndex) : scoreFor(player.id, holeIndex)
    }));
    const best = Math.min(...values.map((item) => item.value));
    const winners = values.filter((item) => item.value === best);
    if (winners.length !== 1) return;
    const winnerId = winners[0].player.id;
    played.forEach((player) => {
      totals[player.id] += player.id === winnerId ? played.length - 1 : -1;
    });
  });
  return totals;
}

function olympicTotal(playerId) {
  return Object.values(state.olympic[playerId] || {}).reduce((sum, value) => sum + value, 0);
}

function olympicNetScores() {
  const players = activePlayers();
  const raw = Object.fromEntries(players.map((player) => [player.id, olympicTotal(player.id)]));
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(players.map((player) => [player.id, raw[player.id] * players.length - total]));
}

function render() {
  renderTabs();
  renderSetup();
  renderScore();
  renderGames();
  renderSummary();
}

function saveAndRender() {
  saveState();
  render();
}

function renderTabs() {
  $$(".tab").forEach((tab) => {
    const active = tab.dataset.view === document.body.dataset.view;
    tab.classList.toggle("is-active", active);
    $(`#view-${tab.dataset.view}`).classList.toggle("is-active", active);
  });
}

function renderSetup() {
  const players = $("#playerInputs");
  players.innerHTML = "";
  state.players.forEach((player, index) => {
    const label = document.createElement("label");
    label.className = "field";
    label.innerHTML = `<span>球員 ${index + 1}</span><input value="${escapeHtml(player.name)}" placeholder="空白代表不參賽" />`;
    label.querySelector("input").addEventListener("input", (event) => {
      player.name = event.target.value.slice(0, 10);
      $("#playerCountLabel").textContent = `${activePlayers().length} 人`;
      saveState();
    });
    label.querySelector("input").addEventListener("blur", render);
    players.append(label);
  });
  $("#playerCountLabel").textContent = `${activePlayers().length} 人`;

  const select = $("#courseSelect");
  select.innerHTML = COURSES.map((item) => `<option value="${item.id}">${item.name}</option>`).join("");
  select.value = state.courseId;
  select.onchange = (event) => {
    state.courseId = event.target.value;
    const selected = course();
    state.frontZoneId = selected.zones[0].id;
    state.backZoneId = selected.zones[1]?.id || selected.zones[0].id;
    saveAndRender();
  };
  $("#courseMeta").textContent = course().type === "multi" ? `${course().zones.length * 9} 洞多區` : "標準 18 洞";
  renderRoutePicker();
  renderHandicaps();
}

function renderRoutePicker() {
  const wrapper = $("#routePicker");
  const selectedCourse = course();
  wrapper.innerHTML = "";
  [
    ["frontZoneId", selectedCourse.type === "multi" ? "前九洞分區" : "前九"],
    ["backZoneId", selectedCourse.type === "multi" ? "後九洞分區" : "後九"]
  ].forEach(([key, title]) => {
    const card = document.createElement("div");
    card.className = "route-card";
    card.innerHTML = `<strong>${title}</strong>`;
    const segmented = document.createElement("div");
    segmented.className = "segmented";
    selectedCourse.zones.forEach((zone) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = zone.name;
      button.classList.toggle("is-active", state[key] === zone.id);
      button.addEventListener("click", () => {
        state[key] = zone.id;
        saveAndRender();
      });
      segmented.append(button);
    });
    card.append(segmented);
    wrapper.append(card);
  });
}

function renderHandicaps() {
  const wrapper = $("#handicapList");
  wrapper.innerHTML = "";
  activePlayers().forEach((player) => {
    const card = document.createElement("article");
    card.className = "handicap-card";
    card.innerHTML = `
      <div>
        <h3>${escapeHtml(player.name)}</h3>
        <p>${player.mode === "peoria" ? "新新貝利亞，18 洞後計算" : `固定差點 ${player.handicap}`}</p>
      </div>
      <div class="handicap-controls">
        <button class="mode-button" type="button" data-mode="toggle">${player.mode === "peoria" ? "改固定" : "新新"}</button>
        <div class="stepper" aria-label="${escapeHtml(player.name)} 差點">
          <button type="button" data-delta="-1">−</button>
          <output>${player.mode === "peoria" ? playerHandicap(player) : player.handicap}</output>
          <button type="button" data-delta="1">+</button>
        </div>
      </div>
    `;
    card.querySelector("[data-mode]").addEventListener("click", () => {
      player.mode = player.mode === "peoria" ? "fixed" : "peoria";
      saveAndRender();
    });
    card.querySelectorAll("[data-delta]").forEach((button) => button.addEventListener("click", () => {
      player.mode = "fixed";
      player.handicap = Math.max(0, Math.min(36, (Number(player.handicap) || 0) + Number(button.dataset.delta)));
      saveAndRender();
    }));
    wrapper.append(card);
  });
}

function renderScore() {
  const holes = roundHoles();
  const hole = holes[state.currentHole] || holes[0];
  $("#holeTitle").textContent = `第 ${state.currentHole + 1} 洞`;
  $("#holeInfo").textContent = `${hole.zoneName} · Par ${hole.par} · ${hole.yards}Y`;
  $("#prevHole").disabled = state.currentHole === 0;
  $("#nextHole").disabled = state.currentHole === 17;

  const counters = $("#scoreCounters");
  counters.innerHTML = "";
  activePlayers().forEach((player) => {
    counters.append(counterCard(player.name, `總桿 ${grossTotal(player.id)} · 淨桿 ${netTotal(player.id)}`, scoreFor(player.id, state.currentHole), (next) => {
      setScore(player.id, state.currentHole, next);
    }));
  });

  renderScoreTable();
}

function renderScoreTable() {
  const players = activePlayers();
  const table = $("#scoreTable");
  const holes = roundHoles();
  table.innerHTML = `
    <thead>
      <tr><th>球員</th>${holes.map((hole, index) => `<th>${index + 1}<br><small>P${hole.par}</small></th>`).join("")}<th>總</th><th>淨</th></tr>
    </thead>
    <tbody>
      ${players
        .map(
          (player) => `<tr>
            <td>${escapeHtml(player.name)}</td>
            ${holes.map((_, index) => `<td>${scoreFor(player.id, index) || "-"}</td>`).join("")}
            <td><strong>${grossTotal(player.id) || "-"}</strong></td>
            <td><strong>${grossTotal(player.id) ? netTotal(player.id) : "-"}</strong></td>
          </tr>`
        )
        .join("")}
    </tbody>
  `;
  const ranked = players
    .filter((player) => grossTotal(player.id) > 0)
    .sort((a, b) => grossTotal(a.id) - grossTotal(b.id));
  $("#grossLeader").textContent = ranked[0] ? `暫時領先：${ranked[0].name}` : "";
}

function renderGames() {
  $("#skinsMode").value = state.skinsMode;
  const skins = skinsScores();
  const board = $("#skinsBoard");
  board.innerHTML = "";
  activePlayers().forEach((player) => {
    const value = skins[player.id] || 0;
    const row = document.createElement("div");
    row.className = "leader-row";
    row.innerHTML = `<strong>${escapeHtml(player.name)}</strong><output class="${value > 0 ? "positive" : value < 0 ? "negative" : ""}">${formatSigned(value)}</output>`;
    board.append(row);
  });
  const skinsSum = Object.values(skins).reduce((sum, value) => sum + value, 0);
  $("#skinsZero").textContent = `目前已結算總和：${skinsSum}`;

  $("#snakeTrigger").value = String(state.snake.trigger);
  $("#undoSnake").disabled = state.snake.history.length === 0;
  $("#snakeBank").textContent = `目前全隊累積小蛇：${state.snake.bank} 條`;
  $("#snakeMeter").style.gridTemplateColumns = `repeat(${state.snake.trigger}, 1fr)`;
  $("#snakeMeter").innerHTML = Array.from({ length: state.snake.trigger }, (_, index) => `<span class="snake-dot ${index < state.snake.bank ? "is-filled" : ""}"></span>`).join("");
  const snakeActions = $("#snakeActions");
  snakeActions.innerHTML = "";
  activePlayers().forEach((player) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "snake-button";
    button.innerHTML = `${escapeHtml(player.name)}<small>記一隻小蛇 · 大蛇 ${state.snake.big[player.id] || 0}</small>`;
    button.addEventListener("click", () => addSnake(player.id));
    snakeActions.append(button);
  });

  const olympic = $("#olympicList");
  olympic.innerHTML = "";
  activePlayers().forEach((player) => {
    const card = document.createElement("article");
    card.className = "counter-card";
    const holeValue = state.olympic[player.id]?.[state.currentHole] || 0;
    card.innerHTML = `
      <div><h3>${escapeHtml(player.name)}</h3><p>本洞 ${formatSigned(holeValue)} · 累計 ${formatSigned(olympicTotal(player.id))}</p></div>
      <div class="olympic-buttons">
        ${[-2, -1, 1, 2, 4].map((delta) => `<button type="button" data-delta="${delta}">${formatSigned(delta)}</button>`).join("")}
      </div>
    `;
    card.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => addOlympic(player.id, Number(button.dataset.delta)));
    });
    olympic.append(card);
  });
}

function renderSummary() {
  $("#summaryCourse").textContent = `${course().name} · ${zoneById(state.frontZoneId).name} + ${zoneById(state.backZoneId).name}`;
  const summary = $("#summaryList");
  summary.innerHTML = "";
  activePlayers()
    .map((player) => ({ player, gross: grossTotal(player.id), net: netTotal(player.id), handicap: playerHandicap(player) }))
    .sort((a, b) => a.net - b.net)
    .forEach((item) => {
      const card = document.createElement("article");
      card.className = "summary-card";
      card.innerHTML = `<div><h3>${escapeHtml(item.player.name)}</h3><p>總桿 ${item.gross || "-"} · 差點 ${item.handicap}</p></div><strong>${item.gross ? item.net : "-"}</strong>`;
      summary.append(card);
    });

  const skins = skinsScores();
  const olympic = olympicNetScores();
  const grid = $("#settlementGrid");
  grid.innerHTML = "";
  activePlayers().forEach((player) => {
    const snakeLoss = state.snake.big[player.id] || 0;
    const card = document.createElement("article");
    card.className = "settlement-card";
    card.innerHTML = `
      <div>
        <h3>${escapeHtml(player.name)}</h3>
        <p>逐洞 ${formatSigned(skins[player.id] || 0)} · 奧林匹克 ${formatSigned(olympic[player.id] || 0)} · 大蛇 ${snakeLoss}</p>
      </div>
      <strong class="${(skins[player.id] || 0) + (olympic[player.id] || 0) - snakeLoss > 0 ? "positive" : "negative"}">${formatSigned((skins[player.id] || 0) + (olympic[player.id] || 0) - snakeLoss)}</strong>
    `;
    grid.append(card);
  });
}

function counterCard(name, detail, value, onChange) {
  const node = $("#counterTemplate").content.firstElementChild.cloneNode(true);
  node.querySelector("h3").textContent = name;
  node.querySelector("p").textContent = detail;
  node.querySelector("output").textContent = value || 0;
  node.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => onChange((value || 0) + Number(button.dataset.delta)));
  });
  return node;
}

function addSnake(playerId) {
  state.snake.history.push({
    playerId,
    previousBank: state.snake.bank,
    previousBig: state.snake.big[playerId] || 0
  });
  state.snake.history = state.snake.history.slice(-20);
  const next = state.snake.bank + 1;
  if (next >= state.snake.trigger) {
    state.snake.big[playerId] = (state.snake.big[playerId] || 0) + 1;
    state.snake.bank = 0;
  } else {
    state.snake.bank = next;
  }
  saveAndRender();
}

function undoSnake() {
  const last = state.snake.history.pop();
  if (!last) return;
  state.snake.bank = last.previousBank;
  state.snake.big[last.playerId] = last.previousBig;
  saveAndRender();
}

function addOlympic(playerId, delta) {
  state.olympic[playerId] = state.olympic[playerId] || {};
  state.olympic[playerId][state.currentHole] = (state.olympic[playerId][state.currentHole] || 0) + delta;
  saveAndRender();
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function bindEvents() {
  document.body.dataset.view = "setup";
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.body.dataset.view = tab.dataset.view;
      render();
    });
  });
  $("#prevHole").addEventListener("click", () => {
    state.currentHole = Math.max(0, state.currentHole - 1);
    saveAndRender();
  });
  $("#nextHole").addEventListener("click", () => {
    state.currentHole = Math.min(17, state.currentHole + 1);
    saveAndRender();
  });
  $("#parFill").addEventListener("click", () => {
    const par = roundHoles()[state.currentHole].par;
    activePlayers().forEach((player) => setScore(player.id, state.currentHole, scoreFor(player.id, state.currentHole) || par));
  });
  $("#skinsMode").addEventListener("change", (event) => {
    state.skinsMode = event.target.value;
    saveAndRender();
  });
  $("#snakeTrigger").addEventListener("change", (event) => {
    state.snake.trigger = Number(event.target.value);
    state.snake.bank = Math.min(state.snake.bank, state.snake.trigger - 1);
    state.snake.history = [];
    saveAndRender();
  });
  $("#undoSnake").addEventListener("click", undoSnake);
  $("#resetRound").addEventListener("click", () => {
    if (confirm("確定清除本場資料？")) {
      state = structuredClone(DEFAULT_STATE);
      saveAndRender();
    }
  });
  $("#exportJson").addEventListener("click", () => {
    const existing = $(".json-drawer");
    if (existing) {
      existing.remove();
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.className = "json-drawer";
    textarea.readOnly = true;
    textarea.value = JSON.stringify({ exportedAt: new Date().toISOString(), state }, null, 2);
    $("#view-summary").append(textarea);
    textarea.select();
  });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

bindEvents();
render();
