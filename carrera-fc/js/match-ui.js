'use strict';
/* ===== Partido en directo ===== */
let LV = null;
const EVICON = { goal: '⚽', yc: '🟨', rc: '🟥', inj: '🩹', sub: '🔁', save: '🧤', shot: '🎯', pen: '🥅', moment: '🎮', ht: '⏱️', ft: '🏁', ko: '📣', txt: '💬' };

function matchSetup(intl) {
  const e = curEvent();
  if (intl) {
    const p = mePlayer();
    const H = UI.intl.mine, A = UI.intl.foe;
    return { H, A, uf: { h: 101, a: 102, kind: 'I' }, opts: { mySide: 0, userSide: -1, userPid: p.id, moments: true, neutral: true }, intl: true, name: 'Amistoso internacional' };
  }
  const uf = userFixture(e), H = teamOf(uf.h), A = teamOf(uf.a), side = uf.h === G.utid ? 0 : 1;
  const base = { neutral: !!uf.final, cup: uf.kind === 'C' };
  const opts = G.mode === 'manager' ? { ...base, userSide: side, mySide: side, moments: false } : { ...base, userSide: -1, mySide: side, userPid: G.career.pid, moments: true };
  return { H, A, uf, opts, name: evName(e) };
}
ACT.play = d => {
  const intl = d.intl === '1', S = matchSetup(intl);
  if (G.mode === 'manager') repairLineup(teamOf(G.utid));
  const m = new Match(S.H, S.A, S.opts);
  LV = { m, speed: 2, paused: false, S, evIdx: 0, pos: {}, ball: { x: .5, y: .5 }, tab: 'live', timer: null, intl, done: false, stSnap: G.mode === 'player' ? JSON.parse(JSON.stringify(mePlayer().st)) : null };
  UI.liveName = S.name;
  go('match');
};
ACT.simmatch = d => {
  const intl = d.intl === '1', S = matchSetup(intl);
  if (G.mode === 'manager') repairLineup(teamOf(G.utid));
  const snap = G.mode === 'player' ? JSON.parse(JSON.stringify(mePlayer().st)) : null;
  const res = simulate(S.H, S.A, { neutral: S.opts.neutral, cup: S.opts.cup, userSide: -1 });
  completeMatch(res, S, snap);
};
function stopLive() { if (LV) { clearTimeout(LV.timer); cancelAnimationFrame(LV.raf); LV = null; } const mo = $('#momentbox'); if (mo) mo.remove(); }

function completeMatch(res, S, snap) {
  if (S.intl) {
    const p = mePlayer(), c = G.career, row = res.rows.find(r => r.p.id === p.id);
    if (snap) p.st = snap;
    if (row) { c.caps++; c.ncGoals += row.g; c.fame = Math.min(100, c.fame + 1.5 + row.g * 2 + (row.r - 6.5)); c.log.unshift({ s: G.season, w: G.week, h: res.home.short, a: res.away.short, hg: res.hg, ag: res.ag, r: row.r, g: row.g, a2: row.a, min: row.min, intl: true, mine: true }); }
    UI.last = { res, week: G.week, intl: true, dnp: '' };
    cleanupTemp(); UI.intl = null;
    runEvent(null); autosave();
    return go('postmatch');
  }
  const uf = S.uf, row = G.mode === 'player' ? res.rows.find(r => r.p.id === G.career.pid) : null;
  UI.last = { res, week: G.week, intl: false, dnp: G.mode === 'player' && !row ? (mePlayer().inj ? 'Lesionado' : 'No has entrado en el partido') : '' };
  runEvent(res); autosave();
  go('postmatch');
}

