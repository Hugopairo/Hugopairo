'use strict';
/* ===== Retos de temporada y logros ===== */
const notify = msg => { (G.toasts = G.toasts || []).push(msg); };
const userRow = () => G.table[teamOf(G.utid).div].find(r => r.tid === G.utid) || { w: 0, gf: 0, ga: 0, p: 0 };
const teamCS = () => G.results.filter(r => !r.cup && ((r.h === G.utid && r.ag === 0) || (r.a === G.utid && r.hg === 0))).length;
const myAvg = () => { const s = mePlayer().st; return s.rn >= 8 ? Math.round(s.rs / s.rn * 10) : 0; };

const CH = {
  pgoals: { txt: t => `Marca ${t} goles esta temporada`, cur: () => mePlayer().st.gls },
  passists: { txt: t => `Reparte ${t} asistencias`, cur: () => mePlayer().st.ast },
  papps: { txt: t => `Disputa ${t} partidos`, cur: () => mePlayer().st.app },
  prating: { txt: t => `Nota media de ${(t / 10).toFixed(1)} o más (mín. 8 partidos)`, cur: myAvg },
  pcs: { txt: t => `Deja la portería a cero ${t} veces`, cur: () => mePlayer().st.cs },
  twins: { txt: t => `Gana ${t} partidos de liga`, cur: () => userRow().w },
  tgf: { txt: t => `Marca ${t} goles como equipo`, cur: () => userRow().gf },
  tcs: { txt: t => `${t} porterías a cero del equipo`, cur: teamCS },
  tpos: { txt: t => `Termina entre los ${t} primeros`, cur: () => G.phase === 'seasonEnd' && tablePos(G.utid) <= 0 + CH._tp ? CH._tp : 0, season: true },
  cup: { txt: t => `Llega a ${CUP_NAMES[Math.min(3, t - 1)].toLowerCase()} de la Copa`, cur: () => { const c = G.cup; if (!c) return 0; const reached = c.alive.includes(G.utid) ? c.round + 1 : (c.rounds.findIndex(r => r.some(m => m.h === G.utid || m.a === G.utid)) >= 0 ? Math.max(...c.rounds.map((r, i) => r.some(m => m.h === G.utid || m.a === G.utid) ? i + 1 : 0)) : 0); return c.winner === G.utid ? 5 : reached; } },
  tprofit: { txt: () => 'Cierra la temporada con beneficios', cur: () => G.phase === 'seasonEnd' && G.fin.season.inc > G.fin.season.exp ? 1 : 0, season: true }
};
const FMT_R = r => [r.wealth ? `💶 ${fmtK(r.wealth)}` : '', r.fame ? `⭐ +${r.fame} fama` : '', r.coach ? `🤝 +${r.coach} confianza` : '', r.tb ? `🔁 +${eur(r.tb)} fichajes` : '', r.conf ? `📈 +${r.conf} directiva` : ''].filter(Boolean).join(' · ');

