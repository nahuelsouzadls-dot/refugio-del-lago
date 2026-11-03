/* ================================================================
   Hotel Refugio del Lago — admin.js
   Interacciones del panel. No interfiere con app.js del landing.
   ================================================================ */

'use strict';

/* ── NAVEGACIÓN ENTRE SECCIONES ─────────────────────────────── */
const SECTION_LABELS = {
  dashboard:      'Resumen General',
  reservas:       'Gestión de Reservas',
  disponibilidad: 'Disponibilidad',
  habitaciones:   'Habitaciones',
  huespedes:      'Huéspedes',
};

function switchSection(name) {
  document.querySelectorAll('.nav-item[data-section]').forEach(el =>
    el.classList.toggle('active', el.dataset.section === name)
  );
  document.querySelectorAll('.section').forEach(el =>
    el.classList.toggle('active', el.id === 'sec-' + name)
  );
  const sub = document.getElementById('topbarSub');
  if (sub) sub.textContent = SECTION_LABELS[name] || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-item[data-section]').forEach(el =>
  el.addEventListener('click', e => { e.preventDefault(); switchSection(el.dataset.section); })
);

/* ── FECHA EN TOPBAR ────────────────────────────────────────── */
(function () {
  const el = document.getElementById('topbarDate');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
})();

/* ── MODAL HABITACIÓN ───────────────────────────────────────── */
const roomModal = document.getElementById('roomModal');

function openRoomModal(habitacion) {
  if (!roomModal) return;
  const titleEl    = document.getElementById('roomModalTitle');
  const idInput    = document.getElementById('roomId');
  const numero     = document.getElementById('roomNumero');
  const tipo       = document.getElementById('roomTipo');
  const titulo     = document.getElementById('roomTitulo');
  const precio     = document.getElementById('roomPrecio');
  const capacidad  = document.getElementById('roomCapacidad');
  const balcon     = document.getElementById('roomBalcon');
  const deleteBtn  = document.getElementById('roomDeleteBtn');
  const feedback   = document.getElementById('roomFeedback');

  if (feedback) feedback.textContent = '';

  if (habitacion) {
    titleEl.innerHTML = 'Editar <em>habitación</em>';
    idInput.value = habitacion.id;
    numero.value = habitacion.numero;
    tipo.value = habitacion.tipo;
    titulo.value = habitacion.titulo;
    precio.value = habitacion.precioPorNoche;
    capacidad.value = habitacion.capacidadMaxima;
    balcon.checked = !!habitacion.tieneBalcon;
    deleteBtn.style.display = 'inline-block';
  } else {
    titleEl.innerHTML = 'Agregar <em>habitación</em>';
    idInput.value = '';
    numero.value = '';
    tipo.value = 'estandar';
    titulo.value = '';
    precio.value = '';
    capacidad.value = '';
    balcon.checked = false;
    deleteBtn.style.display = 'none';
  }
  roomModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeRoomModal() {
  if (!roomModal) return;
  roomModal.classList.remove('open');
  document.body.style.overflow = '';
}

roomModal?.addEventListener('click', e => { if (e.target === roomModal) closeRoomModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRoomModal(); });

document.querySelectorAll('[data-modal="room"]').forEach(btn =>
  btn.addEventListener('click', () => openRoomModal(null))
);

/* ── ROOM FORM SUBMIT (create / update) ─────────────────────── */
document.getElementById('roomForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const feedback = document.getElementById('roomFeedback');
  const id = document.getElementById('roomId').value;
  const payload = {
    numero: document.getElementById('roomNumero').value.trim(),
    tipo: document.getElementById('roomTipo').value,
    titulo: document.getElementById('roomTitulo').value.trim(),
    precioPorNoche: parseFloat(document.getElementById('roomPrecio').value),
    capacidadMaxima: parseInt(document.getElementById('roomCapacidad').value, 10),
    tieneBalcon: document.getElementById('roomBalcon').checked,
  };
  feedback.textContent = 'Guardando...';
  feedback.style.color = '#666';
  try {
    if (id) {
      await API.habitaciones.actualizar(id, payload);
    } else {
      await API.habitaciones.crear(payload);
    }
    feedback.textContent = '¡Guardado!';
    feedback.style.color = '#2f4f46';
    setTimeout(() => {
      closeRoomModal();
      cargarHabitacionesAdmin();
      cargarDashboard();
    }, 400);
  } catch (err) {
    feedback.textContent = `Error: ${err.message}`;
    feedback.style.color = '#b00';
  }
});

