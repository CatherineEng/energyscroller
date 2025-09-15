"use strict";

/* ---------------------- Helpers: energy→height for sections ---------------------- */
function SetSectionHeight(tile_element, energy_count) {
  const bounds = tile_element.getBoundingClientRect();
  const icon_size = tile_element.style.backgroundSize || getComputedStyle(tile_element).getPropertyValue("background-size");
  const icon_sizes = (icon_size || "").split(/\s+/);
  let icon_h = 2000;
  let icon_w = icon_sizes[0] ? icon_sizes[0].replace("px", "") : "auto";
  if (icon_sizes.length >= 2) {
    icon_h = parseFloat(icon_sizes[1].replace("px", "")) || 2000;
  } else {
    const wnum = parseFloat(icon_w);
    icon_h = isNaN(wnum) ? 2000 : 2000 * (wnum / 1000);
  }
  if (icon_w === "auto") icon_w = icon_h / 2; // preserve 1:2

  let icon_value = VALUE_PER_ICON;
  if (tile_element.hasAttribute("iconvalue")) {
    icon_value = parseFloat(tile_element.getAttribute("iconvalue")) * icon_value;
  }

  const num_per_row = Math.max(1, Math.round(bounds.width / parseFloat(icon_w)));
  const val_per_row = icon_value * num_per_row;
  const rows = energy_count / val_per_row;
  const new_h = Math.round(rows * icon_h);

  const prev = tile_element.getAttribute("style") || "";
  tile_element.setAttribute("style", `${prev}; height:${new_h}px;`);
}

/* ---------------------- Build maps from .resizeable_tiling ---------------------- */
function InitializeElementMap() {
  const tiles = document.getElementsByClassName("resizeable_tiling");
  let section_count = 0;

  for (const tile of tiles) {
    // Name / id
    let section_name = `Section_${section_count++}`;
    if (tile.hasAttribute("name")) section_name = tile.getAttribute("name");
    else if (tile.hasAttribute("id")) section_name = tile.getAttribute("id");
    else tile.setAttribute("name", section_name);

    // background-size from attribute or computed
    if (tile.hasAttribute("tilesize")) {
      tile.style.backgroundSize = tile.getAttribute("tilesize");
    } else {
      tile.style.backgroundSize = getComputedStyle(tile).getPropertyValue("background-size");
    }

    // Optional energy → auto-height
    if (tile.hasAttribute("energy")) {
      let e = tile.getAttribute("energy");
      if (e.endsWith("K")) e = parseFloat(e) * 1_000;
      else if (e.endsWith("M")) e = parseFloat(e) * 1_000_000;
      else if (e.endsWith("B")) e = parseFloat(e) * 1_000_000_000;
      e = Number(e) || 0;

      // Insert a jump target before the section if none exists
      if (tile.getElementsByClassName("target").length === 0) {
        const jump = document.createElement("div");
        jump.setAttribute("name", section_name);
        jump.className = "target";
        let txt = `${section_name}\nThis section contains ${e.toLocaleString()} kWh`;
        if (tile.hasAttribute("iconvalue")) {
          const iv = Number(tile.getAttribute("iconvalue")) || 1;
          txt += `\n${Math.round(e / iv).toLocaleString()} icons (x${iv} kWh per icon)`;
        }
        jump.innerText = txt;
        tile.parentNode.insertBefore(jump, tile);
      }

      window.addEventListener("resize", SetSectionHeight.bind(null, tile, e));
      SetSectionHeight(tile, e);
    }

    // Collect ONLY .testme (legacy callouts); .card is NOT included here
    const tuplelist = [];
    const targets = tile.getElementsByClassName("testme");
    for (const t of targets) {
      if (!t.hasAttribute("required_scrollcount")) t.setAttribute("required_scrollcount", 0);
      tuplelist.push([t, t.getAttribute("required_scrollcount")]);
    }

    ElementMap.set(tile, tuplelist);
    TileValues.set(tile, 0);

    // Optional: keeps the old behavior (harmless)
    tile.addEventListener("mousemove", CalculateTileValue.bind(null, tile));
  }
}

/* ---------------------- Sidebar counters per tile ---------------------- */
function ConstructCounterTables() {
  const table_container = document.getElementById("table_container");
  const tiles = document.getElementsByClassName("resizeable_tiling");
  let i = 1;

  for (const tile of tiles) {
    const table = document.createElement("table");
    table.setAttribute("class", "threshold_table");

    let table_name = `Table_${i++}`;
    if (tile.hasAttribute("name")) table_name = tile.getAttribute("name");

    const thead = document.createElement("tbody");
    const th = document.createElement("th");
    th.innerHTML = `<a class="table_counter">0\u26A1</a> ${table_name}`;
    if (tile.hasAttribute("iconvalue")) {
      th.innerHTML = `<a class="table_counter">0\u26A1</a> ${table_name} (x${tile.getAttribute("iconvalue")})`;
    }
    thead.appendChild(th);
    table.appendChild(thead);
    table_container.appendChild(table);

    CounterMap.set(tile, new CounterTable(table, tile));
  }
}

