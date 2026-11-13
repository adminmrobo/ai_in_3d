/* 별관 실험용 작은 신경망: 데이터 만들기 · 학습 · 가지치기 · 복권 가설 */
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const gauss = r => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
/* 두 갈래 소용돌이(나선) 데이터 */
export function spiral(n, seed, noise = .18, turn = 3.2) { const r = rng(seed), X = [], Y = [];
  for (let i = 0; i < n; i++) { const c = i % 2, t = 0.4 + turn * r(), a = t * 1.15 + c * Math.PI, R = (0.4 + turn) ; X.push([t * Math.cos(a) / R * 1.1 + noise * gauss(r) * .5, t * Math.sin(a) / R * 1.1 + noise * gauss(r) * .5]); Y.push(c); }
  return { X, Y }; }
export const SIZES = [2, 16, 16, 1];
export function nConn(sizes = SIZES) { let s = 0; for (let l = 0; l < sizes.length - 1; l++) s += sizes[l] * sizes[l + 1]; return s; }
export function init(seed, sizes = SIZES) { const r = rng(seed), W = [], B = [];
  for (let l = 0; l < sizes.length - 1; l++) { const a = sizes[l], b = sizes[l + 1], sd = Math.sqrt(1 / a) * 1.2; W.push(Float64Array.from({ length: a * b }, () => gauss(r) * sd)); B.push(new Float64Array(b)); }
  return { W, B, sizes }; }
export const clone = n => ({ W: n.W.map(w => Float64Array.from(w)), B: n.B.map(b => Float64Array.from(b)), sizes: n.sizes });
export const fullMask = n => n.W.map(w => new Uint8Array(w.length).fill(1));
function fwd(n, x, M) { const acts = [x]; let h = x; const L = n.W.length;
  for (let l = 0; l < L; l++) { const a = n.sizes[l], b = n.sizes[l + 1], W = n.W[l], m = M[l], o = new Float64Array(b);
    for (let j = 0; j < b; j++) { let s = n.B[l][j]; for (let i = 0; i < a; i++) { const k = i * b + j; if (m[k]) s += h[i] * W[k]; } o[j] = l < L - 1 ? Math.tanh(s) : 1 / (1 + Math.exp(-s)); }
    acts.push(o); h = o; }
  return acts; }
export function predict(n, M, x) { return fwd(n, x, M).at(-1)[0]; }
export function accuracy(n, M, D) { let c = 0; D.X.forEach((x, i) => { if ((predict(n, M, x) > .5 ? 1 : 0) === D.Y[i]) c++; }); return c / D.X.length; }
/* 전체 묶음 Adam 학습 (가려진 연결은 0으로 두고 고치지 않음) */
export function train(n, M, D, epochs = 300, lr = .02) { const L = n.W.length, mW = n.W.map(w => new Float64Array(w.length)), vW = n.W.map(w => new Float64Array(w.length)), mB = n.B.map(b => new Float64Array(b.length)), vB = n.B.map(b => new Float64Array(b.length));
  n.W.forEach((w, l) => { for (let k = 0; k < w.length; k++) if (!M[l][k]) w[k] = 0; });
  const b1 = .9, b2 = .999; let t = 0;
  for (let e = 0; e < epochs; e++) { const gW = n.W.map(w => new Float64Array(w.length)), gB = n.B.map(b => new Float64Array(b.length));
    for (let s = 0; s < D.X.length; s++) { const A = fwd(n, D.X[s], M); let d = Float64Array.of(A[L][0] - D.Y[s]);
      for (let l = L - 1; l >= 0; l--) { const a = n.sizes[l], b = n.sizes[l + 1], W = n.W[l], m = M[l], h = A[l], nd = new Float64Array(a);
        for (let j = 0; j < b; j++) { gB[l][j] += d[j]; for (let i = 0; i < a; i++) { const k = i * b + j; if (!m[k]) continue; gW[l][k] += d[j] * h[i]; nd[i] += d[j] * W[k]; } }
        if (l > 0) for (let i = 0; i < a; i++) nd[i] *= 1 - h[i] * h[i]; d = nd; } }
    t++; const N = D.X.length, c1 = 1 - Math.pow(b1, t), c2 = 1 - Math.pow(b2, t);
    for (let l = 0; l < L; l++) { const W = n.W[l]; for (let k = 0; k < W.length; k++) { if (!M[l][k]) continue; const g = gW[l][k] / N; mW[l][k] = b1 * mW[l][k] + (1 - b1) * g; vW[l][k] = b2 * vW[l][k] + (1 - b2) * g * g; W[k] -= lr * (mW[l][k] / c1) / (Math.sqrt(vW[l][k] / c2) + 1e-8); }
      const Bb = n.B[l]; for (let j = 0; j < Bb.length; j++) { const g = gB[l][j] / N; mB[l][j] = b1 * mB[l][j] + (1 - b1) * g; vB[l][j] = b2 * vB[l][j] + (1 - b2) * g * g; Bb[j] -= lr * (mB[l][j] / c1) / (Math.sqrt(vB[l][j] / c2) + 1e-8); } } }
  return n; }
/* 크기가 작은 연결부터 전체에서 잘라 내기: keep = 남길 비율 */
export function pruneMask(n, keep) { const all = []; n.W.forEach((w, l) => w.forEach((v, k) => all.push([Math.abs(v), l, k])));
  all.sort((a, b) => b[0] - a[0]); const M = n.W.map(w => new Uint8Array(w.length)), K = Math.max(1, Math.round(all.length * keep));
  for (let i = 0; i < K; i++) M[all[i][1]][all[i][2]] = 1; return M; }
export const countMask = M => M.reduce((s, m) => s + m.reduce((a, b) => a + b, 0), 0);
/* 남아 있는 연결 가운데 크기가 작은 것부터 잘라 내기 (반복 가지치기 한 번) */
export function pruneMask2(n, M, keepFrac) { const all = []; n.W.forEach((w, l) => w.forEach((v, k) => { if (M[l][k]) all.push([Math.abs(v), l, k]); }));
  all.sort((a, b) => b[0] - a[0]); const NM = n.W.map(w => new Uint8Array(w.length)), K = Math.max(1, Math.round(all.length * keepFrac));
  for (let i = 0; i < K; i++) NM[all[i][1]][all[i][2]] = 1; return NM; }
