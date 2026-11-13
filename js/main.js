/* The Hub VR · interações do site (sem dependências) */
(() => {
  'use strict';

  const WA_NUMBER = '5583993035168';
  const doc = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  /* ---------- Links de WhatsApp com mensagem contextual ---------- */
  $$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); });

  /* ---------- Ano no rodapé ---------- */
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Abertura: duas lentes se abrem sobre o hero ---------- */
  const hero = $('.hero');
  const startHero = () => hero && hero.classList.add('is-ready');
  const lens = $('.lens');
  let introSeen = false;
  try { introSeen = sessionStorage.getItem('hub-intro') === '1'; } catch (e) { /* armazenamento indisponível */ }

  const runIntro = () => {
  if (!lens || reduced || introSeen || window.scrollY > 40) {
    doc.classList.add('no-intro');
    lens && lens.remove();
    requestAnimationFrame(startHero);
  } else {
    try { sessionStorage.setItem('hub-intro', '1'); } catch (e) { /* ignora */ }
    const svg = $('.lens-svg', lens);
    const holes = $$('.lens-hole', lens);
    const rings = $$('.lens-ring', lens);
    const label = $('.lens-label', lens);
    const W = innerWidth, H = innerHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const portrait = H > W;
    const gap = portrait ? W * 0.24 : Math.min(W * 0.14, 220);
    const base = portrait ? W * 0.19 : Math.min(W, H) * 0.16;
    const cy = H * 0.5;
    const centers = [W / 2 - gap, W / 2 + gap];
    const maxR = Math.hypot(W, H);
    const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const set = (r, ry) => {
      [...holes, ...rings].forEach((el, i) => {
        el.setAttribute('cx', centers[i % 2]);
        el.setAttribute('cy', cy);
        el.setAttribute('rx', r);
        el.setAttribute('ry', ry);
      });
    };
    set(0, 0);
    let t0 = null;
    const grow = 450, hold = 150, open = 950;
    const frame = (now) => {
      if (t0 === null) t0 = now;
      const t = now - t0;
      if (t < grow) {
        const k = ease(t / grow);
        set(base * k, base * 0.82 * k);
      } else if (t < grow + hold) {
        set(base, base * 0.82);
      } else if (t < grow + hold + open) {
        const k = ease((t - grow - hold) / open);
        const r = base + (maxR - base) * k;
        set(r, base * 0.82 + (maxR - base * 0.82) * k);
        label.style.opacity = String(1 - k * 3);
        rings.forEach((el) => { el.style.opacity = String(1 - k); });
        if (k > 0.35) startHero();
      } else {
        startHero();
        lens.classList.add('is-done');
        setTimeout(() => lens.remove(), 600);
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    // Se a pessoa já quiser rolar, a abertura sai do caminho.
    const skip = () => { t0 = -1e9; };
    addEventListener('wheel', skip, { once: true, passive: true });
    addEventListener('touchstart', skip, { once: true, passive: true });
    addEventListener('keydown', skip, { once: true });
  }
  };
  // A abertura das lentes começa quando a tela de carregamento termina.
  (window.hubReady || Promise.resolve()).then(runIntro);

  /* ---------- Header, barra de progresso e botão flutuante ---------- */
  const header = $('.site-header');
  const bar = $('.progress span');
  const waFloat = $('.wa-float');
  const heroMedia = $('.hero-media');
  const heroContent = $('.hero-content');
  const parallax = reduced ? [] : $$('[data-speed]');
  let ticking = false;
  let contactInView = false;
  const contactSec = document.getElementById('contato');
  if (contactSec) new IntersectionObserver(([en]) => { contactInView = en.isIntersecting; onScroll(); }, { threshold: 0.15 }).observe(contactSec);

  const onScroll = () => {
    const y = scrollY;
    const max = doc.scrollHeight - innerHeight;
    header.classList.toggle('is-solid', y > 40);
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (waFloat) waFloat.classList.toggle('is-visible', y > innerHeight * 0.6 && !contactInView);

    if (!reduced && hero && y < innerHeight * 1.2) {
      const p = y / innerHeight;
      heroMedia.style.transform = `translate3d(0, ${p * 18}vh, 0) scale(${1 + p * 0.08})`;
      heroContent.style.transform = `translate3d(0, ${p * -8}vh, 0)`;
      heroContent.style.opacity = String(Math.max(0, 1 - p * 1.4));
    }
    for (const el of parallax) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const mid = r.top + r.height / 2 - innerHeight / 2;
      el.style.translate = `0 ${(mid * parseFloat(el.dataset.speed)).toFixed(1)}px`;
    }
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu móvel ---------- */
  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      header.classList.add('is-solid');
      $('a', menu).focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      menu.hidden = true;
      document.body.style.overflow = '';
      onScroll();
    }
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
  });
  matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  /* ---------- Link ativo na navegação ---------- */
  const navLinks = $$('.nav a');
  const navTargets = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${en.target.id}`)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navTargets.forEach((s) => navIO.observe(s));

  /* ---------- Revelações no scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  $$('.rv, .rv-img, .fov').forEach((el) => revealIO.observe(el));
  // Itens lado a lado entram em sequência.
  $$('.facts-list, .mvv, .timeline, .reviews, .faq-list').forEach((group) => {
    $$('.rv', group).forEach((el, i) => { el.style.transitionDelay = `${i * 0.08}s`; });
  });

  const bpIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-drawn'); bpIO.unobserve(en.target); }
    });
  }, { threshold: 0.4 });
  $$('.blueprint').forEach((el) => bpIO.observe(el));

  /* ---------- Passos com imagem fixa ---------- */
  const steps = $$('.step');
  const stageImgs = $$('.stage-frame img');
  const stageCount = $('.stage-count b');
  const stepIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const i = en.target.dataset.step;
      steps.forEach((s) => s.classList.toggle('is-active', s === en.target));
      stageImgs.forEach((img) => img.classList.toggle('is-on', img.dataset.step === i));
      if (stageCount) stageCount.textContent = String(Number(i) + 1).padStart(2, '0');
    });
  }, { rootMargin: '-48% 0px -48% 0px' });
  steps.forEach((s) => stepIO.observe(s));

  /* ---------- Inclinação 3D sutil (só com mouse) ---------- */
  if (finePointer && !reduced) {
    $$('[data-tilt]').forEach((el) => {
      const target = el.classList.contains('device-visual') ? $('.device-photo', el) : el;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        target.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
        target.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
        target.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
        target.style.setProperty('--my', `${(y + 0.5) * 100}%`);
        target.style.setProperty('--glare', '1');
      });
      el.addEventListener('pointerleave', () => {
        ['--rx', '--ry'].forEach((p) => target.style.setProperty(p, '0deg'));
        target.style.setProperty('--glare', '0');
      });
    });
  }

  /* ---------- Comparativo: tudo / só diferenças ---------- */
  const cmp = $('.cmp');
  $$('[data-cmp]').forEach((btn, _, all) => {
    btn.addEventListener('click', () => {
      all.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      cmp.classList.toggle('only-diff', btn.dataset.cmp === 'diff');
    });
  });

  /* ---------- Filtros de jogos ---------- */
  const games = $$('.game');
  const count = $('.filter-count b');
  const countWrap = $('.filter-count');
  const empty = $('.games-empty');
  const state = { cat: 'todos', players: 'todos' };
  const applyFilters = () => {
    let n = 0;
    games.forEach((g) => {
      const okCat = state.cat === 'todos' || g.dataset.cat.split(' ').includes(state.cat);
      const okPl = state.players === 'todos' || g.dataset.players.split(' ').includes(state.players);
      const show = okCat && okPl;
      const wasHidden = g.classList.contains('is-hidden');
      g.classList.toggle('is-hidden', !show);
      if (show) {
        n++;
        if (wasHidden && !reduced) {
          g.classList.add('is-entering');
          requestAnimationFrame(() => requestAnimationFrame(() => g.classList.remove('is-entering')));
        }
      }
    });
    count.textContent = n;
    countWrap.lastChild.textContent = n === 1 ? ' jogo' : ' jogos';
    empty.hidden = n !== 0;
  };
  $$('[data-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.filter;
      state[key] = chip.dataset.value;
      $$(`[data-filter="${key}"]`).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      applyFilters();
    });
  });
  $('[data-reset]')?.addEventListener('click', () => {
    state.cat = 'todos'; state.players = 'todos';
    $$('[data-filter]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.value === 'todos')));
    applyFilters();
  });

  /* ---------- Trailer em janela (YouTube sem cookies, só ao clicar) ---------- */
  const dlg = $('.trailer');
  const dlgFrame = $('.trailer-frame', dlg);
  const dlgTitle = $('#trailer-title');
  const dlgCta = $('.trailer-cta', dlg);
  const closeDlg = () => { dlg.close(); };
  dlg.addEventListener('close', () => { dlgFrame.innerHTML = ''; });
  $('.trailer-close', dlg).addEventListener('click', closeDlg);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDlg(); });
  $$('[data-trailer]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.trailer;
      const title = btn.dataset.title;
      dlgTitle.textContent = title;
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      f.title = `Trailer de ${title}`;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      dlgFrame.replaceChildren(f);
      dlgCta.href = waLink(`Olá! Vi o trailer de ${title} no site e quero jogar na The Hub. Tem horário?`);
      dlg.showModal();
    });
  });

  /* ---------- Mapas carregados sob demanda ---------- */
  $$('.map').forEach((box) => {
    $('.map-load', box).addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = box.dataset.map;
      f.title = box.dataset.title;
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.replaceChildren(f);
    });
  });

  /* ---------- Galeria: arrastar e botões ---------- */
  const rail = $('.rail');
  if (rail) {
    const step = () => (rail.querySelector('li')?.getBoundingClientRect().width || 300) + 16;
    $$('[data-rail]').forEach((b) => b.addEventListener('click', () => {
      rail.scrollBy({ left: step() * Number(b.dataset.rail) * 2, behavior: reduced ? 'auto' : 'smooth' });
    }));
    if (finePointer) {
      let down = false, startX = 0, startLeft = 0, moved = false;
      rail.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') return;
        down = true; moved = false; startX = e.clientX; startLeft = rail.scrollLeft;
      });
      addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 5) { moved = true; rail.classList.add('is-drag'); }
        rail.scrollLeft = startLeft - dx;
      });
      addEventListener('pointerup', () => {
        if (!down) return;
        down = false;
        setTimeout(() => rail.classList.remove('is-drag'), 0);
      });
      rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
      rail.addEventListener('dragstart', (e) => e.preventDefault());
    }
  }

  /* ---------- Formulário que monta a mensagem do WhatsApp ---------- */
  const form = $('#wa-form');
  if (form) {
    const err = $('.form-error', form);
    const name = form.elements.nome;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = name.value.trim();
      if (!nome) {
        err.hidden = false;
        name.setAttribute('aria-invalid', 'true');
        name.focus();
        return;
      }
      err.hidden = true;
      name.removeAttribute('aria-invalid');
      const assunto = form.elements.assunto.value;
      const detalhes = form.elements.detalhes.value.trim();
      let msg = `Olá! Meu nome é ${nome} e quero ${assunto}.`;
      if (detalhes) msg += `\n\n${detalhes}`;
      window.open(waLink(msg), '_blank', 'noopener');
    });
    name.addEventListener('input', () => { if (name.value.trim()) { err.hidden = true; name.removeAttribute('aria-invalid'); } });
  }
})();
