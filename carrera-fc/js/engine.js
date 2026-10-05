'use strict';
/* ===== Motor: jugadores, equipos, alineaciones ===== */
let G = null;
let PID = 1;

const calcOvr = (a, pos) => { const w = WEIGHTS[pos]; let s = 0; for (const k of ATTR) s += a[k] * w[k]; return Math.round(s); };

function genPot(ovr, age, boost) {
  boost = boost || 0;
  let g;
  if (age <= 18) g = R.int(6, 22); else if (age <= 20) g = R.int(4, 16); else if (age <= 22) g = R.int(2, 10);
  else if (age <= 24) g = R.int(0, 6); else if (age <= 27) g = R.int(0, 2); else g = 0;
  if (g > 0) g += boost;
  return R.clamp(ovr + g, ovr, 95);
}

function makePlayer(o) {
  const w = WEIGHTS[o.pos], attrs = {};
  for (const k of ATTR) attrs[k] = R.clamp(Math.round(o.ovr + (w[k] - 1 / 6) * 70 + R.gauss() * 3.5), 18, 97);
  const d = o.ovr - calcOvr(attrs, o.pos);
  if (d) for (const k of ATTR) attrs[k] = R.clamp(attrs[k] + d, 18, 97);
  const nat = o.nat || pickNat();
  const p = {
    id: PID++, name: o.name || randName(nat), nat, age: o.age, pos: o.pos, attrs, ovr: calcOvr(attrs, o.pos), pot: 0,
    tid: o.tid == null ? null : o.tid, fitness: 100, morale: 70, form: 50, inj: null, ban: 0, num: 0,
    st: newStats(), hist: [], contract: o.contract || R.int(1, 5), wage: 0, value: 0, youth: !!o.youth,
    focus: null, scouted: false, goalsC: 0, appC: 0, trophies: 0, listed: false, loan: null
  };
  p.pot = o.pot != null ? Math.max(o.pot, p.ovr) : genPot(p.ovr, p.age, o.potBoost);
  refreshValue(p, true);
  return p;
}
const newStats = () => ({ app: 0, gls: 0, ast: 0, rs: 0, rn: 0, yc: 0, rc: 0, min: 0, cs: 0 });

function playerValue(p) {
  const a = p.age;
  let v = .25 * Math.pow(1.24, p.ovr - 60);
  v *= a <= 20 ? 1.45 : a <= 23 ? 1.25 : a <= 27 ? 1 : a === 28 ? .92 : a === 29 ? .8 : a === 30 ? .65 : a === 31 ? .5 : a === 32 ? .38 : .25;
  if (a <= 24) v *= 1 + Math.max(0, p.pot - p.ovr) * .05;
  return Math.max(.02, v);
}
function wageFor(p) { return Math.max(.6, 1.5 + 5.5 * Math.pow(playerValue(p), .95) * R.f(.85, 1.2)); }
function refreshValue(p, setWage) {
  p.value = playerValue(p);
  if (setWage) p.wage = wageFor(p);
}
const avgAttr = p => Math.round(ATTR.reduce((s, k) => s + p.attrs[k], 0) / 6);

const COMP = ['POR', 'POR', 'POR', 'DFC', 'DFC', 'DFC', 'DFC', 'DFC', 'LI', 'LI', 'LD', 'LD', 'MCD', 'MCD', 'MC', 'MC', 'MCO', 'MCO', 'EI', 'EI', 'ED', 'ED', 'DC', 'DC', 'DC'];
const STARTERS = { POR: 1, DFC: 2, LI: 1, LD: 1, MCD: 1, MC: 2, MCO: 1, EI: 1, ED: 1, DC: 2 };

function makeTeam(c) {
  const t = Object.assign({}, c, {
    squad: [], youth: [], formation: '4-3-3', mentality: 1, press: 50, tempo: 50, line: 50, xi: [], bench: [],
    cash: 0, tbudget: 0, ticket: Math.round(18 + c.rep * .55), trainFocus: 'equilibrado',
    fac: { train: 1 + Math.floor((c.rep - 40) / 25), academy: 1 + Math.floor((c.rep - 40) / 30), stadium: 1 + Math.floor((c.rep - 40) / 28), scout: 1 + Math.floor((c.rep - 40) / 35), physio: 1 + Math.floor((c.rep - 40) / 30) },
    titles: 0
  });
  for (const k in t.fac) t.fac[k] = R.clamp(t.fac[k], 1, 5);
  return t;
}

