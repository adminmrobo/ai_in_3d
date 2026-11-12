// 신경망 연구소 · 층별 실험 (27종). 실험 화면은 2D 캔버스에 그려 3D 방 안의 스크린에 붙인다.
// 숫자는 모두 이 파일 안에서 실제로 계산한다. 단순화한 곳은 각 실험의 note 에 적었다.
export const W = 880, H = 552;
const C = { bg: '#0e1836', fg: '#e9edf9', mu: '#9aa7c7', a: '#6fb1ff', b: '#ff9f6b', y: '#ffd76a', p: '#ff8fc7', g: '#7fe0a8', r: '#ff6b5e', ln: '#2c3a66' };
const TAU = Math.PI * 2, sig = x => 1 / (1 + Math.exp(-x)), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const gauss = r => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(TAU * r());
const f2 = (v, n = 2) => Number(v).toFixed(n);

/* ---------- 그리기 ---------- */
function T(g, s, x, y, size = 24, col = C.fg, al = 'left') { g.font = '700 ' + size + 'px "Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif'; g.fillStyle = col; g.textAlign = al; g.fillText(s, x, y); }
function clear(g, title) { g.fillStyle = C.bg; g.fillRect(0, 0, W, H); g.strokeStyle = '#3a4a7c'; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4); if (title) T(g, title, 26, 44, 28, C.y); }
const PR = { x: 30, y: 66, w: 500, h: 460 };            // 2D 평면 그림 자리 (좌표 −1.2~1.2)
const mx = (R, x) => R.x + (x + 1.2) / 2.4 * R.w, my = (R, y) => R.y + (1.2 - y) / 2.4 * R.h;
function field(g, R, fn, nx = 40, ny = 36) {
  const cw = R.w / nx, ch = R.h / ny;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const v = clamp(fn(-1.2 + 2.4 * (i + .5) / nx, 1.2 - 2.4 * (j + .5) / ny), 0, 1);
    g.fillStyle = 'rgb(' + Math.round(26 + v * 120) + ',' + Math.round(56 + v * 18) + ',' + Math.round(120 - v * 80) + ')';
    g.fillRect(R.x + i * cw, R.y + j * ch, cw + 1, ch + 1);
  }
  g.strokeStyle = C.ln; g.lineWidth = 2; g.strokeRect(R.x, R.y, R.w, R.h);
}
function pts(g, R, data, ring) {
  data.forEach((d, k) => { g.beginPath(); g.arc(mx(R, d.x), my(R, d.y), 8, 0, TAU); g.fillStyle = d.c ? C.b : C.a; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke();
    if (ring && ring[k]) { g.beginPath(); g.arc(mx(R, d.x), my(R, d.y), 14, 0, TAU); g.strokeStyle = C.y; g.lineWidth = 3; g.stroke(); } });
}
function big(g, label, val, y, col = C.fg) { T(g, label, 560, y, 22, C.mu); T(g, val, 560, y + 46, 44, col); }
function grid(g, v, n, x, y, cell, mode) {       // mode: 0 = 0~1 밝기, 1 = −1/+1
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    let t = v[i * n + j]; if (mode === 1) t = (t + 1) / 2; t = clamp(t, 0, 1);
    g.fillStyle = 'rgb(' + Math.round(24 + t * 231) + ',' + Math.round(34 + t * 181) + ',' + Math.round(70 + t * 36) + ')';
    g.fillRect(x + j * cell, y + i * cell, cell - 2, cell - 2);
  }
}
function bars(g, v, x, y, w, h, col, maxv, labels) {
  const n = v.length, bw = w / n; g.strokeStyle = C.ln; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w, y + h); g.stroke();
  v.forEach((t, i) => { const hh = clamp(Math.abs(t) / maxv, 0, 1) * h; g.fillStyle = Array.isArray(col) ? col[i] : col; g.fillRect(x + i * bw + 3, y + h - hh, bw - 6, hh);
    if (labels) T(g, labels[i], x + i * bw + bw / 2, y + h + 24, 18, C.mu, 'center'); });
}
function chart(g, R, series, ymin, ymax, marks) {
  g.strokeStyle = C.ln; g.lineWidth = 2; g.strokeRect(R.x, R.y, R.w, R.h);
  const y0 = R.y + R.h - (0 - ymin) / (ymax - ymin) * R.h; g.beginPath(); g.moveTo(R.x, y0); g.lineTo(R.x + R.w, y0); g.stroke();
  (marks || []).forEach(m => { const x = R.x + m[0] * R.w; g.setLineDash([6, 6]); g.strokeStyle = m[2] || C.mu; g.beginPath(); g.moveTo(x, R.y); g.lineTo(x, R.y + R.h); g.stroke(); g.setLineDash([]); T(g, m[1], x + 6, R.y + 22, 18, m[2] || C.mu); });
  series.forEach(s => { g.beginPath(); s.v.forEach((t, i) => { const x = R.x + i / (s.v.length - 1) * R.w, y = R.y + R.h - (clamp(t, ymin, ymax) - ymin) / (ymax - ymin) * R.h; i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.setLineDash(s.dash ? [8, 8] : []); g.strokeStyle = s.c; g.lineWidth = s.w || 4; g.stroke(); g.setLineDash([]); });
  let lx = R.x + 8; series.forEach(s => { if (!s.n) return; g.fillStyle = s.c; g.fillRect(lx, R.y + R.h + 12, 22, 6); T(g, s.n, lx + 28, R.y + R.h + 24, 18, C.mu); lx += 44 + g.measureText(s.n).width; });
}

/* ---------- 데이터 ---------- */
function blobs(seed, cs, sd, n) { const r = rng(seed), o = []; cs.forEach(c => { for (let i = 0; i < n; i++) o.push({ x: clamp(c[0] + gauss(r) * sd, -1.15, 1.15), y: clamp(c[1] + gauss(r) * sd, -1.15, 1.15), c: c[2] }); }); return o; }
const dLin = (sd = .19) => blobs(11, [[-.45, -.35, 0], [.45, .4, 1]], sd, 15);
const dXor = () => blobs(5, [[-.55, -.55, 1], [.55, .55, 1], [-.55, .55, 0], [.55, -.55, 0]], .17, 8);
function rings(seed, spec) { const r = rng(seed), o = []; spec.forEach(s => { for (let i = 0; i < s[2]; i++) { const a = r() * TAU, d = s[0] + r() * (s[1] - s[0]); o.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, c: s[3] }); } }); return o; }
const dCirc = () => rings(7, [[0, .38, 18, 1], [.75, 1.0, 26, 0]]);
const dRing3 = () => rings(9, [[0, .28, 14, 0], [.5, .7, 22, 1], [.95, 1.12, 26, 0]]);
const acc = (data, fn) => data.filter(d => (fn(d.x, d.y) > .5 ? 1 : 0) === d.c).length / data.length;

/* ---------- 작은 계산 도구 ---------- */
class MLP {
  constructor(sz, seed) { const r = rng(seed); this.sz = sz; this.Wt = []; this.B = [];
    for (let l = 0; l < sz.length - 1; l++) { this.Wt.push([]); this.B.push([]); for (let j = 0; j < sz[l + 1]; j++) { this.B[l].push((r() * 2 - 1) * .3); this.Wt[l].push(Array.from({ length: sz[l] }, () => (r() * 2 - 1) * 1.6)); } } }
  fwd(x) { const a = [x], L = this.sz.length - 1; for (let l = 0; l < L; l++) { const o = []; for (let j = 0; j < this.sz[l + 1]; j++) { let z = this.B[l][j]; for (let i = 0; i < this.sz[l]; i++) z += this.Wt[l][j][i] * a[l][i]; o.push(l < L - 1 ? Math.tanh(z) : sig(z)); } a.push(o); } return a; }
  out(x, y) { return this.fwd([x, y]).at(-1)[0]; }
  train(data, lr) { const L = this.sz.length - 1, gW = this.Wt.map(l => l.map(r => r.map(() => 0))), gB = this.B.map(l => l.map(() => 0)); let loss = 0;
    for (const d of data) { const a = this.fwd([d.x, d.y]), p = clamp(a[L][0], 1e-7, 1 - 1e-7); loss += -(d.c * Math.log(p) + (1 - d.c) * Math.log(1 - p)); let del = [a[L][0] - d.c];
      for (let l = L - 1; l >= 0; l--) { const pv = new Array(this.sz[l]).fill(0); for (let j = 0; j < this.sz[l + 1]; j++) { gB[l][j] += del[j]; for (let i = 0; i < this.sz[l]; i++) { gW[l][j][i] += del[j] * a[l][i]; pv[i] += del[j] * this.Wt[l][j][i]; } } if (l > 0) del = pv.map((v, i) => v * (1 - a[l][i] * a[l][i])); } }
    const n = data.length; for (let l = 0; l < L; l++) for (let j = 0; j < this.sz[l + 1]; j++) { this.B[l][j] -= lr * gB[l][j] / n; for (let i = 0; i < this.sz[l]; i++) this.Wt[l][j][i] -= lr * gW[l][j][i] / n; }
    return loss / n; }
}
function solve(A, b) { const n = b.length; A = A.map(r => r.slice()); b = b.slice();
  for (let i = 0; i < n; i++) { let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k; [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    const d = A[i][i] || 1e-12; for (let k = i + 1; k < n; k++) { const f = A[k][i] / d; if (!f) continue; for (let j = i; j < n; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; } }
  const x = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / (A[i][i] || 1e-12); } return x; }
function ridge(Phi, y, lam) { const m = Phi[0].length, A = Array.from({ length: m }, () => new Array(m).fill(0)), b = new Array(m).fill(0);
  Phi.forEach((row, k) => { for (let i = 0; i < m; i++) { b[i] += row[i] * y[k]; for (let j = 0; j < m; j++) A[i][j] += row[i] * row[j]; } }); for (let i = 0; i < m; i++) A[i][i] += lam; return solve(A, b); }

/* ---------- 5×5 그림과 주성분(선형 오토인코더) ---------- */
const GN = ['ㄱ', 'ㄴ', 'ㅁ', '+', 'X', 'T', 'ㅡ', 'ㅣ', 'ㄷ', '/', 'ㅗ', '\\'];
const GS = ['1111100001000010000100001', '1000010000100001000011111', '1111110001100011000111111', '0010000100111110010000100', '1000101010001000101010001', '1111100100001000010000100',
  '0000000000111110000000000', '0010000100001000010000100', '1111110000100001000011111', '0000100010001000100010000', '0010000100001000010011111', '1000001000001000001000001'];
const GL = GS.map(s => [...s].map(Number));
const PCA = (() => { const n = GL.length, mean = new Array(25).fill(0); GL.forEach(v => v.forEach((t, i) => mean[i] += t / n));
  const X = GL.map(v => v.map((t, i) => t - mean[i])); let Cv = Array.from({ length: 25 }, (_, i) => Array.from({ length: 25 }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0) / n));
  const pcs = [], lam = [], r = rng(3);
  for (let k = 0; k < 10; k++) { let v = Array.from({ length: 25 }, () => r() - .5), l = 0; for (let it = 0; it < 120; it++) { const w = Cv.map(row => row.reduce((s, t, j) => s + t * v[j], 0)); l = Math.hypot(...w) || 1e-12; v = w.map(t => t / l); }
    pcs.push(v); lam.push(l); Cv = Cv.map((row, i) => row.map((t, j) => t - l * v[i] * v[j])); }
  const enc = (v, k) => pcs.slice(0, k).map(p => p.reduce((s, t, i) => s + t * (v[i] - mean[i]), 0));
  const dec = c => mean.map((m, i) => clamp(m + c.reduce((s, t, k) => s + t * pcs[k][i], 0), 0, 1));
  return { mean, pcs, lam, enc, dec }; })();
