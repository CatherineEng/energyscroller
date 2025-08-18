var kwh = document.getElementById('kwh');
var thousand = document.getElementById('thousand');
var counter = document.getElementById('counter');
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

if (!mute) {
  var citations = document.querySelectorAll('.citation');
  citations.forEach(function(citation, i){
    citation.innerHTML = i+1;
  });

  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting || entry.intersectionRatio > 0) {
        html[0].classList = (unscroll) ? "unscroll" : "";
        html[0].classList.add(entry.target.dataset.background);
      }
    })
  });
  document.querySelectorAll('[data-background]').forEach(function(target){
    observer.observe(target);
  });

  var until_recently_shown = false;
  var since_it_began_shown = false;

  var curveObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting || entry.intersectionRatio > 0) {
        if (entry.target.id === 'since-it-began') since_it_began_shown = true;
        if (entry.target.id === 'until-recently') until_recently_shown = true;
        if (entry.target.id === 'none-of-this') {
          since_it_began_shown = false;
          until_recently_shown = false;
          curve_wrapper_outer.classList.remove('stretched', 'show-correlation');
        }
      }
      if (entry.target.id === 'until-recently'
        && !entry.isIntersecting
       && until_recently_shown === true) {
        if ((entry.target.offsetTop - window.scrollY - window.innerHeight) < 0) {
          curve_wrapper_outer.classList.add('stretched');
        } else {
          curve_wrapper_outer.classList.remove('stretched');
        }
      }

      if (entry.target.id === 'since-it-began'
        && !entry.isIntersecting
        && until_recently_shown === true) {
        if ((entry.target.offsetTop - window.scrollY - window.innerHeight) < 0) {
          curve_wrapper_outer.classList.add('show-correlation');
        } else {
          curve_wrapper_outer.classList.remove('show-correlation');
        }
      }
    })
  });
  document.querySelectorAll('.curve-section').forEach(function(target){
    curveObserver.observe(target);
  });

  var letterObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
      } else {
        entry.target.classList.remove('animate');
      }
    })
  });
  var letters = document.getElementById('animated-letters');
  letterObserver.observe(letters);

  function toggleExpand(outer, inner) {
    var outerEl = document.getElementById(outer);
    var innerEl = document.getElementById(inner);
    var offset = Math.abs(outerEl.offsetTop - innerEl.offsetTop);
    innerEl.style.top = offset + 'px';
    outerEl.classList.add('expanded');
  }

  function showTooltip(e) {
    var tooltip = e.parentElement.getElementsByClassName('tooltip')[0];
    tooltip.classList.add('open');
  }
  function closeTooltip(e) {
    e.parentElement.classList.remove('open');
  }
}

// ---- SHOW COUNTER AFTER ONE TICK (100,000 kWh) ----
window.addEventListener('scroll', function(e) {
  scroll_count = getScrollCount();
  if (scroll_count > TICK_KWH) {
    counter.innerHTML = scroll_count.toLocaleString();
  } else {
    counter.innerHTML = '';
  }
});

function getScrollCount() {
  var body = document.documentElement || document.body;
  var total_height = kwh.clientHeight;
  var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : body.scrollTop;
  var scroll_percent = (scrollTop - kwh.offsetTop + window.innerHeight) / total_height;
  if (scroll_percent < 0) scroll_percent = 0;
  if (scroll_percent > 1) scroll_percent = 1;
  var count = Math.floor(scroll_percent * TOTAL_KWH);
  return count;
}

function setHeight() {
  var browser_width = window.innerWidth || document.body.clientWidth;
  var icons_per_card = 200;
  var pixel_height_per_card = 500;
  var pixel_width_per_card = 400;

  var cards_per_row = browser_width / pixel_width_per_card;
  var icons_per_row = icons_per_card * cards_per_row;
  var number_of_rows = TOTAL_KWH / icons_per_row;

  var height = Math.ceil(TOTAL_KWH / KWH_PER_PIXEL); // ~1,115,069 px tall
  kwh.style.height = height + "px";

  if (!mute && thousand) {
    var thousand_height = Math.max(1, Math.floor(TICK_KWH / KWH_PER_PIXEL)); // = 10 px
    thousand.style.height = thousand_height + "px";
  }

  // ---- DRAW LEFT-SIDE RULER ----
  var existingRuler = document.getElementById('ruler');
  if (existingRuler) existingRuler.remove();

  var ruler = document.createElement('div');
  ruler.id = 'ruler';
  ruler.style.position = 'absolute';
  ruler.style.left = '0';
  ruler.style.top = '0';
  ruler.style.width = '50px';
  ruler.style.height = height + 'px';
  ruler.style.borderRight = '1px solid #999';
  ruler.style.fontSize = '10px';
  ruler.style.lineHeight = '1';
  ruler.style.color = '#666';
  ruler.style.pointerEvents = 'none';
  ruler.style.background = 'transparent';

  for (var y = 0; y <= height; y += 10) {
    var tick = document.createElement('div');
    tick.style.position = 'absolute';
    tick.style.top = y + 'px';
    tick.style.left = '0';
    tick.style.width = (y % LABEL_INTERVAL_PX === 0) ? '10px' : '5px';
    tick.style.height = '1px';
    tick.style.background = '#999';
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