SCREENS.match = () => {
  const m = LV.m, [H, A] = [m.sides[0].team, m.sides[1].team];
  const mgr = G.mode === 'manager' && !LV.intl;
  return `<div class="main" style="max-width:1250px;margin:0 auto;padding:14px 12px 90px">
  <div class="score mb"><div class="tm">${crest(H, 38)}<span>${esc(H.name)}</span></div><div class="sc"><span id="s0">0</span> - <span id="s1">0</span></div><div class="tm"><span>${esc(A.name)}</span>${crest(A, 38)}</div><div class="clock" id="clock">0'</div></div>
  <div class="mwrap"><div class="col"><canvas class="pitch" id="pitch" width="1050" height="680"></canvas>
  <div class="panel row wrap gap8"><button class="btn" id="bpause" data-a="lvpause">⏸ Pausa</button>${[1, 2, 4, 8].map(s => `<button class="btn sm ${LV.speed === s ? 'pri' : ''}" data-a="lvspeed" data-s="${s}">x${s}</button>`).join('')}<button class="btn sm" data-a="lvht">⏭ Descanso</button><button class="btn sm" data-a="lvend">⏩ Final</button><span class="grow"></span>${mgr ? '<button class="btn sm blue" data-a="lvtac">📋 Táctica</button><button class="btn sm blue" data-a="lvsub">🔁 Cambios</button>' : ''}</div></div>
  <div class="panel"><div class="tabs"><button class="on" data-a="lvtab" data-k="live">Directo</button><button data-a="lvtab" data-k="stats">Estadísticas</button>${LV.intl || G.mode === 'player' ? '<button data-a="lvtab" data-k="me">Mi partido</button>' : '<button data-a="lvtab" data-k="xi">Once</button>'}</div><div id="lvbody"></div></div></div></div>`;
};
SCREENS['match$'] = () => {
  const cv = $('#pitch'); LV.cv = cv; LV.ctx = cv.getContext('2d');
  LV.evIdx = 0; renderLiveBody(true); loopDraw(); scheduleStep(700);
};
function scheduleStep(ms) { clearTimeout(LV.timer); LV.timer = setTimeout(stepLive, ms); }
const speedMs = () => ({ 1: 650, 2: 330, 4: 150, 8: 60 })[LV.speed] || 330;
function stepLive() {
  if (!LV) return;
  const m = LV.m;
  if (LV.paused || m.finished || LV.overlay) return;
  m.step(); afterStep();
  if (LV && !LV.paused && !m.finished && !LV.overlay) scheduleStep(speedMs());
}
function afterStep() {
  const m = LV.m;
  $('#s0').textContent = m.sides[0].goals; $('#s1').textContent = m.sides[1].goals; $('#clock').textContent = m.label;
  renderLiveBody(false);
  if (m.pending) return showMoment();
  if (m.finished) return liveFinished();
  if (m.atHT && !LV.htShown) { LV.htShown = true; LV.paused = true; $('#bpause').textContent = '▶ Reanudar'; showHT(); }
}
function iconRow(e) { return `<div class="ev ${e.type}"><b>${e.l}</b><span>${EVICON[e.type] || ''}</span><span>${esc(e.text)}</span></div>`; }
function renderLiveBody(reset) {
  const m = LV.m, el = $('#lvbody'); if (!el) return;
  if (LV.tab === 'live') {
    let box = $('#evlog');
    if (reset || !box) { el.innerHTML = '<div class="evlog" id="evlog"></div>'; box = $('#evlog'); LV.evIdx = 0; }
    const ev = m.events;
    if (LV.evIdx < ev.length) { const add = ev.slice(LV.evIdx).reverse().map(iconRow).join(''); box.insertAdjacentHTML('afterbegin', add); LV.evIdx = ev.length; }
    return;
  }
  LV.evIdx = -1;
  if (LV.tab === 'stats') {
    const [a, b] = m.sides, pt = a.st.poss + b.st.poss || 1, ph = Math.round(100 * a.st.poss / pt);
    const sb = (l, x, y) => { const t = x + y || 1; return `<div class="sbar"><b>${x}</b><div><div class="muted tiny center">${l}</div><div class="tr"><i style="width:${100 * x / t}%;background:${lum(a.team.c1) > 200 ? a.team.c2 : a.team.c1}"></i><i style="width:${100 * y / t}%;background:${lum(b.team.c1) > 200 ? b.team.c2 : b.team.c1}"></i></div></div><b>${y}</b></div>`; };
    el.innerHTML = sb('Posesión %', ph, 100 - ph) + sb('Tiros', a.st.sh, b.st.sh) + sb('A puerta', a.st.sot, b.st.sot) + sb('Córners', a.st.corn, b.st.corn) + sb('Faltas', a.st.fouls, b.st.fouls) + sb('Amarillas', a.st.yc, b.st.yc) + sb('Rojas', a.st.rc, b.st.rc);
  } else if (LV.tab === 'me') {
    const si = m.mySide >= 0 ? m.mySide : 0, S = m.sides[si], p = mePlayer();
    const pr = S.on.find(x => x.p.id === p.id) || S.out.find(x => x.p.id === p.id);
    const onb = S.bench.find(b => b.p.id === p.id);
    el.innerHTML = pr ? `<div class="hero">${avatar(p, 54)}<div><b>${esc(p.name)}</b><div class="muted small">${pr.pos} · ${pr.red ? 'Expulsado' : pr.to != null && !S.on.includes(pr) ? 'Sustituido' : 'En el campo'}</div></div></div><div class="kpi mt"><div class="statbox"><div class="muted tiny">NOTA</div><div class="v">${Math.max(3, Math.min(10, pr.r)).toFixed(1)}</div></div><div class="statbox"><div class="muted tiny">GOLES</div><div class="v">${pr.g}</div></div><div class="statbox"><div class="muted tiny">ASIST.</div><div class="v">${pr.a}</div></div><div class="statbox"><div class="muted tiny">TIROS</div><div class="v">${pr.sh}</div></div><div class="statbox"><div class="muted tiny">ENERGÍA</div><div class="v">${Math.round(pr.stam)}%</div></div><div class="statbox"><div class="muted tiny">MOMENTOS</div><div class="v">${pr.keyOK}/${pr.keyOK + pr.keyBad}</div></div></div>` : `<div class="muted">${onb ? '🪑 Estás en el banquillo. El míster puede darte entrada en la segunda parte.' : '❌ No participas en este partido.'}</div>`;
  } else if (LV.tab === 'xi') {
    const S = m.sides[m.mySide >= 0 ? m.mySide : 0];
    el.innerHTML = `<div class="plist">${S.on.map(pr => `<div class="it" data-a="player" data-id="${pr.p.id}"><span class="tag">${pr.pos}</span><span class="grow">${esc(pr.p.name)} ${pr.yc ? '🟨' : ''}</span><span class="small muted">⚡${Math.round(pr.stam)}</span><b>${Math.max(3, Math.min(10, pr.r)).toFixed(1)}</b></div>`).join('')}</div>`;
  }
}
ACT.lvtab = d => { LV.tab = d.k; document.querySelectorAll('.tabs button[data-a=lvtab]').forEach(b => b.classList.toggle('on', b.dataset.k === d.k)); renderLiveBody(true); };
ACT.lvpause = () => { if (!LV) return; if (LV.m.finished) return; LV.paused = !LV.paused; $('#bpause').textContent = LV.paused ? '▶ Reanudar' : '⏸ Pausa'; if (!LV.paused) { const ov = $('#htbox'); if (ov) ov.remove(); LV.overlay = false; scheduleStep(100); } };
ACT.lvspeed = d => { LV.speed = +d.s; document.querySelectorAll('[data-a=lvspeed]').forEach(b => b.classList.toggle('pri', +b.dataset.s === LV.speed)); };
function fastForward(until) {
  const m = LV.m; let g = 0;
  while (!m.finished && !m.pending && g++ < 300) { if (until === 'ht' && m.atHT) break; m.step(); if (until === 'ht' && m.atHT) break; }
  afterStep();
  if (!m.finished && !m.pending && !LV.paused && !LV.overlay) scheduleStep(speedMs());
}
ACT.lvht = () => { if (LV.m.htDone) return; LV.htShown = false; fastForward('ht'); };
ACT.lvend = () => { LV.paused = false; fastForward('end'); };

