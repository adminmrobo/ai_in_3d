// 신경망 연구소 · ⑤ 실험을 3D 물체로 그리는 도구
// 실험마다 demos.js 의 view(s) 가 "무엇을 어디에" 명세를 돌려주면, 여기서 3D 물체로 만들고 매 프레임 고친다.
//   surface : 바닥에 눕힌 판. 높이·색 = 함수 값, 공 = 데이터 점, 표시 = 기준점·뉴런, 선분 = 경계·그물
//   tiles   : 세워 둔 그림. 칸마다 블록이 값만큼 앞으로 튀어나옴
//   bars    : 3D 막대 (흰 판 = 비교 기준값)
//   plot    : 세워 둔 그래프 판 위의 띠(선)와 기둥
//   nodes   : 공과 막대로 이은 작은 그래프
export function makeWidgets(T, ctx) {
  const { parent, ox, oz, label, place, cylGeo } = ctx;
  const W = new Map(), M4 = new T.Matrix4(), Qi = new T.Quaternion(), Qr = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), Math.PI / 2);
  const Pv = new T.Vector3(), Sv = new T.Vector3(), cT = new T.Color(), DARK = new T.Color(0x1b2748);
  const boxG = new T.BoxGeometry(1, 1, 1), sphG = new T.SphereGeometry(1, 16, 12), torG = new T.TorusGeometry(1, .12, 8, 24), ringG = new T.TorusGeometry(1, .02, 6, 56);
  const cl = (v, a, b) => Math.max(a, Math.min(b, v)), colr = c => cT.set(c);
  const inst = (geo, mat, n) => { const m = new T.InstancedMesh(geo, mat, n); m.count = 0; m.frustumCulled = false; return m; };
  const done = m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; };
  const mkLabel = (w, cls) => { const o = label('', new T.Vector3(), cls); o.hide = true; w.labels.push(o); return o; };
  function setL(o, txt, x, y, z, html) { o.hide = false; if (o.txt !== txt) { o.txt = txt; if (html) o.el.innerHTML = txt; else o.el.textContent = txt; } o.pos.set(x, y, z); }
  const hexs = c => '#' + new T.Color(c).getHexString();
  const legendHTML = ser => ser.filter(q => q.n).map(q => '<span style="color:' + hexs(q.c) + '">■</span> ' + q.n).join('&nbsp;&nbsp;&nbsp;');

  const K = {
    surface() {
      const w = { labels: [], grp: new T.Group() }, G2 = w.grp, N = 36; let Wd = 0, g, pa, col, frame;
      parent.add(G2);
      const pts = inst(sphG, new T.MeshStandardMaterial({ roughness: .35 }), 420), rings = inst(torG, new T.MeshBasicMaterial({ color: 0xffd76a }), 80), mk = inst(sphG, new T.MeshStandardMaterial({ roughness: .3 }), 100);
      G2.add(pts, rings, mk);
      const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(new Float32Array(600 * 6), 3));
      const seg = new T.LineSegments(sg, new T.LineBasicMaterial({ color: 0xffffff })); seg.frustumCulled = false; G2.add(seg);
      const mkR = [], c0 = new T.Color(0x1f3a7a), c1 = new T.Color(0xc8703a), cf = new T.Color(0x16224a);
      let surf = null;
      w.upd = sp => {
        G2.position.set(ox + sp.x, 0, oz + sp.z); G2.updateMatrixWorld(true);
        if (Wd !== sp.w) { Wd = sp.w; if (surf) { G2.remove(surf, frame); }
          g = new T.PlaneGeometry(Wd, Wd, N, N); g.rotateX(-Math.PI / 2); pa = g.attributes.position; col = new Float32Array(pa.count * 3); g.setAttribute('color', new T.BufferAttribute(col, 3));
          surf = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: .6 })); G2.add(surf);
          frame = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(Wd, .04, Wd)), new T.LineBasicMaterial({ color: 0x3a4a7c })); G2.add(frame); }
        const R = sp.range || 1.2, H = sp.h == null ? 1.1 : sp.h, fn = sp.fn, half = Wd / 2;
        const toP = (x, y) => [cl(x / R, -1, 1) * half, -cl(y / R, -1, 1) * half], hAt = (x, y) => fn ? cl(fn(x, y), 0, 1) * H : 0;
        for (let i = 0; i < pa.count; i++) { const X = pa.getX(i), Z = pa.getZ(i), v = fn ? cl(fn(X / half * R, -Z / half * R), 0, 1) : 0; pa.setY(i, v * H);
          cT.copy(fn ? c0 : cf); if (fn) cT.lerp(c1, v); col[i * 3] = cT.r; col[i * 3 + 1] = cT.g; col[i * 3 + 2] = cT.b; }
        pa.needsUpdate = true; g.attributes.color.needsUpdate = true; g.computeVertexNormals();
        const P = sp.pts || [], pr = sp.pr || .13; let rc = 0;
        P.forEach((d, k) => { const [px, pz] = toP(d.x, d.y), y = hAt(d.x, d.y) + pr + .03;
          M4.compose(Pv.set(px, y, pz), Qi, Sv.setScalar(pr)); pts.setMatrixAt(k, M4); pts.setColorAt(k, colr(d.col != null ? d.col : (d.c ? 0xff9f6b : 0x6fb1ff)));
          if (sp.ring && sp.ring[k]) { M4.compose(Pv.set(px, y, pz), Qr, Sv.setScalar(.27)); rings.setMatrixAt(rc++, M4); } });
        pts.count = P.length; rings.count = rc; done(pts); done(rings);
        const MK = sp.marks || [];
        MK.forEach((m, k) => { const [px, pz] = toP(m.x, m.y), s = m.s || .17, y = hAt(m.x, m.y) + s + .03;
          M4.compose(Pv.set(px, y, pz), Qi, Sv.setScalar(s)); mk.setMatrixAt(k, M4); mk.setColorAt(k, colr(m.c));
          if (m.r) { if (!mkR[k]) { mkR[k] = new T.Mesh(ringG, new T.MeshBasicMaterial({ color: 0xffd76a })); mkR[k].rotation.x = Math.PI / 2; G2.add(mkR[k]); }
            mkR[k].visible = true; mkR[k].position.set(px, y - s + .02, pz); mkR[k].scale.setScalar(m.r / R * half); } else if (mkR[k]) mkR[k].visible = false;
          if (m.t) { const o = w.labels[k] || mkLabel(w, 'num'); const wp = G2.localToWorld(Pv.set(px, y + .42, pz)); setL(o, m.t, wp.x, wp.y, wp.z); } });
        for (let k = MK.length; k < mkR.length; k++) if (mkR[k]) mkR[k].visible = false;
        for (let k = MK.length; k < w.labels.length; k++) w.labels[k].hide = true;
        mk.count = MK.length; done(mk);
        const S = sp.segs || [], sa = sg.attributes.position, sy = sp.segY == null ? .06 : sp.segY;
        S.forEach((q, k) => { const a = toP(q[0], q[1]), b = toP(q[2], q[3]); sa.setXYZ(k * 2, a[0], sy, a[1]); sa.setXYZ(k * 2 + 1, b[0], sy, b[1]); });
        sg.setDrawRange(0, S.length * 2); sa.needsUpdate = true; seg.material.color.set(sp.segC || 0xffffff);
      };
      return w;
    },

    tiles(sp) {
      const w = { labels: [], grp: new T.Group() }, G2 = w.grp, rows = sp.rows, cols = sp.cols, n = rows * cols, cw = sp.w / cols, Ht = sp.hgt || cw * rows, ch = Ht / rows;
      parent.add(G2);
      const bk = new T.Mesh(new T.BoxGeometry(sp.w + .16, Ht + .16, .06), new T.MeshStandardMaterial({ color: 0x0e1836, roughness: .9 })); bk.position.set(0, Ht / 2, -.04); G2.add(bk);
      const im = inst(boxG, new T.MeshStandardMaterial({ roughness: .5 }), n); G2.add(im);
      const hl = [0, 1, 2, 3].map(() => { const m = new T.Mesh(boxG, new T.MeshBasicMaterial({ color: 0xff8fc7 })); G2.add(m); return m; });
      const tl = mkLabel(w, 'stage');
      w.upd = sp => {
        G2.position.set(ox + sp.x, sp.y0 == null ? .3 : sp.y0, oz + sp.z);
        const v = sp.v, base = new T.Color(sp.color || 0xffd76a), dep = sp.depth || .5; let mn = 0, mx = 1;
        if (sp.mode === 'k') { mn = Math.min(...v); mx = Math.max(...v); }
        for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const k = i * cols + j; let t = v[k] || 0;
          if (sp.mode === 1) t = (t + 1) / 2; else if (sp.mode === 'k') t = (t - mn) / ((mx - mn) || 1); t = cl(t, 0, 1);
          const d = .04 + t * dep; M4.compose(Pv.set(-sp.w / 2 + (j + .5) * cw, Ht - (i + .5) * ch, d / 2), Qi, Sv.set(cw * .9, ch * .9, d)); im.setMatrixAt(k, M4);
          if (sp.cellColor && t > 0) colr(sp.cellColor(i, j)); else cT.copy(DARK).lerp(base, t); im.setColorAt(k, cT); }
        im.count = n; done(im);
        if (sp.hl) { const [r, c, hh, ww] = sp.hl, x0 = -sp.w / 2 + c * cw, x1 = x0 + ww * cw, y1 = Ht - r * ch, y0 = y1 - hh * ch, z = dep + .14, th = .07;
          const set = (m, x, y, sx, sy) => { m.visible = true; m.position.set(x, y, z); m.scale.set(sx, sy, .06); };
          set(hl[0], (x0 + x1) / 2, y1, x1 - x0 + th, th); set(hl[1], (x0 + x1) / 2, y0, x1 - x0 + th, th); set(hl[2], x0, (y0 + y1) / 2, th, y1 - y0); set(hl[3], x1, (y0 + y1) / 2, th, y1 - y0);
        } else hl.forEach(m => m.visible = false);
        if (sp.title) setL(tl, sp.title, G2.position.x, G2.position.y + Ht + .38, G2.position.z); else tl.hide = true;
      };
      return w;
    },

    bars(sp) {
      const w = { labels: [], grp: new T.Group() }, G2 = w.grp, n = sp.v.length, bw = sp.w / n; parent.add(G2);
      const base = new T.Mesh(new T.BoxGeometry(sp.w + .2, .06, 1), new T.MeshStandardMaterial({ color: 0x0e1836 })); base.position.y = .03; G2.add(base);
      const bars = [], refs = [], lb = [];
      for (let i = 0; i < n; i++) { const m = new T.Mesh(boxG, new T.MeshStandardMaterial({ roughness: .4, emissiveIntensity: .25 })); G2.add(m); bars.push(m);
        const r = new T.Mesh(boxG, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 })); G2.add(r); refs.push(r); }
      const tl = mkLabel(w, 'stage');
      w.upd = sp => {
        G2.position.set(ox + sp.x, sp.y0 || 0, oz + sp.z);
        const H = sp.h || 3, mx = sp.max || 1;
        sp.v.forEach((t, i) => { const hh = Math.max(.03, cl(Math.abs(t) / mx, 0, 1) * H), x = -sp.w / 2 + (i + .5) * bw, c = Array.isArray(sp.colors) ? sp.colors[i] : (sp.colors || 0x7fe0a8), m = bars[i];
          m.position.set(x, .06 + hh / 2, 0); m.scale.set(bw * .72, hh, .55); m.material.color.set(c); m.material.emissive.set(c);
          if (sp.refs) { refs[i].visible = true; refs[i].position.set(x, .06 + cl(sp.refs[i] / mx, 0, 1) * H, 0); refs[i].scale.set(bw * .92, .045, .72); } else refs[i].visible = false;
          if (sp.labels) { const o = lb[i] || (lb[i] = mkLabel(w, 'num')); setL(o, sp.labels[i], G2.position.x + x, G2.position.y - .1, G2.position.z + .7); } });
        if (sp.title) setL(tl, sp.title, G2.position.x, G2.position.y + H + .55, G2.position.z); else tl.hide = true;
      };
      return w;
    },

    plot(sp) {
      const w = { labels: [], grp: new T.Group() }, G2 = w.grp, Wd = sp.w, H = sp.h || 3.6, CAP = 260; parent.add(G2);
      const pg = new T.PlaneGeometry(Wd + .4, H + .4), pm = new T.Mesh(pg, new T.MeshStandardMaterial({ color: 0x0e1836, side: T.DoubleSide, roughness: .9 })); pm.position.set(0, H / 2, 0); G2.add(pm);
      const pe = new T.LineSegments(new T.EdgesGeometry(pg), new T.LineBasicMaterial({ color: 0x3a4a7c })); pe.position.copy(pm.position); G2.add(pe);
      const zl = new T.Mesh(boxG, new T.MeshBasicMaterial({ color: 0x9aa7c7 })); G2.add(zl);
      const strips = [], barsI = [], marks = [];
      const mkStrip = () => { const g = new T.BufferGeometry(), pos = new Float32Array(CAP * 4 * 3), idx = [];
        for (let k = 0; k < CAP; k++) { const b = k * 4; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
        g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setIndex(idx);
        const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide })); m.frustumCulled = false; G2.add(m); return m; };
      const tl = mkLabel(w, 'stage'), lg = mkLabel(w, 'note');
      w.upd = sp => {
        G2.position.set(ox + sp.x, sp.y0 == null ? .3 : sp.y0, oz + sp.z);
        const y0 = sp.ymin, y1 = sp.ymax, X = t => -Wd / 2 + t * Wd, Y = v => cl((v - y0) / (y1 - y0), 0, 1) * H;
        zl.visible = y0 < 0 && y1 > 0; zl.position.set(0, Y(0), .02); zl.scale.set(Wd, .025, .02);
        let si = 0, bi = 0;
        sp.series.forEach((q, qi) => {
          const v = q.v;
          if (q.bar) { const m = barsI[bi] || (barsI[bi] = (() => { const im = inst(boxG, new T.MeshStandardMaterial({ roughness: .5 }), 128); G2.add(im); return im; })()); bi++;
            const bw = Wd / v.length, yb = Y(Math.max(y0, 0));
            v.forEach((t, i) => { const hh = Math.max(.001, Y(t) - yb); M4.compose(Pv.set(-Wd / 2 + (i + .5) * bw, yb + hh / 2, .14), Qi, Sv.set(bw * .85, hh, .26)); m.setMatrixAt(i, M4); });
            m.count = v.length; m.material.color.set(q.c); done(m); m.visible = true; return; }
          const m = strips[si] || (strips[si] = mkStrip()); si++; m.visible = true; m.material.color.set(q.c);
          const pos = m.geometry.attributes.position.array, wd = (q.w || .08) / 2, zz = .05 + qi * .015, N = Math.max(2, q.len || v.length), P = [];
          for (let i = 0; i < Math.min(v.length, CAP + 1); i++) P.push([X(i / (N - 1)), Y(v[i])]);
          for (let k = 0; k < P.length - 1; k++) { const a = P[k], b = P[k + 1]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
            const nx = -dy * wd, ny = dx * wd, o = k * 12;
            if (q.dash && Math.floor(k / 3) % 2 === 1) { for (let j = 0; j < 4; j++) { pos[o + j * 3] = a[0]; pos[o + j * 3 + 1] = a[1]; pos[o + j * 3 + 2] = zz; } continue; }
            pos.set([a[0] + nx, a[1] + ny, zz, a[0] - nx, a[1] - ny, zz, b[0] + nx, b[1] + ny, zz, b[0] - nx, b[1] - ny, zz], o); }
          m.geometry.attributes.position.needsUpdate = true; m.geometry.setDrawRange(0, Math.max(0, P.length - 1) * 6);
        });
        for (; si < strips.length; si++) strips[si].visible = false;
        for (; bi < barsI.length; bi++) barsI[bi].visible = false;
        const MK = sp.marks || [];
        MK.forEach((mm, k) => { let o = marks[k];
          if (!o) { const ms = new T.Mesh(boxG, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7 })); G2.add(ms); o = marks[k] = { ms, lb: mkLabel(w, 'note') }; }
          const x = X(mm[0]); o.ms.visible = true; o.ms.position.set(x, H / 2, .03); o.ms.scale.set(.03, H, .02); o.ms.material.color.set(mm[2] || 0xffffff);
          setL(o.lb, mm[1], G2.position.x + x, G2.position.y + H + .2, G2.position.z); o.lb.el.style.color = mm[2] ? hexs(mm[2]) : ''; });
        for (let k = MK.length; k < marks.length; k++) { marks[k].ms.visible = false; marks[k].lb.hide = true; }
        if (sp.title) setL(tl, sp.title, G2.position.x, G2.position.y + H + .62, G2.position.z); else tl.hide = true;
        const lgh = legendHTML(sp.series); if (lgh) setL(lg, lgh, G2.position.x, G2.position.y - .28, G2.position.z + .1, true); else lg.hide = true;
      };
      return w;
    },

    nodes(sp) {
      const w = { labels: [], grp: new T.Group() }, G2 = w.grp; parent.add(G2);
      const ns = sp.nodes.map(() => { const m = new T.Mesh(sphG, new T.MeshStandardMaterial({ roughness: .35 })); G2.add(m); return m; });
      const ls = sp.links.map(() => { const m = new T.Mesh(cylGeo, new T.MeshStandardMaterial({ roughness: .5, transparent: true, opacity: .85 })); G2.add(m); return m; });
      const tl = mkLabel(w, 'stage'), nl = [];
      w.upd = sp => {
        G2.position.set(ox + sp.x, 0, oz + sp.z);
        const P = sp.nodes.map(n => new T.Vector3(n.p[0], n.p[1], n.p[2]));
        sp.nodes.forEach((n, i) => { const m = ns[i], r = n.r || .3; m.position.copy(P[i]); m.scale.setScalar(r); m.material.color.set(n.c); m.material.emissive.set(n.c); m.material.emissiveIntensity = .05 + (n.glow == null ? .3 : n.glow) * .9;
          if (n.t) { const o = nl[i] || (nl[i] = mkLabel(w, 'num')); setL(o, n.t, G2.position.x + P[i].x, P[i].y + r + .35, G2.position.z + P[i].z); } });
        sp.links.forEach((l, i) => { const a = P[l[0]].clone(), b = P[l[1]].clone(), d = new T.Vector3().subVectors(b, a).normalize();
          a.addScaledVector(d, sp.nodes[l[0]].r || .3); b.addScaledVector(d, -(sp.nodes[l[1]].r || .3)); if (l[4]) { a.z += l[4]; b.z += l[4]; }
          place(ls[i], a, b, .015 + l[2] * .11); ls[i].material.color.set(l[3] || 0x9db8ff); });
        if (sp.title) setL(tl, sp.title, G2.position.x + (sp.tx || 0), sp.ty || 5, G2.position.z); else tl.hide = true;
      };
      return w;
    },
  };

  const keyOf = sp => sp.type + ':' + (sp.type === 'tiles' ? sp.rows + 'x' + sp.cols : sp.type === 'bars' ? sp.v.length : sp.type === 'nodes' ? sp.nodes.length + '/' + sp.links.length : sp.type === 'plot' ? sp.w + '/' + (sp.h || 3.6) : '');
  function kill(w) { parent.remove(w.grp); w.labels.forEach(o => { o.dead = true; o.el.remove(); }); }
  return {
    update(list) {
      const seen = new Set();
      for (const sp of list) { seen.add(sp.id); let w = W.get(sp.id); const k = keyOf(sp);
        if (w && w.key !== k) { kill(w); w = null; }
        if (!w) { w = K[sp.type](sp); w.key = k; W.set(sp.id, w); }
        w.grp.visible = true; w.upd(sp); }
      for (const [id, w] of W) if (!seen.has(id)) { w.grp.visible = false; w.labels.forEach(o => o.hide = true); }
    },
  };
}
