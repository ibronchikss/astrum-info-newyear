// Новогоднее оформление: снегопад, гирлянда, отсчёт до Нового года, кнопка включения.
(function () {
  "use strict";

  var KEY = "astrum-ny";
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* без хранилища просто не запоминаем */ }
  }
  function enabled() { return root.getAttribute("data-ny") !== "off"; }

  if (stored() === "off") root.setAttribute("data-ny", "off");

  // --- Гирлянда ------------------------------------------------------------
  var COLORS = ["#e63950", "#ffc857", "#2fb87a", "#4aa8ff", "#c77dff"];
  var STEP = 120;      // ширина одной «дуги» провода (совпадает с картинкой в CSS)
  var garland = document.createElement("div");
  garland.className = "ny-garland";
  garland.setAttribute("aria-hidden", "true");
  document.body.insertBefore(garland, document.body.firstChild);

  function buildGarland() {
    var width = root.clientWidth;
    var arcs = Math.ceil(width / STEP);
    var html = "";
    for (var a = 0; a < arcs; a++) {
      for (var k = 0; k < 3; k++) {
        var t = (k + 0.5) / 3;
        var x = a * STEP + t * STEP;
        var y = 3 + 68 * t * (1 - t); // высота провода в этой точке
        var n = a * 3 + k;
        html += '<i style="left:' + x.toFixed(1) + "px;top:" + (y + 1).toFixed(1) + "px;--c:" +
          COLORS[n % COLORS.length] + ";--d:-" + ((n * 0.55) % 2.4).toFixed(2) + 's"></i>';
      }
    }
    garland.innerHTML = html;
  }
  buildGarland();
  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildGarland, 150);
  });

  // --- Снегопад ------------------------------------------------------------
  var canvas = document.createElement("canvas");
  canvas.className = "ny-snow";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var flakes = [];
  var W = 0, H = 0, dpr = 1, raf = 0, last = 0;

  function resizeSnow() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    var count = Math.max(30, Math.min(110, Math.round(W / 14)));
    while (flakes.length < count) flakes.push(makeFlake(true));
    flakes.length = count;
  }

  function makeFlake(anywhere) {
    var r = 1 + Math.random() * 2.6;
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : -10,
      r: r,
      vy: 18 + r * 14 + Math.random() * 12,   // пикселей в секунду
      amp: 8 + Math.random() * 22,
      ph: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 0.9,
      o: 0.45 + Math.random() * 0.5
    };
  }

  function draw(now) {
    raf = requestAnimationFrame(draw);
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    var light = root.getAttribute("data-theme") === "light";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.y += f.vy * dt;
      f.ph += f.sp * dt;
      var x = f.x + Math.sin(f.ph) * f.amp;
      if (f.y > H + 10) { flakes[i] = makeFlake(false); continue; }
      ctx.beginPath();
      ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = light ? "rgba(255,255,255," + (f.o + 0.1) + ")" : "rgba(255,255,255," + f.o + ")";
      if (light) {
        ctx.shadowColor = "rgba(70,110,180,0.55)";
        ctx.shadowBlur = 3;
      } else {
        ctx.shadowColor = "rgba(190,215,255,0.8)";
        ctx.shadowBlur = 4;
      }
      ctx.fill();
    }
  }

  function startSnow() {
    if (reduce || raf || !enabled() || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(draw);
  }
  function stopSnow() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  resizeSnow();
  window.addEventListener("resize", resizeSnow);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopSnow(); else startSnow();
  });
  startSnow();

  // --- Кнопка ----------------------------------------------------------------
  var tools = document.querySelector(".header-tools");
  if (tools) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ny-toggle";
    btn.title = "Новогоднее оформление";
    btn.setAttribute("aria-label", "Включить или выключить новогоднее оформление");
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5 4.9 17.5"/><path d="m9.5 3.5 2.5 2 2.5-2M9.5 20.5l2.5-2 2.5 2"/></svg>';
    btn.addEventListener("click", function () {
      var on = enabled();
      root.setAttribute("data-ny", on ? "off" : "on");
      store(on ? "off" : "on");
      if (on) stopSnow(); else startSnow();
    });
    tools.insertBefore(btn, tools.firstChild);
  }

  // --- Отсчёт до Нового года --------------------------------------------------
  var box = document.querySelector(".ny-countdown");
  if (box) {
    var out = box.querySelector(".ny-countdown-time");
    var label = box.querySelector(".ny-countdown-label");
    var pad = function (n) { return n < 10 ? "0" + n : String(n); };
    var tick = function () {
      var now = new Date();
      var y = now.getFullYear();
      // с 1 по 7 января поздравляем, дальше считаем до следующего Нового года
      var greeting = now.getMonth() === 0 && now.getDate() <= 7;
      box.classList.toggle("is-done", greeting);
      if (greeting) {
        label.textContent = "Astrum поздравляет";
        out.innerHTML = "<b>С Новым " + y + " годом!</b>";
        return;
      }
      var left = new Date(y + 1, 0, 1) - now;
      var s = Math.max(0, Math.floor(left / 1000));
      var d = Math.floor(s / 86400);
      var h = Math.floor(s % 86400 / 3600);
      var m = Math.floor(s % 3600 / 60);
      label.textContent = "До Нового года";
      out.innerHTML = "<span><b>" + d + "</b><small>д</small></span><span><b>" + pad(h) +
        "</b><small>ч</small></span><span><b>" + pad(m) + "</b><small>м</small></span><span><b>" +
        pad(s % 60) + "</b><small>с</small></span>";
    };
    tick();
    setInterval(tick, 1000);
  }
})();
