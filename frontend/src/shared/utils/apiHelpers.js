// frontend/src/shared/utils/apiHelpers.js

const API_BASE_URL = (() => {
  const isTunnelAccess = window.location.hostname.includes('trycloudflare.com');
  if (isTunnelAccess) {
    return import.meta.env.VITE_API_TUNNEL_URL;
  }

  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Se VITE_API_BASE_URL é apenas "/" ou está vazio, usa o domínio atual
  if (!configuredBaseUrl || configuredBaseUrl === '/' || configuredBaseUrl === '') {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return "http://localhost:4001"; // Fallback para desenvolvimento
  }

  // Se é uma URL completa, usa ela
  if (configuredBaseUrl.startsWith('http')) {
    return configuredBaseUrl;
  }

  // Se é um path relativo, combina com o domínio atual
  if (typeof window !== 'undefined') {
    return window.location.origin + (configuredBaseUrl.startsWith('/') ? configuredBaseUrl : '/' + configuredBaseUrl);
  }

  return "http://localhost:4001";
})();

export function montarUrl(endpoint, params = {}) {
  try {
    let baseUrl = API_BASE_URL;

    // Normaliza as barras
    if (baseUrl.endsWith('/') && endpoint.startsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    } else if (!baseUrl.endsWith('/') && !endpoint.startsWith('/')) {
      baseUrl += '/';
    }

    const fullUrl = `${baseUrl}${endpoint}`;
    console.debug('montarUrl:', { baseUrl, endpoint, fullUrl }); // Debug temporário

    const url = new URL(fullUrl);

    Object.entries(params).forEach(([chave, valor]) => {
      if (valor != null) {
        url.searchParams.append(chave, valor);
      }
    });
    return url.toString();
  } catch (error) {
    console.error('Erro ao construir URL:', {
      baseUrl: API_BASE_URL,
      endpoint,
      fullUrl: `${API_BASE_URL}${endpoint}`,
      error: error.message
    });
    throw error;
  }
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