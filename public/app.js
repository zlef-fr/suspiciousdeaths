(function () {
  'use strict';

  // Route progress bar — every navigation shows movement immediately.
  var bar = document.createElement('div');
  bar.className = 'sd-progress';
  document.body.appendChild(bar);
  var timer;
  function start() {
    clearTimeout(timer);
    bar.classList.add('on');
    bar.style.width = '18%';
    timer = setTimeout(function () { bar.style.width = '72%'; }, 180);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href') || '';
    if (!href || href[0] === '#' || /^(mailto|tel):/.test(href)) return;
    if (a.host && a.host !== location.host) return;
    start();
  });
  window.addEventListener('pageshow', function () { bar.classList.remove('on'); bar.style.width = '0'; });

  // Instant client-side filtering of the already-rendered list.
  var input = document.getElementById('sd-q');
  var list = document.getElementById('sd-list');
  var empty = document.getElementById('sd-empty');
  var skel = document.getElementById('sd-skeletons');
  var count = document.getElementById('sd-count');
  if (!input || !list) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('.sd-card'));
  var haystacks = cards.map(function (c) { return norm(c.textContent); });

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  var debounce;
  input.addEventListener('input', function () {
    clearTimeout(debounce);
    // Only show the skeleton sweep when the work is worth signalling.
    if (cards.length > 40) { skel.hidden = false; list.style.opacity = '.35'; }
    debounce = setTimeout(apply, 130);
  });

  function apply() {
    var q = norm(input.value.trim());
    var shown = 0;
    for (var i = 0; i < cards.length; i++) {
      var hit = !q || haystacks[i].indexOf(q) !== -1;
      cards[i].hidden = !hit;
      if (hit) shown++;
    }
    skel.hidden = true;
    list.style.opacity = '';
    if (count) count.textContent = String(shown);
    if (empty) empty.hidden = shown !== 0;
  }
})();
