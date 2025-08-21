VALUE_PER_TILE = 1;


function CheckScrollCountRequirement(element, current_value){
    req_count = element.getAttribute("required_scrollcount");
    if (current_value >= req_count) {
        console.log("hit scrollcount!");
        element.removeAttribute("hidden");
    } else {
        element.setAttribute("hidden",true);
    }
    // TODO: actually adjust the position here
    return req_count;
}


// iterates through elements and matches their position to their scrollcount-threshold
function AdjustAllThings(current_value) {
    target_elements = document.getElementsByClassName("testme");
    threshold_list = document.getElementById("threshold_list");
    list_entries = threshold_list.getElementsByTagName("li");
    while (list_entries.length < target_elements.length) {
        new_entry = document.createElement("li");
        new_entry.setAttribute("class","bad");
        threshold_list.appendChild(new_entry);
        console.log(list_entries);
    }
    
    I = 0;
    for (element of target_elements) {
        r=CheckScrollCountRequirement(element, current_value);
        assoc_entry = list_entries[I++];
        if (current_value >= req_count)
            assoc_entry.setAttribute("class", "good");
        else assoc_entry.setAttribute("class", "bad");
        assoc_entry.textContent = req_count;
    }
}


// update counters/progress when mousebutton is released (resize finished)
window.addEventListener('mouseup', function() {
    var counter = document.getElementById('counter');
    var counted = document.getElementById('countme');
    // these ^ must be set here, not in global scope (elements are undefined when script is imported)
    
    style = window.getComputedStyle(counted);
    width = style.getPropertyValue('width').replace('px',''); // need to remove 'px' suffix before math operations
    height = style.getPropertyValue('height').replace('px','');
    tile_size = style.getPropertyValue('background-size'); // "auto 200px"
    tile_width = 100 // assuming that height is 200px, this will be 100px (scaled from 1000x2000)
    tile_height = String(tile_size).split(" ")[1].replace('px','');
    
    num_per_row = Math.round(width / tile_width);
    row_count = Math.round(height / tile_height);
    tile_count = row_count * num_per_row;
    total_value = tile_count * VALUE_PER_TILE;
    counter.innerHTML = total_value.toString() + '⚡kWh'; // unicode: U+26A1 'High Voltage Sign'
    
    AdjustAllThings(total_value);
});
