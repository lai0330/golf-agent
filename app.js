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
  match: { name: "", date: "", time: "" },
  courseId: "taiwan-golf",
  frontZoneId: "front",
  backZoneId: "back",
  currentHole: 0,
  players: [
    { id: "p1", name: "A", mode: "fixed", handicap: 0 },
    { id: "p2", name: "B", mode: "fixed", handicap: 0 },
    { id: "p3", name: "C", mode: "fixed", handicap: 0 },
    { id: "p4", name: "D", mode: "fixed", handicap: 0 }
  ],
  money: { skins: 50, stroke: 40, putting: 20, snake: 100, hl: 300, hussein: 50 },
  sideGame: "hl",
  teeOrder: [],
  husseinOwner: "",
  holeHcp: {},
  scores: {},
  olympic: {},
  snake: { bank: 0, trigger: 4, big: {}, history: [] },
  skinsMode: "gross"
};

let state = loadState();
state.match = { ...DEFAULT_STATE.match, ...(state.match || {}) };
state.money = { ...DEFAULT_STATE.money, ...(state.money || {}) };
state.sideGame = state.sideGame || "hl";
state.teeOrder = Array.isArray(state.teeOrder) ? state.teeOrder : [];
state.husseinOwner = state.husseinOwner || "";
state.holeHcp = state.holeHcp || {};
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
    hcp: Number(state.holeHcp[index]) || hole.hcp || index + 1,
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
  return gross - courseStrokeAllowance(player, holeIndex);
}

function courseStrokeAllowance(player, holeIndex) {
  const players = activePlayers();
  const minHandicap = Math.min(...players.map((item) => playerHandicap(item)));
  const allowance = Math.floor(Math.max(0, playerHandicap(player) - minHandicap) / 3);
  if (!allowance) return 0;
  const hcp = roundHoles()[holeIndex]?.hcp || holeIndex + 1;
  return hcp <= allowance ? 1 : 0;
}

function skinsScores() {
  const players = activePlayers();
  const totals = Object.fromEntries(players.map((player) => [player.id, 0]));
  let carry = 0;
  roundHoles().forEach((hole, holeIndex) => {
    const played = players.filter((player) => scoreFor(player.id, holeIndex) > 0);
    if (played.length < 2) return;
    const values = played.map((player) => ({
      player,
      value: netHoleScore(player, holeIndex),
      gross: scoreFor(player.id, holeIndex)
    }));
    const best = Math.min(...values.map((item) => item.value));
    const winners = values.filter((item) => item.value === best);
    if (winners.length !== 1) {
      carry += Number(state.money.skins) || 0;
      return;
    }
    const winner = winners[0];
    if (winner.gross > hole.par + 1) {
      carry += Number(state.money.skins) || 0;
      return;
    }
    const multiplier = winner.gross <= hole.par - 2 ? 5 : winner.gross === hole.par - 1 ? 2 : 1;
    const payout = carry + (Number(state.money.skins) || 0) * multiplier;
    carry = 0;
    const winnerId = winner.player.id;
    played.forEach((player) => {
      totals[player.id] += player.id === winnerId ? payout * (played.length - 1) : -payout;
    });
  });
  return totals;
}

function skinsCarry() {
  const players = activePlayers();
  let carry = 0;
  roundHoles().forEach((hole, holeIndex) => {
    const played = players.filter((player) => scoreFor(player.id, holeIndex) > 0);
    if (played.length < 2) return;
    const values = played.map((player) => ({ player, value: netHoleScore(player, holeIndex), gross: scoreFor(player.id, holeIndex) }));
    const best = Math.min(...values.map((item) => item.value));
    const winners = values.filter((item) => item.value === best);
    if (winners.length !== 1 || winners[0].gross > hole.par + 1) {
      carry += Number(state.money.skins) || 0;
    } else {
      carry = 0;
    }
  });
  return carry;
}

function strokeScores() {
  const players = activePlayers();
  const nets = Object.fromEntries(players.map((player) => [player.id, netTotal(player.id)]));
  const totals = Object.fromEntries(players.map((player) => [player.id, 0]));
  players.forEach((player) => {
    players.forEach((opponent) => {
      if (player.id === opponent.id) return;
      totals[player.id] += (nets[opponent.id] - nets[player.id]) * (Number(state.money.stroke) || 0);
    });
  });
  return totals;
}

