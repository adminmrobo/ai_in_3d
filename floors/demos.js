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

/* ================= 구역 ①③④에 쓰는 층별 내용 =================
   io: [넣는 것, 나오는 것] · part: 핵심 부품을 한 줄로 늘어놓은 그림 · curve: 그래프 판에 그릴 곡선 */
const K = { i: '#ffd76a', h: '#7fe0a8', o: '#ff9f6b', x: '#ffb36b', r: '#6fb1ff', m: '#3f6dff', g: '#9c8cff', p: '#c8f0d8', s: '#ff6b5e', k: '#ff8fc7', z: '#bfc8e6', bx: '#3b55a5', gy: '#6b7493', gt: '#f4f7ff' };
const memo = fn => { const c = {}; return x => (x in c ? c[x] : (c[x] = fn(x))); };
const mcPi = p => { const M = [[p, (1 - p) * .6, (1 - p) * .4], [.3, .4, .3], [.2, .4, .4]]; let v = [1 / 3, 1 / 3, 1 / 3]; for (let k = 0; k < 300; k++) v = [0, 1, 2].map(j => v[0] * M[0][j] + v[1] * M[1][j] + v[2] * M[2][j]); return v[0]; };
const aeErr = memo(k => GL.reduce((t, v) => t + mae(v, PCA.dec(PCA.enc(v, k))), 0) / GL.length);
const daeErr = memo(q => { const nz = q / 20; let t = 0, n = 0; GL.forEach((v, gi) => { for (let ns = 1; ns <= 4; ns++) { const r = rng(ns * 97 + gi + 1), x = v.map(u => r() < nz ? 1 - u : u); t += mae(v, DAEN(x)); n++; } }); return t / n; });
const saeErr = memo(sp => { let t = 0; for (let a = 1; a <= 12; a++) { const s = { ga: a, gb: a % 12 + 1, sp }, q = DEMOS.SAE.calc(s); t += mae(q.v, q.o); } return t / 12; });
const dbnErr = (() => { let tab; return n => { if (!tab) { const data = [0, 1, 3, 2].map(i => GL[i]), m = new RBM(25, 8, 7); tab = [m.err(data)]; for (let k = 1; k <= 30; k++) { m.fit(data, .08, 10); tab.push(m.err(data)); } } return tab[n]; }; })();
const lifV = (() => { const tab = [0]; let v = 0; for (let t = 1; t <= 40; t++) { v = v * .88 + .2; if (v > 1) v = 0; tab.push(v); } return t => tab[t]; })();

