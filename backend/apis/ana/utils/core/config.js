/**
 * @file backend/apis/ana/utils/config.js
 * @description Módulo de configurações globais da aplicação. Contém constantes e parâmetros que afetam o comportamento do mapa, camadas, marcadores, telemetria, cache e aparência.
 *
 * @license MIT
 * © 2025 Sistema de Monitoramento Hidrometeorológico
 *
 * @summary Este módulo:
 * - Define endpoints e URLs padrão
 * - Organiza parâmetros usados em módulos de mapa, controle, marcadores e estatísticas
 * 
 * @see 
 * Todos os objetos exportados deste arquivo são utilizados para centralizar configurações e facilitar manutenção.
 */

/**
 * Detecta ambiente e define API_BASE de forma flexível.
 *
 * Determina a URL base da API conforme o ambiente de execução:
 * - Se estiver em ambiente Node.js e existir a variável de ambiente API_BASE, utiliza esse valor.
 * - Se estiver em ambiente browser, utiliza o origin da janela.
 * - Caso contrário, utiliza 'http://localhost:4001' como padrão.
 *
 * @type {string}
 *
 * @example
 * // Usado para compor endpoints dinâmicos:
 * const url = `${API_BASE}/api/stationData/estacoes/todas`;
 */
const API_BASE =
  typeof process !== 'undefined' && process.env.API_BASE
    ? process.env.API_BASE
    : (typeof window !== 'undefined' && window.location.origin)
      ? window.location.origin
      : 'http://localhost:4001';

/**
 * Configurações gerais da aplicação, incluindo URLs, chaves e datas.
 *
 * Define parâmetros globais utilizados em toda a aplicação, como cores, limites de texto,
 * valores inválidos, endpoints de dados, datas de referência, URLs de proxy, geocodificação,
 * APIs externas e funções utilitárias para construção de endpoints dinâmicos.
 *
 * @type {Object}
 * @property {string} MARKER_COLOR                - Cor padrão dos marcadores no mapa.
 * @property {number} MARKER_TEXT_LENGTH          - Tamanho máximo do texto exibido nos marcadores.
 * @property {string} INVALID_VALUE               - Valor utilizado para dados inválidos ou ausentes.
 * @property {string} DATA_SOURCE                 - Endpoint para consulta de todas as estações.
 * @property {string} DATA_SOURCE_HISTORICO       - Endpoint para consulta de histórico das estações.
 * @property {string} DATA_SOURCE_CHUVA_POR_CIDADE- Endpoint para consulta de chuva por cidade.
 * @property {string} DATA_SOURCE_CATEGORIZADAS   - Endpoint para consulta de estações categorizadas.
 * @property {string} TELEMETRIC_DATE             - Data de referência para telemetria (formato ISO, fuso horário SP).
 * @property {string} TILE_PROXY_URL              - URL do proxy para tiles de imagens.
 * @property {string} GEOCODE_ENDPOINT            - Endpoint para serviço de geocodificação.
 * @property {string} REAL_EARTH_API_URL          - URL da API externa RealEarth.
 * @property {string} FIRMS_ENDPOINT_BASE         - Endpoint base para dados FIRMS.
 * @property {function} FIRMS_ENDPOINT_LOCAL      - Função utilitária para construir endpoint FIRMS local.
 * @param   {string} sensor                       - Nome do sensor FIRMS.
 * @param   {string} dateStr                      - Data no formato 'YYYY-MM-DD'.
 * @returns {string}                              - Endpoint FIRMS local para o sensor e data informados.
 *
 * @example
 * // Obter endpoint de histórico:
 * const url = DEFAULT_CONFIG.DATA_SOURCE_HISTORICO;
 * // Construir endpoint FIRMS local:
 * const endpoint = DEFAULT_CONFIG.FIRMS_ENDPOINT_LOCAL('MODIS', '2025-07-13');
 */
