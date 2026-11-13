/* The Hub VR · tela de carregamento com minijogo
   Alvos triangulares (o triângulo das artes da marca) vêm pelo corredor da arena.
   O jogo se joga sozinho; quem tocar nos alvos assume o controle por alguns segundos.
   Desenho enxuto: fundo em CSS, traços agrupados e resolução adaptativa para não pesar no celular. */
(() => {
  'use strict';
  const doc = document.documentElement;
  const root = document.querySelector('.loader');
  if (!root || doc.classList.contains('no-loader')) {
    root && root.remove();
    window.hubReady = Promise.resolve();
    return;
  }

  let resolveReady;
  window.hubReady = new Promise((r) => { resolveReady = r; });
  doc.classList.add('is-loading');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const barEl = root.querySelector('.loader-bar span');
  const pctEl = root.querySelector('.loader-pct');
  const scoreEl = root.querySelector('.loader-score b');
  const skipBtn = root.querySelector('.loader-skip');

  const MIN_TIME = reduced ? 300 : 2800;
  const MAX_TIME = 6500;
  const t0 = performance.now();
  let W = 0, H = 0, scale = 1, cx = 0, cy = 0;
  let running = true, done = false, shown = 0, lastPct = -1;

  const resize = () => {
    W = innerWidth; H = innerHeight;
    // Telas pequenas desenham em resolução 1x; telas grandes, no máximo 1,5x.
    scale = Math.min(devicePixelRatio || 1, W < 800 ? 1 : 1.5);
    canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    cx = W / 2; cy = H * 0.46;
  };
  resize();
  addEventListener('resize', resize, { passive: true });

  /* ---------- Progresso real: imagens prioritárias, fontes e evento load ---------- */
  const tasks = [];
  document.querySelectorAll('img:not([loading="lazy"])').forEach((img) => {
    tasks.push(img.complete ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); }));
  });
  if (document.fonts && document.fonts.ready) tasks.push(document.fonts.ready);
  tasks.push(new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true }))));
  let finished = 0;
  tasks.forEach((p) => p.then(() => { finished++; }));
  const allLoaded = Promise.all(tasks);

  const tickProgress = (now) => {
    const real = finished / tasks.length;
    const timeFloor = Math.min(0.92, (now - t0) / (MIN_TIME * 1.05));
    const target = Math.max(shown, real * 0.6 + timeFloor * 0.4);
    shown += (target - shown) * 0.12;
    if (done) shown += (1 - shown) * 0.3;
    const pct = Math.min(100, Math.round(shown * 100));
    if (pct !== lastPct) {
      lastPct = pct;
      barEl.style.transform = `scaleX(${pct / 100})`;
      pctEl.textContent = String(pct).padStart(2, '0') + '%';
    }
  };

  /* ---------- Minijogo ---------- */
  const COLORS = ['#c86bff', '#fc5185', '#7fe3f0'];
  const FOCAL = 1.15;
  const targets = [], shards = [], beams = [];
  let score = 0, spawnIn = 0, manualUntil = 0, floorOffset = 0;
  const aim = { x: 0, y: 0, ready: false };

  const project = (x, y, z) => {
    const s = FOCAL / z;
    return { x: cx + x * W * 0.5 * s, y: cy + y * H * 0.5 * s, s };
  };
  const spawn = (z = 9) => {
    targets.push({
      x: (Math.random() * 2 - 1) * 0.55,
      y: (Math.random() * 2 - 1) * 0.32,
      z,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 2.2,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      alive: true,
    });
  };
  const explode = (t, p) => {
    t.alive = false;
    score++;
    scoreEl.textContent = String(score).padStart(3, '0');
    for (let i = 0; i < 9; i++) {
      const a = (Math.PI * 2 * i) / 9 + Math.random() * 0.4;
      const v = 140 + Math.random() * 220;
      shards.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, rot: a, color: t.color, len: 8 + Math.random() * 18 * p.s });
    }
    beams.push({ x: p.x, y: p.y, life: 1 });
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (done) return;
    let best = null, bestD = Infinity;
    for (const t of targets) {
      if (!t.alive) continue;
      const p = project(t.x, t.y, t.z);
      const d = Math.hypot(p.x - e.clientX, p.y - e.clientY);
      if (d < 90 * p.s + 18 && d < bestD) { best = { t, p }; bestD = d; }
    }
    manualUntil = performance.now() + 2500;
    aim.x = e.clientX; aim.y = e.clientY; aim.ready = true;
    if (best) explode(best.t, best.p);
  });
  [3.6, 5.2, 6.8, 8.2].forEach((z) => spawn(z));

  const triPath = (x, y, size, rot) => {
    for (let i = 0; i < 3; i++) {
      const a = rot + (i * Math.PI * 2) / 3 - Math.PI / 2;
      const px = x + Math.cos(a) * size, py = y + Math.sin(a) * size;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  };

  const drawCorridor = (dt) => {
    floorOffset = (floorOffset + dt * 2.2) % 1;
    ctx.lineWidth = 1;
    // linhas convergentes (um único traço)
    ctx.strokeStyle = 'rgba(200,107,255,.2)';
    ctx.beginPath();
    for (let i = -6; i <= 6; i++) {
      const far = project(i * 0.35, 1, 9), near = project(i * 0.35, 1, 0.4);
      ctx.moveTo(far.x, far.y); ctx.lineTo(near.x, near.y);
    }
    ctx.stroke();
    // linhas de profundidade agrupadas em três faixas de intensidade
    for (let band = 0; band < 3; band++) {
      ctx.strokeStyle = `rgba(200,107,255,${0.12 + band * 0.16})`;
      ctx.beginPath();
      for (let i = band; i < 15; i += 3) {
        const z = 9 - ((i + floorOffset) / 15) * 8.6;
        const fy = project(0, 1, z).y, ty = project(0, -1, z).y;
        ctx.moveTo(0, fy); ctx.lineTo(W, fy);
        ctx.moveTo(0, ty); ctx.lineTo(W, ty);
      }
      ctx.stroke();
    }
  };

  let last = performance.now();
  let slow = 0, skip = false;
  const loop = (now) => {
    if (!running) return;
    const raw = now - last;
    // Em aparelhos lentos o jogo passa a desenhar a 30 quadros por segundo.
    slow = slow * 0.9 + (raw > 24 ? 1 : 0) * 0.1;
    if (slow > 0.5 || W < 800) { skip = !skip; if (skip) { requestAnimationFrame(loop); return; } }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, W, H);
    drawCorridor(dt);

    spawnIn -= dt;
    let alive = 0;
    for (const t of targets) if (t.alive) alive++;
    if (spawnIn <= 0 && alive < 7) { spawn(); spawnIn = 0.22 + Math.random() * 0.3; }

    let nearest = null;
    for (const t of targets) {
      t.z -= dt * 3.1;
      t.rot += t.spin * dt;
      if (!t.alive) continue;
      if (t.z < 0.55) { t.alive = false; continue; }
      const p = project(t.x, t.y, t.z);
      const size = 90 * p.s;
      ctx.globalAlpha = Math.min(1, (9 - t.z) / 2.5);
      ctx.beginPath(); triPath(p.x, p.y, size, t.rot);
      ctx.fillStyle = t.color + '22'; ctx.fill();
      ctx.lineWidth = Math.max(1.2, 2.4 * p.s); ctx.strokeStyle = t.color; ctx.stroke();
      ctx.beginPath(); triPath(p.x, p.y, size * 0.45, -t.rot);
      ctx.lineWidth = 1; ctx.stroke();
      if (t.z < 6 && (!nearest || t.z < nearest.t.z)) nearest = { t, p };
    }
    ctx.globalAlpha = 1;
    for (let i = targets.length - 1; i >= 0; i--) if (!targets[i].alive) targets.splice(i, 1);

    // piloto automático: a mira persegue o alvo mais próximo e dispara
    if (now > manualUntil && nearest) {
      if (!aim.ready) { aim.x = cx; aim.y = cy + H * 0.2; aim.ready = true; }
      const k = Math.min(1, dt * 14);
      aim.x += (nearest.p.x - aim.x) * k;
      aim.y += (nearest.p.y - aim.y) * k;
      if (Math.hypot(nearest.p.x - aim.x, nearest.p.y - aim.y) < 14 && nearest.t.z < 3.9) explode(nearest.t, nearest.p);
    }

    // feixes saindo dos dois controles
    for (let i = beams.length - 1; i >= 0; i--) {
      const b = beams[i];
      b.life -= dt * 5;
      if (b.life <= 0) { beams.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(255,255,255,${b.life * 0.8})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W * 0.18, H + 10); ctx.lineTo(b.x, b.y);
      ctx.moveTo(W * 0.82, H + 10); ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // estilhaços
    ctx.lineWidth = 2;
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.life -= dt * 1.6;
      if (s.life <= 0) { shards.splice(i, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; s.rot += dt * 6;
      ctx.globalAlpha = s.life;
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + Math.cos(s.rot) * s.len, s.y + Math.sin(s.rot) * s.len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // mira
    if (aim.ready) {
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(aim.x + 14, aim.y); ctx.arc(aim.x, aim.y, 14, 0, Math.PI * 2);
      ctx.moveTo(aim.x - 22, aim.y); ctx.lineTo(aim.x - 8, aim.y);
      ctx.moveTo(aim.x + 8, aim.y); ctx.lineTo(aim.x + 22, aim.y);
      ctx.moveTo(aim.x, aim.y - 22); ctx.lineTo(aim.x, aim.y - 8);
      ctx.moveTo(aim.x, aim.y + 8); ctx.lineTo(aim.x, aim.y + 22);
      ctx.stroke();
    }

    tickProgress(now);
    requestAnimationFrame(loop);
  };

  const finish = () => {
    if (done) return;
    done = true;
    try { sessionStorage.setItem('hub-loaded', '1'); } catch (e) { /* armazenamento indisponível */ }
    root.classList.add('is-complete');
    setTimeout(() => {
      root.classList.add('is-done');
      doc.classList.remove('is-loading');
      resolveReady();
      setTimeout(() => { running = false; root.remove(); }, 650);
    }, reduced ? 0 : 350);
  };

  skipBtn.addEventListener('click', finish);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') finish(); });
  Promise.race([
    Promise.all([allLoaded, new Promise((r) => setTimeout(r, MIN_TIME))]),
    new Promise((r) => setTimeout(r, MAX_TIME)),
  ]).then(finish);

  if (reduced) {
    const step = (now) => { tickProgress(now); if (running) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  } else {
    requestAnimationFrame(loop);
  }
})();
