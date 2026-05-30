/* Coop — static site behavior (vanilla, no build step) */
(function () {
  "use strict";

  /* ---- sticky header state ---------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- mobile menu ------------------------------------------------------- */
  var menu = document.querySelector(".mobile-menu");
  var openBtn = document.querySelector(".nav-toggle");
  var closeEls = document.querySelectorAll("[data-close-menu]");
  if (menu && openBtn) {
    var setMenu = function (open) {
      menu.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    openBtn.addEventListener("click", function () { setMenu(true); });
    closeEls.forEach(function (el) { el.addEventListener("click", function () { setMenu(false); }); });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* ---- scroll reveal ----------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.getAttribute("data-delay");
          if (delay) el.style.transitionDelay = delay + "ms";
          el.classList.add("in");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- build waveforms --------------------------------------------------- */
  document.querySelectorAll(".waveform").forEach(function (wf) {
    var bars = parseInt(wf.getAttribute("data-bars") || "44", 10);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < bars; i++) {
      var seed = Math.sin(i * 12.9898) * 43758.5453;
      var base = 0.25 + Math.abs(seed - Math.floor(seed)) * 0.75;
      var span = document.createElement("span");
      span.style.height = (base * 100) + "%";
      span.style.animationDuration = (1.1 + (i % 5) * 0.18) + "s";
      span.style.animationDelay = (i * 0.045) + "s";
      frag.appendChild(span);
    }
    wf.appendChild(frag);
  });

  /* ---- FAQ accordion ----------------------------------------------------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-question");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      item.closest(".faq").querySelectorAll(".faq-item.open").forEach(function (o) {
        o.classList.remove("open");
        o.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---- footer year ------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- form: set _next redirect URL dynamically -------------------------- */
  var base = window.location.href.split("?")[0].split("#")[0];
  document.querySelectorAll("[data-next-url]").forEach(function (el) {
    el.value = base + "?submitted=1";
  });

  /* ---- form: show success state on redirect back ------------------------- */
  if (new URLSearchParams(window.location.search).get("submitted") === "1") {
    var successHTML =
      '<div class="form-success">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
      '<h3>Thank you — message received.</h3>' +
      '<p>We\'ll review your note and get back to you within a few days.</p>' +
      '</div>';
    document.querySelectorAll("[data-form-wrap]").forEach(function (wrap) {
      wrap.innerHTML = successHTML;
    });
    history.replaceState(null, "", window.location.pathname + "#contact");
  }
})();