function genSquad(t) {
  const base = 44 + t.rep * .38;
  const used = {};
  COMP.forEach(pos => {
    used[pos] = (used[pos] || 0) + 1;
    const starter = used[pos] <= (STARTERS[pos] || 1);
    let ovr = base + (starter ? 3 : -4.5) + R.gauss() * 3 + (used[pos] > 2 ? -1.5 : 0);
    const age = R.clamp(Math.round(26 + R.gauss() * 4.6), 17, 37);
    const p = makePlayer({ pos, ovr: R.clamp(Math.round(ovr), 38, 94), age, tid: t.id });
    addToSquad(t, p);
  });
  if (t.rep >= 70) {
    const n = t.rep >= 85 ? 4 : 2;
    R.shuffle(squadOf(t).filter(p => p.pos !== 'POR' || R.chance(.3))).slice(0, n).forEach(p => boostPlayer(p, R.int(4, 8)));
  }
  assignNumbers(t);
}
function boostPlayer(p, d) {
  for (const k of ATTR) p.attrs[k] = R.clamp(p.attrs[k] + d, 18, 97);
  p.ovr = calcOvr(p.attrs, p.pos); p.pot = Math.max(p.pot, p.ovr); refreshValue(p, true);
}
function assignNumbers(t) {
  const taken = new Set(squadOf(t).filter(p => p.num).map(p => p.num));
  const pref = { POR: [1, 13, 25], DFC: [4, 5, 3, 15, 23], LI: [3, 12, 14], LD: [2, 16, 22], MCD: [6, 14, 18], MC: [8, 10, 16, 20], MCO: [10, 21, 11], EI: [11, 17, 19], ED: [7, 17, 21], DC: [9, 19, 24] };
  for (const p of squadOf(t)) {
    if (p.num && taken.has(p.num) && squadOf(t).filter(q => q.num === p.num).length === 1) continue;
    let n = (pref[p.pos] || []).find(x => !taken.has(x));
    if (!n) { n = 26; while (taken.has(n)) n++; }
    p.num = n; taken.add(n);
  }
}
const squadOf = t => t.squad.map(id => G.pl[id]);
const youthOf = t => t.youth.map(id => G.pl[id]);
const teamOf = id => G.teams[id];
function addToSquad(t, p) { p.tid = t.id; if (!t.squad.includes(p.id)) t.squad.push(p.id); G.pl[p.id] = p; }
function removeFromTeam(p) {
  if (p.tid == null) return;
  const t = G.teams[p.tid];
  t.squad = t.squad.filter(i => i !== p.id); t.youth = t.youth.filter(i => i !== p.id);
  t.xi = t.xi.map(i => i === p.id ? null : i); t.bench = t.bench.filter(i => i !== p.id);
  p.tid = null;
}
function transferPlayer(p, toTid, fee, years, wage) {
  const from = p.tid;
  removeFromTeam(p);
  p.listed = false; p.loan = null; p.youth = false;
  if (toTid != null) { addToSquad(G.teams[toTid], p); p.num = 0; assignNumbers(G.teams[toTid]); if (G.career && G.career.pid === p.id) G.utid = toTid; }
  if (years) p.contract = years;
  if (wage) p.wage = wage;
  if (fee) {
    if (from != null) { G.teams[from].tbudget += fee * .85; if (from === G.utid) G.teams[from].cash += fee; }
    if (toTid != null) { G.teams[toTid].tbudget -= fee; if (toTid === G.utid) G.teams[toTid].cash -= fee; }
  }
}

function genFreeAgents(n) {
  for (let i = 0; i < n; i++) {
    const pos = R.pick(POS_LIST), age = R.int(19, 35);
    const p = makePlayer({ pos, ovr: R.clamp(Math.round(R.f(48, 74)), 40, 78), age, tid: null });
    G.pl[p.id] = p;
  }
}

/* ===== Alineaciones ===== */
function effScore(p, slot, bias) {
  return p.ovr * posFit(slot, p.pos) * (.88 + .12 * p.fitness / 100) * (.95 + .05 * p.morale / 100) + (p.form - 50) * .03 + (bias || 0);
}
const isAvail = p => !p.inj && !p.ban;

function autoPick(t, keepForm) {
  if (!keepForm && !t.userForm) t.formation = bestFormation(t);
  const slots = FORM_SLOTS[t.formation];
  const av = squadOf(t).filter(isAvail);
  const bias = G.pbias || {};
  const pairs = [];
  slots.forEach((s, si) => av.forEach(p => pairs.push({ si, p, sc: effScore(p, s.pos, bias[p.id]) })));
  pairs.sort((a, b) => b.sc - a.sc);
  const xi = new Array(11).fill(null), usedP = new Set();
  for (const pr of pairs) { if (xi[pr.si] == null && !usedP.has(pr.p.id)) { xi[pr.si] = pr.p.id; usedP.add(pr.p.id); } }
  t.xi = xi;
  autoBench(t);
}
function autoBench(t) {
  const av = squadOf(t).filter(p => isAvail(p) && !t.xi.includes(p.id));
  const bench = [];
  const gk = av.filter(p => p.pos === 'POR').sort((a, b) => b.ovr - a.ovr)[0];
  if (gk) bench.push(gk.id);
  av.filter(p => p !== gk).sort((a, b) => b.ovr - a.ovr).slice(0, 7 - bench.length).forEach(p => bench.push(p.id));
  t.bench = bench;
}
function bestFormation(t) {
  if (t.id === G.utid && G.mode === 'manager') return t.formation;
  const av = squadOf(t).filter(isAvail);
  let best = t.formation, bs = -1;
  for (const f of ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-1-4-1', '5-3-2', '4-5-1', '3-4-3']) {
    let s = 0; const used = new Set();
    FORM_SLOTS[f].forEach(sl => {
      let b = null, bsc = -1;
      for (const p of av) if (!used.has(p.id)) { const sc = p.ovr * posFit(sl.pos, p.pos); if (sc > bsc) { bsc = sc; b = p; } }
      if (b) { used.add(b.id); s += bsc; }
    });
    if (s > bs) { bs = s; best = f; }
  }
  return best;
}
function repairLineup(t) {
  const slots = FORM_SLOTS[t.formation];
  const squad = new Set(t.squad);
  const ok = id => id != null && squad.has(id) && G.pl[id] && isAvail(G.pl[id]);
  if (t.xi.length !== 11) return autoPick(t, true);
  const used = new Set(t.xi.filter(ok));
  t.xi = t.xi.map(id => ok(id) ? id : null);
  t.xi.forEach((id, i) => {
    if (id != null) return;
    let best = null, bs = -1;
    for (const p of squadOf(t)) if (isAvail(p) && !used.has(p.id)) { const sc = effScore(p, slots[i].pos); if (sc > bs) { bs = sc; best = p; } }
    if (best) { t.xi[i] = best.id; used.add(best.id); }
  });
  t.bench = t.bench.filter(id => ok(id) && !t.xi.includes(id));
  if (t.bench.length < 5) autoBench(t);
}
const xiPlayers = t => t.xi.map(id => id == null ? null : G.pl[id]);
function teamOvr(t) {
  const xi = xiPlayers(t).filter(Boolean);
  if (!xi.length) return 50;
  const sl = FORM_SLOTS[t.formation];
  return Math.round(xi.reduce((s, p, i) => s + p.ovr * posFit(sl[t.xi.indexOf(p.id)] ? sl[t.xi.indexOf(p.id)].pos : p.pos, p.pos), 0) / xi.length);
}
function strengthOf(t) { // para IA/clasificaciones sin tocar la alineación del usuario
  const av = squadOf(t).filter(p => !p.inj).sort((a, b) => b.ovr - a.ovr).slice(0, 14);
  return av.reduce((s, p) => s + p.ovr, 0) / Math.max(1, av.length);
}

