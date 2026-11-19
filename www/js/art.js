// Fun Lingo — picture cards
// Bright, rounded vector pictures (SVG strings, 200×200) for every word. The same
// picture is used on the digital board and on the lesson map.

const O = '#2b2150';                                 // soft dark outline
const SKIN = { a: '#ffcda4', b: '#f2b48a', baby: '#ffd9bc' };

// one picture = a coloured disc with the drawing clipped inside it
const pic = (id, bg, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><clipPath id="c-${id}"><circle cx="100" cy="100" r="94"/></clipPath></defs>` +
  `<circle cx="100" cy="100" r="94" fill="${bg}"/><g clip-path="url(#c-${id})">${body}</g></svg>`;
// several shapes sharing one outline (drawn as an outlined silhouette, then filled)
const blob = (shapes, fill, w = 10) =>
  `<g fill="${O}" stroke="${O}" stroke-width="${w}" stroke-linejoin="round">${shapes}</g><g fill="${fill}">${shapes}</g>`;
const st = (w = 5) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
function star(cx, cy, r, fill = '#ffd23f') {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r;
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
  }
  return `<path d="${d}Z" fill="${fill}" ${st(3.5)}/>`;
}
function heart(cx, cy, s, fill = '#ff3b6b') {
  return `<path d="M${cx} ${cy + 7 * s}C${cx - 15 * s} ${cy - 3 * s} ${cx - 9 * s} ${cy - 16 * s} ${cx} ${cy - 8 * s}C${cx + 9 * s} ${cy - 16 * s} ${cx + 15 * s} ${cy - 3 * s} ${cx} ${cy + 7 * s}Z" fill="${fill}" ${st(3.5)}/>`;
}
// a happy face: shiny eyes, rosy cheeks, smile
function face(cx, cy, s = 1, { closed = false, mouth = true } = {}) {
  const ex = 16 * s, eye = (x) => closed
    ? `<path d="M${x - 6 * s} ${cy + 2 * s}Q${x} ${cy - 6 * s} ${x + 6 * s} ${cy + 2 * s}" fill="none" ${st(4.5)}/>`
    : `<ellipse cx="${x}" cy="${cy}" rx="${5.5 * s}" ry="${7 * s}" fill="${O}"/><circle cx="${x + 2 * s}" cy="${cy - 2.5 * s}" r="${2.2 * s}" fill="#fff"/>`;
  return eye(cx - ex) + eye(cx + ex) +
    `<ellipse cx="${cx - 27 * s}" cy="${cy + 12 * s}" rx="${8 * s}" ry="${5 * s}" fill="#ff7aa8" opacity=".75"/>` +
    `<ellipse cx="${cx + 27 * s}" cy="${cy + 12 * s}" rx="${8 * s}" ry="${5 * s}" fill="#ff7aa8" opacity=".75"/>` +
    (mouth ? `<path d="M${cx - 11 * s} ${cy + 11 * s}Q${cx} ${cy + 23 * s} ${cx + 11 * s} ${cy + 11 * s}" fill="#ff5a7a" ${st(4.5)}/>` : '');
}
// thick tube (trunk, branch…): outline first, then colour
const tube = (d, fill, w = 16) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 10}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round"/>`;
// a happy paint splat in one colour (for the colour words)
function splat(id, fill, bg, dark = false) {
  const bumps = [[100, 50], [148, 70], [158, 122], [114, 156], [58, 146], [44, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16"/>`).join('');
  const eyes = dark
    ? [84, 116].map((x) => `<ellipse cx="${x}" cy="98" rx="9" ry="10.5" fill="#fff"/><circle cx="${x + 1}" cy="100" r="5" fill="#1b1430"/><circle cx="${x + 3}" cy="96" r="2" fill="#fff"/>`).join('') +
      `<ellipse cx="73" cy="114" rx="8" ry="5" fill="#ff7aa8"/><ellipse cx="127" cy="114" rx="8" ry="5" fill="#ff7aa8"/><path d="M89 113Q100 125 111 113" fill="#ff5a7a" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`
    : face(100, 100, 1.15);
  return pic(id, bg, blob(`<circle cx="100" cy="104" r="50"/>${bumps}`, fill) +
    `<circle cx="36" cy="44" r="9" fill="${fill}" ${st(4)}/><circle cx="168" cy="40" r="7" fill="${fill}" ${st(4)}/><circle cx="172" cy="168" r="8" fill="${fill}" ${st(4)}/>` +
    `<ellipse cx="76" cy="76" rx="8" ry="13" fill="#fff" opacity="${dark ? 0.25 : 0.5}" transform="rotate(30 76 76)"/>` + eyes);
}
const drop = (x, y, s, fill) => `<path d="M${x} ${y - 14 * s}C${x + 7 * s} ${y - 4 * s} ${x + 10 * s} ${y} ${x + 10 * s} ${y + 5 * s}C${x + 10 * s} ${y + 11 * s} ${x + 5 * s} ${y + 15 * s} ${x} ${y + 15 * s}C${x - 5 * s} ${y + 15 * s} ${x - 10 * s} ${y + 11 * s} ${x - 10 * s} ${y + 5 * s}C${x - 10 * s} ${y} ${x - 7 * s} ${y - 4 * s} ${x} ${y - 14 * s}Z" fill="${fill}" ${st(3.5)}/>`;
const body = (fill) => `<path d="M34 210Q38 158 100 154Q162 158 166 210Z" fill="${fill}" ${st()}/>`;

export const ART = {
  // a smiling sun waving good morning
  hello: pic('hello', '#fff1b8',
    [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="100" cy="24" rx="12" ry="19" fill="#ff8a1f" ${st(4.5)} transform="rotate(${a} 100 100)"/>`).join('') +
    `<circle cx="100" cy="100" r="54" fill="#ffd23f" ${st()}/>` + face(100, 96, 1.3) +
    `<ellipse cx="156" cy="138" rx="14" ry="18" fill="#ffd23f" ${st()} transform="rotate(-25 156 138)"/>` +
    `<path d="M174 112q9 7 4 18M184 104q13 11 6 28" fill="none" ${st(4)}/>`),

  // a sleepy moon waving bye-bye under the stars
  bye: pic('bye', '#d8ccff',
    star(42, 52, 13) + star(160, 38, 10, '#fff') + star(166, 152, 11) + star(34, 140, 8, '#fff') +
    `<circle cx="100" cy="106" r="56" fill="#fff0a3" ${st()}/>` +
    `<circle cx="74" cy="138" r="8" fill="#f3d86c"/><circle cx="130" cy="72" r="6" fill="#f3d86c"/>` + face(100, 104, 1.3, { closed: true }) +
    `<ellipse cx="44" cy="96" rx="14" ry="18" fill="#fff0a3" ${st()} transform="rotate(20 44 96)"/>` +
    `<path d="M26 70q-9 7 -4 18M16 62q-13 11 -6 28" fill="none" ${st(4)}/>`),

  mom: pic('mom', '#ffd0e6',
    blob('<circle cx="100" cy="104" r="58"/><circle cx="100" cy="42" r="22"/>', '#7a4528') +
    `<circle cx="122" cy="34" r="8" fill="#ff5fa2" ${st(3.5)}/>` +
    body('#ff5fa2') + `<rect x="89" y="138" width="22" height="22" fill="${SKIN.a}" ${st()}/>` +
    `<ellipse cx="100" cy="106" rx="44" ry="46" fill="${SKIN.a}" ${st()}/>` +
    `<path d="M56 102Q58 60 100 60Q142 60 144 102Q128 78 100 82Q78 72 56 102Z" fill="#7a4528" ${st(4)}/>` +
    face(100, 112, 1.1) +
    `<circle cx="56" cy="126" r="5" fill="#ffd23f" ${st(3)}/><circle cx="144" cy="126" r="5" fill="#ffd23f" ${st(3)}/>` +
    heart(160, 56, 1.1)),

  dad: pic('dad', '#c9e6ff',
    body('#2f7bff') + `<path d="M82 156L100 178L118 156Z" fill="#fff" ${st(4)}/>` +
    `<rect x="89" y="136" width="22" height="22" fill="${SKIN.b}" ${st()}/>` +
    `<circle cx="56" cy="108" r="11" fill="${SKIN.b}" ${st()}/><circle cx="144" cy="108" r="11" fill="${SKIN.b}" ${st()}/>` +
    `<ellipse cx="100" cy="104" rx="44" ry="47" fill="${SKIN.b}" ${st()}/>` +
    `<path d="M56 96Q54 48 100 48Q146 48 144 96Q138 70 116 68Q100 80 84 68Q62 70 56 96Z" fill="#3b2a20" ${st(4)}/>` +
    face(100, 100, 1) +
    `<path d="M82 126Q91 117 100 124Q109 117 118 126Q109 134 100 129Q91 134 82 126Z" fill="#3b2a20" ${st(3)}/>` +
    `<circle cx="84" cy="100" r="15" fill="#fff" fill-opacity=".25" ${st(4)}/><circle cx="116" cy="100" r="15" fill="#fff" fill-opacity=".25" ${st(4)}/><path d="M99 99h2" ${st(4)}/>`),

  baby: pic('baby', '#ffeeb0',
    body('#5fd0ff') + `<path d="M76 158Q100 186 124 158Z" fill="#fff" ${st(4)}/>` +
    `<circle cx="46" cy="110" r="11" fill="${SKIN.baby}" ${st()}/><circle cx="154" cy="110" r="11" fill="${SKIN.baby}" ${st()}/>` +
    `<circle cx="100" cy="106" r="56" fill="${SKIN.baby}" ${st()}/>` +
    `<path d="M100 51C90 32 114 26 116 40C117 50 102 50 105 41" fill="none" ${st(4.5)}/>` +
    face(100, 110, 1.25) + star(160, 46, 10) + star(40, 50, 7, '#ff8fc1')),

  hand: pic('hand', '#c4f3d2',
    blob('<rect x="62" y="92" width="78" height="76" rx="32"/><rect x="62" y="44" width="19" height="62" rx="9.5"/><rect x="85" y="32" width="19" height="70" rx="9.5"/><rect x="108" y="36" width="19" height="68" rx="9.5"/><rect x="129" y="54" width="17" height="54" rx="8.5"/><rect x="30" y="104" width="50" height="19" rx="9.5" transform="rotate(-38 58 114)"/>', '#ffcf9e') +
    heart(101, 132, 1.2, '#ff5fa2') + star(166, 40, 10) + star(36, 52, 8, '#fff')),

  eyes: pic('eyes', '#e2d4ff',
    [66, 134].map((x) => `<ellipse cx="${x}" cy="108" rx="30" ry="38" fill="#fff" ${st()}/>` +
      `<circle cx="${x + 4}" cy="114" r="20" fill="#2f9bff"/><circle cx="${x + 4}" cy="114" r="10" fill="${O}"/>` +
      `<circle cx="${x - 3}" cy="105" r="7" fill="#fff"/><circle cx="${x + 11}" cy="123" r="3" fill="#fff"/>` +
      `<path d="M${x - 17} ${77}l-8 -11M${x} ${70}v-14M${x + 17} ${77}l8 -11" fill="none" ${st(4.5)}/>`).join('') +
    star(100, 172, 9) + star(30, 40, 7, '#fff') + star(172, 40, 7, '#fff')),

  nose: pic('nose', '#ffe2cc',
    `<path d="M44 200Q46 170 50 150" fill="none" stroke="#2fbf4a" stroke-width="7" stroke-linecap="round"/>` +
    `<ellipse cx="62" cy="176" rx="12" ry="6" fill="#4fd36a" ${st(3.5)} transform="rotate(-30 62 176)"/>` +
    [0, 72, 144, 216, 288].map((a) => `<circle cx="48" cy="126" r="11" fill="#ff5fa2" ${st(3.5)} transform="rotate(${a} 48 140)"/>`).join('') +
    `<circle cx="48" cy="140" r="9" fill="#ffd23f" ${st(3.5)}/>` +
    `<path d="M92 62Q102 52 112 62M136 62Q146 52 156 62" fill="none" ${st(4.5)}/>` +
    `<ellipse cx="92" cy="80" rx="9" ry="5.5" fill="#ff7aa8" opacity=".75"/><ellipse cx="160" cy="80" rx="9" ry="5.5" fill="#ff7aa8" opacity=".75"/>` +
    blob('<ellipse cx="126" cy="104" rx="28" ry="24"/><circle cx="102" cy="118" r="15"/><circle cx="150" cy="118" r="15"/><ellipse cx="126" cy="122" rx="32" ry="16"/>', '#ffb27d') +
    `<ellipse cx="116" cy="128" rx="6" ry="4" fill="#7a3b2a"/><ellipse cx="136" cy="128" rx="6" ry="4" fill="#7a3b2a"/>` +
    `<ellipse cx="118" cy="96" rx="8" ry="6" fill="#fff" opacity=".65"/>` +
    `<path d="M112 156Q126 166 140 156" fill="none" ${st(4.5)}/>` +
    `<path d="M66 116q6 -6 12 0M70 130q6 -6 12 0" fill="none" ${st(4)}/>`),
  dog: pic('dog', '#ffe1b3',
    `<circle cx="100" cy="104" r="52" fill="#e9b27a" ${st()}/><ellipse cx="121" cy="90" rx="16" ry="14" fill="#c98a55"/>` +
    `<ellipse cx="50" cy="104" rx="17" ry="36" fill="#8a5a3b" ${st()} transform="rotate(18 50 104)"/><ellipse cx="150" cy="104" rx="17" ry="36" fill="#8a5a3b" ${st()} transform="rotate(-18 150 104)"/>` +
    face(100, 90, 1, { mouth: false }) +
    `<ellipse cx="100" cy="124" rx="27" ry="19" fill="#fff3e3" ${st()}/><ellipse cx="100" cy="113" rx="10" ry="7" fill="${O}"/>` +
    `<path d="M96 132Q100 148 108 132Z" fill="#ff7aa8" ${st(3.5)}/><path d="M88 128Q96 136 100 128Q104 136 112 128" fill="none" ${st(4)}/>`),

  cat: pic('cat', '#d4f0ff',
    `<path d="M56 86L60 34L98 64Z" fill="#ffa94d" ${st()}/><path d="M144 86L140 34L102 64Z" fill="#ffa94d" ${st()}/>` +
    `<path d="M64 70L66 48L84 62Z" fill="#ff9fc0"/><path d="M136 70L134 48L116 62Z" fill="#ff9fc0"/>` +
    `<ellipse cx="100" cy="110" rx="58" ry="48" fill="#ffa94d" ${st()}/>` +
    `<path d="M92 66v12M100 64v14M108 66v12" stroke="#e8772e" stroke-width="5" stroke-linecap="round"/>` +
    face(100, 104, 1.1, { mouth: false }) +
    `<path d="M94 116L106 116L100 123Z" fill="#ff7aa8" ${st(3)}/><path d="M100 123Q95 132 88 127M100 123Q105 132 112 127" fill="none" ${st(4)}/>` +
    `<path d="M62 116L34 110M62 124L34 128M138 116L166 110M138 124L166 128" ${st(3.5)}/>`),

  cow: pic('cow', '#d6f5c9',
    `<ellipse cx="70" cy="54" rx="8" ry="15" fill="#fff4c2" ${st(4)} transform="rotate(-30 70 54)"/><ellipse cx="130" cy="54" rx="8" ry="15" fill="#fff4c2" ${st(4)} transform="rotate(30 130 54)"/>` +
    `<ellipse cx="42" cy="92" rx="22" ry="11" fill="#fff" ${st()} transform="rotate(-20 42 92)"/><ellipse cx="158" cy="92" rx="22" ry="11" fill="#fff" ${st()} transform="rotate(20 158 92)"/>` +
    `<ellipse cx="100" cy="100" rx="50" ry="54" fill="#fff" ${st()}/>` +
    `<path d="M62 70Q70 52 90 58Q92 80 70 86Q60 82 62 70Z" fill="${O}"/><circle cx="130" cy="66" r="11" fill="${O}"/>` +
    face(100, 92, 1, { mouth: false }) +
    `<ellipse cx="100" cy="134" rx="40" ry="26" fill="#ffb3c7" ${st()}/><ellipse cx="86" cy="130" rx="5" ry="7" fill="#c2577a"/><ellipse cx="114" cy="130" rx="5" ry="7" fill="#c2577a"/>` +
    `<path d="M90 146Q100 153 110 146" fill="none" ${st(4)}/>`),

  bird: pic('bird', '#ffe4f0',
    tube('M8 166Q100 150 192 170', '#a86b45', 9) + `<ellipse cx="160" cy="152" rx="14" ry="7" fill="#4fd36a" ${st(3.5)} transform="rotate(-25 160 152)"/>` +
    `<path d="M54 96L24 80L32 108Z" fill="#1d7fd6" ${st(4)}/><path d="M90 146v14M110 146v14" stroke="#ff9f1c" stroke-width="5" stroke-linecap="round"/>` +
    `<ellipse cx="100" cy="104" rx="50" ry="46" fill="#3fa9ff" ${st()}/><ellipse cx="108" cy="120" rx="28" ry="22" fill="#bfe6ff"/>` +
    `<path d="M60 104Q64 140 98 132Q86 108 60 104Z" fill="#1d7fd6" ${st(4)}/>` +
    `<path d="M94 60Q88 42 100 46Q104 34 112 50" fill="#3fa9ff" ${st(4)}/>` +
    `<ellipse cx="114" cy="92" rx="6" ry="7.5" fill="${O}"/><circle cx="116" cy="89" r="2.2" fill="#fff"/><ellipse cx="124" cy="108" rx="7" ry="4.5" fill="#ff7aa8" opacity=".8"/>` +
    `<path d="M136 96L158 104L136 113Z" fill="#ff9f1c" ${st(4)}/>`),

  fish: pic('fish', '#c9f1ff',
    `<circle cx="168" cy="52" r="7" fill="none" stroke="#fff" stroke-width="4"/><circle cx="178" cy="30" r="5" fill="none" stroke="#fff" stroke-width="4"/><circle cx="40" cy="40" r="6" fill="none" stroke="#fff" stroke-width="4"/>` +
    `<path d="M56 100L18 70L24 100L18 130Z" fill="#ff7b29" ${st()}/><path d="M90 64Q110 32 134 64Z" fill="#ff7b29" ${st()}/><path d="M100 138Q110 160 124 136Z" fill="#ff7b29" ${st()}/>` +
    `<ellipse cx="104" cy="100" rx="58" ry="42" fill="#ff9f1c" ${st()}/>` +
    `<path d="M80 80q8 8 0 16M80 104q8 8 0 16M98 92q8 8 0 16" fill="none" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/>` +
    `<circle cx="134" cy="90" r="12" fill="#fff" ${st(4)}/><circle cx="136" cy="92" r="6" fill="${O}"/><circle cx="138" cy="89" r="2.2" fill="#fff"/>` +
    `<ellipse cx="136" cy="114" rx="8" ry="5" fill="#ff7aa8" opacity=".8"/><path d="M156 104Q150 110 156 116" fill="none" ${st(4)}/>`),

  butterfly: pic('butterfly', '#fff3c2',
    `<ellipse cx="62" cy="80" rx="38" ry="32" fill="#ff5fa2" ${st()} transform="rotate(-20 62 80)"/><ellipse cx="138" cy="80" rx="38" ry="32" fill="#ff5fa2" ${st()} transform="rotate(20 138 80)"/>` +
    `<ellipse cx="70" cy="134" rx="28" ry="24" fill="#a259ff" ${st()} transform="rotate(20 70 134)"/><ellipse cx="130" cy="134" rx="28" ry="24" fill="#a259ff" ${st()} transform="rotate(-20 130 134)"/>` +
    `<circle cx="56" cy="78" r="11" fill="#ffd23f"/><circle cx="144" cy="78" r="11" fill="#ffd23f"/><circle cx="70" cy="136" r="8" fill="#fff"/><circle cx="130" cy="136" r="8" fill="#fff"/>` +
    `<ellipse cx="100" cy="116" rx="12" ry="42" fill="#4a3a8a" ${st()}/>` +
    `<path d="M94 50Q84 24 72 26M106 50Q116 24 128 26" fill="none" ${st(4)}/><circle cx="72" cy="26" r="5" fill="${O}"/><circle cx="128" cy="26" r="5" fill="${O}"/>` +
    `<circle cx="100" cy="66" r="22" fill="#ffd23f" ${st()}/>` + face(100, 64, 0.62)),

  elephant: pic('elephant', '#d8ecff',
    `<ellipse cx="46" cy="100" rx="34" ry="42" fill="#a9b8d0" ${st()}/><ellipse cx="154" cy="100" rx="34" ry="42" fill="#a9b8d0" ${st()}/>` +
    `<ellipse cx="50" cy="100" rx="20" ry="28" fill="#ffc0d6"/><ellipse cx="150" cy="100" rx="20" ry="28" fill="#ffc0d6"/>` +
    `<ellipse cx="100" cy="96" rx="46" ry="48" fill="#b8c6dc" ${st()}/>` +
    tube('M100 120Q98 170 128 170Q150 170 148 150', '#b8c6dc', 18) +
    `<path d="M92 52q4 -10 8 0M100 50q4 -10 8 0" fill="none" ${st(4)}/>` + face(100, 90, 1, { mouth: false })),

  monkey: pic('monkey', '#fff0c9',
    `<circle cx="42" cy="100" r="19" fill="#8a5a3b" ${st()}/><circle cx="158" cy="100" r="19" fill="#8a5a3b" ${st()}/>` +
    `<circle cx="42" cy="100" r="10" fill="#f2c79a"/><circle cx="158" cy="100" r="10" fill="#f2c79a"/>` +
    `<circle cx="100" cy="102" r="54" fill="#8a5a3b" ${st()}/><path d="M90 50Q100 34 110 50" fill="#8a5a3b" ${st(4)}/>` +
    blob('<circle cx="82" cy="96" r="22"/><circle cx="118" cy="96" r="22"/><ellipse cx="100" cy="128" rx="36" ry="26"/>', '#f2c79a', 6) +
    face(100, 94, 1, { mouth: false }) +
    `<circle cx="94" cy="116" r="2.8" fill="${O}"/><circle cx="106" cy="116" r="2.8" fill="${O}"/><path d="M82 128Q100 148 118 128Z" fill="#ff5a7a" ${st(4)}/>`),

  red: splat('red', '#ff3b3b', '#ffe0e0'),
  blue: splat('blue', '#2f7bff', '#dcebff'),
  yellow: splat('yellow', '#ffd23f', '#dff1ff'),
  green: splat('green', '#2fbf4a', '#e0fbdc'),
  white: splat('white', '#ffffff', '#bfe3ff'),
  black: splat('black', '#1b1430', '#ece4ff', true),

  thankyou: pic('thankyou', '#ffe6c7',
    `<path d="M48 210L58 150L100 158L142 150L152 210Z" fill="#ff5fa2" ${st()}/>` +
    blob('<path d="M100 40Q84 40 78 62L62 140Q60 160 80 162L100 162Z"/><path d="M100 40Q116 40 122 62L138 140Q140 160 120 162L100 162Z"/>', '#ffcf9e') +
    `<path d="M100 44V160" ${st(4)}/>` +
    `<path d="M86 52L82 70M114 52L118 70M80 72L76 92M120 72L124 92" stroke="#e9a774" stroke-width="4" stroke-linecap="round"/>` +
    heart(100, 26, 1.1) + heart(156, 74, 0.9, '#ff8fc1') + heart(44, 74, 0.9, '#ff8fc1') + star(40, 128, 8) + star(162, 126, 8, '#fff')),

  yes: pic('yes', '#d6f8d6',
    `<rect x="72" y="152" width="62" height="60" fill="#2fbf4a" ${st()}/>` +
    blob('<rect x="66" y="92" width="74" height="66" rx="22"/><rect x="72" y="34" width="28" height="74" rx="14"/>', '#ffcf9e') +
    `<path d="M112 110h22M112 126h22M112 142h20" stroke="#e9a774" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="156" cy="54" r="21" fill="#2fbf4a" ${st()}/><path d="M146 54L154 62L168 46" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    star(40, 60, 9)),

  no: pic('no', '#ffe0e0',
    `<path d="M34 86q-10 20 0 40M20 78q-14 28 0 56M166 86q10 20 0 40M180 78q14 28 0 56" fill="none" ${st(4)}/>` +
    `<circle cx="100" cy="108" r="54" fill="#ffd7b5" ${st()}/><path d="M58 92Q60 52 100 52Q140 52 142 92Q126 70 100 74Q74 70 58 92Z" fill="#3b2a20" ${st(4)}/>` +
    `<path d="M74 98L88 104L74 110M126 98L112 104L126 110" fill="none" ${st(5)}/>` +
    `<ellipse cx="72" cy="122" rx="8" ry="5" fill="#ff7aa8" opacity=".75"/><ellipse cx="128" cy="122" rx="8" ry="5" fill="#ff7aa8" opacity=".75"/>` +
    `<path d="M88 136Q100 126 112 136" fill="none" ${st(4.5)}/>` +
    `<circle cx="158" cy="46" r="20" fill="#ff3b5c" ${st()}/><path d="M150 38L166 54M166 38L150 54" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`),

  please: pic('please', '#e8dcff',
    `<rect x="40" y="164" width="120" height="50" fill="#2f9bff" ${st()}/>` +
    blob('<path d="M36 112Q36 172 100 174Q164 172 164 112Q150 124 100 126Q50 124 36 112Z"/><ellipse cx="44" cy="110" rx="11" ry="15"/><ellipse cx="156" cy="110" rx="11" ry="15"/>', '#ffcf9e') +
    `<path d="M100 126V172" ${st(4)}/><path d="M64 134q3 14 0 28M80 138q2 14 0 30M120 138q-2 14 0 30M136 134q-3 14 0 28" fill="none" stroke="#e9a774" stroke-width="4" stroke-linecap="round"/>` +
    star(100, 74, 26) + `<path d="M64 52l-8 -8M136 52l8 -8M100 36v-12" ${st(4)}/>` + heart(48, 60, 0.8, '#ff8fc1')),

  apple: pic('apple', '#ffe2e2',
    `<path d="M100 72Q98 52 108 40" fill="none" ${st(6)}/><ellipse cx="128" cy="50" rx="18" ry="9" fill="#4fd36a" ${st(4)} transform="rotate(-25 128 50)"/>` +
    blob('<circle cx="80" cy="114" r="46"/><circle cx="120" cy="114" r="46"/><ellipse cx="100" cy="140" rx="50" ry="32"/>', '#ff3b3b') +
    `<ellipse cx="68" cy="98" rx="8" ry="15" fill="#fff" opacity=".55" transform="rotate(25 68 98)"/>` + face(100, 118, 1)),

  banana: pic('banana', '#d9f0ff',
    `<path d="M40 56L52 46L60 60Z" fill="#8a5a3b" ${st(4)}/>` +
    `<path d="M48 60Q36 156 124 166Q164 170 176 150Q180 140 168 138Q116 146 90 112Q72 88 68 62Q62 48 48 60Z" fill="#ffd23f" ${st()}/>` +
    `<path d="M168 138L178 146" ${st(6)}/>` +
    `<path d="M58 82Q62 130 104 150" fill="none" stroke="#f2b705" stroke-width="5" stroke-linecap="round"/>` + face(98, 132, 0.62)),

  milk: pic('milk', '#cfe8ff',
    `<path d="M62 78L76 46L124 46L138 78Z" fill="#e8f2ff" ${st()}/><rect x="76" y="32" width="48" height="16" rx="3" fill="#fff" ${st()}/>` +
    `<rect x="62" y="76" width="76" height="102" rx="8" fill="#fff"/><rect x="62" y="124" width="76" height="34" fill="#2f9bff"/>` +
    `<rect x="62" y="76" width="76" height="102" rx="8" fill="none" ${st()}/>` +
    drop(100, 140, 0.8, '#fff') + face(100, 96, 0.8) + star(160, 60, 9, '#fff') + star(36, 140, 8)),

  water: pic('water', '#dff6ff',
    `<path d="M100 28C130 76 154 100 154 130C154 162 130 182 100 182C70 182 46 162 46 130C46 100 70 76 100 28Z" fill="#4cc3ff" ${st()}/>` +
    `<ellipse cx="74" cy="122" rx="7" ry="17" fill="#fff" opacity=".7" transform="rotate(15 74 122)"/>` +
    face(102, 134, 1.1) + drop(38, 62, 1, '#4cc3ff') + drop(164, 74, 0.8, '#4cc3ff')),

  rice: pic('rice', '#ffe9d6',
    `<path d="M80 58q-9 -10 0 -20q9 -10 0 -20M120 58q-9 -10 0 -20q9 -10 0 -20" fill="none" ${st(3.5)} opacity=".45"/>` +
    `<path d="M128 100L178 44" stroke="${O}" stroke-width="11" stroke-linecap="round"/><path d="M128 100L178 44" stroke="#c98a55" stroke-width="5" stroke-linecap="round"/>` +
    blob('<ellipse cx="100" cy="102" rx="56" ry="32"/>', '#fff') +
    [[78, 92], [96, 82], [118, 90], [86, 104], [112, 104], [134, 100], [66, 104]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#ece3cf"/>`).join('') +
    `<rect x="76" y="164" width="48" height="14" rx="5" fill="#e04588" ${st()}/>` +
    `<path d="M36 106Q40 170 100 172Q160 170 164 106Z" fill="#ff5fa2" ${st()}/>` +
    `<circle cx="56" cy="126" r="5" fill="#fff"/><circle cx="144" cy="126" r="5" fill="#fff"/>` + face(100, 128, 0.9)),

  egg: pic('egg', '#d4f5e4',
    `<path d="M100 32C140 32 156 100 156 128C156 162 130 180 100 180C70 180 44 162 44 128C44 100 60 32 100 32Z" fill="#fff7e6" ${st()}/>` +
    `<ellipse cx="76" cy="90" rx="8" ry="16" fill="#fff" transform="rotate(20 76 90)"/>` +
    face(100, 126, 1.1) + star(164, 52, 10) + star(36, 66, 8, '#fff')),

  gift: pic('gift', '#ffd6ec',
    `<rect x="46" y="94" width="108" height="80" rx="8" fill="#a259ff" ${st()}/><rect x="38" y="74" width="124" height="28" rx="8" fill="#b77bff" ${st()}/>` +
    `<rect x="90" y="74" width="20" height="100" fill="#ffd23f" ${st(4)}/>` +
    `<ellipse cx="80" cy="62" rx="22" ry="12" fill="#ffd23f" ${st()} transform="rotate(-20 80 62)"/><ellipse cx="120" cy="62" rx="22" ry="12" fill="#ffd23f" ${st()} transform="rotate(20 120 62)"/>` +
    `<circle cx="100" cy="68" r="9" fill="#ffb703" ${st(4)}/>` + star(34, 48, 10) + star(168, 42, 9, '#fff') + star(166, 150, 8)),
  // Beep, the little robot (for stories and the pets room)
  beep: pic('beep', '#d6f0ff',
    `<path d="M100 42V24" ${st(5)}/><circle cx="100" cy="20" r="9" fill="#ff5fa2" ${st(4)}/>` +
    `<ellipse cx="58" cy="148" rx="10" ry="17" fill="#2f9bff" ${st()} transform="rotate(25 58 148)"/><ellipse cx="142" cy="148" rx="10" ry="17" fill="#2f9bff" ${st()} transform="rotate(-25 142 148)"/>` +
    `<rect x="66" y="122" width="68" height="54" rx="22" fill="#f4f7fb" ${st()}/>` + heart(100, 150, 0.9, '#ff5fa2') +
    `<circle cx="44" cy="84" r="10" fill="#2f9bff" ${st()}/><circle cx="156" cy="84" r="10" fill="#2f9bff" ${st()}/>` +
    `<rect x="46" y="42" width="108" height="84" rx="32" fill="#f4f7fb" ${st()}/>` +
    `<rect x="60" y="55" width="80" height="58" rx="20" fill="#1d2a4a"/>` +
    `<ellipse cx="84" cy="80" rx="8" ry="10" fill="#5ff3ff"/><ellipse cx="116" cy="80" rx="8" ry="10" fill="#5ff3ff"/>` +
    `<circle cx="86" cy="76" r="3" fill="#fff"/><circle cx="118" cy="76" r="3" fill="#fff"/>` +
    `<ellipse cx="72" cy="98" rx="6" ry="4" fill="#ff7aa8" opacity=".8"/><ellipse cx="128" cy="98" rx="6" ry="4" fill="#ff7aa8" opacity=".8"/>` +
    `<path d="M90 96Q100 106 110 96" fill="none" stroke="#5ff3ff" stroke-width="4" stroke-linecap="round"/>`)
};

export const hasArt = (w) => !!ART[w] && w !== 'beep' && w !== 'gift';
// the same picture without its coloured disc: a cut-out character for stories
export const sticker = (w) => (ART[w] || '')
  .replace(/<circle cx="100" cy="100" r="94" fill="[^"]+"\/>/, '')
  .replace(/ clip-path="url\(#c-[^)]+\)"/, '');