function showHT() {
  LV.overlay = true; const m = LV.m;
  const mgr = G.mode === 'manager' && !LV.intl;
  const d = document.createElement('div'); d.className = 'momentov'; d.id = 'htbox';
  d.innerHTML = `<div class="box center"><h2>⏱️ Descanso</h2><div style="font-size:42px;font-weight:900;margin:10px 0">${m.sides[0].goals} - ${m.sides[1].goals}</div><p class="muted">${esc(m.sides[0].team.short)} vs ${esc(m.sides[1].team.short)}</p><div class="col mt">${mgr ? '<button class="btn blue" data-a="lvtac">📋 Cambiar táctica</button><button class="btn blue" data-a="lvsub">🔁 Hacer cambios</button>' : ''}<button class="btn pri lg" data-a="lvresume">▶ Empezar segunda parte</button></div></div>`;
  document.body.appendChild(d);
}
ACT.lvresume = () => { const o = $('#htbox'); if (o) o.remove(); LV.overlay = false; LV.paused = false; $('#bpause').textContent = '⏸ Pausa'; scheduleStep(200); };

function liveFinished() {
  if (LV.done) return; LV.done = true; clearTimeout(LV.timer);
  const m = LV.m, res = m.commit(); LV.res = res;
  const d = document.createElement('div'); d.className = 'momentov'; d.id = 'momentbox';
  d.innerHTML = `<div class="box center"><h2>🏁 Final del partido</h2><div style="font-size:48px;font-weight:900;margin:10px 0">${res.hg} - ${res.ag}</div><p class="muted">${esc(res.home.name)} vs ${esc(res.away.name)}</p><button class="btn pri lg mt" data-a="lvdone">Ver resumen ▶</button></div>`;
  document.body.appendChild(d);
}
ACT.lvdone = () => { const res = LV.res, S = LV.S, snap = LV.stSnap; const mo = $('#momentbox'); if (mo) mo.remove(); LV.overlay = false; clearTimeout(LV.timer); LV = null; completeMatch(res, S, snap); };

