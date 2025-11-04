// frontend/src/shared/utils/apiHelpers.js

const API_BASE_URL = (() => {
  const isTunnelAccess = window.location.hostname.includes('trycloudflare.com');
  if (isTunnelAccess) {
    return import.meta.env.VITE_API_TUNNEL_URL;
  }
  
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }
  
  // Em produção (Vercel), usa o próprio domínio
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback para desenvolvimento
  return "http://localhost:4001";
})();

export function montarUrl(endpoint, params = {}) {
  let baseUrl = API_BASE_URL;
  
  // Se baseUrl já termina com '/' e endpoint começa com '/', remove uma barra
  if (baseUrl.endsWith('/') && endpoint.startsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  // Se baseUrl não termina com '/' e endpoint não começa com '/', adiciona uma barra
  else if (!baseUrl.endsWith('/') && !endpoint.startsWith('/')) {
    baseUrl += '/';
  }
  
  const fullUrl = `${baseUrl}${endpoint}`;
  const url = new URL(fullUrl);
  
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
  console.error('Erro ao buscar dados:', error);
  
  // Log adicional para debug
  if (error.message?.includes('Invalid URL')) {
    console.error('Debug - API_BASE_URL:', API_BASE_URL);
    console.error('Debug - VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    console.error('Debug - window.location.origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A');
  }
}

export function obterDataDeHoje() {
  return new Date().toISOString().split('T')[0];
}

export function obterDataDeOntem() {
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return ontem.toISOString().split('T')[0];
}