/* ── ROOM DELETE ─────────────────────────────────────────────── */
document.getElementById('roomDeleteBtn')?.addEventListener('click', async () => {
  const id = document.getElementById('roomId').value;
  if (!id) return;
  if (!confirm('¿Eliminar esta habitación? Esta acción no se puede deshacer.')) return;
  const feedback = document.getElementById('roomFeedback');
  feedback.textContent = 'Eliminando...';
  feedback.style.color = '#666';
  try {
    await API.habitaciones.eliminar(id);
    closeRoomModal();
    cargarHabitacionesAdmin();
    cargarDashboard();
  } catch (err) {
    feedback.textContent = `Error: ${err.message}`;
    feedback.style.color = '#b00';
  }
});

/* ── FILTROS DE TABLA ───────────────────────────────────────── */
document.querySelectorAll('.filters').forEach(group => {
  group.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter  = btn.dataset.filter;
      const tableId = group.dataset.filterTable;
      const table   = tableId ? document.getElementById(tableId) : null;
      if (!table) return;

      table.querySelectorAll('tbody tr').forEach(row => {
        const match = filter === 'all' || row.dataset.status === filter;
        row.style.display = match ? '' : 'none';
      });
    });
  });
});

/* ── CALENDARIO INTERACTIVO ─────────────────────────────────── */
(function () {
  const OCCUPIED = {
    '2026-3': [4,5,6,7,12,13,14,18,19,20,25,26,27],
    '2026-4': [2,3,4,5,6,7,8,12,13,14,15,16,17,20,21,22,23,24,25],
    '2026-5': [1,2,3,7,8,9,14,15,16,22,23,24,28,29],
  };
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DIAS  = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

  let cur = new Date(2026, 4, 1); // mayo 2026

  function render() {
    const grid     = document.getElementById('calGrid');
    const monthLbl = document.getElementById('calMonth');
    if (!grid || !monthLbl) return;

    monthLbl.textContent = `${MESES[cur.getMonth()]} ${cur.getFullYear()}`;

    const key      = `${cur.getFullYear()}-${cur.getMonth()}`;
    const occupied = OCCUPIED[key] || [];
    const today    = new Date();
    const isNow    = today.getMonth() === cur.getMonth() && today.getFullYear() === cur.getFullYear();
    const firstDow = (new Date(cur.getFullYear(), cur.getMonth(), 1).getDay() + 6) % 7;
    const total    = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();

    let html = DIAS.map(d => `<div class="cal-day-label">${d}</div>`).join('');
    for (let i = 0; i < firstDow; i++) html += `<div class="cal-day empty"></div>`;
    for (let d = 1; d <= total; d++) {
      let cls = 'cal-day';
      if (isNow && d === today.getDate()) cls += ' today';
      else if (occupied.includes(d))      cls += ' occupied';
      html += `<div class="${cls}" data-day="${d}">${d}</div>`;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.cal-day:not(.empty)').forEach(cell => {
      cell.addEventListener('click', () => {
        grid.querySelectorAll('.cal-day.selected').forEach(c => c.classList.remove('selected'));
        if (!cell.classList.contains('today')) cell.classList.add('selected');
      });
    });
  }

  document.getElementById('calPrev')?.addEventListener('click', () => { cur.setMonth(cur.getMonth() - 1); render(); });
  document.getElementById('calNext')?.addEventListener('click', () => { cur.setMonth(cur.getMonth() + 1); render(); });

  render();
})();

