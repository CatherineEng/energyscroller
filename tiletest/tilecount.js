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
    //let prev_val = TileValues.get(tile_element);
    let tile_val = 0;
    
    // DOMRect { x: 8, y: 386, width: 502, height: 202, top: 386, right: 510, bottom: 588, left: 8 }
    let bounds = tile_element.getBoundingClientRect();
    let tile_size = tile_element.style.backgroundSize; // "auto 200px"
    let tile_height = tile_size.split(" ")[1].replace('px','');
    //let tile_width = 1000*(tile_height/2000) // assuming that height is 200px, this will be 100px (scaled from 1000x2000)
    let tile_width = tile_height/2; // aspect ratio (1:2) should be preserved
    
    let num_per_row = Math.round(bounds.width / tile_width);
    let row_count = Math.round(bounds.height / tile_height);
    let icon_count = row_count * num_per_row;
    let icon_value = VALUE_PER_ICON;
    if (tile_element.hasAttribute('iconvalue')) {
        icon_value = tile_element.getAttribute('iconvalue');
    }
    tile_val = icon_count * icon_value;
    
    //if (tile_val == prev_val) return tile_val;
    TileValues.set(tile_element, tile_val);
    CounterMap.get(tile_element).Update(tile_val);
    UpdateCounterTotal();
    
    // adjusting for vertical scaling of the icons. (row_count+1) places it at the row instead of below
    let height_ratio = (bounds.height/((row_count+1)*tile_height));
    //console.log(`tile_height: ${tile_height} : ${height_ratio}`);
    //console.log(`new_height: ${tile_height*height_ratio}`);
    tile_height *= height_ratio;
    
    // TODO: still can't use relative positioning because they want to be relative to the text
    let vertOffset = bounds.top + window.scrollY;
    
    // adjusting position of each child element
    let elements = ElementMap.get(tile_element);
    for (const [target, threshold] of elements) {
        if (tile_val >= threshold) { target.removeAttribute("hidden");
            target.style.top = `${vertOffset+((tile_height*threshold)/num_per_row)}px`
        } else { target.setAttribute("hidden", true); }
    }
    
    // returning scrolled amount
    if (bounds.top >= 0) return 0; // not scrolled offscreen
    if (bounds.bottom <= 0) return tile_val; // fully offscreen
    return Math.min( tile_val, // clamped because scrolling is glitchy
        Math.round(((-bounds.top)/tile_height))*num_per_row*icon_value
    );
}

function UpdateAll() {
    for (const tile of TileValues.keys()) { ScrollVals.set(tile, CalculateTileValue(tile)); }
    UpdateScrollCounter();
}
