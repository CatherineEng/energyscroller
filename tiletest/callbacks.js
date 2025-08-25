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
        threshold = element.getAttribute("required_scrollcount");
        counterMap.set(element, new CounterEntry(threshold, assoc_entry));
    }
}

CreateThresholdEntries();
console.log(counterMap);
UpdateCounterMap();

window.addEventListener('resize', UpdateCounter);
counted.addEventListener('mousemove', UpdateCounter);
