/* ============================================================
   contact.js — isolated contact-form integration

   Current provider: Google Apps Script -> Google Sheet/email.
   Future Odoo CRM integration should replace CONTACT_ENDPOINT and
   the submit adapter in this file; the public pages can stay intact.
   ============================================================ */

const CONTACT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwM4_ccoKLbt8_ZcQ8wdq7XdDDJC8Jus9LMfQUTr8UdBgpXq9Qa4EwmSyks6DyAKJwN/exec';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const statusDiv = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');
  const isSpanish = document.documentElement.lang === 'es';

  if (!form) return;

  const startedAt = form.querySelector('[name="form_started_at"]');
  if (startedAt) startedAt.value = String(Date.now());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const elapsed = Date.now() - Number(formData.get('form_started_at'));
    const trapped = formData.get('website') || formData.get('fax_number');
    const validForm = formData.get('form_id') === 'stragta-contact-2026';

    if (trapped || !validForm || !Number.isFinite(elapsed) || elapsed < 2500) {
      statusDiv.className = 'form-error';
      statusDiv.textContent = isSpanish
        ? 'No pudimos validar el formulario. Espera un momento y vuelve a intentarlo.'
        : 'We could not validate the form. Please wait a moment and try again.';
      return;
    }

    submitBtn.textContent = isSpanish ? 'Enviando...' : 'Sending...';
    submitBtn.disabled = true;
    statusDiv.textContent = '';
    statusDiv.className = '';

    try {
      await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      });

      form.reset();
      submitBtn.textContent = isSpanish ? 'Mensaje enviado' : 'Message sent';
      statusDiv.className = 'form-success';
      statusDiv.textContent = isSpanish
        ? 'Gracias. Hemos enviado tu mensaje y te responderemos en un día hábil.'
        : 'Thank you. We submitted your message and will reply within one business day.';

      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
        submitBtn.textContent = isSpanish ? 'Enviar mensaje' : 'Send message';
        submitBtn.disabled = false;
        if (startedAt) startedAt.value = String(Date.now());
      }, 5000);
    } catch (error) {
      console.error('Form error:', error);
      submitBtn.textContent = isSpanish ? 'Enviar mensaje' : 'Send message';
      submitBtn.disabled = false;
      statusDiv.className = 'form-error';
      statusDiv.textContent = isSpanish
        ? 'Algo salió mal. Inténtalo de nuevo o escríbenos directamente por LinkedIn.'
        : 'Something went wrong. Please try again or reach us directly on LinkedIn.';
    }
  });
});
