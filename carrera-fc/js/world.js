'use strict';
/* ===== Mundo: temporada, calendario, fichajes, finanzas, progresión ===== */
const CUP_NAMES = ['Octavos de final', 'Cuartos de final', 'Semifinales', 'Final'];
const TRAIN_FOCUS = { equilibrado: [], fisico: ['pac', 'phy'], ataque: ['sho', 'dri'], defensa: ['def', 'phy'], tecnico: ['pas', 'dri'] };

function newWorld(mode) {
  PID = 1;
  G = {
    v: 1, mode, season: 2026, week: 0, cal: [], fix: { 1: [], 2: [] }, table: { 1: [], 2: [] }, cup: null, teams: CLUBS.map(makeTeam), pl: {}, utid: 0,
    news: [], inbox: [], results: [], hist: [], board: { conf: 60, target: 6, txt: '' }, fans: 60, mgr: { name: 'Mister' }, career: null, pbias: {},
    phase: 'play', fin: { last: null, season: { inc: 0, exp: 0 }, hist: [] }, offerId: 1, sacked: false
  };
  G.teams.forEach(t => {
    genSquad(t);
    t.tbudget = Math.round((3 + Math.pow(Math.max(0, t.rep - 38), 2) / 22) * R.f(.8, 1.25) * 10) / 10;
    t.cash = t.tbudget * 1.6 + 4;
    autoPick(t);
  });
  genFreeAgents(70);
  startSeasonSchedule();
  return G;
}

/* ===== Calendario ===== */
function roundRobin(ids) {
  const n = ids.length, arr = R.shuffle(ids), rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const rd = [];
    for (let i = 0; i < n / 2; i++) { const a = arr[i], b = arr[n - 1 - i]; rd.push((r + i) % 2 ? [a, b] : [b, a]); }
    rounds.push(rd); arr.splice(1, 0, arr.pop());
  }
  return rounds;
}
function startSeasonSchedule() {
  for (const div of [1, 2]) {
    const ids = G.teams.filter(t => t.div === div).map(t => t.id);
    const rr = roundRobin(ids);
    G.fix[div] = rr.concat(rr.map(r => r.map(([h, a]) => [a, h])));
    G.table[div] = ids.map(tid => ({ tid, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }));
  }
  const cal = []; let cr = 0;
  for (let r = 0; r < 22; r++) {
    cal.push({ t: 'L', r, lr: r });
    if ([4, 9, 14, 19].includes(r)) cal.push({ t: 'C', r: cr++, lr: r + 1 });
    if (r === 7 || r === 16) cal.push({ t: 'I', lr: r + 1 });
  }
  cal.forEach(e => { e.win = e.lr < 4 || (e.lr >= 11 && e.lr < 14); });
  G.cal = cal; G.week = 0; G.results = [];
  for (const p of Object.values(G.pl)) p.o0 = p.ovr;
  const d2 = R.shuffle(G.teams.filter(t => t.div === 2).map(t => t.id));
  let cupTeams = G.teams.filter(t => t.div === 1).map(t => t.id).concat(d2.slice(0, 4));
  if (!cupTeams.includes(G.utid)) cupTeams[cupTeams.length - 1] = G.utid;
  cupTeams = R.shuffle(cupTeams);
  G.cup = { pairs: pairUp(cupTeams), round: 0, alive: cupTeams, rounds: [[], [], [], []], winner: null };
  G.window = true;
  setupBoard();
}
const pairUp = ids => { const p = []; for (let i = 0; i < ids.length; i += 2) p.push([ids[i], ids[i + 1]]); return p; };
const evName = e => e.t === 'L' ? `Jornada ${e.r + 1}` : e.t === 'C' ? `Copa · ${CUP_NAMES[e.r]}` : 'Parón internacional';
const curEvent = () => G.cal[G.week];
function eventFixtures(e) {
  if (e.t === 'L') return [1, 2].flatMap(div => G.fix[div][e.r].map(([h, a]) => ({ h, a, div, kind: 'L' })));
  if (e.t === 'C') return G.cup.pairs.map(([h, a]) => ({ h, a, kind: 'C', final: e.r === 3 }));
  return [];
}
const userFixture = e => eventFixtures(e).find(f => f.h === G.utid || f.a === G.utid) || null;

function table(div) {
  return G.table[div].slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.tid - b.tid);
}
const tablePos = tid => { const t = teamOf(tid); return table(t.div).findIndex(r => r.tid === tid) + 1; };

