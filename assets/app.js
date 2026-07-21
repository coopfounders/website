/* Coop — hero scroll sequence, facility dots, scroll reveals, stat
   placeholders, and the click-to-load demo video. Nothing in this file makes
   a third-party request until the visitor explicitly clicks play on the demo
   video. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var clamp01 = function (v) {
    return Math.min(1, Math.max(0, v));
  };

  var smooth = function (t) {
    return t * t * (3 - 2 * t);
  };

  var ramp = function (p, s, e) {
    return clamp01((p - s) / (e - s));
  };

  /* --- hero: facility map dots + scroll-driven boot sequence --------------- */

  var facility = document.querySelector(".hero-map");
  var hero = document.querySelector(".hero");
  var stage = document.querySelector(".hero-stage");

  if (facility && hero && stage) {
    var dots = Array.prototype.slice.call(facility.querySelectorAll(".dot"));
    var routes = {};
    Array.prototype.forEach.call(facility.querySelectorAll(".route"), function (p) {
      routes[p.getAttribute("data-route")] = p;
    });

    var place = function (dot, frac) {
      var path = routes[dot.getAttribute("data-route")];
      if (!path) return;
      var pt = path.getPointAtLength(frac * path.getTotalLength());
      dot.setAttribute("cx", pt.x);
      dot.setAttribute("cy", pt.y);
    };

    /* scroll scrub: corridors draw, rooms surface, copy resolves */

    var scrubMq = window.matchMedia("(min-width: 761px)");
    var scrubOn = false;
    var drawParts = [];
    var fadeParts = [];
    var fadeOutParts = [];

    var initScrub = function () {
      document.documentElement.classList.add("scrub");
      drawParts = [];
      Array.prototype.forEach.call(facility.querySelectorAll("[data-draw]"), function (el) {
        var win = el.getAttribute("data-draw").split(",");
        var len = el.getTotalLength();
        el.style.strokeDasharray = len + " " + len;
        el.style.strokeDashoffset = len;
        drawParts.push({ el: el, len: len, s: +win[0], e: +win[1] });
      });
      fadeParts = [];
      Array.prototype.forEach.call(hero.querySelectorAll("[data-fade]"), function (el) {
        var win = el.getAttribute("data-fade").split(",");
        fadeParts.push({ el: el, s: +win[0], e: +win[1], rise: el.hasAttribute("data-rise") });
      });
      fadeOutParts = [];
      Array.prototype.forEach.call(hero.querySelectorAll("[data-fade-out]"), function (el) {
        var win = el.getAttribute("data-fade-out").split(",");
        fadeOutParts.push({ el: el, s: +win[0], e: +win[1] });
      });
      scrubOn = true;
    };

    var teardownScrub = function () {
      document.documentElement.classList.remove("scrub");
      drawParts.forEach(function (d) {
        d.el.style.strokeDasharray = "";
        d.el.style.strokeDashoffset = "";
      });
      fadeParts.forEach(function (f) {
        f.el.style.opacity = "";
        f.el.style.transform = "";
        f.el.style.visibility = "";
      });
      fadeOutParts.forEach(function (f) {
        f.el.style.opacity = "";
      });
      facility.style.transform = "";
      scrubOn = false;
    };

    var applyScrub = function () {
      var rect = hero.getBoundingClientRect();
      var span = rect.height - stage.offsetHeight;
      var p = span > 0 ? clamp01(-rect.top / span) : 1;

      drawParts.forEach(function (d) {
        d.el.style.strokeDashoffset = d.len * (1 - ramp(p, d.s, d.e));
      });
      fadeParts.forEach(function (f) {
        var r = smooth(ramp(p, f.s, f.e));
        f.el.style.opacity = r;
        f.el.style.visibility = r <= 0.01 ? "hidden" : "visible";
        if (f.rise) {
          f.el.style.transform = "translateY(" + (1 - r) * 26 + "px)";
        }
      });
      fadeOutParts.forEach(function (f) {
        f.el.style.opacity = 1 - ramp(p, f.s, f.e);
      });
      facility.style.transform = "scale(" + (1.05 - 0.05 * smooth(ramp(p, 0, 0.5))) + ")";
    };

    if (reduceMotion) {
      /* freeze the dots at rest along their routes; hero stays fully composed */
      var restStops = [0.35, 0.62, 0.8, 0.5];
      dots.forEach(function (dot, i) {
        place(dot, restStops[i % restStops.length]);
      });
    } else {
      if (scrubMq.matches) initScrub();
      var onMqChange = function (ev) {
        if (ev.matches && !scrubOn) initScrub();
        else if (!ev.matches && scrubOn) teardownScrub();
      };
      if (scrubMq.addEventListener) scrubMq.addEventListener("change", onMqChange);
      else if (scrubMq.addListener) scrubMq.addListener(onMqChange);

      var DWELL = 0.09; /* fraction of each leg spent paused at a node */
      var tick = function (now) {
        dots.forEach(function (dot) {
          var dur = parseFloat(dot.getAttribute("data-dur")) * 1000;
          var offset = parseFloat(dot.getAttribute("data-offset")) * 1000;
          var phase = ((now + offset) % dur) / dur; /* 0..1 out, back */
          var leg = phase < 0.5 ? phase / 0.5 : (1 - phase) / 0.5;
          var t = clamp01((leg - DWELL) / (1 - 2 * DWELL));
          place(dot, smooth(t));
        });
        if (scrubOn) applyScrub();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  /* --- scroll reveal (sections below the hero) ----------------------------- */
  /* The .reveal-on gate means content stays fully visible without JS or when
     the visitor prefers reduced motion. */

  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("reveal-on");
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-reveal]"),
      function (el) {
        revealObserver.observe(el);
      }
    );
  }

  /* --- value stats: digits spin, then settle on the placeholder ----------- */

  var figures = document.querySelectorAll(".stat-figure");
  if (figures.length && !reduceMotion && "IntersectionObserver" in window) {
    var animateFigure = function (el) {
      var finalText = el.textContent;
      var chars = finalText.split("");
      var slots = [];
      chars.forEach(function (ch, i) {
        if (ch === "X") slots.push(i);
      });
      if (!slots.length) return;

      var start = null;
      var step = function (now) {
        if (start === null) start = now;
        var elapsed = now - start;
        var done = true;
        var out = chars.slice();
        slots.forEach(function (idx, n) {
          var settleAt = 450 + n * 200;
          if (elapsed < settleAt) {
            out[idx] = String(Math.floor(Math.random() * 10));
            done = false;
          } else {
            out[idx] = "X";
          }
        });
        el.textContent = out.join("");
        if (!done) {
          requestAnimationFrame(step);
        } else {
          el.textContent = finalText;
        }
      };
      requestAnimationFrame(step);
    };

    var seen = new WeakSet();
    var statObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !seen.has(entry.target)) {
            seen.add(entry.target);
            animateFigure(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    Array.prototype.forEach.call(figures, function (el) {
      statObserver.observe(el);
    });
  }

  /* --- demo video: inject the YouTube iframe only after a click ----------- */
  /* Set data-video-id on .video-shell to the YouTube video id when the real
     demo is ready. Until then the play button is present but inert. */

  var shell = document.querySelector(".video-shell");
  if (shell) {
    var play = shell.querySelector(".video-play");
    play.addEventListener("click", function () {
      var id = shell.getAttribute("data-video-id");
      if (!id) return;
      var frame = document.createElement("iframe");
      frame.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(id) +
        "?autoplay=1&rel=0";
      frame.title = "Coop 90-second demo";
      frame.allow = "autoplay; encrypted-media; picture-in-picture";
      frame.setAttribute("allowfullscreen", "");
      shell.textContent = "";
      shell.appendChild(frame);
    });
  }
})();