/* ── ARRANQUE Y AUTENTICACIÓN ───────────────────────────────── */
(function () {
  const loginScreen = document.getElementById('adminLoginScreen');
  const adminLayout  = document.querySelector('.admin-layout');
  const form         = document.getElementById('loginForm');
  const error        = document.getElementById('loginError');

  if (!loginScreen || !adminLayout || typeof AUTH === 'undefined') return;

  /* Show dashboard — only called after server confirms the session */
  function mostrarDashboard() {
    loginScreen.style.display = 'none';
    adminLayout.style.display = 'flex';
    cargarTodosLosDatos();
  }

  /* Login form submit handler — wired up immediately so there is no
     window where the button does nothing while verify() is in-flight */
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verificando...';

      const user   = document.getElementById('loginUser').value.trim();
      const pass   = document.getElementById('loginPass').value;
      const result = await AUTH.login(user, pass);

      if (result.ok) {
        error.textContent = '';
        mostrarDashboard();
      } else {
        error.textContent = result.error || 'Credenciales incorrectas.';
        document.getElementById('loginPass').value = '';
        document.getElementById('loginPass').focus();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ingresar al panel';
      }
    });
  }

  function mostrarLogin() {
    AUTH.logout();
    adminLayout.style.transition = 'opacity .3s';
    adminLayout.style.opacity = '0';
    setTimeout(() => {
      adminLayout.style.display = 'none';
      adminLayout.style.opacity = '';
      adminLayout.style.transition = '';
      if (form) form.reset();
      if (error) error.textContent = '';
      const submitBtn = form?.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Ingresar al panel'; }
      loginScreen.style.display = '';
      loginScreen.style.opacity = '0';
      loginScreen.style.transition = 'opacity .3s';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        loginScreen.style.opacity = '1';
        setTimeout(() => {
          loginScreen.style.opacity = '';
          loginScreen.style.transition = '';
          document.getElementById('loginUser')?.focus();
        }, 310);
      }));
    }, 320);
  }

  document.getElementById('logoutBtn')?.addEventListener('click', mostrarLogin);

  /* Verify the stored token against the server.
     The login screen is the default HTML state, so it shows immediately
     while this async call resolves — no flash of dashboard content. */
  AUTH.verify().then(valid => {
    if (valid) mostrarDashboard();
    /* If invalid/no session: login screen is already visible, form is ready */
  });
})();

/* ── CARGA DE DATOS DESDE API ────────────────────────────────── */
const BADGE = {
  pendiente:  '<span class="adm-badge adm-badge-pending">Pendiente</span>',
  confirmada: '<span class="adm-badge adm-badge-ok">Confirmada</span>',
  checkin:    '<span class="adm-badge adm-badge-active">Check-in</span>',
  checkout:   '<span class="adm-badge">Check-out</span>',
  cancelada:  '<span class="adm-badge">Cancelada</span>',
};

const NEXT_STATE_BUTTONS = {
  pendiente: [
    { label: 'Confirmar', estado: 'confirmada', style: 'background:#2f4f46;color:#fff' },
  ],
  confirmada: [
    { label: 'Check-in', estado: 'checkin', style: 'background:#2f4f46;color:#fff' },
  ],
  checkin: [
    { label: 'Check-out', estado: 'checkout', style: 'background:#8b6b4e;color:#fff' },
  ],
  checkout: [],
  cancelada: [],
};

function btnHTML(reservaId, label, action, extraStyle = '') {
  return `<button class="btn-ghost" data-action="${action}" data-id="${reservaId}" style="padding:4px 10px;font-size:.75rem;${extraStyle}">${label}</button>`;
}

function accionesHTML(r) {
  const acciones = (NEXT_STATE_BUTTONS[r.estado] || [])
    .map(b => btnHTML(r.id, b.label, `estado:${b.estado}`, b.style))
    .join(' ');
  const cancelar = (r.estado !== 'cancelada' && r.estado !== 'checkout')
    ? btnHTML(r.id, 'Cancelar', 'cancelar', 'color:#b00')
    : '';
  return `<div style="display:flex;gap:6px;flex-wrap:wrap">${acciones} ${cancelar}</div>`;
}

async function handleReservaAction(id, action) {
  if (action === 'cancelar') {
    if (!confirm('¿Cancelar esta reserva?')) return;
    await API.reservas.cancelar(id);
  } else if (action.startsWith('estado:')) {
    const estado = action.split(':')[1];
    await API.reservas.actualizar(id, { estado });
  }
  await Promise.all([cargarReservasAdmin(), cargarDashboard()]);
}

function fmtFecha(s) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

