// Nursing dosage dimensional analysis practice app
// Beginner-friendly structure with plain JavaScript and clear function names.

const units = ["mcg", "mg", "g", "kg", "mL", "L", "tablet", "tablets", "capsule", "capsules", "vial", "vials"];

const conversionPairs = [
  { a: { value: 1000, unit: "mcg" }, b: { value: 1, unit: "mg" } },
  { a: { value: 1000, unit: "mg" }, b: { value: 1, unit: "g" } },
  { a: { value: 1000, unit: "mL" }, b: { value: 1, unit: "L" } },
  { a: { value: 1000, unit: "g" }, b: { value: 1, unit: "kg" } }
];

const guidedProblems = [
  {
    text: "Order: 500 mg. Available: 250 mg per 1 tablet. Find tablets.",
    hint: "Start with the ordered dose, then multiply by a factor that has tablets on top and mg on bottom.",
    solution: "500 mg / 1 × 1 tablet / 250 mg = 2 tablets",
    tiles: [{ value: 500, unit: "mg" }, { value: 1, unit: "tablet" }, { value: 250, unit: "mg" }],
    target: "tablet"
  },
  {
    text: "Order: 1.5 g. Available: 500 mg per 1 tablet. Find tablets.",
    hint: "You need a g-to-mg conversion before using the tablet factor.",
    solution: "1.5 g /1 × 1000 mg /1 g × 1 tablet /500 mg = 3 tablets",
    tiles: [{ value: 1.5, unit: "g" }, { value: 1000, unit: "mg" }, { value: 1, unit: "g" }, { value: 1, unit: "tablet" }, { value: 500, unit: "mg" }],
    target: "tablet"
  },
  {
    text: "Order: 200 mcg. Available: 0.5 mg per 1 mL. Find mL.",
    hint: "Convert mcg to mg first so mg can cancel.",
    solution: "200 mcg /1 × 1 mg /1000 mcg × 1 mL /0.5 mg = 0.4 mL",
    tiles: [{ value: 200, unit: "mcg" }, { value: 1, unit: "mg" }, { value: 1000, unit: "mcg" }, { value: 1, unit: "mL" }, { value: 0.5, unit: "mg" }],
    target: "mL"
  }
];

let tileBank = [];
let steps = [];
let currentGuidedIndex = 0;
let activeGeneratedProblem = null;
let draggedTileId = null;

const tileBankEl = document.getElementById("tileBank");
const workspaceEl = document.getElementById("workspace");
const feedbackEl = document.getElementById("feedback");
const resultEl = document.getElementById("result");
const pathwayEl = document.getElementById("pathway");

function populateUnitDropdowns() {
  document.querySelectorAll("select").forEach(select => {
    if (select.id === "problemCategory") return;
    select.innerHTML = units.map(unit => `<option value="${unit}">${unit}</option>`).join("");
  });
}

