'use strict';
/* ===== Pantallas del modo jugador ===== */
SCREENS.home = () => G.mode === 'manager' ? homeM() : homeP();

function homeP() {
  const c = G.career, p = mePlayer(), me = teamOf(G.utid), s = p.st;
  const role = c.role || roleOf(p);
  const avg = s.rn ? (s.rs / s.rn).toFixed(2) : '—';
  const pend = c.offers.filter(o => !o.done).length;
  const alerts = [];
  if (p.inj) alerts.push(`🩹 Lesionado: ${p.inj.name} (${p.inj.w} sem)`);
  if (p.ban) alerts.push('🟨 Sancionado');
  if (pend) alerts.push(`🤝 Tienes ${pend} oferta(s) de traspaso: habla con tu agente`);
  if (p.contract <= 1) alerts.push('📝 Estás en el último año de contrato');
  if (c.wantsOut) alerts.push('😤 Has pedido salir del club');
  if (p.morale < 45) alerts.push('😞 Tu ánimo está bajo');
  const sc = Object.values(G.pl).filter(q => q.tid != null && teamOf(q.tid).div === me.div).sort((a, b) => b.st.gls - a.st.gls);
  const rank = sc.findIndex(q => q.id === p.id) + 1;
  const logRows = c.log.slice(0, 6).map(l => `<div class="row small" style="padding:4px 0;border-bottom:1px solid #1a2447"><span class="tag ${l.intl ? 'p' : l.cup ? 'y' : ''}">${l.intl ? 'SEL' : l.cup ? 'COP' : 'LIG'}</span><span class="grow">${l.h} ${l.hg}-${l.ag} ${l.a}</span>${l.dnp ? `<span class="muted">${l.why}</span>` : `<span>${l.min}'</span>${l.g ? `<span>⚽${l.g}</span>` : ''}${l.a2 ? `<span>🎯${l.a2}</span>` : ''}<b class="${l.r >= 7.5 ? 'pos' : l.r < 5.5 ? 'neg' : ''}">${l.r.toFixed(1)}</b>`}</div>`).join('') || '<span class="muted small">Aún no has debutado.</span>';
  return `<div class="grid hp"><div class="panel center col" style="align-items:center">${fcard(p)}<div style="width:100%"><div class="row between small"><b>${esc(p.name)}</b><span class="tag ${role === 'Titular' || role === 'Estrella' ? 'g' : role === 'Rotación' ? 'y' : ''}">${role}</span></div>
  <div class="small muted mt">Condición física ${Math.round(p.fitness)}%</div>${meter(p.fitness)}<div class="small muted mt">Ánimo ${Math.round(p.morale)}</div>${meter(p.morale)}<div class="small muted mt">Forma ${Math.round(p.form)}</div>${meter(p.form)}<div class="small muted mt">Confianza del míster ${Math.round(c.coach)}</div>${meter(c.coach, 'var(--acc2)')}<div class="small muted mt">Fama ${Math.round(c.fame)}</div>${meter(c.fame, 'var(--gold)')}</div></div>
  <div class="col">${nextMatchCard()}${alerts.length ? `<div class="panel"><h3>Atención</h3>${alerts.map(a => `<div class="news">${a}</div>`).join('')}</div>` : ''}
  <div class="grid g2"><div class="panel"><h3>Temporada ${seasonLbl(G.season)}</h3><div class="kpi"><div class="statbox"><div class="muted tiny">PARTIDOS</div><div class="v">${s.app}</div></div><div class="statbox"><div class="muted tiny">GOLES</div><div class="v">${s.gls}</div></div><div class="statbox"><div class="muted tiny">ASIST.</div><div class="v">${s.ast}</div></div><div class="statbox"><div class="muted tiny">NOTA</div><div class="v">${avg}</div></div></div>${s.gls ? `<div class="small muted mt">Puesto ${rank} en la tabla de goleadores</div>` : ''}<div class="row gap8 mt wrap"><span class="pill">${crest(me, 14)} ${esc(me.name)}</span><span class="pill">${tablePos(me.id)}º en ${DIV_NAME[me.div]}</span><span class="pill">💶 ${eur(c.wealth / 1000)}</span></div></div>
  <div class="panel"><h3>Últimos partidos</h3>${logRows}</div></div>
  ${challengePanel(true)}
  <div class="panel"><h3>Noticias</h3>${G.news.slice(0, 5).map(n => `<div class="news ${n.type}">${esc(n.txt)}</div>`).join('') || '<span class="muted small">Sin noticias</span>'}</div>
  <div class="panel row wrap gap8"><button class="btn" data-a="nav" data-k="agenda">🗓️ Planificar semana</button><button class="btn" data-a="nav" data-k="agent">🤝 Agente</button><button class="btn" data-a="nav" data-k="myplayer">⭐ Mi ficha</button></div></div></div>`;
}

SCREENS.myplayer = () => {
  const p = mePlayer(), c = G.career, pot = Math.round(p.pot / 5) * 5;
  const L = attrLbl(p);
  return `<h2 class="mb">⭐ ${esc(p.name)}</h2><div class="grid g2"><div class="panel hero">${fcard(p)}<div class="grow"><div class="kpi"><div class="statbox"><div class="muted tiny">NIVEL</div><div class="v">${p.ovr}</div></div><div class="statbox"><div class="muted tiny">POTENCIAL</div><div class="v">${pot - 3}-${pot + 3}</div></div><div class="statbox"><div class="muted tiny">VALOR</div><div class="v">${eur(p.value)}</div></div></div><div class="mt small">${NATS[p.nat].f} ${NATS[p.nat].n} · ${p.age} años · ${POS_NAME[p.pos]}</div><div class="small">Salario ${fmtK(p.wage)}/sem · Contrato ${p.contract} temp.</div>${p.inj ? `<div class="tag r mt">🩹 ${p.inj.name} · ${p.inj.w} sem</div>` : ''}</div></div>
  <div class="panel row" style="justify-content:space-around;flex-wrap:wrap"><div style="min-width:220px">${attrBars(p)}</div>${radar(p, 170)}</div></div>
  <div class="panel mt"><h3>Historial por temporadas</h3>${playerHistTable(p)}</div>`;
};

SCREENS.agenda = () => {
  const c = G.career, p = mePlayer(), L = attrLbl(p);
  const focus = ATTR.map(k => `<div class="choice ${c.focus === k ? 'on' : ''}" data-a="pfocus" data-k="${k}"><b>${ATTR_NAME[k]}</b><div class="small muted">${L[k]} · ${p.attrs[k]}</div></div>`).join('');
  const ints = [['Suave', 'Menos desgaste y menos riesgo de lesión', 0], ['Normal', 'Equilibrado', 1], ['Intenso', 'Mucho progreso, pero más cansancio y lesiones', 2]].map(([n, d, i]) => `<div class="choice ${c.intensity === i ? 'on' : ''}" data-a="pint" data-i="${i}"><b>${n}</b><div class="small muted">${d}</div></div>`).join('');
  const lifes = [0, 1, 2].map(i => `<div class="choice ${c.lifestyle === i ? 'on' : ''}" data-a="plife" data-i="${i}"><b>${LIFESTYLE[i][0]}</b><div class="small muted">${LIFESTYLE[i][1]}</div></div>`).join('');
  const hasStaff = SHOP.filter(i => i.sub && c.assets.includes(i.id)).map(i => i.n).join(', ') || 'Ninguno (ver Fama y tienda)';
  return `<h2 class="mb">🗓️ Agenda semanal</h2><div class="panel mb small muted">Tus decisiones se aplican cada semana. El progreso se acumula y se refleja a mitad y al final de la temporada. Equipo personal: <b>${hasStaff}</b>. Puntos de entrenamiento acumulados: <b>${c.trainPts.toFixed(1)}</b></div>
  <h3 class="mb">Atributo a potenciar</h3><div class="grid g3 mb">${focus}</div><h3 class="mb">Intensidad de entrenamiento</h3><div class="grid g3 mb">${ints}</div><h3 class="mb">Estilo de vida</h3><div class="grid g3">${lifes}</div>`;
};
ACT.pfocus = d => { G.career.focus = d.k; refresh(); };
ACT.pint = d => { G.career.intensity = +d.i; refresh(); };
ACT.plife = d => { G.career.lifestyle = +d.i; refresh(); };

SCREENS.club = () => {
  const me = teamOf(G.utid), p = mePlayer(), c = G.career;
  const sq = squadOf(me).sort((a, b) => POS_GROUP[a.pos] - POS_GROUP[b.pos] || b.ovr - a.ovr);
  const rivals = sq.filter(q => q.pos === p.pos && q.id !== p.id).sort((a, b) => b.ovr - a.ovr).slice(0, 3);
  return `<div class="row between mb wrap"><div class="row">${crest(me, 48)}<div><h2>${esc(me.name)}</h2><div class="muted small">${DIV_NAME[me.div]} · ${tablePos(me.id)}º · ${stars(me.rep / 20, 5)}</div></div></div></div>
  <div class="grid g3 mb"><div class="panel"><h3>Tu rol</h3><div class="v" style="font-size:24px;font-weight:900">${c.role || roleOf(p)}</div><div class="small muted mt">Rivales en tu puesto</div>${rivals.map(r => `<div class="row small" style="padding:3px 0">${avatar(r, 22)}<span class="grow">${esc(r.name)}</span>${ovrBadge(r.ovr)}</div>`).join('') || '<span class="muted small">Ninguno</span>'}</div>
  <div class="panel"><h3>Relaciones</h3><div class="small muted">Entrenador ${Math.round(c.coach)}</div>${meter(c.coach, 'var(--acc2)')}<div class="small muted mt">Vestuario ${Math.round(c.mates)}</div>${meter(c.mates, 'var(--pur)')}<div class="small muted mt">Afición ${Math.round(G.fans)}</div>${meter(G.fans, 'var(--gold)')}</div>
  <div class="panel"><h3>Mi sistema</h3><div class="small">Formación del míster: <b>${me.formation}</b></div><div class="small muted mt">El entrenador decide la alineación según nivel, forma, condición física y la confianza que tenga en ti.</div></div></div>
  <div class="panel"><h3>Plantilla</h3><div class="tscroll"><table class="tbl"><thead><tr><th>#</th><th>Pos</th><th>Nombre</th><th>Edad</th><th>OVR</th><th>PJ</th><th>G</th><th>Nota</th><th></th></tr></thead><tbody>${sq.map(q => `<tr class="click ${q.id === p.id ? 'me' : ''}" data-a="player" data-id="${q.id}"><td>${q.num}</td><td><span class="tag">${q.pos}</span></td><td>${NATS[q.nat].f} ${esc(q.name)}</td><td>${q.age}</td><td>${ovrBadge(q.ovr)}</td><td>${q.st.app}</td><td>${q.st.gls}</td><td>${q.st.rn ? (q.st.rs / q.st.rn).toFixed(2) : '—'}</td><td>${statusTag(q)}</td></tr>`).join('')}</tbody></table></div></div>`;
};

function offerRow(o, mode) {
  const t = teamOf(o.tid), p = mePlayer();
  const rc = { Estrella: 'g', Titular: 'g', 'Rotación': 'y', Suplente: 'r' }[o.role] || '';
  return `<div class="panel"><div class="row wrap">${crest(t, 44)}<div class="grow"><b style="font-size:17px">${esc(t.name)}${o.renew ? ' <span class="tag b">Renovación</span>' : ''}</b><div class="small muted">${DIV_NAME[t.div]} · ${stars(t.rep / 20, 5)}</div></div><div class="row wrap gap8"><span class="pill">${fmtK(o.wage)}/sem</span><span class="pill">${o.years} años</span><span class="tag ${rc}">${o.role}</span>${o.fee ? `<span class="pill">Traspaso ${eur(o.fee)}</span>` : ''}</div><button class="btn pri" data-a="acceptoffer" data-id="${o.id}" data-m="${mode}">Firmar</button></div></div>`;
}
SCREENS.agent = () => {
  const c = G.career, p = mePlayer(), me = teamOf(G.utid);
  const offs = c.offers.filter(o => !o.done && !c.freeAgent);
  const need = Math.max(p.wage * 1.1, wageFor(p) * 1.05);
  const loans = p.age <= 23 && !p.loan ? loanOptions() : [];
  return `<h2 class="mb">🤝 Tu agente</h2><div class="grid g2"><div class="panel col"><h3>Contrato actual</h3><div>Salario <b>${fmtK(p.wage)}/sem</b> · quedan <b>${p.contract}</b> temporada(s) en ${esc(me.name)}</div><div class="grid g2"><label class="f">Nuevo salario (K€/sem)<input id="rw" type="number" step="0.5" value="${Math.round(need * 10) / 10}"></label><label class="f">Años<select id="ry"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></label></div><button class="btn pri" data-a="prenew">📝 Negociar renovación</button><hr style="border:0;border-top:1px solid var(--line);width:100%"><button class="btn red" data-a="preq" ${c.wantsOut ? 'disabled' : ''}>😤 Pedir el traspaso</button><div class="small muted">Atraerá ofertas, pero el míster dejará de confiar en ti.</div></div>
  <div class="panel"><h3>Cesión</h3>${p.loan ? '<div class="tag b">Estás cedido: volverás al terminar la temporada</div>' : loans.length ? `<div class="small muted mb">Si no juegas, ir cedido te dará minutos.</div>${loans.map(t => `<div class="row small" style="padding:5px 0">${crest(t, 20)}<span class="grow">${esc(t.name)} <span class="muted">${DIV_NAME[t.div]}</span></span><button class="btn sm" data-a="ploan" data-id="${t.id}">Pedir cesión</button></div>`).join('')}` : '<span class="muted small">No disponible.</span>'}</div></div>
  <h3 class="mt mb">Ofertas recibidas</h3><div class="col">${offs.map(o => offerRow(o, 'trans')).join('') || '<div class="panel muted">No hay ofertas ahora mismo. Aparecen durante el mercado si rindes bien.</div>'}</div>`;
};
ACT.prenew = () => { const r = renewMine(+$('#rw').value, +$('#ry').value); toast(r.msg, !r.ok); if (r.ok) refresh(); else if (r.need) $('#rw').value = Math.round(r.need * 10) / 10; };
ACT.preq = () => { if (!confirm('¿Pedir el traspaso? El míster perderá confianza en ti.')) return; requestTransfer(); toast('Has pedido salir'); refresh(); };
ACT.ploan = d => { loanOut(+d.id); autoPick(teamOf(G.utid)); toast('Cesión completada'); go('home'); };
ACT.acceptoffer = d => {
  const c = G.career, o = c.offers.find(x => x.id === +d.id); if (!o) return;
  if (d.m === 'free') { signFreeAgentOffer(o); toast('✍️ Contrato firmado'); return go('seasonend'); }
  acceptOffer(o); toast(`✍️ ¡Fichas por ${esc(teamOf(o.tid).name)}!`); autosave(); go('home');
};

SCREENS.fame = () => {
  const c = G.career, p = mePlayer();
  const sp = SPONSORS.map(s => { const own = c.sponsors.includes(s.id), ok = s.fame <= c.fame; return `<div class="row" style="padding:7px 0;border-bottom:1px solid #1a2447"><div class="grow"><b>${s.n}</b><div class="small muted">Fama ${s.fame}+ · ${fmtK(s.inc)}/sem</div></div>${own ? `<button class="btn sm red" data-a="spon" data-id="${s.id}">Romper</button>` : `<button class="btn sm pri" data-a="spon" data-id="${s.id}" ${ok && c.sponsors.length < 3 ? '' : 'disabled'}>${ok ? 'Firmar' : '🔒'}</button>`}</div>`; }).join('');
  const shop = SHOP.map(i => { const own = c.assets.includes(i.id); return `<div class="panel row"><span style="font-size:30px">${i.ic}</span><div class="grow"><b>${i.n}</b><div class="small muted">${i.d}</div></div>${own ? `<button class="btn sm ${i.sub ? 'red' : ''}" data-a="shop" data-id="${i.id}" ${i.sub ? '' : 'disabled'}>${i.sub ? 'Cancelar' : '✔ Comprado'}</button>` : `<button class="btn sm pri" data-a="shop" data-id="${i.id}" ${c.wealth >= i.p ? '' : 'disabled'}>${i.sub ? fmtK(i.w) + '/sem' : fmtK(i.p)}</button>`}</div>`; }).join('');
  return `<div class="row between mb wrap"><h2>💎 Fama y tienda</h2><div class="row gap8"><span class="pill">💶 ${fmtK(c.wealth)}</span><span class="pill">Fama ${Math.round(c.fame)}</span></div></div><div class="grid g2"><div class="panel"><h3>Patrocinios (máx. 3)</h3>${sp}</div><div class="col"><h3>Tienda y equipo personal</h3>${shop}</div></div>`;
};
ACT.spon = d => { const c = G.career; if (c.sponsors.includes(d.id)) c.sponsors = c.sponsors.filter(x => x !== d.id); else if (c.sponsors.length < 3) c.sponsors.push(d.id); refresh(); };
ACT.shop = d => {
  const c = G.career, it = SHOP.find(x => x.id === d.id), own = c.assets.includes(it.id);
  if (own && it.sub) c.assets = c.assets.filter(x => x !== it.id);
  else if (!own) { if (c.wealth < it.p) return toast('No tienes dinero suficiente', true); c.wealth -= it.p; c.assets.push(it.id); toast(`${it.ic} ${it.n}`); }
  refresh();
};

SCREENS.career = () => {
  const c = G.career, p = mePlayer(), cs = careerSummary();
  const rows = c.seasons.slice().reverse().map(x => `<tr><td>${seasonLbl(x.s)}</td><td>${esc(x.team)}</td><td>${x.ovr}</td><td>${x.app}</td><td>${x.g}</td><td>${x.a}</td><td>${x.r ? x.r.toFixed(2) : '—'}</td><td>${x.rank ? '#' + x.rank : '—'}</td></tr>`).join('');
  return `<div class="row between mb wrap"><h2>📖 Mi carrera</h2>${p.age >= 33 ? '<button class="btn red" data-a="retire">Retirarme</button>' : ''}</div>
  <div class="kpi mb"><div class="statbox"><div class="muted tiny">PARTIDOS</div><div class="v">${cs.app}</div></div><div class="statbox"><div class="muted tiny">GOLES</div><div class="v">${cs.gls}</div></div><div class="statbox"><div class="muted tiny">ASIST.</div><div class="v">${cs.ast}</div></div><div class="statbox"><div class="muted tiny">INTERNAC.</div><div class="v">${c.caps}</div></div><div class="statbox"><div class="muted tiny">GOLES SEL.</div><div class="v">${c.ncGoals}</div></div><div class="statbox"><div class="muted tiny">MÁX. NIVEL</div><div class="v">${cs.peak}</div></div></div>
  <div class="grid g2"><div class="panel"><h3>🏆 Palmarés</h3>${c.titles.map(t => `<div class="small" style="padding:3px 0">🏆 ${seasonLbl(t.s)} · ${t.n}</div>`).join('') || '<span class="muted small">Sin títulos todavía</span>'}</div><div class="panel"><h3>🎖️ Premios individuales</h3>${c.awards.map(t => `<div class="small" style="padding:3px 0">🎖️ ${seasonLbl(t.s)} · ${t.n}</div>`).join('') || '<span class="muted small">Sin premios todavía</span>'}</div></div>
  <div class="panel mt"><h3>Temporadas</h3><div class="tscroll"><table class="tbl"><thead><tr><th>Temp</th><th>Club</th><th>OVR</th><th>PJ</th><th>G</th><th>A</th><th>Nota</th><th>Balón de Oro</th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="muted">Primera temporada en curso</td></tr>'}</tbody></table></div></div>`;
};
ACT.retire = () => { if (!confirm('¿Colgar las botas definitivamente?')) return; retireCareer(); saveGame('player'); go('retired'); };
SCREENS.retired = () => {
  const c = G.career, p = mePlayer(), cs = careerSummary();
  return `<div class="title"><div class="tag y">HALL OF FAME</div>${fcard(p)}<h1 style="font-size:34px;margin:0">${esc(p.name)}</h1><div class="logo" style="font-size:clamp(28px,6vw,52px)">${cs.rank}</div><div class="kpi" style="width:min(720px,100%)"><div class="statbox"><div class="muted tiny">PARTIDOS</div><div class="v">${cs.app}</div></div><div class="statbox"><div class="muted tiny">GOLES</div><div class="v">${cs.gls}</div></div><div class="statbox"><div class="muted tiny">ASIST.</div><div class="v">${cs.ast}</div></div><div class="statbox"><div class="muted tiny">TÍTULOS</div><div class="v">${c.titles.length}</div></div><div class="statbox"><div class="muted tiny">PREMIOS</div><div class="v">${c.awards.length}</div></div><div class="statbox"><div class="muted tiny">PUNTOS</div><div class="v">${cs.score}</div></div></div><button class="btn pri lg" data-a="totitle">Volver al menú</button></div>`;
};