export const EXTRA = {
  P: { say: '점 하나를 넣으면 "켜짐" 아니면 "꺼짐", 딱 둘 중 하나가 나와요.', io: ['숫자 두 개 (점의 위치)', '켜짐 또는 꺼짐'],
    part: { items: [['ball', K.i, '입력'], ['box', K.bx, '가중치 곱하기'], ['ball', K.h, '모두 더하기'], ['gate', K.gt, '문턱과 견주기'], ['ball', K.o, '켜짐 / 꺼짐']], t: ['입력마다 가중치를 곱합니다.', '모두 더하고 편향을 보탭니다.', '문턱(0)을 넘으면 1, 아니면 0을 냅니다.'], say: '곱하고, 더하고, 문턱과 견줍니다. 부품은 이것이 전부입니다.' },
    curve: { f: x => x > 0 ? 1 : 0, lo: -2, hi: 2, v: .6, xl: '더한 값', yl: '출력', title: '문턱 함수', t: ['더한 값이 0을 넘는 순간 출력이 0에서 1로 뜁니다.', '중간이 없습니다. 그래서 퍼셉트론은 "예/아니오"만 말합니다.'] } },
  FF: { say: '점 위치를 넣으면 주황일 가능성이 0~1 사이 숫자로 나와요. 1층과 달리 중간값이 있어요!', io: ['숫자 두 개 (점의 위치)', '0과 1 사이의 값 (주황일 가능성)'],
    part: { items: [['ball', K.i, '입력'], ['box', K.h, '은닉층: 뉴런마다 선 하나'], ['box', K.bx, '출력: 선들을 조합'], ['ball', K.o, '출력']], t: ['은닉 뉴런 하나가 직선 하나를 맡습니다.', '출력 뉴런이 그 직선들을 더해 꺾인 경계를 만듭니다.', '은닉 뉴런이 늘수록 경계가 정교해집니다.'], say: '은닉 뉴런 수만큼 선을 긋고, 출력에서 한 번 더 더합니다.' },
    curve: { f: Math.tanh, lo: -3, hi: 3, v: .8, xl: '더한 값', yl: '은닉 뉴런의 출력', title: '은닉 뉴런의 반응 (tanh)', t: ['은닉 뉴런은 문턱 대신 부드러운 곡선을 씁니다.', '부드러워야 "조금 고치면 조금 달라지는" 학습을 할 수 있습니다.'] } },
  DFF: { say: '넣고 나오는 건 2층과 같아요. 대신 가운데 상자 안이 여러 겹이에요.', io: ['숫자 두 개 (점의 위치)', '0과 1 사이의 값 (주황일 가능성)'],
    part: { items: [['ball', K.i, '입력'], ['box', K.h, '1겹: 선'], ['box', K.h, '2겹: 선의 조합'], ['box', K.h, '3겹: 조합의 조합'], ['ball', K.o, '출력']], t: ['첫 겹은 직선을 긋습니다.', '다음 겹은 앞 겹의 결과를 재료로 다시 조합합니다.', '겹이 늘수록 재료가 복잡해져 더 복잡한 모양을 만듭니다.'], say: '앞 겹의 출력이 다음 겹의 입력입니다. 같은 계산을 겹 수만큼 되풀이합니다.' },
    curve: { f: x => Math.tanh(2 * Math.tanh(2 * x)), lo: -2, hi: 2, v: .3, xl: '처음 넣은 값', yl: '두 겹을 지난 값', title: '곡선을 두 번 지나면', t: ['부드러운 곡선도 두 번 지나면 훨씬 가파르게 꺾입니다.', '겹을 쌓으면 적은 뉴런으로도 날카로운 경계를 만들 수 있습니다.'] } },
  RBF: { say: '점을 넣으면 기준점들과 얼마나 가까운지를 보고 답을 내요.', io: ['숫자 두 개 (점의 위치)', '0과 1 사이의 값 (주황일 가능성)'],
    part: { items: [['ball', K.i, '입력'], ['box', '#8fe3d0', '기준점까지 거리 재기'], ['gate', K.gt, '가까울수록 큰 값'], ['box', K.bx, '가중치로 더하기'], ['ball', K.o, '출력']], t: ['은닉 뉴런은 자기 기준점까지의 거리를 잽니다.', '가까우면 1에 가깝고, 멀면 0에 가까운 값을 냅니다.', '출력은 그 값들을 가중치로 더합니다.'], say: '거리를 재고, 종 모양 곡선에 넣고, 더합니다.' },
    curve: { f: x => Math.exp(-x * x / (2 * .35 * .35)), lo: -1.5, hi: 1.5, v: .3, xl: '기준점에서 떨어진 거리', yl: '반응', title: '거리에 따른 반응 (폭 0.35)', t: ['기준점 바로 위에서 반응이 1로 가장 큽니다.', '멀어지면 빠르게 0이 됩니다. 뉴런 하나가 동그란 영역 하나를 맡는 셈입니다.'] } },
  ELM: { say: '넣고 나오는 건 2층과 같은데, 배우는 방법이 계산 한 번이에요.', io: ['숫자 두 개 (점의 위치)', '0과 1 사이의 값 (주황일 가능성)'],
    part: { items: [['ball', K.i, '입력'], ['box', K.gy, '은닉층: 무작위, 고정'], ['box', K.bx, '출력 가중치: 계산 1번'], ['ball', K.o, '출력']], t: ['은닉층 가중치는 무작위로 뽑고 손대지 않습니다.', '출력 가중치만 연립방정식 한 번으로 구합니다.', '되풀이 학습이 없습니다.'], say: '회색 부품은 고치지 않습니다. 파란 부품만 한 번 계산합니다.' },
    curve: { f: x => Math.tanh(1.7 * x - .4), lo: -3, hi: 3, v: .5, xl: '입력', yl: '은닉 뉴런의 출력', title: '무작위로 뽑힌 은닉 뉴런 하나', t: ['기울기 1.7, 치우침 −0.4처럼 뽑힌 값을 그대로 씁니다.', '이런 곡선을 여러 개 뽑아 두고, 어떻게 섞을지만 계산합니다.'] } },
  MC: { say: '오늘 날씨를 넣으면 내일 날씨가 확률로 나와요. 어제는 안 봐요!', io: ['오늘의 상태 (맑음·흐림·비)', '내일의 상태'],
    part: { items: [['ball', '#ffcf8a', '오늘 상태'], ['box', K.bx, '전이 확률표'], ['gate', K.gt, '확률대로 뽑기'], ['ball', '#ffcf8a', '내일 상태']], loops: [[3, 0, '내일이 다시 오늘이 됩니다']], t: ['오늘 상태에 해당하는 확률표의 한 줄을 봅니다.', '그 확률대로 내일 상태를 뽑습니다.', '어제 이전은 보지 않습니다.'], say: '표에서 한 줄을 읽고, 뽑고, 되풀이합니다.' },
    curve: { f: mcPi, lo: .1, hi: .95, v: .7, xl: '맑음이 이어질 확률', yl: '오래 돌렸을 때 맑은 날 비율', title: '확률 하나가 전체 비율을 바꿉니다', t: ['맑음이 이어질 확률을 올리면 맑은 날의 비율이 함께 올라갑니다.', '이 비율은 어디서 시작했든 같습니다.'] } },
  SVM: { say: '점을 넣으면 어느 무리인지 나와요. 경계를 최대한 넓게 잡는 게 특기예요.', io: ['숫자 두 개 (점의 위치)', '어느 무리인가'],
    part: { items: [['ball', K.i, '점'], ['box', K.bx, '선까지 거리 재기'], ['gate', K.gt, '여백 안쪽인가'], ['box', K.r, '안쪽이면 벌 (C)'], ['ball', K.o, '선 고치기']], t: ['점마다 선까지의 거리를 잽니다.', '여백 안쪽에 들어온 점에만 벌을 매깁니다.', '벌이 줄어드는 쪽으로 선을 고칩니다.'], say: '여백 밖의 점은 계산에서 빠집니다. 벌이 0이기 때문입니다.' },
    curve: { f: x => Math.max(0, 1 - x), lo: -1.5, hi: 2.5, v: .4, xl: '선에서 떨어진 거리 (맞는 쪽이 +)', yl: '벌', title: '여백 안쪽에만 매기는 벌', t: ['거리가 1(여백)보다 멀면 벌이 0입니다.', '그래서 멀리 있는 점은 선을 정하는 데 영향을 주지 않습니다.'] } },
  KN: { say: '정답 없이 데이터만 넣어요. 그러면 데이터 모양을 닮은 지도가 나와요.', io: ['정답 없는 데이터 (점의 위치)', '데이터 모양을 닮은 뉴런 지도'],
    part: { items: [['ball', K.i, '데이터 하나'], ['box', K.bx, '가장 가까운 뉴런 찾기'], ['box', K.h, '이웃 뉴런도 함께'], ['ball', K.o, '조금 다가가기']], loops: [[3, 0, '다음 데이터로']], t: ['데이터 하나를 뽑습니다.', '가장 가까운 뉴런이 이깁니다.', '이긴 뉴런과 그물 위의 이웃이 데이터 쪽으로 조금 움직입니다.'], say: '찾고, 이웃을 고르고, 조금 움직입니다. 정답은 쓰지 않습니다.' },
    curve: { f: x => Math.exp(-x * x / 2), lo: 0, hi: 4, v: 1, xl: '이긴 뉴런에서 그물 위 거리', yl: '따라 움직이는 정도', title: '이웃일수록 많이 따라갑니다', t: ['이긴 뉴런은 가장 많이, 이웃은 거리에 따라 덜 움직입니다.', '이 때문에 그물에서 가까운 뉴런끼리 비슷한 데이터를 맡게 됩니다.'] } },
  AE: { say: '그림을 넣으면 같은 그림이 나와요. 중요한 건 가운데에서 몇 개로 줄었는지예요.', io: ['그림 (숫자 25개)', '같은 그림 (복원한 것)'],
    part: { items: [['tiles', K.i, '입력'], ['box', K.bx, '인코더: 줄이기'], ['ball', K.h, '좁은 통로 (코드)'], ['box', K.bx, '디코더: 늘리기'], ['tiles', K.x, '출력']], t: ['인코더가 숫자를 줄입니다.', '가운데 통로에는 몇 개의 숫자만 지나갑니다.', '디코더가 그 숫자만으로 원래 그림을 되살립니다.'], say: '25개를 줄였다가 다시 25개로. 가운데 숫자가 그림의 요약입니다.' },
    curve: { f: aeErr, lo: 1, hi: 10, step: 1, v: 2, xl: '통로 폭 (숫자 개수)', yl: '평균 복원 오차', title: '통로가 넓을수록 오차가 줍니다', t: ['통로 폭을 넓히면 그림 12장의 평균 오차가 줄어듭니다.', '폭을 얼마로 할지는 "얼마나 줄일까"와 "얼마나 잃을까"의 저울질입니다.'] } },
  DAE: { say: '얼룩진 그림을 넣으면 깨끗한 그림이 나와요.', io: ['잡음이 섞인 그림', '깨끗한 원본 그림'],
    part: { items: [['tiles', K.i, '원본'], ['gate', K.gt, '잡음 섞기'], ['box', K.bx, '인코더'], ['ball', K.h, '통로'], ['box', K.bx, '디코더'], ['tiles', K.x, '출력']], t: ['원본에 일부러 잡음을 섞어 넣습니다.', '통로를 지나 그림을 되살립니다.', '출력은 잡음 섞인 입력이 아니라 원본과 비교합니다.'], say: '비교 대상이 원본이라는 점, 그것이 9층과의 유일한 차이입니다.' },
    curve: { f: q => daeErr(Math.round(q * 20)), lo: 0, hi: .5, step: .05, v: .15, xl: '잡음 양', yl: '출력과 원본의 차이', title: '잡음이 늘면 어디까지 버티나', t: ['잡음이 적을 때는 출력이 원본과 거의 같습니다.', '잡음이 그림의 특징을 덮을 만큼 많아지면 차이가 빠르게 커집니다.'] } },
  SAE: { say: '그림을 넣으면 같은 그림과 함께, 켜진 뉴런 몇 개가 나와요. 그 번호가 요약이에요.', io: ['그림 (두 그림이 겹친 것)', '같은 그림, 그리고 켜진 뉴런 몇 개'],
    part: { items: [['tiles', K.i, '입력'], ['box', K.h, '넓은 은닉층'], ['gate', K.gt, '몇 개만 켜기'], ['box', K.bx, '디코더'], ['tiles', K.x, '출력']], t: ['은닉층은 입력보다 넓어도 됩니다.', '그 대신 한 번에 켜지는 뉴런 수를 제한합니다.', '켜진 뉴런 몇 개만으로 그림을 되살립니다.'], say: '폭은 넓게, 켜는 수는 적게. 켜진 번호가 곧 요약입니다.' },
    curve: { f: saeErr, lo: 1, hi: 6, step: 1, v: 2, xl: '켤 수 있는 뉴런 수', yl: '평균 복원 오차', title: '몇 개만 켜도 충분한가', t: ['두 그림이 겹친 입력은 뉴런 2개를 켜면 오차가 크게 줄어듭니다.', '더 많이 켜도 얻는 것은 적습니다.'] } },
  DCN: { say: '그림을 넣으면 어디에 어떤 무늬가 있는지 나와요.', io: ['그림 (칸마다 밝기)', '무늬가 어디 있는지, 그리고 무엇인지'],
    part: { items: [['tiles', '#dfe6ff', '그림'], ['box', K.k, '창 대기 (어디서나 같은 가중치)'], ['gate', K.gt, '음수는 0으로 (ReLU)'], ['tiles', K.h, '특징 지도'], ['ball', K.o, '판정']], t: ['작은 창을 그림의 모든 자리에 댑니다.', '닮은 정도가 음수면 0으로 버립니다.', '남은 값들이 "무늬가 어디 있나"를 알려 주는 지도가 됩니다.'], say: '창 하나의 가중치 9개를 모든 자리에서 다시 씁니다.' },
    curve: { f: x => Math.max(0, x), lo: -3, hi: 3, v: 1.2, xl: '창과 닮은 정도', yl: '반응', title: '닮지 않으면 0 (ReLU)', t: ['창과 반대 무늬면 값이 음수가 되고, 0으로 버려집니다.', '닮은 곳만 남기 때문에 지도가 또렷해집니다.'] } },
  RNN: { say: '값을 하나씩 순서대로 넣어요. 나오는 값에 앞에서 넣은 것의 흔적이 남아요.', io: ['순서대로 들어오는 값', '지금까지를 반영한 값'],
    part: { items: [['ball', K.i, '지금 입력'], ['box', K.bx, '더하기'], ['ball', K.r, '은닉 상태 (기억)'], ['ball', K.o, '출력']], loops: [[2, 1, '방금 상태를 다음 순간에 다시 넣기']], t: ['지금 입력과 방금 전의 은닉 상태를 더합니다.', '그 결과가 새 은닉 상태가 됩니다.', '이 고리 덕분에 앞의 입력이 뒤에 영향을 줍니다.'], say: '고리 하나가 더해졌습니다. 방금 낸 값을 다시 받습니다.' },
    curve: { f: t => Math.pow(.8, t), lo: 0, hi: 24, step: 1, v: 5, xl: '지난 걸음 수', yl: '남은 기억 (되먹임 0.8)', title: '걸음마다 0.8배씩 줄어듭니다', t: ['한 걸음에 0.8배씩이면 10걸음 뒤 약 11%만 남습니다.', '긴 문장의 앞부분을 잊는 이유입니다.'] } },
  ESN: { say: '순서대로 값을 넣으면 다음에 올 값을 맞혀요.', io: ['순서대로 들어오는 값', '다음에 올 값의 예측'],
    part: { items: [['ball', K.i, '입력'], ['box', K.gy, '저수지: 무작위, 고정'], ['box', K.bx, '읽는 선: 학습'], ['ball', K.o, '출력']], loops: [[1, 1, '메아리']], t: ['입력이 무작위로 얽힌 저수지에 들어갑니다.', '저수지 안에서 신호가 메아리칩니다.', '그 메아리를 읽어 내는 선만 계산해서 구합니다.'], say: '회색 저수지는 고치지 않습니다. 읽는 선만 구합니다.' },
    curve: { f: t => Math.pow(.9, t), lo: 0, hi: 40, step: 1, v: 10, xl: '지난 걸음 수', yl: '메아리 크기 (세기 0.9)', title: '메아리가 잦아드는 속도', t: ['세기 0.9면 걸음마다 0.9배로 줄어듭니다.', '1을 넘기면 메아리가 잦아들지 않을 수 있어서, 보통 1보다 조금 작게 둡니다.'] } },
  GRU: { say: '순서대로 넣는 건 13층과 같아요. 대신 옛 기억을 더 오래 지켜요.', io: ['순서대로 들어오는 값', '오래 지킨 기억을 반영한 값'],
    part: { items: [['ball', K.i, '입력'], ['gate', K.gt, '과거 참고 문'], ['box', K.bx, '새 후보 값'], ['gate', K.gt, '기억 유지 문'], ['ball', K.g, '기억'], ['ball', K.o, '출력']], loops: [[4, 1, '옛 기억']], t: ['과거 참고 문이 옛 기억을 얼마나 볼지 정합니다.', '새 후보 값을 만듭니다.', '기억 유지 문이 옛 기억과 새 값을 어떤 비율로 섞을지 정합니다.'], say: '문은 0과 1 사이의 숫자입니다. 섞는 비율을 정합니다.' },
    curve: { f: z => Math.pow(z, 20), lo: 0, hi: 1, v: .9, xl: '기억 유지 문', yl: '20걸음 뒤 남는 양', title: '문이 1에 가까워야 오래 갑니다', t: ['문을 0.9로 두면 20걸음 뒤 12%, 0.99면 82%가 남습니다.', '이 값을 손으로 정하지 않고 학습으로 정하는 것이 GRU입니다.'] } },
  LSTM: { say: '순서대로 넣으면, 기억 세포에 오래 지킨 기억을 반영한 값이 나와요.', io: ['순서대로 들어오는 값', '오래 지킨 기억을 반영한 값'],
    part: { items: [['ball', K.i, '입력'], ['gate', K.gt, '받기 문'], ['ball', K.m, '기억 세포'], ['gate', K.gt, '내보내기 문'], ['ball', K.o, '출력']], loops: [[2, 2, '잊기 문을 지나 그대로 이어짐']], t: ['받기 문이 새 정보를 기억 세포에 넣을지 정합니다.', '잊기 문이 기억 세포의 옛 값을 얼마나 남길지 정합니다.', '내보내기 문이 기억을 밖으로 얼마나 보일지 정합니다.'], say: '기억 세포는 따로 흐르고, 문 세 개가 드나듦을 관리합니다.' },
    curve: { f: Math.tanh, lo: -3, hi: 3, v: 1.5, xl: '기억 세포의 값', yl: '밖으로 내보내는 값 (문이 열렸을 때)', title: '내보낼 때만 눌러 줍니다', t: ['기억 세포 안의 값은 커져도 괜찮습니다.', '내보낼 때 −1과 1 사이로 눌러 다음 계산이 다루기 쉽게 합니다.'] } },
  LSM: { say: '값 대신 톡톡 쏘는 신호(스파이크)를 넣어요. 퍼져 나간 무늬를 읽어서 답을 내요.', io: ['스파이크의 흐름', '스파이크 무늬를 읽은 값'],
    part: { items: [['ball', K.i, '들어온 스파이크'], ['box', K.bx, '전압 쌓기 (조금씩 샘)'], ['gate', K.gt, '문턱을 넘으면 발사'], ['ball', K.s, '스파이크']], loops: [[2, 1, '쏘고 나면 전압 0으로']], t: ['스파이크가 들어오면 전압이 쌓입니다.', '가만히 두면 전압이 조금씩 샙니다.', '문턱을 넘으면 한 번 쏘고 0으로 돌아갑니다.'], say: '쌓이고, 새고, 넘으면 쏩니다. 값이 아니라 "언제 쏘는가"가 정보입니다.' },
    curve: { f: lifV, lo: 0, hi: 40, step: 1, v: 6, xl: '시간', yl: '전압 (문턱 1)', title: '전압이 차오르다 쏘고 떨어집니다', t: ['입력이 일정하면 전압이 차오르다 문턱에서 뚝 떨어집니다.', '떨어지는 순간이 스파이크입니다. 톱니 모양이 되풀이됩니다.'] } },
  HN: { say: '망가진 그림을 넣으면, 저장해 둔 그림 중 가장 가까운 걸로 되돌려 줘요.', io: ['망가진 패턴', '저장해 둔 패턴 가운데 가장 가까운 것'],
    part: { items: [['ball', '#ffe9a8', '뉴런 하나 고르기'], ['box', K.bx, '이웃들의 뜻 더하기'], ['gate', K.gt, '부호 보기'], ['ball', '#ffe9a8', '+1 또는 −1']], loops: [[3, 0, '다른 뉴런으로']], t: ['뉴런 하나를 고릅니다.', '연결된 모든 이웃의 값을 가중치로 더합니다.', '합이 양수면 +1, 음수면 −1로 바꿉니다.'], say: '하나씩 고르고, 이웃의 뜻에 맞춥니다. 더 바뀔 것이 없으면 멈춥니다.' },
    curve: { f: x => x > 0 ? 1 : -1, lo: -2, hi: 2, v: .5, xl: '이웃들의 뜻 합계', yl: '뉴런의 새 상태', title: '합의 부호만 봅니다', t: ['합이 0보다 크면 +1, 작으면 −1입니다.', '망설임이 없어서, 한 번 자리를 잡으면 움직이지 않습니다.'] } },
  BM: { say: '아무 상태나 넣으면, 확률로 흔들리다가 저장된 그림 근처로 가요.', io: ['아무 상태', '저장된 패턴에 가까운 상태 (확률적으로)'],
    part: { items: [['ball', '#ffe9a8', '뉴런 하나 고르기'], ['box', K.bx, '이웃들의 뜻 더하기'], ['gate', K.gt, '확률로 정하기 (온도)'], ['ball', K.p, '켜짐 또는 꺼짐']], loops: [[3, 0, '다른 뉴런으로']], t: ['18층처럼 이웃들의 뜻을 더합니다.', '그 합을 "켜질 확률"로 바꿉니다.', '확률대로 켜거나 끕니다. 온도가 높으면 확률이 반반에 가까워집니다.'], say: '부호 대신 확률입니다. 가끔 일부러 틀린 쪽으로도 갑니다.' },
    curve: { f: x => sig(2 * x), lo: -3, hi: 3, v: .5, xl: '이웃들의 뜻 합계', yl: '켜질 확률 (온도 1)', title: '합이 클수록 켜질 확률이 큽니다', t: ['18층의 계단이 부드러운 곡선이 됐습니다.', '온도를 올리면 이 곡선이 눕고, 내리면 계단에 가까워집니다.'] } },
  RBM: { say: '그림을 넣으면 숨은 층이 켜지고, 거기서 그림을 다시 그려 내요.', io: ['그림 (보이는 층)', '숨은 층의 켜짐, 그리고 되살린 그림'],
    part: { items: [['tiles', '#ffe9a8', '보이는 층'], ['box', K.bx, '숨은 층 확률 계산'], ['ball', K.p, '숨은 층'], ['box', K.bx, '보이는 층 확률 계산'], ['tiles', '#ffe9a8', '되살린 보이는 층']], loops: [[4, 0, '두 층을 번갈아 오가기']], t: ['보이는 층에서 숨은 층의 확률을 한꺼번에 계산합니다.', '숨은 층에서 보이는 층을 한꺼번에 되살립니다.', '원래 그림일 때와 되살린 그림일 때, 보이는 뉴런과 숨은 뉴런이 함께 켜진 정도를 비교해 그 차이만큼 가중치를 고칩니다.'], say: '같은 줄끼리 연결이 없어서 한 줄을 한 번에 계산합니다.' },
    curve: { f: sig, lo: -5, hi: 5, v: 1, xl: '보이는 층에서 받은 합계', yl: '숨은 뉴런이 켜질 확률', title: '숨은 뉴런 하나의 확률', t: ['받은 합계가 클수록 켜질 확률이 1에 가까워집니다.', '모든 숨은 뉴런이 서로 상관없이 각자 이 곡선을 씁니다.'] } },
  DBN: { say: '그림을 넣으면 위층으로 갈수록 더 간추린 특징이 나와요.', io: ['그림', '층을 올라갈수록 간추린 특징'],
    part: { items: [['tiles', '#ffe9a8', '그림'], ['box', K.bx, 'RBM 1: 먼저 학습'], ['ball', K.p, '숨은 층 1'], ['box', K.bx, 'RBM 2: 다음에 학습'], ['ball', K.p, '숨은 층 2']], t: ['첫 RBM을 그림으로 학습합니다.', '그 숨은 층의 결과를 다음 RBM의 "보이는 층"으로 씁니다.', '이렇게 아래부터 한 층씩 쌓습니다.'], say: '한 번에 하나씩입니다. 아래가 끝나야 위를 시작합니다.' },
    curve: { f: dbnErr, lo: 0, hi: 30, step: 1, v: 3, xl: '1층 학습 횟수 (×10)', yl: '복원 오차', title: '1층이 그림을 익히는 과정', t: ['학습 횟수가 늘수록 1층의 복원 오차가 줄어듭니다.', '오차가 충분히 줄어든 뒤에 2층을 학습시켜야 재료가 쓸 만합니다.'] } },
  DN: { say: '작은 특징 지도를 넣으면 큰 그림이 나와요. 12층과 반대 방향이에요!', io: ['작은 지도 (특징)', '큰 그림'],
    part: { items: [['ball', K.i, '작은 지도의 점 하나'], ['box', K.k, '도장(커널)을 곱해 찍기'], ['box', K.bx, '겹치는 곳은 더하기'], ['tiles', '#dfe6ff', '큰 그림']], t: ['작은 지도의 점 하나를 고릅니다.', '그 자리에 도장을 찍습니다. 점의 값이 클수록 진하게 찍습니다.', '옆 도장과 겹치는 칸은 더합니다.'], say: '12층의 창을 거꾸로 썼습니다. 읽는 대신 찍습니다.' },
    curve: { f: s => 2 * s + 3, lo: 1, hi: 4, step: 1, v: 2, xl: '찍는 간격', yl: '그림 한 변의 칸 수', title: '간격이 그림 크기를 정합니다', t: ['3×3 지도를 간격 2로 찍으면 7×7이 됩니다.', '간격을 넓힐수록 그림이 커지고, 도장 사이가 벌어집니다.'] } },
  DRN: { say: '아주 깊은 신경망에 넣어도, 신호가 끝까지 살아서 나와요.', io: ['입력 (아주 깊은 신경망에)', '끝까지 살아서 도착한 신호'],
    part: { items: [['ball', K.i, '입력 x'], ['box', K.bx, '층이 계산한 값 F(x)'], ['ball', K.h, '더하기: x + F(x)'], ['ball', K.o, '다음 층으로']], loops: [[0, 2, '지름길: x를 그대로']], t: ['층이 값 F(x)를 계산합니다.', '입력 x를 지름길로 그대로 가져옵니다.', '둘을 더해 다음 층으로 넘깁니다.'], say: '층은 "고칠 만큼"만 계산하고, 원래 값은 지름길로 보냅니다.' },
    curve: { f: n => Math.pow(.9, n), lo: 0, hi: 40, step: 1, v: 20, xl: '층 수', yl: '남는 신호 (지름길 없이, 층마다 0.9배)', title: '지름길이 없으면 이렇게 사라집니다', t: ['층마다 0.9배면 20층 뒤 12%, 40층 뒤 1.5%만 남습니다.', '지름길이 있으면 원래 값이 그대로 더해져 이 곡선을 따르지 않습니다.'] } },
  VAE: { say: '그림을 넣으면 복원도 하고, 비슷하지만 새로운 그림도 만들 수 있어요.', io: ['그림', '비슷하지만 새로운 그림'],
    part: { items: [['tiles', K.i, '입력'], ['box', K.bx, '인코더'], ['ball', K.p, '평균과 퍼진 정도'], ['gate', K.gt, '그 근처에서 하나 뽑기'], ['box', K.bx, '디코더'], ['tiles', K.x, '출력']], t: ['인코더가 "이 근처"라는 영역(평균과 퍼진 정도)을 냅니다.', '그 영역에서 점 하나를 뽑습니다.', '디코더가 그 점으로 그림을 만듭니다.'], say: '점 하나가 아니라 영역을 냅니다. 뽑기가 한 번 들어갑니다.' },
    curve: { f: x => Math.exp(-x * x / 2), lo: -3, hi: 3, v: .8, xl: '압축 공간의 자리 (가운데가 0)', yl: '뽑힐 가능성', title: '가운데일수록 자주 뽑힙니다', t: ['압축 공간 전체가 이 종 모양을 따르도록 맞춥니다.', '그래서 새 그림을 만들 때 이 모양에서 뽑기만 하면 됩니다.'] } },
  DCIGN: { say: '그림을 넣으면 "위치, 크기" 같은 뜻 있는 숫자가 나오고, 거기서 다시 그려요.', io: ['그림', '뜻 있는 숫자 몇 개, 그리고 다시 그린 그림'],
    part: { items: [['tiles', '#dfe6ff', '그림'], ['box', K.k, '합성곱으로 줄이기 (12층)'], ['ball', K.p, '코드: 위치·크기'], ['box', K.k, '역합성곱으로 그리기 (22층)'], ['tiles', '#dfe6ff', '다시 그린 그림']], t: ['합성곱이 그림에서 코드를 뽑습니다.', '코드의 숫자 하나하나가 위치나 크기 같은 성질 하나를 맡습니다.', '역합성곱이 코드에서 그림을 다시 그립니다.'], say: '앞은 12층, 뒤는 22층입니다. 가운데 숫자에 뜻이 있다는 점이 새롭습니다.' },
    curve: { f: x => x, lo: 2, hi: 9, step: 1, v: 4, xl: '코드 1 (가로 위치)', yl: '그림 속 네모의 가로 칸', title: '코드와 그림이 일대일로 맞습니다', t: ['코드가 1 늘면 네모가 정확히 한 칸 움직입니다.', '코드와 그림의 성질이 이렇게 맞도록 배우는 것이 목표입니다.'] } },
  GAN: { say: '무작위 씨앗을 넣으면 진짜 같은 가짜가 나와요.', io: ['무작위 씨앗', '진짜처럼 보이는 가짜'],
    part: { items: [['ball', K.z, '무작위 씨앗'], ['box', K.h, '생성자'], ['ball', K.x, '가짜'], ['box', K.bx, '판별자 (진짜도 함께 봄)'], ['ball', K.o, '진짜일 확률']], loops: [[4, 1, '속였는지 결과가 생성자에게 돌아감']], t: ['생성자가 씨앗에서 가짜를 만듭니다.', '판별자가 진짜와 가짜를 받아 진짜일 확률을 말합니다.', '판별자는 가려내도록, 생성자는 속이도록 각자 고칩니다.'], say: '신경망이 둘입니다. 한쪽의 점수가 다른 쪽의 벌입니다.' },
    curve: { f: x => -Math.log(x), lo: .03, hi: 1, v: .3, xl: '판별자가 가짜를 "진짜"라고 본 정도', yl: '생성자가 받는 벌', title: '속일수록 벌이 줄어듭니다', t: ['판별자가 가짜를 진짜라고 볼수록 생성자의 벌이 0에 가까워집니다.', '전혀 못 속이면 벌이 아주 커집니다. 그 벌이 생성자를 움직입니다.'] } },
  NTM: { say: '줄을 차례로 넣으면 공책에 적어 두었다가, 그대로 옮겨 적어 줘요.', io: ['순서대로 들어오는 줄', '공책을 써서 얻은 답 (예: 그대로 옮겨 적기)'],
    part: { items: [['ball', K.i, '입력'], ['box', K.h, '제어기 (신경망)'], ['gate', K.gt, '읽기·쓰기 머리'], ['tiles', K.m, '공책 (외부 기억)'], ['ball', K.o, '출력']], loops: [[3, 1, '읽은 내용']], t: ['제어기가 입력을 받아 무엇을 할지 정합니다.', '머리가 공책의 어느 칸에 쓰고 어느 칸을 읽을지 정합니다.', '읽은 내용이 제어기로 돌아와 출력에 쓰입니다.'], say: '계산하는 곳과 기억하는 곳을 나눴습니다. 컴퓨터와 닮았습니다.' },
    curve: { f: x => Math.exp(-(x - 3) * (x - 3) * 2), lo: 0, hi: 7, v: 3.4, xl: '공책 칸 번호', yl: '읽는 정도 (머리가 3번 칸에 있을 때)', title: '머리는 부드럽게 고릅니다', t: ['머리는 한 칸만 딱 고르지 않고, 가까운 칸을 조금씩 섞어 읽습니다.', '부드럽게 고르기 때문에 "어디를 읽을지"도 학습할 수 있습니다.'] } },
};

