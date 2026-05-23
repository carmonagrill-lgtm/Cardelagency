/* ============================================================
   ARCHIVO: js/main.js
   PROPÓSITO: Lógica global de la aplicación.
   - Navbar: efecto scroll + menú hamburguesa
   - Animaciones de entrada con IntersectionObserver
   - Contador animado de estadísticas
   - Año dinámico en el footer
   ============================================================ */

'use strict';

/* ── 1. NAVBAR: SCROLL + HAMBURGUESA ──────────────────────────
   Al hacer scroll, añade la clase .scrolled que activa el
   efecto frosted glass en la navbar. El toggle hamburguesa
   abre y cierra el menú móvil con animación.
   ─────────────────────────────────────────────────────────── */

(function initNavbar() {
  const navbar    = document.querySelector('.navbar');
  const toggle    = document.querySelector('.nav-toggle');
  const menu      = document.querySelector('.nav-menu');
  const navLinks  = document.querySelectorAll('.nav-link, .nav-cta');

  if (!navbar) return;

  /* Efecto scroll: añadir clase al bajar más de 60px */
  let lastScrollY = 0;

  function onScroll() {
    const scrollY = window.scrollY;

    /* Activar fondo frosted glass */
    navbar.classList.toggle('scrolled', scrollY > 60);

    /* Ocultar navbar al bajar, mostrar al subir (UX móvil) */
    if (scrollY > lastScrollY && scrollY > 200) {
      navbar.style.transform = 'translateY(-100%)';
    } else {
      navbar.style.transform = 'translateY(0)';
    }

    lastScrollY = scrollY;
  }

  /* Usar requestAnimationFrame para no bloquear el hilo principal */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* Agregar transición de transform a la navbar */
  navbar.style.transition = 'transform 0.3s ease, background 0.4s ease, box-shadow 0.4s ease';

  /* ── MENÚ HAMBURGUESA ──────────────────────────────────── */
  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add('open');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; /* evita scroll de fondo */
  }

  function closeMenu() {
    menu.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  /* Cerrar al hacer clic en un enlace del menú */
  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  /* Cerrar al hacer clic fuera del menú */
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') &&
        !menu.contains(e.target) &&
        !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  /* Cerrar con tecla Escape (accesibilidad) */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
      toggle.focus();
    }
  });

})();


/* ── 2. ANIMACIONES DE ENTRADA CON INTERSECTIONOBSERVER ──────
   Observa todos los elementos con clase .reveal y les añade
   .visible cuando entran en la pantalla, activando la
   transición CSS definida en global.css.
   ─────────────────────────────────────────────────────────── */

(function initRevealAnimations() {
  const revealElements = document.querySelectorAll('.reveal');

  if (!revealElements.length) return;

  /* Verificar soporte de IntersectionObserver (todos los navegadores modernos) */
  if (!('IntersectionObserver' in window)) {
    /* Fallback: mostrar todos inmediatamente */
    revealElements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          /* Dejar de observar una vez que ya es visible (mejora de perf.) */
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,     /* Se activa cuando el 12% del elemento es visible */
      rootMargin: '0px 0px -40px 0px' /* Retrasa la activación ligeramente */
    }
  );

  revealElements.forEach(el => observer.observe(el));
})();


/* ── 3. CONTADOR ANIMADO DE ESTADÍSTICAS ──────────────────────
   Anima los números en las tarjetas de métricas
   (negocios digitalizados, años de experiencia, etc.)
   usando easing para una sensación más premium.
   ─────────────────────────────────────────────────────────── */

(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');

  if (!counters.length) return;

  /* Función de easing: ease out expo */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animateCounter(el) {
    const target   = parseInt(el.dataset.count, 10);
    const duration = 2000; /* milisegundos */
    const suffix   = el.dataset.suffix || '';
    const prefix   = el.dataset.prefix || '';
    let startTime  = null;

    function tick(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed  = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedVal = easeOutExpo(progress);
      const current  = Math.floor(easedVal * target);

      el.textContent = prefix + current + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = prefix + target + suffix;
      }
    }

    requestAnimationFrame(tick);
  }

  /* Observar cada contador y disparar la animación una sola vez */
  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(el => counterObserver.observe(el));
})();


/* ── 4. AÑO DINÁMICO EN EL COPYRIGHT ─────────────────────────
   Actualiza automáticamente el año en el footer para no
   tener que modificarlo manualmente cada año.
   ─────────────────────────────────────────────────────────── */

(function setCurrentYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();


/* ── 5. SMOOTH SCROLL PARA ANCLAS INTERNAS ───────────────────
   Polyfill suave para navegadores que no soporten
   scroll-behavior nativo en CSS, y desplaza con offset
   para que el contenido no quede tapado por la navbar fija.
   ─────────────────────────────────────────────────────────── */

(function initSmoothScroll() {
  const NAV_HEIGHT = 80; /* px — debe coincidir con --nav-height */

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href   = this.getAttribute('href');
      if (href === '#') return; /* Ignorar links vacíos */

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const targetTop = target.getBoundingClientRect().top
                      + window.scrollY
                      - NAV_HEIGHT;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    });
  });
})();


/* ── 6. EFECTO PARALLAX SUAVE EN EL HERO ─────────────────────
   Mueve levemente los orbes del hero al hacer scroll
   para crear profundidad (solo en desktop para ahorrar perf.)
   ─────────────────────────────────────────────────────────── */

(function initHeroParallax() {
  /* Solo activar en dispositivos con puntero fino (desktop/laptop) */
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const orb1 = document.querySelector('.hero-orb-1');
  const orb2 = document.querySelector('.hero-orb-2');

  if (!orb1 && !orb2) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;

    window.requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const factor1 = scrollY * 0.15;
      const factor2 = scrollY * 0.08;

      if (orb1) orb1.style.transform = `translateY(${factor1}px)`;
      if (orb2) orb2.style.transform = `translateY(${-factor2}px)`;

      ticking = false;
    });

    ticking = true;
  }, { passive: true });
})();