function createTile(value, unit, source = "custom") {
  return {
    id: `${source}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    value: Number(value),
    unit,
    source
  };
}

function resetWorkspace() {
  steps = [{ num: null, den: null }, { num: null, den: null }];
  renderWorkspace();
  renderCancellationAndResult();
}

function addStep() {
  steps.push({ num: null, den: null });
  renderWorkspace();
}

function moveStep(index, direction) {
  const other = index + direction;
  if (other < 0 || other >= steps.length) return;
  [steps[index], steps[other]] = [steps[other], steps[index]];
  renderWorkspace();
  renderCancellationAndResult();
}

function removeTileFromStep(index, slot) {
  const tile = steps[index][slot];
  if (tile) tileBank.push(tile);
  steps[index][slot] = null;
  renderTileBank();
  renderWorkspace();
  renderCancellationAndResult();
}

function renderTileBank() {
  tileBankEl.innerHTML = "";
  if (tileBank.length === 0) {
    tileBankEl.innerHTML = "<p>No tiles available. Load a guided/generated problem or create tiles in free build.</p>";
    return;
  }

  tileBank.forEach(tile => {
    const div = document.createElement("div");
    div.className = "tile";
    div.draggable = true;
    div.dataset.tileId = tile.id;
    div.innerHTML = `<strong>${tile.value}</strong> <span class="unit">${tile.unit}</span><small>${tile.source}</small>
      <button type="button" data-quick-add="${tile.id}">Place in first empty slot</button>`;
    div.addEventListener("dragstart", () => {
      draggedTileId = tile.id;
      div.classList.add("dragging");
    });
    div.addEventListener("dragend", () => div.classList.remove("dragging"));
    tileBankEl.appendChild(div);
  });

  tileBankEl.querySelectorAll("[data-quick-add]").forEach(btn => {
    btn.addEventListener("click", () => placeTileInFirstEmpty(btn.dataset.quickAdd));
  });
}

function renderWorkspace() {
  workspaceEl.innerHTML = "";

  steps.forEach((step, index) => {
    const stepEl = document.createElement("div");
    stepEl.className = "step";

    stepEl.innerHTML = `
      <div class="step-header"><strong>Step ${index + 1}</strong></div>
      <div class="slot ${step.num ? "filled" : ""}" data-step="${index}" data-slot="num"></div>
      <div class="fraction-line"></div>
      <div class="slot ${step.den ? "filled" : ""}" data-step="${index}" data-slot="den"></div>
      <div class="step-controls">
        <button type="button" data-move-left="${index}">←</button>
        <button type="button" data-move-right="${index}">→</button>
        <button type="button" data-clear-step="${index}">Clear step</button>
      </div>
    `;

    ["num", "den"].forEach(slot => {
      const slotEl = stepEl.querySelector(`.slot[data-slot='${slot}']`);
      if (step[slot]) {
        slotEl.innerHTML = `<strong>${step[slot].value}</strong> <span class="unit" data-unit-label="${index}-${slot}">${step[slot].unit}</span>
          <button type="button" data-remove="${index}" data-remove-slot="${slot}">Remove</button>`;
      } else {
        slotEl.textContent = slot === "num" ? "Drop numerator tile here" : "Drop denominator tile here";
      }

      slotEl.addEventListener("dragover", (event) => event.preventDefault());
      slotEl.addEventListener("drop", () => handleDrop(index, slot));
    });

    workspaceEl.appendChild(stepEl);
  });

  bindStepButtons();
}

function bindStepButtons() {
  workspaceEl.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => removeTileFromStep(Number(btn.dataset.remove), btn.dataset.removeSlot));
  });

  workspaceEl.querySelectorAll("[data-move-left]").forEach(btn => {
    btn.addEventListener("click", () => moveStep(Number(btn.dataset.moveLeft), -1));
  });

  workspaceEl.querySelectorAll("[data-move-right]").forEach(btn => {
    btn.addEventListener("click", () => moveStep(Number(btn.dataset.moveRight), 1));
  });

  workspaceEl.querySelectorAll("[data-clear-step]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.clearStep);
      ["num", "den"].forEach(slot => removeTileFromStep(index, slot));
    });
  });
}

function handleDrop(stepIndex, slot) {
  if (!draggedTileId) return;
  const tileIndex = tileBank.findIndex(tile => tile.id === draggedTileId);
  if (tileIndex === -1) return;

  const tile = tileBank[tileIndex];
  tileBank.splice(tileIndex, 1);

  if (steps[stepIndex][slot]) tileBank.push(steps[stepIndex][slot]);
  steps[stepIndex][slot] = tile;

  draggedTileId = null;
  renderTileBank();
  renderWorkspace();
  renderCancellationAndResult();
}

function placeTileInFirstEmpty(tileId) {
  const tileIndex = tileBank.findIndex(tile => tile.id === tileId);
  if (tileIndex === -1) return;

  for (let i = 0; i < steps.length; i++) {
    for (const slot of ["num", "den"]) {
      if (!steps[i][slot]) {
        steps[i][slot] = tileBank[tileIndex];
        tileBank.splice(tileIndex, 1);
        renderTileBank();
        renderWorkspace();
        renderCancellationAndResult();
        return;
      }
    }
  }
  feedbackEl.textContent = "No empty slot found. Add another step first.";
}

function analyzeUnits() {
  const entries = [];
  steps.forEach((step, stepIndex) => {
    if (step.num) entries.push({ side: "num", stepIndex, slot: "num", unit: step.num.unit, value: step.num.value, canceled: false });
    if (step.den) entries.push({ side: "den", stepIndex, slot: "den", unit: step.den.unit, value: step.den.value, canceled: false });
  });

  const numeratorEntries = entries.filter(item => item.side === "num");
  const denominatorEntries = entries.filter(item => item.side === "den");

  numeratorEntries.forEach(num => {
    const match = denominatorEntries.find(den => !den.canceled && !num.canceled && den.unit === num.unit);
    if (match) {
      num.canceled = true;
      match.canceled = true;
    }
  });

  return entries;
}

function renderCancellationAndResult() {
  const entries = analyzeUnits();

  document.querySelectorAll(".unit").forEach(unitEl => unitEl.classList.remove("canceled", "final"));

  const remaining = entries.filter(e => !e.canceled);
  entries.forEach(entry => {
    const label = document.querySelector(`[data-unit-label='${entry.stepIndex}-${entry.slot}']`);
    if (label && entry.canceled) label.classList.add("canceled");
  });

  if (remaining.length === 0) {
    feedbackEl.textContent = "All units canceled. Add one target unit (for example mL or tablets) that should remain as your answer unit.";
    resultEl.textContent = "";
    pathwayEl.textContent = "";
    return;
  }

  if (remaining.length > 1) {
    const names = remaining.map(r => r.unit).join(", ");
    feedbackEl.textContent = `You still have ${names} left over, so the setup is not complete yet. You may need a conversion factor first.`;
    resultEl.textContent = "";
    pathwayEl.textContent = "";
    return;
  }

  const leftover = remaining[0];
  const finalLabel = document.querySelector(`[data-unit-label='${leftover.stepIndex}-${leftover.slot}']`);
  if (finalLabel) finalLabel.classList.add("final");

  const valid = steps.some(step => step.num || step.den) && steps.every(step => !step.den || step.den.value !== 0);
  if (!valid) {
    feedbackEl.textContent = "Please complete your setup with valid non-zero denominator values.";
    return;
  }

  const allFilledEntries = entries.filter(e => e.value !== undefined && !Number.isNaN(e.value));
  const numeratorProduct = allFilledEntries.filter(e => e.side === "num").reduce((acc, cur) => acc * cur.value, 1);
  const denominatorProduct = allFilledEntries.filter(e => e.side === "den").reduce((acc, cur) => acc * cur.value, 1);

  if (denominatorProduct === 0) {
    feedbackEl.textContent = "A denominator is zero. Please fix that value before calculating.";
    resultEl.textContent = "";
    pathwayEl.textContent = "";
    return;
  }

  const answer = numeratorProduct / denominatorProduct;
  feedbackEl.textContent = "Great job. Units cancel to one final answer unit.";
  resultEl.textContent = `Answer: ${answer} ${leftover.unit}`;
  pathwayEl.textContent = `Pathway: (${numeratorProduct}) ÷ (${denominatorProduct}) = ${answer}. Rounded example: ${answer.toFixed(2)} ${leftover.unit} (rounding rules may vary by instructor).`;
}

function loadGuidedProblem(index) {
  const problem = guidedProblems[index];
  document.getElementById("guidedProblemText").textContent = problem.text;
  document.getElementById("guidedHint").textContent = "";
  document.getElementById("guidedSolution").textContent = "";

  tileBank = problem.tiles.map(tile => createTile(tile.value, tile.unit, "guided"));
  tileBank.push(...conversionPairs.flatMap(pair => [
    createTile(pair.a.value, pair.a.unit, "conversion"),
    createTile(pair.b.value, pair.b.unit, "conversion")
  ]));

  resetWorkspace();
  renderTileBank();
}

function buildTilesFromFreeForm(event) {
  event.preventDefault();
  const values = {
    orderedValue: Number(document.getElementById("orderedValue").value),
    orderedUnit: document.getElementById("orderedUnit").value,
    availableValue: Number(document.getElementById("availableValue").value),
    availableUnit: document.getElementById("availableUnit").value,
    handValue: Number(document.getElementById("handValue").value),
    handUnit: document.getElementById("handUnit").value,
    convAValue: document.getElementById("convAValue").value,
    convAUnit: document.getElementById("convAUnit").value,
    convBValue: document.getElementById("convBValue").value,
    convBUnit: document.getElementById("convBUnit").value
  };

  if (!values.orderedValue || !values.availableValue || !values.handValue) {
    document.getElementById("freeBuildMessage").textContent = "Please enter all required values with numbers greater than zero.";
    return;
  }

  tileBank = [
    createTile(values.orderedValue, values.orderedUnit, "ordered"),
    createTile(values.availableValue, values.availableUnit, "available"),
    createTile(values.handValue, values.handUnit, "on-hand")
  ];

  if (values.convAValue && values.convBValue) {
    tileBank.push(createTile(Number(values.convAValue), values.convAUnit, "conversion"));
    tileBank.push(createTile(Number(values.convBValue), values.convBUnit, "conversion"));
  }

  tileBank.push(...conversionPairs.flatMap(pair => [
    createTile(pair.a.value, pair.a.unit, "common conversion"),
    createTile(pair.b.value, pair.b.unit, "common conversion")
  ]));

  document.getElementById("freeBuildMessage").textContent = "Tiles created. Drag them into the workspace to build your setup.";
  resetWorkspace();
  renderTileBank();
}

function generateProblem() {
  const category = document.getElementById("problemCategory").value;
  const bank = {
    tablets: [
      {
        text: "Order 750 mg. Available 250 mg per tablet. Find tablets.",
        tiles: [{ value: 750, unit: "mg" }, { value: 1, unit: "tablet" }, { value: 250, unit: "mg" }]
      }
    ],
    oral: [
      {
        text: "Order 400 mg. Available 200 mg per 5 mL. Find mL.",
        tiles: [{ value: 400, unit: "mg" }, { value: 5, unit: "mL" }, { value: 200, unit: "mg" }]
      }
    ],
    injection: [
      {
        text: "Order 1 g. Available 500 mg per 2 mL. Find mL.",
        tiles: [{ value: 1, unit: "g" }, { value: 1000, unit: "mg" }, { value: 1, unit: "g" }, { value: 2, unit: "mL" }, { value: 500, unit: "mg" }]
      }
    ],
    conversion: [
      {
        text: "Convert 2500 mcg to mg using dimensional analysis.",
        tiles: [{ value: 2500, unit: "mcg" }, { value: 1, unit: "mg" }, { value: 1000, unit: "mcg" }]
      }
    ],
    multistep: [
      {
        text: "Order 0.75 g. Available 250 mg per capsule. Find capsules.",
        tiles: [{ value: 0.75, unit: "g" }, { value: 1000, unit: "mg" }, { value: 1, unit: "g" }, { value: 1, unit: "capsule" }, { value: 250, unit: "mg" }]
      }
    ]
  };

  const options = bank[category];
  const problem = options[Math.floor(Math.random() * options.length)];
  activeGeneratedProblem = problem;
  document.getElementById("generatedProblem").textContent = problem.text;
  document.getElementById("loadGeneratedBtn").disabled = false;
}

function loadGeneratedProblem() {
  if (!activeGeneratedProblem) return;
  tileBank = activeGeneratedProblem.tiles.map(tile => createTile(tile.value, tile.unit, "generated"));
  tileBank.push(...conversionPairs.flatMap(pair => [
    createTile(pair.a.value, pair.a.unit, "conversion"),
    createTile(pair.b.value, pair.b.unit, "conversion")
  ]));
  resetWorkspace();
  renderTileBank();
  feedbackEl.textContent = "Generated problem loaded. Build your fraction chain.";
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(panel => panel.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

function setupEvents() {
  document.getElementById("addStepBtn").addEventListener("click", addStep);
  document.getElementById("resetWorkspaceBtn").addEventListener("click", () => {
    resetWorkspace();
    renderTileBank();
  });
  document.getElementById("checkCancellationBtn").addEventListener("click", renderCancellationAndResult);

  document.getElementById("nextGuidedProblemBtn").addEventListener("click", () => {
    currentGuidedIndex = (currentGuidedIndex + 1) % guidedProblems.length;
    loadGuidedProblem(currentGuidedIndex);
  });
  document.getElementById("guidedHintBtn").addEventListener("click", () => {
    document.getElementById("guidedHint").textContent = guidedProblems[currentGuidedIndex].hint;
  });
  document.getElementById("guidedSolutionBtn").addEventListener("click", () => {
    document.getElementById("guidedSolution").textContent = guidedProblems[currentGuidedIndex].solution;
  });

  document.getElementById("freeBuildForm").addEventListener("submit", buildTilesFromFreeForm);
  document.getElementById("generateProblemBtn").addEventListener("click", generateProblem);
  document.getElementById("loadGeneratedBtn").addEventListener("click", loadGeneratedProblem);
}

function initializeApp() {
  populateUnitDropdowns();
  setupTabs();
  setupEvents();
  loadGuidedProblem(0);
}

initializeApp();
