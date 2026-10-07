/* Stage art — one small "screenshot-like" illustration per tool, drawn with
 * Canvas2D and uploaded by stage.js as a texture on top of each shader plane.
 * Content is German learning material (language-neutral for the hub UI), so
 * it needs no translation. window.StageArt.draw(i, canvas) paints slide i. */
(function () {
  'use strict';
  var W = 768, H = 985;
  var SANS = '"Work Sans", system-ui, sans-serif', MONO = '"Space Mono", ui-monospace, monospace';
  var COL = ['#e0b13e', '#d94f3d', '#5fb877', '#6aa5e0'];
  var PATH = ['germanhub / b2', 'germanhub / c1', 'germanhub / essay', 'germanhub / grammatik'];

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function txt(c, s, x, y, font, color, align) {
    c.font = font; c.fillStyle = color; c.textAlign = align || 'left'; c.textBaseline = 'alphabetic';
    c.fillText(s, x, y);
  }
  function wrap(c, s, x, y, maxW, lh, font, color) {
    c.font = font; c.fillStyle = color; c.textAlign = 'left';
    var words = s.split(' '), line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (c.measureText(t).width > maxW && line) { c.fillText(line, x, y); y += lh; line = w; } else line = t;
    });
    c.fillText(line, x, y);
    return y;
  }
  function alpha(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function seeded(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  /* shared frame: scrim so the shader artwork stays visible but quiet,
     plus a small "where this leads" path pill at the top. */
  function frame(c, i) {
    c.clearRect(0, 0, W, H);
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(10,12,16,0.30)'); g.addColorStop(0.5, 'rgba(10,12,16,0.52)'); g.addColorStop(1, 'rgba(10,12,16,0.30)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.font = '700 24px ' + MONO;
    var w = c.measureText(PATH[i]).width + 56;
    rr(c, 40, 40, w, 52, 26); c.fillStyle = 'rgba(12,14,18,0.78)'; c.fill();
    c.strokeStyle = alpha(COL[i], 0.7); c.lineWidth = 2; c.stroke();
    c.beginPath(); c.arc(68, 66, 7, 0, 7); c.fillStyle = COL[i]; c.fill();
    txt(c, PATH[i], 88, 75, '700 24px ' + MONO, '#eceae4');
  }

  /* ---- B2: a flashcard stack with example sentence, audio and answer chips ---- */
  function b2(c) {
    var a = COL[0];
    [[-0.07, 18], [0.05, 8]].forEach(function (s) {
      c.save(); c.translate(W / 2, 470); c.rotate(s[0]); c.translate(-300, -250 + s[1]);
      rr(c, 0, 0, 600, 500, 30); c.fillStyle = 'rgba(28,32,40,0.9)'; c.fill();
      c.strokeStyle = alpha(a, 0.35); c.lineWidth = 2; c.stroke(); c.restore();
    });
    var x = 84, y = 208, w = 600, h = 520;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 40; c.shadowOffsetY = 18;
    rr(c, x, y, w, h, 30); c.fillStyle = '#1c2028'; c.fill(); c.restore();
    c.save(); rr(c, x, y, w, h, 30); c.clip(); c.fillStyle = a; c.fillRect(x, y, w, 8); c.restore();
    txt(c, 'KAPITEL 4 · VERB', x + 40, y + 70, '700 22px ' + MONO, alpha(a, 0.95));
    txt(c, 'entscheiden', x + 40, y + 160, '700 66px ' + SANS, '#eceae4');
    txt(c, 'entschied · hat entschieden', x + 40, y + 208, '400 24px ' + MONO, '#a3a3a0');
    c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(x + 40, y + 244, w - 80, 2);
    wrap(c, 'Wir müssen uns bis Freitag entscheiden.', x + 40, y + 304, w - 80, 42, 'italic 400 32px ' + SANS, '#d6d4cd');
    /* audio button + waveform */
    c.beginPath(); c.arc(x + 84, y + 436, 38, 0, 7); c.fillStyle = a; c.fill();
    c.beginPath(); c.moveTo(x + 74, y + 418); c.lineTo(x + 74, y + 454); c.lineTo(x + 104, y + 436); c.closePath(); c.fillStyle = '#1c1608'; c.fill();
    var r = seeded(7);
    for (var k = 0; k < 24; k++) {
      var bh = 10 + r() * 46 * Math.sin(k / 24 * Math.PI + 0.3);
      rr(c, x + 150 + k * 17, y + 436 - bh / 2, 8, bh, 4); c.fillStyle = alpha(a, k < 15 ? 0.95 : 0.35); c.fill();
    }
    /* answer chips */
    var labels = ['Nochmal', 'Schwer', 'Gut', 'Leicht'], cx = 84;
    labels.forEach(function (l, k) {
      c.font = '700 26px ' + SANS;
      var cw = c.measureText(l).width + 44;
      rr(c, cx, 780, cw, 62, 31);
      if (k === 2) { c.fillStyle = a; c.fill(); } else { c.strokeStyle = alpha(a, 0.6); c.lineWidth = 2; c.stroke(); }
      txt(c, l, cx + cw / 2, 820, '700 26px ' + SANS, k === 2 ? '#1c1608' : '#eceae4', 'center');
      cx += cw + 14;
    });
    rr(c, 84, 884, 600, 10, 5); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fill();
    rr(c, 84, 884, 600 * 0.34, 10, 5); c.fillStyle = a; c.fill();
    txt(c, '224 / 662', 684, 928, '400 22px ' + MONO, '#a3a3a0', 'right');
  }

  /* ---- C1: typing quiz + spaced-repetition boxes + daily goal ring ---- */
  function c1(c) {
    var a = COL[1];
    txt(c, 'ÜBERSETZE', 84, 196, '700 22px ' + MONO, alpha(a, 1));
    txt(c, 'Nachhaltigkeit', 84, 276, '700 70px ' + SANS, '#eceae4');
    rr(c, 84, 322, 600, 100, 22); c.fillStyle = 'rgba(12,14,18,0.82)'; c.fill();
    c.strokeStyle = a; c.lineWidth = 3; c.stroke();
    txt(c, 'sustainability', 118, 388, '500 44px ' + SANS, '#eceae4');
    c.beginPath(); c.arc(634, 372, 26, 0, 7); c.fillStyle = '#5fb877'; c.fill();
    c.strokeStyle = '#0c1a10'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath();
    c.moveTo(622, 372); c.lineTo(631, 381); c.lineTo(647, 362); c.stroke();
    txt(c, 'richtig · +10 XP', 84, 466, '700 24px ' + MONO, '#5fb877');

    /* daily-goal ring */
    var rx = 190, ry = 640, rad = 92;
    c.lineWidth = 22; c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.arc(rx, ry, rad, 0, 7); c.stroke();
    c.strokeStyle = a; c.beginPath(); c.arc(rx, ry, rad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.7); c.stroke();
    txt(c, '35', rx, ry + 14, '700 52px ' + SANS, '#eceae4', 'center');
    txt(c, 'von 50 Wörtern', rx, ry + 168 - 18, '400 22px ' + MONO, '#a3a3a0', 'center');

    /* streak + SRS boxes */
    rr(c, 364, 548, 320, 84, 42); c.fillStyle = alpha(a, 0.16); c.fill(); c.strokeStyle = alpha(a, 0.8); c.lineWidth = 2; c.stroke();
    c.beginPath(); c.moveTo(412, 612); c.bezierCurveTo(388, 590, 408, 574, 412, 560); c.bezierCurveTo(424, 574, 438, 584, 432, 600); c.bezierCurveTo(430, 608, 422, 612, 412, 612);
    c.fillStyle = a; c.fill();
    txt(c, '12 Tage Serie', 456, 600, '700 28px ' + SANS, '#eceae4');
    txt(c, 'INTERVALL', 364, 690, '700 20px ' + MONO, '#a3a3a0');
    var days = ['1', '3', '7', '14', '30'];
    days.forEach(function (d, k) {
      var bx = 364 + k * 66, bh = 40 + k * 22;
      rr(c, bx, 800 - bh, 52, bh, 10); c.fillStyle = k < 3 ? a : alpha(a, 0.3); c.fill();
      txt(c, d, bx + 26, 836, '700 22px ' + MONO, '#d6d4cd', 'center');
    });
    txt(c, 'Tage bis zur Wiederholung', 364, 880, '400 20px ' + MONO, '#a3a3a0');
  }

  /* ---- Essay: a handwritten page with corrections and a CEFR stamp ---- */
  function essay(c) {
    var a = COL[2];
    var x = 70, y = 190, w = 628, h = 700;
    c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(-0.025); c.translate(-w / 2, -h / 2);
    c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 40; c.shadowOffsetY = 18;
    rr(c, 0, 0, w, h, 14); c.fillStyle = '#efe9dc'; c.fill(); c.shadowColor = 'transparent';
    c.strokeStyle = 'rgba(80,110,160,0.28)'; c.lineWidth = 2;
    for (var l = 0; l < 12; l++) { c.beginPath(); c.moveTo(34, 118 + l * 48); c.lineTo(w - 34, 118 + l * 48); c.stroke(); }
    c.strokeStyle = 'rgba(210,80,70,0.45)'; c.beginPath(); c.moveTo(76, 0); c.lineTo(76, h); c.stroke();
    /* faux handwriting */
    var r = seeded(11);
    c.strokeStyle = '#2b3550'; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
    var rows = [[1, 0.86], [2, 0.92], [3, 0.78], [4, 0.9], [5, 0.62], [7, 0.88], [8, 0.8], [9, 0.5]];
    rows.forEach(function (row) {
      var yy = 112 + row[0] * 48, xx = 96, end = 96 + (w - 150) * row[1];
      c.beginPath(); c.moveTo(xx, yy);
      while (xx < end) {
        var wl = 14 + r() * 44;
        if (r() < 0.16) { xx += 12; c.moveTo(xx, yy); continue; }
        c.bezierCurveTo(xx + wl * 0.2, yy - 20 - r() * 8, xx + wl * 0.5, yy + 6, xx + wl, yy - 4 - r() * 10);
        xx += wl;
      }
      c.stroke();
    });
    /* corrections: strike a word, write the fix above in red */
    function fix(px, py, sw, word) {
      c.strokeStyle = '#d3473a'; c.lineWidth = 4; c.beginPath(); c.moveTo(px, py + 2); c.lineTo(px + sw, py - 8); c.stroke();
      txt(c, word, px + sw / 2, py - 24, 'italic 700 34px ' + SANS, '#d3473a', 'center');
    }
    fix(190, 160 + 48, 92, 'hätte');
    fix(330, 304 + 48, 84, 'dem');
    fix(150, 448 + 48, 108, 'wäre');
    c.restore();

    /* CEFR stamp */
    c.save(); c.translate(556, 806); c.rotate(0.14);
    c.beginPath(); c.arc(0, 0, 100, 0, 7); c.fillStyle = 'rgba(12,26,16,0.94)'; c.fill();
    c.strokeStyle = a; c.lineWidth = 5; c.stroke();
    c.beginPath(); c.arc(0, 0, 84, 0, 7); c.lineWidth = 2; c.stroke();
    txt(c, 'B2', 0, 12, '700 64px ' + SANS, a, 'center');
    txt(c, 'CEFR · 78', 0, 52, '700 18px ' + MONO, '#d6d4cd', 'center');
    c.restore();
    rr(c, 70, 836, 262, 56, 28); c.fillStyle = 'rgba(12,26,16,0.9)'; c.fill(); c.strokeStyle = alpha(a, 0.7); c.lineWidth = 2; c.stroke();
    txt(c, '3 Hinweise zur Grammatik', 92, 872, '700 22px ' + MONO, a);
  }

  /* ---- Grammatik: a declension table with a highlighted cell and example ---- */
  function gram(c) {
    var a = COL[3];
    txt(c, 'ARTIKEL & KASUS', 84, 196, '700 22px ' + MONO, a);
    txt(c, 'Bestimmter Artikel', 84, 262, '700 52px ' + SANS, '#eceae4');
    var cols = ['', 'm', 'f', 'n', 'Pl'], rowsT = [['Nom', 'der', 'die', 'das', 'die'], ['Akk', 'den', 'die', 'das', 'die'], ['Dat', 'dem', 'der', 'dem', 'den'], ['Gen', 'des', 'der', 'des', 'der']];
    var tx = 84, ty = 318, cw = [112, 122, 122, 122, 122], rh = 84;
    rr(c, tx, ty, 600, rh * 5, 22); c.fillStyle = 'rgba(12,14,18,0.82)'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 2; c.stroke();
    var xx = tx;
    cols.forEach(function (h, k) { txt(c, h, xx + cw[k] / 2, ty + 54, '700 26px ' + MONO, alpha(a, 0.95), 'center'); xx += cw[k]; });
    rowsT.forEach(function (row, ri) {
      var yy = ty + rh * (ri + 1);
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(tx + 20, yy, 560, 2);
      var cx = tx;
      row.forEach(function (cell, k) {
        var hit = ri === 2 && k === 1;
        if (hit) { rr(c, cx + 6, yy + 12, cw[k] - 12, rh - 24, 16); c.fillStyle = a; c.fill(); }
        txt(c, cell, cx + cw[k] / 2, yy + 54, (k === 0 ? '700 24px ' + MONO : '700 36px ' + SANS), hit ? '#0c1420' : (k === 0 ? '#a3a3a0' : '#eceae4'), 'center');
        cx += cw[k];
      });
    });
    /* example sentence with highlighted article */
    var sy = 828;
    rr(c, 84, sy - 52, 600, 120, 22); c.fillStyle = 'rgba(12,14,18,0.82)'; c.fill(); c.strokeStyle = alpha(a, 0.5); c.lineWidth = 2; c.stroke();
    c.font = '500 40px ' + SANS;
    var p1 = 'Ich helfe ', p2 = 'dem', p3 = ' Kind.';
    var w1 = c.measureText(p1).width, w2 = c.measureText(p2).width;
    txt(c, p1, 118, sy + 8, '500 40px ' + SANS, '#eceae4');
    rr(c, 118 + w1 - 8, sy - 34, w2 + 16, 56, 12); c.fillStyle = alpha(a, 0.9); c.fill();
    txt(c, p2, 118 + w1, sy + 8, '700 40px ' + SANS, '#0c1420');
    txt(c, p3, 118 + w1 + w2, sy + 8, '500 40px ' + SANS, '#eceae4');
    txt(c, 'helfen + Dativ', 118, sy + 50, '400 22px ' + MONO, a);
  }

  var DRAW = [b2, c1, essay, gram];
  window.StageArt = {
    W: W, H: H,
    draw: function (i, canvas) {
      canvas.width = W; canvas.height = H;
      var c = canvas.getContext('2d');
      frame(c, i); DRAW[i](c);
      return canvas;
    }
  };
})();
