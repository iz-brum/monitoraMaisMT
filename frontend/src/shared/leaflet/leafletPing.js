// utils/leafletPing.js - VERSÃO CORRIGIDA (GIROS OPOSTOS CONFIRMADOS)
import L from 'leaflet';

export function addMapPing(map, lat, lng) {
    if (!document.getElementById('leaflet-radar-styles')) {
        const style = document.createElement('style');
        style.id = 'leaflet-radar-styles';
        style.innerHTML = `
        .radar-container {
            background: transparent !important;
        }
        /* Camada 1: Horário (externo) */
        @keyframes radar-rotate-cw {
            0% { transform: rotate(0deg) scale(0.8); }
            100% { transform: rotate(360deg) scale(1.2); }
        }
        /* Camada 2: Anti-horário (médio) - CORREÇÃO AQUI */
        @keyframes radar-rotate-ccw {
            0% { transform: rotate(360deg) scale(0.7); }
            100% { transform: rotate(0deg) scale(1.1); }
        }
        /* Camada 3: Horário (interno) */
        @keyframes radar-rotate-cw-slow {
            0% { transform: rotate(0deg) scale(0.6); }
            100% { transform: rotate(360deg) scale(1); }
        }
        .radar-layer {
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
            border-style: solid;
            border-top-color: transparent !important;
            background: transparent !important;
        }
        .radar-layer-1 {
            border: 3px solid rgb(0, 166, 255); /* Vermelho (sentido horário) */
            animation: radar-rotate-cw 2.5s infinite linear;
            width: 100%;
            height: 100%;
        }
        .radar-layer-2 {
            border: 2px solid rgba(243, 85, 0, 0.89); /* Verde (sentido anti-horário) */
            animation: radar-rotate-ccw 3s infinite linear;
            width: 70%;
            height: 70%;
            top: 15%;
            left: 15%;
        }
        .radar-layer-3 {
            border: 1px solid rgba(239, 255, 11, 0.85); /* Azul (sentido horário) */
            animation: radar-rotate-cw-slow 3.5s infinite linear;
            width: 40%;
            height: 40%;
            top: 30%;
            left: 30%;
        }
        `;
        document.head.appendChild(style);
    }

    const container = L.DomUtil.create('div', 'radar-container');
    container.style.width = '20px';  // Aumentei para melhor visualização
    container.style.height = '20px';
    container.style.position = 'relative';

    // Cria as 3 camadas (cores diferentes para identificar os giros)
    const layer1 = L.DomUtil.create('div', 'radar-layer radar-layer-1', container);
    const layer2 = L.DomUtil.create('div', 'radar-layer radar-layer-2', container);
    const layer3 = L.DomUtil.create('div', 'radar-layer radar-layer-3', container);

    const icon = L.divIcon({
        html: container,
        iconSize: [20, 20],
        iconAnchor: [11, 15],
        className: 'transparent-marker'
    });

    const marker = L.marker([lat, lng], {
        icon,
        interactive: false,
        pane: 'markerPane'
    });

    marker.addTo(map);
    return marker;
}