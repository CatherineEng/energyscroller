// import this script at the end of the HTML (after all elements are defined)

var counter = document.getElementById('counter');
var counted = document.getElementById('countme');

var target_elements = document.getElementsByClassName("testme");
var threshold_list = document.getElementById("threshold_list");
var list_entries = threshold_list.getElementsByTagName("li");

function CreateThresholdEntries() {
    while (list_entries.length < target_elements.length) {
        new_entry = document.createElement("li");
        new_entry.setAttribute("class","bad");
        threshold_list.appendChild(new_entry);
        // console.log(list_entries);
    }
    
    I = 0;
    for (element of target_elements) {
        assoc_entry = list_entries[I++];
        assoc_entry.textContent = element.getAttribute("required_scrollcount");
    }
    
}
// setup theshold-list
CreateThresholdEntries();
UpdateThresholdList();

// this flags prevents mousemove from spamming 'CounterUpdate' unless tile is actually being resized
function SetTileGrab() { IS_TILE_GRABBED = true;  /* console.log("grabbed"); */ }
function ReleaseTile() { IS_TILE_GRABBED = false; /* console.log("release"); */ }

//window.addEventListener('resize', CounterUpdate);
counted.addEventListener('mousedown', SetTileGrab);
counted.addEventListener('mousemove', CounterUpdate);
counted.addEventListener('mouseup', ReleaseTile);
