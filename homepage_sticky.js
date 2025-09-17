"use strict";

/**
 * Makes any .static[data-stickvp] element stay sticky for X viewport heights.
 * We wrap it in .static-wrap whose height is vp * 100vh.
 * Sibling (.flow) scrolls normally.
 */
(function initHomepageStickies() {
  const nodes = document.querySelectorAll(".static[data-stickvp]");

  // If any ancestor has overflow not visible, sticky can break.
  // We won't change overflow—just ensure our wrapper sits where sticky can work.
  const findOverflowBlocker = (el) => {
	let cur = el.parentElement;
	while (cur && cur !== document.body) {
	  const cs = getComputedStyle(cur);
	  const ov = cs.overflow + cs.overflowX + cs.overflowY;
	  if (/(auto|scroll|hidden|clip)/.test(ov)) return cur;
	  cur = cur.parentElement;
	}
	return null;
  };

  nodes.forEach((el) => {
	if (el.parentElement && el.parentElement.classList.contains("static-wrap")) return;

	const vp = Math.max(0.25, parseFloat(el.getAttribute("data-stickvp")) || 1);
	const topPx = parseFloat(String(el.getAttribute("data-sticktop") || "100").replace("px", "")) || 100;

	// Build wrapper
	const wrap = document.createElement("div");
	wrap.className = "static-wrap";
	wrap.style.setProperty("--vp", vp);

	// Insert wrapper next to the element (hoist if needed to escape overflow blockers)
	const blocker = findOverflowBlocker(el);
	if (blocker) blocker.parentElement.insertBefore(wrap, blocker);
	else el.parentElement.insertBefore(wrap, el);

	// Move element inside wrap and configure sticky top
	wrap.appendChild(el);
	el.style.top = `${topPx}px`;
	el.style.setProperty("--stick-top", `${topPx}px`);

	// Optional: simple “engaged / releasing” motion (CSS not required to use)
	const onScroll = () => {
	  const w = wrap.getBoundingClientRect();
	  const enters = w.top <= topPx;
	  const releases = w.bottom <= topPx + 1;

	  if (!enters) {
		el.classList.remove("is-engaged", "is-releasing");
	  } else if (enters && !releases) {
		el.classList.add("is-engaged");
		el.classList.remove("is-releasing");
	  } else if (releases) {
		el.classList.add("is-releasing");
	  }
	};
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("resize", onScroll);
	requestAnimationFrame(onScroll);
  });
})();
