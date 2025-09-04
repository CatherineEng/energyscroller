const tile_sources = document.getElementsByClassName("resizeable_tiling");
let tile_source = tile_sources[0];

// there isn't any resize-related event that can be listened to, but maybe this could work?
const resizeObserver = new ResizeObserver((entryArray) => console.log("resized: ", entryArray[0]));
resizeObserver.observe(tile_source);
// this may infinite-loop once it's connected to CalculateTileValue??
// https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
// https://developer.mozilla.org/en-US/docs/Web/API/Resize_Observer_API

// add logging for all events
for (const key in tile_source) {
    if (key.search('on') === 0) {
        console.log(key.slice(2)); // all keys start with 'on' - remove that prefix
        //if ((key.slice(2) == "mousemove") || (key.slice(2) == "pointermove")) continue;
        tile_source.addEventListener(key.slice(2), (event) => console.log(event));
    }
}
