"use strict";
// import this script at the end of the HTML (after all elements are defined)

// ---------------------- Helpers: energy→height for sections ----------------------
function SetSectionHeight(tile_element, energy_count) {
  const bounds = tile_element.getBoundingClientRect();
  const icon_size = tile_element.style.backgroundSize; // "auto 200px"
  const icon_sizes = icon_size.split(" ");
  let icon_h = 2000;
  let icon_w = icon_sizes[0].replace("px", "");
  if (icon_sizes.length === 2) {
    icon_h = icon_sizes[1].replace("px", "");
  } else {
    icon_h = 2000 * (icon_w / 1000);
  }
  if (icon_w === "auto") icon_w = icon_h / 2; // preserve 1:2

  let icon_value = VALUE_PER_ICON;
  if (tile_element.hasAttribute("iconvalue")) {
    icon_value = tile_element.getAttribute("iconvalue") * icon_value;
  }

  const num_per_row = Math.round(bounds.width / icon_w);
  const val_per_row = icon_value * num_per_row;
  const rows = energy_count / val_per_row;
  const new_h = Math.round(rows * icon_h);

  const prev = tile_element.getAttribute("style") || "";
  tile_element.setAttribute("style", `${prev}; height:${new_h}px;`);
}

// ---------------------- Build maps from .resizeable_tiling ----------------------
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
      if (e.endsWith("K")) e = e.replace("K", "") * 1_000;
      else if (e.endsWith("M")) e = e.replace("M", "") * 1_000_000;
      else if (e.endsWith("B")) e = e.replace("B", "") * 1_000_000_000;

      // Insert a jump target before the section if none exists
      if (tile.getElementsByClassName("target").length === 0) {
        const jump = document.createElement("div");
        jump.setAttribute("name", section_name);
        jump.className = "target";
        let txt = `${section_name}\nThis section contains ${e} kWh`;
        if (tile.hasAttribute("iconvalue")) {
          const iv = tile.getAttribute("iconvalue");
          txt += `\n${e / iv} icons (x${iv} kWh per icon)`;
        }
        jump.innerText = txt;
        tile.parentNode.insertBefore(jump, tile);
      }

      window.addEventListener("resize", SetSectionHeight.bind(null, tile, e));
      SetSectionHeight(tile, e);
    }

    // Collect .testme
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

// ---------------------- Sidebar counters per tile ----------------------
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

// ---------------------- Jump buttons ----------------------
function ScrollButtonCallback(target) {
  const r = target.getBoundingClientRect();
  r.y += window.scrollY - r.height / 2;
  window.scrollTo(r);
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

// ---------------------- Sticky durations ----------------------
function InitStickyDurations() {
  const nodes = document.querySelectorAll("[data-stickvp]");
  nodes.forEach((el) => {
    // Skip if already wrapped
    if (el.parentElement && el.parentElement.classList.contains("sticky-wrap")) return;

    const vp = parseFloat(el.getAttribute("data-stickvp")) || 1;
    const topPx = (el.getAttribute("data-sticktop") || "120").replace("px", "");

    // Wrapper
    const wrap = document.createElement("div");
    wrap.className = "sticky-wrap";
    wrap.style.setProperty("--vp", vp);

    // **Critical**: neutralize inherited width/height from ".resizeable_tiling * { width/height: inherit }"
    wrap.style.width = "auto";
    wrap.style.height = `calc(${vp} * 100vh)`;
    wrap.style.position = "relative";
    wrap.style.display = "flex";
    wrap.style.justifyContent = "center";
    wrap.style.alignItems = "flex-start";
    wrap.style.pointerEvents = "none"; // pass-through except for inner

    // Move el inside
    el.parentElement.insertBefore(wrap, el);
    wrap.appendChild(el);

    // Inner
    el.classList.add("sticky-inner");
    el.style.position = "sticky";
    el.style.top = `${topPx}px`;
    el.style.pointerEvents = "auto";
    el.style.zIndex = "10002";
    // Also neutralize possible inherited width/height on the element itself
    el.style.width = "auto";
    el.style.height = "auto";

    // Stuck flag (optional)
    const computeTop = () => parseFloat(getComputedStyle(el).top) || 0;
    window.addEventListener(
      "scroll",
      () => {
        const rect = el.getBoundingClientRect();
        el.classList.toggle("is-stuck", rect.top <= computeTop());
      },
      { passive: true }
    );
  });
}

// ---------------------- Global scroll thresholds (⚡) ----------------------
// Independent gating: do NOT monkey-patch UpdateAll.
(function initGlobalScrollThresholds() {
  const gated = Array.from(document.querySelectorAll("[data-scrollthreshold]"));
  // Start hidden
  gated.forEach((el) => {
    el.hidden = true;
  });

  function applyGlobalScrollThresholds() {
    // Sum scrolled ⚡ across all tiles (ScrollVals is maintained by tilecount.js → UpdateAll)
    let scroll_total = 0;
    for (const v of ScrollVals.values()) scroll_total += v;

    for (const el of gated) {
      const need = parseFloat(el.getAttribute("data-scrollthreshold")) || 0;
      el.hidden = scroll_total < need;
    }
  }

  // Run on scroll/resize independent of UpdateAll's timing
  window.addEventListener("scroll", applyGlobalScrollThresholds, { passive: true });
  window.addEventListener("resize", applyGlobalScrollThresholds);
  // First pass
  requestAnimationFrame(applyGlobalScrollThresholds);
})();

// ---------------------- Boot ----------------------
InitializeElementMap();
CreateElementButtons();
ConstructCounterTables();
InitStickyDurations();

console.log("ElementMap:", ElementMap);
console.log("CounterMap:", CounterMap);

// Let tilecount.js drive ScrollVals; we just listen.
window.addEventListener("resize", UpdateAll);
window.addEventListener("scroll", UpdateAll);
UpdateAll();