/* ===== Partido ===== */
const DEFW = { DFC: 1, LI: 1, LD: 1, MCD: .5, MC: .15 };
const MIDW = { MCD: .5, MC: 1, MCO: .7, EI: .25, ED: .25, LI: .2, LD: .2 };
const ATTW = { DC: 1, EI: .8, ED: .8, MCO: .6, MC: .15, LI: .15, LD: .15 };

class Match {
  constructor(home, away, o) {
    o = o || {};
    this.o = o; this.userPid = o.userPid || null; this.moments = !!o.moments; this.auto = !!o.auto;
    this.userSide = o.userSide == null ? -1 : o.userSide;
    this.mySide = o.mySide == null ? this.userSide : o.mySide;
    this.sides = [this.mkSide(home), this.mkSide(away)];
    this.neutral = !!o.neutral; this.cup = !!o.cup;
    this.idx = 0; this.min = 0; this.label = "0'"; this.events = []; this.finished = false; this.pending = null;
    this.atHT = false; this.htDone = false;
    const a1 = R.int(1, 3), a2 = R.int(2, 5);
    this.sched = [];
    for (let m = 1; m <= 45; m++) this.sched.push({ m, l: m + "'" });
    for (let i = 1; i <= a1; i++) this.sched.push({ m: 45, l: `45+${i}'` });
    for (let m = 46; m <= 90; m++) this.sched.push({ m, l: m + "'" });
    for (let i = 1; i <= a2; i++) this.sched.push({ m: 90, l: `90+${i}'` });
    this.htIdx = 45 + a1; this.endMin = 90 + a2;
    this.ball = { x: .5, y: .5, poss: 0, hot: 0 };
    this.flash = null;
    this.tick = [];
    this.recalc(0); this.recalc(1);
    this.emit('ko', -1, `¡Comienza el partido! ${home.name} vs ${away.name}.`);
  }
  mkSide(team) {
    const slots = FORM_SLOTS[team.formation];
    if (team.squad.length < 14) fillSquad(team);
    if (team.xi.length !== 11 || team.xi.some(id => id == null || !G.pl[id] || G.pl[id].tid !== team.id)) repairLineup(team);
    if (team.xi.some(id => id == null)) autoPick(team, true);
    const on = team.xi.map((id, i) => this.mkPr(G.pl[id], slots[i].pos, slots[i].x, slots[i].y));
    const bench = team.bench.map(id => ({ p: G.pl[id], used: false }));
    const side = {
      team, on, bench, out: [], subs: 0, goals: 0, st: { sh: 0, sot: 0, poss: 0, fouls: 0, corn: 0, yc: 0, rc: 0, pass: 0 },
      tac: { ment: team.mentality, press: team.press, tempo: team.tempo, line: team.line }, str: { att: 60, mid: 60, def: 60, gk: 60 }, wref: { att: 0, mid: 0, def: 0 }
    };
    on.forEach(pr => { side.wref.att += ATTW[pr.pos] || 0; side.wref.mid += MIDW[pr.pos] || 0; side.wref.def += DEFW[pr.pos] || 0; });
    return side;
  }
  mkPr(p, pos, x, y) { return { p, pos, x, y, stam: 100, g: 0, a: 0, sh: 0, sot: 0, yc: 0, sv: 0, r: 6, from: this.min || 0, to: null, red: false, inj: false, keyOK: 0, keyBad: 0 }; }
  effF(pr) { const p = pr.p; return (.82 + .18 * pr.stam / 100) * (.9 + .1 * p.fitness / 100) * (.95 + .05 * p.morale / 100) * (1 + (p.form - 50) / 1500) * posFit(pr.pos, p.pos); }
  eff(pr) { return pr.p.ovr * this.effF(pr); }
  recalc(si) {
    const S = this.sides[si];
    let a = 0, m = 0, d = 0, gk = 55;
    for (const pr of S.on) {
      const e = this.eff(pr);
      a += (ATTW[pr.pos] || 0) * e; m += (MIDW[pr.pos] || 0) * e; d += (DEFW[pr.pos] || 0) * e;
      if (pr.pos === 'POR') gk = e;
    }
    const mt = S.tac.ment - 1;
    S.str.att = (a / S.wref.att) * (1 + mt * .035 + (S.tac.line - 50) / 1800);
    S.str.mid = (m / S.wref.mid) * (1 + (S.tac.press - 50) / 900);
    S.str.def = (d / S.wref.def) * (1 - mt * .035 - (S.tac.line - 50) / 2400);
    S.str.gk = gk;
  }
  emit(type, si, text, extra) {
    const e = Object.assign({ type, si, text, l: this.label, m: this.min }, extra || {});
    this.events.push(e); this.tick.push(e); return e;
  }
  pickShooter(S, kind) {
    const w = { DC: 5, EI: 3, ED: 3, MCO: 3, MC: 1.5, MCD: .6, LI: .5, LD: .5, DFC: kind === 'corner' ? 2.4 : .4, POR: 0 };
    return R.wpick(S.on, pr => (w[pr.pos] || 0) * Math.pow(pr.p.attrs.sho / 70, 2) * (kind === 'long' ? 1.3 : 1) * (kind === 'fk' ? Math.pow(pr.p.attrs.pas / 70, 2) : 1));
  }
  pickAssister(S, shooter) {
    const w = { MCO: 4, EI: 3.5, ED: 3.5, MC: 3, LI: 2, LD: 2, DC: 1.5, MCD: 1.2, DFC: .4, POR: 0 };
    return R.wpick(S.on.filter(pr => pr !== shooter), pr => (w[pr.pos] || 0) * Math.pow(pr.p.attrs.pas / 70, 2));
  }
  userPr(S) { return this.userPid ? S.on.find(pr => pr.p.id === this.userPid) : null; }

