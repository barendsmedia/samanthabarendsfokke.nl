// Animaties en navigatie. Wordt gestart door gate.js zodra de inhoud is ontsleuteld.
window.startCV = function () {
  if (window.__cvStarted) return;
  window.__cvStarted = true;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("yr").textContent = new Date().getFullYear();

  // Motto woord voor woord laten verschijnen
  var q = document.getElementById("quote"), i = 0;
  (function wrap(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement("span");
          s.className = "w"; s.style.setProperty("--i", i++); s.textContent = part;
          frag.appendChild(s);
        });
        n.parentNode.replaceChild(frag, n);
      } else wrap(n);
    });
  })(q);

  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var dots = document.getElementById("dots");
  var prog = document.getElementById("progress");

  slides.forEach(function (s) {
    var b = document.createElement("button");
    b.setAttribute("aria-label", s.dataset.title);
    b.title = s.dataset.title;
    b.addEventListener("click", function () { s.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); });
    dots.appendChild(b);
  });

  // Getallen laten optellen
  function countUp(el) {
    var to = +el.dataset.count, from = +(el.dataset.from || 0), t0 = null, dur = 1400;
    if (reduce) { el.textContent = to; return; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Onderdelen animeren zodra ze in beeld komen
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting && !en.target.classList.contains("in")) {
        en.target.classList.add("in");
        en.target.querySelectorAll("[data-count]").forEach(countUp);
      }
    });
  }, { threshold: 0.25 });
  slides.forEach(function (s) { io.observe(s); });

  // Navigatiebolletjes en voortgangsbalk
  var current = 0;
  function onScroll() {
    var mid = window.innerHeight / 2, idx = 0;
    slides.forEach(function (s, k) { if (s.getBoundingClientRect().top <= mid) idx = k; });
    current = idx;
    Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle("on", k === idx); });
    dots.classList.toggle("light", slides[idx].hasAttribute("data-dark"));
    var h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // Presenteren met het toetsenbord
  window.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT") return;
    var next = null;
    if (["ArrowDown", "PageDown", " ", "ArrowRight"].indexOf(e.key) > -1) next = Math.min(current + 1, slides.length - 1);
    if (["ArrowUp", "PageUp", "ArrowLeft"].indexOf(e.key) > -1) next = Math.max(current - 1, 0);
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = slides.length - 1;
    if (next !== null) { e.preventDefault(); slides[next].scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
  });
};