function olympicMedalFor(playerId, holeIndex) {
  return state.olympic[playerId]?.[holeIndex] || "";
}

function olympicCounts(playerId) {
  const counts = { diamond: 0, gold: 0, silver: 0, bronze: 0, iron: 0 };
  Object.values(state.olympic[playerId] || {}).forEach((medal) => {
    if (counts[medal] !== undefined) counts[medal] += 1;
  });
  return counts;
}

function olympicNetScores() {
  return Object.fromEntries(activePlayers().map((player) => [player.id, 0]));
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
  $("#matchName").value = state.match.name || "";
  $("#matchDate").value = state.match.date || "";
  $("#matchTime").value = state.match.time || "";
  $("#sideGameSelect").value = state.sideGame;
  $("#snakeTriggerSetup").value = String(state.snake.trigger);

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
    state.holeHcp = {};
    saveAndRender();
  };
  $("#courseMeta").textContent = course().type === "multi" ? `${course().zones.length * 9} 洞多區` : "標準 18 洞";
  renderRoutePicker();
  renderHcpEditor();
  renderHandicaps();
  renderMoneyInputs();
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
        state.holeHcp = {};
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
        <p>逐洞賽以最低差點為基準讓洞</p>
      </div>
      <div class="handicap-controls">
        <div class="stepper" aria-label="${escapeHtml(player.name)} 差點">
          <button type="button" data-delta="-1">−</button>
          <output>${player.handicap}</output>
          <button type="button" data-delta="1">+</button>
        </div>
      </div>
    `;
    card.querySelectorAll("[data-delta]").forEach((button) => button.addEventListener("click", () => {
      player.mode = "fixed";
      player.handicap = Math.max(0, Math.min(36, (Number(player.handicap) || 0) + Number(button.dataset.delta)));
      saveAndRender();
    }));
    wrapper.append(card);
  });
}

function renderHcpEditor() {
  const wrapper = $("#hcpEditor");
  const holes = roundHoles();
  wrapper.innerHTML = holes
    .map((hole, index) => `
      <label>
        <span>${index + 1} 洞</span>
        <input type="number" min="1" max="18" value="${hole.hcp}" data-hole-hcp="${index}" />
      </label>
    `)
    .join("");
  wrapper.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      state.holeHcp[input.dataset.holeHcp] = Math.max(1, Math.min(18, Number(input.value) || Number(input.dataset.holeHcp) + 1));
      saveAndRender();
    });
  });
}

function renderMoneyInputs() {
  const labels = [
    ["skins", "逐洞賽", "元/洞"],
    ["stroke", "比桿賽", "元/桿"],
    ["putting", "推桿賽", "元/點"],
    ["snake", "抓蛇", "元/條"],
    ["hl", "HL", "元/round"],
    ["hussein", "海珊", "元/點"]
  ];
  const wrapper = $("#moneyInputs");
  wrapper.innerHTML = labels
    .map(([key, label, unit]) => `
      <label class="field">
        <span>${label} ${unit}</span>
        <input type="number" min="0" inputmode="numeric" value="${state.money[key]}" data-money="${key}" />
      </label>
    `)
    .join("");
  wrapper.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      state.money[input.dataset.money] = Math.max(0, Number(input.value) || 0);
      saveState();
      renderSummary();
    });
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

  renderOlympic();
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
  const skins = skinsScores();
  const board = $("#skinsBoard");
  board.innerHTML = "";
  activePlayers().forEach((player) => {
    const value = skins[player.id] || 0;
    const row = document.createElement("div");
    row.className = "leader-row";
    row.innerHTML = `<strong>${escapeHtml(player.name)}</strong><output class="${value > 0 ? "positive" : value < 0 ? "negative" : ""}">${formatMoney(value)}</output>`;
    board.append(row);
  });
  const skinsSum = Object.values(skins).reduce((sum, value) => sum + value, 0);
  $("#skinsZero").textContent = `目前已結算總和：${formatMoney(skinsSum)} · 保留 ${formatMoney(skinsCarry())}`;

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

  renderSideGame();
}

function renderOlympic() {
  const olympic = $("#olympicList");
  olympic.innerHTML = "";
  activePlayers().forEach((player) => {
    const card = document.createElement("article");
    card.className = "counter-card";
    const medal = olympicMedalFor(player.id, state.currentHole);
    const counts = olympicCounts(player.id);
    card.innerHTML = `
      <div><h3>${escapeHtml(player.name)}</h3><p>${medal ? `本洞 ${medalLabel(medal)}` : "本洞不選"} · 鑽${counts.diamond} 金${counts.gold} 銀${counts.silver} 銅${counts.bronze} 鐵${counts.iron}</p></div>
      <div class="olympic-buttons">
        ${["", "diamond", "gold", "silver", "bronze", "iron"].map((item) => `<button class="${medal === item ? "is-active" : ""}" type="button" data-medal="${item}">${item ? medalLabel(item) : "不選"}</button>`).join("")}
      </div>
    `;
    card.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => setOlympic(player.id, button.dataset.medal));
    });
    olympic.append(card);
  });
}

function renderSummary() {
  const matchLabel = state.match.name ? `${state.match.name} · ` : "";
  $("#summaryCourse").textContent = `${matchLabel}${course().name} · ${zoneById(state.frontZoneId).name} + ${zoneById(state.backZoneId).name}`;
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
  const stroke = strokeScores();
  const grid = $("#settlementGrid");
  grid.innerHTML = "";
  activePlayers().forEach((player) => {
    const snakeLoss = state.snake.big[player.id] || 0;
    const counts = olympicCounts(player.id);
    const card = document.createElement("article");
    card.className = "settlement-card";
    card.innerHTML = `
      <div>
        <h3>${escapeHtml(player.name)}</h3>
        <p>逐洞 ${formatMoney(skins[player.id] || 0)} · 比桿 ${formatMoney(stroke[player.id] || 0)} · 大蛇 ${snakeLoss}</p>
        <p>奧林匹克：鑽${counts.diamond} 金${counts.gold} 銀${counts.silver} 銅${counts.bronze} 鐵${counts.iron}</p>
      </div>
      <strong class="${(skins[player.id] || 0) + (stroke[player.id] || 0) - snakeLoss * (Number(state.money.snake) || 0) > 0 ? "positive" : "negative"}">${formatMoney((skins[player.id] || 0) + (stroke[player.id] || 0) - snakeLoss * (Number(state.money.snake) || 0))}</strong>
    `;
    grid.append(card);
  });
}

function renderSideGame() {
  const players = activePlayers();
  $("#sideGameTitle").textContent = state.sideGame === "hussein" ? "海珊" : "HL";
  $("#sideGameMeta").textContent = state.sideGame === "hussein" ? "三人競賽" : "四人競賽";
  if (state.sideGame === "hussein") {
    renderHussein(players);
  } else {
    renderHL(players);
  }
}

function renderHL(players) {
  const panel = $("#sideGamePanel");
  if (players.length !== 4) {
    panel.innerHTML = `<p class="muted-text">HL 需要 4 位球員，目前為 ${players.length} 位。</p>`;
    return;
  }
  const order = normalizedOrder(players, 4);
  const roundIndex = Math.floor(state.currentHole / 6);
  const pairings = hlPairings(order, roundIndex);
  const result = hlRoundResult(players, order, roundIndex);
  panel.innerHTML = `
    ${orderEditor(order, 4, "HL 開球排序")}
    <div class="zero-check">目前組合：${pairLabel(pairings[0])} vs ${pairLabel(pairings[1])}</div>
    <table class="mini-table">
      <thead><tr><th>輪次</th><th>洞數</th><th>得分</th></tr></thead>
      <tbody>
        ${[0, 1, 2].map((index) => {
          const item = hlRoundResult(players, order, index);
          return `<tr><td>第 ${index + 1} 輪</td><td>${index * 6 + 1}-${index * 6 + 6}</td><td>${item.a}-${item.b}</td></tr>`;
        }).join("")}
      </tbody>
    </table>
    <p class="muted-text">本輪 ${result.a === result.b ? "暫時平手" : result.a > result.b ? `${pairLabel(pairings[0])} 領先` : `${pairLabel(pairings[1])} 領先`}，每輪 ${formatMoney(Number(state.money.hl) || 0)}。</p>
  `;
  bindOrderEditor(panel);
}

function renderHussein(players) {
  const panel = $("#sideGamePanel");
  if (players.length !== 3) {
    panel.innerHTML = `<p class="muted-text">海珊只適用 3 位球員，目前為 ${players.length} 位。</p>`;
    return;
  }
  const order = normalizedOrder(players, 3);
  const ownerId = husseinOwnerForHole(players) || order[0];
  const ordered = [ownerId, ...order.filter((id) => id !== ownerId)];
  const husseinId = ordered[1];
  const teamIds = [ordered[0], ordered[2]];
  const rows = husseinRows(players, order);
  panel.innerHTML = `
    ${orderEditor(order, 3, "海珊初始排序")}
    <label class="field">
      <span>第一洞無法判斷時的 Owner</span>
      <select id="husseinOwner">${players.map((player) => `<option value="${player.id}" ${player.id === ownerId ? "selected" : ""}>${escapeHtml(player.name)}</option>`).join("")}</select>
    </label>
    <div class="zero-check">目前 Owner：${playerName(ownerId)} · 海珊：${playerName(husseinId)} · 對手：${teamIds.map(playerName).join("+")}</div>
    <table class="mini-table">
      <thead><tr><th>洞</th><th>結果</th><th>保留</th></tr></thead>
      <tbody>${rows.map((row) => `<tr><td>${row.hole}</td><td>${row.label}</td><td>${row.carry}</td></tr>`).join("")}</tbody>
    </table>
  `;
  bindOrderEditor(panel);
  $("#husseinOwner").addEventListener("change", (event) => {
    state.husseinOwner = event.target.value;
    saveAndRender();
  });
}

function normalizedOrder(players, size) {
  const ids = players.map((player) => player.id);
  const existing = state.teeOrder.filter((id) => ids.includes(id));
  const merged = [...existing, ...ids.filter((id) => !existing.includes(id))].slice(0, size);
  state.teeOrder = merged;
  return merged;
}

function orderEditor(order, size, title) {
  return `
    <div class="setup-grid order-editor">
      ${Array.from({ length: size }, (_, index) => `
        <label class="field">
          <span>${title} ${ordinal(index + 1)}</span>
          <select data-order-index="${index}">
            ${activePlayers().map((player) => `<option value="${player.id}" ${order[index] === player.id ? "selected" : ""}>${escapeHtml(player.name)}</option>`).join("")}
          </select>
        </label>
      `).join("")}
    </div>
  `;
}

function bindOrderEditor(panel) {
  panel.querySelectorAll("[data-order-index]").forEach((select) => {
    select.addEventListener("change", () => {
      state.teeOrder[Number(select.dataset.orderIndex)] = select.value;
      saveAndRender();
    });
  });
}

function hlPairings(order, roundIndex) {
  const pairs = [
    [[order[0], order[3]], [order[1], order[2]]],
    [[order[0], order[2]], [order[1], order[3]]],
    [[order[0], order[1]], [order[2], order[3]]]
  ];
  return pairs[Math.min(2, roundIndex)] || pairs[0];
}

function hlRoundResult(players, order, roundIndex) {
  const [teamA, teamB] = hlPairings(order, roundIndex);
  const result = { a: 0, b: 0 };
  for (let index = roundIndex * 6; index < roundIndex * 6 + 6; index += 1) {
    const aScores = teamA.map((id) => scoreFor(id, index)).filter(Boolean).sort((a, b) => a - b);
    const bScores = teamB.map((id) => scoreFor(id, index)).filter(Boolean).sort((a, b) => a - b);
    if (aScores.length < 2 || bScores.length < 2) continue;
    if (aScores[0] < bScores[0]) result.a += 1;
    if (bScores[0] < aScores[0]) result.b += 1;
    if (aScores[1] < bScores[1]) result.a += 1;
    if (bScores[1] < aScores[1]) result.b += 1;
  }
  return result;
}

function husseinOwnerForHole(players) {
  if (state.currentHole === 0) return state.husseinOwner || players[0]?.id;
  for (let index = state.currentHole - 1; index >= 0; index -= 1) {
    const scored = players.map((player) => ({ player, score: scoreFor(player.id, index) })).filter((item) => item.score > 0);
    if (scored.length !== players.length) continue;
    const best = Math.min(...scored.map((item) => item.score));
    const winners = scored.filter((item) => item.score === best);
    if (winners.length === 1) return winners[0].player.id;
  }
  return state.husseinOwner || players[0]?.id;
}

function husseinRows(players, order) {
  let carry = 0;
  return roundHoles().map((_, index) => {
    const owner = index === 0 ? (state.husseinOwner || order[0]) : ownerFromPrevious(players, index) || state.husseinOwner || order[0];
    const ordered = [owner, ...order.filter((id) => id !== owner)];
    const husseinId = ordered[1];
    const teamIds = [ordered[0], ordered[2]];
    const husseinScore = scoreFor(husseinId, index);
    const teamScore = teamIds.reduce((sum, id) => sum + scoreFor(id, index), 0);
    if (!husseinScore || teamIds.some((id) => !scoreFor(id, index))) {
      return { hole: index + 1, label: "-", carry };
    }
    const husseinCompare = husseinScore * 2;
    if (husseinCompare === teamScore) {
      carry += 2;
      return { hole: index + 1, label: "平手", carry };
    }
    const label = husseinCompare < teamScore ? `海珊 ${playerName(husseinId)} 勝` : `${teamIds.map(playerName).join("+")} 勝`;
    const paid = 2 + carry;
    carry = 0;
    return { hole: index + 1, label: `${label} ${paid} 點`, carry };
  });
}

function ownerFromPrevious(players, holeIndex) {
  for (let index = holeIndex - 1; index >= 0; index -= 1) {
    const scored = players.map((player) => ({ player, score: scoreFor(player.id, index) })).filter((item) => item.score > 0);
    if (scored.length !== players.length) continue;
    const best = Math.min(...scored.map((item) => item.score));
    const winners = scored.filter((item) => item.score === best);
    if (winners.length === 1) return winners[0].player.id;
  }
  return "";
}

function pairLabel(ids) {
  return ids.map(playerName).join("+");
}

function ordinal(value) {
  return ["1st", "2nd", "3rd", "4th"][value - 1] || `${value}`;
}

function playerName(id) {
  return state.players.find((player) => player.id === id)?.name || "-";
}

function counterCard(name, detail, value, onChange) {
  const node = $("#counterTemplate").content.firstElementChild.cloneNode(true);
  node.querySelector("h3").textContent = name;
  node.querySelector("p").textContent = detail;
  const input = node.querySelector("input");
  input.value = value || 0;
  input.addEventListener("change", () => onChange(Number(input.value) || 0));
  input.addEventListener("focus", () => input.select());
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

function updateSnakeTrigger(value) {
  state.snake.trigger = Math.max(2, Math.min(4, Number(value) || 4));
  state.snake.bank = Math.min(state.snake.bank, state.snake.trigger - 1);
  state.snake.history = [];
  saveAndRender();
}

function setOlympic(playerId, medal) {
  state.olympic[playerId] = state.olympic[playerId] || {};
  if (medal) {
    state.olympic[playerId][state.currentHole] = medal;
  } else {
    delete state.olympic[playerId][state.currentHole];
  }
  saveAndRender();
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatMoney(value) {
  return `${value > 0 ? "+" : ""}${value}元`;
}

function medalLabel(value) {
  return {
    diamond: "鑽",
    gold: "金",
    silver: "銀",
    bronze: "銅",
    iron: "鐵"
  }[value] || "不選";
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
  $("#matchName").addEventListener("input", (event) => {
    state.match.name = event.target.value.slice(0, 24);
    saveState();
  });
  $("#matchDate").addEventListener("change", (event) => {
    state.match.date = event.target.value;
    saveState();
  });
  $("#matchTime").addEventListener("change", (event) => {
    state.match.time = event.target.value;
    saveState();
  });
  $("#sideGameSelect").addEventListener("change", (event) => {
    state.sideGame = event.target.value;
    saveAndRender();
  });
  $("#snakeTriggerSetup").addEventListener("change", (event) => {
    updateSnakeTrigger(Number(event.target.value));
  });
  $("#snakeTrigger").addEventListener("change", (event) => {
    updateSnakeTrigger(Number(event.target.value));
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
