'use strict';
/* ===== Utilidades y datos base ===== */
const R = {
  int: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
  f: (a, b) => Math.random() * (b - a) + a,
  pick: a => a[Math.floor(Math.random() * a.length)],
  chance: p => Math.random() < p,
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
  wpick(items, wfn) {
    let t = 0; const ws = items.map(i => { const w = Math.max(0, wfn(i)); t += w; return w; });
    if (t <= 0) return items[Math.floor(Math.random() * items.length)];
    let x = Math.random() * t;
    for (let i = 0; i < items.length; i++) { x -= ws[i]; if (x <= 0) return items[i]; }
    return items[items.length - 1];
  },
  shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
};

const ATTR = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
const ATTR_LBL = { pac: 'RIT', sho: 'TIR', pas: 'PAS', dri: 'REG', def: 'DEF', phy: 'FIS' };
const ATTR_LBL_GK = { pac: 'VEL', sho: 'SAQ', pas: 'DIS', dri: 'MAN', def: 'REF', phy: 'POS' };
const ATTR_NAME = { pac: 'Ritmo', sho: 'Tiro', pas: 'Pase', dri: 'Regate', def: 'Defensa', phy: 'Físico' };

const POS_LIST = ['POR', 'DFC', 'LI', 'LD', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC'];
const POS_NAME = { POR: 'Portero', DFC: 'Defensa central', LI: 'Lateral izq.', LD: 'Lateral der.', MCD: 'Pivote', MC: 'Centrocampista', MCO: 'Mediapunta', EI: 'Extremo izq.', ED: 'Extremo der.', DC: 'Delantero centro' };
const POS_GROUP = { POR: 0, DFC: 1, LI: 1, LD: 1, MCD: 2, MC: 2, MCO: 2, EI: 3, ED: 3, DC: 3 };
const GROUP_NAME = ['Porteros', 'Defensas', 'Centrocampistas', 'Delanteros'];

const WEIGHTS = {
  POR: { pac: 1 / 6, sho: 1 / 6, pas: 1 / 6, dri: 1 / 6, def: 1 / 6, phy: 1 / 6 },
  DFC: { def: .4, phy: .25, pas: .1, pac: .1, dri: .1, sho: .05 },
  LI: { pac: .25, def: .25, pas: .15, dri: .15, phy: .15, sho: .05 },
  LD: { pac: .25, def: .25, pas: .15, dri: .15, phy: .15, sho: .05 },
  MCD: { def: .3, pas: .25, phy: .2, dri: .1, pac: .05, sho: .1 },
  MC: { pas: .3, dri: .2, def: .15, phy: .1, sho: .15, pac: .1 },
  MCO: { pas: .3, dri: .25, sho: .2, pac: .1, phy: .05, def: .1 },
  EI: { pac: .25, dri: .25, sho: .2, pas: .15, phy: .05, def: .1 },
  ED: { pac: .25, dri: .25, sho: .2, pas: .15, phy: .05, def: .1 },
  DC: { sho: .35, pac: .2, dri: .15, phy: .2, pas: .1, def: 0 }
};

const POS_FIT = {
  DFC: { LI: .9, LD: .9, MCD: .88 }, LI: { LD: .9, DFC: .88, EI: .88 }, LD: { LI: .9, DFC: .88, ED: .88 },
  MCD: { DFC: .9, MC: .93 }, MC: { MCD: .93, MCO: .93 }, MCO: { MC: .93, EI: .9, ED: .9, DC: .88 },
  EI: { ED: .93, MCO: .9, DC: .88, LI: .85 }, ED: { EI: .93, MCO: .9, DC: .88, LD: .85 }, DC: { MCO: .9, EI: .88, ED: .88 }
};
function posFit(slot, pos) {
  if (slot === pos) return 1;
  if (slot === 'POR') return .25;
  if (pos === 'POR') return .2;
  return (POS_FIT[slot] && POS_FIT[slot][pos]) || .75;
}

const FORMATIONS = {
  '4-4-2': [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['EI', 'MC', 'MC', 'ED'], ['DC', 'DC']],
  '4-3-3': [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MC', 'MCD', 'MC'], ['EI', 'DC', 'ED']],
  '4-2-3-1': [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MCD', 'MCD'], ['EI', 'MCO', 'ED'], ['DC']],
  '3-5-2': [['POR'], ['DFC', 'DFC', 'DFC'], ['LI', 'MC', 'MCD', 'MC', 'LD'], ['DC', 'DC']],
  '4-1-4-1': [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['MCD'], ['EI', 'MC', 'MC', 'ED'], ['DC']],
  '5-3-2': [['POR'], ['LI', 'DFC', 'DFC', 'DFC', 'LD'], ['MC', 'MC', 'MC'], ['DC', 'DC']],
  '4-5-1': [['POR'], ['LI', 'DFC', 'DFC', 'LD'], ['EI', 'MC', 'MCO', 'MC', 'ED'], ['DC']],
  '3-4-3': [['POR'], ['DFC', 'DFC', 'DFC'], ['LI', 'MC', 'MC', 'LD'], ['EI', 'DC', 'ED']]
};
const YSPREAD = { 1: [.5], 2: [.34, .66], 3: [.2, .5, .8], 4: [.1, .37, .63, .9], 5: [.08, .29, .5, .71, .92] };
const FORM_SLOTS = {};
for (const [name, lines] of Object.entries(FORMATIONS)) {
  const slots = []; const nl = lines.length;
  lines.forEach((ln, li) => {
    const x = li === 0 ? .06 : .24 + (li - 1) * (.56 / Math.max(1, nl - 2));
    ln.forEach((pos, i) => slots.push({ pos, x, y: YSPREAD[ln.length][i] }));
  });
  FORM_SLOTS[name] = slots;
}

const NATS = {
  ES: { f: '🇪🇸', n: 'España', w: 30, a: 'Álvaro Sergio Pablo Dani Iván Marcos Adrián Raúl Hugo Mario Jorge Rubén Unai Pau Iker Nacho'.split(' '), b: 'García Martínez López Sánchez Fernández Ruiz Navarro Molina Ortega Vidal Herrera Castro Romero Gil Serrano Iglesias'.split(' ') },
  EN: { f: '🇬🇧', n: 'Inglaterra', w: 8, a: 'Jack Harry Oliver Jordan Callum Mason Reece Tyler Kieran Ben Luke Ethan'.split(' '), b: 'Smith Walker Taylor Bennett Foster Hughes Palmer Whitfield Barlow Hargreaves Ellis Pearce'.split(' ') },
  IT: { f: '🇮🇹', n: 'Italia', w: 6, a: 'Marco Luca Matteo Federico Andrea Davide Simone Lorenzo Giorgio Nicolò'.split(' '), b: 'Rossi Bianchi Conti Greco Ferri Marino Gallo Ricci Moretti Barbieri Lombardi Fabbri'.split(' ') },
  DE: { f: '🇩🇪', n: 'Alemania', w: 6, a: 'Lukas Jonas Felix Leon Maximilian Tim Niklas Jan Moritz Florian'.split(' '), b: 'Schneider Weber Becker Hoffmann Koch Richter Wolf Neumann Krüger Lange Braun Vogel'.split(' ') },
  FR: { f: '🇫🇷', n: 'Francia', w: 8, a: 'Théo Lucas Antoine Maxime Mathis Enzo Nolan Yanis Romain Baptiste'.split(' '), b: 'Dubois Moreau Laurent Lefebvre Girard Fontaine Rousseau Mercier Blanc Garnier Chevalier Perrin'.split(' ') },
  BR: { f: '🇧🇷', n: 'Brasil', w: 9, a: 'Gabriel Thiago Matheus Rafael Caio Bruno Leandro Diego Felipe Rodrigo João'.split(' '), b: 'Silva Santos Oliveira Souza Pereira Costa Ribeiro Almeida Carvalho Barbosa Rocha Teixeira'.split(' ') },
  AR: { f: '🇦🇷', n: 'Argentina', w: 8, a: 'Matías Facundo Nicolás Franco Tomás Santiago Joaquín Agustín Ezequiel Julián'.split(' '), b: 'Gómez Rodríguez Acosta Benítez Ledesma Paredes Sosa Ibarra Medina Roldán Villalba Giménez'.split(' ') },
  PT: { f: '🇵🇹', n: 'Portugal', w: 5, a: 'Rui Tiago Diogo Pedro André Nuno Rúben Bernardo Gonçalo'.split(' '), b: 'Ferreira Pinto Cardoso Tavares Monteiro Lopes Mendes Correia Nogueira Borges Moura'.split(' ') },
  NL: { f: '🇳🇱', n: 'Países Bajos', w: 4, a: 'Daan Sven Bram Joris Thijs Luuk Jesse Milan Stijn'.split(' '), b: 'Bakker Visser Smit Mulder Hendriks Dekker Brouwer Vermeulen Peters Jansen'.split(' ') },
  UY: { f: '🇺🇾', n: 'Uruguay', w: 3, a: 'Federico Nahuel Maximiliano Mathías Gastón Emiliano Brian Darwin'.split(' '), b: 'Viera Cabrera Techera Píriz Olivera Barrios Rivero Pereyra Acuña Fagúndez'.split(' ') },
  NG: { f: '🇳🇬', n: 'Nigeria', w: 3, a: 'Emeka Chidi Tunde Kelechi Samuel Victor Ade Obi'.split(' '), b: 'Okafor Adeyemi Eze Balogun Nwosu Ogunleye Okoro Bello Abiola Uche'.split(' ') },
  MA: { f: '🇲🇦', n: 'Marruecos', w: 3, a: 'Youssef Amine Hamza Karim Omar Ilyas Bilal Zakaria'.split(' '), b: 'El Idrissi Benali Haddad Tahiri Lamrani Bennani Chakir Ziani Mansouri Alaoui'.split(' ') },
  CO: { f: '🇨🇴', n: 'Colombia', w: 3, a: 'Juan Camilo Andrés Mateo Sebastián Brayan Yerson Kevin'.split(' '), b: 'Rincón Cárdenas Mosquera Quintero Valencia Ospina Bedoya Cuesta Ríos Palacios'.split(' ') },
  BE: { f: '🇧🇪', n: 'Bélgica', w: 2, a: 'Thomas Arne Wout Jens Lars Tom Yannick Bart'.split(' '), b: 'Peeters Janssens Maes Claes Willems Goossens Lambert Wouters De Smet Jacobs'.split(' ') },
  HR: { f: '🇭🇷', n: 'Croacia', w: 2, a: 'Luka Ivan Marko Josip Ante Domagoj Filip'.split(' '), b: 'Kovač Horvat Babić Marić Jurić Novak Petrović Vuković Tomić Perić'.split(' ') },
  RO: { f: '🇷🇴', n: 'Rumanía', w: 0, a: ['Andrei', 'Mihai'], b: ['Popescu', 'Balan'] },
  VE: { f: '🇻🇪', n: 'Venezuela', w: 0, a: ['José', 'Luis'], b: ['Torrealba', 'Pérez'] },
  JP: { f: '🇯🇵', n: 'Japón', w: 2, a: 'Haruto Ren Sota Yuki Kaito Takumi Daiki Riku'.split(' '), b: 'Tanaka Sato Suzuki Takahashi Watanabe Kobayashi Nakamura Kato Yoshida Hayashi'.split(' ') }
};
const NAT_KEYS = Object.keys(NATS);
const pickNat = () => R.wpick(NAT_KEYS, k => NATS[k].w);
const randName = nat => R.pick(NATS[nat].a) + ' ' + R.pick(NATS[nat].b);

const CLUBS = [
  ['Real Capital CF', 'RCA', '#f5f5f5', '#c9a227', 91, 82, 'Capital'], ['FC Ciudad Condal', 'FCC', '#a50044', '#004d98', 90, 95, 'Ciudad Condal'],
  ['Atlético del Manzanares', 'ATM', '#cb3524', '#ffffff', 84, 68, 'Manzanares'], ['Hispalis FC', 'HIS', '#ffffff', '#d71920', 77, 43, 'Hispalis'],
  ['Real Cantabria', 'RCN', '#d9232d', '#ffffff', 74, 40, 'Cantabria'], ['Turia CF', 'TUR', '#ffffff', '#f58220', 73, 50, 'Turia'],
  ['Real Guadalquivir', 'GUA', '#0bb34b', '#ffffff', 70, 60, 'Guadalquivir'], ['Real Costa Vasca', 'RCV', '#0067b1', '#ffffff', 69, 39, 'Costa Vasca'],
  ['Villa Marina CF', 'VMA', '#f7e11a', '#0a5aa5', 67, 24, 'Villa Marina'], ['Deportivo Galaico', 'DGA', '#1a4fb4', '#ffffff', 62, 34, 'Galicia'],
  ['Pamplona Rojillos', 'PAM', '#c8102e', '#0a1f44', 58, 23, 'Pamplona'], ['Atlético Canarias', 'CAN', '#ffd400', '#0033a0', 57, 32, 'Canarias'],
  ['Aragón FC', 'ARA', '#ffffff', '#1b3f94', 54, 34, 'Aragón'], ['Asturias Azul', 'AST', '#1f56c4', '#ffffff', 53, 30, 'Asturias'],
  ['Costa del Sol CF', 'COS', '#4bb4e6', '#ffffff', 52, 30, 'Costa del Sol'], ['Nazarí FC', 'NAZ', '#c8102e', '#ffffff', 50, 19, 'Nazarí'],
  ['Palmeral CF', 'PAL', '#0b8f3a', '#ffffff', 49, 31, 'Palmeral'], ['Bahía de Cádiz', 'BCA', '#ffd400', '#1a3b8a', 48, 20, 'Bahía'],
  ['Pucela United', 'PUC', '#6a1f8a', '#ffffff', 47, 27, 'Pucela'], ['Sporting Ribera', 'SRI', '#d6001c', '#ffffff', 46, 30, 'Ribera'],
  ['Teide FC', 'TEI', '#ffffff', '#0057b8', 45, 22, 'Teide'], ['Alcazaba CD', 'ALC', '#d62828', '#ffffff', 44, 15, 'Alcazaba'],
  ['Illes Balears', 'IBA', '#d62828', '#111111', 43, 24, 'Illes'], ['Extremadura UD', 'EXT', '#2a9d3a', '#ffffff', 41, 12, 'Extremadura'],
  ['EFB Jesús de la Ossa', 'EJO', '#d62828', '#ffffff', 36, 2, 'Tarancón'], ['CD Alcarria', 'ALA', '#1f7a3a', '#ffffff', 35, 2, 'Alcarria'],
  ['Atlético Quijote', 'AQU', '#f2c200', '#1a1a1a', 34, 2, 'La Mancha'], ['UD Dulcinea', 'DUL', '#8a2be2', '#ffffff', 33, 1.5, 'Dulcinea'],
  ['CD Molino Viejo', 'MOV', '#ffffff', '#2457c5', 32, 1.5, 'Molino'], ['Real Mancha CF', 'RMA', '#c0392b', '#f5f5f5', 31, 2.5, 'Mancha'],
  ['CD Sierra Alta', 'SAL', '#2c3e50', '#e67e22', 30, 1.5, 'Sierra'], ['Unión Alcarreña', 'UAL', '#16a085', '#ffffff', 29, 1.5, 'Alcarreña'],
  ['CF La Encina', 'ENC', '#27ae60', '#f1c40f', 28, 1, 'La Encina'], ['CD Viñedos', 'VIN', '#6c1d45', '#ffffff', 27, 1, 'Viñedos'],
  ['Atlético Cigarral', 'CIG', '#e74c3c', '#2c3e50', 26, 1, 'Cigarral'], ['UD Tablas', 'TAB', '#3498db', '#ffffff', 25, 1, 'Tablas']
].map((c, i) => ({ id: i, name: c[0], short: c[1], c1: c[2], c2: c[3], rep: c[4], cap: c[5], city: c[6], div: i < 12 ? 1 : i < 24 ? 2 : 3 }));

const MENTALITY = ['Defensivo', 'Equilibrado', 'Ofensivo'];
const DIV_NAME = { 1: 'Liga Primera', 2: 'Liga Segunda', 3: 'Primera Autonómica' };
const DIVS = [1, 2, 3];

const fmtM = m => {
  const a = Math.abs(m);
  if (a >= 1000) return (m / 1000).toFixed(2).replace('.', ',') + ' MM€';
  if (a >= 10) return Math.round(m) + ' M€';
  if (a >= 1) return m.toFixed(1).replace('.', ',') + ' M€';
  if (a >= .001) return Math.round(m * 1000) + ' K€';
  return '0 €';
};
const fmtK = k => k >= 1000 ? (k / 1000).toFixed(2).replace('.', ',') + ' M€' : Math.round(k) + ' K€';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Equipos personalizados: edita nombres, posiciones, edades y notas a tu gusto.
   [nombre, posición, edad, nota(OVR), nacionalidad, {num, height, pot, attrs}(opcional)] */
const CUSTOM_SQUADS = {
  24: [
    ['Jorge Mejía Moreno', 'POR', 27, 60, 'ES'],
    ['Rubén Martínez Álvarez', 'DFC', 28, 57, 'ES'], ['Jesús Almarza Aguilar', 'DFC', 30, 56, 'ES'], ['Daniel Toledo Blanco', 'DFC', 25, 55, 'ES'],
    ['Marcos Zapata Loeches', 'LI', 24, 55, 'ES'], ['Hagi Balan', 'LD', 26, 56, 'RO'],
    ['Víctor Justo García', 'MCD', 31, 58, 'ES'], ['Younes El Kanmboui', 'MCD', 23, 55, 'MA'],
    ['Jesús Caballero "Schaffino"', 'MC', 27, 60, 'ES'], ['Mario Muti', 'MC', 22, 54, 'ES'], ['Cristian Londoño', 'MCO', 24, 57, 'CO'],
    ['Ismael Moreno', 'EI', 21, 56, 'ES'], ['David Álvarez', 'EI', 26, 55, 'ES'], ['Hayrton José Torrealba', 'ED', 25, 58, 'VE'],
    ['Pablo Caballero', 'DC', 29, 63, 'ES'], ['Javier Cano', 'DC', 28, 57, 'ES'],
    // Hugo Gallego: central rápido y fuerte, 1,79 m, dorsal 14 (edad y notas estimadas: edítalas aquí)
    ['Hugo Gallego', 'DFC', 20, 62, 'ES', { num: 14, height: 179, pot: 78, attrs: { pac: 72, sho: 42, pas: 55, dri: 55, def: 60, phy: 72 } }]
  ]
};
