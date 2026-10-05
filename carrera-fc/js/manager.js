'use strict';
/* ===== Pantallas del modo manager ===== */
function nextMatchCard() {
  const e = curEvent();
  if (G.phase === 'seasonEnd' || !e) return `<div class="panel center"><h2>Temporada terminada</h2></div>`;
  if (e.t === 'I') return `<div class="panel center"><h3>Próximo evento</h3><h2>🌍 Parón internacional</h2><div class="muted">Sin partidos esta semana.</div></div>`;
  const uf = userFixture(e);
  if (!uf) return `<div class="panel center"><h3>${evName(e)}</h3><h2>Tu equipo no juega</h2><div class="muted">Fuiste eliminado de la copa.</div></div>`;
  const H = teamOf(uf.h), A = teamOf(uf.a);
  const fm = t => t.div ? formDots((G.table[t.div].find(r => r.tid === t.id) || { form: [] }).form) : '';
  return `<div class="panel"><h3>Próximo partido · ${evName(e)}</h3><div class="row mt" style="justify-content:space-around;text-align:center"><div>${crest(H, 56)}<div><b>${esc(H.name)}</b></div><div class="small muted">${tablePos(H.id)}º · OVR ${Math.round(strengthOf(H))}</div>${fm(H)}</div><div style="font-size:28px;font-weight:900">VS</div><div>${crest(A, 56)}<div><b>${esc(A.name)}</b></div><div class="small muted">${tablePos(A.id)}º · OVR ${Math.round(strengthOf(A))}</div>${fm(A)}</div></div></div>`;
}
function homeM() {
  const me = teamOf(G.utid), sq = squadOf(me), div = me.div;
  const tb = table(div);
  const alerts = [];
  const inj = sq.filter(p => p.inj), ban = sq.filter(p => p.ban), exp = sq.filter(p => p.contract <= 1), sad = sq.filter(p => p.morale < 45);
  if (inj.length) alerts.push(`🩹 Lesionados: ${inj.map(p => esc(p.name) + ' (' + p.inj.w + 's)').join(', ')}`);
  if (ban.length) alerts.push(`🟨 Sancionados: ${ban.map(p => esc(p.name)).join(', ')}`);
  if (exp.length) alerts.push(`📝 Último año de contrato: ${exp.slice(0, 4).map(p => esc(p.name)).join(', ')}${exp.length > 4 ? '…' : ''}`);
  if (sad.length) alerts.push(`😡 Descontentos: ${sad.slice(0, 3).map(p => esc(p.name)).join(', ')}`);
  if (sq.length < 20) alerts.push(`⚠ Plantilla corta (${sq.length}/20 mín.)`);
  if (sq.length > 28) alerts.push(`⚠ Plantilla muy larga (${sq.length})`);
  const pend = G.inbox.filter(m => m.type === 'offer' && !m.done).length;
  if (pend) alerts.push(`💸 ${pend} oferta(s) por tus jugadores en el buzón`);
  if (me.cash < 0) alerts.push('🚨 ¡Cuentas en números rojos!');
  const L = G.fin.last;
  const top = [...sq].sort((a, b) => b.ovr - a.ovr).slice(0, 3);
  const last = UI.last && !UI.last.intl ? UI.last.res : null;
  const lastTxt = last ? `${last.home.short} ${last.hg}-${last.ag} ${last.away.short}` : '—';
  return `<div class="grid g2">${nextMatchCard()}<div class="panel"><h3>Directiva y afición</h3><div class="row between"><span>Objetivo: <b>${esc(G.board.txt)}</b></span><span class="pill">Ahora ${tablePos(G.utid)}º</span></div><div class="mt small muted">Confianza de la directiva · ${Math.round(G.board.conf)}</div>${meter(G.board.conf)}<div class="mt small muted">Ánimo de la afición · ${Math.round(G.fans)}</div>${meter(G.fans)}<div class="row wrap mt gap8"><span class="pill">Último: ${lastTxt}</span><span class="pill">OVR once: ${teamOvr(me)}</span></div></div></div>
  <div class="mt">${challengePanel(true)}</div>
  <div class="grid g3 mt"><div class="panel"><h3>Clasificación</h3><table class="tbl"><tbody>${tb.map((r, i) => `<tr class="${r.tid === G.utid ? 'me' : ''}"><td>${i + 1}</td><td>${crest(teamOf(r.tid), 14)} ${esc(teamOf(r.tid).short)}</td><td>${r.p}</td><td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div>
  <div class="panel"><h3>Estado del club</h3>${alerts.length ? alerts.map(a => `<div class="news">${a}</div>`).join('') : '<div class="muted">Todo en orden 👌</div>'}<div class="mt"><h3>Jugadores clave</h3>${top.map(p => `<div class="row small" style="padding:4px 0;cursor:pointer" data-a="player" data-id="${p.id}">${avatar(p, 28)}<span class="grow">${esc(p.name)}</span>${ovrBadge(p.ovr)}</div>`).join('')}</div></div>
  <div class="panel"><h3>Finanzas</h3><div class="kpi"><div class="statbox"><div class="muted tiny">CAJA</div><div class="v ${me.cash < 0 ? 'neg' : ''}">${eur(me.cash)}</div></div><div class="statbox"><div class="muted tiny">FICHAJES</div><div class="v">${eur(me.tbudget)}</div></div></div>${L ? `<div class="mt small">Última semana: <b class="${L.net >= 0 ? 'pos' : 'neg'}">${L.net >= 0 ? '+' : ''}${eur(L.net)}</b></div>` : ''}<div class="mt"><h3>Noticias</h3>${G.news.slice(0, 5).map(n => `<div class="news ${n.type}">${esc(n.txt)}</div>`).join('') || '<span class="muted small">Sin noticias</span>'}</div></div></div>`;
}

/* ===== Plantilla ===== */
SCREENS.squad = () => {
  const me = teamOf(G.utid), f = UI.tab.sqf || 'all', so = UI.sort.squad || { k: 'ovr', d: -1 };
  let list = squadOf(me);
  if (f !== 'all') list = list.filter(p => POS_GROUP[p.pos] === +f);
  const val = { num: p => p.num, pos: p => POS_LIST.indexOf(p.pos), name: p => p.name, age: p => p.age, ovr: p => p.ovr, pot: p => p.pot, form: p => p.form, fit: p => p.fitness, mor: p => p.morale, val: p => p.value, wage: p => p.wage, con: p => p.contract }[so.k];
  list.sort((a, b) => { const x = val(a), y = val(b); return (typeof x === 'string' ? x.localeCompare(y) : x - y) * so.d; });
  const th = (k, l) => `<th class="sort" data-a="sort" data-s="squad" data-k="${k}">${l}${so.k === k ? (so.d > 0 ? ' ▲' : ' ▼') : ''}</th>`;
  const tabs = [['all', 'Todos'], ...GROUP_NAME.map((n, i) => [String(i), n])].map(([k, l]) => `<button class="${f === k ? 'on' : ''}" data-a="tab" data-s="sqf" data-k="${k}">${l}</button>`).join('');
  const wages = wageBill(me);
  return `<div class="row between mb wrap"><h2>👥 Plantilla (${squadOf(me).length})</h2><div class="row gap8"><span class="pill">Masa salarial ${fmtK(wages * 1000)}/sem</span><span class="pill">Media OVR ${Math.round(squadOf(me).reduce((s, p) => s + p.ovr, 0) / Math.max(1, squadOf(me).length))}</span></div></div><div class="tabs">${tabs}</div>
  <div class="panel"><div class="tscroll"><table class="tbl"><thead><tr>${th('num', '#')}${th('pos', 'Pos')}${th('name', 'Nombre')}${th('age', 'Edad')}${th('ovr', 'OVR')}${th('pot', 'POT')}${th('form', 'Forma')}${th('fit', 'Fís')}${th('mor', 'Moral')}${th('val', 'Valor')}${th('wage', 'Salario')}${th('con', 'Contr.')}<th>Estado</th></tr></thead><tbody>${list.map(p => `<tr class="click" data-a="player" data-id="${p.id}"><td>${p.num}</td><td><span class="tag">${p.pos}</span></td><td>${NATS[p.nat].f} ${esc(p.name)}</td><td>${p.age}</td><td>${ovrBadge(p.ovr)}</td><td>${p.age <= 29 ? p.pot : '—'}</td><td>${meter(p.form)}</td><td>${meter(p.fitness)}</td><td>${meter(p.morale)}</td><td>${eur(p.value)}</td><td>${fmtK(p.wage)}</td><td ${p.contract <= 1 ? 'class="neg"' : ''}>${p.contract}</td><td>${statusTag(p)}${p.listed ? '<span class="tag y">Venta</span>' : ''}${p.loan ? '<span class="tag b">Cedido</span>' : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
};
ACT.sort = d => { const s = UI.sort[d.s] || { k: d.k, d: -1 }; if (s.k === d.k) s.d *= -1; else { s.k = d.k; s.d = d.k === 'name' || d.k === 'pos' ? 1 : -1; } UI.sort[d.s] = s; refresh(); };

/* ===== Táctica ===== */
SCREENS.tactics = () => {
  const t = teamOf(G.utid); t.userForm = true; repairLineup(t);
  const slots = FORM_SLOTS[t.formation], sel = UI.tsel;
  const chips = t.xi.map((id, i) => {
    const p = G.pl[id], s = slots[i]; if (!p) return '';
    const off = p.pos !== s.pos;
    return `<div class="chip ${sel && sel.kind === 'xi' && sel.key === i ? 'sel' : ''}" style="left:${8 + s.y * 84}%;top:${5 + (1 - s.x) * 90}%" data-a="tclick" data-kind="xi" data-key="${i}"><div class="dot" style="background:${p.pos === 'POR' ? '#f6c744' : t.c1};color:${lum(p.pos === 'POR' ? '#f6c744' : t.c1) > 150 ? '#111' : '#fff'}">${p.ovr}${off ? `<span class="pp">${s.pos}</span>` : ''}</div><div class="nm">${esc(p.name.split(' ').slice(-1)[0])}</div></div>`;
  }).join('');
  const item = p => `<div class="it ${sel && sel.kind === 'p' && sel.key === p.id ? 'sel' : ''} ${!isAvail(p) ? 'bad' : ''}" data-a="tclick" data-kind="p" data-key="${p.id}"><span class="tag">${p.pos}</span><span class="grow">${esc(p.name)} ${statusTag(p)}</span><span class="small muted">⚡${Math.round(p.fitness)}</span>${ovrBadge(p.ovr)}</div>`;
  const bench = t.bench.map(id => G.pl[id]).filter(Boolean), res = squadOf(t).filter(p => !t.xi.includes(p.id) && !t.bench.includes(p.id)).sort((a, b) => b.ovr - a.ovr);
  const sl = (k, l) => `<label class="f">${l}: <b id="tv_${k}">${t[k]}</b><input type="range" min="10" max="90" value="${t[k]}" data-a="trange" data-k="${k}"></label>`;
  return `<div class="row between mb wrap"><h2>📋 Táctica</h2><div class="row gap8"><span class="pill">OVR once <b>${teamOvr(t)}</b></span><button class="btn" data-a="tauto">⚡ Mejor once</button></div></div>
  <div class="grid tgrid"><div class="panel col"><h3>Estrategia</h3><label class="f">Formación<select id="formsel" data-chg="tform">${Object.keys(FORMATIONS).map(f => `<option ${f === t.formation ? 'selected' : ''}>${f}</option>`).join('')}</select></label><div><div class="muted small mb">Mentalidad</div><div class="row gap8">${MENTALITY.map((n, i) => `<button class="btn sm ${t.mentality === i ? 'pri' : ''}" data-a="tment" data-i="${i}">${n}</button>`).join('')}</div></div>${sl('press', 'Presión')}${sl('tempo', 'Ritmo')}${sl('line', 'Línea defensiva')}<div class="small muted">Mayor presión y ritmo = más ocasiones pero más cansancio. Línea alta = más ataque, más riesgo.</div></div>
  <div><div class="board">${chips}</div><div class="center small muted mt">Pulsa dos jugadores para intercambiarlos</div></div>
  <div class="panel plist"><h3>Banquillo (${bench.length}/7)</h3>${bench.map(item).join('')}<h3 style="margin-top:12px">Reservas</h3><div style="max-height:380px;overflow:auto">${res.map(item).join('')}</div></div></div>`;
};
ACT.tclick = d => {
  const t = teamOf(G.utid); const B = { kind: d.kind, key: +d.key }, A = UI.tsel;
  if (!A) { UI.tsel = B; return refresh(); }
  if (A.kind === B.kind && A.key === B.key) { UI.tsel = null; return refresh(); }
  if (A.kind === 'xi' && B.kind === 'xi') { const x = t.xi[A.key]; t.xi[A.key] = t.xi[B.key]; t.xi[B.key] = x; }
  else if (A.kind === 'xi' || B.kind === 'xi') {
    const xi = A.kind === 'xi' ? A : B, pk = A.kind === 'p' ? A : B, q = G.pl[pk.key];
    if (!isAvail(q)) { UI.tsel = null; toast('Ese jugador no está disponible', true); return refresh(); }
    const old = t.xi[xi.key]; t.xi[xi.key] = q.id; const bi = t.bench.indexOf(q.id);
    if (bi >= 0) t.bench[bi] = old; else if (old && t.bench.length < 7) t.bench.push(old);
  } else {
    const ia = t.bench.indexOf(A.key), ib = t.bench.indexOf(B.key);
    if (ia >= 0 && ib < 0) t.bench[ia] = B.key; else if (ib >= 0 && ia < 0) t.bench[ib] = A.key;
  }
  UI.tsel = null; refresh();
};
ACT.tauto = () => { const t = teamOf(G.utid); autoPick(t, true); UI.tsel = null; toast('Once optimizado'); refresh(); };
ACT.tform = (d, el) => { const t = teamOf(G.utid); t.formation = el.value; autoPick(t, true); UI.tsel = null; refresh(); };
document.addEventListener('change', ev => { const m = ev.target.closest('[data-chg]'); if (m && ACT[m.dataset.chg]) ACT[m.dataset.chg]({}, m); });
ACT.tment = d => { teamOf(G.utid).mentality = +d.i; refresh(); };
document.addEventListener('input', ev => { const el = ev.target.closest('input[data-a=trange]'); if (el) { const k = el.dataset.k; teamOf(G.utid)[k] = +el.value; const s = $('#tv_' + k); if (s) s.textContent = el.value; } });

/* ===== Fichajes ===== */
const MK = () => UI.mk || (UI.mk = { group: 'all', minOvr: 0, maxAge: 40, maxPrice: '', free: false, young: false, sort: 'ovr', pos: '' });
function marketList() {
  const f = MK(), me = teamOf(G.utid);
  let l = Object.values(G.pl).filter(p => p.tid !== G.utid && !p.tmp && !p.youth && p.tid !== undefined);
  if (f.free) l = l.filter(p => p.tid == null);
  if (f.group !== 'all') l = l.filter(p => POS_GROUP[p.pos] === +f.group);
  if (f.pos) l = l.filter(p => p.pos === f.pos);
  l = l.filter(p => p.ovr >= f.minOvr && p.age <= f.maxAge);
  if (f.young) l = l.filter(p => p.age <= 22 && shownPot(p) - p.ovr >= 8);
  if (f.maxPrice !== '' && !isNaN(+f.maxPrice)) l = l.filter(p => askPrice(p) <= +f.maxPrice);
  const k = { ovr: p => -p.ovr, pot: p => -shownPot(p), age: p => p.age, val: p => -p.value, price: p => askPrice(p) }[f.sort];
  return l.sort((a, b) => k(a) - k(b)).slice(0, 40);
}
SCREENS.market = () => {
  const f = MK(), tab = UI.tab.mk || 'search', me = teamOf(G.utid);
  const tabs = [['search', 'Buscar'], ['watch', 'Vigilados'], ['sales', 'Mis ventas'], ['log', 'Mercado mundial']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-a="tab" data-s="mk" data-k="${k}">${l}</button>`).join('');
  const rows = list => `<div class="tscroll"><table class="tbl"><thead><tr><th>Pos</th><th>Nombre</th><th>Edad</th><th>OVR</th><th>POT</th><th>Club</th><th>Valor</th><th>Precio</th><th>Salario</th></tr></thead><tbody>${list.map(p => `<tr class="click" data-a="player" data-id="${p.id}"><td><span class="tag">${p.pos}</span></td><td>${NATS[p.nat].f} ${esc(p.name)} ${p.scouted ? '🔭' : ''}</td><td>${p.age}</td><td>${ovrBadge(p.ovr)}</td><td>${p.age <= 30 ? '<b>' + shownPot(p) + '</b>' : '—'}</td><td>${p.tid != null ? esc(teamOf(p.tid).short) : '<span class="tag g">Libre</span>'}</td><td>${eur(p.value)}</td><td>${p.tid != null ? eur(askPrice(p)) : '0'}</td><td>${fmtK(p.wage)}</td></tr>`).join('') || '<tr><td colspan="9" class="muted">Sin resultados</td></tr>'}</tbody></table></div>`;
  let body = '';
  if (tab === 'search') {
    body = `<div class="panel mb"><div class="grid g4"><label class="f">Línea<select id="mk_group" data-chg="mkapply"><option value="all">Todas</option>${GROUP_NAME.map((n, i) => `<option value="${i}" ${String(f.group) === String(i) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="f">Posición<select id="mk_pos" data-chg="mkapply"><option value="">Todas</option>${POS_LIST.map(p => `<option ${f.pos === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
    <label class="f">OVR mínimo<input id="mk_minOvr" type="number" min="0" max="99" value="${f.minOvr}" data-chg="mkapply"></label><label class="f">Edad máx.<input id="mk_maxAge" type="number" min="16" max="42" value="${f.maxAge}" data-chg="mkapply"></label>
    <label class="f">Precio máx. (M€)<input id="mk_maxPrice" type="number" min="0" value="${f.maxPrice}" data-chg="mkapply"></label><label class="f">Ordenar<select id="mk_sort" data-chg="mkapply">${[['ovr', 'Nivel'], ['pot', 'Potencial'], ['age', 'Edad'], ['val', 'Valor'], ['price', 'Precio (menor)']].map(([k, l]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="f">Solo libres<select id="mk_free" data-chg="mkapply"><option value="0">No</option><option value="1" ${f.free ? 'selected' : ''}>Sí</option></select></label><label class="f">Promesas<select id="mk_young" data-chg="mkapply"><option value="0">Todos</option><option value="1" ${f.young ? 'selected' : ''}>Solo promesas ≤22 con pot.</option></select></label></div></div><div class="panel">${rows(marketList())}</div>`;
  } else if (tab === 'watch') {
    body = `<div class="panel">${rows((G.watch || []).map(id => G.pl[id]).filter(p => p && p.tid !== G.utid))}</div>`;
  } else if (tab === 'sales') {
    const own = squadOf(me).filter(p => p.listed);
    body = `<div class="panel"><h3>En lista de transferibles</h3>${own.map(p => `<div class="row small" style="padding:5px 0"><span class="grow">${esc(p.name)} (${p.ovr})</span><span>${eur(p.value)}</span><button class="btn sm" data-a="player" data-id="${p.id}">Gestionar</button></div>`).join('') || '<span class="muted">Ninguno. Abre la ficha de un jugador para ponerlo en venta.</span>'}<div class="small muted mt">Las ofertas llegarán a tu buzón durante el mercado.</div></div>`;
  } else {
    body = `<div class="panel">${G.news.filter(n => n.type === 'transfer').slice(0, 25).map(n => `<div class="news transfer">${esc(n.txt)}</div>`).join('') || '<span class="muted">Aún no hay movimientos.</span>'}</div>`;
  }
  return `<div class="row between mb wrap"><h2>💸 Mercado de fichajes</h2><div class="row gap8">${G.window ? '<span class="tag g">Mercado abierto</span>' : '<span class="tag r">Mercado cerrado · solo libres</span>'}<span class="pill">Presupuesto ${eur(me.tbudget)}</span></div></div><div class="tabs">${tabs}</div>${body}`;
};
ACT.mkapply = () => {
  const f = MK(), g = id => $(id) ? $(id).value : '';
  f.group = g('#mk_group'); f.pos = g('#mk_pos'); f.minOvr = +g('#mk_minOvr') || 0; f.maxAge = +g('#mk_maxAge') || 40; f.maxPrice = g('#mk_maxPrice'); f.sort = g('#mk_sort'); f.free = g('#mk_free') === '1'; f.young = g('#mk_young') === '1';
  refresh();
};

/* ===== Acciones sobre un jugador (modal) ===== */
function PA(p) {
  if (G.mode !== 'manager') return '';
  const me = teamOf(G.utid);
  if (p.tid === G.utid) {
    if (p.youth) return `<div class="row gap8 wrap"><button class="btn pri" data-a="mpromote" data-id="${p.id}">⬆ Promocionar al primer equipo</button><button class="btn red" data-a="mrelease" data-id="${p.id}">Liberar</button><label class="f" style="margin-left:auto">Plan de desarrollo<select id="mfocus" data-id="${p.id}" data-chg="mfocus"><option value="">Equilibrado</option>${ATTR.map(k => `<option value="${k}" ${p.focus === k ? 'selected' : ''}>${ATTR_NAME[k]}</option>`).join('')}</select></label></div>`;
    const need = renewalWage(p);
    const loanTeams = G.teams.filter(t => t.id !== G.utid && t.rep < me.rep + 5).sort((a, b) => b.rep - a.rep).slice(0, 5);
    return `<div class="panel col"><h3>Gestión</h3><div class="grid g3"><label class="f">Salario propuesto (K€/sem)<input id="rw" type="number" step="0.5" value="${Math.round(need * 10) / 10}"></label><label class="f">Años<select id="ry"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></label><div style="display:flex;align-items:flex-end"><button class="btn pri" data-a="mrenew" data-id="${p.id}" style="width:100%">📝 Renovar</button></div></div><div class="row wrap gap8"><button class="btn" data-a="mlist" data-id="${p.id}">${p.listed ? '❌ Quitar de la lista' : '🏷️ Poner en venta'}</button>${p.age <= 24 ? `<select id="mloan">${loanTeams.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select><button class="btn" data-a="mloan" data-id="${p.id}">🔄 Ceder 1 temp.</button>` : ''}<button class="btn red" data-a="mrelease" data-id="${p.id}">Rescindir (${eur(p.wage * 52 * p.contract / 1000 * .5)})</button><label class="f" style="margin-left:auto">Entrenamiento individual<select id="mfocus" data-id="${p.id}" data-chg="mfocus"><option value="">Equilibrado</option>${ATTR.map(k => `<option value="${k}" ${p.focus === k ? 'selected' : ''}>${ATTR_NAME[k]}</option>`).join('')}</select></label></div></div>`;
  }
  const ask = p.tid != null ? askPrice(p) : 0, want = wageWanted(p, me), watch = (G.watch || []).includes(p.id);
  return `<div class="panel col"><h3>Negociar fichaje</h3><div class="row wrap gap8"><span class="pill">Precio pedido: <b>${p.tid != null ? eur(ask) : 'Gratis'}</b></span><span class="pill">Salario esperado: <b>${fmtK(want)}/sem</b></span><span class="pill">Tu presupuesto: <b>${eur(me.tbudget)}</b></span></div><div class="grid g3"><label class="f">Oferta (M€)<input id="of_fee" type="number" step="0.1" min="0" value="${Math.round(ask * 100) / 100}" ${p.tid == null ? 'disabled' : ''}></label><label class="f">Salario (K€/sem)<input id="of_wage" type="number" step="0.5" value="${Math.round(want * 10) / 10}"></label><label class="f">Contrato (años)<select id="of_years"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></label></div><div id="offmsg" class="small muted">${G.window || p.tid == null ? '' : '⛔ Mercado cerrado: solo puedes fichar agentes libres.'}</div><div class="row gap8"><button class="btn pri" data-a="moffer" data-id="${p.id}" ${!G.window && p.tid != null ? 'disabled' : ''}>🤝 Enviar oferta</button><button class="btn" data-a="mwatch" data-id="${p.id}">${watch ? '★ Quitar de vigilados' : '☆ Vigilar'}</button></div></div>`;
}
ACT.moffer = d => {
  const p = G.pl[+d.id], me = teamOf(G.utid);
  const fee = p.tid == null ? 0 : +$('#of_fee').value, wage = +$('#of_wage').value, years = +$('#of_years').value;
  const r = negotiate(p, me, fee, wage, years), msg = $('#offmsg');
  msg.className = 'small ' + (r.st === 'ok' ? 'pos' : 'neg'); msg.textContent = r.msg;
  if (r.st === 'club_counter') $('#of_fee').value = Math.round(r.ask * 100) / 100;
  if (r.st === 'player_no') $('#of_wage').value = Math.round(r.need * 10) / 10;
  if (r.st === 'ok') { const nm = p.name; signPlayer(p, me, fee, wage, years); repairLineup(me); toast(`✅ ${esc(nm)} es nuevo jugador del club`); closeModal(); refresh(); }
};
ACT.mwatch = d => { G.watch = G.watch || []; const id = +d.id; G.watch = G.watch.includes(id) ? G.watch.filter(x => x !== id) : G.watch.concat(id); showPlayer(id); };
ACT.mrenew = d => { const p = G.pl[+d.id]; const r = renewPlayer(p, +$('#rw').value, +$('#ry').value); toast(r.msg, !r.ok); if (r.ok) { showPlayer(p.id); refresh(); } else $('#rw').value = Math.round(r.need * 10) / 10; };
ACT.mlist = d => { const p = G.pl[+d.id]; p.listed = !p.listed; showPlayer(p.id); };
ACT.mrelease = d => { const p = G.pl[+d.id]; if (!confirm(`¿Rescindir el contrato de ${p.name}?`)) return; if (p.youth) { const me = teamOf(G.utid); me.youth = me.youth.filter(i => i !== p.id); delete G.pl[p.id]; } else { releasePlayer(p); repairLineup(teamOf(G.utid)); } closeModal(); toast('Jugador liberado'); refresh(); };
ACT.mloan = d => { const p = G.pl[+d.id], tid = +$('#mloan').value, keep = { owner: G.utid, wage: p.wage, contract: p.contract }; transferPlayer(p, tid, 0, 1, p.wage); p.loan = keep; repairLineup(teamOf(G.utid)); closeModal(); toast(`${esc(p.name)} cedido a ${esc(teamOf(tid).name)}`); refresh(); };
ACT.mfocus = (d, el) => { const p = G.pl[+el.dataset.id]; p.focus = el.value || null; toast('Plan de desarrollo actualizado'); };
ACT.mpromote = d => { const p = G.pl[+d.id]; if (promoteYouth(p)) { toast(`⬆ ${esc(p.name)} sube al primer equipo`); closeModal(); refresh(); } else toast('Plantilla llena (máx. 32)', true); };

/* ===== Ojeadores ===== */
SCREENS.scout = () => {
  const me = teamOf(G.utid), lv = me.fac.scout, S = UI.scoutF || (UI.scoutF = { group: 'all', maxAge: 23, minPot: 75, nat: '' }), cost = .12 + lv * .03;
  const found = (UI.scoutRes || []).map(id => G.pl[id]).filter(Boolean);
  return `<div class="row between mb wrap"><h2>🔭 Ojeadores</h2><span class="pill">Red de ojeadores nivel ${lv}/5 ${stars(lv, 5)}</span></div>
  <div class="grid g2"><div class="panel col"><h3>Nueva misión (${fmtK(cost * 1000)})</h3><div class="grid g2"><label class="f">Línea<select id="sc_group"><option value="all">Todas</option>${GROUP_NAME.map((n, i) => `<option value="${i}" ${String(S.group) === String(i) ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label class="f">Nacionalidad<select id="sc_nat"><option value="">Cualquiera</option>${NAT_KEYS.map(k => `<option value="${k}" ${S.nat === k ? 'selected' : ''}>${NATS[k].f} ${NATS[k].n}</option>`).join('')}</select></label><label class="f">Edad máxima<input id="sc_age" type="number" value="${S.maxAge}" min="16" max="40"></label><label class="f">Potencial mínimo<input id="sc_pot" type="number" value="${S.minPot}" min="40" max="95"></label></div><button class="btn pri" data-a="scgo">Enviar ojeador</button><div class="small muted">Los jugadores ojeados revelan su <b>potencial exacto</b>. Mejora la red en Club → Instalaciones para estimaciones más precisas.</div></div>
  <div class="panel"><h3>Informe</h3><div class="plist">${found.map(p => `<div class="it" data-a="player" data-id="${p.id}"><span class="tag">${p.pos}</span><span class="grow">${NATS[p.nat].f} ${esc(p.name)} <span class="muted small">${p.age}a · ${p.tid != null ? esc(teamOf(p.tid).short) : 'Libre'}</span></span><span class="small muted">POT</span><b>${p.pot}</b>${ovrBadge(p.ovr)}</div>`).join('') || '<span class="muted">Envía un ojeador para recibir informes.</span>'}</div></div></div>`;
};
ACT.scgo = () => {
  const S = UI.scoutF; S.group = $('#sc_group').value; S.nat = $('#sc_nat').value; S.maxAge = +$('#sc_age').value || 40; S.minPot = +$('#sc_pot').value || 0;
  const r = scoutMission({ group: S.group === 'all' ? undefined : +S.group, maxAge: S.maxAge, minPot: S.minPot, nat: S.nat });
  if (r.err) return toast(r.err, true);
  UI.scoutRes = r.found.map(p => p.id); toast(r.found.length ? `🔭 ${r.found.length} jugadores localizados` : 'No se encontró a nadie con esos criterios'); refresh();
};

/* ===== Cantera (estilo plantilla de academia) ===== */
const valCol = v => v >= 75 ? '#1de58b' : v >= 65 ? '#9be15d' : v >= 55 ? '#f6c744' : '#ff9d3d';
SCREENS.youth = () => {
  const me = teamOf(G.utid), ys = youthOf(me).sort((a, b) => potRange(b)[1] - potRange(a)[1] || b.pot - a.pot);
  if (!ys.find(p => p.id === UI.ysel)) UI.ysel = ys[0] ? ys[0].id : null;
  const sel = G.pl[UI.ysel];
  const rows = ys.map(p => { const [lo, hi] = potRange(p), pl = PLANS[p.plan || defaultPlan(p.pos)]; return `<tr class="click ${p.id === UI.ysel ? 'me' : ''}" data-a="ysel" data-id="${p.id}"><td><span class="tag">${p.pos}</span></td><td><div class="row gap8">${avatar(p, 30)}<b>${esc(p.name)}</b></div></td><td>${p.age}</td><td><b style="color:${valCol(p.ovr)}">${p.ovr}</b></td><td><b style="color:#1de58b">${lo === hi ? lo : lo + ' - ' + hi}</b></td><td>${pl.n}${p.releaseWarn ? ' <span class="tag r">¡Ya!</span>' : ''}</td></tr>`; }).join('');
  let det = '<div class="muted">Selecciona un juvenil.</div>';
  if (sel) {
    const [lo, hi] = potRange(sel), d = sel.ovr - (sel.o0 != null ? sel.o0 : sel.ovr);
    det = `<div class="row gap8"><span class="small ${d > 0 ? 'pos' : 'muted'}">${d > 0 ? '+' + d : d < 0 ? d : ''}</span></div><div class="row"><b style="font-size:36px;color:${valCol(sel.ovr)}">${sel.ovr}</b><span class="muted">| ${sel.pos}</span></div><div class="row gap8"><span style="font-size:22px">${NATS[sel.nat].f}</span><b style="font-size:20px">${esc(sel.name)}</b></div>
    <div class="grid g2 mt"><div><div class="muted small">Potencial</div><b style="font-size:20px;color:#1de58b">${lo === hi ? lo : lo + '-' + hi}</b></div><div><div class="muted small">Edad</div><b style="font-size:20px">${sel.age}</b></div></div>
    <div class="mt">${attrBars(sel)}</div>
    <h3 class="mt mb">Plan de desarrollo</h3><select id="yplan" data-chg="yplan">${Object.entries(PLANS).map(([k, v]) => `<option value="${k}" ${(sel.plan || defaultPlan(sel.pos)) === k ? 'selected' : ''}>${v.n}</option>`).join('')}</select><div class="small muted mt">${PLANS[sel.plan || defaultPlan(sel.pos)].d}</div>
    <div class="row between small mt"><span class="muted">Progreso</span><b>${sel.o0 != null ? sel.o0 : sel.ovr} → ${sel.ovr}</b></div><div class="row between small"><span class="muted">Termina en</span><b>${Math.max(0, 19 - sel.age)} temp.</b></div>
    <div class="col mt"><button class="btn pri" data-a="mpromote" data-id="${sel.id}">⬆ Promocionar al primer equipo</button><button class="btn red" data-a="mrelease" data-id="${sel.id}">Liberar</button></div>`;
  }
  return `<div class="row between mb wrap"><h2>🌱 Plantilla de academia</h2><div class="row gap8"><span class="pill">Academia ${stars(me.fac.academy, 5)}</span><span class="pill">Ojeadores ${stars(me.fac.scout, 5)}</span></div></div>
  <div class="grid" style="grid-template-columns:minmax(0,1.9fr) minmax(0,1fr);align-items:start" id="ygrid"><div class="panel"><div class="tscroll"><table class="tbl"><thead><tr><th>Pos</th><th>Nombre</th><th>Edad</th><th>GRL</th><th>POT ▼</th><th>Plan</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="muted">Aún no hay juveniles. Llegan nuevos al empezar cada temporada.</td></tr>'}</tbody></table></div><div class="small muted mt">Los que no promociones antes de cumplir 19 se marcharán. El rango de potencial se afina con la red de ojeadores.</div></div><div class="panel">${det}</div></div>`;
};
ACT.ysel = d => { UI.ysel = +d.id; refresh(); };
ACT.yplan = (d, el) => { const p = G.pl[UI.ysel]; if (p) { p.plan = el.value; toast('Plan de desarrollo: ' + PLANS[el.value].n); refresh(); } };

/* ===== Club: finanzas e instalaciones ===== */
const FAC = { train: ['Centro de entrenamiento', '🏋️', 'Mejora el progreso de todos los jugadores'], academy: ['Academia', '🌱', 'Más y mejores juveniles'], stadium: ['Estadio', '🏟️', '+6.000 localidades por nivel'], scout: ['Red de ojeadores', '🔭', 'Estimaciones de potencial más precisas'], physio: ['Fisioterapia', '💆', 'Recuperación de lesiones y fatiga'] };
const facCost = l => Math.round(2.5 * Math.pow(l, 1.7) * 10) / 10;
SCREENS.finance = () => {
  const me = teamOf(G.utid), b = baseIncome(me), L = G.fin.last, att = attendance(me), cap = (me.cap + (me.fac.stadium - 1) * 6) * 1000;
  const bar = (l, v, mx, col) => `<div class="row small" style="margin:5px 0"><span style="width:96px" class="muted">${l}</span><div class="bar grow"><i style="width:${100 * v / mx}%;background:${col}"></i></div><b style="width:80px;text-align:right">${eur(v)}</b></div>`;
  const wages = wageBill(me), mx = Math.max(b.tv + b.spons + b.merch + att * me.ticket / 1e6, wages + upkeep(me), .01);
  const facs = Object.entries(FAC).map(([k, [n, ic, d]]) => { const l = me.fac[k]; return `<div class="panel"><div class="row"><span style="font-size:28px">${ic}</span><div class="grow"><b>${n}</b><div class="small muted">${d}</div></div></div><div class="row between mt"><span>${stars(l, 5)}</span>${l < 5 ? `<button class="btn sm pri" data-a="upg" data-k="${k}" ${me.cash < facCost(l) ? 'disabled' : ''}>Mejorar · ${eur(facCost(l))}</button>` : '<span class="tag g">MÁX</span>'}</div></div>`; }).join('');
  return `<div class="row between mb wrap"><h2>🏟️ Club y finanzas</h2><div class="row gap8"><span class="pill">Caja ${eur(me.cash)}</span><span class="pill">Fichajes ${eur(me.tbudget)}</span></div></div>
  <div class="grid g2"><div class="panel"><h3>Ingresos y gastos semanales (estimación)</h3>${bar('TV', b.tv, mx, '#4f83ff')}${bar('Patrocinio', b.spons, mx, '#9a6bff')}${bar('Merchandising', b.merch, mx, '#ff9d3d')}${bar('Entradas', att * me.ticket / 1e6, mx, '#1de58b')}<hr style="border:0;border-top:1px solid var(--line)">${bar('Salarios', wages, mx, '#ff4d6d')}${bar('Mantenimiento', upkeep(me), mx, '#ff8fa5')}<div class="small muted mt">Esta temporada: ingresos ${eur(G.fin.season.inc)} · gastos ${eur(G.fin.season.exp)} · balance <b class="${G.fin.season.inc >= G.fin.season.exp ? 'pos' : 'neg'}">${eur(G.fin.season.inc - G.fin.season.exp)}</b></div></div>
  <div class="panel col"><h3>Precio de las entradas</h3><div class="row"><b style="font-size:26px" id="tk">${me.ticket} €</b><span class="grow"></span><span class="pill">Asistencia <b id="att">${att.toLocaleString('es')}</b> / ${cap.toLocaleString('es')}</span></div><input type="range" min="10" max="150" value="${me.ticket}" data-a="ticket"><div class="small muted">Un precio alto da más ingresos por aficionado, pero reduce la asistencia y el ánimo de la afición.</div><button class="btn" data-a="funds" ${G.fundSeason === G.season ? 'disabled' : ''}>🙏 Pedir fondos a la directiva (+${eur(Math.max(3, me.rep / 8))})</button><div class="tiny muted">Una vez por temporada · baja la confianza de la directiva</div></div></div>
  <h3 class="mt mb">Instalaciones</h3><div class="grid g3">${facs}</div>`;
};
document.addEventListener('input', ev => { const el = ev.target.closest('input[data-a=ticket]'); if (el) { const me = teamOf(G.utid); me.ticket = +el.value; $('#tk').textContent = me.ticket + ' €'; $('#att').textContent = attendance(me).toLocaleString('es'); } });
ACT.upg = d => { const me = teamOf(G.utid), l = me.fac[d.k], c = facCost(l); if (me.cash < c) return toast('No hay dinero suficiente', true); me.cash -= c; me.fac[d.k]++; if (d.k === 'stadium') G.fans = Math.min(100, G.fans + 2); toast(`✅ ${FAC[d.k][0]} mejorada a nivel ${l + 1}`); refresh(); };
ACT.funds = () => { const me = teamOf(G.utid), v = Math.max(3, me.rep / 8); me.tbudget += v; G.board.conf = Math.max(0, G.board.conf - 6); G.fundSeason = G.season; toast(`La directiva concede ${eur(v)} (−confianza)`); refresh(); };
