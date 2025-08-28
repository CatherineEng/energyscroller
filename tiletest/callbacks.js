// import this script at the end of the HTML (after all elements are defined)

const counter = document.getElementById('counter');
const counted = document.getElementById('countme');

const tiling_things = document.getElementsByClassName("resizeable_tiling");
const target_elements = document.getElementsByClassName("testme");
const threshold_list = document.getElementById("threshold_list");
const list_entries = threshold_list.getElementsByTagName("li");

function CreateThresholdEntries() {
    while (list_entries.length < target_elements.length) {
        const new_entry = document.createElement("li");
        new_entry.setAttribute("class","bad");
        threshold_list.appendChild(new_entry);
        // console.log(list_entries);
    }
    
    let I = 0;
    for (const element of target_elements) {
        let assoc_entry = list_entries[I++];
        let threshold = element.getAttribute("required_scrollcount");
        counterMap.set(element, new CounterEntry(threshold, assoc_entry));
    }
    
    // setting background-size if specified in HTML attribute
    for (const thing of tiling_things) {
        if (thing.getAttribute("tilesize")) {
            console.log(`tilesize: ${thing.getAttribute("tilesize")}`);
            thing.style.backgroundSize = thing.getAttribute("tilesize");
        }
    }
}

CreateThresholdEntries();
//console.log(counterMap);
UpdateCounterMap();

window.addEventListener('resize', UpdateCounter);
counted.addEventListener('mousemove', UpdateCounter);
