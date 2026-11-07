/* Blackstar — site interactions. Built by Nexlyr Solutions.
   Works without GSAP/Lenis (progressive); uses them when present. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, W = window;
  var SELF = (d.currentScript && d.currentScript.src) || location.href;
  var reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = W.matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---------- hours / open-now (Whitefish = America/Denver) ---------- */
  // 0 = Sunday. [open, close] in 24h.
  var HOURS = { 0: [11, 21], 1: [11, 21], 2: [11, 21], 3: [11, 21], 4: [11, 22], 5: [11, 22], 6: [11, 22] };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function mtNow() {
    try {
      var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
      var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
      return { day: wd, h: (+o.hour % 24) + (+o.minute) / 60, hh: +o.hour % 24, mm: +o.minute };
    } catch (e) { var n = new Date(); return { day: n.getDay(), h: n.getHours() + n.getMinutes() / 60, hh: n.getHours(), mm: n.getMinutes() }; }
  }
  function fmt(h) { var s = h >= 12 ? 'PM' : 'AM'; var x = h % 12 || 12; return x + ' ' + s; }
  function status() {
    var n = mtNow(), t = HOURS[n.day];
    if (n.h >= t[0] && n.h < t[1]) return { open: true, text: 'Open now · until ' + fmt(t[1]) };
    if (n.h < t[0]) return { open: false, text: 'Opens today at ' + fmt(t[0]) };
    var nx = HOURS[(n.day + 1) % 7];
    return { open: false, text: 'Closed · opens ' + fmt(nx[0]) + ' tomorrow' };
  }
  function paintStatus() {
    var s = status();
    $$('[data-open]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      var t = $('[data-open-txt]', el); if (t) t.textContent = el.hasAttribute('data-short') ? (s.open ? 'Open now' : 'Closed now') : s.text;
    });
    var day = mtNow().day;
    $$('.hours [data-day]').forEach(function (r) { r.classList.toggle('today', +r.getAttribute('data-day') === day); });
    $$('[data-clock]').forEach(function (c) { var n = mtNow(); c.textContent = 'Whitefish ' + String(n.hh).padStart(2, '0') + ':' + String(n.mm).padStart(2, '0') + ' MT'; });
  }
  paintStatus(); setInterval(paintStatus, 30000);

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (!reduce && W.Lenis) {
    lenis = new W.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    W.__lenis = lenis;
    if (W.gsap && W.ScrollTrigger) {
      lenis.on('scroll', W.ScrollTrigger.update);
      W.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      W.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  function scrollToEl(el, off) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: off || -90, duration: 1.2 });
    else W.scrollTo({ top: el.getBoundingClientRect().top + W.scrollY + (off || -90), behavior: reduce ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = d.getElementById(id.slice(1)); if (!t) return;
      e.preventDefault(); scrollToEl(t); history.replaceState(null, '', id);
    });
  });

  /* ---------- progress + nav state ---------- */
  var nav = $('.nav'), prog = $('.progress'), lastY = W.scrollY, ticking = false;
  function onScroll() {
    var y = W.scrollY, max = root.scrollHeight - innerHeight;
    if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (nav) {
      nav.classList.toggle('is-solid', y > 40);
      var goingDown = y > lastY + 4, goingUp = y < lastY - 4;
      if (goingDown && y > 500 && !root.classList.contains('menu-open') && !$('.nav__dd.is-open')) nav.classList.add('is-hidden');
      else if (goingUp || y < 200) nav.classList.remove('is-hidden');
    }
    lastY = y; ticking = false;
    fillWords();
  }
  W.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- dropdowns (nav) ---------- */
  $$('.nav__dd').forEach(function (dd) {
    var btn = $('button', dd), timer;
    function open(v) { dd.classList.toggle('is-open', v); btn.setAttribute('aria-expanded', v ? 'true' : 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); open(!dd.classList.contains('is-open')); });
    if (finePointer) {
      dd.addEventListener('mouseenter', function () { clearTimeout(timer); open(true); });
      dd.addEventListener('mouseleave', function () { timer = setTimeout(function () { open(false); }, 180); });
    }
    dd.addEventListener('keydown', function (e) {
      var items = $$('.dd a', dd), i = items.indexOf(d.activeElement);
      if (e.key === 'Escape') { open(false); btn.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); open(true); (items[i + 1] || items[0]).focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
    });
    dd.addEventListener('focusout', function (e) { if (!dd.contains(e.relatedTarget)) open(false); });
  });
  d.addEventListener('click', function () { $$('.nav__dd.is-open').forEach(function (x) { x.classList.remove('is-open'); }); });

  /* ---------- mobile panel ---------- */
  var burger = $('.burger'), panel = $('.mpanel');
  function setMenu(v) {
    root.classList.toggle('menu-open', v);
    if (burger) { burger.setAttribute('aria-expanded', v ? 'true' : 'false'); burger.setAttribute('aria-label', v ? 'Close menu' : 'Open menu'); }
    if (panel) panel.inert = !v;
    if (lenis) { v ? lenis.stop() : lenis.start(); }
    else d.body.style.overflow = v ? 'hidden' : '';
  }
  if (panel) panel.inert = true;
  if (burger) burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false); });
  $$('.mpanel a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------- reveal on view ---------- */
  var revealEls = $$('.rv,.rv-clip,.rv-line');
  if ('IntersectionObserver' in W && root.classList.contains('js-motion')) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { rio.observe(el); });
  } else revealEls.forEach(function (el) { el.classList.add('in'); });

  /* ---------- word-fill statement ---------- */
  var fills = $$('.fill-text');
  fills.forEach(function (el) {
    var hot = (el.getAttribute('data-hot') || '').toLowerCase().split(',');
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w) {
      var k = w.toLowerCase().replace(/[^a-z']/g, '');
      return '<span class="w' + (hot.indexOf(k) > -1 ? ' hot' : '') + '" aria-hidden="true">' + w + '</span>';
    }).join(' ');
  });
  function fillWords() {
    fills.forEach(function (el) {
      var r = el.getBoundingClientRect(), vh = innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      p = Math.max(0, Math.min(1, p));
      var ws = el.children, n = Math.round(p * ws.length);
      for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < n || reduce);
    });
  }
  fillWords();

  /* ---------- GSAP scroll motion ---------- */
  if (W.gsap && W.ScrollTrigger && !reduce) {
    var g = W.gsap; g.registerPlugin(W.ScrollTrigger);
    var hm = $('.hero__media, .phero .hero__media');
    if (hm) g.to(hm, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hm.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
    var hi = $('.hero__inner');
    if (hi) g.to(hi, { y: -60, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: hi.closest('.hero,.phero'), start: '40% top', end: 'bottom top', scrub: true } });
    $$('[data-par] img, img[data-par]').forEach(function (img) {
      g.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    var fan = $('.fan');
    if (fan) {
      var figs = $$('figure', fan);
      g.from(figs[0], { rotate: -2, x: 60, ease: 'none', scrollTrigger: { trigger: fan, start: 'top 90%', end: 'center center', scrub: true } });
      g.from(figs[1], { rotate: 0, x: -60, ease: 'none', scrollTrigger: { trigger: fan, start: 'top 90%', end: 'center center', scrub: true } });
    }
    var tbar = $('.tline__bar');
    if (tbar) g.to(tbar, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.tline', start: 'top 70%', end: 'bottom 60%', scrub: true } });
    var tick = $('.ticker__track');
    if (tick) {
      W.ScrollTrigger.create({ trigger: '.ticker', start: 'top bottom', end: 'bottom top', onUpdate: function (s) {
        var v = Math.max(-1, Math.min(1, s.getVelocity() / 2500));
        tick.style.transform = 'skewX(' + (-v * 6).toFixed(2) + 'deg)';
      } });
    }
  }

  /* ---------- spaces (sticky feature stack) ---------- */
  var groupsEls = $$('[data-space]');
  if (groupsEls.length && 'IntersectionObserver' in W) {
    var arts = $$('.space-copy article'), dial = $$('.floor-dial span');
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = +en.target.getAttribute('data-space');
        arts.forEach(function (a, k) { a.classList.toggle('on', k === i); });
        dial.forEach(function (a, k) { a.classList.toggle('on', k === i); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    groupsEls.forEach(function (el) { sio.observe(el); });
  }

  /* ---------- carbonation bubbles ---------- */
  $$('canvas.bubbles').forEach(function (cv) {
    if (reduce) return;
    var ctx = cv.getContext('2d'), dpr = Math.min(W.devicePixelRatio || 1, 1.5), B = [], vis = false, raf = 0;
    function size() { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; }
    size(); W.addEventListener('resize', size);
    var count = Math.round(Math.min(90, cv.clientWidth / 14));
    for (var i = 0; i < count; i++) B.push({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 2.6, s: .0006 + Math.random() * .0016, w: Math.random() * 6.28 });
    function draw() {
      raf = 0; if (!vis) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (var i = 0; i < B.length; i++) {
        var b = B[i]; b.y -= b.s; b.w += .02; if (b.y < -0.05) { b.y = 1.05; b.x = Math.random(); }
        var x = (b.x + Math.sin(b.w) * .004) * cv.width, y = b.y * cv.height, r = b.r * dpr;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283);
        ctx.strokeStyle = 'rgba(240,196,110,' + (0.18 + b.r / 10) + ')'; ctx.lineWidth = dpr * .8; ctx.stroke();
        ctx.fillStyle = 'rgba(240,196,110,.05)'; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !raf) draw(); }).observe(cv);
  });

  /* ---------- split-flap tap board ---------- */
  var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.%';
  $$('.flap[data-text]').forEach(function (el) {
    var txt = el.getAttribute('data-text').toUpperCase();
    el.setAttribute('aria-label', el.getAttribute('data-text'));
    el.innerHTML = txt.split('').map(function (c) { return '<i aria-hidden="true">' + (c === ' ' ? '&nbsp;' : c) + '</i>'; }).join('');
  });
  var board = $('.board');
  if (board && !reduce && 'IntersectionObserver' in W) {
    var bio = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; bio.disconnect();
      $$('.flap[data-text]', board).forEach(function (el, row) {
        var txt = el.getAttribute('data-text').toUpperCase(), cells = $$('i', el);
        cells.forEach(function (c, k) {
          if (txt[k] === ' ') return;
          var n = 6 + Math.floor(Math.random() * 10) + k, step = 0;
          var iv = setInterval(function () {
            step++;
            if (step >= n) { c.textContent = txt[k]; clearInterval(iv); return; }
            c.textContent = CH[Math.floor(Math.random() * CH.length)];
          }, 38 + row * 4);
        });
      });
    }, { threshold: .3 });
    bio.observe(board);
  }

  /* ---------- dish rail ---------- */
  $$('[data-rail]').forEach(function (wrap) {
    var rail = $('.rail', wrap), prev = $('[data-prev]', wrap), next = $('[data-next]', wrap);
    if (!rail) return;
    function step() { var c = rail.firstElementChild; return c ? c.getBoundingClientRect().width + 24 : 300; }
    function upd() {
      if (prev) prev.disabled = rail.scrollLeft < 8;
      if (next) next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
    }
    if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });
    rail.addEventListener('scroll', upd, { passive: true }); upd();
    // drag to scroll (mouse)
    var down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.style.scrollSnapType = 'none'; });
    W.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
    W.addEventListener('pointerup', function () { if (!down) return; down = false; rail.style.scrollSnapType = ''; });
    rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    if (lenis) rail.setAttribute('data-lenis-prevent-wheel', '');
  });

  /* ---------- 3D tilt ---------- */
  if (finePointer && !reduce) $$('[data-tilt]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = 'perspective(900px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg) translateY(-4px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });

  /* ---------- lightbox ---------- */
  var lbBtns = $$('[data-lb]');
  if (lbBtns.length) {
    var lb = d.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lb__btn lb__x" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<button class="lb__btn lb__prev" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg></button>' +
      '<button class="lb__btn lb__next" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></button>';
    d.body.appendChild(lb); lb.inert = true;
    var li = 0, lastFocus = null, img = $('img', lb), cap = $('figcaption', lb);
    function show(i) { li = (i + lbBtns.length) % lbBtns.length; var b = lbBtns[li]; img.src = b.getAttribute('data-lb'); img.alt = b.getAttribute('data-cap') || ''; cap.textContent = b.getAttribute('data-cap') || ''; }
    function openLb(i) { lastFocus = d.activeElement; show(i); lb.inert = false; lb.classList.add('is-open'); if (lenis) lenis.stop(); $('.lb__x', lb).focus(); }
    function closeLb() { lb.classList.remove('is-open'); lb.inert = true; if (lenis) lenis.start(); if (lastFocus) lastFocus.focus(); }
    lbBtns.forEach(function (b, i) { b.addEventListener('click', function () { openLb(i); }); });
    $('.lb__x', lb).addEventListener('click', closeLb);
    $('.lb__prev', lb).addEventListener('click', function () { show(li - 1); });
    $('.lb__next', lb).addEventListener('click', function () { show(li + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    d.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') show(li - 1); if (e.key === 'ArrowRight') show(li + 1);
    });
  }

  /* ---------- accordion (animated details) ---------- */
  $$('.faq details').forEach(function (det) {
    var sum = $('summary', det);
    if (det.open) det.classList.add('is-open');
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (det.open) {
        det.classList.remove('is-open');
        setTimeout(function () { det.open = false; }, reduce ? 0 : 380);
      } else {
        det.open = true;
        requestAnimationFrame(function () { requestAnimationFrame(function () { det.classList.add('is-open'); }); });
      }
    });
  });

  /* ---------- custom select ---------- */
  $$('.sel').forEach(function (sel) {
    var btn = $('.sel__btn', sel), list = $('.sel__list', sel), label = $('.sel__val', sel), input = $('input[type="hidden"]', sel);
    var opts = $$('li', list), act = -1;
    function open(v) {
      sel.classList.toggle('is-open', v); btn.setAttribute('aria-expanded', v ? 'true' : 'false');
      if (v) { act = Math.max(0, opts.findIndex(function (o) { return o.getAttribute('aria-selected') === 'true'; })); mark(); }
    }
    function mark() { opts.forEach(function (o, i) { o.classList.toggle('is-active', i === act); }); if (opts[act]) btn.setAttribute('aria-activedescendant', opts[act].id); }
    function choose(i) {
      var o = opts[i]; if (!o) return;
      opts.forEach(function (x) { x.setAttribute('aria-selected', x === o ? 'true' : 'false'); });
      label.textContent = o.textContent; if (input) input.value = o.getAttribute('data-value');
      sel.dispatchEvent(new CustomEvent('change', { detail: o.getAttribute('data-value') }));
      open(false); btn.focus();
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); open(!sel.classList.contains('is-open')); });
    opts.forEach(function (o, i) { o.addEventListener('click', function (e) { e.stopPropagation(); choose(i); }); });
    btn.addEventListener('keydown', function (e) {
      var isOpen = sel.classList.contains('is-open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!isOpen) { open(true); return; } act = (act + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length; mark(); }
      else if ((e.key === 'Enter' || e.key === ' ') && isOpen) { e.preventDefault(); choose(act); }
      else if (e.key === 'Escape') open(false);
    });
    d.addEventListener('click', function () { open(false); });
  });

  /* ---------- menu page: tabs + scroll spy ---------- */
  var tabs = $('.mtabs__in');
  if (tabs) {
    var links = $$('a', tabs), ind = $('.mtabs__ind', tabs), cats = links.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
    function setTab(i) {
      links.forEach(function (a, k) { a.classList.toggle('on', k === i); });
      var a = links[i]; if (!a) return;
      ind.style.width = a.offsetWidth + 'px'; ind.style.transform = 'translateX(' + (a.offsetLeft - 6) + 'px)';
      tabs.scrollTo({ left: a.offsetLeft - 40, behavior: 'smooth' });
    }
    setTab(0); W.addEventListener('resize', function () { var i = links.findIndex(function (a) { return a.classList.contains('on'); }); setTab(i < 0 ? 0 : i); });
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) setTab(cats.indexOf(en.target)); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    cats.forEach(function (c) { if (c) cio.observe(c); });
  }
  $$('.msel .sel').forEach(function (s) {
    s.addEventListener('change', function (e) { scrollToEl(d.getElementById(e.detail), -150); });
  });

  /* ---------- forms (demo submission) ---------- */
  $$('form[data-demo]').forEach(function (f) {
    f.setAttribute('novalidate', '');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', f).forEach(function (inp) {
        var bad = !inp.value.trim() || (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(inp.value)) || (inp.min && +inp.value < +inp.min);
        inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
        var err = inp.parentElement.querySelector('.err');
        if (err) err.textContent = bad ? (inp.getAttribute('data-err') || 'Please fill this in.') : '';
        if (bad && ok) { ok = false; inp.focus(); }
      });
      if (!ok) return;
      var b = $('button[type="submit"]', f); b.classList.add('is-loading'); b.disabled = true;
      setTimeout(function () { b.classList.remove('is-loading'); b.disabled = false; f.classList.add('is-done'); var dn = $('.form__done', f); if (dn) dn.focus(); }, 900);
    });
    $$('[required]', f).forEach(function (inp) { inp.addEventListener('input', function () { if (inp.getAttribute('aria-invalid') === 'true') { inp.setAttribute('aria-invalid', 'false'); var err = inp.parentElement.querySelector('.err'); if (err) err.textContent = ''; } }); });
  });
  // preselect form type from hash (events page)
  if (location.hash === '#pint-night-form') { var r = d.querySelector('input[name="type"][value="pint-night"]'); if (r) r.checked = true; }

  /* ---------- map: load on demand ---------- */
  $$('[data-map]').forEach(function (m) {
    var btn = $('button', m);
    function load() {
      var f = d.createElement('iframe');
      f.src = 'https://www.google.com/maps?q=Blackstar,+2+Central+Ave,+Whitefish,+MT+59937&z=16&output=embed';
      f.title = 'Map: Blackstar, 2 Central Ave, Whitefish, Montana'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
      m.appendChild(f); var l = $('.map__load', m); if (l) l.remove();
    }
    if (btn) btn.addEventListener('click', load);
  });

  /* ---------- chat ("Ask Blackstar", rule-based) ---------- */
  var fab = $('.chat-fab'), chat = $('.chat');
  if (fab && chat) {
    var log = $('.chat__log', chat), form = $('form', chat), inp = $('input', chat), greeted = false;
    function say(html, me) { var m = d.createElement('div'); m.className = 'msg ' + (me ? 'msg--me' : 'msg--bot'); if (me) m.textContent = html; else m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; }
    function hoursTxt() { var s = status(); return '<b>' + s.text + '.</b><br>Mon–Wed 11 AM–9 PM · Thu–Sat 11 AM–10 PM · Sun 11 AM–9 PM.'; }
    var KB = [
      [/hour|open|close|time|today|tonight/, function () { return hoursTxt(); }],
      [/where|address|locat|direction|park|find/, function () { return 'We\'re at <b>2 Central Ave, Whitefish, MT 59937</b>, the corner of Central & Railway in historic downtown. <a href="visit.html">Map & directions</a>.'; }],
      [/reserv|book|table/, function () { return 'We don\'t take reservations June through September or on holiday weeks and weekends. For groups of 30 or more, send a <a href="events.html#request">private event request</a>.'; }],
      [/event|party|private|group|wedding|rehearsal|banquet/, function () { return 'Yes! Private parties for groups of <b>30 or more</b>, across three floors with balconies and a rooftop terrace. <a href="events.html#request">Request a date</a>.'; }],
      [/pint night|nonprofit|fundrais|community/, function () { return 'Pint Nights partner Blackstar with local organizations that bring their own crowd. <a href="events.html#pint-night">See how it works</a>.'; }],
      [/beer|brew|tap|ipa|lager|ale|porter|jeremiah|jj/, function () { return 'Our beer is brewed right here by <b>Jeremiah Johnson Brewing Co.</b> — Mountain Man Scotch Ale, Citra IPA, Vanilla Porter, Blonde and more, plus experimental batches you won\'t find anywhere else. <a href="brewery.html">See the tap board</a>.'; }],
      [/pizza|neapolitan|dough/, function () { return 'Our Neapolitan-style dough ferments over several days. Try the Soppressata, the White Pizza with truffle mushroom cream, or the Spicy Hawaiian. <a href="menu.html#pizza">Pizza menu</a>.'; }],
      [/burger|smash/, function () { return 'The Smashburger is our most-ordered plate: a double patty of Montana ground beef, American cheese, caramelized onion and Blackstar sauce on the side. <a href="menu.html#burgers">Burgers & sandwiches</a>.'; }],
      [/veg|vegetarian|plant|meat.?free/, function () { return 'Meat-free picks include the Black Bean Burger, Margherita and Cheese pizzas, Guacamole, Elote Corn Salsa and the Street Corn Salad. Ask your server about ingredients.'; }],
      [/kid|child|family/, function () { return 'Kids are welcome. There\'s a Kids Burger and a Grilled Cheese, both with fries.'; }],
      [/order|takeout|take.?out|pickup|deliver/, function () { return 'Order takeout on our <a href="https://order.toasttab.com/online/blackstarmt" target="_blank" rel="noopener">Toast ordering page</a> — it has live prices and availability.'; }],
      [/menu|food|eat/, function () { return 'Pizza, smash burgers, sandwiches, salads and bar food. <a href="menu.html">Browse the full menu</a>.'; }],
      [/job|work|hiring|employ/, function () { return 'We\'re often hiring. See <a href="https://www.blackstarmt.com/employment" target="_blank" rel="noopener">employment</a>.'; }],
      [/donat|sponsor/, function () { return 'Donation requests go through our <a href="https://www.blackstarmt.com/donation-request" target="_blank" rel="noopener">donation request form</a>.'; }],
      [/music|live|band/, function () { return 'We host live music. Follow <a href="https://www.instagram.com/blackstarmontana/" target="_blank" rel="noopener">@blackstarmontana</a> for what\'s on.'; }],
      [/roof|view|outdoor|patio|terrace/, function () { return 'The rooftop terrace looks out over downtown Whitefish and Big Mountain. There\'s outdoor seating too.'; }],
      [/hi|hello|hey|yo/, function () { return 'Hey there! Ask about hours, the menu, beer, or private events.'; }]
    ];
    function answer(q) {
      var t = q.toLowerCase();
      for (var i = 0; i < KB.length; i++) if (KB[i][0].test(t)) return KB[i][1]();
      return 'Good question. I\'m best at hours, menu, beer and events. For anything else, message us on <a href="https://www.instagram.com/blackstarmontana/" target="_blank" rel="noopener">Instagram</a>.';
    }
    function setChat(v) {
      chat.classList.toggle('is-open', v); chat.inert = !v; fab.setAttribute('aria-expanded', v ? 'true' : 'false');
      if (v && !greeted) { greeted = true; say('Welcome to Blackstar. ' + hoursTxt()); }
      if (v) setTimeout(function () { inp.focus(); }, 60);
    }
    chat.inert = true;
    fab.addEventListener('click', function () { setChat(!chat.classList.contains('is-open')); });
    $('.chat__x', chat).addEventListener('click', function () { setChat(false); fab.focus(); });
    $$('.chat__qs button', chat).forEach(function (b) { b.addEventListener('click', function () { say(b.textContent, true); setTimeout(function () { say(answer(b.textContent)); }, 260); }); });
    form.addEventListener('submit', function (e) { e.preventDefault(); var q = inp.value.trim(); if (!q) return; say(q, true); inp.value = ''; setTimeout(function () { say(answer(q)); }, 300); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && chat.classList.contains('is-open')) setChat(false); });
    if (lenis) chat.setAttribute('data-lenis-prevent', '');
  }

  /* ---------- 3D star (lazy, after load) ---------- */
  var starHost = $('[data-star]');
  function webgl() { try { var c = d.createElement('canvas'); return !!(W.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } }
  if (starHost && webgl() && !(navigator.connection && navigator.connection.saveData)) {
    var go = function () { import(new URL('star3d.js', SELF).href).then(function (m) { m.mount(starHost); }).catch(function () {}); };
    var idle = function () { ('requestIdleCallback' in W) ? requestIdleCallback(go, { timeout: 1500 }) : setTimeout(go, 300); };
    if (d.readyState === 'complete') idle(); else W.addEventListener('load', idle);
  }

  var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