function applyFixture(fx, res) {
  if (fx.kind === 'L') {
    const row = tid => G.table[fx.div].find(r => r.tid === tid);
    const H = row(fx.h), A = row(fx.a);
    H.p++; A.p++; H.gf += res.hg; H.ga += res.ag; A.gf += res.ag; A.ga += res.hg;
    if (res.hg > res.ag) { H.w++; A.l++; H.pts += 3; H.form.push('V'); A.form.push('D'); }
    else if (res.hg < res.ag) { A.w++; H.l++; A.pts += 3; H.form.push('D'); A.form.push('V'); }
    else { H.d++; A.d++; H.pts++; A.pts++; H.form.push('E'); A.form.push('E'); }
    H.form = H.form.slice(-5); A.form = A.form.slice(-5);
    G.results.push({ w: G.week, div: fx.div, h: fx.h, a: fx.a, hg: res.hg, ag: res.ag });
  } else {
    let w;
    if (res.hg === res.ag) { const [a, b] = shootout(teamOf(fx.h), teamOf(fx.a)); res.pens = [a, b]; w = a > b ? fx.h : fx.a; }
    else w = res.hg > res.ag ? fx.h : fx.a;
    res.winner = w;
    G.cup.rounds[G.cup.round].push({ h: fx.h, a: fx.a, hg: res.hg, ag: res.ag, pens: res.pens || null, w });
    G.results.push({ w: G.week, cup: true, h: fx.h, a: fx.a, hg: res.hg, ag: res.ag, pens: res.pens || null });
  }
}

function prepAI(t, opp) {
  const d = strengthOf(t) - strengthOf(opp);
  t.mentality = d < -5 ? 0 : d > 5 ? 2 : 1;
  t.press = R.int(40, 65); t.tempo = R.int(42, 62); t.line = R.int(40, 62);
  G.pbias = G.mode === 'player' ? G.pbias : {};
  autoPick(t);
}
function prepUserAuto(t) {
  if (G.mode === 'player') { G.pbias = playerBias(); autoPick(t); } else repairLineup(t);
}
function playerBias() {
  const c = G.career; if (!c) return {};
  const p = G.pl[c.pid], e = curEvent();
  let b = (c.coach - 60) * .1 + c.roleBias;
  const young = p.age <= 21 && c.role !== 'Titular' && c.role !== 'Estrella';
  if (young && (e && e.t === 'C' ? true : Math.random() < (p.age <= 19 ? (c.coach >= 45 ? .5 : .3) : .3))) b += 14;
  return { [c.pid]: b };
}

/* Simula un evento: userRes es el resultado jugado por el usuario (o null) */
function runEvent(userRes) {
  const e = curEvent(), fxs = eventFixtures(e);
  const uf = userFixture(e);
  G.lastHome = !!(uf && uf.h === G.utid);
  for (const fx of fxs) {
    let res;
    if (fx === uf && userRes) res = userRes;
    else {
      const H = teamOf(fx.h), A = teamOf(fx.a);
      if (H.id === G.utid) { prepUserAuto(H); prepAI(A, H); }
      else if (A.id === G.utid) { prepUserAuto(A); prepAI(H, A); }
      else { prepAI(H, A); prepAI(A, H); }
      res = simulate(H, A, { neutral: fx.final, userSide: -1 });
    }
    applyFixture(fx, res);
    if (fx === uf) G.lastUserRes = res;
  }
  if (e.t === 'C') {
    const rd = G.cup.rounds[G.cup.round];
    G.cup.alive = rd.map(m => m.w);
    if (G.cup.round < 3) { G.cup.pairs = pairUp(R.shuffle(G.cup.alive)); G.cup.round++; }
    else { G.cup.winner = G.cup.alive[0]; teamOf(G.cup.winner).titles++; news(`${teamOf(G.cup.winner).name} gana la Copa.`, 'cup'); }
  }
  endWeek(e, uf, userRes);
  return uf;
}

