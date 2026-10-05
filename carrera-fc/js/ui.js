'use strict';
/* ===== UI núcleo: componentes, navegación, menús ===== */
const $ = s => document.querySelector(s);
const UI = { screen: 'title', params: {}, sort: {}, setup: {}, tab: {} };
const SCREENS = {}, ACT = {};
const ovrTier = o => o >= 90 ? 'legend' : o >= 82 ? 'elite' : o >= 75 ? 'gold' : o >= 65 ? 'silver' : 'bronze';
const ovrBadge = o => `<span class="ovr ${ovrTier(o)}">${o}</span>`;
const lum = c => { const n = parseInt(c.slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114); };
const stars = (v, max) => { const n = Math.round(R.clamp(v, 0, max)); return '<span class="stars">' + '★'.repeat(n) + '<span style="opacity:.25">' + '★'.repeat(max - n) + '</span></span>'; };
const attrLbl = p => p.pos === 'POR' ? ATTR_LBL_GK : ATTR_LBL;
const hashN = id => (id * 2654435761) >>> 0;

function crest(t, s) {
  s = s || 28;
  const tc = lum(t.c1) > 140 ? '#10131f' : '#fff', bc = lum(t.c2) > 140 ? '#10131f' : '#fff';
  return `<svg class="crest" width="${s}" height="${Math.round(s * 1.12)}" viewBox="0 0 40 46"><path d="M3 4h34v22c0 10-9 15-17 18C12 41 3 36 3 26z" fill="${t.c1}" stroke="${t.c2}" stroke-width="3"/><path d="M3 4h34v11H3z" fill="${t.c2}"/><text x="20" y="13" text-anchor="middle" font-size="8" font-weight="900" fill="${bc}">${esc(t.short)}</text><circle cx="20" cy="29" r="7" fill="none" stroke="${tc}" stroke-width="2" opacity=".7"/><path d="M20 22v14M13 29h14" stroke="${tc}" stroke-width="1.5" opacity=".7"/></svg>`;
}
function avatar(p, s) {
  s = s || 44;
  const h = hashN(p.id), skin = ['#f3d2b3', '#e4b08a', '#c68863', '#8d5a3b', '#5e3a24'][h % 5], hair = ['#17120e', '#3b2a1a', '#7a4b1e', '#d9b45b', '#a5290e', '#2b2b2b'][(h >> 3) % 6];
  const t = p.tid != null && G && G.teams[p.tid] ? G.teams[p.tid] : { c1: '#566', c2: '#fff' };
  const style = (h >> 6) % 3;
  const hairPath = style === 0 ? `<path d="M13 22c0-9 5-13 11-13s11 4 11 13c-3-5-8-6-11-6s-8 1-11 6z" fill="${hair}"/>` : style === 1 ? `<path d="M12 24c-1-12 6-16 12-16s13 4 12 16c-2-6-6-9-12-9s-10 3-12 9z" fill="${hair}"/>` : `<path d="M14 19c2-6 6-8 10-8s9 2 10 8c-4-3-7-4-10-4s-6 1-10 4z" fill="${hair}"/>`;
  return `<svg class="av" width="${s}" height="${s}" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#1a2447"/><path d="M5 48c0-11 8-16 19-16s19 5 19 16z" fill="${t.c1}"/><path d="M19 32l5 6 5-6" fill="none" stroke="${t.c2}" stroke-width="2"/><rect x="21" y="26" width="6" height="7" fill="${skin}"/><ellipse cx="24" cy="21" rx="9.5" ry="11" fill="${skin}"/>${hairPath}</svg>`;
}
function fcard(p, small, clickable) {
  const a = p.attrs, L = attrLbl(p);
  const keys = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
  const st = keys.map(k => `<div><b>${a[k]}</b> ${L[k]}</div>`).join('');
  return `<div class="fcard ${ovrTier(p.ovr)} ${small ? 'sm' : ''}" ${clickable ? `data-a="player" data-id="${p.id}" style="cursor:pointer"` : ''}><div class="ov">${p.ovr}</div><div class="ps">${p.pos}</div><div class="fl">${NATS[p.nat].f}</div><div class="avw">${avatar(p, 62)}</div><div style="height:${small ? 32 : 62}px"></div><div class="nm">${esc(p.name.split(' ').slice(-1)[0])}</div><div class="st">${st}</div></div>`;
}
function radar(p, size) {
  size = size || 150;
  const c = size / 2, r = size * .36, keys = ATTR, L = attrLbl(p);
  const pt = (i, v) => { const ang = -Math.PI / 2 + i * Math.PI / 3; return [c + Math.cos(ang) * r * v, c + Math.sin(ang) * r * v]; };
  const poly = keys.map((k, i) => pt(i, p.attrs[k] / 100).join(',')).join(' ');
  const grid = [.4, .7, 1].map(f => `<polygon points="${keys.map((k, i) => pt(i, f).join(',')).join(' ')}" fill="none" stroke="#3a4a85" stroke-width="1"/>`).join('');
  const labels = keys.map((k, i) => { const [x, y] = pt(i, 1.28); return `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="9" font-weight="800" fill="#9fb0e8">${L[k]}</text>`; }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${grid}<polygon points="${poly}" fill="#1de58b44" stroke="#1de58b" stroke-width="2"/>${labels}</svg>`;
}
const attrBars = p => ATTR.map(k => { const v = p.attrs[k], col = v >= 85 ? '#8c5cff' : v >= 75 ? '#1de58b' : v >= 60 ? '#f6c744' : v >= 45 ? '#ff9d3d' : '#ff4d6d'; return `<div class="attr"><span class="muted">${ATTR_NAME[k]}${p.pos === 'POR' ? '' : ''}</span><div class="bar"><i style="width:${v}%;background:${col}"></i></div><b>${v}</b></div>`; }).join('');
const meter = (v, col) => `<div class="bar"><i style="width:${R.clamp(v, 0, 100)}%;background:${col || (v > 70 ? 'var(--acc)' : v > 45 ? 'var(--gold)' : 'var(--red)')}"></i></div>`;
const formDots = f => `<span class="form">${f.map(x => `<span class="${x}">${x}</span>`).join('')}</span>`;
const statusTag = p => p.inj ? `<span class="tag r">🩹 ${p.inj.w}s</span>` : p.ban ? `<span class="tag y">🟨 Sanc.</span>` : '';
const eur = (m) => fmtM(m);
const seasonLbl = s => `${s}/${String(s + 1).slice(2)}`;

/* ===== Modales y avisos ===== */
function modal(html, cls) {
  closeModal();
  $('#modal-root').innerHTML = `<div class="ov-bg" data-a="modalbg"><div class="modal ${cls || ''}">${'<button class="x" data-a="close">✕</button>'}${html}</div></div>`;
}
function closeModal() { $('#modal-root').innerHTML = ''; }
function toast(msg, err) {
  const d = document.createElement('div'); d.className = 'toast' + (err ? ' err' : ''); d.innerHTML = msg;
  $('#toast-root').appendChild(d); setTimeout(() => d.remove(), 3200);
}
ACT.close = () => closeModal();
ACT.modalbg = (d, el, ev) => { if (ev.target === el) closeModal(); };

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]');
  if (!el) return;
  const f = ACT[el.dataset.a];
  if (f) { try { f(el.dataset, el, ev); } catch (e) { console.error(e); toast('Error: ' + e.message, true); } }
});

/* ===== Navegación ===== */
function go(screen, params, keepScroll) {
  if (UI.live) stopLive();
  UI.screen = screen; UI.params = params || {};
  render();
  if (!keepScroll) window.scrollTo(0, 0);
}
function render() {
  const f = SCREENS[UI.screen];
  if (!f) return;
  const html = f(UI.params);
  const noShell = ['title', 'msetup', 'psetup', 'pclub', 'sacked', 'match', 'prematch', 'postmatch', 'seasonend', 'retired'].includes(UI.screen);
  $('#app').innerHTML = noShell ? html : shell(html);
  const af = SCREENS[UI.screen + '$']; if (af) af(UI.params);
}
const refresh = () => go(UI.screen, UI.params, true);

const NAV_M = [['home', '🏠', 'Inicio'], ['squad', '👥', 'Plantilla'], ['tactics', '📋', 'Táctica'], ['market', '💸', 'Fichajes'], ['scout', '🔭', 'Ojeadores'], ['youth', '🌱', 'Cantera'], ['finance', '🏟️', 'Club'], ['league', '🏆', 'Liga'], ['inbox', '✉️', 'Buzón']];
const NAV_P = [['home', '🏠', 'Inicio'], ['myplayer', '⭐', 'Mi jugador'], ['agenda', '🗓️', 'Agenda'], ['club', '👥', 'Mi club'], ['league', '🏆', 'Liga'], ['agent', '🤝', 'Agente'], ['fame', '💎', 'Fama y tienda'], ['career', '📖', 'Carrera'], ['inbox', '✉️', 'Buzón']];

function shell(inner) {
  const nav = G.mode === 'manager' ? NAV_M : NAV_P;
  const unread = G.inbox.filter(m => !m.read).length;
  const me = teamOf(G.utid), e = curEvent();
  const nb = nav.map(([k, ic, lb]) => `<button class="${UI.screen === k || (UI.params.from === k) ? 'on' : ''}" data-a="nav" data-k="${k}"><span>${ic}</span>${lb}${k === 'inbox' && unread ? `<span class="badge">${unread}</span>` : ''}</button>`).join('');
  let btn = '', info = '';
  if (G.phase === 'seasonEnd') { btn = `<button class="btn pri lg" data-a="advance">🏁 Fin de temporada</button>`; info = 'Temporada finalizada'; }
  else if (G.sacked) { btn = `<button class="btn red lg" data-a="advance">Has sido despedido</button>`; }
  else if (e) {
    const uf = userFixture(e);
    const lbl = e.t === 'I' ? 'Parón internacional' : uf ? `${uf.h === G.utid ? 'vs' : '@'} ${teamOf(uf.h === G.utid ? uf.a : uf.h).short}` : 'Sin partido';
    btn = `<button class="btn pri lg" data-a="advance">▶ ${e.t === 'I' ? 'Continuar' : uf ? 'Jugar' : 'Simular semana'} · ${lbl}</button>`;
    info = `${evName(e)} · ${G.window ? '<span class="tag g">Mercado abierto</span>' : '<span class="tag">Mercado cerrado</span>'}`;
  }
  const money = G.mode === 'manager' ? `<span class="pill">💰 ${eur(me.cash)}</span><span class="pill">🔁 ${eur(me.tbudget)}</span>` : (G.career ? `<span class="pill">💶 ${eur(G.career.wealth / 1000)}</span>` : '');
  return `<div class="shell"><aside class="side"><div class="brand">⚽ <span>CARRERA <b>FC</b></span></div><nav class="nav">${nb}</nav></aside><main class="main"><div class="top">${crest(me, 38)}<div class="info"><b>${esc(G.mode === 'manager' ? me.name : mePlayer().name)}</b><div class="small muted">${G.mode === 'manager' ? 'Mister ' + esc(G.mgr.name) + ' · ' : esc(me.name) + ' · '}Temp. ${seasonLbl(G.season)} · ${info}</div></div>${money}<button class="btn sm" data-a="save">💾</button><button class="btn sm" data-a="menu">☰</button>${btn}</div><div class="fade">${inner}</div></main></div>`;
}
ACT.nav = d => go(d.k);
ACT.save = () => { toast(saveGame(G.mode) ? '💾 Partida guardada' : 'No se pudo guardar', false); };
ACT.menu = () => modal(`<h2>Menú</h2><div class="col mt"><button class="btn" data-a="save">💾 Guardar partida</button><button class="btn" data-a="exportsave">📤 Exportar partida (archivo)</button><button class="btn red" data-a="quit">🚪 Salir al menú principal</button></div>`, 'sm');
ACT.quit = () => { saveGame(G.mode); closeModal(); go('title'); };
ACT.exportsave = () => {
  const b = new Blob([JSON.stringify(G)], { type: 'application/json' }); const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = `carrerafc_${G.mode}_${G.season}.json`; a.click();
};

/* ===== Título ===== */
SCREENS.title = () => {
  const sm = saveInfo('manager'), sp = saveInfo('player');
  const cont = (s, k) => s ? `<button class="btn lg" data-a="load" data-k="${k}">▶ Continuar ${k === 'manager' ? 'Manager' : 'Jugador'}: <b>${esc(s.name)}</b> · ${esc(s.team)} · ${seasonLbl(s.season)}</button>` : '';
  return `<div class="title"><div><div class="logo">Carrera <em>FC</em></div><p class="muted" style="font-size:18px;margin:8px 0 0">Vive el fútbol desde dentro: <b>sé la estrella</b> o <b>dirige el club</b>.</p></div>
  <div class="modes"><button class="mode" data-a="newm"><div class="big">📋</div><h2>Modo Manager</h2><p>Elige club, ficha promesas, gestiona la cantera, las finanzas y la táctica. Gana la liga y la copa.</p><span class="tag g">Plantillas · Fichajes · Ojeadores · Cantera</span></button>
  <button class="mode" data-a="newp"><div class="big">⭐</div><h2>Modo Jugador</h2><p>Crea a tu futura estrella y vive su carrera: partidos con decisiones en directo, ofertas, fama, selección y Balón de Oro.</p><span class="tag b">Momentos clave · Agente · Patrocinios</span></button></div>
  <div class="col" style="align-items:center">${cont(sm, 'manager')}${cont(sp, 'player')}<label class="btn sm">📥 Cargar archivo<input type="file" id="fileload" accept=".json" style="display:none"></label><button class="btn sm" data-a="help">❔ Cómo se juega</button></div>
  <div class="tiny muted">Equipos y jugadores 100% ficticios · Se guarda en tu navegador</div></div>`;
};
SCREENS['title$'] = () => { const f = $('#fileload'); if (f) f.onchange = e => { const r = new FileReader(); r.onload = () => { try { G = JSON.parse(r.result); PID = Math.max(...Object.values(G.pl).map(p => p.id)) + 1; go('home'); } catch (x) { toast('Archivo no válido', true); } }; r.readAsText(e.target.files[0]); }; };
ACT.load = d => { if (loadGame(d.k)) go('home'); else toast('No se pudo cargar', true); };
ACT.help = () => modal(`<h2>Cómo se juega</h2><div class="col mt"><div><h3>⭐ Modo Jugador</h3><p>Entrena, rinde y gana la confianza del míster. En cada partido en directo aparecerán <b>momentos clave</b> donde decides: disparar, regatear, ceder, entrar fuerte… Tus atributos y la suerte deciden. Atrae ofertas, firma patrocinios y persigue el Balón de Oro.</p></div><div><h3>📋 Modo Manager</h3><p>Controla alineación, formación y mentalidad; ficha en el mercado (¡mira el <b>potencial</b>!), envía ojeadores, promociona canteranos, sube las instalaciones y cumple los objetivos de la directiva o te despedirán.</p></div><div><h3>Tips</h3><ul class="muted"><li>El potencial de jugadores rivales es una estimación; los ojeadores la afinan.</li><li>Los jóvenes mejoran mucho cada temporada; los veteranos decaen.</li><li>El mercado solo está abierto en verano (inicio) e invierno.</li></ul></div></div>`);
ACT.newm = () => { newWorld('manager'); UI.setup = { tid: null, name: '' }; go('msetup'); };
ACT.newp = () => { UI.setup = { name: '', nat: 'ES', pos: 'DC', style: 'killer', diff: 'normal' }; go('psetup'); };

/* ===== Setup manager ===== */
SCREENS.msetup = () => {
  const opt = t => {
    const order = G.teams.filter(x => x.div === t.div).sort((a, b) => strengthOf(b) - strengthOf(a)); const rk = order.findIndex(x => x.id === t.id) + 1;
    return `<div class="choice ${UI.setup.tid === t.id ? 'on' : ''}" data-a="pickclub" data-id="${t.id}"><div class="row">${crest(t, 40)}<div class="grow"><b>${esc(t.name)}</b><div class="small muted">${DIV_NAME[t.div]} · Nº${rk} por plantilla</div></div></div><div class="row mt wrap gap8"><span class="pill">${stars(t.rep / 20, 5)}</span><span class="pill">🔁 ${eur(Math.max(5, t.tbudget))}</span><span class="pill">🏟️ ${t.cap}K</span><span class="pill">OVR ${Math.round(strengthOf(t))}</span></div></div>`;
  };
  return `<div class="main" style="max-width:1100px;margin:0 auto;padding:20px 16px 60px"><div class="row mb"><button class="btn" data-a="totitle">← Volver</button><h2>Modo Manager · elige tu club</h2></div>
  <div class="panel mb"><label class="f">Tu nombre<input id="mname" value="${esc(UI.setup.name)}" placeholder="Ej: Hugo Pairo" maxlength="24"></label></div>
  <h3 class="mb">${DIV_NAME[1]}</h3><div class="grid g3 mb">${G.teams.filter(t => t.div === 1).map(opt).join('')}</div>
  <h3 class="mb">${DIV_NAME[2]} · reto difícil</h3><div class="grid g3 mb">${G.teams.filter(t => t.div === 2).map(opt).join('')}</div>
  <h3 class="mb">${DIV_NAME[3]} · modo leyenda (fútbol regional)</h3><div class="grid g3 mb">${G.teams.filter(t => t.div === 3).map(opt).join('')}</div>
  <div style="position:sticky;bottom:12px"><button class="btn pri lg" data-a="startm" style="width:100%" ${UI.setup.tid == null ? 'disabled' : ''}>Empezar carrera como manager ▶</button></div></div>`;
};
ACT.totitle = () => go('title');
ACT.pickclub = d => { const n = $('#mname'); if (n) UI.setup.name = n.value; UI.setup.tid = +d.id; refresh(); };
ACT.startm = () => {
  const n = $('#mname'); const name = (n && n.value.trim()) || 'Mister';
  G.mgr = { name }; G.utid = UI.setup.tid;
  const t = teamOf(G.utid); t.tbudget = Math.max(5, t.tbudget); t.cash = Math.max(t.cash, 8);
  startSeasonSchedule(); repairLineup(t); t.userForm = true;
  G.board.conf = 60;
  inbox({ title: `Bienvenido a ${t.name}`, body: `La directiva te da la bienvenida. Objetivo de la temporada: ${G.board.txt}. Tienes ${eur(t.tbudget)} para fichajes.`, type: 'info' });
  go('home');
};

/* ===== Setup jugador ===== */
SCREENS.psetup = () => {
  const s = UI.setup;
  const natOpts = NAT_KEYS.map(k => `<option value="${k}" ${s.nat === k ? 'selected' : ''}>${NATS[k].f} ${NATS[k].n}</option>`).join('');
  const posOpts = POS_LIST.map(k => `<option value="${k}" ${s.pos === k ? 'selected' : ''}>${k} · ${POS_NAME[k]}</option>`).join('');
  const styles = Object.entries(STYLES).map(([k, v]) => `<div class="choice ${s.style === k ? 'on' : ''}" data-a="pset" data-k="style" data-v="${k}"><b>${v.n}</b><div class="small muted">${v.d}</div></div>`).join('');
  const diffs = [['facil', 'Promesa mundial', 'Potencial muy alto'], ['normal', 'Talento', 'Potencial alto'], ['dificil', 'Guerrero', 'Potencial normal: ¡tendrás que sudarlo!']].map(([k, a, b]) => `<div class="choice ${s.diff === k ? 'on' : ''}" data-a="pset" data-k="diff" data-v="${k}"><b>${a}</b><div class="small muted">${b}</div></div>`).join('');
  return `<div class="main" style="max-width:900px;margin:0 auto;padding:20px 16px 60px"><div class="row mb"><button class="btn" data-a="totitle">← Volver</button><h2>Modo Jugador · crea tu estrella</h2></div>
  <div class="panel col"><div class="grid g3"><label class="f">Nombre completo<input id="pname" value="${esc(s.name)}" placeholder="Ej: Hugo Pairo" maxlength="26"></label><label class="f">Nacionalidad<select id="pnat">${natOpts}</select></label><label class="f">Posición<select id="ppos">${posOpts}</select></label></div>
  <div><h3 class="mb">Estilo de juego</h3><div class="grid g4">${styles}</div></div><div><h3 class="mb">Dificultad (potencial oculto)</h3><div class="grid g3">${diffs}</div></div>
  <button class="btn pri lg" data-a="pnext">Elegir primer club ▶</button></div></div>`;
};
ACT.pset = d => { grabP(); UI.setup[d.k] = d.v; refresh(); };
function grabP() { const g = (id, k) => { const e = $(id); if (e) UI.setup[k] = e.value; }; g('#pname', 'name'); g('#pnat', 'nat'); g('#ppos', 'pos'); }
ACT.pnext = () => {
  grabP(); const s = UI.setup; if (!s.name.trim()) { toast('Escribe un nombre', true); return; }
  s.name = s.name.trim();
  const { clubs } = newPlayerCareer(s); UI.setup.clubs = clubs.map(c => c.id); go('pclub');
};
SCREENS.pclub = () => {
  const p = mePlayer ? G.pl[G.career.pid] : null;
  const cards = UI.setup.clubs.map(id => {
    const t = teamOf(id), rival = squadOf(t).filter(q => q.pos === p.pos).sort((a, b) => b.ovr - a.ovr)[0];
    return `<div class="choice" data-a="pickp" data-id="${id}"><div class="row">${crest(t, 46)}<div class="grow"><b style="font-size:18px">${esc(t.name)}</b><div class="small muted">${DIV_NAME[t.div]} · ${t.city}</div></div></div><div class="row wrap gap8 mt"><span class="pill">${stars(t.rep / 20, 5)}</span><span class="pill">Contrato 3 años</span><span class="pill">Rival en tu puesto: ${rival ? rival.ovr : '—'}</span></div></div>`;
  }).join('');
  const pot = Math.round(p.pot / 5) * 5;
  return `<div class="main" style="max-width:900px;margin:0 auto;padding:20px 16px 60px"><div class="row mb"><button class="btn" data-a="backp">← Atrás</button><h2>Tu debut profesional</h2></div>
  <div class="panel mb hero">${fcard(p)}<div class="grow"><h2>${esc(p.name)}</h2><p class="muted">${NATS[p.nat].f} ${NATS[p.nat].n} · ${p.age} años · ${POS_NAME[p.pos]}</p><div class="kpi"><div class="statbox"><div class="muted small">Nivel</div><div class="v">${p.ovr}</div></div><div class="statbox"><div class="muted small">Potencial estimado</div><div class="v">${pot - 3}-${pot + 3}</div></div><div class="statbox"><div class="muted small">Valor</div><div class="v">${eur(p.value)}</div></div></div></div></div>
  <h3 class="mb">Tres clubes quieren ficharte</h3><div class="col">${cards}</div></div>`;
};
ACT.backp = () => go('psetup');
ACT.pickp = d => { startAt(+d.id); G.pbias = playerBias(); go('home'); };

/* ===== Avance de semana ===== */
function autosave() { saveGame(G.mode); }
ACT.advance = () => {
  if (G.sacked && G.mode === 'manager') return go('sacked');
  if (G.phase === 'seasonEnd') { if (!G.lastSummary) finishSeason(); return go('seasonend'); }
  const e = curEvent();
  if (e.t === 'I') {
    if (G.mode === 'player') { const p = mePlayer(); G.career.called = isCalledUp(p) && !G.career.retired; if (G.career.called) return go('prematch', { intl: true }); }
    runEvent(null); autosave(); toast('🌍 Parón internacional: el equipo recupera energías'); return afterWeek();
  }
  const uf = userFixture(e);
  if (!uf) { runEvent(null); autosave(); toast('Semana simulada: tu equipo no juega'); return afterWeek(); }
  go('prematch');
};
function afterWeek() { if (G.sacked && G.mode === 'manager') go('sacked'); else go('home'); }

/* ===== Previa ===== */
function sideInfo(t) {
  const xi = xiPlayers(t).filter(Boolean);
  const g = f => { const l = xi.filter(f); return l.length ? Math.round(l.reduce((s, p) => s + p.ovr, 0) / l.length) : 0; };
  return { att: g(p => POS_GROUP[p.pos] === 3), mid: g(p => POS_GROUP[p.pos] === 2), def: g(p => POS_GROUP[p.pos] <= 1), ovr: teamOvr(t) };
}
SCREENS.prematch = (par) => {
  const e = curEvent();
  let H, A, uf, title, subtitle;
  if (par.intl) {
    const p = mePlayer(), nat = p.nat; const rivals = NAT_KEYS.filter(k => k !== nat);
    if (!UI.intl || UI.intl.w !== G.week) {
      cleanupTemp();
      const mine = makeNationalTeam(nat, p, 101), foe = makeNationalTeam(R.pick(rivals), null, 102);
      [mine, foe].forEach(t => { repairLineup(t); if (t === mine) { G.pbias = { [p.id]: 6 }; autoPick(t, true); } else autoPick(t, true); });
      UI.intl = { w: G.week, mine, foe };
    }
    H = UI.intl.mine; A = UI.intl.foe; title = 'Partido con la selección'; subtitle = 'Amistoso internacional';
    uf = { h: 101, a: 102, kind: 'I' };
  } else {
    uf = userFixture(e); H = teamOf(uf.h); A = teamOf(uf.a);
    const me = teamOf(G.utid), opp = G.utid === H.id ? A : H;
    if (UI.pmKey !== G.season + '_' + G.week) { prepAI(opp, me); prepUserAuto(me); UI.pmKey = G.season + '_' + G.week; if (G.mode === 'manager') me.userForm = true; }
    title = evName(e); subtitle = e.t === 'L' ? DIV_NAME[H.div] : 'Copa';
  }
  const meT = par.intl ? (H) : teamOf(G.utid);
  const info = t => sideInfo(t);
  const hi = info(H), ai = info(A);
  const col = (t, i) => `<div class="panel"><div class="row">${crest(t, 44)}<div class="grow"><h2>${esc(t.name)}</h2><div class="small muted">${t.formation} · ${par.intl ? '' : DIV_NAME[t.div] + ' · ' + (tablePos(t.id)) + 'º'}</div></div>${ovrBadge(i.ovr)}</div>
    <div class="kpi mt"><div class="statbox"><div class="muted tiny">ATA</div><div class="v">${i.att}</div></div><div class="statbox"><div class="muted tiny">MED</div><div class="v">${i.mid}</div></div><div class="statbox"><div class="muted tiny">DEF</div><div class="v">${i.def}</div></div></div>
    ${!par.intl ? `<div class="mt small muted">Forma: ${formDots((G.table[t.div].find(r => r.tid === t.id) || { form: [] }).form)}</div>` : ''}
    <div class="mt plist">${xiPlayers(t).map((p, i) => p ? `<div class="it" ${p.tmp ? '' : `data-a="player" data-id="${p.id}"`}><span class="tag">${FORM_SLOTS[t.formation][i].pos}</span><span class="grow">${esc(p.name)} ${G.career && p.id === G.career.pid ? '⭐' : ''}</span>${statusTag(p)}${ovrBadge(p.ovr)}</div>` : '').join('')}</div></div>`;
  let extra = '', canPlay = true;
  if (G.mode === 'player') {
    const p = mePlayer(), t = par.intl ? H : teamOf(G.utid);
    const inXI = t.xi.includes(p.id), onB = t.bench.includes(p.id);
    const st = p.inj ? ['🩹 Estás lesionado', 'r'] : p.ban ? ['🟥 Sancionado', 'y'] : inXI ? ['✅ Eres TITULAR', 'g'] : onB ? ['🪑 Estás en el banquillo (puedes entrar en la 2ª parte)', 'y'] : ['❌ No convocado', 'r'];
    extra = `<div class="panel row"><div style="font-size:30px">${NATS[p.nat].f}</div><div class="grow"><b>${esc(p.name)}</b> · Rol: <b>${roleOf ? (G.career.role || roleOf(p)) : ''}</b><div class="small muted">Confianza del míster ${Math.round(G.career.coach)} · Forma ${Math.round(p.form)} · Físico ${Math.round(p.fitness)}%</div></div><span class="tag ${st[1]}">${st[0]}</span></div>`;
  } else {
    const inj = squadOf(teamOf(G.utid)).filter(p => p.inj).length;
    extra = `<div class="panel row wrap"><span class="pill">Formación ${teamOf(G.utid).formation}</span><span class="pill">${MENTALITY[teamOf(G.utid).mentality]}</span>${inj ? `<span class="tag r">🩹 ${inj} lesionados</span>` : ''}<span class="grow"></span><button class="btn" data-a="nav" data-k="tactics">📋 Cambiar táctica</button><button class="btn" data-a="press">🎤 Rueda de prensa</button></div>`;
  }
  return `<div class="main" style="max-width:1100px;margin:0 auto;padding:16px 16px 100px"><div class="row mb"><button class="btn" data-a="nav" data-k="home">← Atrás</button><div class="grow center"><span class="tag b">${title}</span> <span class="muted">${subtitle}</span></div></div>
  <div class="grid g2">${col(H, hi)}${col(A, ai)}</div><div class="mt col">${extra}
  <div class="row wrap center" style="justify-content:center"><button class="btn pri lg" data-a="play" data-intl="${par.intl ? 1 : 0}">⚽ Jugar partido en directo</button><button class="btn lg" data-a="simmatch" data-intl="${par.intl ? 1 : 0}">⏩ Simular resultado</button></div></div></div>`;
};
const PRESS_Q = [
  ['¿Cómo ve el partido de hoy?', [['«Vamos a ganar, estamos preparados.»', 'conf'], ['«Respeto al rival, será un partido igualado.»', 'humble'], ['«Que se preocupen ellos de nosotros.»', 'agg']]],
  ['¿Hay presión por los resultados?', [['«La presión es un privilegio.»', 'conf'], ['«Trabajamos día a día, sin mirar la tabla.»', 'humble'], ['«No me van a hacer perder los nervios.»', 'agg']]],
  ['¿Qué opina del estado físico de la plantilla?', [['«Estamos al 100 %.»', 'conf'], ['«Hay jugadores tocados, pero nos adaptamos.»', 'humble'], ['«Los jugadores saben lo que tienen que hacer.»', 'agg']]]
];
ACT.press = () => {
  if (UI.pressDone === G.week) { toast('Ya has atendido a la prensa esta semana'); return; }
  const q = R.pick(PRESS_Q);
  modal(`<h2>🎤 Rueda de prensa</h2><p class="mt" style="font-size:17px">"${q[0]}"</p><div class="col mt">${q[1].map(([t, k]) => `<button class="btn" style="justify-content:flex-start;text-align:left" data-a="pressans" data-k="${k}">${t}</button>`).join('')}</div>`, 'sm');
};
ACT.pressans = d => {
  UI.pressDone = G.week; const me = teamOf(G.utid);
  const k = d.k; let m = 0, b = 0, f = 0, msg;
  if (k === 'conf') { m = R.chance(.65) ? 3 : -2; b = 1; f = 1; msg = m > 0 ? 'El vestuario se contagia de tu confianza (+moral)' : 'Tus palabras generan presión (−moral)'; }
  else if (k === 'humble') { m = 1; b = 1.5; f = 0; msg = 'Mensaje prudente: la directiva lo agradece'; }
  else { m = R.chance(.5) ? 4 : -3; b = -1; f = 2; msg = m > 0 ? 'Los jugadores se sienten protegidos (+moral)' : 'Polémica en la prensa (−moral)'; }
  squadOf(me).forEach(p => p.morale = R.clamp(p.morale + m, 20, 100)); G.board.conf = R.clamp(G.board.conf + b, 0, 100); G.fans = R.clamp(G.fans + f, 5, 100);
  closeModal(); toast('🎤 ' + msg);
};

/* ===== Post-partido ===== */
SCREENS.postmatch = () => {
  const L = UI.last; if (!L) return '<div class="main">Sin datos</div>';
  const res = L.res, H = res.home, A = res.away;
  const pn = id => { const r = res.rows.find(x => x.p.id === id); return r ? r.p.name : ''; };
  const goals = res.events.filter(e => e.type === 'goal').map(e => `<div class="row small"><span class="tag">${e.l}</span>${e.si === 0 ? crest(H, 16) : crest(A, 16)}<span>${esc(pn(e.pid))}${e.aid ? ` <span class="muted">(${esc(pn(e.aid))})</span>` : ''}</span></div>`).join('') || '<span class="muted">Sin goles</span>';
  const tbl = si => `<div class="tscroll"><table class="tbl"><thead><tr><th>Jugador</th><th>Pos</th><th>Nota</th><th>G</th><th>A</th><th>Min</th></tr></thead><tbody>${res.rows.filter(r => r.si === si).sort((a, b) => b.r - a.r).map(r => `<tr class="${G.career && r.p.id === G.career.pid ? 'me' : ''}"><td>${esc(r.p.name)} ${r.red ? '🟥' : r.yc ? '🟨' : ''}</td><td>${r.pos}</td><td><b class="${r.r >= 7.5 ? 'pos' : r.r < 5.5 ? 'neg' : ''}">${r.r.toFixed(1)}</b></td><td>${r.g || ''}</td><td>${r.a || ''}</td><td>${r.min}'</td></tr>`).join('')}</tbody></table></div>`;
  const sb = (l, a, b) => { const t = a + b || 1; return `<div class="sbar"><b>${a}</b><div><div class="muted tiny center">${l}</div><div class="tr"><i style="width:${100 * a / t}%;background:${H.c1 === '#ffffff' || lum(H.c1) > 200 ? H.c2 : H.c1}"></i><i style="width:${100 * b / t}%;background:${A.c1 === '#ffffff' || lum(A.c1) > 200 ? A.c2 : A.c1}"></i></div></div><b>${b}</b></div>`; };
  const ph = res.stats[0].poss, pa = res.stats[1].poss, tp = ph + pa || 1;
  const rowsAll = G.results.filter(r => r.w === L.week);
  let mine = '';
  if (G.mode === 'player' && !L.intl) {
    const r = res.rows.find(x => x.p.id === G.career.pid);
    mine = r ? `<div class="panel mb hero">${fcard(mePlayer(), true)}<div><h2>Tu actuación: <span class="${r.r >= 7.5 ? 'pos' : r.r < 5.5 ? 'neg' : ''}">${r.r.toFixed(1)}</span></h2><p class="muted">${r.min} minutos · ${r.g} goles · ${r.a} asistencias · momentos clave: ${r.keyOK} acertados / ${r.keyBad} fallados ${res.motm.p.id === r.p.id ? '· <b class="gold">⭐ MVP del partido</b>' : ''}</p></div></div>` : `<div class="panel mb"><b>No has disputado minutos en este partido.</b><div class="muted small">${L.dnp || ''}</div></div>`;
  }
  return `<div class="main" style="max-width:1100px;margin:0 auto;padding:16px 16px 100px">${mine}<div class="score mb">${crest(H, 40)}<div class="tm">${esc(H.name)}</div><div class="sc">${res.hg} - ${res.ag}</div><div class="tm">${esc(A.name)}</div>${crest(A, 40)}</div>
  ${res.pens ? `<div class="center mb"><span class="tag y">Penaltis ${res.pens[0]}-${res.pens[1]}</span></div>` : ''}
  <div class="grid g2"><div class="panel"><h3>Goles</h3>${goals}<div class="mt"><h3>MVP</h3><div class="row mt">${avatar(res.motm.p, 40)}<div><b>${esc(res.motm.p.name)}</b><div class="muted small">${res.motm.r.toFixed(1)} · ${res.motm.si === 0 ? H.short : A.short}</div></div></div></div></div>
  <div class="panel"><h3>Estadísticas</h3>${sb('Posesión', Math.round(100 * ph / tp), 100 - Math.round(100 * ph / tp))}${sb('Tiros', res.stats[0].sh, res.stats[1].sh)}${sb('A puerta', res.stats[0].sot, res.stats[1].sot)}${sb('Córners', res.stats[0].corn, res.stats[1].corn)}${sb('Faltas', res.stats[0].fouls, res.stats[1].fouls)}${sb('Amarillas', res.stats[0].yc, res.stats[1].yc)}</div></div>
  <div class="grid g2 mt"><div class="panel"><h3>${esc(H.name)}</h3>${tbl(0)}</div><div class="panel"><h3>${esc(A.name)}</h3>${tbl(1)}</div></div>
  ${rowsAll.length ? `<div class="panel mt"><h3>Resto de resultados</h3><div class="grid g3">${rowsAll.map(r => `<div class="small row between"><span>${teamOf(r.h).short} ${r.hg}-${r.ag} ${teamOf(r.a).short}</span>${r.pens ? `<span class="tag y">pen ${r.pens[0]}-${r.pens[1]}</span>` : ''}</div>`).join('')}</div></div>` : ''}
  <div class="mt center"><button class="btn pri lg" data-a="afterpm">Continuar ▶</button></div></div>`;
};
ACT.afterpm = () => afterWeek();

/* ===== Liga ===== */
SCREENS.league = () => {
  const tab = UI.tab.league || 'table';
  const tabs = [['table', 'Clasificación'], ['fix', 'Partidos'], ['cup', 'Copa'], ['stats', 'Estadísticas']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-a="tab" data-s="league" data-k="${k}">${l}</button>`).join('');
  const div = UI.tab.div || teamOf(G.utid).div;
  const divTabs = DIVS.map(d => `<button class="${div === d ? 'on' : ''}" data-a="tab" data-s="div" data-k="${d}" data-n="1">${DIV_NAME[d]}</button>`).join('');
  let body = '';
  if (tab === 'table') {
    const tb = table(div), n = tb.length;
    body = `<div class="tabs">${divTabs}</div><div class="panel"><div class="tscroll"><table class="tbl"><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th><th>Forma</th></tr></thead><tbody>${tb.map((r, i) => { const t = teamOf(r.tid); const cls = r.tid === G.utid ? 'me ' : ''; const z = div === 3 ? (i < 2 ? 'up' : '') : (i < 2 ? 'up' : i >= n - 2 && div === 1 ? 'dn' : i >= n - 2 ? 'dn' : ''); return `<tr class="${cls}${z}"><td>${i + 1}</td><td>${crest(t, 18)} ${esc(t.name)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gf - r.ga}</td><td><b>${r.pts}</b></td><td>${formDots(r.form)}</td></tr>`; }).join('')}</tbody></table></div><div class="small muted mt">${div === 1 ? '🟩 Líderes · 🟥 Descenso (2 últimos)' : div === 2 ? '🟩 Ascenso directo (2 primeros) · 🟥 Descenso (2 últimos)' : '🟩 Ascenso directo (2 primeros)'}</div></div>`;
  } else if (tab === 'fix') {
    const e = curEvent(); let lr = UI.tab.round != null ? UI.tab.round : Math.max(0, Math.min(21, (e && e.t === 'L' ? e.r : G.cal.filter(x => x.t === 'L').length ? (e ? e.lr : 21) : 21) - (e && e.t === 'L' ? 0 : 1)));
    lr = R.clamp(lr, 0, 21);
    const fx = G.fix[div][lr];
    const done = G.results.filter(r => !r.cup && r.div === div);
    body = `<div class="tabs">${divTabs}</div><div class="panel"><div class="row between mb"><button class="btn sm" data-a="round" data-d="-1">◀</button><h3>Jornada ${lr + 1}</h3><button class="btn sm" data-a="round" data-d="1">▶</button></div>${fx.map(([h, a]) => { const r = done.find(x => x.h === h && x.a === a && G.cal[x.w] && G.cal[x.w].r === lr); return `<div class="row between" style="padding:8px 4px;border-bottom:1px solid #1a2447;${h === G.utid || a === G.utid ? 'background:#1de58b10' : ''}"><div class="row grow" style="justify-content:flex-end">${esc(teamOf(h).name)} ${crest(teamOf(h), 22)}</div><b style="min-width:70px;text-align:center">${r ? r.hg + ' - ' + r.ag : 'vs'}</b><div class="row grow">${crest(teamOf(a), 22)} ${esc(teamOf(a).name)}</div></div>`; }).join('')}</div>`;
  } else if (tab === 'cup') {
    const c = G.cup;
    const rounds = CUP_NAMES.map((nm, i) => {
      const rs = c.rounds[i];
      const pend = i === c.round && !c.winner ? c.pairs : [];
      return `<div class="panel"><h3>${nm}</h3>${rs.map(m => `<div class="row between small" style="padding:5px 0;border-bottom:1px solid #1a2447"><span class="${m.w === m.h ? 'pos' : ''}">${teamOf(m.h).short}</span><b>${m.hg}-${m.ag}${m.pens ? ` (${m.pens[0]}-${m.pens[1]})` : ''}</b><span class="${m.w === m.a ? 'pos' : ''}">${teamOf(m.a).short}</span></div>`).join('')}${pend.map(([h, a]) => `<div class="row between small muted" style="padding:5px 0"><span>${teamOf(h).short}</span><span>vs</span><span>${teamOf(a).short}</span></div>`).join('')}</div>`;
    }).join('');
    body = `${c.winner != null ? `<div class="panel mb center"><h2>🏆 Campeón de Copa: ${crest(teamOf(c.winner), 30)} ${esc(teamOf(c.winner).name)}</h2></div>` : ''}<div class="grid g4">${rounds}</div>`;
  } else {
    const all = Object.values(G.pl).filter(p => p.tid != null && !p.youth && (teamOf(p.tid).div === div));
    const lst = (title, arr, fn) => `<div class="panel"><h3>${title}</h3>${arr.map((p, i) => `<div class="row small" style="padding:4px 0;cursor:pointer" data-a="player" data-id="${p.id}"><span class="muted" style="width:18px">${i + 1}</span>${crest(teamOf(p.tid), 16)}<span class="grow">${esc(p.name)}</span><b>${fn(p)}</b></div>`).join('') || '<span class="muted">—</span>'}</div>`;
    const avg = p => p.st.rn ? p.st.rs / p.st.rn : 0;
    body = `<div class="tabs">${divTabs}</div><div class="grid g3">${lst('⚽ Goleadores', all.slice().sort((a, b) => b.st.gls - a.st.gls).filter(p => p.st.gls).slice(0, 10), p => p.st.gls)}${lst('🎯 Asistentes', all.slice().sort((a, b) => b.st.ast - a.st.ast).filter(p => p.st.ast).slice(0, 10), p => p.st.ast)}${lst('⭐ Mejor nota (≥5 PJ)', all.filter(p => p.st.app >= 5).sort((a, b) => avg(b) - avg(a)).slice(0, 10), p => avg(p).toFixed(2))}${lst('🧤 Porterías a cero', all.filter(p => p.pos === 'POR').sort((a, b) => b.st.cs - a.st.cs).filter(p => p.st.cs).slice(0, 10), p => p.st.cs)}${lst('🟨 Amarillas', all.slice().sort((a, b) => b.st.yc - a.st.yc).filter(p => p.st.yc).slice(0, 10), p => p.st.yc)}${lst('🏃 Más minutos', all.slice().sort((a, b) => b.st.min - a.st.min).slice(0, 10), p => p.st.min)}</div>`;
  }
  return `<h2 class="mb">🏆 Liga y copa</h2><div class="tabs">${tabs}</div>${body}`;
};
ACT.tab = d => { if (d.s === 'div') UI.tab.div = +d.k; else UI.tab[d.s] = d.k; refresh(); };
ACT.round = d => { const e = curEvent(); const cur = UI.tab.round != null ? UI.tab.round : (e ? Math.max(0, (e.t === 'L' ? e.r : e.lr - 1)) : 21); UI.tab.round = R.clamp(cur + +d.d, 0, 21); refresh(); };

