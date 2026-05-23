/* ============================================================
   ARCHIVO: js/animations.js
   PROPÓSITO: Sistema de interacciones premium para Cardel.

   Módulos:
   1. Cursor personalizado (punto dorado + anillo con Lerp)
   2. Partículas slow-motion en canvas al hacer click
   3. Activación de clase para borde giratorio en tarjetas

   Todos los efectos se desactivan automáticamente en táctil.
   Optimizado con requestAnimationFrame + aceleración por hardware.
   ============================================================ */

'use strict';

/* ── DETECCIÓN DE DISPOSITIVO TÁCTIL ─────────────────────────
   Si el puntero es "coarse" (dedo), no iniciamos nada.
   ─────────────────────────────────────────────────────────── */
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;


/* ══════════════════════════════════════════════════════════════
   MÓDULO 1: CURSOR PERSONALIZADO PREMIUM
   ══════════════════════════════════════════════════════════════ */

(function initCustomCursor() {
  if (isTouchDevice) return;

  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  /* Posición actual del mouse */
  let mouseX = -100, mouseY = -100;

  /* Posición interpolada del anillo */
  let ringX = -100, ringY = -100;

  /* Factor Lerp: qué tan rápido sigue el anillo al punto.
     0.08 = seguimiento suave y elástico tipo "flotante" */
  const LERP_FACTOR = 0.08;

  /* ── Capturar posición del mouse al instante ────────────── */
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  /* ── Click: pulso en dot + onda ripple visual ───────────── */
  document.addEventListener('mousedown', () => {
    dot.classList.add('clicking');
    ring.classList.add('clicking');

    /* Crear onda de expansión temporal */
    const ripple = document.createElement('div');
    ripple.className = 'cursor-ripple';
    ripple.style.left = mouseX + 'px';
    ripple.style.top  = mouseY + 'px';
    document.body.appendChild(ripple);

    /* Eliminar al terminar la animación CSS */
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });

  document.addEventListener('mouseup', () => {
    dot.classList.remove('clicking');
    ring.classList.remove('clicking');
  });

  /* ── Elementos interactivos: expandir anillo en hover ────── */
  const INTERACTIVE = [
    'a', 'button', '.btn', '.nav-link', '.nav-cta',
    '.service-card', '.pricing-card', '.process-step',
    '.plan-card', '.diff-item', '.stat-card',
    '.social-link', '.step-item', 'input', 'textarea',
    '[role="button"]', 'label[for]'
  ].join(', ');

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(INTERACTIVE)) {
      ring.classList.add('expanded');
    }
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(INTERACTIVE)) {
      ring.classList.remove('expanded');
    }
  }, { passive: true });

  /* Ocultar cursor al salir del viewport */
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });

  /* ── Bucle de animación principal (rAF) ──────────────────── */
  function animateCursor() {
    /* Punto central: posición inmediata vía CSS left/top */
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';

    /* Anillo: interpolación Lerp para efecto elástico suave */
    ringX += (mouseX - ringX) * LERP_FACTOR;
    ringY += (mouseY - ringY) * LERP_FACTOR;

    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';

    requestAnimationFrame(animateCursor);
  }

  requestAnimationFrame(animateCursor);

})();


/* ══════════════════════════════════════════════════════════════
   MÓDULO 2: PARTÍCULAS SLOW-MOTION EN CANVAS
   ══════════════════════════════════════════════════════════════ */

