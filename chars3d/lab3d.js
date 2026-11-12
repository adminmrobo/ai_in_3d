// 초파리 연구실 · 3D 캐릭터 모듈 (lab3d.js)
// 캐릭터 9명(+모아 정장)을 three.js 저폴리 툰 모델로 만든다.
// 쓰는 곳: characters3d.html(3D 설정 화면), smart_factory_world(시멘트 공장 World) 등.
//
//   import { createLab3D } from './chars3d/lab3d.js';
//   const lab = createLab3D(THREE, { outline: true, shadow: false });
//   const doc = lab.build('doctor', { expr: 'E13', pose: 'idle', unit: 1 });
//   scene.add(doc);  ...  doc.userData.update(t);   // 걷기·손 인사 같은 움직이는 포즈
//
// 기준: 박사 키 = 1.0 (unit 배수로 키움). 정면 = +Z, 발밑 = y 0.
// 외형 고정값은 specs/{캐릭터}/00_character_core.md, 3D 설정값은 specs/3d/characters3d.json 을 따른다.
// 캐릭터 이름·설정 © 안상선. 그림·모델은 저작권자의 허락 없이 쓸 수 없다.

export const VERSION = '1.0.0';

export const ROSTER = [
  { key: 'doctor', ko: '박사', en: 'Professor', h: 1.00, role: '해설·심판·사회자' },
  { key: 'haru', ko: '조수(하루)', en: 'Haru', h: 0.90, role: '조수 · 실험 진행·기록' },
  { key: 'fruitfly', ko: '초파리 연구원', en: 'Fruit Fly', h: 0.92, role: '라이벌 A "의심" · 검증' },
  { key: 'jupanbot', ko: '주판봇', en: 'AbaBot', h: 0.86, role: '라이벌 B "확신" · 계산' },
  { key: 'sia', no: '005', ko: '시아', en: 'Sia', h: 0.88, role: '메이드 인턴 · 심판·방청객' },
  { key: 'moa', no: '006', ko: '모아', en: 'Moa', h: 0.84, role: '메이드 인턴 · 방청객·심판', variants: ['maid', 'suit'] },
  { key: 'x1', no: '007', ko: '미공개 X1', en: 'Unrevealed X1', h: 0.85, role: '실루엣 · 리본', hidden: true },
  { key: 'x2', no: '008', ko: '미공개 X2', en: 'Unrevealed X2', h: 0.95, role: '실루엣 · 모자', hidden: true },
  { key: 'x3', no: '009', ko: '미공개 X3', en: 'Unrevealed X3', h: 0.60, role: '실루엣 · 꼬마', hidden: true },
];

export const EXPRS = { E13: '기본', E01: '기쁨', E04: '놀람' };
export const POSES = { idle: '서기', wave: '손 인사', explain: '설명', think: '생각', cheer: '환호', hold: '두 손 소품', referee: '심판 신호', walk: '걷기' };
// 8방향: 모델을 시계 반대 방향(위에서 볼 때)으로 45°씩 돌린다. '오른'은 화면 오른쪽을 본다는 뜻.
export const DIRS = [
  { id: 'd0', ko: '정면', yaw: 0 }, { id: 'd1', ko: '오른앞', yaw: 45 }, { id: 'd2', ko: '오른쪽', yaw: 90 }, { id: 'd3', ko: '오른뒤', yaw: 135 },
  { id: 'd4', ko: '뒤', yaw: 180 }, { id: 'd5', ko: '왼뒤', yaw: 225 }, { id: 'd6', ko: '왼쪽', yaw: 270 }, { id: 'd7', ko: '왼앞', yaw: 315 },
];
export const ELEVS = [
  { id: 'e08', ko: '눈높이', deg: 8 },
  { id: 'e32', ko: '공장 시점', deg: 32 },   // smart_factory_world 기본 카메라(68, 60, 68)와 같은 높이각
];

const PI = Math.PI;

