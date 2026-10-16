/* Floating "German Trainer" switcher injected into every module page (B2, C1, Essay, Grammatik)
   by germanhub.app (see _inject_nav). Self-contained: no dependencies, no layout impact. */
(function () {
  if (window.__gtNav) return;
  window.__gtNav = true;
  var MODULES = [
    { href: '/b2/', label: 'B2 Vokabeln', sub: 'Sicher! B2' },
    { href: '/c1/', label: 'C1 Vokabeln', sub: 'Aspekte Neu C1' },
    { href: '/grammatik/', label: 'Grammatik', sub: 'A1–C1' },
    { href: '/essay/', label: 'Essay Tutor', sub: 'KI-Feedback' }
  ];
  var path = location.pathname;
  var css = document.createElement('style');
  css.textContent =
    '#gt-nav{position:fixed;right:14px;bottom:14px;z-index:2147483000;font:600 14px/1.2 system-ui,sans-serif}' +
    '#gt-nav button{all:unset;cursor:pointer;background:#1f2a44;color:#fff;padding:9px 14px;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.3)}' +
    '#gt-nav button:focus-visible{outline:3px solid #e0b13e}' +
    '#gt-nav .gt-panel{display:none;position:absolute;right:0;bottom:46px;min-width:210px;background:#fff;color:#1f2a44;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.28);overflow:hidden}' +
    '#gt-nav.open .gt-panel{display:block}' +
    '#gt-nav a{display:block;padding:10px 14px;color:inherit;text-decoration:none;border-top:1px solid #eef0f4}' +
    '#gt-nav a:first-child{border-top:0}#gt-nav a:hover{background:#f3f6fb}' +
    '#gt-nav a small{display:block;font-weight:400;color:#667;margin-top:2px}' +
    '#gt-nav a.cur{background:#fff7e0}';
  document.head.appendChild(css);
  var box = document.createElement('div');
  box.id = 'gt-nav';
  var panel = '<div class="gt-panel" role="menu"><a href="/">German Trainer<small>Übersicht</small></a>';
  MODULES.forEach(function (m) {
    panel += '<a href="' + m.href + '"' + (path.indexOf(m.href) === 0 || path === m.href.slice(0, -1) ? ' class="cur" aria-current="page"' : '') + '>' +
      m.label + '<small>' + m.sub + '</small></a>';
  });
  box.innerHTML = '<button type="button" aria-haspopup="true" aria-expanded="false">German Trainer ▴</button>' + panel + '</div>';
  document.body.appendChild(box);
  var btn = box.querySelector('button');
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = box.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', function () { box.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') box.classList.remove('open'); });
})();