async function cargarReservasAdmin() {
  const tbody = document.getElementById('tabla-reservas-body');
  if (!tbody || !window.API) return;
  try {
    const reservas = await API.reservas.listar();
    if (!reservas.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px">Sin reservas aún</td></tr>';
      return;
    }
    tbody.innerHTML = reservas.map(r => `
      <tr data-status="${r.estado}">
        <td class="ref">RDL-${String(r.id).padStart(3, '0')}</td>
        <td>
          <div class="guest-name">${r.huesped?.nombre || ''} ${r.huesped?.apellido || ''}</div>
          <div class="guest-origin">${r.huesped?.email || ''}</div>
        </td>
        <td>${r.habitacion?.titulo || '—'}</td>
        <td>${fmtFecha(r.checkIn)}</td>
        <td>${fmtFecha(r.checkOut)}</td>
        <td>${r.cantidadDePersonas}</td>
        <td>${BADGE[r.estado] || r.estado}</td>
        <td>${accionesHTML(r)}</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id, 10);
        const action = btn.dataset.action;
        btn.disabled = true;
        try {
          await handleReservaAction(id, action);
        } catch (err) {
          alert('Error: ' + err.message);
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:#b00">Error: ${err.message}</td></tr>`;
  }
}

let _habitacionesCache = [];

async function cargarHabitacionesAdmin() {
  const grid = document.getElementById('roomsAdminGrid');
  if (!grid || !window.API) return;
  try {
    const habitaciones = await API.habitaciones.listar();
    _habitacionesCache = habitaciones;
    if (!habitaciones.length) {
      grid.innerHTML = '<p style="padding:24px">Sin habitaciones cargadas.</p>';
      return;
    }
    grid.innerHTML = habitaciones.map((h, i) => `
      <div class="room-admin-card">
        <div class="room-admin-thumb${i % 3 === 1 ? ' v2' : i % 3 === 2 ? ' v3' : ''}">
          <div class="room-admin-thumb-badge">
            <span class="adm-badge adm-badge-ok">${h.tipo === 'suite' ? 'Suite' : 'Estándar'}</span>
          </div>
        </div>
        <div class="room-admin-body">
          <div class="room-admin-name">${h.titulo}</div>
          <div class="room-admin-type">N° ${h.numero} · ${h.capacidadMaxima} personas${h.tieneBalcon ? ' · Balcón' : ''}</div>
          <div class="room-admin-meta">
            <div class="room-admin-price">$${Number(h.precioPorNoche).toFixed(0)} <span>/ noche</span></div>
            <button class="btn-ghost" data-edit-room="${h.id}">Editar</button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-edit-room]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.editRoom, 10);
        const hab = _habitacionesCache.find(x => x.id === id);
        if (hab) openRoomModal(hab);
      });
    });
  } catch (err) {
    grid.innerHTML = `<p style="padding:24px;color:#b00">Error: ${err.message}</p>`;
  }
}

async function cargarHuespedesAdmin() {
  const tbody = document.getElementById('tabla-huespedes-body');
  if (!tbody || !window.API) return;
  try {
    const huespedes = await API.huespedes.listar();
    if (!huespedes.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px">Sin huéspedes registrados</td></tr>';
      return;
    }
    tbody.innerHTML = huespedes.map((h, i) => `
      <tr data-status="all">
        <td><span class="guest-avatar">${i + 1}</span>${h.nombre} ${h.apellido}</td>
        <td>${h.email}</td>
        <td>—</td>
        <td>${h.reservas?.length || 0}</td>
        <td><span class="adm-badge adm-badge-ok">Registrado</span></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#b00">Error: ${err.message}</td></tr>`;
  }
}

function hoyISO() {
  return new Date().toISOString().split('T')[0];
}

function inicioDeSemanaISO() {
  const d = new Date();
  const dia = d.getDay();
  const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

function finDeSemanaISO() {
  const d = new Date();
  const dia = d.getDay();
  const diff = d.getDate() - dia + (dia === 0 ? 0 : 7);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

async function cargarDashboard() {
  if (!window.API) return;
  try {
    const [reservas, habitaciones] = await Promise.all([
      API.reservas.listar(),
      API.habitaciones.listar(),
    ]);

    const hoy = hoyISO();
    const inicioSem = inicioDeSemanaISO();
    const finSem = finDeSemanaISO();

    const activas = reservas.filter(r =>
      r.estado !== 'cancelada' && r.estado !== 'checkout' && r.checkOut >= hoy
    );
    const checkinsHoy = activas.filter(r => r.checkIn === hoy);
    const entradasSemana = activas.filter(r => r.checkIn >= inicioSem && r.checkIn <= finSem);

    const idsOcupadasHoy = new Set(
      activas.filter(r => r.checkIn <= hoy && r.checkOut > hoy).map(r => r.idHabitacion)
    );
    const habitacionesDisponiblesHoy = habitaciones.filter(h => !idsOcupadasHoy.has(h.id));

    // KPI 1: Reservas activas
    document.getElementById('kpiReservasActivas').textContent = activas.length;
    document.getElementById('kpiReservasNote').textContent =
      `${entradasSemana.length} con entrada esta semana`;

    // KPI 2: Check-ins hoy
    document.getElementById('kpiCheckinsHoy').textContent = checkinsHoy.length;
    const nombresHoy = checkinsHoy
      .slice(0, 3)
      .map(r => r.huesped?.nombre || 'Huésped')
      .join(' · ');
    document.getElementById('kpiCheckinsNote').textContent =
      nombresHoy || 'Sin entradas hoy';

    // KPI 3: Habitaciones disponibles
    document.getElementById('kpiHabDisponibles').innerHTML =
      `${habitacionesDisponiblesHoy.length} <span class="kpi-value-unit">de ${habitaciones.length}</span>`;
    document.getElementById('kpiHabNote').textContent =
      habitacionesDisponiblesHoy.slice(0, 3).map(h => h.titulo.split(' ').slice(-1)[0]).join(' · ') || '—';

    // Próximas reservas (5 más cercanas, no canceladas, desde hoy)
    const proximas = activas
      .filter(r => r.checkIn >= hoy)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
      .slice(0, 5);

    const proxBody = document.getElementById('dashProximasBody');
    if (proximas.length === 0) {
      proxBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px">Sin reservas próximas</td></tr>';
    } else {
      proxBody.innerHTML = proximas.map(r => {
        const esHoy = r.checkIn === hoy;
        const badge = esHoy
          ? '<span class="adm-badge adm-badge-active">Hoy</span>'
          : (BADGE[r.estado] || r.estado);
        return `
          <tr data-status="${r.estado}">
            <td>
              <div class="guest-name">${r.huesped?.nombre || ''} ${r.huesped?.apellido || ''}</div>
              <div class="guest-origin">${r.huesped?.email || ''}</div>
            </td>
            <td>${r.habitacion?.titulo || '—'}</td>
            <td>${fmtFecha(r.checkIn)}–${fmtFecha(r.checkOut)}</td>
            <td>${badge}</td>
          </tr>
        `;
      }).join('');
    }

    // Estado de habitaciones
    const estadoCont = document.getElementById('dashEstadoHabitaciones');
    if (habitaciones.length === 0) {
      estadoCont.innerHTML = '<div style="padding:24px;text-align:center">Sin habitaciones</div>';
    } else {
      estadoCont.innerHTML = habitaciones.map(h => {
        const reservaActiva = activas.find(
          r => r.idHabitacion === h.id && r.checkIn <= hoy && r.checkOut > hoy
        );
        const proximaEntrada = activas
          .filter(r => r.idHabitacion === h.id && r.checkIn > hoy)
          .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];

        const ocupada = !!reservaActiva;
        let info;
        if (ocupada) {
          info = `Ocupada hasta el ${fmtFecha(reservaActiva.checkOut)}`;
        } else if (proximaEntrada) {
          info = `Entrada el ${fmtFecha(proximaEntrada.checkIn)}`;
        } else {
          info = 'Sin reservas próximas';
        }

        const badge = ocupada
          ? '<span class="adm-badge adm-badge-active">Ocupada</span>'
          : '<span class="adm-badge adm-badge-ok">Disponible</span>';

        return `
          <div class="occ-item">
            <div class="occ-num">${String(h.numero).padStart(2, '0')}</div>
            <div class="occ-info">
              <div class="occ-name">${h.titulo}</div>
              <div class="occ-dates">${info}</div>
            </div>
            ${badge}
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    document.getElementById('kpiReservasNote').textContent = `Error: ${err.message}`;
  }
}

function cargarTodosLosDatos() {
  cargarDashboard();
  cargarReservasAdmin();
  cargarHabitacionesAdmin();
  cargarHuespedesAdmin();
}