/* ----- momentos clave del jugador ----- */
function showMoment() {
  const m = LV.m, ch = m.momentChoices(); if (!ch) return;
  if (m.pending.t === 'inj') return showInjSub();
  LV.overlay = true; clearTimeout(LV.timer);
  const d = document.createElement('div'); d.className = 'momentov'; d.id = 'momentbox';
  d.innerHTML = `<div class="box"><div class="tag p">🎮 MOMENTO CLAVE · ${m.label}</div><h2 style="margin:10px 0 4px">${ch.title}</h2><p class="muted" style="margin:0 0 6px">${ch.text}</p>${ch.opts.map(([k, t, ds]) => `<button class="opt" data-a="lvchoose" data-k="${k}"><b>${t}</b><span class="small muted">${ds}</span></button>`).join('')}</div>`;
  document.body.appendChild(d);
}
ACT.lvchoose = d => {
  const m = LV.m; const msg = m.choose(d.k);
  const box = $('#momentbox'); if (box) box.innerHTML = `<div class="box center"><h2 style="margin:6px 0">${esc(msg || '…')}</h2></div>`;
  $('#s0').textContent = m.sides[0].goals; $('#s1').textContent = m.sides[1].goals; renderLiveBody(false);
  setTimeout(() => { const b = $('#momentbox'); if (b) b.remove(); if (!LV) return; LV.overlay = false; if (m.pending) showMoment(); else if (m.finished) liveFinished(); else { if (m.atHT && !LV.htShown) { LV.htShown = true; LV.paused = true; showHT(); } else if (!LV.paused) scheduleStep(250); } }, 1300);
};
function showInjSub() {
  const m = LV.m, pd = m.pending; LV.overlay = true; clearTimeout(LV.timer);
  const S = m.sides[pd.si];
  const d = document.createElement('div'); d.className = 'momentov'; d.id = 'momentbox';
  d.innerHTML = `<div class="box"><div class="tag r">🩹 LESIÓN</div><h2 style="margin:10px 0">Necesitas un sustituto (${pd.slot.pos})</h2><div class="plist">${S.bench.filter(b => !b.used && isAvail(b.p)).map(b => `<div class="it" data-a="injsub" data-id="${b.p.id}"><span class="tag">${b.p.pos}</span><span class="grow">${esc(b.p.name)}</span>${ovrBadge(b.p.ovr)}</div>`).join('')}</div><button class="btn mt" data-a="injsub" data-id="0">Jugar con uno menos</button></div>`;
  document.body.appendChild(d);
}
ACT.injsub = d => {
  const m = LV.m, pd = m.pending, S = m.sides[pd.si]; m.tick = [];
  if (+d.id) { const b = S.bench.find(x => x.p.id === +d.id); m.doSub(pd.si, pd.slot, b); }
  m.pending = null; const b = $('#momentbox'); if (b) b.remove(); LV.overlay = false;
  renderLiveBody(false); m.resumeAfterPending(); afterStep(); if (!LV.paused && !m.finished) scheduleStep(250);
};

