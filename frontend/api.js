/* ================================================================
   Cliente API — Refugio del Lago
   ----------------------------------------------------------------
   PRODUCCIÓN: pegá la URL pública del backend de Railway acá abajo.
   Ej: 'https://api.refugiodellago.com'
       o 'https://back-refugio-production.up.railway.app'
   ================================================================ */
'use strict';

const PROD_API_URL = 'https://back-refugiodellago-production.up.railway.app';

window.API_BASE = window.API_BASE || (function () {
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  if (isLocal) {
    return 'http://localhost:3000/api';                // dev: backend en puerto 3000
  }

  if (PROD_API_URL) {
    return PROD_API_URL.replace(/\/$/, '') + '/api';   // Railway con URL configurada
  }

  return '/api';                                       // fallback: same-origin
})();

const API = {
  async _req(path, opts = {}) {
    const token = sessionStorage.getItem('rdl_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${window.API_BASE}${path}`, {
      ...opts,
      headers: { ...headers, ...(opts.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },
  habitaciones: {
    listar: () => API._req('/habitaciones'),
    disponibles: (checkIn, checkOut) =>
      API._req(`/habitaciones/disponibles?checkIn=${checkIn}&checkOut=${checkOut}`),
    crear: (data) => API._req('/habitaciones', { method: 'POST', body: JSON.stringify(data) }),
    actualizar: (id, data) => API._req(`/habitaciones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    eliminar: (id) => API._req(`/habitaciones/${id}`, { method: 'DELETE' }),
  },
  reservas: {
    listar: () => API._req('/reservas'),
    crear: (data) => API._req('/reservas', { method: 'POST', body: JSON.stringify(data) }),
    cancelar: (id) => API._req(`/reservas/${id}/cancelar`, { method: 'POST' }),
    actualizar: (id, data) => API._req(`/reservas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  huespedes: {
    listar: () => API._req('/huespedes'),
  },
};

window.API = API;