function endWeek(e, uf, ures) {
  const played = e.t !== 'I';
  for (const p of Object.values(G.pl)) {
    if (p.tid == null) { p.fitness = 100; if (p.inj) p.inj = null; continue; }
    const t = G.teams[p.tid]; if (!t) continue;
    const ph = t.fac.physio;
    const intense = G.career && p.id === G.career.pid ? G.career.intensity : 1;
    p.fitness = Math.min(100, p.fitness + (e.t === 'I' ? 20 : 12) + ph * 1.5 + (p.age < 24 ? 2 : 0) - (intense === 2 ? 5 : intense === 0 ? -3 : 0));
    if (p.inj) { p.inj.w -= 1 + (ph >= 4 && R.chance(.4) ? 1 : 0); if (p.inj.w <= 0) p.inj = null; }
    if (played && p.ban > 0) p.ban--;
    p.morale = R.clamp(p.morale + (65 - p.morale) * .08, 20, 100);
    if (!p.inj && R.chance(.0025 + (intense === 2 ? .004 : 0))) p.inj = { w: R.int(1, 4), name: 'Molestias en el entrenamiento' };
  }
  // moral y entrenador en el club del usuario
  if (uf && ures) onUserResult(uf, ures);
  if (G.mode === 'manager') weeklyFinance(e, uf);
  else playerWeek(e, uf, ures);
  G.week++;
  const nx = G.cal[G.week];
  const wasWin = G.window;
  G.window = nx ? nx.win : false;
  if (nx && !wasWin && G.window) { inbox({ title: 'Se abre el mercado', body: 'El mercado de fichajes está abierto. Es el momento de reforzar o vender.', type: 'info' }); }
  if (wasWin && !G.window) { inbox({ title: 'Cierra el mercado', body: 'El mercado de fichajes ha cerrado. Solo podrás fichar agentes libres.', type: 'info' }); fixAISquads(); }
  if (G.window) { aiTransfers(); if (G.mode === 'manager') genOffers(); else playerOffers(); }
  if (G.mode === 'manager' && G.week === 14) midSeason();
  if (G.mode === 'player' && G.week === 14) midSeason();
  if (nx == null) G.phase = 'seasonEnd';
  if (G.mode === 'manager' && !G.sacked && G.week > 8 && G.board.conf < 10) { G.sacked = true; }
  G.inbox = G.inbox.slice(0, 80);
}

function midSeason() { developAll(.5, false); }

function onUserResult(uf, res) {
  const home = uf.h === G.utid, gf = home ? res.hg : res.ag, ga = home ? res.ag : res.hg;
  const win = uf.kind === 'C' ? res.winner === G.utid : gf > ga;
  const opp = teamOf(home ? uf.a : uf.h), me = teamOf(G.utid);
  const exp = (me.rep - opp.rep);
  const delta = gf > ga ? (exp < -10 ? 2.8 : 1.4) : gf === ga ? (exp > 10 ? -1.2 : 0) : (exp > 10 ? -3.2 : -1.5);
  if (G.mode === 'manager') G.board.conf = R.clamp(G.board.conf + delta, 0, 100);
  G.fans = R.clamp(G.fans + delta * .8, 5, 100);
  squadOf(me).forEach(p => { p.morale = R.clamp(p.morale + (gf > ga ? 4 : gf < ga ? -4 : 0), 20, 100); });
  if (G.mode === 'manager') {
    me.xi.forEach(id => { const p = G.pl[id]; if (p) p.morale = R.clamp(p.morale + 1, 20, 100); });
    squadOf(me).filter(p => !me.xi.includes(p.id) && !me.bench.includes(p.id) && isAvail(p) && p.ovr > 62).forEach(p => { p.morale = R.clamp(p.morale - 2.5, 20, 100); });
  }
  const best = res.motm;
  if (best && G.mode === 'manager') news(`${best.p.name} fue el MVP del ${me.short}-${opp.short} (${best.r}).`, 'match');
}

/* ===== Noticias y buzón ===== */
function news(txt, type) { G.news.unshift({ s: G.season, w: G.week, txt, type: type || 'info' }); if (G.news.length > 80) G.news.length = 80; }
function inbox(m) { m.id = G.offerId++; m.w = G.week; m.s = G.season; m.read = false; G.inbox.unshift(m); return m; }

/* ===== Directiva ===== */
function setupBoard() {
  const t = teamOf(G.utid);
  const order = G.teams.filter(x => x.div === t.div).sort((a, b) => strengthOf(b) - strengthOf(a));
  const rank = order.findIndex(x => x.id === t.id) + 1;
  let target, txt;
  if (t.div === 1) { target = R.clamp(rank - 1, 1, 10); txt = target === 1 ? 'Ganar la liga' : target <= 4 ? `Terminar entre los ${target} primeros` : target <= 8 ? 'Terminar en la mitad alta de la tabla' : 'Evitar el descenso'; }
  else { target = R.clamp(rank - 1, 2, 8); txt = target <= 2 ? 'Ascender a Primera' : target <= 5 ? 'Pelear por el ascenso (top 6)' : 'Terminar en mitad de tabla'; if (target <= 2) target = 2; else if (target <= 5) target = 6; else target = 9; }
  G.board.target = target; G.board.txt = txt;
}