/* ----- táctica y cambios (manager) ----- */
ACT.lvtac = () => {
  const m = LV.m, si = m.mySide, S = m.sides[si];
  LV.paused = true; $('#bpause').textContent = '▶ Reanudar';
  const sl = (k, l) => `<label class="f">${l}: <b id="tv_${k}">${S.tac[k]}</b><input type="range" min="10" max="90" value="${S.tac[k]}" data-a="lvrange" data-k="${k}"></label>`;
  modal(`<h2>📋 Táctica en directo</h2><div class="row gap8 mt">${MENTALITY.map((n, i) => `<button class="btn ${S.tac.ment === i ? 'pri' : ''}" data-a="lvment" data-i="${i}">${n}</button>`).join('')}</div><div class="grid g3 mt">${sl('press', 'Presión')}${sl('tempo', 'Ritmo')}${sl('line', 'Línea defensiva')}</div>`, 'sm');
  document.querySelectorAll('input[data-a=lvrange]').forEach(i => i.oninput = () => { $('#tv_' + i.dataset.k).textContent = i.value; LV.m.setTactic(LV.m.mySide, i.dataset.k, +i.value); });
};
ACT.lvment = d => { LV.m.setTactic(LV.m.mySide, 'ment', +d.i); ACT.lvtac(); };
ACT.lvsub = () => {
  const m = LV.m, S = m.sides[m.mySide]; LV.paused = true; $('#bpause').textContent = '▶ Reanudar';
  LV.subSel = LV.subSel || {};
  const out = S.on.filter(x => x.pos !== 'POR' || true), ben = S.bench.filter(b => !b.used && isAvail(b.p));
  modal(`<h2>🔁 Cambios (${5 - S.subs} restantes)</h2><div class="grid g2 mt"><div><h3 class="mb">Sale</h3><div class="plist">${out.map(pr => `<div class="it ${LV.subSel.out === pr.p.id ? 'sel' : ''}" data-a="subout" data-id="${pr.p.id}"><span class="tag">${pr.pos}</span><span class="grow">${esc(pr.p.name)}</span><span class="small muted">⚡${Math.round(pr.stam)}</span>${ovrBadge(pr.p.ovr)}</div>`).join('')}</div></div><div><h3 class="mb">Entra</h3><div class="plist">${ben.map(b => `<div class="it ${LV.subSel.in === b.p.id ? 'sel' : ''}" data-a="subin" data-id="${b.p.id}"><span class="tag">${b.p.pos}</span><span class="grow">${esc(b.p.name)}</span>${ovrBadge(b.p.ovr)}</div>`).join('') || '<span class="muted">Sin suplentes</span>'}</div></div></div><button class="btn pri mt" data-a="subgo" ${S.subs >= 5 ? 'disabled' : ''}>Confirmar cambio</button>`);
};
ACT.subout = d => { LV.subSel.out = +d.id; ACT.lvsub(); };
ACT.subin = d => { LV.subSel.in = +d.id; ACT.lvsub(); };
ACT.subgo = () => {
  const s = LV.subSel; if (!s.out || !s.in) return toast('Elige quién sale y quién entra', true);
  if (LV.m.substitute(LV.m.mySide, s.out, s.in)) { LV.subSel = {}; renderLiveBody(false); toast('🔁 Cambio realizado'); ACT.lvsub(); } else toast('No se puede hacer el cambio', true);
};