const mae = (a, b) => a.reduce((s, t, i) => s + Math.abs(t - b[i]), 0) / a.length;

/* ---------- 잡음 제거 오토인코더 (25-10-25, 실제 학습) ---------- */
let _dae; const DAEN = x => (_dae ||= mkDAE())(x);
const mkDAE = (() => { const r = rng(12), H = 10, W1 = Array.from({ length: H }, () => Array.from({ length: 25 }, () => (r() - .5) * .4)), b1 = new Array(H).fill(0), W2 = Array.from({ length: 25 }, () => Array.from({ length: H }, () => (r() - .5) * .4)), b2 = new Array(25).fill(0);
  const fwd = x => { const h = W1.map((w, j) => sig(b1[j] + w.reduce((t, v, i) => t + v * x[i], 0))), o = W2.map((w, k) => sig(b2[k] + w.reduce((t, v, j) => t + v * h[j], 0))); return { h, o }; };
  for (let it = 0; it < 9000; it++) { const v = GL[it % 12], x = v.map(t => r() < .15 ? 1 - t : t), { h, o } = fwd(x), d2 = o.map((t, k) => t - v[k]), d1 = h.map((t, j) => t * (1 - t) * d2.reduce((a, d, k) => a + d * W2[k][j], 0)), lr = .25;
    for (let k = 0; k < 25; k++) { b2[k] -= lr * d2[k]; for (let j = 0; j < H; j++) W2[k][j] -= lr * d2[k] * h[j]; } for (let j = 0; j < H; j++) { b1[j] -= lr * d1[j]; for (let i = 0; i < 25; i++) W1[j][i] -= lr * d1[j] * x[i]; } }
  return x => fwd(x).o; });

/* ---------- 볼츠만 계열 ---------- */
class RBM {
  constructor(nv, nh, seed) { this.r = rng(seed); this.nv = nv; this.nh = nh; this.Wt = Array.from({ length: nh }, () => Array.from({ length: nv }, () => (this.r() - .5) * .1)); this.a = new Array(nv).fill(0); this.b = new Array(nh).fill(0); this.ep = 0; }
  ph(v) { return this.Wt.map((row, j) => sig(this.b[j] + row.reduce((s, t, i) => s + t * v[i], 0))); }
  pv(h) { return this.a.map((a, i) => sig(a + h.reduce((s, t, j) => s + t * this.Wt[j][i], 0))); }
  smp(p) { return p.map(t => this.r() < t ? 1 : 0); }
  cd(v, lr) { const h0 = this.ph(v), v1 = this.pv(this.smp(h0)), h1 = this.ph(v1);
    for (let j = 0; j < this.nh; j++) { this.b[j] += lr * (h0[j] - h1[j]); for (let i = 0; i < this.nv; i++) this.Wt[j][i] += lr * (h0[j] * v[i] - h1[j] * v1[i]); }
    for (let i = 0; i < this.nv; i++) this.a[i] += lr * (v[i] - v1[i]); return mae(v, v1); }
  fit(data, lr, n) { let e = 0; for (let k = 0; k < n; k++) for (const v of data) e = this.cd(v, lr); this.ep += n; return e; }
  err(data) { return data.reduce((s, v) => s + mae(v, this.pv(this.ph(v))), 0) / data.length; }
}
const HP = [3, 4, 2].map(i => GL[i].map(t => t * 2 - 1)), HPN = ['+', 'X', 'ㅁ'];   // 홉필드·볼츠만이 저장하는 패턴
const HW = (() => { const Wt = Array.from({ length: 25 }, () => new Array(25).fill(0)); HP.forEach(p => { for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++) if (i !== j) Wt[i][j] += p[i] * p[j] / 25; }); return Wt; })();
const hMatch = s => HP.map(p => p.reduce((t, v, i) => t + (v === s[i] ? 1 : 0), 0) / 25);
const hField = (s, i) => HW[i].reduce((t, w, j) => t + w * s[j], 0);

/* ---------- 순환 계열 ---------- */
const TS = 24;
function seqIn(dist) { const x = new Array(TS).fill(0); x[1] = 1; if (dist) x[12] = -0.8; return x; }
function runRNN(w, x) { let h = 0; return x.map(t => (h = Math.tanh(w * h + t))); }
const mark2 = [[1 / (TS - 1), '처음 신호', C.y], [12 / (TS - 1), '방해 신호', C.r]];

/* ================= 27개 실험 ================= */
const R3 = k => [{ x: 30, y: 110, w: 250 }, { x: 315, y: 110, w: 250 }, { x: 600, y: 110, w: 250 }][k];
const gsel = k => ({ k, l: '보여 줄 그림', min: 1, max: 12, step: 1, v: k === 'gb' ? 5 : 3, f: v => GN[v - 1] });

