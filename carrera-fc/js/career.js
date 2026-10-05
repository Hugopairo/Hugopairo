'use strict';
/* ===== Modo jugador: carrera ===== */
const STYLES = {
  tecnico: { n: 'Técnico', d: 'Regate y pase por encima de la media', b: { dri: 6, pas: 6 } },
  fisico: { n: 'Físico', d: 'Potencia, duelos y defensa', b: { phy: 6, def: 6 } },
  rapido: { n: 'Veloz', d: 'Arrancadas y desborde', b: { pac: 8, dri: 3 } },
  killer: { n: 'Killer', d: 'Olfato de gol y remate', b: { sho: 8, phy: 3 } }
};
const SHOP = [
  { id: 'apto', n: 'Apartamento céntrico', p: 150, d: 'Ánimo +2', mo: 2, ic: '🏢' },
  { id: 'coche', n: 'Coche deportivo', p: 90, d: 'Fama +1 / sem', fame: 1, ic: '🏎️' },
  { id: 'villa', n: 'Villa con piscina', p: 1400, d: 'Ánimo +5', mo: 5, ic: '🏡' },
  { id: 'yate', n: 'Yate en el Mediterráneo', p: 4500, d: 'Ánimo +6, Fama +2', mo: 6, fame: 2, ic: '🛥️' },
  { id: 'fisio', n: 'Fisio personal', p: 0, w: 3, d: 'Recuperación +, lesiones más cortas', ic: '💆', sub: true },
  { id: 'nutri', n: 'Nutricionista', p: 0, w: 2, d: 'Desarrollo +15%', ic: '🥗', sub: true },
  { id: 'coach', n: 'Entrenador personal', p: 0, w: 4, d: 'Entrenamiento +40%', ic: '🏋️', sub: true },
  { id: 'mente', n: 'Psicólogo deportivo', p: 0, w: 2, d: 'Ánimo estable y forma +', ic: '🧠', sub: true }
];
const SPONSORS = [
  { id: 'nitro', n: 'Botas Nitro', fame: 12, inc: 3 }, { id: 'zumo', n: 'Zumos Vita', fame: 22, inc: 6 }, { id: 'tec', n: 'TechPlay Móviles', fame: 35, inc: 12 },
  { id: 'cola', n: 'ColaMax', fame: 50, inc: 25 }, { id: 'auto', n: 'Motors Prestige', fame: 65, inc: 45 }, { id: 'relojes', n: 'Relojes Aurum', fame: 80, inc: 80 }, { id: 'global', n: 'Global Sports (embajador)', fame: 92, inc: 160 }
];
const LIFESTYLE = { 0: ['Profesional', 'Más recuperación y desarrollo, menos fama'], 1: ['Equilibrado', 'Sin extremos'], 2: ['Vida social', 'Más fama y ánimo, peor recuperación'] };

function newPlayerCareer(o) {
  newWorld('player');
  const ovr0 = R.int(50, 55), pot = o.diff === 'facil' ? R.int(84, 94) : o.diff === 'dificil' ? R.int(72, 84) : R.int(77, 90);
  const p = makePlayer({ name: o.name, nat: o.nat, pos: o.pos, ovr: ovr0, age: 17, pot, tid: null, contract: 3 });
  const st = STYLES[o.style];
  if (st) for (const k in st.b) p.attrs[k] = R.clamp(p.attrs[k] + st.b[k], 18, 90);
  p.ovr = calcOvr(p.attrs, p.pos);
  if (p.ovr > 58) { const d = p.ovr - 58; for (const k of ATTR) p.attrs[k] = Math.max(18, p.attrs[k] - d); p.ovr = calcOvr(p.attrs, p.pos); }
  p.pot = Math.max(pot, p.ovr + 8); refreshValue(p, true); p.wage = Math.max(1, p.wage);
  p.num = o.num || 0;
  G.pl[p.id] = p;
  G.career = defaultCareer(p.id);
  G.career.focus = p.pos === 'POR' ? 'def' : p.pos === 'DC' ? 'sho' : p.pos === 'DFC' ? 'def' : p.pos === 'MC' ? 'pas' : 'dri';
  const clubs = [G.teams[24]].concat(G.teams.filter(t => t.rep <= 52 && t.rep >= 41).sort(() => Math.random() - .5).slice(0, 2));
  return { p, clubs };
}
function defaultCareer(pid) {
  return { pid, coach: 55, mates: 60, fame: 3, wealth: 8, roleBias: 8, focus: 'def', intensity: 1, lifestyle: 1, trainPts: 0, sponsors: [], assets: [], caps: 0, ncGoals: 0, called: false, log: [], offers: [], awards: [], freeAgent: false, retired: false, wantsOut: false, seasons: [], nlog: [], titles: [], loanOwner: null };
}
function startAsHugo() {
  newWorld('player');
  const t = G.teams[24], p = squadOf(t).find(q => q.name === 'Hugo Gallego');
  G.career = defaultCareer(p.id); G.career.focus = 'def';
  G.utid = 24; p.contract = 3; p.wage = Math.max(p.wage, 1.5);
  startSeasonSchedule(); G.pbias = playerBias(); autoPick(t);
  inbox({ title: 'Bienvenido, Hugo', body: 'Eres el 14 de la EFB Jesús de la Ossa: central rápido y fuerte. Demuestra en cada partido por qué mereces jugar.', type: 'info' });
}
function startAt(tid) {
  const p = G.pl[G.career.pid], t = teamOf(tid);
  G.utid = tid; addToSquad(t, p); p.num = 0; assignNumbers(t);
  p.wage = Math.max(1.2, p.wage); p.contract = 3;
  G.pbias = playerBias();
  autoPick(t);
  startSeasonSchedule();
  inbox({ title: `Bienvenido a ${t.name}`, body: `Has firmado tu primer contrato profesional con ${t.name}. Trabaja duro: el míster confiará en ti si rindes.`, type: 'info' });
}
const mePlayer = () => G.pl[G.career.pid];
const meTeam = () => teamOf(G.utid);

