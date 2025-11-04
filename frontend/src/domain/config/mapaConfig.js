// /domain/config/mapaConfig.js

/**
 * MAPA_CONFIG
 * Centraliza todas as configurações de domínio visual, limites, estilos e parâmetros reutilizáveis do mapa.
 * Use SEMPRE estes parâmetros em componentes, hooks e serviços para facilitar manutenção e evolução.
 */

export const MAPA_CONFIG = {
    // ==========================
    // Limites e segurança
    // ==========================
    /** Número máximo de features exibidas por arquivo importado */
    LIMITE_FEATURES_IMPORT: 200,

    // ==========================
    // Labels e textos de UI
    // ==========================
    /** Label do grupo de camadas importadas (painel de layers) */
    // CAMADAS_IMPORTADAS_LABEL: "📁 Camadas Importadas",
    /** Label HTML (com estilo) para header de camadas importadas */
    CAMADAS_IMPORTADAS_LABEL_HTML: '<strong style="font-size: 14px">📁 Camadas Importadas</strong>',
    /** Texto do ícone de upload de arquivo */
    UPLOAD_ICON: "src/assets/imgs/iconesPersonalizados/import_file.png",
    /** Tooltip/title do botão de upload */
    UPLOAD_BTN_TITLE: "Importar arquivo georreferenciado",

    // ==========================
    // Arquivos suportados
    // ==========================
    /** Extensões de arquivos aceitos para upload */
    ACCEPTED_FILE_TYPES: '.geojson,.json,.kml,.kmz',

    // ==========================
    // Estilos de ícones e marcadores
    // ==========================
    /** Tamanho base dos ícones personalizados */
    BASE_ICON_SIZE: 34,
    /** Escala mínima/máxima do ícone de ponto (responsive) */
    ICON_SCALE_MIN: 1,
    ICON_SCALE_MAX: 2,

    /** Estilo padrão do marcador circular (fallback) */
    DEFAULT_MARKER_RADIUS: 4,
    DEFAULT_MARKER_COLOR: "#ff6600",
    DEFAULT_MARKER_STROKE: "#fff",
    DEFAULT_MARKER_WEIGHT: 0.5,
    DEFAULT_MARKER_OPACITY: 1,
    DEFAULT_MARKER_FILL_OPACITY: 0.7,

    // ==========================
    // Estilos de polígonos e linhas
    // ==========================
    DEFAULT_POLY_STROKE: "#000000",
    DEFAULT_POLY_WEIGHT: 1,
    DEFAULT_POLY_OPACITY: 1,
    DEFAULT_POLY_FILL: "#3388ff",
    DEFAULT_POLY_FILL_OPACITY: 0.1,

    // ==========================
    // Parâmetros visuais e timing
    // ==========================
    /** Delay em ms para inserção do header de overlays (para garantir renderização) */
    OVERLAY_HEADER_INSERT_DELAY: 50,

    // ==========================
    // Parâmetros visuais e funcionais de rotas (Leaflet Routing Machine)
    // ==========================

    /**
     * Paleta de cores para diferenciar os segmentos das rotas
     * (Cada cor será aplicada a um trecho entre dois waypoints)
     */
    SEGMENT_COLORS: [
        '#2196F3', // Azul
        '#4CAF50', // Verde
        '#FFC107', // Amarelo
        '#9C27B0', // Roxo
        '#FF5722', // Laranja
        '#E91E63', // Rosa
        '#00BCD4', // Ciano
        '#FF4081', // Rosa claro
        '#673AB7', // Roxo escuro
        '#795548'  // Marrom
    ],

    /** Espessura (em pixels) das linhas dos segmentos de rota */
    ROUTE_SEGMENT_WEIGHT: 7,

    /** Opacidade (0 a 1) das linhas dos segmentos de rota */
    ROUTE_SEGMENT_OPACITY: 0.8,

    /** Quantidade máxima de rotas alternativas exibidas pelo motor de rotas */
    NUMBER_OF_ROUTE_ALTERNATIVES: 3,

    /** Classe CSS padrão do container das instruções do roteiro */
    ROUTING_CONTAINER_CLASS: 'routing-container-embed',

    /**
     * Habilita/desabilita a exibição de rotas alternativas
     * (true para mostrar alternativas, false para esconder)
     */
    SHOW_ROUTE_ALTERNATIVES: true,

    /**
     * Habilita recalcular a rota enquanto o usuário arrasta os pontos
     * (true para recalcular ao arrastar, false para travar até soltar)
     */
    ROUTE_WHILE_DRAGGING: true,


    // Chave da API do OpenRouteService
    OPENROUTESERVICE_API_KEY: import.meta.env.VITE_OPENROUTESERVICE_API_KEY || 'null', 

    // A DOCUMENTAR
    MAX_IMAGE_ICON_SIZE: 40,//px


    // ==========================
    // Adicione novos parâmetros de configuração abaixo
    // ==========================
};


/**
 * BASE_LAYERS
 * --------------------------------------------------------------------
 * Lista configurável dos provedores de camadas base (tiles) do mapa.
 * Cada item define nome, URL do tile, attribution, tipo e configurações.
 * 
 * - name: Nome legível apresentado ao usuário no painel de camadas.
 * - key: Chave única para uso interno.
 * - type: 'tile' (TileLayer), 'group' (LayerGroup, vários TileLayers juntos)
 * - urls: Array de URLs (para LayerGroup) OU string (para TileLayer simples)
 * - attribution: Texto ou HTML de crédito obrigatório (direitos de uso)
 * - checked: (opcional) true se deve ser a camada padrão ativa
 * - maxZoom: (opcional) zoom máximo suportado pela camada
 */
export const BASE_LAYERS = [
    // OpenStreetMap
    {
        checked: true,
        key: 'osm',
        name: 'OpenStreetMap',
        type: 'tile',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    },
    // HOT OSM
    {
        key: 'hot',
        name: 'Humanitário (HOT)',
        type: 'tile',
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '&copy; HOT & OSM',
        maxZoom: 20
    },
    // Esri Satélite
    {
        key: 'esri_sat',
        name: 'Satélite (Esri)',
        type: 'tile',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri, Maxar',
        maxZoom: 19
    },
    // Esri Satélite + Rótulos
    {
        key: 'esri_sat_labels',
        name: 'Satélite com Rótulos (Esri)',
        type: 'group',
        urls: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            'https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
        ],
        attribution: '&copy; Esri, Boundaries',
        maxZoom: 20
    },
    // Google Satélite
    {
        key: 'google_sat',
        name: 'Satélite (Google)',
        type: 'tile',
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        attribution: '&copy; Google',
        maxZoom: 25
    },
    // Google Satélite + Rótulos
    {
        key: 'google_sat_labels',
        name: 'Satélite Com Rótulos (Google)',
        type: 'tile',
        url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        attribution: '&copy; Google',
        maxZoom: 25
    },
    // Carto Light
    {
        key: 'carto_light',
        name: 'Carto Light',
        type: 'tile',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; CARTO',
        maxZoom: 20
    },
    // Carto Dark
    {
        key: 'carto_dark',
        name: 'Carto Dark',
        type: 'tile',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; CARTO',
        maxZoom: 20
    },
    // OpenTopoMap
    {
        key: 'topo',
        name: 'Topografia (OpenTopoMap)',
        type: 'tile',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenTopoMap & OSM',
        maxZoom: 17
    },
    // Bacias (Carto Voyager)
    {
        key: 'bacias',
        name: 'Bacias',
        type: 'tile',
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
        attribution: '&copy; CartoDB',
        maxZoom: 20
    },

    // ...adicione outros provedores facilmente!
];