/* ---------------------- Jump buttons ---------------------- */
/*function ScrollButtonCallback(target) {
  const r = target.getBoundingClientRect();
  r.y += window.scrollY - r.height / 2;
  window.scrollTo(r);
}*/

function ScrollButtonCallback(target) {
  const rect = target.getBoundingClientRect();
  const header = document.getElementById('topbar_info');
  const offset = header ? header.offsetHeight : 0;

  const top = rect.top + window.scrollY - rect.height / 2 - offset;

  // modern, smooth
  window.scrollTo({ top, behavior: 'smooth' });

  // fallback (uncomment if you need it)
  // window.scrollTo(0, top);
}


function CreateElementButtons() {
  const wrap = document.getElementById("jump_container");
  const targets = document.getElementsByClassName("target");
  let n = 1;
  for (const t of targets) {
    const btn = document.createElement("button");
    btn.textContent = t.getAttribute("name") || t.getAttribute("id") || `Element_${n}`;
    btn.onclick = ScrollButtonCallback.bind(null, t);
    wrap.appendChild(btn);
    n += 1;
  }
}

/* ---------------------- Sticky durations ---------------------- */
function InitStickyDurations() {
  const nodes = document.querySelectorAll(".card[data-stickvp]");

  const findOverflowBlocker = (el) => {
    let cur = el.parentElement;
    while (cur && cur !== document.body) {
      const cs = getComputedStyle(cur);
      // Any of these turns the ancestor into a scroll container
      const ov = cs.overflow + cs.overflowX + cs.overflowY;
      if (/(auto|scroll|hidden|clip)/.test(ov)) return cur;
      cur = cur.parentElement;
    }
    return null;
  };

  nodes.forEach((card) => {
    // Skip if already wrapped
    if (card.parentElement && card.parentElement.classList.contains("sticky-wrap")) return;

    const vp = Math.max(0.25, parseFloat(card.getAttribute("data-stickvp")) || 1);
    const topPx = String(card.getAttribute("data-sticktop") || "140").replace("px", "");

    // Build wrapper + inner styles
    const wrap = document.createElement("div");
    wrap.className = "sticky-wrap";
    wrap.style.setProperty("--vp", vp);
    wrap.style.width = "100%";

    card.classList.add("sticky-inner");
    card.style.position = "sticky";
    card.style.top = `${topPx}px`;
    card.style.zIndex = "10002";
    card.style.width = "auto";
    card.style.height = "auto";

    // If an overflow-blocking ancestor exists, hoist wrapper BEFORE it
    const blocker = findOverflowBlocker(card);
    if (blocker) {
      blocker.parentElement.insertBefore(wrap, blocker);
    } else {
      // Else, keep it where it is (as a sibling just before the card)
      card.parentElement.insertBefore(wrap, card);
    }

    // Move the card into the wrapper
    wrap.appendChild(card);

    // Optional visual state toggle
    const computeTop = () => parseFloat(getComputedStyle(card).top) || 0;
    window.addEventListener(
      "scroll",
      () => {
        const rect = card.getBoundingClientRect();
        card.classList.toggle("is-stuck", rect.top <= computeTop());
      },
      { passive: true }
    );
  });
}

/* ---------------------- Global scroll thresholds (⚡) ---------------------- */
(function initGlobalScrollThresholds() {
  const gated = Array.from(document.querySelectorAll("[data-scrollthreshold]"));
  gated.forEach((el) => { el.hidden = true; });

  function applyGlobalScrollThresholds() {
    let scroll_total = 0;
    for (const v of ScrollVals.values()) scroll_total += v;

    for (const el of gated) {
      const need = parseFloat(el.getAttribute("data-scrollthreshold")) || 0;
      el.hidden = scroll_total < need;
    }
  }

  window.addEventListener("scroll", applyGlobalScrollThresholds, { passive: true });
  window.addEventListener("resize", applyGlobalScrollThresholds);
  requestAnimationFrame(applyGlobalScrollThresholds);
})();

/* ---------------------- Boot (guard against double-init) ---------------------- */
(function bootOnce() {
  if (window.__ENERGY_BOOTED__) return;
  window.__ENERGY_BOOTED__ = true;

  InitializeElementMap();
  CreateElementButtons();
  ConstructCounterTables();
  InitStickyDurations();

  window.addEventListener("resize", UpdateAll);
  window.addEventListener("scroll", UpdateAll);
  UpdateAll();
})();