(function initParticles() {
  if (isTouchDevice) return;

  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  /* Paleta de colores de la marca Cardel */
  const PALETTE = [
    { r: 245, g: 166, b:  35 },   /* Ámbar principal */
    { r: 255, g: 192, b:  87 },   /* Ámbar claro */
    { r:  61, g: 142, b: 240 },   /* Azul eléctrico */
    { r: 240, g: 237, b: 232 },   /* Blanco crema */
  ];

  let particles = [];

  /* Ajustar canvas al tamaño de ventana */
  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  /* ── Clase Partícula ─────────────────────────────────────── */
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;

      /* Velocidad baja para efecto slow-motion elegante */
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.8;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - (0.2 + Math.random() * 0.5); /* tiende a subir */

      /* Física orgánica */
      this.gravity    = -0.006 + Math.random() * 0.005; /* casi flotación */
      this.wobbleAmp  = 0.25 + Math.random() * 0.4;
      this.wobbleFreq = 0.025 + Math.random() * 0.03;
      this.wobbleOff  = Math.random() * Math.PI * 2;

      /* Apariencia */
      this.color    = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      this.type     = Math.random() < 0.55 ? 'circle' : 'star';
      this.size     = 2 + Math.random() * 3.5;
      this.rotation = Math.random() * Math.PI;
      this.rotSpeed = (Math.random() - 0.5) * 0.035;

      /* Ciclo de vida: fade lento (≈2-3 segundos) */
      this.life  = 1.0;
      this.decay = 0.004 + Math.random() * 0.004;
      this.age   = 0;
    }

    update() {
      this.age++;
      /* Wobble sinusoidal horizontal */
      this.vx += Math.sin(this.age * this.wobbleFreq + this.wobbleOff) * this.wobbleAmp * 0.04;
      this.vy += this.gravity;
      this.x  += this.vx;
      this.y  += this.vy;
      this.rotation += this.rotSpeed;
      this.life     -= this.decay;
    }

    draw() {
      const { r, g, b } = this.color;
      const alpha = Math.max(0, this.life);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(this.x, this.y);

      if (this.type === 'circle') {
        /* Círculo con gradiente radial luminoso */
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        grad.addColorStop(0,   `rgba(${r},${g},${b},1)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},0.5)`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

      } else {
        /* Estrella geométrica de 4 puntas */
        ctx.rotate(this.rotation);
        ctx.fillStyle   = `rgba(${r},${g},${b},1)`;
        ctx.shadowColor = `rgba(${r},${g},${b},0.7)`;
        ctx.shadowBlur  = this.size * 2;
        ctx.beginPath();
        const outer = this.size;
        const inner = this.size * 0.38;
        for (let i = 0; i < 8; i++) {
          const rad   = i % 2 === 0 ? outer : inner;
          const angle = (i * Math.PI) / 4;
          i === 0
            ? ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
            : ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    isDead() { return this.life <= 0; }
  }

  /* ── Generar partículas en cada click ────────────────────── */
  document.addEventListener('click', (e) => {
    /* No disparar si el menú móvil está abierto */
    if (document.querySelector('.nav-menu.open')) return;

    const count = 10 + Math.floor(Math.random() * 5); /* 10-14 partículas */
    for (let i = 0; i < count; i++) {
      const ox = (Math.random() - 0.5) * 8;
      const oy = (Math.random() - 0.5) * 8;
      particles.push(new Particle(e.clientX + ox, e.clientY + oy));
    }
  }, { passive: true });

  /* ── Bucle de renderizado ────────────────────────────────── */
  function renderLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => {
      p.update();
      p.draw();
      return !p.isDead();
    });
    requestAnimationFrame(renderLoop);
  }

  requestAnimationFrame(renderLoop);

})();


/* ══════════════════════════════════════════════════════════════
   MÓDULO 3: CLASE HELPER PARA BORDE GIRATORIO EN TARJETAS
   ══════════════════════════════════════════════════════════════
   El borde conic-gradient está definido en CSS (:hover).
   Este módulo añade una clase .glow-active por si necesitas
   controlarlo programáticamente en el futuro.
   ══════════════════════════════════════════════════════════════ */

(function initGlowBorders() {
  if (isTouchDevice) return;

  document.querySelectorAll('.service-card, .pricing-card, .plan-card, .step-item, .diff-item, .stat-card')
    .forEach(card => {
      card.addEventListener('mouseenter', () => card.classList.add('glow-active'));
      card.addEventListener('mouseleave', () => card.classList.remove('glow-active'));
    });

})();
