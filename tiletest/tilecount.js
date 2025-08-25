VALUE_PER_TILE = 1;

const counterMap = new Map();
class CounterEntry {
    constructor(threshold, assoc_entry) {
        this.threshold = threshold
        this.assoc_entry = assoc_entry;
        this.assoc_entry.textContent = this.threshold;
    }
}

function UpdateCounterMap(counter_value) {
    for (const [element, entry] of counterMap.entries())
    {
        if (counter_value >= entry.threshold) {
            element.removeAttribute("hidden");
            entry.assoc_entry.setAttribute("class", "good");
        } else {
            element.setAttribute("hidden", true);
            assoc_entry.setAttribute("class", "bad");
        }
    }
}

function UpdateCounter() {
    style = window.getComputedStyle(counted);
    width = style.getPropertyValue('width').replace('px',''); // need to remove 'px' suffix before math operations
    height = style.getPropertyValue('height').replace('px','');
    tile_size = style.getPropertyValue('background-size'); // "auto 200px"
    tile_height = String(tile_size).split(" ")[1].replace('px','');
    //tile_width = 1000*(tile_height/2000) // assuming that height is 200px, this will be 100px (scaled from 1000x2000)
    tile_width = tile_height/2; // aspect ratio (1:2) should be preserved
    
    num_per_row = Math.round(width / tile_width);
    row_count = Math.round(height / tile_height);
    tile_count = row_count * num_per_row;
    total_value = tile_count * VALUE_PER_TILE;
    counter.innerHTML = total_value.toString() + '\u26A1kWh'; // unicode: U+26A1 'High Voltage Sign'
    UpdateCounterMap(total_value);
    
    var topbar_height = document.getElementById('topbar_info').clientHeight;
    for (const element of target_elements) {
        req_count = element.getAttribute("required_scrollcount");
        if (req_count > total_value) continue;
        element.style.top = topbar_height+((tile_height*req_count)/num_per_row) + "px";
    }
}