/* ===== Finanzas (modo manager) ===== */
function wageBill(t) { return squadOf(t).reduce((s, p) => s + p.wage, 0) / 1000; } // M€/semana
function upkeep(t) { return (t.fac.train + t.fac.academy + t.fac.stadium + t.fac.scout + t.fac.physio) * .018; }
function baseIncome(t) {
  const f = t.div === 1 ? 1 : .16;
  return { tv: Math.pow(t.rep / 100, 2.2) * 1.2 * f, spons: Math.pow(t.rep / 100, 2.2) * .55 * f * (.8 + G.fans / 250), merch: Math.pow(t.rep / 100, 2.2) * .3 * f * (G.fans / 70) };
}
function attendance(t) {
  const cap = (t.cap + (t.fac.stadium - 1) * 6) * 1000;
  const fill = R.clamp(.42 + t.rep / 230 + G.fans / 400 - (t.ticket - 35) / 160, .25, 1);
  return Math.round(cap * fill);
}
function weeklyFinance(e, uf) {
  const t = teamOf(G.utid), b = baseIncome(t);
  let gate = 0, att = 0;
  if (uf && G.lastHome) { att = attendance(t); gate = att * t.ticket / 1e6 * (uf.kind === 'C' ? .9 : 1); }
  const wages = wageBill(t), up = upkeep(t);
  const inc = b.tv + b.spons + b.merch + gate, exp = wages + up;
  t.cash += inc - exp;
  G.fin.last = { tv: b.tv, spons: b.spons, merch: b.merch, gate, att, wages, up, net: inc - exp };
  G.fin.season.inc += inc; G.fin.season.exp += exp;
  if (t.cash < 0) { G.board.conf = Math.max(0, G.board.conf - .8); }
}

/* ===== Progresión ===== */
const stoch = x => { const f = Math.floor(x); return f + (Math.random() < x - f ? 1 : 0); };
function develop(p, f, endSeason) {
  const a = p.age, gap = p.pot - p.ovr;
  let d;
  if (a <= 21) d = gap * R.f(.14, .26) + R.f(0, 1.2); else if (a <= 24) d = gap * R.f(.1, .22) + R.f(-.5, .9); else if (a <= 27) d = gap * R.f(0, .15) + R.f(-1, .6);
  else if (a <= 29) d = R.f(-1.6, .6); else if (a <= 32) d = R.f(-2.8, -.4); else d = R.f(-4.2, -1.2);
  const t = p.tid != null ? G.teams[p.tid] : null;
  if (t && t.fac) d += (t.fac.train - 1) * .22 * (a <= 27 ? 1 : .3);
  d *= f;
  if (d > 0 && gap >= 0) d = Math.min(d, gap + .6);
  const tf = t ? TRAIN_FOCUS[t.trainFocus] || [] : [];
  const isMe = G.career && G.career.pid === p.id;
  for (const k of ATTR) {
    let dk = d + R.gauss() * .8 * f;
    if (d < 0 && a >= 29 && (k === 'pac' || k === 'phy')) dk *= 1.5;
    if (p.pos !== 'POR' && tf.includes(k) && (G.mode === 'manager' || !isMe)) dk += .5 * f * (t && t.fac ? .7 + t.fac.train * .12 : 1);
    if (p.focus === k) dk += 1.1 * f;
    if (isMe && G.career.focus === k) dk += (G.career.trainPts / 11) * (a <= 26 ? 1 : .5);
    p.attrs[k] = R.clamp(p.attrs[k] + stoch(dk) - (dk < 0 && Math.random() < .3 ? 0 : 0), 18, 97);
  }
  p.ovr = calcOvr(p.attrs, p.pos);
  if (p.ovr > p.pot) p.pot = p.ovr;
  if (endSeason) { if (a <= 24) p.pot = Math.max(p.ovr, Math.min(96, p.pot + R.int(-1, 1))); else if (a >= 25) p.pot = Math.max(p.ovr, a >= 27 ? p.ovr : p.pot); }
  refreshValue(p, false);
}
function developAll(f, endSeason) {
  for (const p of Object.values(G.pl)) develop(p, f, endSeason);
  if (G.career) G.career.trainPts = 0;
}

