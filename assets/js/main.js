/* ============================================================
   main.js — nav scroll, scroll reveal, contact form
   Form routes to Google Apps Script (no server needed).
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

// ── CONTACT FORM ─────────────────────────────────────────────
// Routes to Google Apps Script — messages land directly in
// your Google Sheet, no server or console config needed.

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwM4_ccoKLbt8_ZcQ8wdq7XdDDJC8Jus9LMfQUTr8UdBgpXq9Qa4EwmSyks6DyAKJwN/exec';

document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('contact-form');
  const statusDiv = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    // Honeypot check — bots fill hidden fields, humans don't
    if (formData.get('website')) return;

    // Optimistic UI
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled    = true;
    statusDiv.textContent = '';
    statusDiv.className   = '';

    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode:   'no-cors',  // GAS requires no-cors; response is opaque
        body:   formData,
      });

      // no-cors gives no response body — treat reaching here as success
      form.reset();
      submitBtn.textContent = 'Message sent';
      statusDiv.className   = 'form-success';
      statusDiv.textContent = 'Thank you. One of our team members will be in touch within one business day.';

      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className   = '';
        submitBtn.textContent = 'Send message';
        submitBtn.disabled    = false;
      }, 5000);

    } catch (err) {
      console.error('Form error:', err);
      submitBtn.textContent = 'Send message';
      submitBtn.disabled    = false;
      statusDiv.className   = 'form-error';
      statusDiv.textContent = 'Something went wrong. Please try again or reach us directly on LinkedIn.';
    }
  });
});
