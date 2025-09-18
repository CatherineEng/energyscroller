"use strict";
// import this script at the end of the HTML (after all elements are defined)

// global toggle for jump buttons
const JUMP_TARGETS_ENABLED = true;

// calculates the necessary height for sections with 'energy' attribute
function SetSectionHeight(tile_element, energy_count)
{
    let bounds = tile_element.getBoundingClientRect();
    let icon_size = tile_element.style.backgroundSize; // "auto 200px"
    let icon_sizes = icon_size.split(" ");
    let icon_height = 2000;
    let icon_width = icon_sizes[0].replace('px', '');
    if (icon_sizes.length == 2) {
        icon_height = icon_sizes[1].replace('px','');
    } else { icon_height = 2000*(icon_width/1000); }
    if (icon_width == "auto") {
        icon_width = icon_height/2; // aspect ratio (1:2) should be preserved
        //let icon_width = 1000*(icon_height/2000) // assuming that height is 200px, this will be 100px (scaled from 1000x2000)
    }
    
    let icon_value = VALUE_PER_ICON;
    if (tile_element.hasAttribute('iconvalue')) {
        icon_value = tile_element.getAttribute('iconvalue') * icon_value;
    }
    
    let num_per_row = Math.round(bounds.width / icon_width);
    let val_per_row = (icon_value*num_per_row);
    let row_count = (energy_count/val_per_row);
    let new_height = Math.round(row_count * icon_height);
    let current_style = tile_element.getAttribute("style");
    tile_element.setAttribute("style", `${current_style} height: ${new_height}px;`); // later values override earlier ones
}

function InitializeElementMap(enableJumpTargets)
{
    const tile_sources = document.getElementsByClassName("resizeable_tiling");
    console.log("tile sources: ", tile_sources);
    
    let section_count = 0;
    for (const tile_source of tile_sources)
    { // auto-assigning name from 'name'/'id' attribute; fallback to sequential
        let section_name = `Section_${section_count++}`;
        if (tile_source.hasAttribute("name"))
            section_name = tile_source.getAttribute("name");
        else if (tile_source.hasAttribute("id"))
            { section_name = tile_source.getAttribute("id"); }
        else tile_source.setAttribute("name", section_name);
        
        // setting background-size if specified in HTML attribute
        if (tile_source.hasAttribute("tilesize")) {
            let tilesize = tile_source.getAttribute("tilesize");
            tile_source.style.backgroundSize = tilesize;
            console.log(`specified tilesize: ${tilesize}`);
        } else {
            tile_source.style.backgroundSize = getComputedStyle(tile_source).getPropertyValue('background-size');
            console.log(`default tilesize: ${tile_source.style.backgroundSize}`);
        }
        
        if (tile_source.hasAttribute("energy")) {
            let energy_val = ParseSuffix(tile_source.getAttribute("energy"));
            
            // inserting a jump-target before section if it doesn't contain one already
            // TODO: this wouldn't be necessary if it was possible to jump to 'tiling' elements (for some reason it's not)
            if (tile_source.getElementsByClassName("target").length == 0) {
                let jumpTarget = document.createElement("div");
                jumpTarget.setAttribute("name", section_name);
                jumpTarget.className = "target";
                
                let section_text = `${section_name}
                This section contains ${energy_val} kWh`
                if (tile_source.hasAttribute('iconvalue')) {
                    let icon_value = tile_source.getAttribute('iconvalue');
                    section_text = `${section_text}
                    ${energy_val/icon_value} icons (x${icon_value} kWh per icon)`
                }
                
                jumpTarget.innerText = section_text;
                if (enableJumpTargets) tile_source.parentNode.insertBefore(jumpTarget, tile_source);
            }
            
            window.addEventListener("resize", SetSectionHeight.bind(null, tile_source, energy_val));
            // updating section-height on window-resize is necessary to maintain correct energy total
            // TODO: find something more efficient than spamming new 'height' values into element style
            SetSectionHeight(tile_source, energy_val);
        }
        
        let tuplelist = [];
        for (const target of tile_source.getElementsByClassName("card"))
        {
            if (!target.hasAttribute("scrollstart")){target.setAttribute("scrollstart",0); }
            if (!target.hasAttribute("scrollend")) { target.setAttribute("scrollend", -1); }
            if (!target.hasAttribute("sticky_vh")) { target.setAttribute("sticky_vh",250); }
            
            let start_val = ParseSuffix(target.getAttribute("scrollstart"));
            let final_val = ParseSuffix(target.getAttribute("scrollend"));
            let sticky_vh = target.getAttribute("sticky_vh"); // page height of element when it sticks
            tuplelist.push([target, start_val, final_val, sticky_vh]);
        }
        
        ElementMap.set(tile_source, tuplelist);
        TileValues.set(tile_source, 0);
        
        // somehow removing this doesn't affect performance at all!??
        tile_source.addEventListener('mousemove', CalculateTileValue.bind(null, tile_source));
    }
}

