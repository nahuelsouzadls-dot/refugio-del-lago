/* ================================================================
   Hotel Refugio del Lago — auth.js
   Módulo de autenticación del panel de administración.
   Valida credenciales contra el backend y administra la sesión
   mediante sessionStorage (se limpia al cerrar la pestaña).
   Requiere que api.js haya sido cargado antes (window.API_BASE).
   ================================================================ */

'use strict';

const AUTH = (() => {
  const TOKEN_KEY = 'rdl_admin_token';

  /* Confirms with the server that the stored token is still valid.
     Clears a stale token (e.g. after a server restart) and returns false
     so the caller can fall back to the login screen. */
  async function verify() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const res = await fetch(`${window.API_BASE}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        sessionStorage.removeItem(TOKEN_KEY);
        return false;
      }
      return true;
    } catch {
      sessionStorage.removeItem(TOKEN_KEY);
      return false;
    }
  }

  async function login(username, password) {
    try {
      const res = await fetch(`${window.API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || 'Error de autenticación.' };
      sessionStorage.setItem(TOKEN_KEY, data.token);
      return { ok: true };
    } catch {
      return { ok: false, error: 'No se pudo conectar con el servidor.' };
    }
  }

  function logout() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    if (token) {
      fetch(`${window.API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }

  function isAuthenticated() {
    return !!sessionStorage.getItem(TOKEN_KEY);
  }

  return { verify, login, logout, isAuthenticated };
})();

window.AUTH = AUTH;