function roleOf(p) {
  const t = teamOf(p.tid), grp = POS_GROUP[p.pos];
  const mates = squadOf(t).filter(q => POS_GROUP[q.pos] === grp && q.pos === p.pos).sort((a, b) => b.ovr - a.ovr);
  const rank = mates.findIndex(q => q.id === p.id);
  const starters = STARTERS[p.pos] || 1;
  const top = mates[0];
  if (rank === 0 && p.ovr >= strengthOf(t) + 3) return 'Estrella';
  if (rank < starters) return 'Titular';
  if (rank < starters + 1) return 'Rotación';
  if (p.age <= 20) return 'Promesa';
  return 'Suplente';
}

/* ===== Semana ===== */
function playerWeek(e, uf, ures) {
  const c = G.career, p = mePlayer(), t = teamOf(p.tid);
  if (!p) return;
  const hasStaff = id => c.assets.includes(id);
  // salario y gastos
  const sal = p.wage * .58;
  const spons = c.sponsors.reduce((s, id) => s + SPONSORS.find(x => x.id === id).inc, 0) * .6;
  const subs = SHOP.filter(i => i.sub && hasStaff(i.id)).reduce((s, i) => s + i.w, 0);
  c.wealth += sal + spons - subs - (c.lifestyle === 2 ? 4 : c.lifestyle === 1 ? 1 : 0);
  // entrenamiento
  const lf = c.lifestyle === 0 ? 1.15 : c.lifestyle === 2 ? .85 : 1;
  c.trainPts += [.5, 1, 1.8][c.intensity] * lf * (hasStaff('coach') ? 1.4 : 1) * (hasStaff('nutri') ? 1.15 : 1);
  if (hasStaff('fisio')) { p.fitness = Math.min(100, p.fitness + 4); if (p.inj && R.chance(.5)) p.inj.w--; }
  if (p.inj && p.inj.w <= 0) p.inj = null;
  if (c.lifestyle === 0) p.fitness = Math.min(100, p.fitness + 3);
  if (c.lifestyle === 2) { p.fitness = Math.max(30, p.fitness - 3); p.morale = Math.min(100, p.morale + 2); c.fame += .3; }
  if (hasStaff('mente')) { p.morale = Math.min(100, p.morale + 1.5); p.form = Math.min(95, p.form + .6); }
  // bienes
  c.assets.forEach(id => { const it = SHOP.find(x => x.id === id); if (it && !it.sub) { if (it.mo) p.morale = Math.min(100, p.morale + it.mo * .15); if (it.fame) c.fame += it.fame; } });
  // resultado de partido
  const played = e.t !== 'I' && uf;
  const res = ures;
  let row = null;
  if (res) row = res.rows.find(r => r.p.id === p.id);
  if (row) {
    const r = row.r;
    c.coach = R.clamp(c.coach + (r >= 7.5 ? 3 : r >= 6.8 ? 1.2 : r >= 6 ? -.3 : r >= 5.3 ? -1.5 : -3) + (row.g ? 1 : 0), 10, 100);
    c.mates = R.clamp(c.mates + (r >= 7 ? 1.2 : r < 5.5 ? -1 : .2) + (row.a ? .5 : 0), 10, 100);
    c.fame = R.clamp(c.fame + (r - 6.3) * .9 + row.g * 1.3 + row.a * .6 + (res.motm.p.id === p.id ? 2 : 0) + (teamOf(p.tid).rep - 55) / 100, 0, 100);
    G.fans = R.clamp(G.fans + (row.g * 1.2 + (r - 6.5) * .5), 5, 100);
    p.morale = R.clamp(p.morale + (r - 6.4) * 3, 20, 100);
    c.log.unshift({ s: G.season, w: G.week, h: res.home.short, a: res.away.short, hg: res.hg, ag: res.ag, r: row.r, g: row.g, a2: row.a, min: row.min, cup: uf.kind === 'C', mine: uf.h === G.utid });
    if (c.log.length > 30) c.log.pop();
  } else if (played && e.t !== 'I') {
    // no jugó
    const inSq = meTeam().xi.includes(p.id) || meTeam().bench.includes(p.id);
    c.coach = R.clamp(c.coach + (isAvail(p) ? -.3 : 0) + (p.ovr >= 60 ? .3 : 0), 10, 100);
    if (isAvail(p)) p.morale = R.clamp(p.morale - 3, 20, 100);
    c.log.unshift({ s: G.season, w: G.week, h: teamOf(uf.h).short, a: teamOf(uf.a).short, hg: ures ? ures.hg : 0, ag: ures ? ures.ag : 0, r: 0, g: 0, a2: 0, min: 0, cup: uf.kind === 'C', mine: uf.h === G.utid, dnp: true, why: p.inj ? 'Lesionado' : p.ban ? 'Sancionado' : inSq ? 'Banquillo' : 'No convocado' });
  }
  c.fame = Math.max(0, c.fame - .12);
  // rol / mensajes
  c.role = roleOf(p);
  c.roleBias = c.role === 'Promesa' ? 8 : c.role === 'Estrella' ? 3 : (p.age <= 20 ? 6 : 1);
  if (p.morale < 40 && !c.wantsOut && R.chance(.15)) { c.wantsOut = true; inbox({ title: 'Tu representante', body: 'Estás descontento con tu situación. Si quieres salir, puedes pedir el traspaso desde la pantalla de agente.', type: 'info' }); }
  if (c.wantsOut && p.morale > 70) c.wantsOut = false;
  // patrocinadores
  if (G.week % 6 === 3) { const av = SPONSORS.filter(s => s.fame <= c.fame && !c.sponsors.includes(s.id)); if (av.length) inbox({ title: 'Oferta de patrocinio', body: `${av[av.length - 1].n} quiere que seas su imagen. Mira la sección Patrocinio.`, type: 'info' }); }
  // selección
  c.called = false;
  if (e.t === 'I') c.called = isCalledUp(p);
  // convocatoria: lesión de larga duración
  if (p.inj && p.inj.w >= 6 && !p.injNotified) { inbox({ title: 'Lesión grave', body: `${p.inj.name}: baja de ${p.inj.w} semanas.`, type: 'info' }); p.injNotified = true; }
  if (!p.inj) p.injNotified = false;
}
function isCalledUp(p) {
  if (p.ovr < 64) return false;
  const rank = Object.values(G.pl).filter(q => q.nat === p.nat && q.pos === p.pos && q.id !== p.id && q.ovr > p.ovr).length;
  return rank < (p.pos === 'POR' ? 1 : (STARTERS[p.pos] || 1) + 1) && !p.inj;
}
const NAT_STR = { ES: 80, EN: 80, IT: 77, DE: 79, FR: 82, BR: 82, AR: 82, PT: 78, NL: 77, UY: 73, NG: 70, MA: 72, CO: 73, BE: 77, HR: 74, JP: 70 };
function makeNationalTeam(nat, withP, idBase) {
  const str = NAT_STR[nat] || 72;
  const t = makeTeam({ id: idBase, name: NATS[nat].n, short: nat, c1: '#1a4fb4', c2: '#ffffff', rep: 70, cap: 50, city: '', div: 0 });
  t.formation = '4-3-3'; t.userForm = true;
  const used = {};
  COMP.forEach(pos => {
    used[pos] = (used[pos] || 0) + 1;
    const starter = used[pos] <= (STARTERS[pos] || 1);
    const p = makePlayer({ pos, nat, ovr: Math.round(str + (starter ? 2 : -5) + R.gauss() * 2.5), age: R.int(21, 33), tid: null });
    p.tmp = true; p.tid = idBase; t.squad.push(p.id); G.pl[p.id] = p;
  });
  if (withP) { const worst = squadOf(t).filter(q => q.pos === withP.pos).sort((a, b) => a.ovr - b.ovr)[0]; if (worst) { t.squad = t.squad.filter(i => i !== worst.id); delete G.pl[worst.id]; } t.squad.push(withP.id); t.bias = true; }
  return t;
}
function cleanupTemp() { for (const id in G.pl) if (G.pl[id].tmp) delete G.pl[id]; }

