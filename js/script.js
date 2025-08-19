var kwh = document.getElementById('kwh');
var thousand = document.getElementById('thousand');
var counter = document.getElementById('counter');
var scrollpercent = document.getElementById('scrollpercent');
var title = document.getElementById('title');
var html = document.getElementsByTagName('html');
var curve_wrapper_outer = document.getElementById('curve-wrapper-outer');
var url_params = new URLSearchParams(window.location.search);
var mute = url_params.get('mute');
var unscroll = url_params.get('unscroll');
var scroll_count = 0;

// ---- CONFIG for 10 px = 100,000 kWh ----
var TOTAL_KWH = 11150684931;  // your full-day total
var KWH_PER_PIXEL = 10000;    // 1 px = 10,000 kWh
var TICK_KWH = 100000;        // 10 px tick = 100,000 kWh
var LABEL_INTERVAL_PX = 100;  // every 100 px = 1,000,000 kWh

if (mute) html[0].classList.add('mute');
if (unscroll) html[0].classList.add('unscroll');


// update counters / progress on scroll
window.addEventListener('scroll', function() {
  var body = document.documentElement || document.body;
  var total_height = kwh.clientHeight;
  var scrollTop = (window.scrollY !== undefined) ? window.scrollY : body.scrollTop;
  var scroll_percent = ((scrollTop - kwh.offsetTop) * 100) / total_height;
  scroll_count = Math.floor(window.scrollY * KWH_PER_PIXEL);
  scrollpercent.innerText = scroll_percent.toFixed(6) + '% '
  counter.innerHTML = scroll_count.toLocaleString() + '⚡kWh'; // unicode: U+26A1 'High Voltage Sign'
});

function setHeight() {
  var browser_width = window.innerWidth || document.body.clientWidth;
  var icons_per_card = 200;
  var pixel_height_per_card = 500;
  var pixel_width_per_card = 400;

  var cards_per_row = browser_width / pixel_width_per_card;
  var icons_per_row = icons_per_card * cards_per_row;
  var number_of_rows = TOTAL_KWH / icons_per_row;

  //var height = Math.ceil(TOTAL_KWH / KWH_PER_PIXEL); // ~1,115,069 px tall
  //var height = Math.ceil(pixel_height_per_card * number_of_rows); // page never loads???????
  var height = 1115069; // TODO: actually calculate this value
  kwh.style.height = height + "px";

  if (!mute && thousand) {
    var thousand_height = Math.max(1, Math.floor(TICK_KWH / KWH_PER_PIXEL)); // = 10 px
    thousand.style.height = thousand_height + "px";
  }

  // ---- DRAW LEFT-SIDE RULER ----
  var existingRuler = document.getElementById('ruler');
  if (existingRuler) return;

  var ruler = document.createElement('div');
  ruler.id = 'ruler';
  ruler.style.position = 'absolute';
  ruler.style.left = '0';
  ruler.style.top = '0';
  ruler.style.width = '50px';
  ruler.style.height = height + 'px';
  ruler.style.borderRight = '0';
  ruler.style.fontSize = '10px';
  ruler.style.lineHeight = '1';
  ruler.style.color = '#11619a';
  ruler.style.pointerEvents = 'none';
  ruler.style.background = '#ffca89';

  // drawing left-side ruler
  // very expensive for performance
  for (var y = 0; y <= height; y += 10) {
    var tick = document.createElement('div');
    tick.style.position = 'absolute';
    tick.style.top = y + 'px';
    tick.style.left = '0';
    tick.style.width = (y % LABEL_INTERVAL_PX === 0) ? '10px' : '5px';
    tick.style.height = '1px';
    tick.style.background = '#11619a';
    ruler.appendChild(tick);

    if (y % LABEL_INTERVAL_PX === 0) {
      var label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = (y - 5) + 'px';
      label.style.left = '15px';
      label.textContent = ((y * KWH_PER_PIXEL) / 1000000).toLocaleString() + 'M kWh';
      ruler.appendChild(label);
    }
  }

  kwh.style.position = 'relative';
  kwh.appendChild(ruler);
}

setHeight();
window.addEventListener("orientationchange", setHeight);
window.addEventListener("resize", setHeight);