/* ===== Mercado ===== */
function askPrice(p) {
  if (p.tid == null) return 0;
  const t = G.teams[p.tid];
  const rank = squadOf(t).filter(q => POS_GROUP[q.pos] === POS_GROUP[p.pos]).sort((a, b) => b.ovr - a.ovr).findIndex(q => q.id === p.id);
  let m = 1.15 + (rank <= 1 ? .2 : 0) - (p.contract <= 1 ? .3 : 0) - (p.listed ? .15 : 0) - (p.age >= 31 ? .1 : 0) + (p.age <= 21 ? .15 : 0);
  return Math.round(p.value * Math.max(.5, m) * 100) / 100;
}
function marketOpen() { return G.window; }
function wageWanted(p, buyer) {
  let m = 1.1;
  const selRep = p.tid != null ? teamOf(p.tid).rep + (teamOf(p.tid).div === 1 ? 6 : 0) : 55;
  const byRep = buyer.rep + (buyer.div === 1 ? 6 : 0);
  if (byRep < selRep - 8) m += .35 + (selRep - 8 - byRep) * .02;
  const best = squadOf(buyer).filter(q => q.pos === p.pos).sort((a, b) => b.ovr - a.ovr)[0];
  if (best && best.ovr > p.ovr + 3 && p.age > 21) m += .25;
  if (p.morale < 45) m -= .05;
  return Math.max(p.wage * m, wageFor(p) * .9);
}
function negotiate(p, buyer, fee, wage, years) {
  if (p.tid != null) {
    if (!G.window && buyer.id === G.utid) return { st: 'closed', msg: 'El mercado está cerrado.' };
    const ask = askPrice(p), seller = teamOf(p.tid);
    if (fee < ask * .78) return { st: 'club_no', ask, msg: `${seller.name} rechaza la oferta: está muy lejos de lo que piden.` };
    if (fee < ask) return { st: 'club_counter', ask, msg: `${seller.name} contraofrece: piden ${fmtM(ask)}.` };
    if (squadOf(seller).length <= 19) return { st: 'club_no', ask, msg: `${seller.name} no puede vender: se quedaría sin plantilla.` };
  }
  if (buyer.tbudget < fee - 1e-6) return { st: 'budget', msg: 'No tienes presupuesto de fichajes suficiente.' };
  const need = wageWanted(p, buyer);
  if (wage < need * .97) return { st: 'player_no', need, msg: `${p.name} pide un salario mayor (≈ ${fmtK(need)}/sem).` };
  if (squadOf(buyer).length >= 32) return { st: 'full', msg: 'Tu plantilla está llena (máximo 32).' };
  return { st: 'ok', msg: `¡Acuerdo! ${p.name} firma por ${years} temporada(s).` };
}
function signPlayer(p, buyer, fee, wage, years) {
  const from = p.tid != null ? teamOf(p.tid) : null;
  transferPlayer(p, buyer.id, fee, years, wage);
  if (G.mode === 'manager' && buyer.id === G.utid) G.board.conf = R.clamp(G.board.conf + (fee > 20 ? 1.5 : .3), 0, 100);
  if (fee >= 5 || p.ovr >= 80) news(`${p.name} (${p.ovr}) ficha por ${buyer.name}${from ? ' desde ' + from.name : ' como agente libre'}${fee ? ' por ' + fmtM(fee) : ''}.`, 'transfer');
  p.morale = 80;
}
function sellPlayer(p, buyerTid, fee) {
  transferPlayer(p, buyerTid, fee, R.int(2, 4), p.wage * 1.1);
  news(`${p.name} deja el club rumbo a ${teamOf(buyerTid).name} por ${fmtM(fee)}.`, 'transfer');
}
function releasePlayer(p) {
  const comp = Math.max(0, p.wage * 52 * p.contract / 1000 * .5);
  const t = teamOf(p.tid);
  if (t.id === G.utid) t.cash -= comp;
  removeFromTeam(p); p.contract = 0;
  return comp;
}
function renewalWage(p) { return Math.max(p.wage * 1.05, wageFor(p) * 1.05); }
function renewPlayer(p, wage, years) {
  const need = renewalWage(p) * (p.morale < 50 ? 1.2 : 1) * (p.age >= 33 ? .85 : 1);
  if (wage < need * .97) return { ok: false, need, msg: `${p.name} pide ${fmtK(need)}/sem para renovar.` };
  p.wage = wage; p.contract = years; p.morale = Math.min(100, p.morale + 8);
  return { ok: true, msg: `${p.name} renueva por ${years} temporada(s).` };
}

