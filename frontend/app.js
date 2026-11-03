/* ================================================================
   Hotel Refugio del Lago — app.js
   ================================================================ */

'use strict';

const $ = id => document.getElementById(id);

const els = {
  cursor:       $('cursor'),
  navbar:       $('navbar'),
  heroBg:       $('heroBg'),
  hamburger:    $('hamburger'),
  mobileNav:    $('mobileNav'),
  mobileClose:  $('mobileClose'),
  checkIn:      $('checkIn'),
  checkOut:     $('checkOut'),
  searchBtn:    $('searchBtn'),
  modal:        $('reservaModal'),
  modalBackdrop:$('modalBackdrop'),
  modalClose:   $('modalClose'),
  ctaBtn:       $('ctaReservaBtn'),
  navBtn:       $('navReservaBtn'),
  modalCheckIn: $('modalCheckIn'),
  modalCheckOut:$('modalCheckOut'),
};

/* ── CURSOR ── */
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) {
    els.cursor.style.display = 'none';
    return;
  }
  let mx = 0, my = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function tick() {
    cx += (mx - cx) * .13;
    cy += (my - cy) * .13;
    els.cursor.style.left = cx + 'px';
    els.cursor.style.top  = cy + 'px';
    requestAnimationFrame(tick);
  })();
  document.querySelectorAll('a, button, .room-card, .amenity-item').forEach(el => {
    el.addEventListener('mouseenter', () => els.cursor.classList.add('large'));
    el.addEventListener('mouseleave', () => els.cursor.classList.remove('large'));
  });
}

/* ── NAVBAR ── */
function initNavbar() {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        els.navbar.classList.toggle('scrolled', window.scrollY > 72);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  els.hamburger.addEventListener('click', () => {
    els.mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  els.mobileClose.addEventListener('click', closeMobileNav);
  document.querySelectorAll('.mobile-link:not(.mobile-reserva-btn)').forEach(a =>
    a.addEventListener('click', closeMobileNav)
  );
}

function closeMobileNav() {
  els.mobileNav.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── PARALLAX ── */
function initParallax() {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        els.heroBg.style.transform = `translateY(${window.scrollY * .28}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ── DATES ── */
function initDates() {
  const fmt = d => d.toISOString().split('T')[0];
  const today = new Date();
  const d1 = new Date(today); d1.setDate(today.getDate() + 1);
  const d3 = new Date(today); d3.setDate(today.getDate() + 3);

  function setup(ci, co) {
    if (!ci || !co) return;
    ci.min = ci.value = fmt(d1);
    co.min = co.value = fmt(d3);
    ci.addEventListener('change', () => {
      const next = new Date(ci.value);
      next.setDate(next.getDate() + 2);
      if (!co.value || new Date(co.value) <= new Date(ci.value)) co.value = fmt(next);
      co.min = ci.value;
    });
  }
  setup(els.checkIn, els.checkOut);
  setup(els.modalCheckIn, els.modalCheckOut);
}

/* ── MODAL ── */
function openModal() {
  if (els.checkIn?.value)  els.modalCheckIn.value  = els.checkIn.value;
  if (els.checkOut?.value) els.modalCheckOut.value = els.checkOut.value;
  els.modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  els.modal.classList.remove('open');
  document.body.style.overflow = '';
}

function initModal() {
  els.ctaBtn?.addEventListener('click', openModal);
  els.searchBtn?.addEventListener('click', openModal);

  els.navBtn?.addEventListener('click', e => { e.preventDefault(); openModal(); });

  document.querySelectorAll('.mobile-reserva-btn').forEach(btn =>
    btn.addEventListener('click', e => {
      e.preventDefault();
      closeMobileNav();
      setTimeout(openModal, 300);
    })
  );
  document.querySelectorAll('.room-btn').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); openModal(); })
  );

  els.modalClose?.addEventListener('click', closeModal);
  els.modalBackdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* ── REVEAL ── */
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => io.observe(el));

  setTimeout(() => {
    document.querySelectorAll('#hero .reveal').forEach(el => el.classList.add('visible'));
  }, 150);
}

/* ── RESERVAS (API) ── */
async function cargarHabitaciones() {
  const select = document.getElementById('modalHabitacion');
  if (!select || !window.API) return;
  try {
    const habitaciones = await API.habitaciones.listar();
    select.innerHTML = '<option value="">Seleccioná una opción</option>' +
      habitaciones.map(h =>
        `<option value="${h.id}">${h.titulo} — USD ${Number(h.precioPorNoche).toFixed(0)}</option>`
      ).join('');
  } catch (err) {
    select.innerHTML = `<option value="">Error: ${err.message}</option>`;
  }
}

function initReservaForm() {
  const form = document.getElementById('reservaForm');
  const feedback = document.getElementById('modalFeedback');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.textContent = 'Procesando reserva...';
    feedback.style.color = '';

    const payload = {
      nombre: document.getElementById('modalNombre').value.trim(),
      email: document.getElementById('modalEmail').value.trim(),
      checkIn: document.getElementById('modalCheckIn').value,
      checkOut: document.getElementById('modalCheckOut').value,
      cantidadDePersonas: parseInt(document.getElementById('modalHuespedes').value, 10),
      idHabitacion: parseInt(document.getElementById('modalHabitacion').value, 10),
    };

    if (!payload.idHabitacion) {
      feedback.textContent = 'Seleccioná una habitación.';
      feedback.style.color = '#b00';
      return;
    }

    try {
      const reserva = await API.reservas.crear(payload);
      feedback.textContent = `¡Reserva #${reserva.id} confirmada! Total: USD ${reserva.montoTotal}`;
      feedback.style.color = '#2f4f46';
      form.reset();
    } catch (err) {
      feedback.textContent = `Error: ${err.message}`;
      feedback.style.color = '#b00';
    }
  });
}

/* ── INIT ── */
function init() {
  initCursor();
  initNavbar();
  initParallax();
  initDates();
  initModal();
  initReveal();
  cargarHabitaciones();
  initReservaForm();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();