export const DEFAULT_CONFIG = {
  MARKER_COLOR: '#8c8eb6',
  MARKER_TEXT_LENGTH: 12,
  INVALID_VALUE: 'N/A',
  DATA_SOURCE: `${API_BASE}/api/stationData/estacoes/todas`,
  DATA_SOURCE_HISTORICO: `${API_BASE}/api/stationData/estacoes/historico`,
  DATA_SOURCE_CHUVA_POR_CIDADE: `${API_BASE}/api/stationData/estacoes/chuvaPorCidade`,
  DATA_SOURCE_CATEGORIZADAS: `${API_BASE}/api/stationData/estacoes/categorizadas`,
  TELEMETRIC_DATE: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }),
  TILE_PROXY_URL: `${API_BASE}/proxy/image`,
  GEOCODE_ENDPOINT: `${API_BASE}/api/geocode`,
  REAL_EARTH_API_URL: 'https://realearth.ssec.wisc.edu/api/times',
  FIRMS_ENDPOINT_BASE: `${API_BASE}/api/firms`,
  FIRMS_ENDPOINT_LOCAL: (sensor, dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${API_BASE}/api/firms/${year}/${month}/${day}/${sensor}`;
  }
};

/**
 * Configuração da matriz de tiles do estado de Mato Grosso por nível de zoom.
 *
 * Define os intervalos de coordenadas X e Y para os tiles do mapa do estado de Mato Grosso,
 * organizados por diferentes níveis de zoom. Utilizado para limitar e otimizar o carregamento de tiles
 * em visualizações específicas do estado.
 *
 * @type {Object}
 * @property {Object} 5 - Configuração para zoom nível 5.
 * @property {Array<number>} xRange - Intervalo de coordenadas X.
 * @property {Array<number>} yRange - Intervalo de coordenadas Y.
 * @property {Object} 6 - Configuração para zoom nível 6.
 * @property {Array<number>} xRange - Intervalo de coordenadas X.
 * @property {Array<number>} yRange - Intervalo de coordenadas Y.
 * @property {Object} 7 - Configuração para zoom nível 7.
 * @property {Array<number>} xRange - Intervalo de coordenadas X.
 * @property {Array<number>} yRange - Intervalo de coordenadas Y.
 * @property {Object} 8 - Configuração para zoom nível 8.
 * @property {Array<number>} xRange - Intervalo de coordenadas X.
 * @property {Array<number>} yRange - Intervalo de coordenadas Y.
 *
 * @example
 * // Obter intervalo de X para zoom 6:
 * const xRange = TILE_GRID_MT_ZOOMS[6].xRange;
 */
export const TILE_GRID_MT_ZOOMS = {
  5: { xRange: [10, 11], yRange: [16, 17] },
  6: { xRange: [20, 23], yRange: [33, 35] },
  7: { xRange: [41, 46], yRange: [66, 70] },
  8: { xRange: [82, 92], yRange: [133, 141] }
};

/**
 * Configuração de cache por módulo.
 *
 * Define os parâmetros de cache utilizados em diferentes módulos da aplicação,
 * incluindo tempo de vida (TTL) em milissegundos e ativação do cache para geocodificação.
 *
 * @type {Object}
 * @property {Object} GEOCODING - Configuração de cache para geocodificação.
 * @property {boolean} ENABLED - Indica se o cache está ativado para geocodificação.
 * @property {number} TTL - Tempo de vida do cache em milissegundos.
 * @property {Object} ESTATISTICAS - Configuração de cache para estatísticas.
 * @property {number} TTL - Tempo de vida do cache em milissegundos.
 * @property {Object} STATIONS - Configuração de cache para dados de estações.
 * @property {number} TTL - Tempo de vida do cache em milissegundos.
 * @property {Object} TIMESTAMPS - Configuração de cache para timestamps.
 * @property {number} TTL - Tempo de vida do cache em milissegundos.
 *
 * @example
 * // Exemplo de uso:
 * if (CACHE_CONFIG.GEOCODING.ENABLED) { usar cache de geocodificação }
 * const ttlEstatisticas = CACHE_CONFIG.ESTATISTICAS.TTL;
 */
export const CACHE_CONFIG = {
  GEOCODING: { ENABLED: true, TTL: 1 * 60 * 1000 },
  ESTATISTICAS: { TTL: 1 * 60 * 1000 },
  STATIONS: { TTL: 1 * 60 * 1000 },
  TIMESTAMPS: { TTL: 15 * 60 * 1000 }
};

/**
 * Parâmetros visuais e de atualização do mapa.
 *
 * Define os parâmetros principais para exibição e atualização do mapa na interface,
 * incluindo o ID do elemento HTML, intervalos de atualização automática e delays para eventos de configuração e marcadores.
 *
 * @type {Object}
 * @property {string} MAP_ELEMENT_ID - ID do elemento HTML onde o mapa será renderizado.
 * @property {number} REFRESH_INTERVAL_MS - Intervalo (ms) para atualização automática do mapa.
 * @property {number} CONFIG_EVENT_DELAY_MS - Delay (ms) para eventos de configuração do mapa.
 * @property {number} MARKER_UPDATE_INTERVAL_MS - Intervalo (ms) para atualização dos marcadores do mapa.
 *
 * @example
 * // Exemplo de uso:
 * setInterval(refreshMap, APP_CONFIG.REFRESH_INTERVAL_MS);
 * document.getElementById(APP_CONFIG.MAP_ELEMENT_ID);
 */
export const APP_CONFIG = {
  MAP_ELEMENT_ID: 'map',
  REFRESH_INTERVAL_MS: 40_000,
  CONFIG_EVENT_DELAY_MS: 1000,
  MARKER_UPDATE_INTERVAL_MS: 20_000
};

/**
 * Prefixos utilizados para classificar estações e dados.
 *
 * Define os prefixos e parâmetros usados para categorizar estações hidrometeorológicas e seus dados,
 * além do tamanho padrão de lote para processamento e a classificação padrão utilizada em casos indefinidos.
 *
 * @type {Object}
 * @property {Object} PREFIXES - Prefixos para cada tipo de dado ou status.
 *   @property {string} chuva - Prefixo para dados de chuva ("Chuva").
 *   @property {string} nivel - Prefixo para dados de nível ("Nível").
 *   @property {string} vazao - Prefixo para dados de vazão ("Vazão").
 *   @property {string} rio - Prefixo para dados de rio ("Rio").
 *   @property {string} statusAtualizado - Prefixo para status atualizado ("Status - Atualizado").
 *   @property {string} statusDesatualizado - Prefixo para status desatualizado ("Status - Desatualizado").
 * @property {number} BATCH_SIZE - Tamanho padrão do lote para processamento de dados.
 * @property {string} DEFAULT_CLASSIFICATION - Classificação padrão utilizada quando não há definição.
 *
 * @example
 * // Exemplo de uso:
 * const prefixoChuva = CLASSIFICATION_CONFIG.PREFIXES.chuva; // "Chuva"
 * const lote = CLASSIFICATION_CONFIG.BATCH_SIZE; // 260
 */
export const CLASSIFICATION_CONFIG = {
  PREFIXES: {
    chuva: "Chuva",
    nivel: "Nível",
    vazao: "Vazão",
    rio: "Rio",
    statusAtualizado: "Status - Atualizado",
    statusDesatualizado: "Status - Desatualizado"
  },
  BATCH_SIZE: 260,
  DEFAULT_CLASSIFICATION: "Indefinido"
};

/**
 * Controle de debounce e eventos relacionados a marcadores.
 *
 * Define o tempo de espera (em milissegundos) para o debounce de eventos de atualização dos marcadores no mapa,
 * evitando múltiplas execuções seguidas e melhorando a performance da interface.
 *
 * @type {Object}
 * @property {number} DEBOUNCE_DELAY_MS - Delay em milissegundos para o debounce de eventos de marcadores.
 *
 * @example
 * // Exemplo de uso:
 * setTimeout(updateMarkers, MAP_MARKERS_CONFIG.DEBOUNCE_DELAY_MS);
 */
export const MAP_MARKERS_CONFIG = {
  DEBOUNCE_DELAY_MS: 100
};

/**
 * Parâmetros para classificar chuva, nível e vazão com base em limiares definidos.
 *
 * Define as categorias e limiares utilizados para classificar os dados hidrometeorológicos das estações,
 * incluindo chuva, nível e vazão, além de parâmetros de acumulação e atualização.
 *
 * @type {Object}
 * @property {Object} RAINFALL - Classificação de chuva.
 * @property {string} undefined - Categoria para valor indefinido.
 * @property {string} noRain - Categoria para ausência de chuva.
 * @property {string} weak - Categoria para chuva fraca.
 * @property {string} moderate - Categoria para chuva moderada.
 * @property {string} strong - Categoria para chuva forte.
 * @property {string} veryStrong - Categoria para chuva muito forte.
 * @property {string} extreme - Categoria para chuva extrema.
 * @property {Object} thresholds - Limiares para cada categoria de chuva.
 * @property {number} weak - Limite inferior para chuva fraca (mm).
 * @property {number} moderate - Limite inferior para chuva moderada (mm).
 * @property {number} strong - Limite inferior para chuva forte (mm).
 * @property {number} veryStrong - Limite inferior para chuva muito forte (mm).
 * @property {Object} LEVEL - Classificação de nível.
 * @property {string} undefined - Categoria para valor indefinido.
 * @property {string} low - Categoria para nível baixo.
 * @property {string} normal - Categoria para nível normal.
 * @property {string} high - Categoria para nível alto.
 * @property {Object} thresholds - Limiares para cada categoria de nível.
 * @property {number} low - Limite inferior para nível baixo (cm).
 * @property {number} normal - Limite inferior para nível normal (cm).
 * @property {Object} DISCHARGE - Classificação de vazão.
 * @property {string} undefined - Categoria para valor indefinido.
 * @property {string} low - Categoria para vazão baixa.
 * @property {string} normal - Categoria para vazão normal.
 * @property {string} high - Categoria para vazão alta.
 * @property {Object} thresholds - Limiares para cada categoria de vazão.
 * @property {number} low - Limite inferior para vazão baixa (m³/s).
 * @property {number} normal - Limite inferior para vazão normal (m³/s).
 * @property {number} RAINFALL_ACCUMULATION_PERIOD_HOURS - Período de acumulação de chuva em horas.
 * @property {number} UPDATE_THRESHOLD_HOURS - Intervalo máximo de atualização dos dados em horas.
 *
 * @example
 * // Classificar chuva:
 * if (rainValue >= STATION_CLASSIFICATION_CONFIG.RAINFALL.thresholds.strong) {
 *   categoria = STATION_CLASSIFICATION_CONFIG.RAINFALL.strong;
 * }
 */
export const STATION_CLASSIFICATION_CONFIG = {
  RAINFALL: {
    undefined: "Indefinido",
    noRain: "Sem Chuva",
    weak: "Fraca",
    moderate: "Moderada",
    strong: "Forte",
    veryStrong: "Muito Forte",
    extreme: "Extrema",
    thresholds: { weak: 5, moderate: 29, strong: 59, veryStrong: 99 }
  },
  LEVEL: {
    undefined: "Indefinido",
    low: "Baixo",
    normal: "Normal",
    high: "Alto",
    thresholds: { low: 400, normal: 450 }
  },
  DISCHARGE: {
    undefined: "Indefinido",
    low: "Baixa",
    normal: "Normal",
    high: "Alta",
    thresholds: { low: 30, normal: 35 }
  },
  RAINFALL_ACCUMULATION_PERIOD_HOURS: 24,
  UPDATE_THRESHOLD_HOURS: 12
};

/**
 * Estilo padrão e por categoria dos marcadores do mapa.
 *
 * Define os estilos visuais dos marcadores exibidos no mapa, incluindo cor, tamanho, e cor do texto,
 * tanto para o estilo geral quanto para cada categoria de dado hidrometeorológico (chuva, nível, vazão).
 * Permite personalizar a aparência dos marcadores conforme a classificação dos dados.
 *
 * @type {Object}
 * @property {Object} general - Estilo padrão para todos os marcadores.
 * @property {string} color - Cor do marcador.
 * @property {number} sizeMultiplier - Multiplicador de tamanho do marcador.
 * @property {number} baseSize - Tamanho base do marcador.
 * @property {string} textColor - Cor do texto exibido no marcador.
 * @property {Object} chuva - Estilos para marcadores de chuva por categoria.
 * @property {Object} Indefinido - Estilo para chuva indefinida.
 * @property {Object} Sem Chuva - Estilo para ausência de chuva.
 * @property {Object} Fraca - Estilo para chuva fraca.
 * @property {Object} Moderada - Estilo para chuva moderada.
 * @property {Object} Forte - Estilo para chuva forte.
 * @property {Object} Muito Forte - Estilo para chuva muito forte.
 * @property {Object} Extrema - Estilo para chuva extrema.
 * @property {Object} default - Estilo padrão para chuva.
 * @property {Object} nivel - Estilos para marcadores de nível por categoria.
 * @property {Object} Indefinido - Estilo para nível indefinido.
 * @property {Object} Baixo - Estilo para nível baixo.
 * @property {Object} Normal - Estilo para nível normal.
 * @property {Object} Alto - Estilo para nível alto.
 * @property {Object} default - Estilo padrão para nível.
 * @property {Object} vazao - Estilos para marcadores de vazão por categoria.
 * @property {Object} Indefinido - Estilo para vazão indefinida.
 * @property {Object} Baixa - Estilo para vazão baixa.
 * @property {Object} Normal - Estilo para vazão normal.
 * @property {Object} Alta - Estilo para vazão alta.
 * @property {Object} default - Estilo padrão para vazão.
 *
 * @example
 * // Obter cor do marcador de chuva forte:
 * const cor = MARKER_STYLE_CONFIG.chuva["Forte"].color;
 * // Obter tamanho base do marcador geral:
 * const base = MARKER_STYLE_CONFIG.general.baseSize;
 */
export const MARKER_STYLE_CONFIG = {
  general: {
    color: "#FFFFFF", sizeMultiplier: 0.4, baseSize: 30, textColor: "#000000"
  },
  chuva: {
    "Indefinido": { color: "#CCCCCC", sizeMultiplier: 0.3, textColor: "#000000" },
    "Sem Chuva": { color: "#AAAAAA", sizeMultiplier: 0.3, textColor: "#000000" },
    "Fraca": { color: "#1BBA1B", sizeMultiplier: 0.35, textColor: "#FFFFFF" },
    "Moderada": { color: "#FFFF00", sizeMultiplier: 0.4, textColor: "#000000" },
    "Forte": { color: "#FFA500", sizeMultiplier: 0.5, textColor: "#FFFFFF" },
    "Muito Forte": { color: "#FF0000", sizeMultiplier: 0.55, textColor: "#FFFFFF" },
    "Extrema": { color: "#27046b", sizeMultiplier: 0.65, textColor: "#FFFFFF" },
    default: { color: "#FFFFFF", sizeMultiplier: 0.4, textColor: "#000000" }
  },
  nivel: {
    "Indefinido": { color: "#CCCCCC", sizeMultiplier: 0.65, textColor: "#FFFFFF" },
    "Baixo": { color: "#00FFFF", sizeMultiplier: 0.7, textColor: "#000000" },
    "Normal": { color: "#00AAFF", sizeMultiplier: 0.75, textColor: "#000000" },
    "Alto": { color: "#0000FF", sizeMultiplier: 0.9, textColor: "#FFFFFF" },
    default: { color: "#FFFFFF", sizeMultiplier: 0.65, textColor: "#000000" }
  },
  vazao: {
    "Indefinido": { color: "#CCCCCC", sizeMultiplier: 0.65, textColor: "#FFFFFF" },
    "Baixa": { color: "#FF00FF", sizeMultiplier: 0.7, textColor: "#000000" },
    "Normal": { color: "#FFAA00", sizeMultiplier: 0.75, textColor: "#000000" },
    "Alta": { color: "#C62E2E", sizeMultiplier: 0.8, textColor: "#FFFFFF" },
    default: { color: "#FFFFFF", sizeMultiplier: 0.65, textColor: "#000000" }
  }
};

/**
 * Layout de popup flutuante sobre o mapa.
 *
 * Define os parâmetros de exibição do popup flutuante utilizado para mostrar dados hidrometeorológicos
 * diretamente sobre o mapa, incluindo rótulos, unidades, offsets de posição e intervalo de atualização.
 *
 * @type {Object}
 * @property {Object} labels - Rótulos exibidos para cada tipo de dado.
 * @property {string} level - Rótulo para nível ("Nível").
 * @property {string} discharge - Rótulo para vazão ("Vazão").
 * @property {string} rainfall - Rótulo para chuva ("Chuva").
 * @property {Object} units - Unidades de medida para cada tipo de dado.
 * @property {string} level - Unidade para nível ("cm").
 * @property {string} discharge - Unidade para vazão ("m³/s").
 * @property {string} rainfall - Unidade para chuva ("mm").
 * @property {Object} positionOffsets - Offsets de posição do popup para cada tipo de dado.
 * @property {Object} level - Offset para popup de nível ({ left: -85, top: -10 }).
 * @property {Object} discharge - Offset para popup de vazão ({ left: -50, top: 50 }).
 * @property {Object} rainfall - Offset para popup de chuva ({ left: 47, top: -10 }).
 * @property {number} updateInterval - Intervalo de atualização do popup em milissegundos.
 *
 * @example
 * // Exemplo de uso:
 * const label = FLOATING_POPUP_CONFIG.labels.level; // "Nível"
 * const unit = FLOATING_POPUP_CONFIG.units.rainfall; // "mm"
 * const offset = FLOATING_POPUP_CONFIG.positionOffsets.discharge; // { left: -50, top: 50 }
 */
export const FLOATING_POPUP_CONFIG = {
  labels: {
    level: "Nível", discharge: "Vazão", rainfall: "Chuva"
  },
  units: {
    level: "cm", discharge: "m³/s", rainfall: "mm"
  },
  positionOffsets: {
    level: { left: -85, top: -10 },
    discharge: { left: -50, top: 50 },
    rainfall: { left: 47, top: -10 }
  },
  updateInterval: 5000
};

/**
 * Tempo de espera antes de carregar o gráfico de estatísticas.
 *
 * Define o delay (em milissegundos) utilizado para aguardar antes de iniciar o carregamento dos gráficos estatísticos,
 * garantindo que os dados estejam prontos e a interface não fique sobrecarregada.
 *
 * @type {number}
 * @default 100
 *
 * @example
 * setTimeout(renderStatChart, STAT_CHART_DELAY_MS);
 */
export const STAT_CHART_DELAY_MS = 100;

/**
 * Delay para renderização do MathJax (caso usado).
 *
 * Define o tempo de espera (em milissegundos) antes de disparar a renderização de fórmulas matemáticas via MathJax,
 * evitando conflitos de renderização e garantindo que o DOM esteja pronto.
 *
 * @type {number}
 * @default 100
 *
 * @example
 * setTimeout(() => MathJax.typesetPromise(), MATHJAX_RENDER_DELAY_MS);
 */
export const MATHJAX_RENDER_DELAY_MS = 100;

/**
 * IDs e estilo do modal de detalhes telemétricos.
 *
 * Define os identificadores dos elementos do modal de detalhes e o estilo do botão de fechar.
 * Utilizado para exibir e controlar o modal de informações detalhadas de estações telemétricas na interface.
 *
 * @type {Object}
 * @property {string} DETALHES_ID - ID do elemento modal principal de detalhes.
 * @property {string} DETALHES_CONTENT_ID - ID do conteúdo do modal de detalhes.
 * @property {string} DETALHES_CLOSE_ID - ID do botão de fechar o modal de detalhes.
 * @property {Object} CLOSE_STYLE - Estilo CSS aplicado ao botão de fechar do modal.
 * @property {string} position - Posição absoluta do botão.
 * @property {string} top - Distância do topo em pixels.
 * @property {string} right - Distância da direita em pixels.
 * @property {string} cursor - Tipo de cursor ao passar sobre o botão.
 * @property {string} fontSize - Tamanho da fonte do ícone de fechar.
 *
 * @example
 * document.getElementById(MODAL_CONFIG.DETALHES_ID).style.display = 'block';
 */
export const MODAL_CONFIG = {
  DETALHES_ID: 'modalDetalhes',
  DETALHES_CONTENT_ID: 'modalDetalhesContent',
  DETALHES_CLOSE_ID: 'modalDetalhesClose',
  CLOSE_STYLE: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    cursor: 'pointer',
    fontSize: '24px'
  }
};

/**
 * Configurações do modal de consulta telemétrica.
 *
 * Define os IDs dos elementos do modal, estilos do botão de fechar e intervalo padrão de consulta.
 * Utilizado para exibir e controlar o modal de informações telemétricas na interface.
 *
 * @type {Object}
 * @property {string} modalId - ID do elemento modal principal.
 * @property {string} modalContentId - ID do conteúdo do modal.
 * @property {string} modalTextId - ID do texto do modal.
 * @property {string} closeButtonId - ID do botão de fechar o modal.
 * @property {Object} closeButtonStyle - Estilo CSS aplicado ao botão de fechar.
 * @property {string} defaultInterval - Intervalo padrão de consulta (ex: '24h').
 *
 * @example
 * document.getElementById(TELEMETRIC_MODAL_CONFIG.modalId).style.display = 'block';
 */
export const TELEMETRIC_MODAL_CONFIG = {
  modalId: 'telemetric-modal',
  modalContentId: 'telemetric-modal-content',
  modalTextId: 'telemetricModalText',
  closeButtonId: 'closeTelemetricModal',
  closeButtonStyle: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    cursor: 'pointer',
    fontSize: '24px'
  },
  defaultInterval: '24h'
};

/**
 * IDs de canvas e cores de botões dos gráficos telemétricos.
 *
 * Define os identificadores dos elementos canvas e as cores dos botões para cada tipo de gráfico.
 * Utilizado para renderização e estilização dos gráficos de chuva, cota e vazão na interface.
 *
 * @type {Object}
 * @property {Object} CHUVA - Configuração para gráfico de chuva (canvasId, buttonColor).
 * @property {Object} COTA - Configuração para gráfico de cota (canvasId, buttonColor).
 * @property {Object} VAZAO - Configuração para gráfico de vazão (canvasId, buttonColor).
 *
 * @example
 * const canvasIdChuva = TELEMETRIC_CHART_CONFIG.CHUVA.canvasId;
 * const corBotaoCota = TELEMETRIC_CHART_CONFIG.COTA.buttonColor;
 */
export const TELEMETRIC_CHART_CONFIG = {
  CHUVA: { canvasId: 'chuvaChartCanvas', buttonColor: 'rgb(154 208 245)' },
  COTA: { canvasId: 'cotaChartCanvas', buttonColor: 'rgb(255 177 193)' },
  VAZAO: { canvasId: 'vazaoChartCanvas', buttonColor: 'rgb(165 223 223)' }
};

/**
 * Estilos visuais aplicados aos gráficos.
 *
 * Define cores de fundo e borda para os gráficos de chuva, cota e vazão.
 * Utilizado para padronizar a aparência dos gráficos exibidos na interface.
 *
 * @type {Object}
 * @property {Object} chuva - Estilo para gráfico de chuva (bgColor, borderColor).
 * @property {Object} cota - Estilo para gráfico de cota (bgColor, borderColor).
 * @property {Object} vazao - Estilo para gráfico de vazão (bgColor, borderColor).
 *
 * @example
 * const corFundoChuva = CHART_STYLES.chuva.bgColor;
 */
export const CHART_STYLES = {
  chuva: { bgColor: 'rgba(54, 162, 235, 0.5)', borderColor: 'rgba(54, 162, 235, 1)' },
  cota: { bgColor: 'rgba(255, 99, 132, 0.5)', borderColor: 'rgba(255, 99, 132, 1)' },
  vazao: { bgColor: 'rgba(75, 192, 192, 0.5)', borderColor: 'rgba(75, 192, 192, 1)' }
};

/**
 * Configurações visuais e de comportamento para os controles do mapa.
 *
 * Define parâmetros para sensibilidade de zoom, classes CSS dos controles,
 * configuração da escala e do modo tela cheia.
 *
 * Utilizado para personalizar a experiência do usuário nos controles do mapa Leaflet.
 *
 * @type {Object}
 * @property {Object} ZOOM_SENSITIVITY - Sensibilidade do zoom (mínimo, máximo, padrão).
 * @property {Object} CONTROL_CLASSES - Classes CSS para diferentes seções dos controles.
 * @property {Object} SCALE_CONTROL_CONFIG - Configuração do controle de escala do mapa.
 * @property {Object} FULLSCREEN_CONTROL_CONFIG - Configuração do controle de tela cheia.
 *
 * @example
 * // Uso típico:
 * L.control.scale(MAP_CONTROL_CONFIG.SCALE_CONTROL_CONFIG);
 * L.control.fullscreen(MAP_CONTROL_CONFIG.FULLSCREEN_CONTROL_CONFIG);
 */
export const MAP_CONTROL_CONFIG = {
  ZOOM_SENSITIVITY: {
    MIN: 60,
    MAX: 2000,
    DEFAULT: 450
  },
  CONTROL_CLASSES: {
    CONTAINER: 'custom-map-control leaflet-bar',
    HEADER: 'control-header',
    PANEL_DESCRIPTION: 'panel-description',
    EXPANDED_PANEL: 'expanded-panel',
    ZOOM_SECTION: 'zoom-sensitivity-section',
    DRAG_SECTION: 'drag-toggle-section'
  },
  SCALE_CONTROL_CONFIG: {
    position: 'bottomleft',
    metric: true,
    imperial: false,
    maxWidth: 90,
    updateWhenIdle: false
  },
  FULLSCREEN_CONTROL_CONFIG: {
    position: 'topright',
    title: 'Ver em tela cheia',
    titleCancel: 'Sair de tela cheia',
    forceSeparateButton: true,
    pseudoFullscreen: false,
    content: '<i class="fa fa-expand"></i>',
    enterIcon: '<i class="fa fa-compress"></i>',
    exitIcon: '<i class="fa fa-expand"></i>'
  }
};

/**
 * Ícones por tipo de arquivo para uso em camadas importadas.
 *
 * Define o caminho base dos ícones e o mapeamento entre tipos de arquivo e ícones específicos.
 * Utilizado para exibir ícones representativos em listas, menus ou camadas importadas no mapa.
 *
 * @type {Object}
 * @property {string} ICON_BASE_PATH - Caminho base para os ícones.
 * @property {Object} FILE_TYPE_ICONS - Mapeamento de tipos de arquivo para nomes de ícones.
 * @property {string} geojson - Ícone para arquivos GeoJSON.
 * @property {string} json - Ícone para arquivos JSON.
 * @property {string} kml - Ícone para arquivos KML.
 * @property {string} kmz - Ícone para arquivos KMZ.
 * @property {string} gpx - Ícone para arquivos GPX.
 * @property {string} default - Ícone padrão para tipos desconhecidos.
 *
 * @example
 * const iconPath = `${FILE_HANDLER_CONFIG.ICON_BASE_PATH}${FILE_HANDLER_CONFIG.FILE_TYPE_ICONS.geojson}`;
 */
export const FILE_HANDLER_CONFIG = {
  ICON_BASE_PATH: 'assets/icons/',
  FILE_TYPE_ICONS: {
    geojson: 'geojson.png',
    json: 'json_color_ii.png',
    kml: 'kml_color_ii.png',
    kmz: 'kmz_color_ii.png',
    gpx: 'gpx.png',
    default: 'default-file.png'
  }
};

/**
 * Parâmetros de inicialização e limitação do mapa.
 *
 * Define centro, zoom inicial, limites de zoom, controle de zoom, sensibilidade,
 * limites máximos de navegação e viscosidade das bordas do mapa.
 *
 * Utilizado para configurar o comportamento e restrições do mapa Leaflet na aplicação.
 *
 * @type {Object}
 * @property {Array<number>} center - Coordenadas [latitude, longitude] do centro inicial do mapa.
 * @property {number} zoom - Nível de zoom inicial.
 * @property {number} minZoom - Zoom mínimo permitido.
 * @property {number} maxZoom - Zoom máximo permitido.
 * @property {boolean} zoomControl - Exibe controles de zoom.
 * @property {number} zoomSnap - Sensibilidade do snap de zoom.
 * @property {number} zoomDelta - Sensibilidade do delta de zoom.
 * @property {Array<Array<number>>} maxBounds - Limites máximos de navegação do mapa [[latMin, lonMin], [latMax, lonMax]].
 * @property {number} maxBoundsViscosity - Viscosidade das bordas do mapa (impede navegação fora dos limites).
 *
 * @example
 * // Uso típico no Leaflet:
 * L.map('map', MAP_CONFIG);
 */
export const MAP_CONFIG = {
  center: [-12.6819, -56.9211],
  zoom: 6,
  minZoom: 2,
  maxZoom: 18,
  zoomControl: true,
  zoomSnap: 0.3,
  zoomDelta: 0.6,
  maxBounds: [
    [-89.9999, -179.9999],
    [89.9999, 179.9999]
  ],
  maxBoundsViscosity: 1.0
};