export function createLab3D(THREE, cfg = {}) {
  const OUT = cfg.outline !== false;
  const SHADOW = !!cfg.shadow;
  const TOON = cfg.toon !== false;
  const T = cfg.outlineWidth ?? 0.010;
  const { Group, Mesh, Vector3 } = THREE;

  // ---------- 재질 ----------
  const grad = (() => {
    const t = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
  })();
  const mats = new Map();
  function mat(c, o = {}) {
    if (c && c.isMaterial) return c;
    const cacheable = !o.map;
    const k = c + '|' + (cacheable ? JSON.stringify(o) : Math.random());
    if (mats.has(k)) return mats.get(k);
    const { basic, ...r } = o;
    let m;
    if (basic) m = new THREE.MeshBasicMaterial({ color: c, ...r });
    else if (TOON) m = new THREE.MeshToonMaterial({ color: c, gradientMap: grad, ...r });
    else m = new THREE.MeshStandardMaterial({ color: c, roughness: .8, metalness: 0, ...r });
    if (cacheable) mats.set(k, m);
    return m;
  }
  const olMats = new Map();
  const olMat = c => { if (!olMats.has(c)) olMats.set(c, new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide })); return olMats.get(c); };
  const DS = { side: THREE.DoubleSide };

  // ---------- 도형 ----------
  const Sph = (r, w = 16, h = 12, ...a) => new THREE.SphereGeometry(r, w, h, ...a);
  const Cyl = (rt, rb, h, s = 14, open = false, ts = 0, tl = PI * 2) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open, ts, tl);
  const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const Cap = (r, l, s = 12) => new THREE.CapsuleGeometry(r, l, 4, s);
  const Tor = (r, t, rs = 6, ts = 16, arc = PI * 2) => new THREE.TorusGeometry(r, t, rs, ts, arc);
  const Cone = (r, h, s = 10) => new THREE.ConeGeometry(r, h, s);

  let OL = '#2A2528';           // 지금 만드는 캐릭터의 외곽선 색
  const G = (parent, pos = [0, 0, 0], rot) => { const g = new Group(); g.position.set(...pos); if (rot) g.rotation.set(...rot); parent.add(g); return g; };
  function addOutline(m, t = T) {
    const geo = m.geometry; if (!geo.boundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox, sz = new Vector3(), c = new Vector3();
    bb.getSize(sz); bb.getCenter(c);
    const s = m.scale;
    const dims = [sz.x * Math.abs(s.x), sz.y * Math.abs(s.y), sz.z * Math.abs(s.z)];
    if (Math.min(...dims) < 0.006) return;
    const f = dims.map((d, i) => 1 + 2 * t / d);
    const o = new Mesh(geo, olMat(OL));
    o.scale.set(f[0], f[1], f[2]);
    o.position.set(c.x * (1 - f[0]), c.y * (1 - f[1]), c.z * (1 - f[2]));
    o.userData.outline = true; o.raycast = () => {};
    m.add(o);
  }
  // P(부모, 도형, 색, 위치, {r: 회전, s: 크기, m: 재질옵션, ol: 외곽선, nb: 키 계산 제외})
  function P(parent, geo, c, pos = [0, 0, 0], o = {}) {
    const m = new Mesh(geo, mat(c, o.m || {}));
    m.position.set(...pos);
    if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2], o.ro || 'XYZ');
    if (o.s != null) (typeof o.s === 'number' ? m.scale.setScalar(o.s) : m.scale.set(...o.s));
    if (SHADOW) { m.castShadow = true; m.receiveShadow = false; }   // 자기 그림자는 받지 않음(툰 얼굴이 어두워지지 않게)
    if (o.nb) m.userData.nb = true;
    parent.add(m);
    if (OUT && o.ol !== false) addOutline(m, o.olT);
    return m;
  }
  const flat = (parent, c, pos, w, h, d = .012, o = {}) => P(parent, Sph(1, 16, 10), c, pos, { s: [w, h, d], ol: false, ...o });

  // ---------- 캔버스 텍스처 ----------
  function canvasTex(w, h, draw, smooth) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv);
    t.magFilter = smooth ? THREE.LinearFilter : THREE.NearestFilter;
    t.minFilter = smooth ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const texCache = {};
  function screenTex(expr) {   // 주판봇 화면 얼굴 — 민트 픽셀 블록만
    const k = 'scr' + expr; if (texCache[k]) return texCache[k];
    return texCache[k] = canvasTex(32, 24, (g) => {
      g.fillStyle = '#17352C'; g.fillRect(0, 0, 32, 24);
      g.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < 24; y += 2) g.fillRect(0, y, 32, 1);
      const red = expr === 'E03';
      g.fillStyle = red ? '#FF5A4A' : '#5BEFA5';
      const px = (x, y, w = 1, h = 1) => g.fillRect(x, y, w, h);
      if (expr === 'E01') {           // ^ ^ 눈, 큰 미소
        [[8], [20]].forEach(([x]) => { px(x, 9); px(x + 1, 8); px(x + 2, 7, 1, 1); px(x + 3, 8); px(x + 4, 9); });
        px(10, 15, 12, 1); px(11, 16, 10, 1); px(12, 17, 8, 1);
      } else if (expr === 'E04') {    // 동그란 눈, O 입
        [[7], [19]].forEach(([x]) => { px(x + 1, 5, 4, 1); px(x + 1, 11, 4, 1); px(x, 6, 1, 5); px(x + 5, 6, 1, 5); px(x + 2, 8, 2, 2); });
        px(14, 15, 4, 1); px(14, 19, 4, 1); px(13, 16, 1, 3); px(18, 16, 1, 3);
      } else {                         // 기본: 둥근 세로 눈 + 작은 미소
        [[9], [20]].forEach(([x]) => { px(x + 1, 6, 2, 1); px(x, 7, 4, 5); px(x + 1, 12, 2, 1); });
        g.fillStyle = 'rgba(23,53,44,.9)'; px(10, 8, 1, 1); px(21, 8, 1, 1);
        g.fillStyle = red ? '#FF5A4A' : '#5BEFA5';
        px(12, 16); px(13, 17, 6, 1); px(19, 16);
      }
    });
  }
  function flyEyeTex() {
    if (texCache.fly) return texCache.fly;
    return texCache.fly = canvasTex(64, 32, (g, w, h) => {
      g.fillStyle = '#D8352A'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 3) for (let x = (y / 3) % 2 ? 1 : 0; x < w; x += 3) { g.fillStyle = 'rgba(90,10,10,.45)'; g.fillRect(x, y, 1, 1); }
      g.fillStyle = 'rgba(255,170,150,.55)'; g.fillRect(0, 6, w, 2);
    });
  }
  function checkTex() {
    if (texCache.chk) return texCache.chk;
    return texCache.chk = canvasTex(16, 16, (g) => {
      g.fillStyle = '#A8323C'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#2C3A66'; g.fillRect(3, 0, 2, 16); g.fillRect(11, 0, 2, 16); g.fillRect(0, 3, 16, 2); g.fillRect(0, 11, 16, 2);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(7, 0, 1, 16); g.fillRect(0, 7, 16, 1);
    });
  }

  // ---------- 사람형 뼈대 ----------
  function humanoid(o) {
    const d = Object.assign({
      skin: '#F6D3B8', headR: .2, neckY: .565, hipY: .30, shY: .525, shX: .135,
      torsoTop: .102, torsoBot: .112, torsoCol: '#888', torsoD: .78,
      sleeve: '#eee', fore: null, cuff: null, hand: null, shoulderCol: null,
      legCol: '#333', legR: .042, sock: null, sockH: 0, shoe: '#222', shoeH: .05, legLen: .25,
      upLen: .12, foreLen: .11, armR: .034, ears: true, headS: 1,
    }, o);
    const root = new Group(), body = G(root);
    const hips = G(body, [0, d.hipY, 0]);
    const torso = G(hips);
    const th = d.shY - d.hipY + .03;
    P(torso, Cyl(d.torsoTop, d.torsoBot, th, 18), d.torsoCol, [0, th / 2 - .01, 0], { s: [1, 1, d.torsoD] });
    P(torso, Cyl(.034, .04, .07, 10), d.skin, [0, d.neckY - d.hipY - .02, 0], { ol: false });
    const head = G(torso, [0, d.neckY - d.hipY, 0]);
    const hs = G(head); hs.scale.setScalar(d.headS);
    const R = d.headR, hc = new Vector3(0, R * .92, 0);
    P(hs, Sph(R, 28, 20), d.skin, hc.toArray(), { s: [1, .96, .97] });
    if (d.ears) [-1, 1].forEach(k => P(hs, Sph(.035, 10, 8), d.skin, [k * R * .96, hc.y - .015, -.01], { s: [.55, 1, .8] }));
    const arms = {};
    [['R', -1], ['L', 1]].forEach(([n, k]) => {
      const sh = G(torso, [k * d.shX, d.shY - d.hipY, 0]);
      P(sh, Sph(d.armR * 1.3, 12, 10), d.shoulderCol || d.sleeve, [0, -.005, 0]);
      P(sh, Cyl(d.armR, d.armR * .95, d.upLen, 10), d.sleeve, [0, -d.upLen / 2, 0]);
      const el = G(sh, [0, -d.upLen, 0]);
      P(el, Sph(d.armR * .96, 10, 8), d.fore || d.sleeve, [0, 0, 0], { ol: false });
      P(el, Cyl(d.armR * .95, d.armR * 1.08, d.foreLen, 10), d.fore || d.sleeve, [0, -d.foreLen / 2, 0]);
      if (d.cuff) P(el, Cyl(d.armR * 1.22, d.armR * 1.22, .026, 10), d.cuff, [0, -d.foreLen + .013, 0]);
      const hand = G(el, [0, -d.foreLen - .028, 0]);
      P(hand, Sph(.036, 12, 10), d.hand || d.skin, [0, 0, 0], { s: [.9, 1.05, .82] });
      arms[n] = { sh, el, hand, k };
    });
    const legs = {};
    [['R', -1], ['L', 1]].forEach(([n, k]) => {
      const lg = G(hips, [k * .052, 0, 0]);
      P(lg, Cyl(d.legR, d.legR * .9, d.legLen, 10), d.legCol, [0, -d.legLen / 2, 0]);
      if (d.sock) P(lg, Cyl(d.legR * 1.05, d.legR * .95, d.sockH, 10), d.sock, [0, -d.legLen + d.sockH / 2, 0]);
      P(lg, Box(.074, d.shoeH, .112), d.shoe, [0, -d.legLen - d.shoeH / 2 + .012, .018]);
      legs[n] = { lg, k };
    });
    return { root, body, hips, torso, head, hs, hc, R, arms, legs, d, props: [] };
  }

  // 얼굴 위 한 점(az: 옆으로, el: 위로, r: 머리 중심에서 거리) — 그 점의 +Z가 바깥쪽
  function anchor(rig, az, el, r) {
    const g = new Group(); g.position.copy(rig.hc); g.rotation.set(-el, az, 0, 'YXZ'); rig.hs.add(g);
    const f = new Group(); f.position.z = r ?? rig.R * .965; g.add(f); return f;
  }

  // 코트(앞이 열린 원통) — y0·y1은 엉덩이 기준 높이
  function coat(rig, c, { top = .118, bot = .17, y0 = -.16, y1 = .235, gap = .95, dz = .82, lapel = true, back = 0 } = {}) {
    const h = y1 - y0;
    P(rig.torso, Cyl(top, bot, h, 26, true, gap / 2, PI * 2 - gap), c, [0, (y0 + y1) / 2, back], { s: [1, 1, dz], m: DS });
    if (lapel) [-1, 1].forEach(k => P(rig.torso, Box(.034, .11, .012), c, [k * .045, y1 - .06, top * dz + .002], { r: [-.12, 0, k * .32] }));
  }
  function skirt(rig, c, { top = .112, bot = .2, y0 = -.08, y1 = .03, dz = .85 } = {}) {
    const h = y1 - y0;
    P(rig.torso, Cyl(top, bot, h, 26, true), c, [0, (y0 + y1) / 2, 0], { s: [1, 1, dz], m: DS });
  }
  function apron(rig, c, { top = .118, bot = .205, y0 = -.075, y1 = .03, dz = .86, arc = 1.9, bib = true, frill = true } = {}) {
    const h = y1 - y0;
    P(rig.torso, Cyl(top, bot, h, 22, true, -arc / 2, arc), c, [0, (y0 + y1) / 2, 0], { s: [1, 1, dz], m: DS });
    if (frill) P(rig.torso, Cyl(bot + .008, bot + .018, .03, 22, true, -arc / 2 - .03, arc + .06), c, [0, y0 - .008, 0], { s: [1, 1, dz], m: DS });
    if (bib) P(rig.torso, Box(.12, .12, .014), c, [0, .135, rig.d.torsoTop * rig.d.torsoD + .006], { r: [-.06, 0, 0] });
    P(rig.torso, Cyl(rig.d.torsoBot + .006, rig.d.torsoBot + .006, .028, 20, true), c, [0, .055, 0], { s: [1, 1, rig.d.torsoD + .03], m: DS });
  }
  function backBow(rig, c, y = .06, s = 1) {
    const z = -(rig.d.torsoBot * rig.d.torsoD) - .02;
    const g = G(rig.torso, [0, y, z]); g.scale.setScalar(s);
    [-1, 1].forEach(k => {
      P(g, Sph(.06, 12, 10), c, [k * .062, .01, -.01], { s: [1, .62, .38], r: [0, 0, k * .25] });
      P(g, Box(.035, .13, .012), c, [k * .035, -.075, -.004], { r: [0, 0, k * .22] });
    });
    P(g, Sph(.026, 10, 8), c, [0, .006, -.012]);
  }
  function neckBow(rig, c, { y = .245, s = 1, map } = {}) {
    const z = rig.d.torsoTop * rig.d.torsoD + .018;
    const g = G(rig.torso, [0, y, z]); g.scale.setScalar(s);
    const m = map ? { map } : {};
    [-1, 1].forEach(k => P(g, Sph(.038, 12, 10), map ? '#fff' : c, [k * .038, 0, 0], { s: [1, .7, .45], r: [0, 0, k * .2], m }));
    P(g, Sph(.016, 10, 8), map ? '#fff' : c, [0, 0, .006], { m });
    return g;
  }
  // 머리카락
  const hairCap = (rig, c, { r = 1.085, tl = .56, z = -.012, y = .004, ts = 0 } = {}) =>
    P(rig.hs, Sph(rig.R * r, 30, 18, 0, PI * 2, ts, PI * tl), c, [0, rig.hc.y + y, z], { m: DS });
  function bangs(rig, c, list) {   // list: [az, el, w, h, rotZ]
    list.forEach(([az, el, w, h, rz = 0]) => {
      const f = anchor(rig, az, el, rig.R * 1.0);
      P(f, Sph(1, 12, 10), c, [0, 0, 0], { s: [w, h, .035], r: [0, 0, rz], ol: false });
    });
  }
  function hairBack(rig, c, { len = .42, w = .2, d = .075, z = -.13, y = -.13 } = {}) {
    return P(rig.hs, Cap(1, 1, 14), c, [0, rig.hc.y + y, z], { s: [w, len / 3, d] });
  }

  // ---------- 얼굴 ----------
  const MOUTH = '#7A2E35';
  function eyeArc(rig, az, el, c = '#2A2528', r = .033, up = true) {
    const f = anchor(rig, az, el);
    P(f, Tor(r, .0085, 6, 14, PI), c, [0, up ? -r * .4 : r * .4, .004], { r: [0, 0, up ? 0 : PI], ol: false });
  }
  function eyeAnime(rig, k, o) {
    const { az = .34, el = -.03, w = .05, h = .062, iris = '#3E7BD6', surprise = false, lid = 0, lash = '#2A2528' } = o;
    const f = anchor(rig, k * az, el);
    const sw = surprise ? w * 1.08 : w, shh = surprise ? h * 1.1 : h;
    flat(f, '#FFFFFF', [0, 0, -.004], sw, shh, .012, { m: { basic: true } });
    const is = surprise ? .55 : 1;
    flat(f, iris, [0, -h * .06, 0], w * .78 * is, h * .82 * is, .014);
    flat(f, '#1E1A22', [0, -h * .1, .002], w * .36 * is, h * .4 * is, .016);
    flat(f, '#FFFFFF', [-k * w * .28, h * .3, .005], w * .26, h * .2, .018, { m: { basic: true } });
    P(f, Box(w * 2.2, .013, .012), lash, [0, shh * .98 - lid * h, .004], { r: [0, 0, k * -.12], ol: false });
    if (lid > 0) flat(f, rig.d.skin, [0, shh * (1.05 - lid * .5), .003], w * 1.12, h * lid * .9, .02);
  }
  function mouth(rig, expr, { el = -.38, w = .03, open = false, c = MOUTH } = {}) {
    const f = anchor(rig, 0, el);
    if (expr === 'E04') { P(f, Tor(w * .55, .008, 6, 16), c, [0, 0, .004], { ol: false }); return; }
    if (expr === 'E01' || open) {
      P(f, new THREE.CircleGeometry(w * 1.15, 18, PI, PI), c, [0, .006, .008], { ol: false, m: DS });
      P(f, new THREE.CircleGeometry(w * .6, 12, PI, PI), '#E07A80', [0, -.008, .009], { ol: false, m: DS });
      return;
    }
    P(f, Tor(w, .0075, 6, 14, PI), c, [0, w * .35, .004], { r: [0, 0, PI], ol: false });
  }
  function blush(rig, c = '#F2A0A8', az = .52, el = -.2) {
    [-1, 1].forEach(k => { const f = anchor(rig, k * az, el); flat(f, c, [0, 0, .002], .034, .018, .01, { m: { transparent: true, opacity: .6 } }); });
  }
  function brows(rig, c, { el = .2, az = .33, w = .07, h = .022, tilt = .15, expr } = {}) {
    [-1, 1].forEach(k => {
      const f = anchor(rig, k * az, el + (expr === 'E04' ? .05 : 0));
      P(f, Box(w, h, .02), c, [0, 0, .006], { r: [0, 0, k * (expr === 'E04' ? -.1 : tilt)], ol: false });
    });
  }

  // ---------- 소품 ----------
  function book(parent, c = '#7A4A2A') {
    const g = G(parent, [.0, -.035, .03], [0, -.2, 0]);
    P(g, Box(.036, .13, .1), c, [0, 0, 0]);
    P(g, Box(.03, .122, .006), '#F2EEE4', [0, 0, .05], { ol: false });
    return g;
  }
  function card(parent, c = '#F2C744') {
    const g = G(parent, [0, -.07, .0]);
    P(g, Box(.06, .085, .008), c, [0, 0, 0]);
    return g;
  }
  function docs(parent) {
    const g = G(parent, [0, -.03, .03], [0, -.15, 0]);
    P(g, Box(.012, .14, .1), '#F7F5EF', [0, 0, 0]);
    P(g, Box(.006, .14, .1), '#1F1F24', [-.008, 0, 0]);
    return g;
  }
  function pen(parent) {
    const g = G(parent, [0, -.03, .02], [.6, 0, 0]);
    P(g, Cyl(.006, .006, .09, 8), '#1F1F24', [0, 0, 0], { ol: false });
    return g;
  }
  function abacus(parent, pos) {
    const g = G(parent, pos);
    const W = .26, H = .17, D = .045, wood = '#8B5A2B', bead = '#D2603C';
    P(g, Box(W, .022, D), wood, [0, H / 2, 0]); P(g, Box(W, .022, D), wood, [0, -H / 2, 0]);
    P(g, Box(.022, H + .022, D), wood, [-W / 2, 0, 0]); P(g, Box(.022, H + .022, D), wood, [W / 2, 0, 0]);
    P(g, Box(W - .02, .012, D * .9), '#5E3B1C', [0, H * .22, 0], { ol: false });
    const n = 7;
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + .03 + i * (W - .06) / (n - 1);
      P(g, Cyl(.003, .003, H, 6), '#C9B48A', [x, 0, 0], { ol: false });
      const up = i % 2 === 0;
      P(g, Sph(.017, 10, 6), bead, [x, up ? H * .36 : H * .3, 0], { s: [1, .62, 1], olT: .004 });
      for (let j = 0; j < 4; j++) P(g, Sph(.017, 10, 6), bead, [x, (j < (i % 4) + 1 ? .02 : -.0) - .02 - j * .02 - (j >= (i % 4) + 1 ? .015 : 0), 0], { s: [1, .62, 1], olT: .004 });
    }
    return g;
  }

  // =========================================================
  // 캐릭터별 모델
  // =========================================================
  const B = {};

  // ---- 박사 ----
  B.doctor = (o) => {
    OL = '#2A2528';
    const coatC = '#EFEDEF', ink = '#2A2528';
    const rig = humanoid({ skin: '#F6D3B8', torsoCol: ink, sleeve: coatC, cuff: null, legCol: ink, shoe: '#1A1719', legR: .044 });
    // 셔츠·넥타이
    const z0 = rig.d.torsoTop * rig.d.torsoD;
    P(rig.torso, Box(.07, .1, .012), '#F4F2F0', [0, .19, z0 - .004], { r: [-.12, 0, 0] });
    P(rig.torso, Box(.022, .1, .01), '#141214', [0, .17, z0 + .006], { r: [-.12, 0, 0] });
    P(rig.torso, Box(.03, .022, .014), '#141214', [0, .225, z0 + .002]);
    [-1, 1].forEach(k => P(rig.torso, Sph(.006, 6, 6), '#55505a', [k * .03, .06 + .035, z0 + .006], { ol: false }));
    coat(rig, coatC, { y0: -.17, y1: .235, bot: .175 });
    [-1, 1].forEach(k => P(rig.torso, Box(.05, .04, .01), '#E2DFE2', [k * .1, -.05, .13], { r: [0, k * .55, 0], ol: false }));
    // 머리: 숯색 뾰족 머리 + 앞머리 흰 줄 + 뒤 꽁지머리
    hairCap(rig, ink, { tl: .5, z: -.018 });
    const spikes = [[0, .95, .0], [.5, .8, .2], [-.5, .8, -.2], [1.0, .55, .35], [-1.0, .55, -.35], [1.5, .3, .5], [-1.5, .3, -.5], [2.2, .45, .4], [-2.2, .45, -.4], [2.8, .55, .1], [PI, .35, 0], [2.5, .05, .2], [-2.5, .05, -.2]];
    spikes.forEach(([az, el, tw]) => {
      const a = anchor(rig, az, el, rig.R * .95);
      P(a, Cone(.06, .15, 8), ink, [0, 0, .045], { r: [PI / 2, 0, tw] });
    });
    { const a = anchor(rig, -.28, .82, rig.R * .97); P(a, Cone(.045, .14, 8), '#F1F0F0', [0, 0, .05], { r: [PI / 2 - .3, 0, -.4] }); }
    bangs(rig, ink, [[-.45, .5, .07, .05, .4], [.0, .55, .08, .05, 0], [.45, .5, .07, .05, -.4], [-.7, .3, .04, .07, .2], [.7, .3, .04, .07, -.2]]);
    [-1, 1].forEach(k => { const a = anchor(rig, k * 1.35, .02, rig.R * .99); P(a, Box(.03, .09, .02), ink, [0, 0, 0]); });
    { const a = anchor(rig, PI, -.45, rig.R * .95); P(a, Cone(.035, .12, 8), ink, [0, -.02, .04], { r: [PI / 2 + .9, 0, 0] }); }
    // 안경(청록 사각 테) — 모든 표정에서 유지
    const teal = '#1E6E73';
    [-1, 1].forEach(k => {
      const a = anchor(rig, k * .34, -.04, rig.R * 1.04);
      P(a, Tor(.05, .0075, 4, 4), teal, [0, 0, 0], { r: [0, 0, PI / 4], s: [1.05, .8, 1], ol: false });
    });
    { const a = anchor(rig, 0, -.02, rig.R * 1.03); P(a, Box(.03, .007, .007), teal, [0, 0, 0], { ol: false }); }
    // 눈·눈썹·입
    if (o.expr === 'E04') [-1, 1].forEach(k => { const f = anchor(rig, k * .34, -.04); flat(f, '#1A1719', [0, 0, .004], .014, .02); });
    else [-1, 1].forEach(k => eyeArc(rig, k * .34, -.05, '#1A1719', .026));
    brows(rig, '#1A1719', { el: .2, az: .33, w: .075, h: .026, tilt: o.expr === 'E01' ? .05 : .12, expr: o.expr });
    mouth(rig, o.expr, { el: -.36, w: .034, open: o.expr === 'E01' });
    if (o.prop !== false) rig.props.push({ g: book(rig.arms.L.hand), hideIn: ['cheer', 'hold', 'think'] });
    return rig;
  };

  // ---- 조수(하루) ----
  B.haru = (o) => {
    OL = '#2E2430';
    const coatC = '#F0EEF2', pink = '#E9909A', pink2 = '#D9707E', navy = '#1E2F5C', lav = '#A99AC8';
    const rig = humanoid({ skin: '#F6D3B8', torsoCol: lav, sleeve: coatC, legCol: '#4A6AAE', shoe: '#B9AEDB', legR: .042 });
    [-1, 1].forEach(k => P(rig.legs[k < 0 ? 'R' : 'L'].lg, Cyl(.047, .047, .03, 10), '#7E98D0', [0, -.215, 0]));
    [-1, 1].forEach(k => P(rig.legs[k < 0 ? 'R' : 'L'].lg, Box(.078, .014, .116), '#F4F4F4', [0, -.292, .018], { ol: false }));
    const z0 = rig.d.torsoTop * rig.d.torsoD;
    P(rig.torso, Box(.07, .05, .012), '#FFFFFF', [0, .2, z0 - .002], { ol: false });
    [-1, 1].forEach(k => P(rig.torso, Cyl(.004, .004, .08, 6), '#FFFFFF', [k * .02, .15, z0 + .01], { ol: false }));
    P(rig.torso, Box(.12, .045, .02), lav, [0, .02, z0 - .006], { ol: false });
    P(rig.torso, Tor(.07, .028, 8, 16, PI * 1.2), lav, [0, .235, -.035], { r: [PI / 2 + .25, 0, -PI * .1] });
    coat(rig, coatC, { y0: -.19, y1: .235, bot: .17 });
    // 머리
    hairCap(rig, pink, { tl: .55 });
    hairBack(rig, pink, { len: .5, w: .21, d: .08, y: -.17, z: -.1 });
    { const a = anchor(rig, PI, -.4, rig.R * 1.25); P(a, Box(.04, .38, .012), navy, [0, -.12, -.02], { r: [.18, 0, 0], ol: false }); }
    [-1, 1].forEach(k => {   // 옆머리 (가슴까지)
      const a = anchor(rig, k * 1.05, -.25, rig.R * 1.0);
      P(a, Cap(.045, .3, 10), pink, [0, -.13, -.01], { r: [0, 0, k * .08] });
    });
    bangs(rig, pink, [[-.62, .32, .07, .085, .5], [-.32, .45, .08, .08, .25], [.32, .45, .08, .08, -.25], [.62, .32, .07, .085, -.5]]);
    bangs(rig, navy, [[0, .42, .055, .095, 0]]);
    [-1, 1].forEach(k => {   // 정수리 번 2개
      const b = G(rig.hs, [k * .14, rig.hc.y + .16, -.03]);
      P(b, Sph(.072, 16, 12), pink, [0, 0, 0]);
      P(b, Tor(.05, .012, 6, 16), pink2, [0, -.03, 0], { r: [PI / 2, 0, 0], ol: false });
    });
    { const a = anchor(rig, .1, 1.1, rig.R * 1.05); P(a, Cone(.012, .07, 6), pink, [0, 0, .03], { r: [PI / 2 - .5, 0, .3] }); }
    // 얼굴
    if (o.expr === 'E01') [-1, 1].forEach(k => eyeArc(rig, k * .34, -.06, '#2A2528', .032));
    else [-1, 1].forEach(k => eyeAnime(rig, k, { iris: '#3E7BD6', surprise: o.expr === 'E04' }));
    mouth(rig, o.expr, { el: -.4, w: .026 });
    blush(rig);
    if (o.prop !== false) rig.props.push({ g: book(rig.arms.L.hand, '#6E6A74'), hideIn: ['cheer', 'hold', 'think'] });
    return rig;
  };

  // ---- 시아 ----
  B.sia = (o) => {
    OL = '#1E1B22';
    const dress = '#34363F', apr = '#F4F2EE', hair = '#1E1B22', hair2 = '#4A4656', ribbon = '#8C8C94';
    const rig = humanoid({ skin: '#F6D9C4', torsoCol: dress, sleeve: dress, shoulderCol: dress, cuff: apr, legCol: '#F4F2EE', shoe: '#18171C', legR: .036, legLen: .25 });
    skirt(rig, dress, { top: .112, bot: .21, y0: -.235, y1: .03 });
    apron(rig, apr, { y0: -.225, y1: .03, bot: .21, arc: 1.75 });
    [-1, 1].forEach(k => P(rig.torso, Box(.02, .13, .01), apr, [k * .055, .17, .06], { r: [-.1, 0, 0], ol: false }));
    [-1, 1].forEach(k => P(rig.arms[k < 0 ? 'R' : 'L'].sh, Sph(.058, 14, 10), dress, [0, -.02, 0]));
    P(rig.torso, Cyl(.04, .046, .045, 14), apr, [0, .258, 0], { ol: false });
    neckBow(rig, ribbon, { y: .235, s: 1.25 });
    backBow(rig, apr, .05, 1.25);
    // 머리: 새까만 생머리, 옆으로 흘린 앞머리
    hairCap(rig, hair, { tl: .56 });
    hairBack(rig, hair, { len: .52, w: .215, d: .08, y: -.18, z: -.1 });
    { const a = anchor(rig, PI, .3, rig.R * 1.08); flat(a, hair2, [0, 0, .004], .07, .03, .01); }
    [-1, 1].forEach(k => { const a = anchor(rig, k * .95, -.3, rig.R * 1.0); P(a, Cap(.028, .3, 8), hair, [0, -.12, .0]); });
    bangs(rig, hair, [[-.62, .36, .06, .08, .7], [-.28, .55, .1, .06, .9], [.12, .58, .1, .055, .9], [.48, .45, .07, .07, .6]]);
    [-1, 1].forEach(k => { const a = anchor(rig, k * 1.45, -.3, rig.R * .98); P(a, Sph(.008, 6, 6), '#C9CCD6', [0, -.02, 0], { ol: false }); P(a, Sph(.011, 8, 6), '#D9DCE6', [0, -.042, 0], { s: [1, 1.3, 1], ol: false }); });
    if (o.expr === 'E01') [-1, 1].forEach(k => eyeArc(rig, k * .34, -.06, '#1E1B22', .03));
    else [-1, 1].forEach(k => eyeAnime(rig, k, { iris: '#7A7680', h: .056, surprise: o.expr === 'E04', lid: o.expr === 'E04' ? 0 : .25, lash: '#1E1B22' }));
    mouth(rig, o.expr, { el: -.4, w: .022 });
    blush(rig, '#F0B0B4');
    if (o.prop !== false) rig.props.push({ g: card(rig.arms.R.hand), showIn: ['referee'] });
    return rig;
  };

  // ---- 모아 (메이드 / 정장) ----
  B.moa = (o) => {
    OL = '#3A2A1E';
    const suit = o.variant === 'suit';
    const hair = '#D8C09A', hair2 = '#B89C74', apr = '#FAF8F4', cardi = '#D4B48A';
    const rig = suit
      ? humanoid({ skin: '#F8DCC8', torsoCol: '#1F1F24', sleeve: '#1F1F24', cuff: '#F7F5EF', legCol: '#F1D2BE', shoe: '#18171C', legR: .036 })
      : humanoid({ skin: '#F8DCC8', torsoCol: '#FFFFFF', sleeve: cardi, cuff: '#C29E70', legCol: '#F8DCC8', sock: '#FFFFFF', sockH: .17, shoe: '#7A4A2A', legR: .037 });
    const z0 = rig.d.torsoTop * rig.d.torsoD;
    if (suit) {
      skirt(rig, '#1F1F24', { top: .112, bot: .16, y0: -.13, y1: .03 });
      P(rig.torso, Box(.06, .09, .012), '#FFFFFF', [0, .2, z0 - .002], { r: [-.1, 0, 0] });
      [-1, 1].forEach(k => P(rig.torso, Box(.035, .025, .012), '#FFFFFF', [k * .03, .25, z0 + .004], { r: [0, 0, k * .5], ol: false }));
      [-1, 1].forEach(k => P(rig.torso, Box(.034, .12, .012), '#2A2A30', [k * .04, .17, z0 + .006], { r: [-.1, 0, k * .28] }));
      P(rig.torso, Sph(.007, 6, 6), '#55505a', [0, .06, z0 + .01], { ol: false });
      coat(rig, '#1F1F24', { y0: -.05, y1: .235, bot: .13, gap: .5, lapel: false });
    } else {
      skirt(rig, '#22222A', { top: .112, bot: .2, y0: -.15, y1: .03 });
      apron(rig, apr, { y0: -.14, y1: .03, bot: .2, arc: 1.6 });
      [-1, 1].forEach(k => P(rig.arms[k < 0 ? 'R' : 'L'].sh, Sph(.06, 14, 8, 0, PI * 2, 0, PI * .5), apr, [0, .0, 0], { s: [1, .8, 1.1], m: DS }));
      coat(rig, cardi, { y0: .0, y1: .235, bot: .13, top: .116, gap: 1.0, lapel: false });
      P(rig.torso, Box(.1, .03, .01), '#FFFFFF', [0, .245, z0 - .004], { ol: false });
      neckBow(rig, '#A8323C', { y: .225, s: 1.0, map: checkTex() });
      backBow(rig, apr, .03, 1.1);
    }
    // 머리: 애쉬 베이지 긴 머리, 가지런한 앞머리
    hairCap(rig, hair, { tl: .56 });
    if (suit) {
      P(rig.hs, Sph(.055, 12, 10), hair, [0, rig.hc.y - .12, -.19]);
      P(rig.hs, Tor(.035, .014, 8, 14), '#E98AAE', [0, rig.hc.y - .1, -.205], { r: [.3, 0, 0] });
      P(rig.hs, Cap(.045, .2, 10), hair, [0, rig.hc.y - .27, -.2], { r: [.15, 0, 0] });
      [-1, 1].forEach(k => { const a = anchor(rig, k * 1.0, -.3, rig.R * 1.0); P(a, Cap(.02, .12, 8), hair, [0, -.05, 0]); });
    } else {
      hairBack(rig, hair, { len: .5, w: .22, d: .085, y: -.17, z: -.1 });
      for (let i = 0; i < 5; i++) P(rig.hs, Sph(.05, 10, 8), i % 2 ? hair2 : hair, [-.16 + i * .08, rig.hc.y - .37, -.11], { s: [1, 1.2, .9] });
      [-1, 1].forEach(k => { const a = anchor(rig, k * 1.0, -.28, rig.R * 1.0); P(a, Cap(.04, .3, 10), hair, [0, -.13, -.01]); });
      // 흰 프릴 머리띠 + 왼쪽 리본
      const hb = G(rig.hs, [0, rig.hc.y + .005, -.03], [-.42, 0, 0]);
      P(hb, Tor(rig.R * 1.08, .016, 6, 24, PI), apr, [0, 0, 0]);
      for (let i = 0; i < 9; i++) { const t = .15 + i * (PI - .3) / 8; P(hb, Sph(.024, 8, 6), apr, [Math.cos(t) * rig.R * 1.1, Math.sin(t) * rig.R * 1.1, .012], { s: [1, 1, .6] }); }
      const rb = G(rig.hs, [rig.R * 1.0, rig.hc.y + .05, -.02]);
      [-1, 1].forEach(k => P(rb, Sph(.025, 10, 8), apr, [0, k * .022, 0], { s: [.5, 1, .7], r: [k * .4, 0, 0] }));
      P(rb, Box(.012, .09, .02), apr, [.005, -.06, 0], { r: [0, 0, .2] });
    }
    bangs(rig, hair, [[-.6, .32, .07, .085, .3], [-.3, .45, .09, .07, .1], [0, .48, .09, .065, 0], [.3, .45, .09, .07, -.1], [.6, .32, .07, .085, -.3]]);
    if (suit) [-1, 1].forEach(k => { const a = anchor(rig, k * 1.45, -.28, rig.R * .98); P(a, Sph(.009, 6, 6), '#D9DCE6', [0, -.02, 0], { ol: false }); });
    if (o.expr === 'E01') [-1, 1].forEach(k => eyeArc(rig, k * .34, -.06, '#3A2A1E', .033));
    else [-1, 1].forEach(k => eyeAnime(rig, k, { iris: '#B07A3E', w: .054, h: .066, surprise: o.expr === 'E04', lash: '#3A2A1E' }));
    mouth(rig, o.expr, { el: -.4, w: .026, open: !suit && o.expr === 'E13' });
    blush(rig, '#F29AA4');
    if (o.prop !== false) {
      if (suit) { rig.props.push({ g: docs(rig.arms.L.hand), hideIn: ['cheer'] }); rig.props.push({ g: pen(rig.arms.R.hand), hideIn: ['cheer', 'wave', 'referee'] }); }
      rig.props.push({ g: card(rig.arms.R.hand, '#E5534B'), showIn: ['referee'] });
    }
    return rig;
  };

  // ---- 주판봇 ----
  B.jupanbot = (o) => {
    OL = '#2E2A24';
    const beige = '#EADFC6', beige2 = '#D9CCAE', gray = '#9C978C', dark = '#55524C';
    const root = new Group(), body = G(root);
    const hips = G(body, [0, .12, 0]);
    const torso = G(hips);
    // 무한궤도 2개
    [-1, 1].forEach(k => {
      const t = G(body, [k * .1, .05, 0]);
      P(t, Cap(.045, .13, 10), '#4A4842', [0, 0, 0], { r: [PI / 2, 0, 0], s: [1.1, 1, 1] });
      for (let i = 0; i < 3; i++) P(t, Cyl(.03, .03, .075, 12), gray, [0, 0, -.065 + i * .065], { r: [0, 0, PI / 2], ol: false });
      for (let i = 0; i < 8; i++) P(t, Box(.105, .01, .016), '#33312C', [0, .052, -.09 + i * .026], { ol: false });
    });
    P(torso, Box(.25, .13, .18), beige, [0, .045, 0]);
    P(torso, Box(.15, .05, .01), beige2, [0, .04, -.092], { ol: false });
    const head = G(torso, [0, .11, 0]);
    const hs = G(head);
    P(hs, Box(.36, .3, .3), beige, [0, .15, 0]);
    P(hs, Box(.34, .02, .28), beige2, [0, .005, 0], { ol: false });
    P(hs, Box(.3, .23, .02), '#3A3730', [0, .16, .148], { ol: false });
    const scr = P(hs, new THREE.PlaneGeometry(.27, .2), '#ffffff', [0, .16, .16], { ol: false, m: { basic: true, map: screenTex(o.expr) } });
    scr.userData.screen = true;
    // 뒤: 통풍구·포트
    for (let i = 0; i < 9; i++) P(hs, Box(.012, .09, .006), '#6A655B', [-.12 + i * .03, .2, -.152], { ol: false });
    P(hs, Box(.05, .025, .006), '#4A4842', [-.08, .08, -.152], { ol: false });
    P(hs, Box(.05, .025, .006), '#4A4842', [.08, .08, -.152], { ol: false });
    [-1, 1].forEach(k => { for (let i = 0; i < 5; i++) P(hs, Box(.006, .08, .012), '#B9AD92', [k * .181, .2, -.08 + i * .03], { ol: false }); });
    // 안테나: 받침 + 막대 + 주판알 하나
    P(hs, Box(.05, .025, .05), gray, [0, .312, 0]);
    P(hs, Cyl(.006, .006, .11, 6), '#5E5A52', [0, .38, 0], { ol: false });
    P(hs, Cone(.026, .022, 10), '#D2603C', [0, .446, 0]);
    P(hs, Cone(.026, .022, 10), '#D2603C', [0, .424, 0], { r: [PI, 0, 0] });
    // 마디형 팔
    const arms = {};
    [['R', -1], ['L', 1]].forEach(([n, k]) => {
      const sh = G(torso, [k * .14, .07, 0]);
      P(sh, Sph(.032, 10, 8), dark, [0, 0, 0]);
      for (let i = 0; i < 3; i++) P(sh, Cyl(.026, .026, .022, 10), i % 2 ? gray : '#88837A', [0, -.025 - i * .026, 0]);
      const el = G(sh, [0, -.1, 0]);
      for (let i = 0; i < 3; i++) P(el, Cyl(.026, .026, .022, 10), i % 2 ? '#88837A' : gray, [0, -.012 - i * .026, 0]);
      const hand = G(el, [0, -.1, 0]);
      P(hand, Sph(.042, 12, 10), gray, [0, 0, 0], { s: [1, .9, .85] });
      arms[n] = { sh, el, hand, k };
    });
    const rig = { root, body, hips, torso, head, hs, hc: new Vector3(0, .15, 0), R: .16, arms, legs: {}, d: { skin: beige }, props: [], robot: true };
    if (o.prop !== false) rig.props.push({ g: abacus(torso, [0, .03, .19]), showIn: ['idle', 'hold', 'explain', 'think', 'walk'] });
    rig.defaultPose = 'hold';
    return rig;
  };

  // ---- 초파리 연구원 ----
  B.fruitfly = (o) => {
    OL = '#121014';
    const blk = '#1E1C20', blk2 = '#2E2B33', coatC = '#E6E2E6', navy = '#23467E';
    const rig = humanoid({ skin: blk, torsoCol: blk2, sleeve: blk, legCol: blk, shoe: blk, legR: .028, armR: .026, ears: false, headR: .165, neckY: .56, upLen: .12, foreLen: .12, shoeH: .03 });
    // 다리 관절(무릎) 표시·발끝
    ['R', 'L'].forEach(n => { const lg = rig.legs[n].lg; P(lg, Sph(.034, 10, 8), blk, [0, -.13, .005]); P(lg, Cone(.02, .06, 6), blk, [0, -.27, .07], { r: [PI / 2, 0, 0] }); });
    ['R', 'L'].forEach(n => { const h = rig.arms[n].hand; P(h, Cone(.014, .04, 6), blk, [.012, -.035, .01], { r: [.2, 0, .3] }); P(h, Cone(.014, .04, 6), blk, [-.012, -.035, .01], { r: [.2, 0, -.3] }); });
    // 가운데 다리 한 쌍(작게)
    [-1, 1].forEach(k => { const g = G(rig.torso, [k * .1, .06, 0], [0, 0, k * 1.1]); P(g, Cyl(.018, .016, .1, 8), blk, [0, -.05, 0]); P(g, Cyl(.014, .012, .07, 8), blk, [k * -.02, -.11, 0], { r: [0, 0, k * -.7] }); });
    // 배(마디)
    for (let i = 0; i < 3; i++) P(rig.torso, Sph(.1 - i * .015, 14, 10), i % 2 ? blk2 : blk, [0, -.06 - i * .045, -.03 - i * .01], { s: [1, .55, .85] });
    const z0 = rig.d.torsoTop * rig.d.torsoD;
    P(rig.torso, Box(.08, .12, .012), '#141214', [0, .15, z0 + .002], { r: [-.1, 0, 0] });
    coat(rig, coatC, { y0: -.12, y1: .235, bot: .16 });
    // 날개
    [-1, 1].forEach(k => {
      const w = G(rig.torso, [k * .05, .14, -.13], [.3, k * .5, k * -.5]);
      P(w, Sph(1, 18, 10), '#DAD6F2', [k * .1, -.05, 0], { s: [.12, .2, .008], ol: false, m: { transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide } });
      P(w, Box(.004, .3, .004), '#9A93C0', [k * .07, -.04, .004], { r: [0, 0, k * .35], ol: false, m: { transparent: true, opacity: .7 } });
    });
    // 머리 · 겹눈 · 헬멧 · 케이블
    const R = rig.R, hc = rig.hc;
    [-1, 1].forEach(k => {
      const a = anchor(rig, k * .78, .02, R * .72);
      P(a, Sph(.1, 20, 14), '#ffffff', [0, 0, 0], { s: [1, 1.05, .95], m: { map: flyEyeTex() } });
      flat(a, '#FFFFFF', [-k * .03, .045, .09], .02, .014, .01, { m: { basic: true } });
      if (o.expr === 'E01') P(a, Sph(.104, 16, 8, 0, PI * 2, 0, PI * .42), blk, [0, .004, 0], { s: [1, 1.05, .95], ol: false });
      if (o.expr === 'E04') flat(a, '#1E1A22', [0, 0, .1], .018, .018, .01);
    });
    P(rig.hs, Sph(R * 1.12, 26, 14, 0, PI * 2, 0, PI * .5), navy, [0, hc.y + .02, -.01]);
    P(rig.hs, Tor(R * 1.12, .012, 6, 26), '#18325C', [0, hc.y + .02, -.01], { r: [PI / 2, 0, 0], ol: false });
    P(rig.hs, Tor(R * 1.135, .016, 6, 18, PI), '#D8B048', [0, hc.y + .02, -.01], { r: [0, PI / 2, 0], ol: false });
    P(rig.hs, Tor(R * 1.14, .006, 6, 18, PI), '#F4F2EE', [.024, hc.y + .02, -.01], { r: [0, PI / 2, 0], ol: false });
    [-1, 1].forEach(k => P(rig.hs, Cyl(.03, .03, .015, 12), '#8A8F9A', [k * R * 1.1, hc.y + .02, -.02], { r: [0, 0, PI / 2] }));
    { const a = anchor(rig, 0, -.55, R * .9); P(a, Cyl(.012, .006, .07, 8), '#2A2730', [0, -.02, .02], { r: [.5, 0, 0], ol: false }); }
    if (o.expr === 'E01') { const a = anchor(rig, 0, -.38, R * .98); P(a, Tor(.022, .006, 6, 12, PI), '#C9AFC0', [0, .008, .004], { r: [0, 0, PI], ol: false }); }
    const cables = [['#B4407E', -.06, .0], ['#3A6FC0', .06, .02], ['#7A4FA8', -.02, -.04], ['#B4407E', .03, .05]];
    cables.forEach(([c, x, dz], i) => {
      const pts = [new Vector3(x, hc.y + .14, -R * .7), new Vector3(x * 2.4, hc.y + .2 + i * .02, -R * 1.5 + dz), new Vector3(x * 3, hc.y - .05, -R * 1.9), new Vector3(x * 2, hc.y - .25, -R * 1.5 + dz)];
      const curve = new THREE.CatmullRomCurve3(pts);
      P(rig.hs, new THREE.TubeGeometry(curve, 20, .011, 6), c, [0, 0, 0], { ol: false, nb: true });
    });
    [-1, 1].forEach(k => {   // 짧은 더듬이(케이블과 같은 자홍)
      const pts = [new Vector3(k * .05, hc.y + .16, .06), new Vector3(k * .09, hc.y + .28, .04), new Vector3(k * .13, hc.y + .3, -.02)];
      P(rig.hs, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, .009, 6), k < 0 ? '#B4407E' : '#3A6FC0', [0, 0, 0], { ol: false, nb: true });
    });
    if (o.prop !== false) rig.props.push({ g: book(rig.arms.L.hand, '#7A4A2A'), hideIn: ['cheer', 'hold', 'think'] });
    return rig;
  };

  // ---- 미공개 X1~X3 (실루엣) ----
  const SIL = '#1B1A2E', RIM = '#4B4470';
  function silFace(rig, o, az = .3, el = -.06) {
    [-1, 1].forEach(k => {
      const f = anchor(rig, k * az, el);
      if (o.expr === 'E01') P(f, Tor(.022, .007, 6, 12, PI), '#FFFFFF', [0, -.006, .005], { ol: false, m: { basic: true } });
      else {
        const s = o.expr === 'E04' ? 1.3 : 1;
        flat(f, '#FFFFFF', [0, 0, .004], .022 * s, .026 * s, .01, { m: { basic: true } });
        flat(f, '#FFFFFF', [-.006, .01, .012], .006, .006, .004, { m: { basic: true } });
      }
      const b = anchor(rig, k * (az + .2), el - .14);
      flat(b, '#E9909A', [0, 0, .003], .022, .011, .008, { m: { basic: true } });
    });
    if (o.expr === 'E04') { const f = anchor(rig, 0, -.36); P(f, Tor(.012, .005, 6, 12), '#FFFFFF', [0, 0, .004], { ol: false, m: { basic: true } }); }
  }
  function silBase(extra = {}) {
    OL = RIM;
    return humanoid(Object.assign({ skin: SIL, torsoCol: SIL, sleeve: SIL, legCol: SIL, shoe: SIL, hand: SIL, ears: false }, extra));
  }
  B.x1 = (o) => {
    const rig = silBase({ legR: .036 });
    skirt(rig, SIL, { bot: .18, y0: -.12, y1: .03 });
    coat(rig, SIL, { y0: -.15, y1: .235, bot: .16 });
    hairCap(rig, SIL, { tl: .56 });
    hairBack(rig, SIL, { len: .25, w: .19, d: .07, y: -.06, z: -.09 });
    bangs(rig, SIL, [[-.45, .38, .09, .08, .3], [0, .45, .1, .07, 0], [.45, .38, .09, .08, -.3]]);
    const pt = G(rig.hs, [rig.R * .85, rig.hc.y + .1, -.06], [0, 0, -.5]);
    P(pt, Cap(.055, .32, 10), SIL, [.03, -.2, 0], { r: [0, 0, .25] });
    const bow = G(rig.hs, [rig.R * .8, rig.hc.y + .14, -.05], [0, .4, -.3]);
    [-1, 1].forEach(k => P(bow, Sph(.05, 12, 10), '#E9709A', [0, 0, k * .05], { s: [.4, .7, 1] }));
    P(bow, Sph(.02, 8, 6), '#E9709A', [0, 0, 0]);
    silFace(rig, o);
    return rig;
  };
  B.x2 = (o) => {
    const rig = silBase({ legR: .042 });
    coat(rig, SIL, { y0: -.19, y1: .235, bot: .17 });
    hairCap(rig, SIL, { tl: .58 });
    bangs(rig, SIL, [[-.5, .32, .08, .08, .3], [0, .4, .1, .06, 0], [.5, .32, .08, .08, -.3]]);
    [-1, 1].forEach(k => { const a = anchor(rig, k * 1.3, -.1, rig.R * 1.0); P(a, Box(.04, .1, .03), SIL, [0, -.02, 0]); });
    const beret = G(rig.hs, [0, rig.hc.y + .14, -.01], [-.15, 0, .2]);
    P(beret, Sph(.24, 22, 12), SIL, [0, 0, 0], { s: [1, .38, 1] });
    P(beret, Cyl(.012, .016, .04, 8), SIL, [0, .1, 0]);
    [-1, 1].forEach(k => {
      const a = anchor(rig, k * .32, -.05, rig.R * 1.04);
      P(a, Tor(.045, .006, 6, 20), RIM, [0, 0, 0], { ol: false });
      flat(a, '#3FC8C0', [-.014, .012, .004], .009, .009, .004, { m: { basic: true } });
      flat(a, '#3FC8C0', [.012, -.012, .004], .005, .005, .004, { m: { basic: true } });
    });
    silFace(rig, o, .32, -.06);
    return rig;
  };
  B.x3 = (o) => {
    const rig = silBase({ headR: .21, neckY: .45, hipY: .2, shY: .41, legLen: .16, legR: .04, upLen: .1, foreLen: .1, armR: .04, torsoTop: .1, torsoBot: .13 });
    coat(rig, SIL, { y0: -.16, y1: .215, bot: .18, top: .12, gap: .7 });
    // 소매가 손을 덮음
    ['R', 'L'].forEach(n => P(rig.arms[n].el, Cyl(.045, .062, .1, 10), SIL, [0, -.12, 0]));
    // 고양이 귀 후드
    P(rig.hs, Sph(rig.R * 1.16, 26, 18, 0, PI * 2, 0, PI * .78), SIL, [0, rig.hc.y + .005, -.03], { r: [-.35, 0, 0], m: DS });
    [-1, 1].forEach(k => { const a = anchor(rig, k * .6, .85, rig.R * 1.08); P(a, Cone(.07, .12, 4), SIL, [0, 0, .04], { r: [PI / 2 - .2, 0, 0] }); });
    [-1, 1].forEach(k => {
      P(rig.torso, Cyl(.004, .004, .14, 6), '#8A7A3A', [k * .035, .16, .1], { ol: false });
      P(rig.torso, Sph(.022, 10, 8), '#F2C744', [k * .035, .085, .105], { olT: .006 });
    });
    silFace(rig, o, .32, -.08);
    return rig;
  };

  // ---------- 포즈 ----------
  function armSet(rig, n, { out = .12, fwd = 0, bend = 0, elz = 0, tw = 0 } = {}) {
    const a = rig.arms[n]; if (!a) return;
    const s = n === 'R' ? -1 : 1;
    a.sh.rotation.set(-fwd, tw * s, s * out);
    a.el.rotation.set(-bend, 0, s * elz);
  }
  function resetPose(rig) {
    ['R', 'L'].forEach(n => armSet(rig, n, { out: rig.robot ? .05 : .12 }));
    Object.values(rig.legs).forEach(l => l.lg.rotation.set(0, 0, 0));
    rig.head.rotation.set(0, 0, 0); rig.hips.rotation.set(0, 0, 0); rig.torso.rotation.set(0, 0, 0);
    rig.body.position.y = rig.baseY || 0;
  }
  const POSE_FN = {
    idle(r) {},
    wave(r, t) { armSet(r, 'R', { out: 2.25, fwd: .15, elz: .65 + Math.sin(t * 7) * .35 }); r.head.rotation.z = -.06; },
    explain(r) { armSet(r, 'R', { out: .3, fwd: 1.25, bend: .35 }); armSet(r, 'L', { out: .14, fwd: .35, bend: .6 }); r.head.rotation.y = -.12; },
    think(r) { armSet(r, 'R', { out: .02, fwd: .6, bend: 2.25, tw: .2 }); armSet(r, 'L', { out: -.15, fwd: .45, bend: 1.3 }); r.head.rotation.z = .12; },
    cheer(r, t) { armSet(r, 'R', { out: 2.65, elz: .25 }); armSet(r, 'L', { out: 2.65, elz: .25 }); r.body.position.y = (r.baseY || 0) + Math.abs(Math.sin(t * 5)) * .025; },
    hold(r) { armSet(r, 'R', { out: -.2, fwd: .6, bend: .95 }); armSet(r, 'L', { out: -.2, fwd: .6, bend: .95 }); },
    referee(r) { armSet(r, 'R', { out: 3.0, fwd: .1 }); armSet(r, 'L', { out: .14 }); },
    walk(r, t) {
      const p = Math.sin(t * 6);
      Object.values(r.legs).forEach(l => { l.lg.rotation.x = l.k * p * .5; });
      armSet(r, 'R', { out: .12, fwd: -p * .45 }); armSet(r, 'L', { out: .12, fwd: p * .45 });
      if (r.robot) { armSet(r, 'R', { out: -.2, fwd: .6, bend: .95 }); armSet(r, 'L', { out: -.2, fwd: .6, bend: .95 }); }
      r.body.position.y = (r.baseY || 0) + Math.abs(Math.cos(t * 6)) * .015;
    },
  };
  function applyPose(rig, name, t = 0) {
    resetPose(rig);
    if (rig.robot && name === 'idle') name = 'hold';
    (POSE_FN[name] || POSE_FN.idle)(rig, t);
    rig.props.forEach(p => {
      let v = true;
      if (p.showIn) v = p.showIn.includes(name);
      if (p.hideIn && p.hideIn.includes(name)) v = false;
      p.g.visible = v;
    });
  }

  // ---------- 조립 ----------
  function measure(root) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3(), tmp = new THREE.Box3();
    root.traverse(m => {
      if (!m.isMesh || m.userData.outline || m.userData.nb) return;
      let p = m, skip = false; while (p) { if (p.visible === false) { skip = true; break; } p = p.parent; }
      if (skip) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      tmp.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); box.union(tmp);
    });
    return box;
  }
  function build(key, o = {}) {
    const info = ROSTER.find(r => r.key === key);
    if (!info || !B[key]) throw new Error('lab3d: 모르는 캐릭터 ' + key);
    const opt = { expr: 'E13', pose: null, prop: true, variant: (info.variants || [])[0], unit: 1, ...o };
    if (!EXPRS[opt.expr]) opt.expr = 'E13';
    const rig = B[key](opt);
    const root = rig.root;
    applyPose(rig, 'idle', 0);
    const props = rig.props.map(p => p.g.visible); rig.props.forEach(p => { p.g.visible = false; });
    const box = measure(root);
    rig.props.forEach((p, i) => { p.g.visible = props[i]; });
    rig.baseY = -box.min.y; rig.body.position.y = rig.baseY;
    const natural = box.max.y - box.min.y;
    const s = info.h / natural * opt.unit;
    root.scale.setScalar(s);
    let cur = opt.pose || rig.defaultPose || 'idle';
    applyPose(rig, cur, 0);
    root.name = 'lab3d:' + key;
    root.userData = {
      key, info, opt, rig, scale: s,
      setPose(name) { cur = name; applyPose(rig, cur, 0); },
      getPose: () => cur,
      update(t) { if (cur === 'walk' || cur === 'wave' || cur === 'cheer') applyPose(rig, cur, t); },
    };
    return root;
  }
  function dispose(root) {
    root.traverse(m => { if (m.isMesh && m.geometry) m.geometry.dispose(); });
  }

  return { VERSION, ROSTER, EXPRS, POSES, DIRS, ELEVS, build, dispose, keys: ROSTER.map(r => r.key) };
}