function genChallenges() {
  if (G.mode === 'player' && !G.career) return [];
  const list = [];
  if (G.mode === 'player') {
    const p = mePlayer(), pos = p.pos, grp = POS_GROUP[pos];
    const lvl = 1 + Math.max(0, (p.ovr - 55)) / 35;
    if (grp === 3) list.push(['pgoals', Math.round((pos === 'DC' ? 7 : 4) * lvl), { wealth: 40 * lvl | 0, fame: 2 }]);
    else if (grp === 2) list.push(['passists', Math.round(4 * lvl), { wealth: 30 * lvl | 0, fame: 2 }]);
    else list.push(['pcs', Math.round(5 * lvl), { wealth: 30 * lvl | 0, coach: 4 }]);
    list.push(['prating', 66 + Math.min(6, Math.round(lvl * 2)), { fame: 3, coach: 6 }]);
    list.push(R.pick([['papps', 18, { coach: 5, wealth: 25 }], ['twins', Math.round(7 * (1 + (teamOf(G.utid).rep - 40) / 80)), { fame: 2, wealth: 35 }], ['cup', 3, { fame: 3, wealth: 30 }]]));
    if (grp !== 3 && R.chance(.4)) list[2] = ['tcs', 5, { coach: 4, wealth: 30 }];
  } else {
    const t = teamOf(G.utid), base = Math.round(5 + t.rep / 12);
    list.push(['twins', R.clamp(Math.round(base - (t.div - 1) * 0), 4, 16), { tb: Math.max(2, Math.round(t.rep / 14)), conf: 4 }]);
    list.push(R.pick([['tgf', Math.round(22 + t.rep / 4), { tb: 2, conf: 3 }], ['tcs', 6, { tb: 2, conf: 3 }]]));
    list.push(R.pick([['cup', 3, { tb: 3, conf: 4 }], ['tprofit', 1, { tb: 2, conf: 4 }]]));
  }
  return list.map(([k, t, r]) => ({ k, t, r, done: false }));
}
function checkChallenges() {
  if (!G.challenges) return;
  for (const c of G.challenges) {
    if (c.done) continue;
    CH._tp = c.t;
    let cur = 0; try { cur = CH[c.k].cur(); } catch (e) { cur = 0; }
    if (cur >= c.t) {
      c.done = true;
      const r = c.r;
      if (G.mode === 'player') { const cr = G.career; cr.wealth += r.wealth || 0; cr.fame = Math.min(100, cr.fame + (r.fame || 0)); cr.coach = Math.min(100, cr.coach + (r.coach || 0)); }
      else { teamOf(G.utid).tbudget += r.tb || 0; G.board.conf = Math.min(100, G.board.conf + (r.conf || 0)); }
      inbox({ title: '🎯 ¡Reto cumplido!', body: `${CH[c.k].txt(c.t)} · Recompensa: ${FMT_R(r)}`, type: 'info' });
      notify(`🎯 ¡Reto cumplido! ${CH[c.k].txt(c.t)}`);
    }
  }
}
function challengeProgress(c) { CH._tp = c.t; let cur = 0; try { cur = CH[c.k].cur(); } catch (e) { } return Math.min(cur, c.t); }