function ConstructCounterTables()
{
    const table_container = document.getElementById("table_container");
    const tile_sources = document.getElementsByClassName("resizeable_tiling");
    
    let table_counter = 1;
    for (const tile_source of tile_sources) {
        const table = document.createElement("table");
        table.setAttribute("class","threshold_table");
        
        let table_name = `Table_${table_counter++}`;
        if (tile_source.hasAttribute("name"))
            table_name = tile_source.getAttribute("name");
        
        const header = document.createElement("th");
        header.innerHTML = `<a class="table_counter">0\u26A1</a> ${table_name}`; // inline table-counter
        if (tile_source.hasAttribute('iconvalue'))
            header.innerHTML = `<a class="table_counter">0\u26A1</a> ${table_name} (x${tile_source.getAttribute('iconvalue')})`;
        // the counter MUST come before the name for proper layout
        // escaped sequence is unicode: U+26A1 'High Voltage Sign'
        
        // for proper layout, the header must be nested inside a 'tbody' element,
        // then 'li' elements (rows) inserted afterward (outside closing <tbody>)
        const table_body = document.createElement("tbody");
        table.appendChild(table_body);
        table_body.appendChild(header);
        table_container.appendChild(table);
        
        CounterMap.set(tile_source, new CounterTable(table, tile_source));
    }
}

function ScrollButtonCallback(target) {
    let bounds = target.getBoundingClientRect();
    /* modifying the Y-offset to be absolute instead of relative; 'scrollTo' interprets it as an absolute position.
    without this adjustment, buttons for onscreen elements would scroll to the top of the page (bounds.Y < scrollY) */
    bounds.y += window.scrollY - (bounds.height/2); // (height/2) offset keeps the entire element onscreen
    console.log(`scrolling: ${bounds.y}`);
    window.scrollTo(bounds);
}

function CreateElementButtons(enableJumpTargets)
{
    const link_container = document.getElementById("jump_container");
    const targetElements = document.getElementsByClassName("target");
    if (!enableJumpTargets) { link_container.setAttribute("hidden", true); return; }
    
    let target_count = 1;
    for (const target of targetElements) {
        let button = document.createElement("button");
        button.textContent = `Element_${target_count}`;
        if (target.hasAttribute("name")) button.textContent = target.getAttribute("name");
        else if (target.hasAttribute("id")) button.textContent = target.getAttribute("id");
        button.onclick = ScrollButtonCallback.bind(null, target);
        link_container.appendChild(button);
        target_count += 1;
    }
}


InitializeElementMap(JUMP_TARGETS_ENABLED);
CreateElementButtons(JUMP_TARGETS_ENABLED);
ConstructCounterTables();
console.log("ElementMap:", ElementMap);
console.log("CounterMap:", CounterMap);

window.addEventListener('resize', UpdateAll);
window.addEventListener('scroll', UpdateAll);
UpdateAll();
