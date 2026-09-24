/* ============================================================
   实践页渲染：目录 / 搜索 / 进度 / 章节切换 / 截屏加载
   与教程页同款交互，数据来自 practice.js 的 PSTAGES。
   ============================================================ */
(function () {
  'use strict';
  if (document.body.dataset.page !== 'practice') return;
  if (typeof PSTAGES === 'undefined') return;

  var tocEl    = document.getElementById('toc');
  var mainEl   = document.getElementById('chapterView');
  var searchEl = document.getElementById('searchInput');
  var barFill  = document.getElementById('barFill');
  var progTxt  = document.getElementById('progText');
  var progTop  = document.getElementById('topProgress');

  var STORE = 'wb-practice-done';   // 与教程页进度分开存
  var done = {};
  try { done = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { done = {}; }
  function saveDone() { try { localStorage.setItem(STORE, JSON.stringify(done)); } catch (e) {} }

  // 扁平化
  var flat = [];
  PSTAGES.forEach(function (s) {
    s.chapters.forEach(function (c) {
      c.stageNum = s.num;
      c.stageName = s.name;
      c.index = flat.length;
      flat.push(c);
    });
  });
  var totalMin = flat.reduce(function (a, c) { return a + c.min; }, 0);

  var sbMeta = document.getElementById('sbMeta');
  if (sbMeta) sbMeta.textContent = PSTAGES.length + ' 个阶段 · ' + flat.length + ' 章 · 约 ' + totalMin + ' 分钟';

  /* ---------- 截屏位自动加载 ---------- */
  function loadShots(root) {
    (root || document).querySelectorAll('.shot[data-src]').forEach(function (box) {
      var img = new Image();
      img.onload = function () {
        box.classList.add('is-filled');
        box.innerHTML = '';
        box.appendChild(img);
      };
      img.src = box.getAttribute('data-src');
    });
  }

  /* ---------- 渲染目录 ---------- */
  function renderToc() {
    tocEl.innerHTML = '';
    PSTAGES.forEach(function (s, si) {
      var li = document.createElement('li');

      var btn = document.createElement('button');
      btn.className = 'grp-btn' + (si < 2 ? ' open' : '');
      btn.innerHTML =
        '<span class="caret">&#9654;</span>' +
        '<span class="no">' + s.num + '</span>' +
        '<span class="tt">' + s.name + '</span>' +
        '<span class="cnt">' + s.chapters.length + ' 章</span>';
      btn.addEventListener('click', function () {
        btn.classList.toggle('open');
        items.classList.toggle('open');
      });

      var items = document.createElement('ul');
      items.className = 'grp-items' + (si < 2 ? ' open' : '');
      s.chapters.forEach(function (c) {
        var li2 = document.createElement('li');
        var a = document.createElement('button');
        a.className = 'chap' + (done[c.id] ? ' done' : '');
        a.dataset.id = c.id;
        a.dataset.key = (c.id + ' ' + c.t + ' ' + s.name + ' ' + s.desc).toLowerCase();
        a.title = c.id + ' ' + c.t;
        a.innerHTML = '<span class="dot"></span><span class="t">' + c.id + ' ' + c.t + '</span><span class="time">' + c.min + 'm</span>';
        a.addEventListener('click', function () { location.hash = c.id; });
        li2.appendChild(a);
        items.appendChild(li2);
      });

      li.appendChild(btn);
      li.appendChild(items);
      tocEl.appendChild(li);
    });
  }

  /* ---------- 进度 ---------- */
  function renderProgress() {
    var n = Object.keys(done).filter(function (k) { return k.indexOf(':') === -1; }).length;
    var pct = Math.round(n / flat.length * 100);
    barFill.style.width = pct + '%';
    progTxt.innerHTML = '<span>已完成 ' + n + ' / ' + flat.length + ' 章</span><span>' + pct + '%</span>';
    progTop.textContent = 'PRACTICE ' + pct + '%';
  }

  /* ---------- 搜索 ---------- */
  if (searchEl) {
    searchEl.addEventListener('input', function () {
      var q = searchEl.value.trim().toLowerCase();
      tocEl.querySelectorAll('.chap').forEach(function (a) {
        a.classList.toggle('hidden', q !== '' && a.dataset.key.indexOf(q) === -1);
      });
      tocEl.querySelectorAll('li').forEach(function (li) {
        var any = li.querySelectorAll('.chap:not(.hidden)').length > 0;
        li.classList.toggle('hidden', q !== '' && !any);
        if (q !== '' && any) {
          var b = li.querySelector('.grp-btn'), it = li.querySelector('.grp-items');
          if (b && it) { b.classList.add('open'); it.classList.add('open'); }
        }
      });
    });
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- 渲染正文 ---------- */
  function renderChapter(c) {
    var prev = flat[c.index - 1], next = flat[c.index + 1];
    var html = '';

    html += '<div class="crumb">' + c.stageNum + ' ' + esc(c.stageName) + ' &nbsp;/&nbsp; <b>' + c.id + ' ' + esc(c.t) + '</b></div>';
    html += '<div class="ch-kicker">STEP ' + c.id + '</div>';
    html += '<h1 class="ch-title">' + esc(c.t) + '</h1>';
    html += '<div class="chips">' +
      '<span class="chip">难度 · ' + c.level + '</span>' +
      '<span class="chip">约 ' + c.min + ' 分钟</span>' +
      '<span class="chip">阶段 ' + c.stageNum + ' · ' + esc(c.stageName) + '</span>' +
      '<span class="chip warm">全程约 ' + totalMin + ' 分钟</span></div>';

    if (c.goal) {
      html += '<div class="callout tip"><span class="lbl">GOAL</span><span>' + esc(c.goal) + '</span></div>';
    }

    html += '<div class="divider"></div>';
    html += '<p class="lead">' + esc(c.lead) + '</p>';

    var mainShot = (c.shots && c.shots[0]) ? c.shots[0] : null;
    if (mainShot) {
      html += '<div class="shot-wrap" style="margin:20px 0 4px">' +
        '<div class="shot" data-src="assets/screens/' + mainShot[0] + '" style="height:400px">' +
        '<div class="hint"><b>SCREENSHOT ' + c.id + '</b>' + mainShot[1] +
        '<br>把图片放到 <code>assets/screens/' + mainShot[0] + '</code> 即自动替换</div></div>' +
        '<p class="shot-cap">图 ' + c.id + '&nbsp; ' + mainShot[1] + '</p></div>';
    }

    if (c.points && c.points.length) {
      html += '<h3 class="sec-h">要点</h3><ul class="points">';
      c.points.forEach(function (p, i) {
        html += '<li><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span>' + esc(p) + '</span></li>';
      });
      html += '</ul>';
    }

    if (c.code) {
      html += '<div class="code"><div class="code-bar"><span class="t">' + esc(c.code.title) +
        '</span><button class="copy-btn" data-code="' + esc(c.code.lines.map(function (l) { return l[0]; }).join('\n')) +
        '">COPY</button></div><pre>';
      c.code.lines.forEach(function (l) {
        html += '<span class="' + (l[1] || 'out') + '">' + esc(l[0]) + '</span>\n';
      });
      html += '</pre></div>';
    }

    if (c.callouts) {
      c.callouts.forEach(function (cc) {
        var label = { tip: 'TIP', warn: 'WARN', bug: 'BUG' }[cc[0]] || cc[0].toUpperCase();
        html += '<div class="callout ' + cc[0] + '"><span class="lbl">' + label + '</span><span>' + esc(cc[1]) + '</span></div>';
      });
    }

    if (c.shots && c.shots.length > 1) {
      html += '<h3 class="sec-h">补充截屏位</h3><div class="shot-row">';
      c.shots.slice(1).forEach(function (s, i) {
        html += '<div class="shot-wrap">' +
          '<div class="shot" data-src="assets/screens/' + s[0] + '" style="height:260px">' +
          '<div class="hint"><b>SHOT ' + c.id + '-' + (i + 2) + '</b>' + s[1] +
          '<br><code>assets/screens/' + s[0] + '</code></div></div>' +
          '<p class="shot-cap">图 ' + c.id + '-' + (i + 2) + '&nbsp; ' + s[1] + '</p></div>';
      });
      html += '</div>';
    }

    if (c.checks) {
      html += '<div class="check"><h4>动手自检：这几条都做到了，就可以往下走</h4>';
      c.checks.forEach(function (t, i) {
        var key = c.id + ':' + i;
        html += '<label><input type="checkbox" data-check="' + key + '"' + (done[key] ? ' checked' : '') +
          '><span>' + esc(t) + '</span></label>';
      });
      html += '</div>';
    }

    html += '<div class="done-bar"><button class="done-btn' + (done[c.id] ? ' done' : '') + '" id="doneBtn">' +
      (done[c.id] ? '✓ 本步已完成（点击取消）' : '标记本步完成') + '</button>' +
      '<span class="done-note">进度保存在本机浏览器，换设备不同步</span></div>';

    html += '<div class="chap-nav">';
    if (prev) {
      html += '<a class="nav-card" href="#' + prev.id + '"><span class="lbl">PREV</span><span class="t">' + prev.id + ' ' + esc(prev.t) + '</span></a>';
    } else {
      html += '<a class="nav-card" href="index.html"><span class="lbl">HOME</span><span class="t">返回首页</span></a>';
    }
    if (next) {
      html += '<a class="nav-card next" href="#' + next.id + '"><span class="lbl">NEXT</span><span class="t">' + next.id + ' ' + esc(next.t) + '</span></a>';
    } else {
      html += '<a class="nav-card next" href="tutorial.html"><span class="lbl">BACK</span><span class="t">回去翻教程</span></a>';
    }
    html += '</div>';

    mainEl.innerHTML = html;

    mainEl.querySelectorAll('input[data-check]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        if (inp.checked) { done[inp.dataset.check] = true; } else { delete done[inp.dataset.check]; }
        saveDone();
      });
    });

    document.getElementById('doneBtn').addEventListener('click', function () {
      if (done[c.id]) { delete done[c.id]; } else { done[c.id] = true; }
      saveDone();
      renderProgress(); renderToc(); highlight(c.id); renderChapter(c);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    mainEl.querySelectorAll('.copy-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        navigator.clipboard.writeText(b.dataset.code).then(function () {
          b.textContent = 'COPIED';
          setTimeout(function () { b.textContent = 'COPY'; }, 1200);
        });
      });
    });

    loadShots(mainEl);
    document.getElementById('crumbText').textContent = c.stageNum + ' ' + c.stageName;
  }

  function highlight(id) {
    tocEl.querySelectorAll('.chap').forEach(function (a) {
      a.classList.toggle('active', a.dataset.id === id);
      a.classList.toggle('done', !!done[a.dataset.id]);
    });
    PSTAGES.forEach(function (s, si) {
      if (s.chapters.some(function (c) { return c.id === id; })) {
        var li = tocEl.children[si];
        if (li) {
          li.querySelector('.grp-btn').classList.add('open');
          li.querySelector('.grp-items').classList.add('open');
        }
      }
    });
  }

  function findById(id) {
    for (var i = 0; i < flat.length; i++) if (flat[i].id === id) return flat[i];
    return null;
  }

  function route() {
    var c = findById((location.hash || '').replace('#', '')) || flat[0];
    renderChapter(c);
    highlight(c.id);
    window.scrollTo({ top: 0 });
  }

  renderToc();
  renderProgress();
  route();
  window.addEventListener('hashchange', route);
})();
