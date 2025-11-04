// Footer year
  document.getElementById('y').textContent = new Date().getFullYear();

  // Navbar: keep .active only on click (no scroll-spy)
  const nav = document.getElementById('nav');
  nav?.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', (e) => {
      nav.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      e.currentTarget.classList.add('active');
      // dejamos que el browser haga el scroll por defecto (con el offset fijo del CSS)
    });
  });

  // --- Sticky Nav simple (sin cálculos de altura) ---
  const navbarEl = document.querySelector('.navbar');

  function onScroll(){
    const shouldStick = window.scrollY > 10;
    const wasStuck = navbarEl.classList.contains('stuck');

    if (shouldStick && !wasStuck){
      // Para evitar “salto” cuando pasa a fixed, empujamos el body 
      // con el mismo valor que usaste en scroll-margin-top (64px)
      document.body.style.paddingTop = '64px';
      navbarEl.classList.add('stuck');
    } else if (!shouldStick && wasStuck){
      navbarEl.classList.remove('stuck');
      document.body.style.paddingTop = '0px';
    }
  }

  window.addEventListener('load', onScroll, { once:true });
  window.addEventListener('scroll', onScroll, { passive:true });

  // Bootstrap form validation (igual que antes)
  (() => {
    'use strict';
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) { event.preventDefault(); event.stopPropagation(); }
        form.classList.add('was-validated');
      }, false);
    });
  })();

  // IntersectionObserver reveal (igual que antes)
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry => {
      if(entry.isIntersecting){ entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  },{ threshold: .15 });
  revealEls.forEach(el => io.observe(el));

/* === ScrollSpy por sección visible (con offset de header fijo) === */
(() => {
  const OFFSET = 64; // alto fijo del nav cuando está "stuck" (mismo que tu scroll-margin-top)
  const navContainer = document.getElementById('nav');
  if (!navContainer) return;

  const navLinks = Array.from(navContainer.querySelectorAll('.nav-link[href^="#"]'));
  const sections = navLinks
    .map(l => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  // Helper para setear activo
  const setActive = (link) => {
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  };

  // Si venís de un click, evitá que el scrollspy pelee el estado por un ratito
  let isClickScrolling = false;
  let clickTimeout;
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      isClickScrolling = true;
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => { isClickScrolling = false; }, 700);
    });
  });

  // Observer: considera el offset superior del header y un "umbral" inferior
  const io = new IntersectionObserver((entries) => {
    if (isClickScrolling) return;

    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = '#' + entry.target.id;
      const link = navLinks.find(l => l.getAttribute('href') === id);
      if (link) {
        setActive(link);
        // opcional: actualizar la URL sin saltos
        history.replaceState(null, '', id);
      }
    });
  }, {
    root: null,
    rootMargin: `-${OFFSET + 1}px 0px -70% 0px`,
    threshold: 0
  });

  sections.forEach(sec => io.observe(sec));

  // Edge case: si estás muy arriba (antes de la primera sección)
  window.addEventListener('scroll', () => {
    if (isClickScrolling) return;
    if (window.scrollY < 10 && navLinks[0]) {
      setActive(navLinks[0]);
      history.replaceState(null, '', navLinks[0].getAttribute('href'));
    }
  }, { passive: true });
})();

/* === Tilt + Parallax en header.hero === */
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // No aplicamos en dispositivos sin puntero fino (mobile/tablet)
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!hasFinePointer || reducedMotion) return;

  const MAX_TILT = 10;   // grados máx. (rotación del texto)
  const MAX_SHIFT = 2;  // % máx. para parallax del background

  let rafId = null;
  let target = { tiltX: 0, tiltY: 0, px: '0%', py: '0%' };
  let current = { ...target };

  const lerp = (a, b, t) => a + (b - a) * t;

  function onMove(e){
    const rect = hero.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;   // ~ -0.5..0.5
    const dy = (e.clientY - cy) / rect.height;  // ~ -0.5..0.5

    // Tilt para el contenido (invertimos eje Y para que “siga” el mouse)
    const tiltX =  MAX_TILT * dx * 2;   // rotación Y (izq/der)
    const tiltY = -MAX_TILT * dy * 2;   // rotación X (arr/abajo)

    // Parallax del background (movemos en %)
    const px = `${(-dx * MAX_SHIFT).toFixed(3)}%`;
    const py = `${(-dy * MAX_SHIFT).toFixed(3)}%`;

    target.tiltX = tiltX;
    target.tiltY = tiltY;
    target.px = px;
    target.py = py;

    schedule();
  }

  function onLeave(){
    // volver suave al centro
    target.tiltX = 0;
    target.tiltY = 0;
    target.px = '0%';
    target.py = '0%';
    schedule();
  }

  function schedule(){
    if (rafId) return;
    rafId = requestAnimationFrame(update);
  }

  function update(){
    rafId = null;
    // Suavizado
    current.tiltX = lerp(current.tiltX, target.tiltX, 0.12);
    current.tiltY = lerp(current.tiltY, target.tiltY, 0.12);

    // px/py son strings, interpolamos aprox leyendo número
    const curPx = parseFloat(current.px) || 0;
    const curPy = parseFloat(current.py) || 0;
    const tarPx = parseFloat(target.px) || 0;
    const tarPy = parseFloat(target.py) || 0;
    const newPx = lerp(curPx, tarPx, 0.12);
    const newPy = lerp(curPy, tarPy, 0.12);
    current.px = `${newPx}%`;
    current.py = `${newPy}%`;

    hero.style.setProperty('--tiltX', current.tiltX.toFixed(3));
    hero.style.setProperty('--tiltY', current.tiltY.toFixed(3));
    hero.style.setProperty('--px', current.px);
    hero.style.setProperty('--py', current.ty);

    // ojo: typo intencional corregido:
    hero.style.setProperty('--py', current.py);

    // si no llegamos al objetivo, seguimos
    if (Math.abs(current.tiltX - target.tiltX) > 0.01 ||
        Math.abs(current.tiltY - target.tiltY) > 0.01 ||
        Math.abs(newPx - tarPx) > 0.01 ||
        Math.abs(newPy - tarPy) > 0.01) {
      schedule();
    }
  }

  hero.addEventListener('mousemove', onMove, { passive: true });
  hero.addEventListener('mouseleave', onLeave);

  // Si la ventana cambia tamaño, “reseteamos” a centro
  window.addEventListener('resize', onLeave);
})();

/* === Tilt Effect para .tilt-card (adaptado del ejemplo 3D Cards) === */
(() => {
  const cards = document.querySelectorAll('.tilt-card');
  if (!cards.length) return;

  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!hasFinePointer || reduced) return;

  const MAX_ROT = 5;  // grados máx. (como el ejemplo)
  const DEPTH = 15;    // translateZ

  cards.forEach(card => {
    const handleMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -MAX_ROT;
      const rotateY = ((x - centerX) / centerX) * MAX_ROT;

      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateZ(${DEPTH}px)
      `;
    };

    const handleLeave = () => {
      card.style.transform = `
        perspective(1000px)
        rotateX(0deg)
        rotateY(0deg)
        translateZ(0)
      `;
    };

    card.addEventListener('mousemove', (e) => handleMove(e));
    card.addEventListener('mouseleave', handleLeave);
  });
})();