/* ===== Ofertas ===== */
function roleAt(p, t) {
  const mates = squadOf(t).filter(q => q.pos === p.pos && q.id !== p.id).sort((a, b) => b.ovr - a.ovr);
  const top = mates[0], n = STARTERS[p.pos] || 1;
  const better = mates.filter(q => q.ovr > p.ovr).length;
  return better === 0 ? 'Estrella' : better < n ? 'Titular' : better < n + 1 ? 'Rotación' : 'Suplente';
}
function playerOffers() {
  const c = G.career; if (c.retired) return;
  const p = mePlayer(), me = meTeam();
  const pend = c.offers.filter(o => !o.done);
  c.offers.forEach(o => { if (!o.done && o.exp < G.week) o.done = 'expired'; });
  if (pend.length >= 3) return;
  const prob = .07 + c.fame / 500 + (c.wantsOut ? .25 : 0) + (p.age <= 21 && roleOf(p) === 'Suplente' ? .1 : 0);
  if (!R.chance(prob)) return;
  const cands = G.teams.filter(t => t.id !== G.utid && t.tbudget > p.value * .7 && !c.offers.some(o => !o.done && o.tid === t.id)).filter(t => {
    const best = squadOf(t).filter(q => q.pos === p.pos).sort((a, b) => b.ovr - a.ovr)[0];
    return (!best || best.ovr <= p.ovr + 5) && strengthOf(t) < p.ovr + 12;
  });
  if (!cands.length) return;
  const t = R.pick(cands);
  const fee = Math.round(Math.max(askPrice(p), p.value) * R.f(1, 1.15) * 100) / 100;
  const wage = Math.round(Math.max(p.wage * R.f(1.1, 1.5), wageFor(p) * (.8 + t.rep / 130)) * 10) / 10;
  const years = R.int(2, 5);
  c.offers.push({ id: G.offerId++, tid: t.id, fee, wage, years, role: roleAt(p, t), exp: G.week + 4, done: null });
  inbox({ title: 'Oferta de traspaso', body: `${t.name} quiere ficharte. Consulta con tu agente.`, type: 'info' });
}
function acceptOffer(o) {
  const p = mePlayer(), c = G.career;
  const fromT = meTeam(), to = teamOf(o.tid);
  transferPlayer(p, to.id, o.fee, o.years, o.wage);
  o.done = 'accepted'; c.offers.forEach(x => { if (!x.done) x.done = 'expired'; });
  c.freeAgent = false; c.wantsOut = false; c.coach = 55; c.mates = 55; p.morale = 85; c.moved = true;
  news(`${p.name} (${p.ovr}) ficha por ${to.name} procedente de ${fromT.name}${o.fee ? ' por ' + fmtM(o.fee) : ''}.`, 'transfer');
  autoPick(to);
}
function requestTransfer() { const c = G.career; c.wantsOut = true; c.coach = Math.max(10, c.coach - 8); mePlayer().morale -= 5; }
function renewMine(wage, years) {
  const p = mePlayer(), c = G.career;
  const need = Math.max(p.wage * 1.1, wageFor(p) * 1.05) * (c.coach < 40 ? 1.2 : 1);
  if (wage < need * .97) return { ok: false, need, msg: `El club ofrece menos de lo que pides: tu agente calcula que deberías aspirar a ${fmtK(need)}/sem.` };
  p.wage = wage; p.contract = years; return { ok: true, msg: 'Contrato renovado.' };
}
function loanOut(tid) {
  const p = mePlayer(), c = G.career, owner = p.tid;
  const keep = { owner, wage: p.wage, contract: p.contract };
  transferPlayer(p, tid, 0, 1, p.wage);
  p.loan = keep;
  p.contract = 1; c.coach = 60;
  news(`${p.name} se marcha cedido a ${teamOf(tid).name}.`, 'transfer');
}
function loanOptions() {
  const p = mePlayer();
  return G.teams.filter(t => t.id !== G.utid && t.rep < teamOf(G.utid).rep && strengthOf(t) < p.ovr + 6).sort((a, b) => b.rep - a.rep).slice(0, 4);
}