/* ----- logros ----- */
const ACH = [
  ['first_win', '🥇', 'Primera victoria', 'Gana un partido con tu equipo', x => x.win, 'all'],
  ['unbeaten', '🔥', 'Racha de fuego', 'Gana 5 partidos de liga seguidos', x => { const f = userRow().form; return f && f.length >= 5 && f.every(v => v === 'V'); }, 'all'],
  ['promoted', '⬆️', 'Ascenso', 'Sube de categoría', x => x.promoted, 'all'],
  ['champion', '🏆', 'Campeón de liga', 'Gana la liga', x => x.champion, 'all'],
  ['cupwin', '🏅', 'Campeón de Copa', 'Gana la Copa', x => x.cupwin, 'all'],
  ['debut', '👟', 'Debut', 'Juega tu primer partido', x => mePlayer().st.app >= 1 || careerApps() >= 1, 'player'],
  ['first_goal', '⚽', 'Primer gol', 'Marca tu primer gol', x => careerGoals() >= 1, 'player'],
  ['hattrick', '🎩', 'Hat-trick', 'Marca 3 goles en un partido', x => x.row && x.row.g >= 3, 'player'],
  ['motm', '⭐', 'MVP', 'Sé el mejor del partido', x => x.res && x.row && x.res.motm.p.id === x.row.p.id, 'player'],
  ['ovr70', '📈', 'Nivel 70', 'Llega a nivel 70', x => mePlayer().ovr >= 70, 'player'],
  ['ovr80', '🚀', 'Nivel 80', 'Llega a nivel 80', x => mePlayer().ovr >= 80, 'player'],
  ['ovr90', '👑', 'Nivel 90', 'Llega a nivel 90', x => mePlayer().ovr >= 90, 'player'],
  ['caps', '🌍', 'Internacional', 'Debuta con la selección', x => G.career.caps >= 1, 'player'],
  ['apps100', '💯', 'Centenario', 'Juega 100 partidos', x => careerApps() >= 100, 'player'],
  ['move', '✈️', 'Nuevos aires', 'Ficha por otro club', x => G.career.moved, 'player'],
  ['rich', '💰', 'Millonario', 'Reúne 1 M€', x => G.career.wealth >= 1000, 'player'],
  ['ballon', '🥇', 'Balón de Oro', 'Gana el Balón de Oro', x => G.career.awards.some(a => a.n.startsWith('Balón')), 'player'],
  ['m_sign', '💸', 'Fichaje estrella', 'Ficha a alguien por 10 M€ o más', x => G.flags && G.flags.bigSign, 'manager'],
  ['m_youth', '🌱', 'Obra de la cantera', 'Un canterano llega a nivel 70', x => squadOf(teamOf(G.utid)).some(p => p.fromYouth && p.ovr >= 70), 'manager'],
  ['m_cash', '🏦', 'Club saneado', 'Reúne 50 M€ en caja', x => teamOf(G.utid).cash >= 50, 'manager']
];
const careerApps = () => G.career.seasons.reduce((s, x) => s + x.app, 0) + mePlayer().st.app;
const careerGoals = () => G.career.seasons.reduce((s, x) => s + x.g, 0) + mePlayer().st.gls;
function checkAch(ctx) {
  G.ach = G.ach || {}; ctx = ctx || {};
  for (const [id, ic, name, desc, test, mode] of ACH) {
    if (G.ach[id] || (mode !== 'all' && mode !== G.mode)) continue;
    let ok = false; try { ok = !!test(ctx); } catch (e) { ok = false; }
    if (ok) { G.ach[id] = G.season; notify(`${ic} Logro desbloqueado: <b>${name}</b>`); }
  }
}
function afterUserMatchGoals(res, uf) {
  const ctx = { res };
  if (res && uf) { const home = uf.h === G.utid; const gf = home ? res.hg : res.ag, ga = home ? res.ag : res.hg; ctx.win = uf.kind === 'C' ? res.winner === G.utid : gf > ga; }
  if (G.mode === 'player' && res) ctx.row = res.rows.find(r => r.p.id === G.career.pid);
  checkChallenges(); checkAch(ctx);
}
function afterSeasonGoals(sum) {
  checkChallenges();
  checkAch({ promoted: sum.promoted.includes(G.utid) || sum.promoted3.includes(G.utid), champion: sum.champion === G.utid, cupwin: sum.cup === G.utid });
}

/* ===== Pantalla ===== */
function challengePanel(compact) {
  const cs = G.challenges || [];
  return `<div class="panel"><h3>🎯 Retos de la temporada</h3>${cs.map(c => { const cur = challengeProgress(c); return `<div style="margin:8px 0"><div class="row between small"><span>${c.done ? '✅' : '🔸'} ${CH[c.k].txt(c.t)}</span><b>${c.k === 'prating' ? (cur / 10).toFixed(1) + '/' + (c.t / 10).toFixed(1) : cur + '/' + c.t}</b></div>${meter(100 * cur / c.t, c.done ? 'var(--acc)' : 'var(--acc2)')}${compact ? '' : `<div class="tiny muted">Recompensa: ${FMT_R(c.r)}</div>`}</div>`; }).join('') || '<span class="muted small">Sin retos</span>'}</div>`;
}
SCREENS.goals = () => {
  G.ach = G.ach || {};
  const list = ACH.filter(a => a[5] === 'all' || a[5] === G.mode);
  const n = list.filter(a => G.ach[a[0]]).length;
  return `<div class="row between mb wrap"><h2>🎯 Retos y logros</h2><span class="pill">${n}/${list.length} logros</span></div>${challengePanel(false)}
  <h3 class="mt mb">Logros</h3><div class="grid g3">${list.map(([id, ic, name, desc]) => { const got = G.ach[id]; return `<div class="panel row" style="${got ? 'border-color:var(--gold)' : 'opacity:.55'}"><span style="font-size:34px;${got ? '' : 'filter:grayscale(1)'}">${ic}</span><div class="grow"><b>${name}</b><div class="small muted">${desc}</div></div>${got ? `<span class="tag y">${seasonLbl(got)}</span>` : '<span class="tag">🔒</span>'}</div>`; }).join('')}</div>`;
};
