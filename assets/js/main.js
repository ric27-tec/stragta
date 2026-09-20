/* ============================================================
   main.js — navigation effects and scroll reveal.
   ============================================================ */

// ── SCROLL REVEAL ────────────────────────────────────────────
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── NAV SCROLL SHADOW ────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('main-nav')
    .classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });
