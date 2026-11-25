{
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ').replace(/[.!?,;]+$/, '').trim();
  const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = window.AI1;
  const KEY = 'vuotai.v1';
  const PASS = 14;
  const STAGES = [
    { id: 'easy', name: 'Easy', c: 'var(--easy)', desc: 'Nhận diện am / is / are, thêm s, don\'t / doesn\'t, Do / Does.' },
    { id: 'medium', name: 'Medium', c: 'var(--med)', desc: 'Chính tả -s / -es, phủ định, câu hỏi Wh-, vị trí trạng từ tần suất.' },
    { id: 'hard', name: 'Hard', c: 'var(--hard)', desc: 'Bẫy chủ ngữ đặc biệt, phát âm đuôi -es, đoạn văn tự gõ đáp án.' }
  ];
  const LEVELS = [
    { n: 1, name: 'Hiện tại đơn' }, { n: 2, name: 'Hiện tại tiếp diễn' }, { n: 3, name: 'Quá khứ đơn' }, { rev: 1, name: 'Ải 1 – 3' },
    { n: 4, name: 'Tương lai đơn, be going to' }, { n: 5, name: 'Danh từ, mạo từ a / an / the' }, { n: 6, name: 'Đại từ, tính từ sở hữu' }, { rev: 2, name: 'Ải 4 – 6' },
    { n: 7, name: 'Hiện tại hoàn thành' }, { n: 8, name: 'So sánh hơn, so sánh nhất' }, { n: 9, name: 'Giới từ thời gian, nơi chốn' }, { rev: 3, name: 'Ải 7 – 9' },
    { n: 10, name: 'Động từ khuyết thiếu' }, { n: 11, name: 'Danh động từ, to V' }, { n: 12, name: 'Trật tự từ trong câu' }, { rev: 4, name: 'Ải 10 – 12' },
    { n: 13, name: 'Câu bị động' }, { n: 14, name: 'Câu điều kiện' }, { n: 15, name: 'Mệnh đề quan hệ' }, { rev: 5, name: 'Ải 13 – 15' }
  ];
  const TYPE = { mc: 'Chọn đáp án đúng', tf: 'True or False', fill: 'Điền từ', match: 'Nối từ', err: 'Tìm chỗ sai', cloze: 'Hoàn thành đoạn văn' };

  let S = {};
  let inited = false;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const res = st => (S.res && S.res[st]) || null;
  const best = st => (res(st) ? res(st).best : 0);
  const starsOf = (n, t) => n >= t ? 3 : n / t >= .85 ? 2 : n / t >= .7 ? 1 : 0;
  const theoryDone = () => !!S.theory;
  const open = st => !!S.all || (st === 'easy' ? theoryDone() : st === 'medium' ? best('easy') >= PASS : best('medium') >= PASS);
  const levelDone = () => best('hard') >= PASS;
  const xp = () => (theoryDone() ? 50 : 0) + STAGES.reduce((a, s) => a + best(s.id) * 10, 0);
  const starRow = (n, cls = 'stars-s') => `<span class="${cls}" aria-label="${n} trên 3 sao">${[1, 2, 3].map(k => `<svg class="${k <= n ? 'on' : ''}"><use href="#i-star"/></svg>`).join('')}</span>`;
  const views = { home: $('#view-home'), ai: $('#view-ai-1') };

  let toastT = 0;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800); };

  let dlgFn = null;
  const dlgClose = () => { $('#dlg').hidden = true; dlgFn = null; };
  const dialog = (t, p, ok, fn) => { $('#dlgT').textContent = t; $('#dlgP').textContent = p; $('#dlgOk').textContent = ok; dlgFn = fn; $('#dlg').hidden = false; $('#dlgNo').focus(); };

  const io = 'IntersectionObserver' in window && !reduce
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .06 })
    : null;
  const observeReveal = () => $$('.rv:not(.in)').forEach(el => (io ? io.observe(el) : el.classList.add('in')));

  const canSay = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function';
  const addSpeakers = (root = document) => {
    if (!canSay) return;
    $$('[data-say]', root).forEach(el => {
      if (el.querySelector('.say')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'say'; b.setAttribute('aria-label', 'Nghe phát âm');
      b.innerHTML = '<svg><use href="#i-sound"/></svg>';
      b.addEventListener('click', ev => {
        ev.preventDefault(); ev.stopPropagation();
        try {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(el.dataset.say);
          u.lang = 'en-US'; u.rate = .9;
          const v = speechSynthesis.getVoices().find(x => /^en[-_]US/i.test(x.lang));
          if (v) u.voice = v;
          speechSynthesis.speak(u);
        } catch (e) { toast('Trình duyệt này chưa phát được âm thanh.'); }
      });
      el.append(b);
    });
  };

  function renderMap() {
    const tr = $('#track'), gap = 150, pad = 96, H = 336;
    const W = pad * 2 + gap * (LEVELS.length - 1);
    const pts = LEVELS.map((l, i) => ({ x: pad + i * gap, y: i % 2 ? 222 : 120 }));
    const curve = list => list.reduce((s, p, i) => i ? `${s} C${list[i - 1].x + gap / 2},${list[i - 1].y} ${p.x - gap / 2},${p.y} ${p.x},${p.y}` : `M${p.x},${p.y}`, '');
    const done = levelDone();
    const reach = done ? 1 : 0;
    const nodes = LEVELS.map((l, i) => {
      const p = pts[i], side = i % 2 ? 'dn' : 'up';
      if (l.rev) return `<button class="node rev" type="button" data-lv="r" style="left:${p.x}px;top:${p.y}px" aria-label="Tổng ôn ${l.rev}, đang khoá"><svg><use href="#i-trophy"/></svg><span class="nl ${side}"><b>Tổng ôn ${l.rev}</b><span>40 câu · ${esc(l.name)}</span></span></button>`;
      let cls = 'lock', inner = '<svg><use href="#i-lock"/></svg>', extra = '';
      if (l.n === 1) {
        cls = done ? 'done' : 'cur';
        inner = done ? '<svg><use href="#i-check"/></svg>' : '1';
        extra = `<span class="pips">${STAGES.map(s => `<i class="${best(s.id) >= PASS ? 'on' : ''}" style="--c:${s.c}"></i>`).join('')}</span>`;
      } else if (l.n === 2 && done) { cls = 'cur'; inner = '2'; }
      return `<button class="node ${cls}" type="button" data-lv="${l.n}" style="left:${p.x}px;top:${p.y}px" aria-label="Ải ${l.n}: ${esc(l.name)}">${inner}<span class="nl ${side}"><b>Ải ${l.n}</b><span>${esc(l.name)}</span>${extra}</span></button>`;
    }).join('');
    tr.style.width = W + 'px';
    tr.style.height = H + 'px';
    tr.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path class="road" d="${curve(pts)}"/>${reach ? `<path class="road-on" d="${curve(pts.slice(0, reach + 1))}"/>` : ''}</svg>${nodes}`;
    const sc = $('#mapScroll');
    sc.scrollLeft = Math.max(0, pts[reach].x - sc.clientWidth / 3);
  }

  function renderStepper() {
    const items = [{ id: 'theory', name: 'Lý thuyết', c: 'var(--th)' }, ...STAGES];
    $('#stepper').innerHTML = items.map(it => {
      let st, mt, extra = '';
      if (it.id === 'theory') { st = theoryDone() ? 'done' : 'cur'; mt = theoryDone() ? 'Đã hoàn thành' : '6 phần, có câu thử ngay'; }
      else {
        const r = res(it.id), ok = open(it.id);
        st = !ok ? 'lock' : r && r.best >= PASS ? 'done' : 'cur';
        mt = !ok ? 'Chưa mở khoá' : r ? `Kỷ lục ${r.best}/20` : '20 câu';
        if (r) extra = starRow(r.stars);
      }
      const ic = st === 'done' ? '<svg><use href="#i-check"/></svg>' : st === 'lock' ? '<svg><use href="#i-lock"/></svg>' : '<i></i>';
      return `<button class="step ${st}" type="button" data-go="${it.id}" style="--c:${it.c}"><span class="ic">${ic}</span><span class="nm">${it.name}</span><span class="mt">${mt}</span>${extra}</button>`;
    }).join('');
  }

  function renderChal() {
    let html = '';
    if (!theoryDone() && !S.all) html += `<div class="chal-start"><p>Đọc xong lý thuyết rồi? Đánh dấu hoàn thành để mở thử thách Easy.</p><button class="btn" type="button" data-act="theory">Hoàn thành lý thuyết, vào Easy</button></div>`;
    html += STAGES.map((s, k) => {
      const r = res(s.id), ok = open(s.id), b = r ? r.best : 0;
      const lockMsg = k === 0 ? 'Hoàn thành lý thuyết để mở' : `Đạt ${PASS}/20 ở ${STAGES[k - 1].name} để mở`;
      return `<article class="cc ${ok ? '' : 'lock'}" style="--c:${s.c}">
        <div class="cc-top"><span class="pill" style="--c:${s.c}">20 câu</span>${r ? starRow(r.stars) : ''}</div>
        <h3>${s.name}</h3>
        <p>${s.desc}</p>
        <div class="meter"><i style="width:${b / 20 * 100}%"></i></div>
        <div class="row"><span>${ok ? (r ? `Kỷ lục ${b}/20` : 'Chưa làm') : lockMsg}</span><span>${r ? `${r.tries} lượt` : ''}</span></div>
        <button class="btn ${ok ? '' : 'soft'}" type="button" data-act="start" data-st="${s.id}" ${ok ? '' : 'disabled'}>${ok ? (r ? 'Làm lại' : 'Bắt đầu') : '<svg><use href="#i-lock"/></svg>Chưa mở khoá'}</button>
      </article>`;
    }).join('');
    $('#chal').innerHTML = html;
  }

  function renderHeroCta() {
    const any = theoryDone() || STAGES.some(s => res(s.id));
    $('#heroGo').textContent = levelDone() ? 'Ôn lại Ải 1' : any ? 'Tiếp tục Ải 1' : 'Bắt đầu Ải 1';
  }

  function renderAll() {
    renderMap(); renderStepper(); renderChal(); renderHeroCta();
    $('#xp').textContent = `${xp()} XP`;
  }

  function renderTries() {
    $$('[data-try]').forEach(box => {
      const t = D.tries[box.dataset.try];
      if (!t) return;
      const draw = () => {
        const opts = shuffle(t.o.map((x, k) => ({ x, ok: !k })));
        box.classList.remove('done');
        box.innerHTML = `<p class="try-l">Thử ngay</p><p class="try-q">${esc(t.q)}</p><div class="try-o">${opts.map((o, k) => `<button type="button" data-k="${k}">${esc(o.x)}</button>`).join('')}</div><p class="try-e" hidden></p>`;
        $$('.try-o button', box).forEach(b => b.addEventListener('click', () => {
          if (box.classList.contains('done')) return;
          const ok = opts[+b.dataset.k].ok;
          box.classList.add('done');
          $$('.try-o button', box).forEach((x, k) => { x.disabled = true; if (opts[k].ok) x.classList.add('ok'); });
          if (!ok) b.classList.add('bad');
          const pe = $('.try-e', box);
          pe.hidden = false;
          pe.innerHTML = `${ok ? '<b class="g">Đúng rồi!</b>' : '<b class="r">Chưa đúng.</b>'} ${t.e}<button type="button">Làm lại</button>`;
          $('button', pe).addEventListener('click', draw);
        }));
      };
      draw();
    });
  }

  const SUBJ = [['You', 'you', 0, 'I'], ['We', 'we', 0, 'we'], ['They', 'they', 0, 'they'], ['He', 'he', 1, 'he'], ['She', 'she', 1, 'she'], ['My mom', 'my mom', 1, 'she'], ['Nam and Lan', 'Nam and Lan', 0, 'they']];
  const VERBS = [['play', 'plays', 'badminton'], ['watch', 'watches', 'TV'], ['study', 'studies', 'English'], ['go', 'goes', 'to school'], ['have', 'has', 'breakfast']];
  let bs = 4, bv = 0;
  function renderBuilder() {
    $('#bSubj').innerHTML = SUBJ.map((s, k) => `<button type="button" role="radio" aria-checked="${k === bs}" data-k="${k}">${s[0]}</button>`).join('');
    $('#bVerb').innerHTML = VERBS.map((v, k) => `<button type="button" role="radio" aria-checked="${k === bv}" data-k="${k}">${v[0]} ${v[2]}</button>`).join('');
    const [S0, sq, sg, a] = SUBJ[bs], [v, v3, obj] = VERBS[bv];
    const pos = `${S0} ${sg ? v3 : v} ${obj}.`, neg = `${S0} ${sg ? "doesn't" : "don't"} ${v} ${obj}.`, q = `${sg ? 'Does' : 'Do'} ${sq} ${v} ${obj}?`;
    const pop = reduce ? '' : ' class="pop"';
    $('#bOut').innerHTML = `
      <div class="b-line"><i>+</i><div><span class="en" data-say="${esc(pos)}">${S0} <em${pop}>${sg ? v3 : v}</em> ${obj}.</span></div></div>
      <div class="b-line"><i>–</i><div><span class="en" data-say="${esc(neg)}">${S0} <em${pop}>${sg ? "doesn't" : "don't"}</em> ${v} ${obj}.</span></div></div>
      <div class="b-line"><i>?</i><div><span class="en" data-say="${esc(q)}"><em${pop}>${sg ? 'Does' : 'Do'}</em> ${sq} ${v} ${obj}?</span><small>Yes, ${a} ${sg ? 'does' : 'do'}. / No, ${a} ${sg ? "doesn't" : "don't"}.</small></div></div>`;
    addSpeakers($('#bOut'));
  }

  function third(raw) {
    const w = raw.trim().toLowerCase();
    if (!/^[a-z]+(?: [a-z]+)*$/.test(w)) return null;
    const [h, ...rest] = w.split(' ');
    const tail = rest.length ? ' ' + rest.join(' ') : '';
    const SP = { have: ['has', 'Trường hợp đặc biệt: have → has.'], be: ['is', 'Trường hợp đặc biệt: be → is.'], do: ['does', 'do tận cùng là o → thêm es.'], go: ['goes', 'go tận cùng là o → thêm es.'] };
    if (SP[h]) return [h, SP[h][0], tail, SP[h][1]];
    const m = h.match(/(ch|sh|s|x|z|o)$/);
    if (m) return [h, h + 'es', tail, `Tận cùng “${m[1]}” → thêm es.`];
    if (/[^aeiou]y$/.test(h)) return [h, h.slice(0, -1) + 'ies', tail, 'Phụ âm + y → bỏ y, thêm ies.'];
    if (/[aeiou]y$/.test(h)) return [h, h + 's', tail, 'Nguyên âm + y → giữ y, chỉ thêm s.'];
    return [h, h + 's', tail, 'Trường hợp thông thường → thêm s.'];
  }
  function renderConv() {
    const r = third($('#convIn').value);
    if (!r) { $('#convOut').textContent = '…'; $('#convWhy').textContent = 'Gõ một động từ tiếng Anh, ví dụ: watch, study, play.'; return; }
    const [base, out, tail, why] = r;
    let k = 0;
    while (k < base.length && base[k] === out[k]) k++;
    $('#convOut').innerHTML = `he ${esc(out.slice(0, k))}<b>${esc(out.slice(k))}</b>${esc(tail)}`;
    $('#convWhy').textContent = why;
  }

  function drawMM() {
    const mm = $('#mm');
    if (!mm || views.ai.hidden) return;
    const R = mm.getBoundingClientRect(), C = $('#mmC').getBoundingClientRect();
    if (!R.width) return;
    const svg = $('#mmLines');
    svg.setAttribute('viewBox', `0 0 ${R.width} ${R.height}`);
    const stacked = matchMedia('(max-width: 760px)').matches;
    const bs4 = $$('.mm-b', mm);
    let out = '';
    if (stacked) {
      const x = 16, ys = bs4.map(b => b.getBoundingClientRect().top - R.top + 30);
      out += `<path d="M${x},${C.bottom - R.top - 12} L${x},${Math.max(...ys) - 14}" style="stroke:var(--line)" pathLength="1"/>`;
      bs4.forEach((b, i) => {
        const B = b.getBoundingClientRect(), y = ys[i], x2 = B.left - R.left;
        out += `<path d="M${x},${y - 14} Q${x},${y} ${x + 14},${y} L${x2},${y}" stroke="${b.style.getPropertyValue('--c').trim()}" pathLength="1"/>`;
      });
    } else {
      const cx = C.left + C.width / 2 - R.left, cy = C.top + C.height / 2 - R.top, rad = C.width / 2;
      bs4.forEach(b => {
        const B = b.getBoundingClientRect(), left = B.left + B.width / 2 - R.left < cx;
        const x2 = (left ? B.right : B.left) - R.left, y2 = B.top + B.height / 2 - R.top;
        const th = Math.atan2(y2 - cy, x2 - cx), x1 = cx + rad * Math.cos(th), y1 = cy + rad * Math.sin(th), mx = (x1 + x2) / 2;
        out += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} C${mx.toFixed(1)},${y1.toFixed(1)} ${mx.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" stroke="${b.style.getPropertyValue('--c').trim()}" pathLength="1"/>`;
      });
    }
    svg.innerHTML = out;
  }

  const jump = (top, smooth) => window.scrollTo({ top, behavior: smooth && !reduce ? 'smooth' : 'instant' });
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    let target = null;
    if (h && h !== 'ai-1' && h !== 'home') target = document.getElementById(h);
    const inAi = h === 'ai-1' || !!(target && views.ai.contains(target));
    const switched = views.ai.hidden === inAi;
    views.home.hidden = inAi;
    views.ai.hidden = !inAi;
    if (inAi) { renderStepper(); renderChal(); } else renderMap();
    observeReveal();
    requestAnimationFrame(() => {
      drawMM();
      if (target) target.scrollIntoView({ behavior: switched || reduce ? 'instant' : 'smooth' });
      else if (switched || h === 'home' || h === 'ai-1') jump(0, !switched);
    });
  }

  let Q = null;
  function prep(q) {
    const o = { ...q };
    if (q.t === 'mc') o.opts = shuffle(q.o.map((x, k) => ({ x, ok: !k })));
    if (q.t === 'fill' || q.t === 'cloze') {
      o.parts = q.q.split(/\{([^}]*)\}/);
      o.gaps = o.parts.filter((_, i) => i % 2).map(s => { const a = s.split('|'); return { a, opts: q.m === 'pick' ? shuffle(a) : null }; });
      o.w = Math.max(6, ...o.gaps.flatMap(g => g.a.map(s => s.length))) + 1;
    }
    if (q.t === 'err') o.parts = q.q.split(/\{([^}]*)\}/);
    if (q.t === 'match') o.right = shuffle(q.p.map((p, k) => ({ x: p[1], k })));
    return o;
  }
  const plain = q => q.t === 'match' ? q.q : q.t === 'err' ? q.q.replace(/[{}]/g, '') : q.q.replace(/\{[^}]*\}/g, '___');
  function ansText(q) {
    if (q.t === 'mc') return q.o[0];
    if (q.t === 'tf') return q.a ? 'True, câu này đúng ngữ pháp.' : `False. Câu đúng: ${q.fix}`;
    if (q.t === 'fill' || q.t === 'cloze') return q.gaps.map(g => g.a[0]).join(' · ');
    if (q.t === 'err') return `(${'ABCD'[q.a]}) ${q.parts[2 * q.a + 1]}. Câu đúng: ${q.fix}`;
    return q.p.map(p => `${p[0]} → ${p[1]}`).join(' · ');
  }
  function hintOf(q) {
    if (q.t === 'mc') return q.q.includes('___') ? 'Chọn đáp án đúng để điền vào chỗ trống.' : 'Chọn một đáp án.';
    if (q.t === 'tf') return 'Câu dưới đây đúng (True) hay sai (False) ngữ pháp?';
    if (q.t === 'fill') return 'Gõ dạng đúng của động từ trong ngoặc. Chỗ trống không có ngoặc là trợ động từ.';
    if (q.t === 'err') return 'Một trong bốn phần gạch chân bị sai. Chạm vào phần đó.';
    if (q.t === 'match') return `${q.q} Chạm một ô bên trái, rồi chạm ô hợp với nó bên phải.`;
    return q.m === 'pick' ? 'Chọn từ đúng cho mỗi chỗ trống trong đoạn văn.' : 'Gõ dạng đúng của động từ trong ngoặc. Chỗ trống không có ngoặc là trợ động từ.';
  }
  function gapHTML(q) {
    let gi = 0;
    return q.parts.map((p, i) => {
      if (!(i % 2)) return esc(p).replace(/\n/g, '<br>');
      const g = q.gaps[gi], id = gi++;
      if (q.m === 'pick') return `<span class="gap"><select data-g="${id}" aria-label="Chỗ trống ${id + 1}"><option value="">…</option>${g.opts.map(o => `<option>${esc(o)}</option>`).join('')}</select></span>`;
      return `<span class="gap"><input data-g="${id}" style="width:calc(${q.w}ch + 22px)" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Chỗ trống ${id + 1}"></span>`;
    }).join('');
  }

  function startQuiz(st) {
    if (!open(st)) { toast(st === 'easy' ? 'Hoàn thành lý thuyết trước nhé.' : `Đạt ${PASS}/20 ở thử thách trước để mở khoá.`); return; }
    const stg = STAGES.find(s => s.id === st);
    Q = { st, stg, items: shuffle(D.sets[st]).map(prep), i: 0, score: 0, streak: 0, top: 0, wrong: [], phase: 'ask', sel: null, pairs: {}, act: null, next: null };
    const qz = $('#quiz');
    qz.style.setProperty('--stage', stg.c);
    qz.hidden = false;
    document.body.classList.add('noscroll');
    renderQ();
  }
  function closeQuiz() {
    $('#quiz').hidden = true;
    document.body.classList.remove('noscroll');
    Q = null;
    renderAll();
  }
  function askClose() {
    if (!Q) return;
    if (Q.phase === 'done' || (Q.i === 0 && Q.phase === 'ask')) { closeQuiz(); return; }
    dialog('Thoát lượt làm bài?', 'Kết quả của lượt này sẽ không được lưu.', 'Thoát', closeQuiz);
  }
  const ready = on => { $('#qBtn').disabled = !on; };
  function setTop() {
    $('#qBar').style.width = `${(Q.i + (Q.phase === 'ask' ? 0 : 1)) / Q.items.length * 100}%`;
    $('#qCt').textContent = `${Math.min(Q.i + 1, Q.items.length)}/${Q.items.length}`;
    $('#qStreak b').textContent = Q.streak;
    $('#qStreak').classList.toggle('hot', Q.streak >= 3);
  }

  function renderQ() {
    const q = Q.items[Q.i];
    Q.phase = 'ask'; Q.sel = null; Q.pairs = {}; Q.act = null;
    setTop();
    let body = '';
    if (q.t === 'mc') body = `<h2 class="qprompt">${esc(q.q).replace(/___/g, '<span class="blank"></span>')}</h2><div class="opts">${q.opts.map((o, k) => `<button class="opt" type="button" data-k="${k}"><kbd>${'ABCD'[k]}</kbd><span>${esc(o.x)}</span></button>`).join('')}</div>`;
    else if (q.t === 'tf') body = `<p class="tfq">${esc(q.q)}</p><div class="opts"><button class="opt" type="button" data-v="1"><kbd>T</kbd><span>True<small>Đúng ngữ pháp</small></span></button><button class="opt" type="button" data-v="0"><kbd>F</kbd><span>False<small>Sai ngữ pháp</small></span></button></div>`;
    else if (q.t === 'fill' || q.t === 'cloze') body = `<div class="gaps ${q.t}">${gapHTML(q)}</div>`;
    else if (q.t === 'err') body = `<p class="err">${q.parts.map((p, i) => i % 2 ? `<button class="seg" type="button" data-k="${(i - 1) / 2}" data-l="${'ABCD'[(i - 1) / 2]}">${esc(p)}</button>` : esc(p)).join('')}</p>`;
    else body = `<div class="match"><div class="mcol">${q.p.map((p, k) => `<button class="mi" type="button" data-side="l" data-k="${k}">${esc(p[0])}</button>`).join('')}</div><div class="mcol">${q.right.map((r, k) => `<button class="mi" type="button" data-side="r" data-k="${k}">${esc(r.x)}</button>`).join('')}</div></div>`;
    $('#qBody').innerHTML = `<div class="qcard${reduce ? '' : ' enter'}"><p class="qtype"><i></i>${TYPE[q.t]}</p><p class="qhint">${esc(hintOf(q))}</p>${body}</div>`;
    $('#qBody').scrollTop = 0;
    const f = $('#qFoot');
    f.className = 'qfoot';
    $('#qFb').innerHTML = '';
    const btn = $('#qBtn');
    btn.textContent = 'Kiểm tra';
    ready(false);
    const first = $('#qBody input, #qBody select');
    if (first && matchMedia('(pointer: fine)').matches) first.focus();
  }

  function paintMatch() {
    $$('#qBody .mi').forEach(el => { el.removeAttribute('data-c'); el.classList.remove('act'); const t = $('.tag', el); if (t) t.remove(); });
    Object.entries(Q.pairs).forEach(([l, r]) => {
      [$(`#qBody .mi[data-side="l"][data-k="${l}"]`), $(`#qBody .mi[data-side="r"][data-k="${r}"]`)].forEach(el => {
        el.dataset.c = l % 4;
        el.insertAdjacentHTML('beforeend', `<span class="tag">${+l + 1}</span>`);
      });
    });
    if (Q.act) $(`#qBody .mi[data-side="${Q.act.side}"][data-k="${Q.act.k}"]`).classList.add('act');
  }
  function matchClick(b) {
    const side = b.dataset.side, k = +b.dataset.k;
    const owner = side === 'l' ? (k in Q.pairs ? k : null) : (() => { const f = Object.keys(Q.pairs).find(l => Q.pairs[l] === k); return f === undefined ? null : +f; })();
    if (owner !== null) { delete Q.pairs[owner]; Q.act = null; }
    else if (Q.act && Q.act.side !== side) { const l = side === 'l' ? k : Q.act.k, r = side === 'r' ? k : Q.act.k; Q.pairs[l] = r; Q.act = null; }
    else Q.act = Q.act && Q.act.side === side && Q.act.k === k ? null : { side, k };
    paintMatch();
    ready(Object.keys(Q.pairs).length === Q.items[Q.i].p.length);
  }
  const gapsFilled = () => $$('#qBody [data-g]').every(el => el.value.trim() !== '');

  function check() {
    const q = Q.items[Q.i], body = $('#qBody');
    let ok = true;
    if (q.t === 'mc') {
      ok = q.opts[Q.sel].ok;
      $$('.opt', body).forEach((b, k) => { b.classList.remove('sel'); if (q.opts[k].ok) b.classList.add('ok'); else if (k === Q.sel) b.classList.add('bad'); });
    } else if (q.t === 'tf') {
      ok = Q.sel === q.a;
      $$('.opt', body).forEach(b => { const v = b.dataset.v === '1'; b.classList.remove('sel'); if (v === q.a) b.classList.add('ok'); else if (v === Q.sel) b.classList.add('bad'); });
    } else if (q.t === 'fill' || q.t === 'cloze') {
      q.gaps.forEach((g, gi) => {
        const el = $(`[data-g="${gi}"]`, body), v = norm(el.value);
        const good = q.m === 'pick' ? v === norm(g.a[0]) : g.a.some(a => norm(a) === v);
        el.parentElement.classList.add(good ? 'ok' : 'bad');
        el.disabled = true;
        if (!good) { ok = false; el.parentElement.insertAdjacentHTML('beforeend', `<span class="fix">${esc(g.a[0])}</span>`); }
      });
    } else if (q.t === 'err') {
      ok = Q.sel === q.a;
      $$('.seg', body).forEach((b, k) => { b.classList.remove('sel'); if (k === q.a) b.classList.add('hit'); else if (k === Q.sel) b.classList.add('bad'); });
    } else {
      q.p.forEach((_, l) => {
        const want = q.right.findIndex(r => r.k === l), r = Q.pairs[l], good = r === want;
        $(`.mi[data-side="l"][data-k="${l}"]`, body).classList.add(good ? 'ok' : 'bad');
        $(`.mi[data-side="r"][data-k="${r}"]`, body).classList.add(good ? 'ok' : 'bad');
        if (!good) ok = false;
      });
    }
    $('.qcard', body).classList.add('done');
    Q.phase = 'shown';
    if (ok) { Q.score++; Q.streak++; Q.top = Math.max(Q.top, Q.streak); }
    else { Q.streak = 0; Q.wrong.push(q); }
    setTop();
    const praise = Q.streak >= 3 ? `Chuỗi ${Q.streak} câu đúng!` : ['Chính xác!', 'Tuyệt vời!', 'Đúng rồi!', 'Quá chuẩn!'][Math.floor(Math.random() * 4)];
    const fixLine = (q.t === 'tf' && !q.a) || q.t === 'err' ? `<p class="ans">Câu đúng: <b>${esc(q.fix)}</b></p>` : '';
    $('#qFoot').className = 'qfoot ' + (ok ? 'ok' : 'bad');
    $('#qFb').innerHTML = `<h3><svg><use href="#i-${ok ? 'check' : 'x'}"/></svg>${ok ? praise : 'Chưa đúng rồi'}</h3>${ok ? fixLine : `<p class="ans">Đáp án: <b>${esc(ansText(q))}</b></p>`}<p class="why">${q.e}</p>`;
    const btn = $('#qBtn');
    btn.textContent = Q.i + 1 < Q.items.length ? 'Tiếp tục' : 'Xem kết quả';
    ready(true);
    btn.focus({ preventScroll: true });
  }

  function finish() {
    Q.phase = 'done';
    const n = Q.items.length, sc = Q.score, st = starsOf(sc, n), pass = sc >= PASS;
    const prev = res(Q.st);
    S.res = S.res || {};
    S.res[Q.st] = { best: Math.max(sc, prev ? prev.best : 0), stars: Math.max(st, prev ? prev.stars : 0), tries: (prev ? prev.tries : 0) + 1 };
    save();
    renderAll();
    const idx = STAGES.findIndex(s => s.id === Q.st), next = STAGES[idx + 1];
    const fresh = pass && !(prev && prev.best >= PASS);
    const title = sc === n ? 'Hoàn hảo!' : pass ? 'Vượt qua!' : sc >= 10 ? 'Gần được rồi!' : 'Cố thêm chút nữa nhé';
    const msg = pass
      ? (next ? (fresh ? `Bạn đã mở khoá thử thách ${next.name}.` : `Thử thách ${next.name} đang chờ bạn.`) : 'Bạn đã vượt qua Ải 1. Ải 2 sẽ mở khi được soạn xong.')
      : `Cần ${PASS}/${n} để ${next ? 'mở khoá ' + next.name : 'hoàn thành Ải 1'}. Xem lại các câu sai bên dưới rồi thử lại nhé.`;
    $('#qBar').style.width = '100%';
    $('#qCt').textContent = `${n}/${n}`;
    $('#qBody').innerHTML = `<div class="res">
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="rt" cx="60" cy="60" r="52"/><circle class="rf" cx="60" cy="60" r="52" pathLength="100" style="--v:${sc / n * 100}"/></svg>
      <p class="rs"><b>${sc}</b>trên ${n} câu</p>
      <div class="stars" aria-label="${st} trên 3 sao">${[1, 2, 3].map(k => `<svg class="${k <= st ? 'on' : ''}" style="--d:${.9 + k * .18}s"><use href="#i-star"/></svg>`).join('')}</div>
      <h2>${title}</h2><p class="sub">${msg}</p>
      <div class="res-stats"><div><b>${Q.top}</b><span>Chuỗi đúng dài nhất</span></div><div><b>${S.res[Q.st].best}/${n}</b><span>Kỷ lục ${Q.stg.name}</span></div><div><b>${xp()}</b><span>Tổng XP</span></div></div>
      ${Q.wrong.length ? `<div class="review"><h3>Xem lại ${Q.wrong.length} câu sai</h3>${Q.wrong.map(w => `<div class="rw"><p class="rq">${esc(plain(w))}</p><p class="ra">${esc(ansText(w))}</p><p class="re">${w.e}</p></div>`).join('')}</div>` : ''}
    </div>`;
    $('#qBody').scrollTop = 0;
    $('#qFoot').className = 'qfoot';
    $('#qFb').innerHTML = `<div class="acts">${pass ? '<button class="btn soft" type="button" data-q="retry">Làm lại</button>' : ''}<button class="btn soft" type="button" data-q="lesson">Về bài học</button></div>`;
    const btn = $('#qBtn');
    if (pass && next) { btn.textContent = `Vào ${next.name}`; Q.next = () => startQuiz(next.id); }
    else if (pass) { btn.textContent = 'Về bản đồ'; Q.next = () => { closeQuiz(); location.hash = 'lo-trinh'; }; }
    else { btn.textContent = 'Làm lại'; Q.next = () => startQuiz(Q.st); }
    ready(true);
    if (pass && !reduce) confetti();
  }

  function confetti() {
    const c = $('#confetti'), x = c.getContext('2d');
    const W = c.width = innerWidth, H = c.height = innerHeight;
    const cols = ['#0a84ff', '#34c759', '#ff9f0a', '#ff375f', '#64d2ff', '#ffd60a'];
    const ps = Array.from({ length: 140 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .32, vx: (Math.random() - .5) * 14, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 5, c: cols[Math.floor(Math.random() * 6)], a: Math.random() * 6, va: (Math.random() - .5) * .3 }));
    let f = 0;
    c.style.display = 'block';
    const step = () => {
      x.clearRect(0, 0, W, H);
      ps.forEach(p => { p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
      if (++f < 160) requestAnimationFrame(step); else { x.clearRect(0, 0, W, H); c.style.display = 'none'; }
    };
    step();
  }

  function bind() {
    $('#qBody').addEventListener('click', e => {
      if (!Q || Q.phase !== 'ask') return;
      const b = e.target.closest('button');
      if (!b) return;
      const q = Q.items[Q.i];
      if (q.t === 'mc' || q.t === 'tf' || q.t === 'err') {
        $$('#qBody .sel').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        Q.sel = q.t === 'tf' ? b.dataset.v === '1' : +b.dataset.k;
        ready(true);
      } else if (q.t === 'match' && b.classList.contains('mi')) matchClick(b);
    });
    const onGap = () => { if (Q && Q.phase === 'ask') ready(gapsFilled()); };
    $('#qBody').addEventListener('input', onGap);
    $('#qBody').addEventListener('change', onGap);
    $('#qBtn').addEventListener('click', () => {
      if (!Q) return;
      if (Q.phase === 'ask') check();
      else if (Q.phase === 'shown') { Q.i++; if (Q.i < Q.items.length) renderQ(); else finish(); }
      else if (Q.next) Q.next();
    });
    $('#qFb').addEventListener('click', e => {
      const b = e.target.closest('[data-q]');
      if (!b || !Q) return;
      if (b.dataset.q === 'retry') startQuiz(Q.st);
      else { closeQuiz(); location.hash = 'thu-thach'; }
    });
    $('#qClose').addEventListener('click', askClose);
    $('#dlgNo').addEventListener('click', dlgClose);
    $('#dlgOk').addEventListener('click', () => { const f = dlgFn; dlgClose(); if (f) f(); });
    $('#dlg').addEventListener('click', e => { if (e.target.id === 'dlg') dlgClose(); });
    document.addEventListener('keydown', e => {
      if (!$('#dlg').hidden) { if (e.key === 'Escape') dlgClose(); return; }
      if (!Q || $('#quiz').hidden) return;
      if (e.key === 'Escape') { askClose(); return; }
      if (e.key === 'Enter') {
        if (e.target.closest('button') || e.target.tagName === 'SELECT') return;
        if (!$('#qBtn').disabled) { e.preventDefault(); $('#qBtn').click(); }
        return;
      }
      if (Q.phase === 'ask' && /^[1-4]$/.test(e.key) && !/INPUT|SELECT/.test(e.target.tagName)) {
        const q = Q.items[Q.i];
        const list = q.t === 'mc' || q.t === 'tf' ? $$('#qBody .opt') : q.t === 'err' ? $$('#qBody .seg') : [];
        const b = list[+e.key - 1];
        if (b) b.click();
      }
    });

    document.addEventListener('click', e => {
      const a = e.target.closest('[data-act],[data-go],[data-lv]');
      if (!a || a.disabled) return;
      if (a.dataset.lv) {
        const lv = a.dataset.lv;
        if (lv === '1') location.hash = 'ai-1';
        else if (lv === 'r') toast('Trạm tổng ôn mở sau khi bạn vượt đủ ba ải trước nó.');
        else if (lv === '2' && levelDone()) toast('Ải 2 đang được soạn, sắp ra mắt.');
        else toast('Vượt các ải phía trước để mở khoá ải này.');
      } else if (a.dataset.go) {
        if (a.dataset.go === 'theory') $('#so-do').scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' });
        else startQuiz(a.dataset.go);
      } else if (a.dataset.act === 'theory') { S.theory = true; save(); renderAll(); startQuiz('easy'); }
      else if (a.dataset.act === 'start') startQuiz(a.dataset.st);
    });

    $('#bSubj').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { bs = +b.dataset.k; renderBuilder(); } });
    $('#bVerb').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { bv = +b.dataset.k; renderBuilder(); } });
    $('#convIn').addEventListener('input', renderConv);
    $('#convChips').innerHTML = ['study', 'play', 'go', 'fix', 'have', 'wash', 'carry', 'enjoy', 'kiss', 'do'].map(w => `<button type="button">${w}</button>`).join('');
    $('#convChips').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { $('#convIn').value = b.textContent; renderConv(); } });

    const sc = $('#mapScroll');
    $('#mapPrev').addEventListener('click', () => sc.scrollBy({ left: -sc.clientWidth * .7, behavior: reduce ? 'instant' : 'smooth' }));
    $('#mapNext').addEventListener('click', () => sc.scrollBy({ left: sc.clientWidth * .7, behavior: reduce ? 'instant' : 'smooth' }));

    const car = $('#car'), slides = $$('.slide', car);
    $('#carDots').innerHTML = slides.map((_, k) => `<button type="button" aria-label="Thẻ ${k + 1}" data-k="${k}"></button>`).join('');
    const carW = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : 1);
    const carIdx = () => Math.min(slides.length - 1, Math.round(car.scrollLeft / carW()));
    const carGo = k => { k = Math.max(0, Math.min(slides.length - 1, k)); car.scrollTo({ left: k * carW(), behavior: reduce ? 'instant' : 'smooth' }); };
    const carSync = () => {
      const i = carIdx(), end = car.scrollLeft + car.clientWidth >= car.scrollWidth - 4;
      $$('#carDots button').forEach((b, k) => b.classList.toggle('on', end ? k === slides.length - 1 : k === i));
      $('#carPrev').disabled = car.scrollLeft < 4;
      $('#carNext').disabled = end;
    };
    car.addEventListener('scroll', () => requestAnimationFrame(carSync), { passive: true });
    $('#carDots').addEventListener('click', e => { const b = e.target.closest('button'); if (b) carGo(+b.dataset.k); });
    $('#carPrev').addEventListener('click', () => carGo(carIdx() - 1));
    $('#carNext').addEventListener('click', () => carGo(carIdx() + 1));
    car.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); carGo(carIdx() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); carGo(carIdx() - 1); }
    });
    carSync();
    const carRO = new ResizeObserver(carSync);
    carRO.observe(car);

    const mmRO = new ResizeObserver(() => drawMM());
    mmRO.observe($('#mm'));

    if ('IntersectionObserver' in window) {
      const secIO = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) $$('.ll a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
      }), { rootMargin: '-45% 0px -50% 0px' });
      ['so-do', 'cach-dung', 'cau-truc', 's-es', 'dau-hieu', 'loi-sai'].forEach(id => secIO.observe(document.getElementById(id)));
    }

    const hero = $('#hero');
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking || reduce) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (views.home.hidden) return;
        const p = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * .85)));
        hero.style.setProperty('--p', p.toFixed(3));
      });
    }, { passive: true });

    $('#unlockAll').addEventListener('change', e => {
      S.all = e.target.checked; save(); renderAll();
      toast(S.all ? 'Đã mở khoá mọi thử thách để xem thử.' : 'Đã tắt chế độ xem thử.');
    });
    $('#resetBtn').addEventListener('click', () => dialog('Xoá toàn bộ tiến độ?', 'Điểm, sao và trạng thái mở khoá sẽ trở về ban đầu.', 'Xoá', () => {
      S = {}; save(); $('#unlockAll').checked = false; renderAll(); toast('Đã xoá tiến độ.');
    }));
    window.addEventListener('hashchange', route);
  }

  function start(d) {
    if (inited) return;
    inited = true;
    S = d && typeof d === 'object' && Object.keys(d).length ? d : load();
    $('#unlockAll').checked = !!S.all;
    bind();
    renderTries();
    renderBuilder();
    renderConv();
    addSpeakers();
    renderAll();
    route();
  }

  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.snapshot === 'function') hot.snapshot(() => S);
  if (hot && typeof hot.ready === 'function') hot.ready(start);
  else start((hot && hot.data) || {});
}
