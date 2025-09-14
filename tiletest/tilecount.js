"use strict"; // <-- strict mode
// developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
/* 'this' inside local functions normally returns 'globalThis'.
    however, within strict-mode it returns 'undefined' instead,
    which allows us to determine whether strict-mode is active. */
let isStrictMode = (function() { return (this !== globalThis); })();
console.log(`strict-mode: ${(isStrictMode? 'enabled':'disabled')}`);
// --------------------------------------------------------------- //

let VALUE_PER_ICON = 1; // TODO: custom HTML attribute
const TileValues = new Map(); // tile --> stored value
const ScrollVals = new Map(); // tile --> scroll count
const ElementMap = new Map(); // tile --> nested elements (class="testme")
const CounterMap = new Map(); // tile --> CounterTable


class TableEntry
{
    threshold;
    table_row; // the <li> element associated with this
    
    Update(new_val) { // updates the coloring (via CSS)
        this.table_row.setAttribute("class",
              ((new_val >= this.threshold)? "good":"bad"));
        return (new_val >= this.threshold);
    }
    
    constructor(parentTable, target)
    { // inserts an entry for target into the parent CounterTable
        let threshold = target.getAttribute("required_scrollcount");
        if (!target.hasAttribute("name"))
            {target.setAttribute("name", target.innerText);}
        let target_name = target.getAttribute("name");
        
        const new_entry = document.createElement("li");
        new_entry.setAttribute("class", "bad");
        new_entry.textContent = `[${threshold}] ${target_name}`
        parentTable.appendChild(new_entry);
        
        this.threshold = threshold;
        this.table_row = new_entry;
    }
}

class CounterTable
{
    table_element; // <table class="threshold_table">
    table_counter; // <a class="table_counter">
    tile_source; // <class="resizeable_tiling">
    target_list; // <class="testme"> elements nested within tile_source
    row_entries; // TableEntries
    
    Update(new_val) {
        this.table_counter.textContent = `${new_val}\u26A1`
        for (const entry of this.row_entries) entry.Update(new_val);
    }
    
    // table element needs to be pre-constructed
    constructor(table, source) {
        this.table_element = table;
        this.table_counter = table.getElementsByClassName("table_counter")[0];
        this.tile_source = source;
        this.target_list = source.getElementsByClassName("testme");
        
        this.row_entries = [];
        for (const target of this.target_list) {
            this.row_entries.push(new TableEntry(this.table_element, target));
        }
    }
}

function UpdateCounterTotal() {
    let total_value = 0;
    for (const val of TileValues.values()){ total_value += val; }
    const primary_counter = document.getElementById('counter');
    primary_counter.innerText = `${total_value}\u26A1kWh`; // unicode: U+26A1 'High Voltage Sign'
}

function UpdateScrollCounter() {
    let scroll_total = 0;
    for (const val of ScrollVals.values()){ scroll_total += val; }
    const primary_counter = document.getElementById('scroll_counter');
    primary_counter.innerText = `[${scroll_total}\u26A1 scrolled]`;
}

