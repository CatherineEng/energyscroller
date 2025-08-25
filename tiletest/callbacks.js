// import this script at the end of the HTML (after all elements are defined)

const counter = document.getElementById('counter');
const counted = document.getElementById('countme');

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
    for (element of target_elements) {
        let assoc_entry = list_entries[I++];
        let threshold = element.getAttribute("required_scrollcount");
        counterMap.set(element, new CounterEntry(threshold, assoc_entry));
    }
}

CreateThresholdEntries();
//console.log(counterMap);
UpdateCounterMap();

window.addEventListener('resize', UpdateCounter);
counted.addEventListener('mousemove', UpdateCounter);