/* ===== Buzón ===== */
SCREENS.inbox = () => {
  const items = G.inbox.map(m => {
    let act = '';
    if (m.type === 'offer' && !m.done) { const p = G.pl[m.data.pid]; if (p && p.tid === G.utid) act = `<div class="row gap8 mt"><button class="btn pri sm" data-a="offeracc" data-id="${m.id}">Aceptar ${eur(m.data.fee)}</button><button class="btn sm" data-a="offercnt" data-id="${m.id}">Pedir +20%</button><button class="btn red sm" data-a="offerrej" data-id="${m.id}">Rechazar</button></div>`; else m.done = 'gone'; }
    return `<div class="panel ${m.read ? '' : ''}" style="${m.read ? '' : 'border-color:var(--acc)'}"><div class="row between"><b>${esc(m.title)}</b><span class="tiny muted">T${m.s} · sem ${m.w + 1}</span></div><div class="muted mt" style="margin-top:4px">${esc(m.body)}</div>${m.done ? `<div class="tag mt">${m.done === 'accepted' ? '✔ Aceptada' : m.done === 'rejected' ? '✖ Rechazada' : 'Expirada'}</div>` : ''}${act}</div>`;
  }).join('') || '<div class="muted">Sin mensajes.</div>';
  setTimeout(() => { G.inbox.forEach(m => m.read = true); }, 0);
  return `<h2 class="mb">✉️ Buzón</h2><div class="col">${items}</div><h3 class="mt mb">Noticias del mundo</h3><div class="panel">${G.news.slice(0, 25).map(n => `<div class="news ${n.type}">${esc(n.txt)}</div>`).join('') || '<span class="muted">Sin noticias</span>'}</div>`;
};
const findMsg = id => G.inbox.find(m => m.id === +id);
ACT.offeracc = d => { const m = findMsg(d.id), p = G.pl[m.data.pid]; if (!p || p.tid !== G.utid) return; sellPlayer(p, m.data.tid, m.data.fee); m.done = 'accepted'; repairLineup(teamOf(G.utid)); toast(`Vendido ${esc(p.name)} por ${eur(m.data.fee)}`); refresh(); };
ACT.offerrej = d => { findMsg(d.id).done = 'rejected'; refresh(); };
ACT.offercnt = d => { const m = findMsg(d.id); if (R.chance(.45)) { m.data.fee = Math.round(m.data.fee * 1.2 * 100) / 100; toast('El club acepta pagar más: ' + eur(m.data.fee)); } else { m.done = 'rejected'; toast('El club retira su oferta', true); } refresh(); };