/* ----- dibujo del campo ----- */
function loopDraw() {
  if (!LV) return;
  drawPitch();
  LV.raf = requestAnimationFrame(loopDraw);
}
function drawPitch() {
  const { ctx, cv, m } = LV; if (!ctx || !document.body.contains(cv)) return;
  const W = cv.width, Hh = cv.height, mg = 34, fw = W - mg * 2, fh = Hh - mg * 2;
  ctx.clearRect(0, 0, W, Hh);
  for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#0e8a4e' : '#0c7d45'; ctx.fillRect(mg + i * fw / 12, mg, fw / 12 + 1, fh); }
  ctx.fillStyle = '#0a6b3b'; ctx.fillRect(0, 0, W, mg); ctx.fillRect(0, Hh - mg, W, mg); ctx.fillRect(0, 0, mg, Hh); ctx.fillRect(W - mg, 0, mg, Hh);
  ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 3; ctx.strokeRect(mg, mg, fw, fh);
  ctx.beginPath(); ctx.moveTo(W / 2, mg); ctx.lineTo(W / 2, Hh - mg); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, Hh / 2, 62, 0, 7); ctx.stroke();
  const bw = fw * .157, bh = fh * .6, sw = fw * .052, sh = fh * .27;
  ctx.strokeRect(mg, Hh / 2 - bh / 2, bw, bh); ctx.strokeRect(W - mg - bw, Hh / 2 - bh / 2, bw, bh);
  ctx.strokeRect(mg, Hh / 2 - sh / 2, sw, sh); ctx.strokeRect(W - mg - sw, Hh / 2 - sh / 2, sw, sh);
  ctx.fillStyle = '#fff'; ctx.fillRect(mg - 8, Hh / 2 - 36, 8, 72); ctx.fillRect(W - mg, Hh / 2 - 36, 8, 72);
  // balón
  const b = m.ball; const bx = mg + b.x * fw, by = mg + b.y * fh;
  LV.ball.x += (bx - LV.ball.x) * .12 || 0; LV.ball.y += (by - LV.ball.y) * .12 || 0;
  if (!LV.ball.init) { LV.ball.x = bx; LV.ball.y = by; LV.ball.init = true; }
  const ballN = { x: (LV.ball.x - mg) / fw, y: (LV.ball.y - mg) / fh };
  const t = performance.now() / 600;
  for (let si = 0; si < 2; si++) {
    const S = m.sides[si], T = S.team;
    S.on.forEach(pr => {
      let x = si === 0 ? pr.x : 1 - pr.x, y = si === 0 ? pr.y : 1 - pr.y;
      const att = b.poss === si;
      const pull = att ? .22 : .14, fwd = att ? (si === 0 ? .07 : -.07) * (pr.pos === 'POR' ? 0 : (POS_GROUP[pr.pos] || 0) / 3) : (si === 0 ? -.03 : .03);
      let tx = x + (ballN.x - x) * pull * (pr.pos === 'POR' ? .2 : 1) + fwd + Math.sin(t + pr.p.id) * .006, ty = y + (ballN.y - y) * pull * .6 + Math.cos(t * 1.1 + pr.p.id) * .008;
      if (pr.pos === 'POR') tx = si === 0 ? .06 + (ballN.x * .05) : .94 - ((1 - ballN.x) * .05);
      const key = pr.p.id; const cur = LV.pos[key] || (LV.pos[key] = { x: tx, y: ty });
      cur.x += (tx - cur.x) * .06; cur.y += (ty - cur.y) * .06;
      const px = mg + cur.x * fw, py = mg + cur.y * fh;
      const isMe = G.career && G.mode === 'player' && pr.p.id === G.career.pid;
      ctx.beginPath(); ctx.arc(px, py + 3, 13, 0, 7); ctx.fillStyle = '#0006'; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, 13, 0, 7); ctx.fillStyle = pr.pos === 'POR' ? '#f6c744' : T.c1; ctx.fill();
      ctx.lineWidth = isMe ? 5 : 3; ctx.strokeStyle = isMe ? '#1de58b' : T.c2; ctx.stroke();
      ctx.fillStyle = lum(pr.pos === 'POR' ? '#f6c744' : T.c1) > 150 ? '#111' : '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(pr.p.num || '', px, py + 4);
      if (isMe) { ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#1de58b'; ctx.fillText('▼', px, py - 20); }
    });
  }
  ctx.beginPath(); ctx.arc(LV.ball.x, LV.ball.y + 2, 8, 0, 7); ctx.fillStyle = '#0005'; ctx.fill();
  ctx.beginPath(); ctx.arc(LV.ball.x, LV.ball.y - 2, 7.5, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#111'; ctx.stroke();
  if (m.flash && m.flash.t > 0) {
    const f = m.flash; const a = Math.min(1, f.t / 20); const T = m.sides[f.si].team;
    ctx.fillStyle = `rgba(255,255,255,${a * .18})`; ctx.fillRect(0, 0, W, Hh);
    ctx.font = 'italic 900 90px Arial'; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = `rgba(0,0,0,${a})`; ctx.strokeText('¡GOOOL!', W / 2, Hh / 2 + 28);
    ctx.fillStyle = `rgba(29,229,139,${a})`; ctx.fillText('¡GOOOL!', W / 2, Hh / 2 + 28);
    ctx.font = 'bold 28px Arial'; ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillText(T.name, W / 2, Hh / 2 + 70);
    f.t--;
  }
}

