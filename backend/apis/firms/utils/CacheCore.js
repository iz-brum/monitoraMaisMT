/**
 * 🎛️ CacheCore - Centralização dos caches internos
 * 
 * - Permite controle global (habilitar/desabilitar)
 * - Facilita debug e limpeza
 * - Evita duplicação de instâncias de cache
 */

// === CONFIGURAÇÃO DE TTLs ===
const TTL = {
  // Dados que mudam frequentemente
  PADRAO: 30 * 60 * 1000,    // 30 minutos
  STATS: 15 * 60 * 1000,    // 15 minutos (stats são recalculados frequentemente)

  // Dados de atualização periódica
  FIRMS: 3 * 60 * 60 * 1000, // 3 horas (ciclo FIRMS)

  // Dados quase estáticos
  LOCATION: 24 * 60 * 60 * 1000, // 24 horas (dados geográficos)
};

let cacheAtivo = true;

// == Estrutura interna com TTL ==
const resultadoCache = new Map();
const sensorCache = new Map();
const fireStatsCache = new Map();
const inFlightRequests = new Map();

// Cache de localização de focos
const locationCache = new Map();

// Cache de dados FIRMS
const firmsDataCache = new Map();

// Cache de dados Hidroweb
const hidrowebCache = new Map();

// Cache de dados do Dashboard
const dashboardCache = new Map();

// == Helpers de TTL ==

// == Funções Internas ==
function setComTTL(map, chave, dados, ttl = TTL.PADRAO) {
  const expiracao = Date.now() + ttl;
  map.set(chave, { dados, expiracao });
}

function getValido(map, chave) {
  if (!cacheAtivo) return null;

  const entry = map.get(chave);
  if (!entry) return null;

  if (entry.expiracao < Date.now()) {
    map.delete(chave); // limpa expirada
    return null;
  }

  return entry.dados;
}

// == Geradores de chave ==
function gerarChaveSensor(sensor, bbox, dayRange, date) {
  return JSON.stringify({ sensor, bbox, dayRange, date });
}

function gerarChaveResultado({ dayRange, date, timeRange }) {
  return JSON.stringify({ dayRange, date, timeRange });
}

function gerarChaveFireStats(query) {
  return JSON.stringify(query);
}

function gerarChaveLocalizacao(latitude, longitude) {
  return `${latitude},${longitude}`;
}

function gerarChaveFirmsData(date, dayRange = 1) {
  return `firms_${date}_${dayRange}`;
}

// == Controladores globais ==
function ativarCache() {
  cacheAtivo = true;
}
function desativarCache() {
  cacheAtivo = false;
}
function limparTodosCaches() {
  sensorCache.clear();
  resultadoCache.clear();
  inFlightRequests.clear();
  fireStatsCache.clear();
  locationCache.clear();
  firmsDataCache.clear();
}

// == Export ==
export const CacheCore = {
  // Estado global
  isAtivo: () => cacheAtivo,
  ativarCache,
  desativarCache,
  limparTodosCaches,

  // TTL
  setComTTL,
  getValido,

  // Chaves
  gerarChaveSensor,
  gerarChaveResultado,
  gerarChaveFireStats,
  gerarChaveLocalizacao,
  gerarChaveFirmsData,

  // Instâncias
  sensorCache,
  resultadoCache,
  inFlightRequests,
  fireStatsCache,
  locationCache,
  firmsDataCache,

  // Dados FIRMS
  setFirmsDataCache(date, dayRange, data) {
    const key = gerarChaveFirmsData(date, dayRange);
    setComTTL(firmsDataCache, key, data, TTL.FIRMS);
  },
  getFirmsDataCache(date, dayRange) {
    const key = gerarChaveFirmsData(date, dayRange);
    return getValido(firmsDataCache, key);
  },

  // Cache de localização
  setLocationCache(latitude, longitude, data) {
    const key = gerarChaveLocalizacao(latitude, longitude);
    setComTTL(locationCache, key, data, TTL.LOCATION);
  },
  getLocationCache(latitude, longitude) {
    const key = gerarChaveLocalizacao(latitude, longitude);
    return getValido(locationCache, key);
  },

  // Cache de estatísticas
  setStatsCache(query, data) {
    const key = gerarChaveFireStats(query);
    setComTTL(fireStatsCache, key, data, TTL.STATS);
  },
  getStatsCache(query) {
    const key = gerarChaveFireStats(query);
    return getValido(fireStatsCache, key);
  },

  // Cache do Hidroweb
  setHidrowebCache(key, value, ttlMs) {
    setComTTL(hidrowebCache, key, value, ttlMs);
  },
  getHidrowebCache(key) {
    return getValido(hidrowebCache, key);
  },

  // Cache do Dashboard ANA
  setDashboardCache(key, data, ttl) {
    setComTTL(dashboardCache, key, data, ttl);
  },
  getDashboardCache(key) {
    return getValido(dashboardCache, key);
  },

  // Instâncias de cache
  hidrowebCache,
  dashboardCache,
};