/* ===== Fin de temporada del jugador ===== */
function careerSeasonEnd(sum) {
  const c = G.career, p = mePlayer(), t = teamOf(p.tid);
  const s = p.st;
  c.seasons.push({ s: G.season, team: t.name, tid: t.id, div: t.div, ovr: p.ovr, app: s.app, g: s.gls, a: s.ast, r: s.rn ? s.rs / s.rn : 0, pos: sum.pos, rank: sum.myRank });
  if (sum.myRank && sum.myRank <= 5 && sum.ballon[0]) {
    if (sum.myRank === 1) { c.awards.push({ s: G.season, n: 'Balón de Oro 🏆' }); c.fame = Math.min(100, c.fame + 20); }
    else c.awards.push({ s: G.season, n: `Top ${sum.myRank} Balón de Oro` });
  }
  if (sum.scorers[0] && sum.scorers[0].id === p.id) c.awards.push({ s: G.season, n: 'Pichichi 👟' });
  if (sum.young && sum.young.id === p.id) c.awards.push({ s: G.season, n: 'Mejor jugador joven' });
  if (sum.champion === p.tid) { c.titles.push({ s: G.season, n: 'Campeón de Liga' }); p.trophies++; }
  if (sum.cup === p.tid) { c.titles.push({ s: G.season, n: 'Campeón de Copa' }); p.trophies++; }
  c.caps = c.caps || 0;
  // cesión: vuelve
  // contrato
  p.contract--;
  if (p.contract <= 0 && !p.loan) { c.freeAgent = true; genContractOffers(); }
  if (p.age >= 39) c.mustRetire = true;
}
function genContractOffers() {
  const c = G.career, p = mePlayer(), me = teamOf(p.tid);
  c.offers = c.offers.filter(o => false);
  const future = { ...p, age: p.age + 1 };
  const renew = { id: G.offerId++, tid: me.id, fee: 0, wage: Math.round(Math.max(p.wage * 1.15, wageFor(p) * 1.1) * 10) / 10, years: R.int(2, 4), role: roleAt(p, me), exp: 999, done: null, renew: true };
  c.offers.push(renew);
  const cands = G.teams.filter(t => t.id !== me.id).sort(() => Math.random() - .5);
  let n = 0;
  for (const t of cands) {
    if (n >= 3) break;
    const best = squadOf(t).filter(q => q.pos === p.pos).sort((a, b) => b.ovr - a.ovr)[0];
    if (best && best.ovr > p.ovr + 8) continue;
    c.offers.push({ id: G.offerId++, tid: t.id, fee: 0, wage: Math.round(Math.max(wageFor(p) * (.85 + t.rep / 110), p.wage) * 10) / 10, years: R.int(2, 5), role: roleAt(p, t), exp: 999, done: null });
    n++;
  }
}
function signFreeAgentOffer(o) {
  const c = G.career, p = mePlayer();
  if (o.renew) { p.wage = o.wage; p.contract = o.years; }
  else { c.moved = true; transferPlayer(p, o.tid, 0, o.years, o.wage); c.coach = 55; c.mates = 55; news(`${p.name} ficha libre por ${teamOf(o.tid).name}.`, 'transfer'); }
  c.freeAgent = false; c.offers = []; p.morale = 85;
}
function retireCareer() { G.career.retired = true; }
function careerSummary() {
  const c = G.career, p = mePlayer();
  const gls = c.seasons.reduce((s, x) => s + x.g, 0) + p.st.gls, app = c.seasons.reduce((s, x) => s + x.app, 0) + p.st.app;
  const ast = c.seasons.reduce((s, x) => s + x.a, 0) + p.st.ast;
  const peak = Math.max(p.ovr, ...c.seasons.map(x => x.ovr));
  const score = gls * 1.2 + ast * .6 + c.awards.length * 60 + c.titles.length * 30 + peak * 4 + c.caps * 1.5 + c.fame;
  const rank = score > 1800 ? 'Leyenda inmortal' : score > 1200 ? 'Leyenda del fútbol' : score > 800 ? 'Estrella mundial' : score > 450 ? 'Gran profesional' : 'Jugador de recuerdo';
  return { gls, app, ast, peak, score: Math.round(score), rank };
}