/* ================= ⑤ 실험을 3D 물체로 보여 주는 장면 명세 =================
   view(s) 는 widgets3d.js 가 그릴 물체 목록을 돌려준다. 좌표는 ⑤ 구역 바닥판 기준(가로 −6~6, 앞이 +z). */
function clipLine(a, b, c, R = 1.2) { const P = [];
  if (Math.abs(b) > 1e-9) for (const x of [-R, R]) { const y = (-c - a * x) / b; if (Math.abs(y) <= R + 1e-9) P.push([x, y]); }
  if (Math.abs(a) > 1e-9) for (const y of [-R, R]) { const x = (-c - b * y) / a; if (Math.abs(x) <= R + 1e-9) P.push([x, y]); }
  let best = null, bd = 1e-6; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]); if (d > bd) { bd = d; best = [...P[i], ...P[j]]; } } return best; }
const SURF = o => ({ id: 'f', type: 'surface', x: 0, z: -.7, w: 7.2, ...o });
const T5 = (id, x, v, title, o) => ({ id, type: 'tiles', x, z: -1.6, w: 2.8, rows: 5, cols: 5, v, title, ...o });
const PLOT = o => ({ id: 'p', type: 'plot', x: 0, z: -2.2, w: 10.2, h: 4, ...o });
const VIEWS = {
  P: { t: '직선 하나로 두 색 가르기 · 솟은 쪽이 "켜짐"', f(s) { return [SURF({ fn: this.fn(s), pts: s.d })]; } },
  FF: { t: '대각선끼리 같은 색 (XOR) · 솟은 쪽이 주황', f(s) { return [SURF({ fn: (x, y) => s.net.out(x, y), pts: s.d })]; } },
  DFF: { t: '과녁 무늬: 가운데·띠·바깥 · 솟은 쪽이 주황', f(s) { return [SURF({ fn: (x, y) => s.net.out(x, y), pts: s.d })]; } },
  RBF: { t: '기준점에서 가까우면 반응 · 노란 원이 반응 폭', f(s) { return [SURF({ fn: s.fn, pts: s.d, marks: s.cs.map(c => ({ x: c[0], y: c[1], c: 0xffd76a, r: s.sg })) })]; } },
  ELM: { t: '은닉층은 뽑기, 출력층만 계산', f(s) { return [SURF({ fn: s.fn, pts: s.d })]; } },
  MC: { t: '오늘 날씨만 보고 내일 정하기', f(s) {
    const P = [[-1.7, 1.2, 0], [1.7, 1.2, 0], [0, 3.6, 0]], col = [0xffd76a, 0x9aa7c7, 0x6fb1ff], nm = ['맑음', '흐림', '비'], L = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) L.push([i, j, s.M[i][j], 0xe9edf9, i < j ? .22 : -.22]);
    return [{ id: 'g', type: 'nodes', x: -2.7, z: -1.3, ty: 5.2, title: '상태와 넘어갈 확률 (굵을수록 큼)', nodes: P.map((p, i) => ({ p, r: .58, c: col[i], glow: i === s.cur ? 1 : .08, t: nm[i] + (i === s.cur ? ' · 오늘' : '') })), links: L },
      { id: 'b', type: 'bars', x: 2.9, z: -1.4, w: 4, h: 3.4, v: s.cnt.map(c => c / (s.n || 1)), colors: col, max: 1, labels: nm, refs: s.pi, title: '실제로 머문 비율 · 흰 판: 계산한 값' }]; } },
  SVM: { t: '여백이 가장 넓은 선 찾기 · 노란 고리: 선을 정하는 점', f(s) {
    const g = (x, y) => s.w[0] * x + s.w[1] * y + s.b, sv = s.d.map(d => (d.c ? 1 : -1) * g(d.x, d.y) <= 1.02), segs = [];
    [0, 1, -1].forEach(o => { const L = clipLine(s.w[0], s.w[1], s.b - o); if (L) segs.push(L); });
    return [SURF({ fn: (x, y) => g(x, y) > 0 ? 1 : 0, h: .6, pts: s.d, ring: sv, segs, segY: .66 })]; } },
  KN: { t: '정답 없이 스스로 펴지는 그물', f(s) {
    const n = s.n, segs = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = s.w[i * n + j]; if (j < n - 1) { const b = s.w[i * n + j + 1]; segs.push([a[0], a[1], b[0], b[1]]); } if (i < n - 1) { const b = s.w[(i + 1) * n + j]; segs.push([a[0], a[1], b[0], b[1]]); } }
    return [SURF({ fn: null, pts: s.d.map(q => ({ x: q[0], y: q[1], col: 0x3d5596 })), pr: .055, marks: s.w.map(w => ({ x: w[0], y: w[1], c: 0x7fe0a8, s: .12 })), segs, segC: 0xffd76a, segY: .15 })]; } },
  AE: { t: '좁은 통로로 압축했다가 복원', f(s) { const q = this.calc(s), c = [...q.c, ...new Array(10 - s.k).fill(0)];
    return [T5('a', -3.9, q.v, '입력 (숫자 25개)'), { id: 'b', type: 'bars', x: 0, z: -1.4, w: 3, h: 2.6, v: c, colors: c.map((t, i) => i < s.k ? (t >= 0 ? C.y : C.p) : C.ln), max: 2.2, title: '통로 (숫자 ' + s.k + '개)' }, T5('c', 3.9, q.o, '출력 (복원)', { color: C.g })]; } },
  DAE: { t: '망가진 입력에서 원본 되살리기', f(s) { const q = this.calc(s); return [T5('a', -3.9, q.v, '원본'), T5('b', 0, q.n, '잡음 섞인 입력', { color: C.r }), T5('c', 3.9, q.o, '출력', { color: C.g })]; } },
  SAE: { t: '뉴런 12개 중 몇 개만 켜기', f(s) { const q = this.calc(s);
    return [T5('a', -4.1, q.v, '입력 (두 그림 겹침)'), { id: 'b', type: 'bars', x: 0, z: -1.4, w: 3.8, h: 2.6, v: q.co, colors: q.co.map(t => t ? C.y : C.ln), max: 3.2, labels: GN, title: '은닉 뉴런 12개' }, T5('c', 4.1, q.o, '출력', { color: C.g })]; } },
  DCN: { t: '작은 창을 옮겨 가며 무늬 찾기', f(s) { const p = Math.min(35, s.pos);
    return [{ id: 'a', type: 'tiles', x: -3.9, z: -1.6, w: 3.2, rows: 8, cols: 8, v: s.im, hl: [Math.floor(p / 6), p % 6, 3, 3], title: '그림 8×8 · 분홍 테: 창' },
      { id: 'k', type: 'tiles', x: -.3, z: -1.6, w: 1.7, rows: 3, cols: 3, v: s.kv, mode: 'k', color: C.p, title: '창 3×3' },
      { id: 'o', type: 'tiles', x: 3.6, z: -1.6, w: 3, rows: 6, cols: 6, v: s.out.map((t, i) => i < s.pos ? t / s.mx : 0), title: '찾은 결과 6×6' }]; } },
  RNN: { t: '처음 신호가 얼마나 오래 남나', f(s) { return [PLOT({ series: [{ v: runRNN(s.w, seqIn(false)), c: C.a, n: '은닉 뉴런의 값(기억)' }], ymin: -.1, ymax: 1.1, marks: [mark2[0]], title: '시간 →' })]; } },
  ESN: { t: '저수지의 메아리와 다음 값 예측', f(s) {
    return [PLOT({ id: 'e', x: -2.75, w: 5, h: 3.6, series: s.echo.map((v, i) => ({ v, c: [C.a, C.g, C.p, C.y][i] })), ymin: -1, ymax: 1, marks: [[2 / 39, '신호', C.y]], title: '신호 한 번 → 뉴런 4개의 메아리' }),
      PLOT({ id: 'q', x: 2.75, w: 5, h: 3.6, series: [{ v: s.tg, c: C.fg, n: '정답' }, { v: s.pr, c: C.b, n: '예측', dash: 1 }], ymin: -1.1, ymax: 1.1, title: '다음 값 맞히기 (배우지 않은 구간)' })]; } },
  GRU: { t: '문 두 개로 기억 지키기', f(s) { return [PLOT({ series: [{ v: this.run(s), c: C.a, n: 'GRU의 기억' }, { v: runRNN(.8, seqIn(true)), c: C.mu, n: '13층 RNN', dash: 1 }], ymin: -1.1, ymax: 1.1, marks: mark2, title: '시간 →' })]; } },
  LSTM: { t: '기억 세포와 문 세 개', f(s) { const q = this.run(s);
    return [PLOT({ series: [{ v: q.cs, c: C.a, n: '기억 세포' }, { v: q.hs, c: C.y, n: '밖으로 내보낸 값' }, { v: runRNN(.8, seqIn(true)), c: C.mu, n: '13층 RNN', dash: 1 }], ymin: -1.1, ymax: 1.1, marks: mark2, title: '시간 →' })]; } },
  LSM: { t: '스파이크가 웅덩이에 번지는 모습', f(s) {
    const v = new Array(40 * 170).fill(0); s.ras.forEach((f, t) => f.forEach(i => { v[i * 170 + t] = 1; })); const rate = s.ras.map(f => f.length);
    return [{ id: 'r', type: 'tiles', x: 0, z: -2.2, w: 10.2, rows: 40, cols: 170, hgt: 2.7, y0: 1.95, v, depth: .3, color: C.r, cellColor: i => i % 5 === 4 ? 0x6fb1ff : 0xff6b5e, title: '스파이크 · 가로: 시간 · 세로: 뉴런 40개 (위 8개가 입력) · 파랑: 억제 뉴런' },
      PLOT({ x: 0, z: -2.2, y0: .2, h: 1.3, series: [{ v: rate.length > 1 ? rate : [0, 0], c: C.y, len: 170, n: '한순간에 쏜 뉴런 수' }], ymin: 0, ymax: 20 })]; } },
  HN: { t: '망가진 패턴을 되돌려 놓기', f(s) { const m = hMatch(s.s);
    return [...HP.map((p, k) => ({ id: 'm' + k, type: 'tiles', x: -4.3 + k * 1.3, z: -1.6, y0: 3.75, w: 1.05, rows: 5, cols: 5, v: p, mode: 1, depth: .15, color: C.mu, title: '저장 ' + HPN[k] })),
      { id: 's', type: 'tiles', x: -3, z: -1.6, y0: .3, w: 2.9, rows: 5, cols: 5, v: s.s, mode: 1 },
      { id: 'b', type: 'bars', x: 2.8, z: -1.4, w: 4, h: 3.2, v: m, colors: [C.a, C.g, C.p], max: 1, labels: HPN.map((n, i) => n + ' ' + Math.round(m[i] * 100) + '%'), title: '저장 패턴과 일치하는 정도' }]; } },
  BM: { t: '확률로 켜지고 꺼지는 뉴런들', f(s) { const m = hMatch(s.s).map(v => Math.max(v, 1 - v));
    return [{ id: 's', type: 'tiles', x: -2.9, z: -1.6, w: 3.2, rows: 5, cols: 5, v: s.s, mode: 1, title: '지금 상태' },
      { id: 'b', type: 'bars', x: 2.8, z: -1.4, w: 4, h: 3.2, v: m.map(v => (v - .5) * 2), colors: [C.a, C.g, C.p], max: 1, labels: HPN, title: '저장 패턴과 닮은 정도' }]; } },
  RBM: { t: '보이는 층과 숨은 층을 오가기', f(s) {
    return [...this.data.map((p, k) => ({ id: 'm' + k, type: 'tiles', x: -4.6 + k * 1.15, z: -1.6, y0: 3.75, w: .95, rows: 5, cols: 5, v: p, depth: .15, color: C.mu, title: k === 1 ? '배울 그림 4장' : null })),
      { id: 'v', type: 'tiles', x: -2.9, z: -1.6, y0: .3, w: 2.9, rows: 5, cols: 5, v: s.v },
      { id: 'h', type: 'bars', x: 2.8, z: -1.4, w: 4, h: 3, v: s.h, colors: C.g, max: 1, title: '숨은 층 6개' }]; } },
  DBN: { t: '아래부터 한 층씩 학습하기', f(s) { const N = [], L = [];
    s.h1.forEach((t, i) => N.push({ p: [-2 + i * .57, 1.2, 0], r: .22, c: 0xc8f0d8, glow: t })); s.h2.forEach((t, i) => N.push({ p: [-.6 + i * .6, 3.2, 0], r: .26, c: 0xc8f0d8, glow: t }));
    for (let a = 0; a < 3; a++) for (let b = 0; b < 8; b++) L.push([8 + a, b, .08, 0x6b7493]);
    return [{ id: 'v', type: 'tiles', x: -3.6, z: -1.6, w: 2.7, rows: 5, cols: 5, v: s.v, title: '보이는 층 (그림)' }, { id: 'n', type: 'nodes', x: 2.4, z: -1.4, ty: 4.4, title: '숨은 층: 아래 8개 · 위 3개', nodes: N, links: L }]; } },
  DN: { t: '점 하나마다 도장 찍기', f(s) {
    return [{ id: 'c', type: 'tiles', x: -4.2, z: -1.6, w: 1.8, rows: 3, cols: 3, v: s.cd, hl: s.pos < 9 ? [Math.floor(s.pos / 3), s.pos % 3, 1, 1] : null, title: '작은 지도 3×3' },
      { id: 'k', type: 'tiles', x: -1.7, z: -1.6, w: 1.5, rows: 3, cols: 3, v: s.kv, color: C.p, title: '도장 3×3' },
      { id: 'o', type: 'tiles', x: 2.5, z: -1.6, w: 4, rows: s.n, cols: s.n, v: this.out(s).map(t => t / 2), title: '만든 그림 ' + s.n + '×' + s.n }]; } },
  DRN: { t: '깊이 쌓으면 신호가 얼마나 남나', f(s) { const c = this.calc(s), ser = [{ v: c.p, c: C.r, n: '지름길 없음' }]; if (s.skip) ser.push({ v: c.q, c: C.g, n: '지름길 있음' });
    return [PLOT({ series: ser, ymin: 0, ymax: 3, title: '입력 층 → ' + s.dl + '번째 층' })]; } },
  VAE: { t: '압축 공간의 아무 곳에서 새 그림 만들기', f(s) {
    return [SURF({ x: -2.3, z: -.8, w: 5.4, range: 2.8, fn: null, marks: [...s.codes.map((c, i) => ({ x: c[0], y: c[1], c: 0x9aa7c7, s: .1, t: GN[i] })), { x: s.z1, y: s.z2, c: 0xffd76a, s: .24 }] }),
      { id: 'o', type: 'tiles', x: 3.6, z: -1.6, w: 2.7, rows: 5, cols: 5, v: PCA.dec([s.z1 * s.sd[0], s.z2 * s.sd[1]]), title: '노란 공 자리에서 만든 그림' }]; } },
  DCIGN: { t: '그림 → 뜻 있는 숫자 → 다시 그림', f(s) {
    return [{ id: 'a', type: 'tiles', x: -3.9, z: -1.6, w: 3.1, rows: 12, cols: 12, v: s.im, title: '입력 그림' },
      { id: 'b', type: 'bars', x: 0, z: -1.4, w: 2.4, h: 2.8, v: [s.cx / 11, s.cy / 11, s.sz / 4], colors: [C.a, C.g, C.p], max: 1, labels: ['가로 ' + s.cx, '세로 ' + s.cy, '크기 ' + s.sz], title: '가운데 코드' },
      { id: 'c', type: 'tiles', x: 3.9, z: -1.6, w: 3.1, rows: 12, cols: 12, v: this.render(s.cx, s.cy, s.sz), color: C.g, title: '다시 그린 그림' }]; } },
  GAN: { t: '가짜가 진짜를 닮아 가는 과정', f(s) {
    const hist = new Array(40).fill(0); s.z.forEach(z => { const k = Math.floor((s.a * z + s.b + 4) / 8 * 40); if (k >= 0 && k < 40) hist[k]++; });
    const dens = [], dc = []; for (let i = 0; i <= 160; i++) { const v = -4 + i * .05; dens.push(Math.exp(-((v - 1.5) ** 2) / .5) / (.5 * Math.sqrt(TAU)) * 1.05); dc.push(this.D(s, v)); }
    return [PLOT({ series: [{ v: hist.map(c => c / 400 * 5 * 1.05), c: C.b, bar: 1, n: '가짜' }, { v: dens, c: C.a, n: '진짜' }, { v: dc, c: C.fg, dash: 1, n: '판별자가 "진짜"라고 보는 정도' }], ymin: 0, ymax: 1, title: '값 −4 → 4' })]; } },
  NTM: { t: '공책에 쓰고, 돌아가서 읽기', f(s) {
    const wr = Math.min(s.tick, s.n), rd = clamp(s.tick - s.n - 1, 0, s.n), cs = .5, head = s.tick <= s.n ? Math.min(wr, s.n - 1) : (rd > 0 ? rd - 1 : 0);
    const tr = (rows, cols, fn) => { const v = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) v.push(fn(r, c)); return v; };
    return [{ id: 'i', type: 'tiles', x: -4.1, z: -1.6, y0: .5, w: s.n * cs, rows: 4, cols: s.n, v: tr(4, s.n, (r, c) => s.seq[c][r] ? (c < wr ? 1 : .4) : 0), title: '들어온 순서' },
      { id: 'm', type: 'tiles', x: 0, z: -1.6, y0: .5, w: 8 * cs, rows: 4, cols: 8, v: tr(4, 8, (r, c) => c < wr && s.seq[c] ? s.seq[c][r] : 0), color: C.a, hl: [0, head, 4, 1], title: '공책 8칸 · 분홍 테: ' + (s.tick <= s.n ? '쓰는' : '읽는') + ' 자리' },
      { id: 'o', type: 'tiles', x: 4.1, z: -1.6, y0: .5, w: s.n * cs, rows: 4, cols: s.n, v: tr(4, s.n, (r, c) => c < rd ? s.seq[c][r] : 0), color: C.g, title: '나간 순서' }]; } },
};
for (const k in VIEWS) { DEMOS[k].vt = VIEWS[k].t; DEMOS[k].view = VIEWS[k].f; }
