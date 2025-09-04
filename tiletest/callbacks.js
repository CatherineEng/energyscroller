"use strict";
// import this script at the end of the HTML (after all elements are defined)

function InitializeElementMap()
{
    const tile_sources = document.getElementsByClassName("resizeable_tiling");
    console.log("tile sources: ", tile_sources);
    
    for (const tile_source of tile_sources) {
        // setting background-size if specified in HTML attribute
        if (tile_source.hasAttribute("tilesize")) {
            let tilesize = tile_source.getAttribute("tilesize");
            tile_source.style.backgroundSize = tilesize;
            console.log(`specified tilesize: ${tilesize}`);
        } else {
            tile_source.style.backgroundSize = getComputedStyle(tile_source).getPropertyValue('background-size');
            console.log(`default tilesize: ${tile_source.style.backgroundSize}`);
        }
        
        let tuplelist = [];
        let targetlist = tile_source.getElementsByClassName("testme");
        for (const target of targetlist) {
            let threshold = target.getAttribute("required_scrollcount");
            tuplelist.push([target, threshold]);
        }
        console.log("tuple_list: ", tuplelist);
        ElementMap.set(tile_source, tuplelist);
        TileValues.set(tile_source, 0);
        
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

function CreateElementButtons()
{
    const link_container = document.getElementById("jump_container");
    const targetElements = document.getElementsByClassName("target");
    
    let target_count = 1;
    for (const target of targetElements) {
        let button = document.createElement("button");
        button.textContent = `Element_${target_count}`;
        if (target.hasAttribute("name")) button.textContent = target.getAttribute("name");
        button.onclick = ScrollButtonCallback.bind(null, target);
        link_container.appendChild(button);
        target_count += 1;
    }
}


InitializeElementMap();
CreateElementButtons();
ConstructCounterTables();
console.log("ElementMap:", ElementMap);
console.log("CounterMap:", CounterMap);

window.addEventListener('resize', UpdateAll);
window.addEventListener('scroll', UpdateAll);
UpdateAll();