/* ===== Fin de temporada ===== */
SCREENS.seasonend = () => {
  const s = G.lastSummary || finishSeason(), me = teamOf(G.utid), mgr = G.mode === 'manager';
  const tn = id => teamOf(id);
  const pcards = s.ballon.map((r, i) => `<div class="center"><div class="small gold">#${i + 1}</div>${fcard(r.p, true, true)}<div class="tiny muted">${esc(tn(r.p.tid).short)}</div></div>`).join('');
  let body = '';
  if (mgr) {
    const exp = squadOf(me).filter(p => p.contract <= 1);
    const grown = squadOf(me).filter(p => p.o0 != null).map(p => ({ p, d: p.ovr - p.o0 })).sort((a, b) => b.d - a.d);
    body = `<div class="grid g2 mt"><div class="panel"><h3>Directiva</h3><p>Objetivo: <b>${esc(G.board.txt)}</b></p><p>Resultado: <b>${s.pos}º</b> en ${DIV_NAME[s.div]} → ${s.targetMet ? '<span class="tag g">✔ Objetivo cumplido</span>' : '<span class="tag r">✖ Objetivo fallado</span>'}</p><div class="small muted">Confianza ${Math.round(G.board.conf)}/100 (${s.boardDelta >= 0 ? '+' : ''}${s.boardDelta.toFixed(1)})</div>${meter(G.board.conf)}<div class="mt small">Ingresos ${eur(s.fin.inc)} · Gastos ${eur(s.fin.exp)} · Resultado <b class="${s.fin.inc >= s.fin.exp ? 'pos' : 'neg'}">${eur(s.fin.inc - s.fin.exp)}</b></div></div>
    <div class="panel"><h3>Evolución de tu plantilla</h3>${grown.slice(0, 5).map(x => `<div class="row small" style="padding:3px 0;cursor:pointer" data-a="player" data-id="${x.p.id}"><span class="grow">${esc(x.p.name)} (${x.p.age})</span><span>${x.p.o0} → <b>${x.p.ovr}</b></span><span class="${x.d > 0 ? 'pos' : x.d < 0 ? 'neg' : ''}">${x.d > 0 ? '+' : ''}${x.d}</span></div>`).join('')}<div class="muted tiny mt">Mayores bajadas</div>${grown.slice(-3).reverse().filter(x => x.d < 0).map(x => `<div class="row small"><span class="grow">${esc(x.p.name)} (${x.p.age})</span><span class="neg">${x.p.o0} → ${x.p.ovr}</span></div>`).join('') || '<span class="muted small">Ninguna</span>'}</div></div>
    ${exp.length ? `<div class="panel mt"><h3>⚠ Contratos que vencen (se marcharán gratis)</h3>${exp.map(p => `<div class="row small" style="padding:4px 0"><span class="grow">${esc(p.name)} · ${p.pos} · ${p.ovr}</span><span class="muted">${p.contract <= 0 ? 'Vencido' : p.contract + ' año'}</span><button class="btn sm" data-a="player" data-id="${p.id}">Renovar</button></div>`).join('')}</div>` : ''}`;
  } else {
    const c = G.career, p = mePlayer(), sl = c.seasons[c.seasons.length - 1];
    body = `<div class="panel mt hero">${fcard(p)}<div class="grow"><h2>Tu temporada</h2><div class="kpi mt"><div class="statbox"><div class="muted tiny">PARTIDOS</div><div class="v">${sl.app}</div></div><div class="statbox"><div class="muted tiny">GOLES</div><div class="v">${sl.g}</div></div><div class="statbox"><div class="muted tiny">ASIST.</div><div class="v">${sl.a}</div></div><div class="statbox"><div class="muted tiny">NOTA</div><div class="v">${sl.r ? sl.r.toFixed(2) : '—'}</div></div><div class="statbox"><div class="muted tiny">NIVEL</div><div class="v">${p.ovr}</div></div></div><p class="mt">${s.myRank ? `Puesto <b>#${s.myRank}</b> en la lucha por el Balón de Oro.` : 'No has entrado en la lucha por el Balón de Oro.'} ${c.awards.filter(a => a.s === G.season).map(a => `<span class="tag y">${a.n}</span>`).join(' ')}</p></div></div>
    ${c.freeAgent ? `<div class="panel mt"><h3>📝 Tu contrato ha vencido: elige tu futuro</h3><div class="col">${c.offers.map(o => offerRow(o, 'free')).join('')}</div></div>` : ''}
    ${c.mustRetire ? '<div class="panel mt"><b>A los 39 años tu cuerpo dice basta.</b> <button class="btn red" data-a="retire">Retirarte</button></div>' : ''}`;
  }
  const nextBlock = G.mode === 'player' && G.career.freeAgent ? '<button class="btn lg" disabled>Elige primero un contrato</button>' : `<button class="btn pri lg" data-a="newseason">Comenzar temporada ${seasonLbl(G.season + 1)} ▶</button>`;
  return `<div class="main" style="max-width:1100px;margin:0 auto;padding:18px 16px 80px"><div class="center mb"><div class="tag g">FIN DE TEMPORADA ${seasonLbl(s.season)}</div><h2 style="font-size:32px;margin-top:8px">Resumen del año</h2></div>
  <div class="grid g3"><div class="panel center"><h3>🏆 Campeón de Liga</h3><div class="mt">${crest(tn(s.champion), 56)}</div><b>${esc(tn(s.champion).name)}</b></div><div class="panel center"><h3>🏆 Campeón de Copa</h3><div class="mt">${crest(tn(s.cup), 56)}</div><b>${esc(tn(s.cup).name)}</b></div><div class="panel center"><h3>Tu club</h3><div class="mt">${crest(me, 56)}</div><b>${s.pos}º · ${DIV_NAME[s.div]}</b></div></div>
  <div class="grid g2 mt"><div class="panel"><h3>↕ Ascensos y descensos</h3>${s.promoted.map(i => `<div class="row small">⬆ ${crest(tn(i), 18)} ${esc(tn(i).name)}</div>`).join('')}${s.relegated.map(i => `<div class="row small">⬇ ${crest(tn(i), 18)} ${esc(tn(i).name)}</div>`).join('')}</div><div class="panel"><h3>👟 Máximos goleadores</h3>${s.scorers.map((p, i) => `<div class="row small" style="padding:3px 0"><span class="muted">${i + 1}</span><span class="grow">${esc(p.name)} <span class="muted">${esc(tn(p.tid).short)}</span></span><b>${p.st.gls}</b></div>`).join('')}</div></div>
  <div class="panel mt"><h3>🥇 Balón de Oro</h3><div class="row wrap" style="justify-content:space-around">${pcards}</div></div>${body}<div class="center mt">${nextBlock}</div></div>`;
};
ACT.newseason = () => {
  startNewSeason(); autosave();
  if (G.mode === 'player' && G.career.mustRetire && !G.career.retired) { /* sigue */ }
  go('home');
};

/* ===== Despido ===== */
SCREENS.sacked = () => {
  const me = teamOf(G.utid);
  const opts = G.teams.filter(t => t.id !== G.utid && t.rep <= me.rep + 4 && t.rep >= 40).sort(() => Math.random() - .5).slice(0, 3);
  UI.sackOpts = opts.map(t => t.id);
  return `<div class="title"><div style="font-size:72px">📉</div><h1 style="font-size:36px">Has sido despedido</h1><p class="muted" style="max-width:520px">La directiva del <b>${esc(me.name)}</b> ha perdido la confianza en ti. Pero tu carrera no termina aquí: estos clubes están interesados en tus servicios.</p><div class="col" style="width:min(520px,100%)">${opts.map(t => `<div class="choice" data-a="takejob" data-id="${t.id}"><div class="row">${crest(t, 40)}<div class="grow"><b>${esc(t.name)}</b><div class="small muted">${DIV_NAME[t.div]} · ${stars(t.rep / 20, 5)}</div></div></div></div>`).join('')}</div><button class="btn" data-a="totitle">Abandonar la carrera</button></div>`;
};
ACT.takejob = d => {
  const old = teamOf(G.utid); old.userForm = false;
  G.utid = +d.id; G.sacked = false; G.board.conf = 55; setupBoard();
  const t = teamOf(G.utid); t.tbudget = Math.max(t.tbudget, 6); t.userForm = true; repairLineup(t);
  inbox({ title: `Nuevo reto en ${t.name}`, body: `Objetivo: ${G.board.txt}.`, type: 'info' });
  go('home');
};