  step() {
    if (this.finished || this.pending) return;
    this.tick = [];
    if (this.atHT) { this.atHT = false; }
    const s = this.sched[this.idx++];
    this.min = s.m; this.label = s.l;
    // fatiga
    for (let si = 0; si < 2; si++) {
      const S = this.sides[si];
      const drain = .30 + (S.tac.tempo - 50) / 350 + (S.tac.press - 50) / 400;
      for (const pr of S.on) pr.stam = Math.max(8, pr.stam - drain * (1.15 - pr.p.attrs.phy / 160));
      if (this.idx % 6 === 0) this.recalc(si);
    }
    const hb = this.neutral ? 1 : 1.02;
    const mh = this.sides[0].str.mid * hb, ma = this.sides[1].str.mid;
    const pH = Math.pow(mh, 2.4) / (Math.pow(mh, 2.4) + Math.pow(ma, 2.4));
    const si = R.chance(pH) ? 0 : 1;
    const A = this.sides[si], B = this.sides[1 - si];
    A.st.poss++; A.st.pass += R.int(4, 9);
    this.ball.poss = si; this.ball.hot = Math.max(0, this.ball.hot - 1);
    this.ball.x = R.clamp(.5 + (si ? -1 : 1) * R.f(-.05, .25), .12, .88); this.ball.y = R.f(.15, .85);
    const tempoM = .85 + .3 * A.tac.tempo / 100;
    if (R.chance(.55 * tempoM)) this.attack(si);
    if (!this.pending) this.randomEvents(si);
    if (!this.pending) this.aiSubs();
    if (!this.pending) this.afterTick();
    return this.tick;
  }
  afterTick() {
    if (this.idx === this.htIdx && !this.htDone) { this.htDone = true; this.atHT = true; this.emit('ht', -1, `Descanso: ${this.sides[0].team.short} ${this.sides[0].goals}-${this.sides[1].goals} ${this.sides[1].team.short}`); }
    if (this.idx >= this.sched.length) this.end();
  }
  resumeAfterPending() { if (!this.pending) { this.afterTick(); } }