function aiTransfers() {
  let n = 0;
  const teams = R.shuffle(G.teams.filter(t => t.id !== G.utid));
  for (const buyer of teams) {
    if (n >= 4) break;
    if (!R.chance(.35)) continue;
    const sq = squadOf(buyer);
    if (sq.length >= 29) continue;
    const pos = R.pick(POS_LIST), avg = strengthOf(buyer);
    const cands = Object.values(G.pl).filter(p => p.pos === pos && p.tid !== buyer.id && p.tid !== G.utid && p.age <= 33 && p.ovr >= avg - 3 && p.ovr <= avg + 7 && p.value <= buyer.tbudget * .9 && !p.youth && !(G.career && p.id === G.career.pid) && (p.tid == null || squadOf(teamOf(p.tid)).length > 21));
    if (!cands.length) continue;
    const p = R.pick(cands);
    const best = sq.filter(q => q.pos === pos).sort((a, b) => b.ovr - a.ovr)[0];
    if (best && best.ovr >= p.ovr + 2) continue;
    const fee = p.tid == null ? 0 : Math.round(askPrice(p) * 100) / 100;
    const from = p.tid != null ? teamOf(p.tid) : null;
    transferPlayer(p, buyer.id, fee, R.int(2, 4), wageFor(p));
    if (sq.length > 26) { const w = sq.filter(q => q.id !== p.id).sort((a, b) => a.ovr - b.ovr)[0]; if (w) { removeFromTeam(w); w.contract = 0; } }
    if (fee >= 8) news(`${p.name} (${p.ovr}) ficha por ${buyer.name} desde ${from.name} por ${fmtM(fee)}.`, 'transfer');
    n++;
  }
}
function fixAISquads() {
  for (const t of G.teams) {
    if (t.id === G.utid && G.mode === 'manager') continue;
    fillSquad(t);
  }
}
function fillSquad(t) {
  let sq = squadOf(t);
  const need = {}; COMP.forEach(p => need[p] = (need[p] || 0) + 1);
  const base = 44 + t.rep * .38;
  let guard = 0;
  while ((sq.length < 24 || sq.filter(p => p.pos === 'POR').length < 2) && guard++ < 30) {
    let pos = 'POR', bd = -9;
    for (const ps of POS_LIST) { const d = need[ps] - sq.filter(p => p.pos === ps).length + (ps === 'POR' ? .5 : 0); if (d > bd) { bd = d; pos = ps; } }
    const fa = Object.values(G.pl).filter(p => p.tid == null && !p.tmp && p.pos === pos && p.age <= 33).sort((a, b) => b.ovr - a.ovr)[0];
    if (fa && fa.ovr >= base - 8) transferPlayer(fa, t.id, 0, R.int(1, 3), wageFor(fa));
    else { const p = makePlayer({ pos, ovr: Math.round(base - 6 + R.gauss() * 3), age: R.int(18, 25), tid: t.id }); addToSquad(t, p); }
    sq = squadOf(t);
  }
  while (sq.length > 29) { const w = sq.sort((a, b) => a.ovr - b.ovr)[0]; removeFromTeam(w); w.contract = 0; sq = squadOf(t); }
  assignNumbers(t);
}

/* ofertas por jugadores del usuario (manager) */
function genOffers() {
  const me = teamOf(G.utid);
  const sq = squadOf(me).filter(p => p.value > .3);
  for (const p of sq) {
    if (!R.chance(p.listed ? .22 : .035 + (p.ovr > 75 ? .03 : 0))) continue;
    if (G.inbox.some(m => m.type === 'offer' && m.data && m.data.pid === p.id && !m.done)) continue;
    const buyers = G.teams.filter(t => t.id !== G.utid && t.tbudget >= p.value * .8 && strengthOf(t) < p.ovr + 9 && t.rep >= me.rep - 15);
    if (!buyers.length) continue;
    const b = R.pick(buyers);
    const fee = Math.round(p.value * R.f(.85, 1.4) * 100) / 100;
    inbox({ title: `Oferta por ${p.name}`, body: `${b.name} ofrece ${fmtM(fee)} por ${p.name} (${p.ovr}).`, type: 'offer', data: { pid: p.id, tid: b.id, fee, exp: G.week + 3 } });
  }
  G.inbox.forEach(m => { if (m.type === 'offer' && !m.done && m.data.exp < G.week) m.done = 'expired'; });
}

/* ===== Cantera y ojeadores ===== */
function genYouth(t, n) {
  const lv = t.fac.academy;
  const out = [];
  for (let i = 0; i < n; i++) {
    const pos = R.pick(POS_LIST), age = R.int(15, 17);
    const ovr = Math.round(R.f(36, 48) + lv * 1.6 + age - 15);
    let pot = R.int(58, 78) + lv * 2;
    if (R.chance(.07 + lv * .035)) pot += R.int(8, 16);
    const p = makePlayer({ pos, ovr, age, pot: Math.min(96, pot), tid: null, youth: true, contract: 3 });
    p.tid = t.id; t.youth.push(p.id); G.pl[p.id] = p; p.wage = .5;
    out.push(p);
  }
  return out;
}
function promoteYouth(p) {
  const t = teamOf(p.tid);
  if (squadOf(t).length >= 32) return false;
  t.youth = t.youth.filter(i => i !== p.id); t.squad.push(p.id); p.youth = false; p.wage = Math.max(.8, wageFor(p) * .8); p.contract = 4; p.num = 0; assignNumbers(t);
  return true;
}
function shownPot(p) {
  if (p.tid === G.utid || p.scouted) return p.pot;
  const lv = teamOf(G.utid).fac.scout;
  const err = ((p.id * 7919) % 9 - 4) * (6 - lv) / 5;
  return R.clamp(Math.round(p.pot + err), p.ovr, 99);
}
function scoutMission(o) {
  const t = teamOf(G.utid), cost = .12 + t.fac.scout * .03;
  if (t.cash < cost) return { err: 'No hay dinero para la misión.' };
  t.cash -= cost;
  let pool = Object.values(G.pl).filter(p => p.tid !== G.utid && !p.youth && p.tid !== null ? true : p.tid === null);
  pool = pool.filter(p => p.tid !== G.utid && (!o.group && o.group !== 0 || POS_GROUP[p.pos] === o.group) && p.age <= o.maxAge && (!o.nat || p.nat === o.nat) && p.pot >= o.minPot);
  const found = R.shuffle(pool).sort((a, b) => b.pot - a.pot + R.int(-4, 4)).slice(0, 5 + t.fac.scout);
  found.forEach(p => p.scouted = true);
  return { found, cost };
}