/* ===== Ficha de jugador ===== */
function playerHistTable(p) {
  const rows = p.hist.slice().reverse();
  const cur = p.st.app ? [{ s: G.season, tid: p.tid, ovr: p.ovr, ...p.st }] : [];
  const all = cur.concat(rows);
  if (!all.length) return '<div class="muted small">Sin estadísticas todavía.</div>';
  return `<div class="tscroll"><table class="tbl"><thead><tr><th>Temp</th><th>Club</th><th>OVR</th><th>PJ</th><th>G</th><th>A</th><th>Nota</th></tr></thead><tbody>${all.map(h => `<tr><td>${seasonLbl(h.s)}</td><td>${h.tid != null && G.teams[h.tid] ? esc(G.teams[h.tid].short) : '—'}</td><td>${h.ovr}</td><td>${h.app}</td><td>${h.gls}</td><td>${h.ast}</td><td>${h.rn ? (h.rs / h.rn).toFixed(2) : '—'}</td></tr>`).join('')}</tbody></table></div>`;
}
ACT.player = d => showPlayer(+d.id);
function showPlayer(id) {
  const p = G.pl[id]; if (!p) return;
  const t = p.tid != null ? teamOf(p.tid) : null, own = p.tid === G.utid;
  const pot = shownPot(p), potTxt = own || p.scouted ? `<b>${p.pot}</b>` : `<b>~${pot}</b> <span class="tiny muted">(estimado)</span>`;
  const showPot = p.age <= 30 || own;
  const d = (a, b) => `<div class="row between small" style="padding:3px 0;border-bottom:1px solid #1a2447"><span class="muted">${a}</span><span>${b}</span></div>`;
  const delta = p.o0 != null && p.o0 !== p.ovr ? ` <span class="${p.ovr > p.o0 ? 'pos' : 'neg'} small">${p.ovr > p.o0 ? '▲' : '▼'}${Math.abs(p.ovr - p.o0)}</span>` : '';
  modal(`<div class="hero">${fcard(p)}<div class="grow" style="min-width:230px"><h2>${esc(p.name)}</h2><div class="muted">${NATS[p.nat].f} ${NATS[p.nat].n} · ${p.age} años · ${POS_NAME[p.pos]} ${p.youth ? '· <span class="tag g">Cantera</span>' : ''}</div><div class="row wrap gap8 mt">${t ? `<span class="pill">${crest(t, 14)} ${esc(t.name)}</span>` : '<span class="pill">Agente libre</span>'}${statusTag(p)}${p.listed ? '<span class="tag y">En venta</span>' : ''}${p.loan ? '<span class="tag b">Cedido</span>' : ''}</div>
  <div class="mt">${d('Nivel / Potencial', `${p.ovr}${delta} / ${showPot ? potTxt : '—'}`)}${d('Valor de mercado', eur(p.value))}${d('Salario', fmtK(p.wage) + '/sem')}${d('Contrato', p.contract + ' temp.')}${d('Moral', Math.round(p.morale))}${d('Forma', Math.round(p.form))}${d('Condición física', Math.round(p.fitness) + '%')}${p.inj ? d('Lesión', `${p.inj.name} (${p.inj.w} sem)`) : ''}</div></div>
  <div class="center"><div>${radar(p, 160)}</div></div></div>
  <div class="grid g2 mt"><div>${attrBars(p)}</div><div><h3 class="mb">Historial</h3>${playerHistTable(p)}</div></div>
  <div class="mt">${typeof PA === 'function' ? PA(p) : ''}</div>`);
}
