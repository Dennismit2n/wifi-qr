/* wifi-qr — app logic. Everything runs locally; no data ever leaves the browser. */
'use strict';

(function () {
  var SITE_URL = 'dennismit2n.github.io/wifi-qr';
  var QR_DARK = '#0f172a';

  var $ = function (id) { return document.getElementById(id); };
  var ssidEl = $('ssid'), pwEl = $('password'), secEl = $('security'),
      hiddenEl = $('hiddenNet'), showPwCardEl = $('showPwOnCard'),
      togglePwEl = $('togglePw'), passwordField = $('passwordField'),
      cardEl = $('card'), qrBox = $('qrBox'), cardSsid = $('cardSsid'),
      cardPwRow = $('cardPwRow'), cardPw = $('cardPw'),
      ssidError = $('ssidError'), pwError = $('pwError'), toastEl = $('toast'),
      btnShare = $('btnShare'), btnPng = $('btnPng'), btnSvg = $('btnSvg'),
      btnCopy = $('btnCopy'), btnPrint = $('btnPrint'), printModeEl = $('printMode'),
      langSelect = $('langSelect');

  var currentQR = null;
  var toastTimer = null;

  /* ---------- WIFI string (format understood by iOS and Android cameras) ---------- */

  // Backslash-escape the characters that are special in the WIFI: format.
  function escapeValue(v) {
    return v.replace(/([\\;,:"])/g, '\\$1');
  }

  function buildWifiString(ssid, password, security, hidden) {
    var s = 'WIFI:T:' + security + ';S:' + escapeValue(ssid) + ';';
    if (security !== 'nopass') { s += 'P:' + escapeValue(password) + ';'; }
    if (hidden) { s += 'H:true;'; }
    return s + ';';
  }

  function makeQR(text) {
    var qr = qrcode(0, 'M'); // type 0 = smallest version that fits
    qr.addData(text, 'Byte');
    qr.make();
    return qr;
  }

  /* ---------- QR rendering ---------- */

  function qrToPath(qr) {
    var n = qr.getModuleCount();
    var quiet = 4;
    var parts = [];
    for (var r = 0; r < n; r++) {
      var c = 0;
      while (c < n) {
        if (qr.isDark(r, c)) {
          var run = 1;
          while (c + run < n && qr.isDark(r, c + run)) { run++; }
          parts.push('M' + (c + quiet) + ' ' + (r + quiet) + 'h' + run + 'v1h-' + run + 'z');
          c += run;
        } else { c++; }
      }
    }
    return { d: parts.join(''), size: n + quiet * 2 };
  }

  function qrToSvg(qr, standalone) {
    var p = qrToPath(qr);
    var dims = standalone ? ' width="512" height="512"' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + p.size + ' ' + p.size + '"' +
      dims + ' shape-rendering="crispEdges">' +
      '<rect width="100%" height="100%" fill="#ffffff"/>' +
      '<path d="' + p.d + '" fill="' + QR_DARK + '"/></svg>';
  }

  function drawQrOnCanvas(ctx, qr, x, y, size) {
    var n = qr.getModuleCount();
    var cell = size / n;
    ctx.fillStyle = QR_DARK;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) {
          // slight overlap avoids white hairlines between modules
          ctx.fillRect(x + c * cell, y + r * cell, cell + 0.4, cell + 0.4);
        }
      }
    }
  }

  /* ---------- state ---------- */

  function readState() {
    return {
      ssid: ssidEl.value,
      password: pwEl.value,
      security: secEl.value,
      hidden: hiddenEl.checked,
      showPw: showPwCardEl.checked
    };
  }

  function isValid(s) {
    if (s.ssid.trim() === '') { return false; }
    if (s.security !== 'nopass' && s.password === '') { return false; }
    return true;
  }

  function update() {
    var s = readState();
    var valid = isValid(s);
    var anyInput = s.ssid !== '' || s.password !== '';

    passwordField.style.display = (s.security === 'nopass') ? 'none' : '';
    ssidError.hidden = !(anyInput && s.ssid.trim() === '');
    pwError.hidden = !(anyInput && s.ssid.trim() !== '' && s.security !== 'nopass' && s.password === '');

    if (valid) {
      cardEl.classList.remove('is-demo');
      currentQR = makeQR(buildWifiString(s.ssid, s.password, s.security, s.hidden));
      cardSsid.textContent = s.ssid;
    } else {
      // demo preview so the card never looks broken
      cardEl.classList.add('is-demo');
      currentQR = null;
      var demo = makeQR(buildWifiString(i18n.t('ssidPlaceholder'), 'wifi-qr-demo', 'WPA', false));
      qrBox.innerHTML = qrToSvg(demo, false);
      cardSsid.textContent = i18n.t('ssidPlaceholder');
    }
    if (currentQR) { qrBox.innerHTML = qrToSvg(currentQR, false); }

    var showPwLine = s.showPw && s.security !== 'nopass' && s.password !== '' && valid;
    cardPwRow.hidden = !showPwLine;
    cardPw.textContent = showPwLine ? s.password : '';

    var disabled = !valid;
    btnShare.disabled = disabled;
    btnPng.disabled = disabled;
    btnSvg.disabled = disabled;
    btnCopy.disabled = disabled;
    btnPrint.disabled = disabled;
  }

  /* ---------- card as canvas (for PNG / copy / share) ---------- */

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function cardToCanvas() {
    var s = readState();
    var showPwLine = s.showPw && s.security !== 'nopass' && s.password !== '';

    var W = 1000, pad = 64, qrSize = 560;
    var headH = 96, scanH = 88, labelH = 34, valueH = 54, detailGap = 26, footerH = 96;
    var H = pad + headH + 16 + qrSize + 20 + scanH + labelH + valueH +
            (showPwLine ? detailGap + labelH + valueH : 0) + 30 + footerH + 36;

    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 0, 0, W, H, 56);
    ctx.fill();

    var y = pad;
    var fontStack = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif';

    // head: wifi icon + title
    ctx.fillStyle = '#0e7490';
    ctx.strokeStyle = '#0e7490';
    ctx.font = '700 60px ' + fontStack;
    ctx.textBaseline = 'middle';
    var title = i18n.t('cardTitle');
    var titleW = ctx.measureText(title).width;
    var iconR = 34, iconGap = 26;
    var totalW = iconR * 2 + iconGap + titleW;
    var iconCx = (W - totalW) / 2 + iconR;
    var headCy = y + headH / 2;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(iconCx, headCy + 20, 44, -Math.PI * 0.78, -Math.PI * 0.22);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(iconCx, headCy + 20, 24, -Math.PI * 0.78, -Math.PI * 0.22);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(iconCx, headCy + 14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(title, iconCx + iconR + iconGap, headCy);
    y += headH + 16;

    // QR
    if (currentQR) { drawQrOnCanvas(ctx, currentQR, (W - qrSize) / 2, y, qrSize); }
    y += qrSize + 20;

    // scan hint
    ctx.fillStyle = '#64748b';
    ctx.font = '600 26px ' + fontStack;
    ctx.textAlign = 'center';
    ctx.fillText(i18n.t('cardScan').toUpperCase(), W / 2, y + scanH / 2);
    y += scanH;

    // network
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 22px ' + fontStack;
    ctx.fillText(i18n.t('cardNetwork').toUpperCase(), W / 2, y + labelH / 2);
    y += labelH;
    ctx.fillStyle = QR_DARK;
    ctx.font = '700 38px ' + fontStack;
    ctx.fillText(s.ssid, W / 2, y + valueH / 2, W - pad * 2);
    y += valueH;

    if (showPwLine) {
      y += detailGap;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 22px ' + fontStack;
      ctx.fillText(i18n.t('cardPassword').toUpperCase(), W / 2, y + labelH / 2);
      y += labelH;
      ctx.fillStyle = QR_DARK;
      ctx.font = '600 36px ui-monospace, Consolas, monospace';
      ctx.fillText(s.password, W / 2, y + valueH / 2, W - pad * 2);
      y += valueH;
    }

    // footer
    y += 30;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(W - pad, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 22px ' + fontStack;
    ctx.fillText(i18n.t('cardCreatedWith') + ' ' + SITE_URL, W / 2, y + footerH / 2);

    ctx.textAlign = 'start';
    return canvas;
  }

  function cardToBlob() {
    return new Promise(function (resolve, reject) {
      cardToCanvas().toBlob(function (blob) {
        if (blob) { resolve(blob); } else { reject(new Error('toBlob failed')); }
      }, 'image/png');
    });
  }

  /* ---------- actions ---------- */

  function fileName(ext) {
    var base = ssidEl.value.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return 'wifi-' + (base || 'card') + '.' + ext;
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2500);
  }

  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  btnPng.addEventListener('click', function () {
    cardToBlob().then(function (blob) { downloadBlob(blob, fileName('png')); });
  });

  btnSvg.addEventListener('click', function () {
    if (!currentQR) { return; }
    var blob = new Blob([qrToSvg(currentQR, true)], { type: 'image/svg+xml' });
    downloadBlob(blob, fileName('svg'));
  });

  btnCopy.addEventListener('click', function () {
    if (!navigator.clipboard || !window.ClipboardItem) { toast(i18n.t('copyFailed')); return; }
    var item = new ClipboardItem({ 'image/png': cardToBlob() });
    navigator.clipboard.write([item]).then(
      function () { toast(i18n.t('copied')); },
      function () { toast(i18n.t('copyFailed')); }
    );
  });

  btnShare.addEventListener('click', function () {
    cardToBlob().then(function (blob) {
      var file = new File([blob], fileName('png'), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: i18n.t('appName') }).catch(function () { /* user cancelled */ });
      }
    });
  });

  // show the share button only where sharing files is supported
  (function () {
    try {
      var probe = new File([new Blob(['x'])], 'probe.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [probe] })) { btnShare.hidden = false; }
    } catch (e) { /* keep hidden */ }
  })();

  btnPrint.addEventListener('click', function () {
    var pa = $('printArea');
    var mode = printModeEl.value;
    pa.className = (mode === 'tent') ? 'tent' : '';
    var cardHtml = cardEl.outerHTML;
    if (mode === 'tent') {
      pa.innerHTML = '<div class="tent-half flip">' + cardHtml + '</div>' +
        '<div class="fold-line"></div>' +
        '<div class="tent-half">' + cardHtml + '</div>';
    } else {
      pa.innerHTML = cardHtml;
    }
    var dup = pa.querySelectorAll('[id]');
    for (var i = 0; i < dup.length; i++) { dup[i].removeAttribute('id'); }
    window.print();
  });

  togglePwEl.addEventListener('click', function () {
    var show = pwEl.type === 'password';
    pwEl.type = show ? 'text' : 'password';
    togglePwEl.setAttribute('aria-pressed', String(show));
  });

  /* ---------- theme: system / light / dark ---------- */
  /* The head snippet already applied a stored choice before first
     paint; here we just build the dropdown and wire it up. */

  (function () {
    var THEME_KEY = 'wifi-qr.theme';
    var themeSelect = document.getElementById('themeSelect');
    var themeOptions = [
      { value: 'system', i18n: 'themeSystem' },
      { value: 'light', i18n: 'themeLight' },
      { value: 'dark', i18n: 'themeDark' }
    ];
    for (var i = 0; i < themeOptions.length; i++) {
      var opt = document.createElement('option');
      opt.value = themeOptions[i].value;
      opt.setAttribute('data-i18n', themeOptions[i].i18n);
      themeSelect.appendChild(opt);
    }
    var stored = 'system';
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') { stored = saved; }
    } catch (e) { /* ignore */ }
    themeSelect.value = stored;
    themeSelect.addEventListener('change', function () {
      var v = themeSelect.value;
      if (v === 'light' || v === 'dark') {
        document.documentElement.setAttribute('data-theme', v);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      try { localStorage.setItem(THEME_KEY, v); } catch (e) { /* ignore */ }
    });
  })();

  /* ---------- language ---------- */

  (function () {
    var codes = Object.keys(I18N);
    for (var i = 0; i < codes.length; i++) {
      var opt = document.createElement('option');
      opt.value = codes[i];
      opt.textContent = I18N[codes[i]]._name;
      langSelect.appendChild(opt);
    }
    var lang = i18n.detect();
    langSelect.value = lang;
    i18n.apply(lang);
  })();

  langSelect.addEventListener('change', function () {
    i18n.apply(langSelect.value);
    update();
  });

  /* ---------- wire up ---------- */

  var inputs = [ssidEl, pwEl, secEl, hiddenEl, showPwCardEl];
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener('input', update);
    inputs[i].addEventListener('change', update);
  }

  update();

  if ('serviceWorker' in navigator &&
      (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () { /* offline support is optional */ });
    });
  }
})();