function CalculateTileValue(tile_element)
{
    let tile_val = 0;

    const bounds = tile_element.getBoundingClientRect();

    // Read background-size ("auto 200px", "100px 200px", etc.)
    let tile_size = tile_element.style.backgroundSize || getComputedStyle(tile_element).getPropertyValue('background-size');
    const parts = tile_size.split(/\s+/);
    let tw = parts[0]?.replace('px','') || 'auto';
    let th = (parts[1]?.replace('px','')) ?? 'auto';

    // Derive missing dimension using 1:2 aspect ratio (w:h)
    if (th === 'auto' && tw !== 'auto') th = 2000 * (parseFloat(tw)/1000);
    if (tw === 'auto' && th !== 'auto') tw = parseFloat(th)/2;

    const tile_width  = Math.max(1, parseFloat(tw) || 1);
    const tile_height = Math.max(1, parseFloat(th) || 1);

    const num_per_row = Math.max(1, Math.round(bounds.width  / tile_width));
    const row_count   = Math.max(1, Math.round(bounds.height / tile_height));
    const icon_count  = row_count * num_per_row;

    let icon_value = VALUE_PER_ICON;
    if (tile_element.hasAttribute('iconvalue')) {
        icon_value = parseFloat(tile_element.getAttribute('iconvalue')) * VALUE_PER_ICON;
    }
    tile_val = icon_count * icon_value;

    // Store + update totals and per-tile table (table expects tile total, not scrolled)
    TileValues.set(tile_element, tile_val);
    UpdateCounterTotal();
    CounterMap.get(tile_element)?.Update(tile_val);

    //////////// Adjust for rounding so label placement aligns to drawn rows
// Adjust for rounding so label placement aligns to drawn rows
    const height_ratio = bounds.height / ((row_count + 1) * tile_height);
    const row_height   = tile_height * height_ratio;
    
    const vertOffset   = bounds.top + window.scrollY;
    
// --- progressive progress within THIS tile (in ⚡) ---
    const tileStartY       = vertOffset;           // page Y where this tile begins
    const currentY         = window.scrollY;       // viewport top
    const scrolledPxWithin = Math.min(Math.max(currentY - tileStartY, 0), bounds.height);
    const rowsScrolled     = Math.round(scrolledPxWithin / row_height);
    const scrolledKwh      = rowsScrolled * num_per_row * icon_value;  // tile-local progress    // ----------------------------------------------------------
    
    // adjusting position / visibility of each child element
    const elements = ElementMap.get(tile_element) || [];
    for (const [target, thresholdRaw] of elements) {
      // Skip things that use global thresholds; they’re handled elsewhere
      if (target.hasAttribute('data-scrollthreshold')) continue;
    
      const t = parseFloat(thresholdRaw) || 0;
    
      // Sticky items: gate by tile-local progress, don't absolute-position
      if (target.hasAttribute('data-stickvp')) {
        target.hidden = scrolledKwh < t;
        continue;
      }
    
      // Non-sticky legacy behavior: gate by tile capacity and place absolutely
      const meets = tile_val >= t;
      if (meets) {
        target.hidden = false;
        const rowsNeeded = t / (num_per_row * icon_value);
        target.style.top = `${vertOffset + (row_height * rowsNeeded)}px`;
      } else {
        target.hidden = true;
      }
    }
    
    // --- FINAL RETURN: report scrolled amount for this tile ---
    return Math.min(tile_val, scrolledKwh);

}


// --- GLOBAL SCROLL THRESHOLDS ---
function InitScrollThresholds() {
  // Start gated elements hidden
  const gated = document.querySelectorAll('[data-scrollthreshold]');
  gated.forEach(el => { el.hidden = true; });

  // Monkey-patch UpdateAll to also toggle global gates
  const origUpdateAll = window.UpdateAll;
  window.UpdateAll = function() {
    origUpdateAll && origUpdateAll();

    // Sum scrolled ⚡ across tiles
    let scroll_total = 0;
    for (const v of ScrollVals.values()) scroll_total += v;

    gated.forEach(el => {
      const need = parseFloat(el.getAttribute('data-scrollthreshold')) || 0;
      el.hidden = (scroll_total < need);
    });
  };
}

function UpdateAll() {
    for (const tile of TileValues.keys()) {
        const scrolled = CalculateTileValue(tile);
        ScrollVals.set(tile, scrolled);
        // DO NOT call CounterMap.Update() here; it’s already called with tile total in CalculateTileValue.
    }
    UpdateScrollCounter();
}



InitializeElementMap();
CreateElementButtons();
ConstructCounterTables();

InitStickyDurations && InitStickyDurations(); // if defined elsewhere
InitScrollThresholds();                        // <-- add this line

window.addEventListener('resize', UpdateAll);
window.addEventListener('scroll', UpdateAll);
UpdateAll();
