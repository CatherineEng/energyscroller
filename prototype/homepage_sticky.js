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

/**
 * Make elements INSIDE the scrolling `.flow` column stick for X viewport heights.
 * Opt-in: add class "flow-sticky" and data-flowstickvp="X" (and optional data-sticktop="px").
 *
 * Examples:
 *   <div class="flow-sticky" data-flowstickvp="3" data-sticktop="120">...</div>
 */
(function initFlowColumnStickies() {
  // You can scope this to a specific container if you have multiple .flow columns
  const flowContainers = document.querySelectorAll(".flow");
  const px = (v, fallback) =>
	(v == null ? fallback : parseFloat(String(v).replace("px", "")) || fallback);

  flowContainers.forEach((flow) => {
	const nodes = flow.querySelectorAll(".flow-sticky[data-flowstickvp]");
	nodes.forEach((el) => {
	  // Skip if we already wrapped this one
	  if (el.parentElement && el.parentElement.classList.contains("flow-sticky-wrap")) return;

	  const vp = Math.max(0.25, parseFloat(el.getAttribute("data-flowstickvp")) || 1);
	  const topPx = px(el.getAttribute("data-sticktop"), 100);

	  // Build wrapper right where the element lives, so normal flow continues
	  const wrap = document.createElement("div");
	  wrap.className = "flow-sticky-wrap";
	  wrap.style.setProperty("--vp", vp);

	  // Insert wrapper before the element and move the element inside
	  el.parentElement.insertBefore(wrap, el);
	  wrap.appendChild(el);

	  // Apply sticky offset
	  el.style.setProperty("--stick-top", `${topPx}px`);
	  el.style.top = `${topPx}px`;

	  // Preserve the element's vertical spacing by moving its margins to the wrapper
	  const cs = getComputedStyle(el);
	  const mt = cs.marginTop;
	  const mb = cs.marginBottom;
	  if (mt !== "0px" || mb !== "0px") {
		wrap.style.marginTop = mt;
		wrap.style.marginBottom = mb;
		el.style.marginTop = "0";
		el.style.marginBottom = "0";
	  }

	  // Motion states: enter when wrapper top crosses sticky line; exit when bottom crosses
	  const updateMotion = () => {
		const r = wrap.getBoundingClientRect();
		const enters = r.top <= topPx;
		const releases = r.bottom <= topPx + 1;

		if (!enters) {
		  el.classList.remove("is-engaged", "is-releasing");
		} else if (enters && !releases) {
		  el.classList.add("is-engaged");
		  el.classList.remove("is-releasing");
		} else if (releases) {
		  el.classList.add("is-releasing");
		}
	  };

	  window.addEventListener("scroll", updateMotion, { passive: true });
	  window.addEventListener("resize", updateMotion);
	  requestAnimationFrame(updateMotion);
	});
  });
})();