/* ===== Fin de temporada ===== */
function seasonSummary() {
  const t1 = table(1), t2 = table(2), me = teamOf(G.utid);
  const pos = tablePos(G.utid);
  const all = Object.values(G.pl).filter(p => p.tid != null && p.st.app >= 8);
  const posOf = {}; [t1, t2].forEach(tb => tb.forEach((r, i) => posOf[r.tid] = i + 1));
  const score = p => {
    const av = p.st.rs / Math.max(1, p.st.rn), t = teamOf(p.tid);
    const gk = p.pos === 'POR' ? p.st.cs * .9 : 0;
    const bonus = t.div === 1 ? (13 - (posOf[t.id] || 12)) * .9 : 0;
    return av * 9 + p.st.gls * (p.pos === 'DC' ? 1.2 : 1.7) + p.st.ast * 1.0 + gk + bonus + (t.div === 1 ? 4 : 0) + Math.max(0, p.ovr - 70) * .4;
  };
  const ranking = all.map(p => ({ p, s: score(p) })).sort((a, b) => b.s - a.s);
  const scorers = Object.values(G.pl).filter(p => p.tid != null).sort((a, b) => b.st.gls - a.st.gls).slice(0, 5);
  const myRank = G.career ? ranking.findIndex(r => r.p.id === G.career.pid) + 1 : 0;
  const young = all.filter(p => p.age <= 21).sort((a, b) => b.st.rs / b.st.rn - a.st.rs / a.st.rn)[0];
  return {
    season: G.season, champion: t1[0].tid, promoted: [t2[0].tid, t2[1].tid], relegated: [t1[10].tid, t1[11].tid], pos, div: me.div,
    cup: G.cup.winner, myRank, ballon: ranking.slice(0, 5), scorers, young, t1: t1.map(r => ({ ...r })), t2: t2.map(r => ({ ...r }))
  };
}
function userRankInBallon(pid) { return null; }

function finishSeason() {
  const sum = seasonSummary();
  G.lastSummary = sum;
  const me = teamOf(G.utid);
  // directiva
  if (G.mode === 'manager') {
    const pos = sum.pos, tg = G.board.target;
    const d = pos <= tg ? 8 + (tg - pos) * 1.5 : -(pos - tg) * 4.5;
    G.board.conf = R.clamp(G.board.conf + d, 0, 100);
    if (me.cash < 0) G.board.conf = Math.max(0, G.board.conf - 8);
    sum.boardDelta = d; sum.targetMet = pos <= tg;
    sum.fin = { inc: G.fin.season.inc, exp: G.fin.season.exp };
    if (G.board.conf < 12) G.sacked = true;
  }
  // trofeos
  teamOf(sum.champion).titles++;
  if (G.mode === 'player' && G.career) careerSeasonEnd(sum);
  // archivar estadísticas
  for (const p of Object.values(G.pl)) {
    if (p.st.app > 0 || p.tid === G.utid) p.hist.push({ s: G.season, tid: p.tid, ovr: p.ovr, ...p.st });
    if (p.hist.length > 20) p.hist.shift();
  }
  G.hist.push({ s: G.season, champ: sum.champion, cup: sum.cup, pos: sum.pos, div: sum.div, team: G.utid, ballon: sum.ballon[0] ? sum.ballon[0].p.name : '' });
  // desarrollo
  developAll(.5, true);
  for (const p of Object.values(G.pl)) p.age++;
  return sum;
}

