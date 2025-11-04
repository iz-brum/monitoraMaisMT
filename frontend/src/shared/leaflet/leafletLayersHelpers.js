// src/shared/leaflet/leafletLayersHelpers.js

import L from 'leaflet';

/**
 * 🧭 configurarControleDeCamadas
 * Configura o painel de camadas do Leaflet com as camadas disponíveis.
 * Cada camada recebe sua própria classe CSS para estilização independente.
 *
 * @param {L.Map} map - Instância do mapa Leaflet.
 * @param {React.RefObject} controlRef - Referência reativa do controle.
 * @param {Object} layers - Objeto com as camadas a serem configuradas
 */
export function configurarControleDeCamadas(map, controlRef, layers) {
    if (controlRef.current) return;

    // Verifica se as layers existem e cria um objeto apenas com as layers válidas
    const overlays = {};
    let controlClassName = ''; // Variável para armazenar a classe do controle
    
    if (layers?.focosLayer) {
        overlays['Focos de Calor'] = layers.focosLayer;
        controlClassName = 'focos-layer-control'; // Define a classe para focos
    }
    
    if (layers?.anaLayer) {
        overlays['Estações ANA'] = layers.anaLayer;
        controlClassName = 'estacoes-layer-control'; // Define a classe para ANA
    }

    // Cria o controle com as camadas válidas
    const control = L.control.layers(null, overlays, {
        collapsed: true,
        position: 'topright'
    }).addTo(map);

    // Obtém o container do controle
    const container = control.getContainer();
    
    // Adiciona a classe ao container principal do controle
    container.classList.add('leaflet-control', controlClassName);

    // Adiciona classes específicas para cada tipo de camada
    const overlayElements = container.getElementsByClassName('leaflet-control-layers-overlays')[0];
    if (overlayElements) {
        const labels = overlayElements.getElementsByTagName('label');
        Array.from(labels).forEach(label => {
            const text = label.textContent || label.innerText;
            if (text.includes('Focos de Calor')) {
                label.classList.add('focos-layer-control');
            } else if (text.includes('Estações ANA')) {
                label.classList.add('estacoes-layer-control');
            }
        });
    }

    controlRef.current = control;
}

/**
 * ♻️ limparCamadas
 * Remove todas as camadas e controles relacionados ao sistema de focos.
 * Usado para resetar o estado visual ou durante desmontagens de componente.
 *
 * @param {L.Map} map - Instância do mapa Leaflet.
 * @param {React.RefObject} clusterRef - Camada de agrupamento de focos.
 * @param {React.RefObject} markerRef - Camada com os marcadores simples.
 * @param {React.RefObject} proxyRef - Camada proxy de exibição.
 * @param {React.RefObject} highlightRef - Camada de destaque para áreas clicadas.
 * @param {React.RefObject} controlRef - Controle de camadas Leaflet.
 */
// export function limparCamadas(map, clusterRef, markerRef, proxyRef, highlightRef, controlRef) {
//     map.removeLayer(clusterRef.current);
//     map.removeLayer(markerRef.current);
//     map.removeLayer(proxyRef.current);
//     map.removeLayer(highlightRef.current);
//     map.off('overlayadd');

//     if (controlRef.current) {
//         map.removeControl(controlRef.current);
//         controlRef.current = null;
//     }
// } // VERSÃO FUNCIONAL

// Atualizar a função limparCamadas para suportar múltiplas camadas
export function limparCamadas(map, refs) {
    Object.values(refs).forEach(ref => {
        if (ref.current) {
            map.removeLayer(ref.current);
        }
    });

    if (refs.controlRef?.current) {
        map.removeControl(refs.controlRef.current);
        refs.controlRef.current = null;
    }
}


/**
 * 🎨 createClusterIcon
 * Gera dinamicamente o ícone visual para um cluster de focos.
 * A cor e o tamanho são escaláveis com base na quantidade de elementos agrupados.
 *
 * @param {number} count - Número de focos no cluster
 * @returns {L.DivIcon} - Ícone estilizado para representar agrupamento
 */
function createClusterIcon(count) {
    let bg, emoji;
    if (count < 10) {
        // Roxo escuro
        bg = "linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)"; // Deep Purple
        emoji = "🔥";
    } else if (count < 100) {
        // Azul escuro
        bg = "linear-gradient(135deg, #1a237e 0%, #0d1642 100%)"; // Indigo
        emoji = "🔥";
    } else {
        // Vermelho escuro
        bg = "linear-gradient(135deg, #b71c1c 0%, #8b0000 100%)"; // Red
        emoji = "🔥";
    }
    
    const diametro = 30; // Mesmo tamanho dos clusters ANA
    const fontSize = 12; // Tamanho fixo como nos clusters ANA

    return L.divIcon({
        html: `<div class="focos-cluster-icon">
                 <span class="focos-cluster-count">${count}</span>
               </div>`,
        className: 'focos-cluster',
        iconSize: [diametro, diametro],
        iconAnchor: [diametro / 2, diametro / 2], // Ancoragem centrada
        style: `
            background: ${bg};
            border: 3px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            box-shadow: 0 4px 12px rgba(255, 87, 34, 0.5);
            position: relative;
            overflow: hidden;
            --emoji: "${emoji}";
        `
    });
}

/**
 * 🧬 criarClusterGroup
 * Cria um grupo de clusters de marcadores, utilizando o ícone dinâmico criado por `createClusterIcon`.
 * 
 * @returns {L.MarkerClusterGroup} - Grupo configurado para agrupar marcadores
 */
export function criarClusterGroup() {
    return L.markerClusterGroup({
        maxClusterRadius: 50, // Mesmo valor dos clusters ANA
        iconCreateFunction: cluster =>
            createClusterIcon(cluster.getChildCount())
    });
}