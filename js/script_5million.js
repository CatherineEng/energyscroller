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

// ---- NEW CONFIG (add these) ----
var TOTAL_KWH = 11150684931;     // your full-day total (same as before)
var KWH_PER_PIXEL = 500000;      // 10 px tick = 5,000,000 kWh  → 1 px = 500,000 kWh
var TICK_KWH = 5000000;          // for convenience

if (mute) {
  html[0].classList.add('mute')
}
if (unscroll) {
  html[0].classList.add('unscroll')
}

if (!mute) {
  var citations = document.querySelectorAll('.citation');
  citations.forEach(function(citation, i){
    citation.innerHTML = i+1;
  })

  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting || entry.intersectionRatio > 0) {
        html[0].classList = (unscroll) ? "unscroll" : "";
        html[0].classList.add(entry.target.dataset.background);
      }
    })
  })
  document.querySelectorAll('[data-background]').forEach(function(target){
    observer.observe(target);
  });

  var until_recently_shown = false;
  var since_it_began_shown = false;

  var curveObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting || entry.intersectionRatio > 0) {
        if (entry.target.id === 'since-it-began') {
          since_it_began_shown = true;
        }
        if (entry.target.id === 'until-recently') {
          until_recently_shown = true;
        }
        if (entry.target.id === 'none-of-this') {
          since_it_began_shown = false;
          until_recently_shown = false;
          curve_wrapper_outer.classList.remove('stretched');
          curve_wrapper_outer.classList.remove('show-correlation');
        }
      }
      if (entry.target.id === 'until-recently'
        && !entry.isIntersecting
       && until_recently_shown === true) {
        if ((entry.target.offsetTop - window.scrollY - window.innerHeight) < 0) {
          curve_wrapper_outer.classList.add('stretched');
        }
        else {
          curve_wrapper_outer.classList.remove('stretched');
        }
      }

      if (entry.target.id === 'since-it-began'
        && !entry.isIntersecting
        && until_recently_shown === true) {
        if ((entry.target.offsetTop - window.scrollY - window.innerHeight) < 0) {
          curve_wrapper_outer.classList.add('show-correlation');
        }
        else {
          curve_wrapper_outer.classList.remove('show-correlation');
        }
      }
    })
  })
  document.querySelectorAll('.curve-section').forEach(function(target){
    curveObserver.observe(target);
  });
  var letterObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
      }
      else {
        entry.target.classList.remove('animate');
      }
    })
  })
  var letters = document.getElementById('animated-letters');
  letterObserver.observe(letters);

  function toggleExpand(outer, inner) {
    var outerEl = document.getElementById(outer);
    var innerEl = document.getElementById(inner);
    var offset = Math.abs(outerEl.offsetTop - innerEl.offsetTop);
    innerEl.style.top = offset + 'px';
    outerEl.classList.add('expanded')
  }

  function showTooltip(e) {
    var tooltip = e.parentElement.getElementsByClassName('tooltip')[0]
    tooltip.classList.add('open')
  }
  function closeTooltip(e) {
    e.parentElement.classList.remove('open');
  }
}

// ---- SHOW COUNTER AFTER ONE TICK (5,000,000 kWh) ----
window.addEventListener('scroll', function(e) {
  scroll_count = getScrollCount();
  if (scroll_count > TICK_KWH) {
    counter.innerHTML = scroll_count.toLocaleString();
  }
  else {
    counter.innerHTML = '';
  }
});

// ---- UPDATED: ENERGY-BASED SCROLL COUNT ----
function getScrollCount() {
  var body = document.documentElement || document.body;
  var total_height = kwh.clientHeight;

  // Progress of the bottom of the viewport through #kwh (0..1)
  var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : body.scrollTop;
  var scroll_percent = (scrollTop - kwh.offsetTop + window.innerHeight) / total_height;

  // Clamp to avoid negatives/overshoot
  if (scroll_percent < 0) scroll_percent = 0;
  if (scroll_percent > 1) scroll_percent = 1;

  var count = Math.floor(scroll_percent * TOTAL_KWH);
  return count;
}

// ---- UPDATED: HEIGHT FROM ENERGY, PLUS A 10 PX "TICK" BAR ----
function setHeight() {
  // Keep original locals (some CSS/layout may depend on them), but we’ll override height below
  var browser_width = window.innerWidth || document.body.clientWidth;
  var icons_per_card = 200;
  var pixel_height_per_card = 500;
  var pixel_width_per_card = 400;

  var cards_per_row = browser_width / pixel_width_per_card;
  var icons_per_row = icons_per_card * cards_per_row;
  var number_of_rows = TOTAL_KWH / icons_per_row;

  // NEW: energy-to-pixels mapping
  var height = Math.ceil(TOTAL_KWH / KWH_PER_PIXEL); // ≈ 22,180 px for 11.15B
  kwh.style.height = height + "px";

  if (!mute && thousand) {
    // Make #thousand a visual legend bar equal to ONE TICK (5,000,000 kWh = 10 px)
    var thousand_height = Math.max(1, Math.floor(TICK_KWH / KWH_PER_PIXEL)); // should be 10 px
    thousand.style.height = thousand_height + "px";
  }
}
setHeight();
window.addEventListener("orientationchange", setHeight);
window.addEventListener("resize", setHeight);