function toggleExpand(outer, inner) {
  var outerEl = document.getElementById(outer);
  var innerEl = document.getElementById(inner);
  //var offset = Math.abs(outerEl.offsetTop - innerEl.offsetTop);
  //innerEl.style.top = offset + 'px';
  outerEl.classList.add('expanded');
  innerEl.classList.add('expanded');
}