function startNewSeason() {
  const sum = G.lastSummary;
  const profit = Math.max(0, G.fin.season.inc - G.fin.season.exp);
  G.season++;
  // ascensos/descensos
  sum.promoted.forEach(id => teamOf(id).div = 1); sum.relegated.forEach(id => teamOf(id).div = 2);
  G.hist[G.hist.length - 1].div = sum.div;
  // cesiones vuelven
  for (const p of Object.values(G.pl)) if (p.loan && p.tid != null) { const owner = G.teams[p.loan.owner]; const w = p.wage; if (owner) { removeFromTeam(p); addToSquad(owner, p); p.wage = p.loan.wage || w; p.contract = Math.max(1, (p.loan.contract || 2) - 1); p.num = 0; assignNumbers(owner); } p.loan = null; }
  if (G.career) G.utid = G.pl[G.career.pid].tid != null ? G.pl[G.career.pid].tid : G.utid;
  // contratos, retiradas
  const toFree = [];
  for (const p of Object.values(G.pl)) {
    if (G.career && p.id === G.career.pid) continue;
    if (p.tid == null) { if (p.age >= 35 || p.ovr < 42 || R.chance(.25)) { delete G.pl[p.id]; } else p.contract = 0; continue; }
    if (p.youth) { if (p.age >= 19 && p.tid !== G.utid) { delete G.pl[p.id]; teamOf(p.tid).youth = teamOf(p.tid).youth.filter(i => i !== p.id); } else if (p.age >= 19) { p.releaseWarn = true; } continue; }
    const retire = p.age >= 36 && R.chance((p.age - 35) * .22) || p.age >= 41;
    if (retire) { if (p.tid === G.utid) news(`${p.name} (${p.age}) anuncia su retirada.`, 'info'); removeFromTeam(p); delete G.pl[p.id]; continue; }
    p.contract--;
    if (p.contract <= 0) {
      const t = teamOf(p.tid);
      if (p.tid === G.utid && G.mode === 'manager') { toFree.push(p); }
      else if (p.tid === G.utid && G.mode === 'player') { /* gestionado en careerSeasonEnd */ }
      else if (R.chance(.7) && p.ovr >= strengthOf(t) - 6) { p.contract = R.int(2, 4); p.wage = wageFor(p); }
      else { removeFromTeam(p); }
    }
  }
  if (G.mode === 'manager') { const me = teamOf(G.utid); toFree.forEach(p => { removeFromTeam(p); inbox({ title: 'Fin de contrato', body: `${p.name} ha dejado el club al terminar su contrato.`, type: 'info' }); }); }
  // juveniles que superan edad sin promocionar en el usuario
  if (G.mode === 'manager') { const me = teamOf(G.utid); youthOf(me).filter(p => p.age >= 19).forEach(p => { me.youth = me.youth.filter(i => i !== p.id); delete G.pl[p.id]; }); }
  // reset
  for (const p of Object.values(G.pl)) {
    p.st = newStats(); p.fitness = 100; p.morale = 70; p.form = 50; p.ban = 0;
    if (p.inj) { p.inj.w -= 6; if (p.inj.w <= 0) p.inj = null; }
    refreshValue(p, false);
  }
  // equipos
  for (const t of G.teams) {
    t.tbudget = Math.round((3 + Math.pow(Math.max(0, t.rep - 38), 2) / 22 * (t.div === 1 ? 1 : .6)) * R.f(.8, 1.3) * 10) / 10 + (t.id === G.utid && G.mode === 'manager' ? profit * .4 : 0);
    t.rep = R.clamp(t.rep + (sum.promoted.includes(t.id) ? 3 : sum.relegated.includes(t.id) ? -3 : 0) + (sum.champion === t.id ? 2 : 0), 30, 97);
    if (t.id !== G.utid || G.mode === 'player') fillSquad(t);
    assignNumbers(t);
    if (t.id !== G.utid || G.mode === 'player') autoPick(t);
  }
  const me = teamOf(G.utid);
  if (G.mode === 'manager') { genYouth(me, 2 + me.fac.academy + R.int(0, 1)); me.cash += 0; }
  genFreeAgents(30);
  fixAISquads();
  G.fin.season = { inc: 0, exp: 0 };
  G.lastSummary = null; G.phase = 'play';
  startSeasonSchedule();
  if (G.mode === 'manager') repairLineup(me);
  news(`Comienza la temporada ${G.season}/${String(G.season + 1).slice(2)}.`, 'info');
  inbox({ title: 'Nueva temporada', body: `Objetivo de la directiva: ${G.board.txt}.`, type: 'info' });
}

/* ===== Guardado ===== */
function saveGame(slot) {
  try { localStorage.setItem('carrerafc_' + slot, JSON.stringify(G)); return true; } catch (e) { return false; }
}
function loadGame(slot) {
  try {
    const s = localStorage.getItem('carrerafc_' + slot); if (!s) return false;
    G = JSON.parse(s);
    PID = Math.max(...Object.values(G.pl).map(p => p.id)) + 1;
    return true;
  } catch (e) { return false; }
}
function saveInfo(slot) {
  try { const s = localStorage.getItem('carrerafc_' + slot); if (!s) return null; const g = JSON.parse(s); const t = g.teams[g.utid]; return { mode: g.mode, season: g.season, team: t.name, name: g.mode === 'player' ? g.pl[g.career.pid].name : g.mgr.name }; } catch (e) { return null; }
}
