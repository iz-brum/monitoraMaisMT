// frontend/src/shared/utils/apiHelpers.js

const API_BASE_URL = (() => {
  const isTunnelAccess = window.location.hostname.includes('trycloudflare.com');
  return isTunnelAccess
    ? import.meta.env.VITE_API_TUNNEL_URL
    : (import.meta.env.VITE_API_BASE_URL || "http://localhost:4001");
})();

export function montarUrl(endpoint, params = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([chave, valor]) => {
    if (valor != null) {
      url.searchParams.append(chave, valor);
    }
  });
  return url.toString();
}

export async function buscarJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    let jsonResponse = null;
    try {
      jsonResponse = await res.json();
    } catch {
      // Se não for JSON, ignora
    }
    const error = new Error(`HTTP error! status: ${res.status}`);
    error.status = res.status;
    error.jsonResponse = jsonResponse;
    throw error;
  }
  return await res.json();
}

export function logErroFetch(error) {
  console.error('Erro ao buscar dados de focos:', error);
}

export function obterDataDeHoje() {
  return new Date().toISOString().split('T')[0];
}

export function obterDataDeOntem() {
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return ontem.toISOString().split('T')[0];
}