export const DEMOS = {
  /* 1층 퍼셉트론 */
  P: {
    controls: [{ k: 'w1', l: '가중치 1', min: -2, max: 2, step: .05, v: .3 }, { k: 'w2', l: '가중치 2', min: -2, max: 2, step: .05, v: -1 }, { k: 'b', l: '편향(문턱)', min: -1.5, max: 1.5, step: .05, v: .7 }, { b: 'train', l: '학습시키기' }],
    init(s) { s.d = dLin(); s.auto = 0; s.i = 0; },
    click(s) { s.auto = 300; },
    step(s) { for (let k = 0; k < 3 && s.auto > 0; k++, s.auto--) { const d = s.d[s.i++ % s.d.length], o = s.w1 * d.x + s.w2 * d.y + s.b > 0 ? 1 : 0; if (o !== d.c) { s.w1 = clamp(s.w1 + .15 * (d.c - o) * d.x, -2, 2); s.w2 = clamp(s.w2 + .15 * (d.c - o) * d.y, -2, 2); s.b = clamp(s.b + .15 * (d.c - o), -1.5, 1.5); } } },
    fn: s => (x, y) => s.w1 * x + s.w2 * y + s.b > 0 ? 1 : 0,
    draw(g, s) { clear(g, '직선 하나로 두 색 가르기'); field(g, PR, this.fn(s)); pts(g, PR, s.d); const n = Math.round(acc(s.d, this.fn(s)) * s.d.length); big(g, '맞게 가른 점', n + ' / ' + s.d.length, 150, n === s.d.length ? C.g : C.y); T(g, '주황 영역: 켜짐', 560, 300, 20, C.b); T(g, '파랑 영역: 꺼짐', 560, 332, 20, C.a); },
    read(s) { return [['맞게 가른 점', Math.round(acc(s.d, this.fn(s)) * s.d.length) + ' / ' + s.d.length], ['식', f2(s.w1) + '·x + ' + f2(s.w2) + '·y + ' + f2(s.b) + ' > 0']]; },
    say(s) { const a = acc(s.d, this.fn(s)); return a === 1 ? '직선 하나로 <b>모두</b> 갈랐습니다. 이것이 퍼셉트론이 하는 일의 전부입니다.' : '아직 ' + Math.round((1 - a) * s.d.length) + '개가 반대편에 있습니다. 가중치를 돌리거나 <b>학습시키기</b>를 눌러 보십시오.'; },
  },
  /* 2층 순방향 */
  FF: {
    controls: [{ k: 'hn', l: '은닉 뉴런 수', min: 1, max: 6, step: 1, v: 1 }, { b: 'reset', l: '처음부터 다시' }],
    init(s) { s.d = dXor(); s.seed = 4; this.change(s); },
    change(s) { s.net = new MLP([2, s.hn, 1], s.seed); s.it = 0; s.loss = 1; },
    click(s) { s.seed++; this.change(s); },
    step(s) { if (s.it < 6000) { for (let k = 0; k < 25; k++) s.loss = s.net.train(s.d, .6); s.it += 25; } },
    draw(g, s) { clear(g, '대각선끼리 같은 색 (XOR)'); field(g, PR, (x, y) => s.net.out(x, y)); pts(g, PR, s.d); const a = acc(s.d, (x, y) => s.net.out(x, y)); big(g, '맞힌 비율', Math.round(a * 100) + '%', 150, a === 1 ? C.g : C.y); big(g, '손실', f2(s.loss, 3), 270); big(g, '학습 반복', String(s.it), 390); },
    read(s) { return [['맞힌 비율', Math.round(acc(s.d, (x, y) => s.net.out(x, y)) * 100) + '%'], ['손실', f2(s.loss, 3)]]; },
    say(s) { const a = acc(s.d, (x, y) => s.net.out(x, y)); return s.hn === 1 ? '은닉 뉴런이 하나면 선도 하나뿐이라 ' + Math.round(a * 100) + '%에서 멈춰요. <b>은닉 뉴런 수</b>를 늘려 보세요.' : (a === 1 ? '은닉 뉴런 ' + s.hn + '개가 선을 ' + s.hn + '개 긋고, 출력이 합쳐서 <b>다 맞혔어요.</b>' : '지금 ' + Math.round(a * 100) + '%예요. 학습이 더 돌거나, 뉴런을 늘리면 달라져요.'); },
  },
  /* 3층 심층 순방향 */
  DFF: {
    controls: [{ k: 'dl', l: '은닉층 수', min: 1, max: 4, step: 1, v: 1 }, { b: 'reset', l: '처음부터 다시' }],
    init(s) { s.d = dRing3(); s.seed = 2; this.change(s); },
    change(s) { s.net = new MLP([2, ...new Array(s.dl).fill(5), 1], s.seed); s.it = 0; s.loss = 1; },
    click(s) { s.seed++; this.change(s); },
    step(s) { if (s.it < 12000) { for (let k = 0; k < 20; k++) s.loss = s.net.train(s.d, .35); s.it += 20; } },
    draw(g, s) { clear(g, '과녁 무늬: 가운데·띠·바깥'); field(g, PR, (x, y) => s.net.out(x, y)); pts(g, PR, s.d); const a = acc(s.d, (x, y) => s.net.out(x, y)); big(g, '맞힌 비율', Math.round(a * 100) + '%', 150, a > .97 ? C.g : C.y); big(g, '은닉층', s.dl + '겹 × 5개', 270); big(g, '학습 반복', String(s.it), 390); },
    read(s) { return [['맞힌 비율', Math.round(acc(s.d, (x, y) => s.net.out(x, y)) * 100) + '%'], ['손실', f2(s.loss, 3)]]; },
    say(s) { const a = Math.round(acc(s.d, (x, y) => s.net.out(x, y)) * 100); return '은닉층 ' + s.dl + '겹으로 지금 <b>' + a + '%</b>입니다. 겹을 바꿔 가며 경계 모양이 어떻게 달라지는지 비교하십시오. 겹이 많을수록 학습이 오래 걸리기도 합니다.'; },
  },
  /* 4층 RBF */
  RBF: {
    controls: [{ k: 'kc', l: '기준점 수', min: 1, max: 10, step: 1, v: 3 }, { k: 'sg', l: '반응 폭', min: .12, max: .9, step: .01, v: .35 }],
    init(s) { s.d = dXor(); this.change(s); },
    change(s) { const r = rng(21), d = s.d; let cs = Array.from({ length: s.kc }, () => { const q = d[Math.floor(r() * d.length)]; return [q.x, q.y]; });
      for (let it = 0; it < 8; it++) { const sum = cs.map(() => [0, 0, 0]); d.forEach(q => { let b = 0, bd = 9; cs.forEach((c, k) => { const dd = (q.x - c[0]) ** 2 + (q.y - c[1]) ** 2; if (dd < bd) { bd = dd; b = k; } }); sum[b][0] += q.x; sum[b][1] += q.y; sum[b][2]++; }); cs = cs.map((c, k) => sum[k][2] ? [sum[k][0] / sum[k][2], sum[k][1] / sum[k][2]] : c); }
      s.cs = cs; s.phi = (x, y) => [...cs.map(c => Math.exp(-((x - c[0]) ** 2 + (y - c[1]) ** 2) / (2 * s.sg * s.sg))), 1]; s.w = ridge(d.map(q => s.phi(q.x, q.y)), d.map(q => q.c), 1e-3); s.fn = (x, y) => s.phi(x, y).reduce((t, v, i) => t + v * s.w[i], 0); },
    draw(g, s) { clear(g, '기준점에서 가까우면 반응'); field(g, PR, s.fn); pts(g, PR, s.d); s.cs.forEach(c => { g.beginPath(); g.arc(mx(PR, c[0]), my(PR, c[1]), s.sg / 2.4 * PR.w, 0, TAU); g.strokeStyle = C.y; g.lineWidth = 3; g.stroke(); g.beginPath(); g.arc(mx(PR, c[0]), my(PR, c[1]), 5, 0, TAU); g.fillStyle = C.y; g.fill(); });
      const a = acc(s.d, s.fn); big(g, '맞힌 비율', Math.round(a * 100) + '%', 150, a === 1 ? C.g : C.y); T(g, '노란 원: 기준점과', 560, 300, 20, C.y); T(g, '반응이 미치는 폭', 560, 332, 20, C.y); },
    read(s) { return [['맞힌 비율', Math.round(acc(s.d, s.fn) * 100) + '%'], ['기준점', s.kc + '개']]; },
    say(s) { const a = Math.round(acc(s.d, s.fn) * 100); return '기준점 ' + s.kc + '개, 폭 ' + f2(s.sg) + '로 <b>' + a + '%</b>. 폭이 너무 좁으면 점 하나하나만 외우고, 너무 넓으면 뭉개집니다.'; },
  },
  /* 5층 ELM */
  ELM: {
    controls: [{ k: 'hn', l: '은닉 뉴런 수', min: 1, max: 40, step: 1, v: 6 }, { b: 'redraw', l: '은닉층 다시 뽑기' }],
    init(s) { s.d = dCirc(); s.seed = 1; this.change(s); },
    change(s) { const r = rng(100 + s.seed), hw = Array.from({ length: s.hn }, () => [(r() * 2 - 1) * 3, (r() * 2 - 1) * 3, (r() * 2 - 1) * 1.5]);
      s.phi = (x, y) => [...hw.map(q => Math.tanh(q[0] * x + q[1] * y + q[2])), 1]; s.w = ridge(s.d.map(q => s.phi(q.x, q.y)), s.d.map(q => q.c), 1e-3); s.fn = (x, y) => s.phi(x, y).reduce((t, v, i) => t + v * s.w[i], 0); },
    click(s) { s.seed++; this.change(s); },
    draw(g, s) { clear(g, '은닉층은 뽑기, 출력층만 계산'); field(g, PR, s.fn); pts(g, PR, s.d); const a = acc(s.d, s.fn); big(g, '맞힌 비율', Math.round(a * 100) + '%', 150, a === 1 ? C.g : C.y); big(g, '반복 학습', '0회', 270); big(g, '뽑기 번호', '#' + s.seed, 390); },
    read(s) { return [['맞힌 비율', Math.round(acc(s.d, s.fn) * 100) + '%'], ['반복 학습', '0회 (계산 1번)']]; },
    say(s) { const a = Math.round(acc(s.d, s.fn) * 100); return '뽑기 #' + s.seed + ', 은닉 뉴런 ' + s.hn + '개로 <b>' + a + '%</b>입니다. 다시 뽑으면 결과가 달라지는지, 뉴런을 늘리면 운을 덜 타는지 확인하겠습니다.'; },
  },
  /* 6층 마르코프 연쇄 */
  MC: {
    controls: [{ k: 'p', l: '맑음이 이어질 확률', min: .1, max: .95, step: .01, v: .7 }, { b: 'reset', l: '처음부터 다시' }],
    init(s) { this.change(s); },
    change(s) { s.M = [[s.p, (1 - s.p) * .6, (1 - s.p) * .4], [.3, .4, .3], [.2, .4, .4]]; let v = [1 / 3, 1 / 3, 1 / 3]; for (let k = 0; k < 300; k++) v = [0, 1, 2].map(j => v[0] * s.M[0][j] + v[1] * s.M[1][j] + v[2] * s.M[2][j]); s.pi = v; s.cnt = [0, 0, 0]; s.cur = 0; s.t = 0; s.n = 0; },
    click(s) { this.change(s); },
    step(s, dt) { s.t += dt; while (s.t > .1) { s.t -= .1; const u = Math.random(), m = s.M[s.cur]; s.cur = u < m[0] ? 0 : u < m[0] + m[1] ? 1 : 2; s.cnt[s.cur]++; s.n++; } },
    draw(g, s) { clear(g, '오늘 날씨만 보고 내일 정하기'); const P = [[150, 190], [400, 190], [275, 420]], nm = ['맑음', '흐림', '비'], col = [C.y, C.mu, C.a];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) { const a = P[i], b = P[j], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * 12, ny = dx / l * 12; g.beginPath(); g.moveTo(a[0] + nx + dx / l * 56, a[1] + ny + dy / l * 56); g.lineTo(b[0] + nx - dx / l * 56, b[1] + ny - dy / l * 56); g.strokeStyle = 'rgba(233,237,249,' + (.15 + s.M[i][j] * .85) + ')'; g.lineWidth = 2 + s.M[i][j] * 12; g.stroke(); T(g, f2(s.M[i][j]), (a[0] + b[0]) / 2 + nx * 2.4, (a[1] + b[1]) / 2 + ny * 2.4 + 6, 17, C.mu, 'center'); }
      P.forEach((q, i) => { g.beginPath(); g.arc(q[0], q[1], 50, 0, TAU); g.fillStyle = i === s.cur ? col[i] : '#1b2748'; g.fill(); g.lineWidth = 4; g.strokeStyle = col[i]; g.stroke(); T(g, nm[i], q[0], q[1] + 9, 26, i === s.cur ? '#0a0f1e' : C.fg, 'center'); T(g, '머무름 ' + f2(s.M[i][i]), q[0], q[1] - 62, 17, C.mu, 'center'); });
      const fr = s.cnt.map(c => c / (s.n || 1)); bars(g, fr, 570, 110, 270, 300, col, 1, nm); s.pi.forEach((v, i) => { const y = 110 + 300 - v * 300; g.strokeStyle = '#fff'; g.lineWidth = 3; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(570 + i * 90 + 3, y); g.lineTo(570 + (i + 1) * 90 - 3, y); g.stroke(); g.setLineDash([]); }); T(g, '막대: 실제로 머문 비율', 570, 480, 19, C.mu); T(g, '흰 점선: 계산한 값', 570, 508, 19, C.fg); T(g, s.n + '일째', 570, 90, 24, C.fg); },
    read(s) { return [['지난 날', s.n + '일'], ['맑은 날 비율', Math.round(s.cnt[0] / (s.n || 1) * 100) + '% (계산 ' + Math.round(s.pi[0] * 100) + '%)']]; },
    say(s) { return s.n < 150 ? '아직 ' + s.n + '일째라 막대가 흔들립니다. 조금 더 두고 보십시오.' : '맑은 날이 <b>' + Math.round(s.cnt[0] / s.n * 100) + '%</b>, 계산으로 구한 값은 ' + Math.round(s.pi[0] * 100) + '%입니다. 어디서 시작했든 이 비율로 모입니다.'; },
  },
  /* 7층 SVM */
  SVM: {
    controls: [{ k: 'lc', l: '어긋남에 매기는 벌 (C)', min: -1.5, max: 1.5, step: .05, v: 0, f: v => f2(10 ** v, 2) }],
    init(s) { s.d = blobs(31, [[-.4, -.3, 0], [.4, .35, 1]], .3, 15); this.change(s); },
    change(s) { s.w = [0, 0]; s.b = 0; s.it = 0; },
    step(s) { const Cc = 10 ** s.lc; for (let k = 0; k < 60; k++) { const lr = .05 / (1 + Cc) / (1 + s.it * .002); let g0 = s.w[0], g1 = s.w[1], gb = 0; s.d.forEach(d => { const y = d.c ? 1 : -1; if (y * (s.w[0] * d.x + s.w[1] * d.y + s.b) < 1) { g0 -= Cc * y * d.x; g1 -= Cc * y * d.y; gb -= Cc * y; } }); s.w[0] -= lr * g0; s.w[1] -= lr * g1; s.b -= lr * gb; s.it++; } },
    draw(g, s) { clear(g, '여백이 가장 넓은 선 찾기'); const fn = (x, y) => sig(6 * (s.w[0] * x + s.w[1] * y + s.b)); field(g, PR, (x, y) => fn(x, y) > .5 ? .8 : .2); const sv = s.d.map(d => (d.c ? 1 : -1) * (s.w[0] * d.x + s.w[1] * d.y + s.b) <= 1.02); pts(g, PR, s.d, sv);
      g.save(); g.beginPath(); g.rect(PR.x, PR.y, PR.w, PR.h); g.clip(); [0, 1, -1].forEach(o => { const [a, b] = s.w, c = s.b - o; if (Math.abs(a) + Math.abs(b) < 1e-6) return; g.beginPath(); if (Math.abs(b) > Math.abs(a)) { g.moveTo(mx(PR, -1.2), my(PR, (-c + 1.2 * a) / b)); g.lineTo(mx(PR, 1.2), my(PR, (-c - 1.2 * a) / b)); } else { g.moveTo(mx(PR, (-c + 1.2 * b) / a), my(PR, -1.2)); g.lineTo(mx(PR, (-c - 1.2 * b) / a), my(PR, 1.2)); } g.strokeStyle = '#fff'; g.lineWidth = o ? 2 : 5; g.setLineDash(o ? [8, 8] : []); g.stroke(); }); g.restore(); g.setLineDash([]);
      big(g, '여백 폭', f2(2 / (Math.hypot(...s.w) || 1e-9)), 150, C.y); big(g, '서포트 벡터', sv.filter(Boolean).length + '개', 270); T(g, '노란 테: 선을 정하는 점', 560, 400, 20, C.y); },
    read(s) { const sv = s.d.filter(d => (d.c ? 1 : -1) * (s.w[0] * d.x + s.w[1] * d.y + s.b) <= 1.02).length; return [['여백 폭', f2(2 / (Math.hypot(...s.w) || 1e-9))], ['서포트 벡터', sv + '개 / ' + s.d.length + '개']]; },
    say(s) { const sv = s.d.filter(d => (d.c ? 1 : -1) * (s.w[0] * d.x + s.w[1] * d.y + s.b) <= 1.02).length; return '점 ' + s.d.length + '개 중 선을 정하는 것은 노란 테 <b>' + sv + '개</b>뿐입니다. 벌(C)을 낮추면 여백이 넓어지고 어긋난 점을 더 봐줍니다.'; },
  },
  /* 8층 코호넨 */
  KN: {
    controls: [{ k: 'shape', l: '데이터 모양', opts: [['sq', '네모'], ['ring', '고리'], ['two', '두 무리']], v: 'sq' }, { b: 'reset', l: '그물 다시 던지기' }],
    init(s) { this.change(s); },
    change(s) { const r = rng(17), n = 260; s.d = Array.from({ length: n }, () => { if (s.shape === 'ring') { const a = r() * TAU, d = .65 + r() * .3; return [Math.cos(a) * d, Math.sin(a) * d]; } if (s.shape === 'two') { const c = r() < .5 ? [-.55, -.4] : [.5, .45]; return [c[0] + gauss(r) * .22, c[1] + gauss(r) * .22]; } return [r() * 2 - 1, r() * 2 - 1]; });
      s.n = 7; s.w = Array.from({ length: 49 }, () => [(Math.random() - .5) * .2, (Math.random() - .5) * .2]); s.t = 0; },
    click(s) { this.change(s); },
    step(s) { if (s.t >= 1) return; const lr = .5 * (1 - s.t) + .02, rad = 3 * (1 - s.t) + .4; for (let k = 0; k < 14; k++) { const q = s.d[Math.floor(Math.random() * s.d.length)]; let b = 0, bd = 9; s.w.forEach((w, i) => { const dd = (w[0] - q[0]) ** 2 + (w[1] - q[1]) ** 2; if (dd < bd) { bd = dd; b = i; } }); const bi = Math.floor(b / s.n), bj = b % s.n;
      s.w.forEach((w, i) => { const d2 = (Math.floor(i / s.n) - bi) ** 2 + (i % s.n - bj) ** 2, hh = Math.exp(-d2 / (2 * rad * rad)); w[0] += lr * hh * (q[0] - w[0]); w[1] += lr * hh * (q[1] - w[1]); }); } s.t += 1 / 420; },
    draw(g, s) { clear(g, '정답 없이 스스로 펴지는 그물'); g.strokeStyle = C.ln; g.lineWidth = 2; g.strokeRect(PR.x, PR.y, PR.w, PR.h); s.d.forEach(q => { g.fillStyle = '#3d5596'; g.fillRect(mx(PR, q[0]) - 3, my(PR, q[1]) - 3, 6, 6); });
      g.strokeStyle = C.y; g.lineWidth = 3; for (let i = 0; i < s.n; i++) for (let j = 0; j < s.n; j++) { const a = s.w[i * s.n + j]; if (j < s.n - 1) { const b = s.w[i * s.n + j + 1]; g.beginPath(); g.moveTo(mx(PR, a[0]), my(PR, a[1])); g.lineTo(mx(PR, b[0]), my(PR, b[1])); g.stroke(); } if (i < s.n - 1) { const b = s.w[(i + 1) * s.n + j]; g.beginPath(); g.moveTo(mx(PR, a[0]), my(PR, a[1])); g.lineTo(mx(PR, b[0]), my(PR, b[1])); g.stroke(); } }
      s.w.forEach(a => { g.beginPath(); g.arc(mx(PR, a[0]), my(PR, a[1]), 6, 0, TAU); g.fillStyle = C.g; g.fill(); }); big(g, '진행', Math.round(Math.min(1, s.t) * 100) + '%', 150, s.t >= 1 ? C.g : C.y); T(g, '파란 점: 데이터', 560, 300, 20, C.a); T(g, '초록 점: 뉴런 49개', 560, 332, 20, C.g); T(g, '노란 선: 이웃 관계', 560, 364, 20, C.y); },
    read(s) { return [['진행', Math.round(Math.min(1, s.t) * 100) + '%'], ['뉴런', '7 × 7 = 49개']]; },
    say(s) { return s.t < 1 ? '그물이 펴지는 중이에요! 처음엔 크게, 갈수록 조금씩 움직여요.' : '다 펴졌어요. 그물이 데이터 모양을 닮았죠? <b>데이터 모양</b>을 바꿔서 다시 던져 보세요.'; },
  },
  /* 9층 오토인코더 */
  AE: {
    controls: [gsel('gi'), { k: 'k', l: '가운데 통로 폭', min: 1, max: 10, step: 1, v: 2 }],
    init() { },
    calc(s) { const v = GL[s.gi - 1], c = PCA.enc(v, s.k); return { v, c, o: PCA.dec(c) }; },
    draw(g, s) { clear(g, '좁은 통로로 압축했다가 복원'); const q = this.calc(s); T(g, '입력 (숫자 25개)', 30, 96, 22, C.mu); grid(g, q.v, 5, 30, 110, 50); T(g, '통로 (숫자 ' + s.k + '개)', 315, 96, 22, C.y); bars(g, [...q.c, ...new Array(10 - s.k).fill(0)], 315, 130, 250, 190, [...q.c.map(t => t >= 0 ? C.y : C.p), ...new Array(10 - s.k).fill(C.ln)], 2.2);
      T(g, '출력 (복원)', 600, 96, 22, C.mu); grid(g, q.o, 5, 600, 110, 50); T(g, '복원 오차 ' + Math.round(mae(q.v, q.o) * 100) + '%', 30, 440, 34, mae(q.v, q.o) < .05 ? C.g : C.y); T(g, '통로가 좁을수록 많이 버립니다', 30, 492, 22, C.mu); },
    read(s) { const q = this.calc(s); return [['압축', '25개 → ' + s.k + '개'], ['복원 오차', Math.round(mae(q.v, q.o) * 100) + '%']]; },
    say(s) { const e = Math.round(mae(this.calc(s).v, this.calc(s).o) * 100); return '숫자 25개를 <b>' + s.k + '개</b>로 줄였다가 되살렸더니 오차가 ' + e + '%예요. 통로를 넓히면 또렷해지고, 좁히면 뭉개져요.'; },
    note: '그림 12장으로 구한 선형 오토인코더(주성분)입니다.',
  },
  /* 10층 잡음 제거 */
  DAE: {
    controls: [gsel('gi'), { k: 'nz', l: '잡음 양', min: 0, max: .5, step: .01, v: .15 }, { b: 'again', l: '잡음 다시 뿌리기' }],
    init(s) { s.ns = 1; },
    click(s) { s.ns++; },
    calc(s) { const v = GL[s.gi - 1], r = rng(s.ns * 97 + s.gi), n = v.map(t => r() < s.nz ? 1 - t : t); return { v, n, o: DAEN(n) }; },
    draw(g, s) { clear(g, '망가진 입력에서 원본 되살리기'); const q = this.calc(s); T(g, '원본', 30, 96, 22, C.mu); grid(g, q.v, 5, 30, 110, 50); T(g, '잡음 섞인 입력', 315, 96, 22, C.r); grid(g, q.n, 5, 315, 110, 50); T(g, '출력', 600, 96, 22, C.g); grid(g, q.o, 5, 600, 110, 50);
      const e1 = mae(q.v, q.n), e2 = mae(q.v, q.o); T(g, '입력과 원본의 차이  ' + Math.round(e1 * 100) + '%', 30, 440, 30, C.r); T(g, '출력과 원본의 차이  ' + Math.round(e2 * 100) + '%', 30, 492, 30, e2 < e1 ? C.g : C.y); },
    read(s) { const q = this.calc(s); return [['입력의 오차', Math.round(mae(q.v, q.n) * 100) + '%'], ['출력의 오차', Math.round(mae(q.v, q.o) * 100) + '%']]; },
    say(s) { const q = this.calc(s), e1 = Math.round(mae(q.v, q.n) * 100), e2 = Math.round(mae(q.v, q.o) * 100); return e1 === 0 ? '잡음이 없습니다. <b>잡음 양</b>을 올려 보십시오.' : (e2 < e1 ? '원본과의 차이가 ' + e1 + '%에서 <b>' + e2 + '%</b>로 줄었습니다. 통로를 지나며 잡음이 걸러졌습니다.' : '이번에는 ' + e1 + '% → ' + e2 + '%로 줄지 않았습니다. 잡음이 그림의 특징을 건드리면 이렇게 됩니다.'); },
    note: '숫자 25개 → 10개 → 25개짜리 작은 오토인코더를, 잡음 섞인 그림을 넣고 깨끗한 원본을 맞히도록 이 페이지에서 9,000번 학습시킨 것입니다.',
  },
  /* 11층 희소 */
  SAE: {
    controls: [{ ...gsel('ga'), l: '겹칠 그림 1', v: 1 }, { ...gsel('gb'), l: '겹칠 그림 2' }, { k: 'sp', l: '켤 수 있는 뉴런 수', min: 1, max: 6, step: 1, v: 2 }],
    init() { },
    calc(s) { const v = GL[s.ga - 1].map((t, i) => Math.max(t, GL[s.gb - 1][i])), at = GL.map(a => { const n = Math.hypot(...a); return a.map(t => t / n); }); let res = v.slice(); const co = new Array(12).fill(0);
      for (let k = 0; k < s.sp; k++) { let b = -1, bv = 1e-6; at.forEach((a, j) => { if (co[j]) return; const d = a.reduce((t, x, i) => t + x * res[i], 0); if (d > bv) { bv = d; b = j; } }); if (b < 0) break; co[b] = bv; res = res.map((t, i) => t - bv * at[b][i]); }
      return { v, co, o: v.map((t, i) => clamp(t - res[i], 0, 1)) }; },
    draw(g, s) { clear(g, '뉴런 12개 중 몇 개만 켜기'); const q = this.calc(s); T(g, '입력 (두 그림 겹침)', 30, 96, 22, C.mu); grid(g, q.v, 5, 30, 110, 50); T(g, '은닉 뉴런 12개', 315, 96, 22, C.y); bars(g, q.co, 315, 130, 250, 190, q.co.map(t => t ? C.y : C.ln), 3.2, GN); T(g, '출력', 600, 96, 22, C.mu); grid(g, q.o, 5, 600, 110, 50);
      T(g, '켜진 뉴런 ' + q.co.filter(Boolean).length + '개 · 오차 ' + Math.round(mae(q.v, q.o) * 100) + '%', 30, 450, 32, C.y); },
    read(s) { const q = this.calc(s); return [['켜진 뉴런', q.co.filter(Boolean).length + ' / 12'], ['복원 오차', Math.round(mae(q.v, q.o) * 100) + '%']]; },
    say(s) { const q = this.calc(s), on = q.co.map((t, i) => t ? GN[i] : null).filter(Boolean); return '뉴런 12개 중 <b>' + on.join(', ') + '</b> 담당만 켰습니다. 오차 ' + Math.round(mae(q.v, q.o) * 100) + '%. 켜진 것만 보면 무엇이 들어왔는지 읽힙니다.'; },
    note: '은닉 뉴런 하나가 그림 하나를 맡는 사전으로 계산합니다(매칭 추적).',
  },
  /* 12층 CNN */
  DCN: {
    controls: [{ k: 'img', l: '그림', opts: [['v', '세로 막대'], ['h', '가로 막대'], ['sq', '네모 테두리'], ['dg', '대각선']], v: 'v' }, { k: 'ker', l: '창(커널)', opts: [['v', '세로선 찾기'], ['h', '가로선 찾기'], ['e', '가장자리 찾기']], v: 'v' }],
    init(s) { this.change(s); },
    change(s) { const im = new Array(64).fill(0), on = (i, j) => im[i * 8 + j] = 1; for (let k = 1; k < 7; k++) { if (s.img === 'v') { on(k, 3); on(k, 4); } if (s.img === 'h') { on(3, k); on(4, k); } if (s.img === 'dg') { on(k, k); } }
      if (s.img === 'sq') for (let k = 2; k < 6; k++) { on(2, k); on(5, k); on(k, 2); on(k, 5); }
      s.im = im; s.kv = { v: [-1, 2, -1, -1, 2, -1, -1, 2, -1], h: [-1, -1, -1, 2, 2, 2, -1, -1, -1], e: [-1, -1, -1, -1, 8, -1, -1, -1, -1] }[s.ker];
      s.out = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { let t = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) t += s.kv[a * 3 + b] * im[(i + a) * 8 + j + b]; s.out.push(Math.max(0, t)); } s.mx = Math.max(1, ...s.out); s.pos = 0; s.t = 0; },
    step(s, dt) { s.t += dt; if (s.pos < 36) { while (s.t > .07 && s.pos < 36) { s.t -= .07; s.pos++; } } else if (s.t > 2.2) { s.pos = 0; s.t = 0; } },
    draw(g, s) { clear(g, '작은 창을 옮겨 가며 무늬 찾기'); T(g, '그림 8×8', 30, 96, 22, C.mu); grid(g, s.im, 8, 30, 110, 40); const p = Math.min(35, s.pos), pi = Math.floor(p / 6), pj = p % 6; g.strokeStyle = C.p; g.lineWidth = 6; g.strokeRect(30 + pj * 40 - 1, 110 + pi * 40 - 1, 120, 120);
      T(g, '창 3×3', 395, 96, 22, C.p); for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const v = s.kv[a * 3 + b]; g.fillStyle = v > 0 ? '#7a2f5c' : '#1b2748'; g.fillRect(395 + b * 44, 110 + a * 44, 42, 42); T(g, String(v), 395 + b * 44 + 21, 110 + a * 44 + 29, 20, C.fg, 'center'); }
      T(g, '찾은 결과 6×6', 570, 96, 22, C.y); grid(g, s.out.map((t, i) => i < s.pos ? t / s.mx : 0), 6, 570, 110, 46); T(g, '가중치 9개를 36곳에서 다시 씀', 30, 480, 26, C.fg); T(g, '(전부 따로 연결하면 64×36 = 2,304개)', 30, 516, 22, C.mu); },
    read(s) { return [['가중치', '9개'], ['가장 큰 반응', String(Math.max(...s.out))]]; },
    say(s) { const hit = s.out.filter(t => t > 0).length; return hit ? '36칸 중 <b>' + hit + '칸</b>에서 창과 닮은 무늬를 찾았어요. 그림이나 창을 바꾸면 밝아지는 자리가 달라져요.' : '이 창과 닮은 무늬가 이 그림에는 없어요. <b>창</b>을 바꿔 보세요.'; },
  },
  /* 13층 RNN */
  RNN: {
    controls: [{ k: 'w', l: '되먹임 세기', min: 0, max: 1.6, step: .01, v: .8 }],
    init() { },
    draw(g, s) { clear(g, '처음 신호가 얼마나 오래 남나'); const h = runRNN(s.w, seqIn(false)); chart(g, { x: 40, y: 80, w: 800, h: 360 }, [{ v: h, c: C.a, n: '은닉 뉴런의 값(기억)' }], -.1, 1.1, [mark2[0]]); T(g, '시간 →', 840, 470, 20, C.mu, 'right'); T(g, '끝에 남은 기억  ' + f2(h.at(-1), 3), 40, 520, 30, h.at(-1) > .05 && h.at(-1) < .9 ? C.g : C.y); },
    read(s) { const h = runRNN(s.w, seqIn(false)); return [['끝에 남은 기억', f2(h.at(-1), 3)], ['되먹임 세기', f2(s.w)]]; },
    say(s) { const e = runRNN(s.w, seqIn(false)).at(-1); return e < .05 ? '끝에는 <b>' + f2(e, 3) + '</b>, 거의 사라졌습니다. 이것이 RNN이 긴 순서를 어려워하는 이유입니다.' : (e > .85 ? '되먹임이 너무 세서 값이 꽉 찬 채(' + f2(e, 2) + ') 움직이지 않습니다. 새 입력이 와도 구분하기 어렵습니다.' : '끝에 <b>' + f2(e, 2) + '</b>가 남았습니다. 알맞은 구간은 좁습니다.'); },
  },
  /* 14층 ESN */
  ESN: {
    controls: [{ k: 'rho', l: '메아리 세기', min: .2, max: 1.6, step: .01, v: .9 }, { b: 'redraw', l: '저수지 다시 뽑기' }],
    init(s) { s.seed = 1; this.change(s); },
    click(s) { s.seed++; this.change(s); },
    change(s) { const r = rng(50 + s.seed), N = 30; let Wr = Array.from({ length: N }, () => Array.from({ length: N }, () => r() < .2 ? r() * 2 - 1 : 0)); const win = Array.from({ length: N }, () => r() * 2 - 1);
      let v = Array.from({ length: N }, () => r() - .5), l = 1; for (let k = 0; k < 60; k++) { const w = Wr.map(row => row.reduce((t, x, j) => t + x * v[j], 0)); l = Math.hypot(...w) || 1e-9; v = w.map(t => t / l); } Wr = Wr.map(row => row.map(t => t * s.rho / l));
      const stepx = (x, u) => Wr.map((row, i) => Math.tanh(row.reduce((t, w, j) => t + w * x[j], 0) + win[i] * u));
      let x = new Array(N).fill(0); s.echo = [[], [], [], []]; s.len = 0; for (let t = 0; t < 40; t++) { x = stepx(x, t === 2 ? 1 : 0); s.echo.forEach((e, k) => e.push(x[k * 7])); if (t > 2 && Math.max(...x.map(Math.abs)) > .01) s.len = t - 2; }
      const u = t => Math.sin(.3 * t) * Math.cos(.11 * t); x = new Array(N).fill(0); const Phi = [], Y = []; for (let t = 0; t < 300; t++) { x = stepx(x, u(t)); if (t >= 50) { Phi.push([...x, 1]); Y.push(u(t + 1)); } }
      const wo = ridge(Phi, Y, 1e-4); s.tg = []; s.pr = []; let se = 0; for (let t = 300; t < 360; t++) { x = stepx(x, u(t)); const p = [...x, 1].reduce((a, b, i) => a + b * wo[i], 0); s.tg.push(u(t + 1)); s.pr.push(p); se += (p - u(t + 1)) ** 2; } s.rmse = Math.sqrt(se / 60); },
    draw(g, s) { clear(g, '저수지의 메아리와 다음 값 예측'); T(g, '신호 한 번을 던졌을 때 뉴런 4개의 메아리', 40, 86, 20, C.mu); chart(g, { x: 40, y: 96, w: 800, h: 150 }, s.echo.map((v, i) => ({ v, c: [C.a, C.g, C.p, C.y][i], w: 3 })), -1, 1, [[2 / 39, '신호']]); T(g, '다음 값 맞히기 (배우지 않은 구간)', 40, 300, 20, C.mu); chart(g, { x: 40, y: 310, w: 800, h: 160 }, [{ v: s.tg, c: C.fg, n: '정답', w: 3 }, { v: s.pr, c: C.b, n: '예측', dash: 1 }], -1.1, 1.1); T(g, '예측 오차 ' + f2(s.rmse, 3), 840, 520, 28, s.rmse < .05 ? C.g : C.y, 'right'); },
    read(s) { return [['예측 오차', f2(s.rmse, 3)], ['메아리 길이', s.len + '걸음' + (s.len >= 37 ? ' 이상' : '')]]; },
    say(s) { return '메아리 세기 ' + f2(s.rho) + '에서 메아리가 ' + s.len + (s.len >= 37 ? '걸음 넘게' : '걸음') + ' 이어지고, 예측 오차는 <b>' + f2(s.rmse, 3) + '</b>입니다. 저수지는 그대로 두고 읽는 선만 구한 결과입니다.'; },
  },
  /* 15층 GRU */
  GRU: {
    controls: [{ k: 'z', l: '기억 유지 문', min: 0, max: 1, step: .01, v: .5 }, { k: 'r', l: '과거 참고 문', min: 0, max: 1, step: .01, v: 1 }],
    init() { },
    run(s) { let h = 0; return seqIn(true).map(x => { const c = Math.tanh(1.2 * s.r * h + x); return (h = s.z * h + (1 - s.z) * c); }); },
    draw(g, s) { clear(g, '문 두 개로 기억 지키기'); const h = this.run(s); chart(g, { x: 40, y: 80, w: 800, h: 360 }, [{ v: h, c: C.a, n: 'GRU의 기억' }, { v: runRNN(.8, seqIn(true)), c: C.mu, n: '13층 RNN', dash: 1, w: 3 }], -1.1, 1.1, mark2); T(g, '끝에 남은 기억  ' + f2(h.at(-1), 3), 40, 520, 30, h.at(-1) > .3 ? C.g : C.y); },
    read(s) { return [['끝에 남은 기억', f2(this.run(s).at(-1), 3)], ['RNN이라면', f2(runRNN(.8, seqIn(true)).at(-1), 3)]]; },
    say(s) { const e = this.run(s).at(-1); return e > .3 ? '끝까지 <b>' + f2(e, 2) + '</b>가 남았어요! 방해 신호가 와도 처음 기억을 지켰어요.' : '끝에 ' + f2(e, 2) + '만 남았어요. <b>기억 유지 문</b>을 1 쪽으로 올리면 옛 기억을 더 지켜요.'; },
    note: '실제 GRU는 두 문의 값을 입력에 따라 스스로 정합니다. 여기서는 손으로 돌립니다.',
  },
  /* 16층 LSTM */
  LSTM: {
    controls: [{ k: 'f', l: '잊기 문', min: 0, max: 1, step: .01, v: .9 }, { k: 'i2', l: '받기 문 (방해가 올 때)', min: 0, max: 1, step: .01, v: 1 }, { k: 'o', l: '내보내기 문', min: 0, max: 1, step: .01, v: 1 }],
    init() { },
    run(s) { let c = 0; const cs = [], hs = []; seqIn(true).forEach((x, t) => { c = s.f * c + (t === 12 ? s.i2 : 1) * Math.tanh(2 * x); cs.push(c); hs.push(s.o * Math.tanh(c)); }); return { cs, hs }; },
    draw(g, s) { clear(g, '기억 세포와 문 세 개'); const q = this.run(s); chart(g, { x: 40, y: 80, w: 800, h: 360 }, [{ v: q.cs, c: C.a, n: '기억 세포' }, { v: q.hs, c: C.y, n: '밖으로 내보낸 값', w: 3 }, { v: runRNN(.8, seqIn(true)), c: C.mu, n: '13층 RNN', dash: 1, w: 3 }], -1.1, 1.1, mark2); T(g, '끝에 남은 기억  ' + f2(q.cs.at(-1), 3), 40, 520, 30, q.cs.at(-1) > .3 ? C.g : C.y); },
    read(s) { const q = this.run(s); return [['끝의 기억 세포', f2(q.cs.at(-1), 3)], ['끝에 내보낸 값', f2(q.hs.at(-1), 3)]]; },
    say(s) { const q = this.run(s), e = q.cs.at(-1); return e > .3 ? '기억 세포에 <b>' + f2(e, 2) + '</b>가 남았습니다.' + (s.i2 < .3 ? ' 받기 문을 닫아 방해 신호를 막은 덕입니다.' : ' 받기 문을 닫으면 방해 신호까지 막을 수 있습니다.') : '끝에 ' + f2(e, 2) + '입니다. 잊기 문을 1 가까이 두고, 방해가 올 때 받기 문을 닫아 보십시오.'; },
    note: '실제 LSTM은 세 문의 값을 입력에 따라 스스로 정합니다. 여기서는 손으로 돌립니다.',
  },
  /* 17층 LSM */
  LSM: {
    controls: [{ k: 'leak', l: '전압이 새는 정도', min: .02, max: .4, step: .01, v: .12 }, { k: 'rate', l: '바탕 입력', min: 0, max: .3, step: .01, v: .04 }, { b: 'pulse', l: '신호 넣기' }],
    init(s) { const r = rng(8), N = 40; s.N = N; s.V = new Array(N).fill(0); s.con = Array.from({ length: N }, (_, i) => { const o = []; for (let j = 0; j < N; j++) if (j !== i && r() < .14) o.push([j, i % 5 === 4 ? -.6 : .38]); return o; }); s.ras = []; s.in = new Array(N).fill(0); s.burst = 0; s.cnt = 0; },
    click(s) { s.burst = 6; },
    step(s) { for (let k = 0; k < 2; k++) { const fired = []; for (let i = 0; i < s.N; i++) { let v = s.V[i] * (1 - s.leak) + s.in[i]; if (i < 8 && (s.burst > 0 || Math.random() < s.rate)) v += .7; if (v > 1) { fired.push(i); v = 0; } s.V[i] = Math.max(v, -.5); }
      s.in.fill(0); fired.forEach(i => s.con[i].forEach(c => s.in[c[0]] += c[1])); s.ras.push(fired); if (s.ras.length > 170) s.ras.shift(); if (s.burst > 0) s.burst--; } s.cnt = s.ras.slice(-40).reduce((t, f) => t + f.length, 0); },
    draw(g, s) { clear(g, '스파이크가 웅덩이에 번지는 모습'); const X = 40, Y = 80, w = 800, h = 330; g.strokeStyle = C.ln; g.lineWidth = 2; g.strokeRect(X, Y, w, h); g.fillStyle = '#17234a'; g.fillRect(X, Y, w, h * 8 / s.N); T(g, '입력 뉴런', X + 8, Y + 22, 18, C.mu);
      s.ras.forEach((f, t) => f.forEach(i => { g.fillStyle = i % 5 === 4 ? C.a : C.r; g.fillRect(X + t / 170 * w, Y + i / s.N * h + 1, 5, h / s.N - 2); })); const rate = s.ras.map(f => f.length); chart(g, { x: X, y: 430, w, h: 70 }, [{ v: rate.length > 1 ? rate : [0, 0], c: C.y, w: 3 }], 0, 20); T(g, '붉은 점: 흥분 뉴런 · 파란 점: 억제 뉴런 · 아래: 한순간에 쏜 뉴런 수', X, 532, 19, C.mu); },
    read(s) { return [['최근 스파이크', s.cnt + '번'], ['뉴런', '40개 (5개 중 1개는 억제)']]; },
    say(s) { return s.cnt === 0 ? '조용합니다. <b>신호 넣기</b>를 누르거나 바탕 입력을 올려 보십시오.' : (s.cnt > 300 ? '스파이크가 ' + s.cnt + '번, 웅덩이 전체가 끓고 있습니다. 전압이 새는 정도를 올리면 가라앉습니다.' : '최근에 스파이크 <b>' + s.cnt + '번</b>. 신호가 번졌다가 가라앉는 무늬, 이것을 읽는 쪽만 학습합니다.'); },
  },
  /* 18층 홉필드 */
  HN: {
    controls: [{ k: 'pat', l: '저장한 패턴', min: 1, max: 3, step: 1, v: 1, f: v => HPN[v - 1] }, { k: 'nz', l: '망가뜨릴 양', min: 0, max: .5, step: .01, v: .25 }, { b: 'corrupt', l: '망가뜨리기' }, { b: 'recall', l: '떠올리기' }],
    init(s) { s.s = HP[0].slice(); s.run = 0; },
    change(s, k) { if (k === 'pat') { s.s = HP[s.pat - 1].slice(); s.run = 0; } },
    click(s, id) { if (id === 'corrupt') { s.s = HP[s.pat - 1].map(t => Math.random() < s.nz ? -t : t); s.run = 0; } else s.run = 90; },
    step(s) { if (s.run > 0) { for (let k = 0; k < 2; k++) { const i = Math.floor(Math.random() * 25), f = hField(s.s, i); if (f) s.s[i] = f > 0 ? 1 : -1; } s.run--; } },
    draw(g, s) { clear(g, '망가진 패턴을 되돌려 놓기'); T(g, '저장해 둔 패턴 3개', 30, 96, 22, C.mu); HP.forEach((p, k) => { grid(g, p, 5, 30 + k * 100, 110, 18, 1); T(g, HPN[k], 30 + k * 100 + 45, 226, 20, C.mu, 'center'); });
      T(g, '지금 상태', 370, 96, 22, C.y); grid(g, s.s, 5, 370, 110, 60, 1); const m = hMatch(s.s); T(g, '저장 패턴과 일치하는 정도', 30, 300, 22, C.mu); bars(g, m, 30, 320, 300, 150, [C.a, C.g, C.p], 1, HPN.map((n, i) => n + ' ' + Math.round(m[i] * 100) + '%')); if (s.run > 0) T(g, '떠올리는 중…', 700, 250, 24, C.y); },
    read(s) { const m = hMatch(s.s), b = m.indexOf(Math.max(...m)); return [['가장 가까운 패턴', HPN[b]], ['일치', Math.round(m[b] * 100) + '%']]; },
    say(s) { const m = hMatch(s.s), b = m.indexOf(Math.max(...m)); return s.run > 0 ? '뉴런을 하나씩 골라, 이웃들의 뜻에 맞춰 뒤집고 있습니다.' : (m[b] === 1 ? '저장해 둔 <b>' + HPN[b] + '</b> 패턴 그대로입니다.' + (b !== s.pat - 1 ? ' 다만 고르신 것과 다른 패턴으로 돌아갔습니다.' : '') : HPN[b] + '와 ' + Math.round(m[b] * 100) + '% 일치합니다. <b>떠올리기</b>를 누르면 정리하겠습니다.'); },
  },
  /* 19층 볼츠만 머신 */
  BM: {
    controls: [{ k: 'tmp', l: '온도', min: .05, max: 3, step: .01, v: .4 }, { b: 'shake', l: '뒤섞기' }],
    init(s) { s.s = Array.from({ length: 25 }, () => Math.random() < .5 ? 1 : -1); },
    click(s) { s.s = s.s.map(() => Math.random() < .5 ? 1 : -1); },
    step(s) { for (let k = 0; k < 3; k++) { const i = Math.floor(Math.random() * 25); s.s[i] = Math.random() < sig(2 * hField(s.s, i) / s.tmp) ? 1 : -1; } },
    en: s => -.5 * s.s.reduce((t, v, i) => t + v * hField(s.s, i), 0),
    draw(g, s) { clear(g, '확률로 켜지고 꺼지는 뉴런들'); T(g, '지금 상태', 30, 96, 22, C.y); grid(g, s.s, 5, 30, 110, 66, 1); const m = hMatch(s.s).map(v => Math.max(v, 1 - v)); T(g, '저장 패턴과 닮은 정도', 430, 96, 22, C.mu); bars(g, m.map(v => (v - .5) * 2), 430, 116, 400, 190, [C.a, C.g, C.p], 1, HPN); T(g, '에너지  ' + f2(this.en(s), 2), 430, 400, 40, C.y); T(g, '낮을수록 안정된 상태', 430, 440, 22, C.mu); T(g, '(뒤집힌 그림도 같은 에너지입니다)', 430, 472, 20, C.mu); },
    read(s) { return [['에너지', f2(this.en(s), 2)], ['온도', f2(s.tmp)]]; },
    say(s) { const m = hMatch(s.s).map(v => Math.max(v, 1 - v)), b = m.indexOf(Math.max(...m)); return s.tmp > 1.5 ? '온도 ' + f2(s.tmp) + ': 거의 무작위로 뒤집힙니다. 에너지 ' + f2(this.en(s), 1) + '.' : '온도 ' + f2(s.tmp) + ': <b>' + HPN[b] + '</b> 근처(닮은 정도 ' + Math.round(m[b] * 100) + '%)에 머뭅니다. 에너지 ' + f2(this.en(s), 1) + '.'; },
    note: '가중치는 18층과 같은 세 패턴으로 미리 정해 둔 것입니다. 숨은 뉴런은 뺀 단순한 형태입니다.',
  },
  /* 20층 RBM */
  RBM: {
    controls: [{ b: 'train', l: '학습 시작/멈춤' }, { b: 'dream', l: '꿈꾸기' }, { b: 'reset', l: '처음부터 다시' }],
    data: [0, 1, 3, 2].map(i => GL[i]), names: ['ㄱ', 'ㄴ', '+', 'ㅁ'],
    init(s) { s.m = new RBM(25, 6, 5); s.tr = false; s.v = this.data[0].slice(); s.h = s.m.ph(s.v); s.dr = 0; s.t = 0; s.k = 0; },
    click(s, id) { if (id === 'train') { s.tr = !s.tr; s.dr = 0; } else if (id === 'dream') { s.dr = 14; s.tr = false; s.v = Array.from({ length: 25 }, () => Math.random() < .5 ? 1 : 0); } else this.init(s); },
    step(s, dt) { if (s.tr && s.m.ep < 3000) s.m.fit(this.data, .08, 6); s.t += dt; if (s.t > .3) { s.t = 0; if (s.dr > 0) { s.h = s.m.smp(s.m.ph(s.v)); s.v = s.m.pv(s.h); s.dr--; } else { s.k = (s.k + 1) % 4; s.h = s.m.ph(this.data[s.k]); s.v = s.m.pv(s.h); } } },
    draw(g, s) { clear(g, '보이는 층과 숨은 층을 오가기'); T(g, '배울 그림 4장', 30, 96, 22, C.mu); this.data.forEach((p, k) => grid(g, p, 5, 30 + k * 100, 110, 18)); T(g, s.dr > 0 ? '꿈: 무작위에서 출발해 오가는 중' : '보이는 층: ' + this.names[s.k] + '을 넣고 되살린 것', 30, 262, 22, C.y); grid(g, s.v, 5, 30, 276, 50);
      T(g, '숨은 층 6개', 480, 262, 22, C.mu); bars(g, s.h, 480, 290, 360, 180, C.g, 1); T(g, '학습 ' + s.m.ep + '회 · 복원 오차 ' + Math.round(s.m.err(this.data) * 100) + '%', 480, 150, 26, s.m.err(this.data) < .08 ? C.g : C.y); if (s.tr) T(g, '학습 중…', 480, 190, 22, C.y); },
    read(s) { return [['학습', s.m.ep + '회'], ['복원 오차', Math.round(s.m.err(this.data) * 100) + '%']]; },
    say(s) { return s.m.ep === 0 ? '아직 아무것도 안 배웠어요. <b>학습 시작</b>을 눌러 주세요.' : (s.dr > 0 ? '아무 무늬에서 출발해 두 층을 오가니까, 배운 그림 비슷한 게 떠올라요.' : '복원 오차 <b>' + Math.round(s.m.err(this.data) * 100) + '%</b>예요. <b>꿈꾸기</b>를 눌러 보세요.'); },
  },
  /* 21층 DBN */
  DBN: {
    controls: [{ b: 't1', l: '1층 학습' }, { b: 't2', l: '2층 학습' }, { b: 'gen', l: '위에서부터 그려 보기' }, { b: 'reset', l: '처음부터 다시' }],
    data: [0, 1, 3, 2].map(i => GL[i]),
    init(s) { s.a = new RBM(25, 8, 7); s.b = new RBM(8, 3, 9); s.q1 = 0; s.q2 = 0; s.gi = 0; s.early = false; this.gen(s); },
    gen(s) { s.h2 = [s.gi & 1, (s.gi >> 1) & 1, (s.gi >> 2) & 1]; s.h1 = s.b.pv(s.h2); s.v = s.a.pv(s.h1); },
    click(s, id) { if (id === 't1') s.q1 = 100; else if (id === 't2') { s.q2 = 100; if (s.a.ep === 0) s.early = true; } else if (id === 'gen') { s.gi = (s.gi + 1) % 8; } else return this.init(s); this.gen(s); },
    step(s) { if (s.q1 > 0) { s.a.fit(this.data, .08, 5); s.q1--; this.gen(s); } else if (s.q2 > 0) { s.b.fit(this.data.map(v => s.a.ph(v)), .1, 5); s.q2--; this.gen(s); } },
    draw(g, s) { clear(g, '아래부터 한 층씩 학습하기'); const row = (l, v, y, col, ep) => { T(g, l, 30, y + 34, 22, C.mu); v.forEach((t, i) => { g.beginPath(); g.arc(300 + i * 52, y + 26, 20, 0, TAU); g.fillStyle = 'rgba(' + col + ',' + (.15 + t * .85) + ')'; g.fill(); g.strokeStyle = 'rgb(' + col + ')'; g.lineWidth = 2; g.stroke(); }); if (ep != null) T(g, '학습 ' + ep + '회', 850, y + 34, 22, ep ? C.g : C.r, 'right'); };
      row('맨 위 숨은 층 (3개)', s.h2, 80, '200,240,216', s.b.ep); row('가운데 숨은 층 (8개)', s.h1, 170, '200,240,216', s.a.ep); T(g, '보이는 층 (그림)', 30, 300, 22, C.mu); grid(g, s.v, 5, 300, 270, 48); T(g, '맨 위 3개를 ' + s.h2.join('') + '로 놓고', 580, 380, 22, C.y); T(g, '아래로 내려 그린 그림', 580, 412, 22, C.y); if (s.q1 > 0 || s.q2 > 0) T(g, (s.q1 > 0 ? '1층' : '2층') + ' 학습 중…', 580, 480, 24, C.y); },
    read(s) { return [['1층 학습', s.a.ep + '회'], ['2층 학습', s.b.ep + '회']]; },
    say(s) { return s.a.ep === 0 ? (s.b.ep ? '2층을 먼저 학습시켰습니다. 1층이 아직 아무것도 모르므로 2층은 뜻 없는 재료로 배운 셈입니다. <b>처음부터 다시</b> 해 보십시오.' : '<b>1층 학습</b>부터 누르십시오. 아래층이 먼저 그림을 익혀야 합니다.') : (s.b.ep === 0 ? '1층이 그림을 익혔습니다. 이제 그 결과를 재료로 <b>2층 학습</b>을 누르십시오.' : (s.early ? '1층을 나중에 학습시켰습니다. 2층은 옛 1층의 결과로 배운 상태라 어긋나 있을 수 있습니다.' : '두 층 모두 학습했습니다. <b>위에서부터 그려 보기</b>로 맨 위 3개의 조합마다 무엇이 그려지는지 보십시오.')); },
  },
  /* 22층 역합성곱 */
  DN: {
    controls: [{ k: 'code', l: '작은 지도', opts: [['c', '가운데 한 점'], ['d', '대각선 세 점'], ['k', '네 모서리']], v: 'c' }, { k: 'ker', l: '도장(커널)', opts: [['p', '십자'], ['b', '네모'], ['x', '엑스']], v: 'p' }, { k: 'st', l: '찍는 간격', min: 1, max: 2, step: 1, v: 2 }],
    init(s) { this.change(s); },
    change(s) { s.cd = { c: [0, 0, 0, 0, 1, 0, 0, 0, 0], d: [1, 0, 0, 0, 1, 0, 0, 0, 1], k: [1, 0, 1, 0, 0, 0, 1, 0, 1] }[s.code]; s.kv = { p: [0, 1, 0, 1, 1, 1, 0, 1, 0], b: [1, 1, 1, 1, 1, 1, 1, 1, 1], x: [1, 0, 1, 0, 1, 0, 1, 0, 1] }[s.ker]; s.n = 2 * s.st + 3; s.pos = 0; s.t = 0; },
    step(s, dt) { s.t += dt; if (s.pos < 9) { if (s.t > (s.cd[s.pos] ? .5 : .08)) { s.t = 0; s.pos++; } } else if (s.t > 2.2) { s.pos = 0; s.t = 0; } },
    out(s) { const o = new Array(s.n * s.n).fill(0); for (let p = 0; p < s.pos; p++) if (s.cd[p]) { const i = Math.floor(p / 3) * s.st, j = p % 3 * s.st; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) o[(i + a) * s.n + j + b] += s.kv[a * 3 + b]; } return o; },
    draw(g, s) { clear(g, '점 하나마다 도장 찍기'); T(g, '작은 지도 3×3', 30, 96, 22, C.mu); grid(g, s.cd, 3, 30, 110, 60); if (s.pos < 9) { g.strokeStyle = C.p; g.lineWidth = 6; g.strokeRect(30 + s.pos % 3 * 60 - 1, 110 + Math.floor(s.pos / 3) * 60 - 1, 60, 60); }
      T(g, '도장 3×3', 270, 96, 22, C.p); grid(g, s.kv, 3, 270, 110, 44); const cell = Math.floor(330 / s.n); T(g, '만든 그림 ' + s.n + '×' + s.n, 480, 96, 22, C.y); grid(g, this.out(s).map(t => t / 2), s.n, 480, 110, cell); T(g, '3×3 → ' + s.n + '×' + s.n + ' 로 커졌습니다', 30, 480, 28, C.fg); },
    read(s) { return [['크기', '3×3 → ' + s.n + '×' + s.n], ['찍은 도장', s.cd.slice(0, s.pos).filter(Boolean).length + '개']]; },
    say(s) { return '작은 지도의 켜진 점마다 도장을 콩! 간격이 ' + s.st + '이라 <b>' + s.n + '×' + s.n + '</b> 그림이 돼요. 도장이 겹치는 곳은 더 밝아져요.'; },
  },
  /* 23층 ResNet */
  DRN: {
    controls: [{ k: 'dl', l: '층 수', min: 2, max: 40, step: 1, v: 20 }, { k: 'a', l: '층 하나를 지날 때 남는 비율', min: .5, max: 1, step: .01, v: .9 }, { b: 'skip', l: '지름길 켜기/끄기' }],
    init(s) { s.skip = false; },
    click(s) { s.skip = !s.skip; },
    calc(s) { const r = rng(4), n = 8; let x = new Array(n).fill(1 / Math.sqrt(n)), y = x.slice(); const p = [1], q = [1];
      for (let l = 0; l < s.dl; l++) { const i = Math.floor(r() * n), j = (i + 1 + Math.floor(r() * (n - 1))) % n, th = r() * TAU, c = Math.cos(th), sn = Math.sin(th), rot = v => { const o = v.slice(); o[i] = c * v[i] - sn * v[j]; o[j] = sn * v[i] + c * v[j]; return o; };
        x = rot(x).map(t => t * s.a); const fy = rot(y).map(t => t * s.a * .05); y = y.map((t, k) => t + fy[k]); p.push(Math.hypot(...x)); q.push(Math.hypot(...y)); } return { p, q }; },
    draw(g, s) { clear(g, '깊이 쌓으면 신호가 얼마나 남나'); const c = this.calc(s), ser = [{ v: c.p, c: C.r, n: '지름길 없음' }]; if (s.skip) ser.push({ v: c.q, c: C.g, n: '지름길 있음' }); chart(g, { x: 40, y: 80, w: 800, h: 340 }, ser, 0, 3); T(g, '입력 층', 40, 450, 20, C.mu); T(g, s.dl + '번째 층', 840, 450, 20, C.mu, 'right'); T(g, '끝에 남은 신호  ' + f2(c.p.at(-1), 3) + (s.skip ? '   →   지름길 ' + f2(c.q.at(-1), 2) : ''), 40, 520, 28, s.skip ? C.g : C.y); },
    read(s) { const c = this.calc(s); return [['지름길 없이', f2(c.p.at(-1), 4)], ['지름길 있으면', s.skip ? f2(c.q.at(-1), 2) : '(꺼짐)']]; },
    say(s) { const c = this.calc(s); return s.skip ? s.dl + '층을 지나도 지름길 쪽은 <b>' + f2(c.q.at(-1), 2) + '</b>가 남습니다. 지름길 없는 쪽은 ' + f2(c.p.at(-1), 3) + '입니다.' : f2(s.a) + '을 ' + s.dl + '번 곱하면 <b>' + f2(c.p.at(-1), 3) + '</b>입니다. <b>지름길 켜기</b>를 눌러 비교하십시오.'; },
    note: '층마다 신호를 돌리고 줄이는 단순한 모형으로 신호의 크기만 봅니다.',
  },
  /* 24층 VAE */
  VAE: {
    controls: [{ k: 'z1', l: '압축 공간의 가로', min: -2.5, max: 2.5, step: .05, v: 0 }, { k: 'z2', l: '압축 공간의 세로', min: -2.5, max: 2.5, step: .05, v: 0 }, { b: 'rand', l: '아무 곳이나 고르기' }],
    init(s) { s.sd = [Math.sqrt(PCA.lam[0]), Math.sqrt(PCA.lam[1])]; s.codes = GL.map(v => PCA.enc(v, 2).map((t, i) => t / s.sd[i])); },
    click(s) { s.z1 = clamp(gauss(Math.random), -2.5, 2.5); s.z2 = clamp(gauss(Math.random), -2.5, 2.5); },
    near(s) { return s.codes.map((c, i) => [Math.hypot(c[0] - s.z1, c[1] - s.z2), GN[i]]).sort((a, b) => a[0] - b[0]); },
    draw(g, s) { clear(g, '압축 공간의 아무 곳에서 새 그림 만들기'); const R = { x: 30, y: 70, w: 440, h: 440 }, px = v => R.x + (v + 2.8) / 5.6 * R.w, py = v => R.y + (2.8 - v) / 5.6 * R.h; g.strokeStyle = C.ln; g.lineWidth = 2; g.strokeRect(R.x, R.y, R.w, R.h);
      [1, 2].forEach(k => { g.beginPath(); g.arc(px(0), py(0), k * R.w / 5.6, 0, TAU); g.strokeStyle = '#22305a'; g.stroke(); }); s.codes.forEach((c, i) => T(g, GN[i], px(c[0]), py(c[1]) + 9, 26, C.mu, 'center')); g.beginPath(); g.arc(px(s.z1), py(s.z2), 12, 0, TAU); g.fillStyle = C.y; g.fill();
      T(g, '만든 그림', 540, 96, 22, C.y); grid(g, PCA.dec([s.z1 * s.sd[0], s.z2 * s.sd[1]]), 5, 540, 110, 60); const n = this.near(s); T(g, '가까운 그림: ' + n[0][1] + ', ' + n[1][1], 540, 460, 24, C.fg); T(g, '글자: 배운 그림이 압축된 자리', 540, 500, 19, C.mu); },
    read(s) { const n = this.near(s); return [['고른 자리', '(' + f2(s.z1, 1) + ', ' + f2(s.z2, 1) + ')'], ['가까운 그림', n[0][1] + ', ' + n[1][1]]]; },
    say(s) { const n = this.near(s); return n[0][0] < .25 ? '지금은 <b>' + n[0][1] + '</b> 자리 바로 옆이에요. 점을 조금씩 옮겨 보세요.' : '<b>' + n[0][1] + '</b>와 <b>' + n[1][1] + '</b> 사이예요. 배운 적 없는 자리인데도 그림이 나와요.'; },
    note: '그림 12장의 주성분 두 개를 압축 공간으로 쓴 선형 모형입니다.',
  },
  /* 25층 DCIGN */
  DCIGN: {
    controls: [{ k: 'cx', l: '코드 1: 가로 위치', min: 2, max: 9, step: 1, v: 4 }, { k: 'cy', l: '코드 2: 세로 위치', min: 2, max: 9, step: 1, v: 5 }, { k: 'sz', l: '코드 3: 크기', min: 1, max: 4, step: 1, v: 2 }, { b: 'new', l: '다른 그림 넣기' }],
    render: (cx, cy, sz) => { const o = new Array(144).fill(0); for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (Math.abs(i - cy) < sz && Math.abs(j - cx) < sz) o[i * 12 + j] = 1; return o; },
    init(s) { s.im = this.render(s.cx, s.cy, s.sz); },
    click(s) { const sz = 1 + Math.floor(Math.random() * 3), cx = 2 + Math.floor(Math.random() * 8), cy = 2 + Math.floor(Math.random() * 8); s.im = this.render(cx, cy, sz); let n = 0, sx = 0, sy = 0; s.im.forEach((t, k) => { if (t) { n++; sx += k % 12; sy += Math.floor(k / 12); } }); s.cx = Math.round(sx / n); s.cy = Math.round(sy / n); s.sz = Math.max(1, Math.round((Math.sqrt(n) + 1) / 2)); },
    draw(g, s) { clear(g, '그림 → 뜻 있는 숫자 → 다시 그림'); T(g, '입력 그림', 30, 96, 22, C.mu); grid(g, s.im, 12, 30, 110, 21); T(g, '가운데 코드', 320, 96, 22, C.y); bars(g, [s.cx / 11, s.cy / 11, s.sz / 4], 320, 130, 220, 190, [C.a, C.g, C.p], 1, ['가로', '세로', '크기']); T(g, '다시 그린 그림', 590, 96, 22, C.mu); grid(g, this.render(s.cx, s.cy, s.sz), 12, 590, 110, 21); T(g, '코드: 가로 ' + s.cx + ' · 세로 ' + s.cy + ' · 크기 ' + s.sz, 30, 450, 30, C.y); T(g, '숫자 하나만 바꾸면 그림의 그 성질만 바뀝니다', 30, 496, 22, C.mu); },
    read(s) { return [['코드', s.cx + ', ' + s.cy + ', ' + s.sz], ['그림', '144칸 → 숫자 3개']]; },
    say(s) { return '그림 144칸이 숫자 <b>3개</b>(' + s.cx + ', ' + s.cy + ', ' + s.sz + ')가 됐습니다. 코드 하나만 움직여 그림이 어떻게 바뀌는지 검증해 보십시오.'; },
    note: '코드를 위치·크기로 미리 정해 둔 설명용 모형입니다. 실제로는 이런 코드가 나오도록 학습시킵니다.',
  },
  /* 26층 GAN */
  GAN: {
    controls: [{ b: 'run', l: '겨루기 시작/멈춤' }, { b: 'reset', l: '처음부터 다시' }],
    init(s) { s.a = 1.2; s.b = -2; s.w = [0, 0, 0]; s.on = false; s.it = 0; s.z = Array.from({ length: 400 }, () => gauss(Math.random)); },
    click(s, id) { if (id === 'run') s.on = !s.on; else this.init(s); },
    D(s, x) { return sig(s.w[0] * x + s.w[1] * x * x + s.w[2]); },
    step(s) { if (!s.on) return; for (let k = 0; k < 4; k++) { const gw = [0, 0, 0]; let ga = 0, gb = 0; const n = 32;
      for (let i = 0; i < n; i++) { const xr = 1.5 + .5 * gauss(Math.random), z = gauss(Math.random), xf = s.a * z + s.b, dr = this.D(s, xr), df = this.D(s, xf); [xr, xr * xr, 1].forEach((v, j) => gw[j] += (dr - 1) * v); [xf, xf * xf, 1].forEach((v, j) => gw[j] += df * v); const gx = -(1 - df) * (s.w[0] + 2 * s.w[1] * xf); ga += gx * z; gb += gx; }
      s.w = s.w.map((v, j) => clamp(v - .05 * gw[j] / n, -6, 6)); s.a = clamp(s.a - .03 * ga / n, .05, 3); s.b = clamp(s.b - .03 * gb / n, -4, 4); s.it++; } },
    draw(g, s) { clear(g, '가짜가 진짜를 닮아 가는 과정'); const X = 40, Y = 90, w = 800, h = 360, px = v => X + (v + 4) / 8 * w; g.strokeStyle = C.ln; g.lineWidth = 2; g.strokeRect(X, Y, w, h);
      const hist = new Array(40).fill(0); s.z.forEach(z => { const k = Math.floor((s.a * z + s.b + 4) / 8 * 40); if (k >= 0 && k < 40) hist[k]++; }); hist.forEach((c, k) => { g.fillStyle = 'rgba(255,159,107,.75)'; g.fillRect(X + k * w / 40 + 1, Y + h - c / 400 * 40 / 8 * h * 1.05, w / 40 - 2, c / 400 * 40 / 8 * h * 1.05); });
      g.beginPath(); for (let i = 0; i <= 200; i++) { const v = -4 + i * .04, d = Math.exp(-((v - 1.5) ** 2) / .5) / (.5 * Math.sqrt(TAU)); i ? g.lineTo(px(v), Y + h - d * h * 1.05) : g.moveTo(px(v), Y + h); } g.strokeStyle = C.a; g.lineWidth = 4; g.stroke();
      g.beginPath(); for (let i = 0; i <= 200; i++) { const v = -4 + i * .04; i ? g.lineTo(px(v), Y + h - this.D(s, v) * h) : g.moveTo(px(v), Y + h - this.D(s, v) * h); } g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([8, 6]); g.stroke(); g.setLineDash([]);
      T(g, '파란 선: 진짜 · 주황 막대: 가짜 · 흰 점선: 판별자가 "진짜"라고 보는 정도', X, 480, 19, C.mu); T(g, '가짜의 가운데 ' + f2(s.b) + ' (진짜 1.50) · 폭 ' + f2(s.a) + ' (진짜 0.50)', X, 524, 26, Math.abs(s.b - 1.5) < .3 ? C.g : C.y); },
    read(s) { return [['가짜의 가운데', f2(s.b) + ' (진짜 1.50)'], ['가짜의 폭', f2(s.a) + ' (진짜 0.50)'], ['겨룬 횟수', String(s.it)]]; },
    say(s) { return s.it === 0 ? '가짜는 지금 −2 근처, 진짜는 1.5 근처에 있습니다. <b>겨루기 시작</b>을 누르십시오.' : (Math.abs(s.b - 1.5) < .3 ? '가짜의 가운데가 <b>' + f2(s.b) + '</b>까지 왔습니다. 판별자의 점선이 평평해질수록 가려내기 어렵다는 뜻입니다.' : s.it + '번 겨뤘고, 가짜의 가운데는 ' + f2(s.b) + '입니다. 판별자가 가려내는 쪽을 피해 가짜가 움직입니다. 왔다 갔다 흔들리는 것도 이 구조의 특징입니다.'); },
    note: '숫자 하나짜리 데이터에, 생성자와 판별자를 가장 작은 식으로 둔 실제 학습입니다.',
  },
  /* 27층 NTM */
  NTM: {
    controls: [{ k: 'n', l: '외울 줄 수', min: 3, max: 6, step: 1, v: 4 }, { b: 'again', l: '새 문제로 다시' }],
    init(s) { this.change(s); },
    change(s) { s.seq = Array.from({ length: s.n }, () => Array.from({ length: 4 }, () => Math.random() < .5 ? 1 : 0)); s.tick = 0; s.t = 0; },
    click(s) { this.change(s); },
    step(s, dt) { s.t += dt; if (s.t > .7 && s.tick < 2 * s.n + 1) { s.t = 0; s.tick++; } },
    draw(g, s) { clear(g, '공책에 쓰고, 돌아가서 읽기'); const wr = Math.min(s.tick, s.n), rd = clamp(s.tick - s.n - 1, 0, s.n), col = (v, x, y, on, c) => v.forEach((b, i) => { g.fillStyle = on ? (b ? c : '#26335c') : '#161f3d'; g.fillRect(x, y + i * 26, 56, 23); });
      T(g, '들어온 순서', 30, 96, 22, C.mu); s.seq.forEach((v, k) => col(v, 190 + k * 70, 70, true, k < wr ? C.y : C.mu)); T(g, '공책 (외부 기억 8칸)', 30, 262, 22, C.a); for (let k = 0; k < 8; k++) col(s.seq[k] || [0, 0, 0, 0], 190 + k * 70, 236, k < wr, C.a);
      const head = s.tick <= s.n ? Math.min(wr, s.n - 1) : (rd > 0 ? rd - 1 : 0), hx = 190 + head * 70 + 28; g.fillStyle = C.p; g.beginPath(); g.moveTo(hx, 350); g.lineTo(hx - 14, 376); g.lineTo(hx + 14, 376); g.fill(); T(g, s.tick <= s.n ? '쓰는 자리' : '읽는 자리', hx, 400, 19, C.p, 'center');
      T(g, '나간 순서', 30, 462, 22, C.mu); s.seq.forEach((v, k) => col(v, 190 + k * 70, 436, k < rd, C.g)); T(g, s.tick <= s.n ? '쓰기 ' + wr + '/' + s.n : (rd < s.n ? '읽기 ' + rd + '/' + s.n : '끝: 그대로 옮겨 적었습니다'), 850, 96, 26, rd === s.n ? C.g : C.y, 'right'); },
    read(s) { const rd = clamp(s.tick - s.n - 1, 0, s.n); return [['단계', s.tick <= s.n ? '쓰기 ' + Math.min(s.tick, s.n) + '/' + s.n : '읽기 ' + rd + '/' + s.n], ['공책', '8칸 × 4']]; },
    say(s) { const rd = clamp(s.tick - s.n - 1, 0, s.n); return s.tick <= s.n ? '들어오는 줄을 공책에 <b>한 칸씩</b> 씁니다. 쓰는 자리도 한 칸씩 옮깁니다.' : (rd < s.n ? '입력이 끝났습니다. 처음 칸으로 돌아가 <b>한 칸씩 읽어</b> 내보냅니다.' : s.n + '줄을 틀리지 않고 옮겨 적었습니다. 줄 수를 늘려도 같은 절차로 해냅니다.'); },
    note: '"복사하기"를 다 배운 뒤의 움직임을 차례대로 재현한 것입니다. 실제로는 이 절차를 스스로 학습합니다.',
  },
};