  attack(si) {
    const A = this.sides[si], B = this.sides[1 - si];
    const q = Math.pow(A.str.att / B.str.def, 1.15);
    if (!R.chance(R.clamp(.48 * q, .14, .72))) {
      if (R.chance(.1)) { const pr = R.pick(A.on.filter(x => x.pos !== 'POR')); this.emit('txt', si, R.pick([`${pr.p.name} lo intenta pero ${B.team.short} cierra bien.`, `Buena jugada de ${A.team.short}, aunque ${pr.p.name} pierde el balón en el último pase.`, `${B.team.short} corta el avance con una gran anticipación.`])); }
      return;
    }
    this.ball.x = si ? .14 : .86; this.ball.hot = 2;
    const r = Math.random();
    const kind = r < .1 ? 'corner' : r < .16 ? 'fk' : r < .27 ? 'long' : r < .27 + (.12 + (A.tac.tempo - 50) / 400) ? 'counter' : 'open';
    const shooter = this.pickShooter(A, kind);
    const assister = (kind === 'open' || kind === 'counter' || kind === 'corner') && R.chance(.75) ? this.pickAssister(A, shooter) : null;
    const ctx = { si, kind, shooter, assister, mod: { gm: 1, ot: 0, blk: 0, force: false, cancel: false } };
    if (this.moments && !this.auto && this.userPid) {
      const ups = this.userPr(A);
      if (shooter.p.id === this.userPid && R.chance(.9)) { this.pending = { t: 'shoot', ctx }; return; }
      if (assister && assister.p.id === this.userPid && R.chance(.8)) { this.pending = { t: 'create', ctx }; return; }
      const dp = this.userPr(B);
      if (dp && ['POR', 'DFC', 'LI', 'LD', 'MCD'].includes(dp.pos) && R.chance(dp.pos === 'POR' ? .6 : .38)) { this.pending = { t: 'defend', ctx, pr: dp }; return; }
    }
    this.resolveShot(ctx);
  }
  gkEff(S) { const g = S.on.find(x => x.pos === 'POR'); return g ? Math.max(40, this.eff(g)) : 40; }
  resolveShot(ctx) {
    const { si, kind, shooter, assister, mod } = ctx;
    const A = this.sides[si], B = this.sides[1 - si];
    if (mod.cancel) return;
    const shq = (shooter.p.attrs.sho * .65 + shooter.p.ovr * .35) * this.effF(shooter);
    shooter.sh++; A.st.sh++;
    const nm = shooter.p.name;
    const blockP = R.clamp(.2 + (B.str.def - A.str.att) / 220 + mod.blk, .06, .38);
    if (!mod.force && R.chance(blockP)) { this.emit('shot', si, R.pick([`Disparo de ${nm} bloqueado por la defensa.`, `${nm} chuta y un defensa se lanza para taponar.`])); return; }
    const otP = R.clamp(.42 + (shq - 70) / 120 + mod.ot, .22, .7);
    if (!mod.force && !R.chance(otP)) { this.emit('shot', si, R.pick([`${nm} dispara... ¡fuera por poco!`, `${nm} lo intenta desde fuera del área y se va alto.`, `¡Al palo! ${nm} casi marca.`, `${nm} no encuentra puerta, el balón sale rozando el poste.`])); shooter.r -= .05; return; }
    shooter.sot++; A.st.sot++;
    const kindMod = { open: 1, counter: 1.12, corner: .8, fk: .6, long: .6 }[kind];
    const goalP = R.clamp(.275 * Math.pow(shq / this.gkEff(B), 1.3) * kindMod * mod.gm, .03, .75);
    if (R.chance(goalP)) return this.goal(si, shooter, assister, kind);
    const gk = B.on.find(x => x.pos === 'POR');
    if (gk) { gk.sv++; gk.r += .22; }
    shooter.r += .08;
    if (R.chance(.28)) { B.st.corn++; }
    this.emit('save', si, R.pick([`¡Paradón de ${gk ? gk.p.name : 'el portero'}! Le niega el gol a ${nm}.`, `${nm} dispara a puerta y ${gk ? gk.p.name : 'el portero'} responde con seguridad.`, `Gran intervención del guardameta ante el disparo de ${nm}.`]));
  }
  goal(si, shooter, assister, kind) {
    const A = this.sides[si], B = this.sides[1 - si];
    A.goals++; shooter.g++; shooter.r += shooter.g > 1 ? 1.25 : 1.0;
    if (assister) { assister.a++; assister.r += .6; }
    B.on.forEach(pr => { if (['POR', 'DFC', 'LI', 'LD'].includes(pr.pos)) pr.r -= .12; });
    const nm = shooter.p.name, as = assister ? ` Asistencia de ${assister.p.name}.` : '';
    const how = { open: [`¡GOOOL de ${A.team.name}! ${nm} define con calidad.`, `¡GOL! ${nm} bate al portero y hace estallar la grada.`], counter: [`¡GOL a la contra! ${nm} culmina una transición letal.`], corner: [`¡GOL de cabeza! ${nm} gana el salto en el córner.`], fk: [`¡GOLAZO de falta de ${nm}! Se mete por la escuadra.`], long: [`¡GOLAZO desde lejos de ${nm}! Misil imparable.`], pen: [`¡GOL de penalti! ${nm} no perdona desde los once metros.`] }[kind];
    this.emit('goal', si, R.pick(how) + as + ` (${this.sides[0].goals}-${this.sides[1].goals})`, { pid: shooter.p.id, aid: assister ? assister.p.id : null });
    this.flash = { si, t: 40 };
    this.recalc(0); this.recalc(1);
  }
  randomEvents(si) {
    // penalti
    if (R.chance(.0035)) return this.penalty(si);
    // tarjetas
    if (R.chance(.03)) {
      const vi = R.chance(.5) ? 0 : 1, S = this.sides[vi];
      const pr = R.wpick(S.on.filter(x => x.pos !== 'POR'), x => (100 - x.p.attrs.def * .4) * (x.pos === 'DFC' || x.pos === 'MCD' ? 1.4 : 1) * (x.yc ? .2 : 1));
      S.st.fouls++;
      if (R.chance(.035)) { this.sendOff(vi, pr, true); }
      else {
        pr.yc++; pr.r -= .25; S.st.yc++;
        if (pr.yc >= 2) { this.emit('yc', vi, `Segunda amarilla para ${pr.p.name}.`, { pid: pr.p.id }); this.sendOff(vi, pr, false); }
        else this.emit('yc', vi, `Tarjeta amarilla para ${pr.p.name} (${S.team.short}).`, { pid: pr.p.id });
      }
    }
    // lesión
    if (R.chance(.0012)) {
      const vi = R.chance(.5) ? 0 : 1, S = this.sides[vi];
      const pr = R.wpick(S.on, x => 130 - x.p.fitness + (100 - x.stam) * .5);
      this.injure(vi, pr);
    }
  }
  sendOff(vi, pr, direct) {
    const S = this.sides[vi];
    pr.red = true; pr.r -= 1.8; pr.to = this.min; S.st.rc++;
    S.on = S.on.filter(x => x !== pr); S.out.push(pr);
    this.emit('rc', vi, `¡TARJETA ROJA! ${pr.p.name} (${S.team.short}) es expulsado${direct ? ' por una entrada brutal' : ''}.`, { pid: pr.p.id });
    this.recalc(vi);
  }
  injure(vi, pr) {
    const S = this.sides[vi];
    const w = R.chance(.6) ? R.int(1, 3) : R.chance(.7) ? R.int(3, 8) : R.int(8, 24);
    const names = ['Esguince de tobillo', 'Sobrecarga muscular', 'Rotura fibrilar', 'Contusión', 'Lesión de rodilla', 'Rotura de ligamentos', 'Distensión'];
    pr.p.inj = { w, name: w > 12 ? 'Rotura de ligamentos' : R.pick(names.slice(0, 5)) }; pr.inj = true; pr.to = this.min;
    S.on = S.on.filter(x => x !== pr); S.out.push(pr);
    this.emit('inj', vi, `Lesión de ${pr.p.name}: ${pr.p.inj.name}. Tendrá que abandonar el campo.`, { pid: pr.p.id });
    const slot = { pos: pr.pos, x: pr.x, y: pr.y };
    this.recalc(vi);
    if (S.subs < 5 && S.bench.some(b => !b.used)) {
      if (this.auto || vi !== this.userSide) this.autoSubInto(vi, slot);
      else this.pending = { t: 'inj', si: vi, slot };
    }
  }
  autoSubInto(vi, slot) {
    const S = this.sides[vi];
    const cand = S.bench.filter(b => !b.used && isAvailBench(b.p)).sort((a, b) => b.p.ovr * posFit(slot.pos, b.p.pos) - a.p.ovr * posFit(slot.pos, a.p.pos))[0];
    if (cand) this.doSub(vi, slot, cand);
  }
  doSub(vi, slot, b, outPr) {
    const S = this.sides[vi];
    b.used = true; S.subs++;
    const pr = this.mkPr(b.p, slot.pos, slot.x, slot.y); pr.from = this.min; pr.stam = 100;
    S.on.push(pr);
    if (outPr) { outPr.to = this.min; S.on = S.on.filter(x => x !== outPr); S.out.push(outPr); }
    this.emit('sub', vi, outPr ? `Cambio en ${S.team.short}: entra ${b.p.name}, sale ${outPr.p.name}.` : `Cambio en ${S.team.short}: entra ${b.p.name}.`, { pid: b.p.id });
    this.recalc(vi);
  }
  substitute(vi, outId, inId) {
    const S = this.sides[vi];
    if (S.subs >= 5) return false;
    const outPr = S.on.find(x => x.p.id === outId), b = S.bench.find(x => x.p.id === inId && !x.used);
    if (!outPr || !b) return false;
    this.doSub(vi, { pos: outPr.pos, x: outPr.x, y: outPr.y }, b, outPr);
    return true;
  }
  setTactic(vi, k, v) { this.sides[vi].tac[k] = v; this.recalc(vi); }
  aiSubs() {
    if (this.min < 58) return;
    for (let vi = 0; vi < 2; vi++) {
      if (!this.auto && vi === this.userSide) continue;
      const S = this.sides[vi];
      if (S.subs >= 5 || !S.bench.some(b => !b.used)) continue;
      const ub = this.userPid && vi === this.mySide ? S.bench.find(b => !b.used && b.p.id === this.userPid) : null;
      if (ub && this.min >= 55 && R.chance(.2)) {
        const outs = S.on.filter(x => x.pos !== 'POR' && (ub.p.pos === 'POR' ? false : POS_GROUP[x.pos] === POS_GROUP[ub.p.pos]));
        const outPr = outs.sort((a, b) => a.stam - b.stam)[0];
        if (outPr) { this.doSub(vi, { pos: outPr.pos, x: outPr.x, y: outPr.y }, ub, outPr); continue; }
      }
      if (!R.chance(.06 + (this.min - 58) / 400)) continue;
      const trailing = S.goals < this.sides[1 - vi].goals;
      const cands = S.on.filter(x => x.pos !== 'POR');
      const outPr = cands.sort((a, b) => (a.stam - (trailing && ['DFC', 'MCD'].includes(a.pos) ? 30 : 0)) - (b.stam - (trailing && ['DFC', 'MCD'].includes(b.pos) ? 30 : 0)))[0];
      if (!outPr) continue;
      const pool = S.bench.filter(b => !b.used && b.p.pos !== 'POR' && isAvailBench(b.p));
      const cand = pool.sort((a, b) => b.p.ovr * posFit(outPr.pos, b.p.pos) - a.p.ovr * posFit(outPr.pos, a.p.pos))[0];
      if (cand) this.doSub(vi, { pos: outPr.pos, x: outPr.x, y: outPr.y }, cand, outPr);
    }
  }
  penalty(si, taker, mod) {
    const A = this.sides[si], B = this.sides[1 - si];
    const pr = taker || A.on.slice().sort((a, b) => b.p.attrs.sho - a.p.attrs.sho)[0];
    this.emit('pen', si, `¡PENALTI para ${A.team.name}! ${pr.p.name} se encarga de lanzarlo.`);
    pr.sh++; A.st.sh++;
    const p = R.clamp(.74 + (pr.p.attrs.sho - 70) / 200 - (this.gkEff(B) - 70) / 300 + ((mod && mod.pa) || 0), .45, .93);
    if (R.chance(p)) { pr.sot++; A.st.sot++; this.goal(si, pr, null, 'pen'); }
    else { const gk = B.on.find(x => x.pos === 'POR'); if (gk && R.chance(.6)) { gk.sv++; gk.r += .6; this.emit('save', si, `¡PENALTI PARADO por ${gk.p.name}!`); } else this.emit('shot', si, `${pr.p.name} lo manda fuera. ¡Fallo clamoroso!`); pr.r -= .5; }
  }
  /* --- momentos interactivos del jugador --- */
  momentChoices() {
    const pd = this.pending; if (!pd) return null;
    if (pd.t === 'shoot') return { title: '¡Ocasión de gol!', text: 'Tienes el balón en la frontal del área.', opts: [['power', 'Disparo potente', 'Más riesgo, más recompensa'], ['place', 'Disparo colocado', 'Más puntería, menos fuerza'], ['dribble', 'Regatear al portero', 'Depende de tu regate'], ['pass', 'Ceder a un compañero', 'Mejor posicionado']] };
    if (pd.t === 'create') return { title: '¡Tienes el balón en ataque!', text: 'Un compañero se desmarca. ¿Qué haces?', opts: [['through', 'Pase filtrado', 'Letal si sale bien'], ['safe', 'Pase seguro', 'Mantener la posesión'], ['cross', 'Centro al área', 'Remate de cabeza'], ['shootme', 'Probar el disparo', 'Lo hago yo']] };
    if (pd.t === 'defend') {
      if (pd.pr.pos === 'POR') return { title: '¡Disparo a puerta!', text: 'El delantero rival se planta ante ti.', opts: [['dive', 'Estirada', 'Mejora la parada si aciertas'], ['rush', 'Salir a por el balón', 'Arriesgado'], ['hold', 'Quedarte en la línea', 'Seguro, pero menos efectivo']] };
      return { title: '¡Peligro! El rival entra en tu zona', text: 'Decide cómo detener el ataque.', opts: [['tackle', 'Entrada firme', 'Puede ser falta'], ['intercept', 'Cortar el pase', 'Anticipación'], ['cover', 'Cerrar espacios', 'Opción segura']] };
    }
    if (pd.t === 'inj') return { title: 'Lesión en tu equipo', text: 'Elige a quién introducir.', opts: [] };
    if (pd.t === 'pen') return { title: '¡Penalti!', text: 'Elige cómo lanzarlo.', opts: [['left', 'Palo izquierdo', ''], ['center', 'Al centro', ''], ['right', 'Palo derecho', '']] };
    return null;
  }
  choose(key) {
    const pd = this.pending; if (!pd) return '';
    this.tick = []; this.pending = null;
    const ctx = pd.ctx, m = ctx && ctx.mod, sh = ctx && ctx.shooter, a = ctx && ctx.assister;
    
    let msg = '';
    const ok = (p) => R.chance(R.clamp(p, .08, .95));
    if (pd.t === 'shoot') {
      const me = sh, at = me.p.attrs;
      if (key === 'power') { m.ot = -.1; m.gm = 1.3; msg = '¡Disparo con todo!'; }
      else if (key === 'place') { m.ot = .1; m.gm = 1.0; msg = 'Intentas colocarla…'; }
      else if (key === 'dribble') {
        if (ok(.15 + at.dri / 140 - this.gkEff(this.sides[1 - ctx.si]) / 400)) { m.force = true; m.gm = 2; msg = '¡Regate al portero con éxito!'; me.keyOK++; me.r += .3; }
        else { m.cancel = true; msg = 'El portero te gana la acción.'; me.keyBad++; me.r -= .3; this.emit('txt', ctx.si, `${me.p.name} intenta regatear al portero pero pierde el balón.`); }
      } else if (key === 'pass') {
        const mates = this.sides[ctx.si].on.filter(x => x !== me && x.pos !== 'POR');
        const mate = R.wpick(mates, x => (['DC', 'EI', 'ED', 'MCO'].includes(x.pos) ? 3 : 1) * Math.pow(x.p.attrs.sho / 70, 2));
        if (ok(.45 + at.pas / 160)) { ctx.shooter = mate; ctx.assister = me; m.gm = 1.25; msg = `Cedes el balón a ${mate.p.name}, que se queda solo.`; me.keyOK++; me.r += .15; }
        else { m.cancel = true; msg = 'El pase se pierde.'; me.keyBad++; me.r -= .2; this.emit('txt', ctx.si, `${me.p.name} cede en largo pero el pase no llega.`); }
      }
    } else if (pd.t === 'create') {
      const me = a, at = me.p.attrs;
      if (key === 'through') { if (ok(.35 + at.pas / 140)) { m.gm = 1.5; m.ot = .08; msg = '¡Pase filtrado perfecto!'; me.keyOK++; me.r += .25; } else { m.cancel = true; msg = 'La defensa intercepta el pase.'; me.keyBad++; me.r -= .25; this.emit('txt', ctx.si, `${me.p.name} busca el pase filtrado pero lo corta la zaga.`); } }
      else if (key === 'safe') { m.gm = .95; msg = 'Pase seguro, la jugada continúa.'; me.r += .05; }
      else if (key === 'cross') { if (ok(.3 + at.pas / 150)) { m.gm = 1.15; m.ot = -.04; msg = '¡Gran centro al área!'; me.keyOK++; me.r += .15; } else { m.cancel = true; msg = 'El centro sale desviado.'; me.keyBad++; me.r -= .15; } }
      else if (key === 'shootme') { ctx.shooter = me; ctx.assister = null; msg = 'Decides probar fortuna…'; }
    } else if (pd.t === 'defend') {
      const me = pd.pr, at = me.p.attrs;
      if (me.pos === 'POR') {
        if (key === 'dive') { if (ok(.3 + at.def / 160)) { m.gm = .55; msg = '¡Estirada espectacular!'; me.keyOK++; } else { m.gm = 1.1; msg = 'Te quedas corto.'; me.keyBad++; me.r -= .2; } }
        else if (key === 'rush') { if (ok(.25 + at.pac / 250 + at.def / 250)) { m.cancel = true; msg = '¡Sales y cortas el peligro!'; me.keyOK++; me.r += .3; this.emit('save', ctx.si, `${me.p.name} sale como una exhalación y despeja el peligro.`); } else { m.gm = 2.2; m.force = true; msg = '¡Llegas tarde! Portería vacía…'; me.keyBad++; me.r -= .35; } }
        else { m.gm = .9; msg = 'Te mantienes firme bajo palos.'; }
      } else {
        if (key === 'tackle') {
          if (ok(.25 + at.def / 150)) { m.cancel = true; msg = '¡Entrada limpia! Cortas el ataque.'; me.keyOK++; me.r += .4; this.emit('txt', 1 - ctx.si, `¡Gran entrada de ${me.p.name}! Corta el avance.`); }
          else if (R.chance(.45)) { msg = '¡Falta! Te pitan la infracción.'; me.keyBad++; me.r -= .2; this.sides[this.mySide].st.fouls++; if (R.chance(.45)) { me.yc++; this.sides[this.mySide].st.yc++; this.emit('yc', this.mySide, `Tarjeta amarilla para ${me.p.name}.`, { pid: me.p.id }); if (me.yc >= 2) this.sendOff(this.mySide, me, false); } if (R.chance(.18)) { msg += ' ¡Y es penalti!'; this.penalty(ctx.si); this.recalc(0); this.recalc(1); m.cancel = true; } }
          else { m.gm = 1.5; m.ot = .08; msg = 'Te superan en el uno contra uno.'; me.keyBad++; me.r -= .3; }
        } else if (key === 'intercept') { if (ok(.2 + (at.def * .5 + at.pas * .4) / 150)) { m.cancel = true; msg = '¡Anticipación perfecta! Cortas el pase.'; me.keyOK++; me.r += .35; } else { msg = 'No llegas a tiempo.'; me.keyBad++; me.r -= .1; } }
        else { m.blk = .12; m.gm = .9; msg = 'Cierras bien los espacios.'; me.r += .05; }
      }
    } else if (pd.t === 'pen') { m.pa = key === 'center' ? -.04 : .02; }
    this.momentMsg = msg;
    this.emit('moment', this.mySide, msg);
    if (ctx) this.resolveShot(ctx);
    this.randomEvents(ctx ? ctx.si : 0);
    if (!this.pending) { this.aiSubs(); this.afterTick(); }
    return msg;
  }
  end() {
    this.finished = true; this.label = 'FIN';
    const [H, A] = this.sides;
    this.emit('ft', -1, `Final del partido: ${H.team.name} ${H.goals}-${A.goals} ${A.team.name}.`);
    const dd = H.goals - A.goals;
    [H, A].forEach((S, i) => {
      const gd = i === 0 ? dd : -dd, ga = i === 0 ? A.goals : H.goals;
      [...S.on, ...S.out].forEach(pr => {
        let r = pr.r + (gd > 0 ? .35 : gd < 0 ? -.25 : 0) + R.gauss() * .22;
        if (ga === 0 && ['POR', 'DFC', 'LI', 'LD', 'MCD'].includes(pr.pos) && !pr.red) r += .45;
        if (ga >= 3 && ['POR', 'DFC', 'LI', 'LD'].includes(pr.pos)) r -= .3;
        pr.fr = R.clamp(r, 3, 10);
        pr.to = pr.to == null ? this.endMin : pr.to;
      });
    });
    this.result = this.buildResult();
  }
  buildResult() {
    const [H, A] = this.sides;
    const rows = [];
    this.sides.forEach((S, si) => [...S.on, ...S.out].forEach(pr => rows.push({ si, p: pr.p, pos: pr.pos, r: Math.round(pr.fr * 10) / 10, g: pr.g, a: pr.a, sh: pr.sh, sot: pr.sot, sv: pr.sv, yc: pr.yc, red: pr.red, min: Math.max(1, pr.to - pr.from), keyOK: pr.keyOK, keyBad: pr.keyBad })));
    const motm = rows.slice().sort((a, b) => b.r - a.r)[0];
    return { home: H.team, away: A.team, hg: H.goals, ag: A.goals, events: this.events, rows, motm, stats: [H.st, A.st], poss: [Math.round(100 * H.st.poss / Math.max(1, H.st.poss + A.st.poss))] };
  }
  commit() {
    if (this.committed) return this.result; this.committed = true;
    const res = this.result;
    const cleanH = res.ag === 0, cleanA = res.hg === 0;
    res.rows.forEach(r => {
      const p = r.p, s = p.st;
      s.app++; s.gls += r.g; s.ast += r.a; s.rs += r.r; s.rn++; s.min += r.min; s.yc += r.yc; if (r.red) s.rc++;
      p.goalsC += r.g; p.appC++;
      if (((r.si === 0 && cleanH) || (r.si === 1 && cleanA)) && ['POR', 'DFC', 'LI', 'LD'].includes(r.pos)) s.cs++;
      p.fitness = Math.max(30, p.fitness - (r.min / 90) * (16 + R.int(0, 9)));
      p.form = R.clamp(p.form * .7 + (50 + (r.r - 6.4) * 26) * .3, 5, 95);
      if (r.yc && s.yc % 5 === 0) p.ban = Math.max(p.ban, 1);
      if (r.red) p.ban = Math.max(p.ban, R.int(1, 3));
    });
    return res;
  }
}
const isAvailBench = p => !p.inj && !p.ban;

function simulate(home, away, o) {
  o = Object.assign({ auto: true }, o || {});
  const m = new Match(home, away, o);
  let guard = 0;
  while (!m.finished && guard++ < 400) { if (m.pending) { m.pending = null; } m.step(); }
  return m.commit();
}
function shootout(a, b) {
  const rate = t => R.clamp(.74 + (strengthOf(t) - 65) / 300, .6, .88);
  let sa = 0, sb = 0;
  for (let i = 0; i < 5; i++) { if (R.chance(rate(a))) sa++; if (R.chance(rate(b))) sb++; }
  while (sa === sb) { if (R.chance(rate(a))) sa++; if (R.chance(rate(b))) sb++; if (sa === sb && R.chance(.5)) { sa++; } }
  return [sa, sb];
}
