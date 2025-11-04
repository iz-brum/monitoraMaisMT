// frontend/src/components/layers/atualizarCamadasAna.js
import L from 'leaflet';

// 🎨 CONFIGURAÇÃO DE CORES BASEADA NOS DADOS DE CHUVA
const CORES_CHUVA = {
    SEM_DADOS: '#828282',        // ≈ Gray
    SEM_CHUVA: '#7fb0fd',        // ≈ Malibu
    CHUVA_FRACA: '#3ea7e4',      // ≈ Picton Blue
    // CHUVA_FRACA: '#feb719',
    CHUVA_MODERADA: '#3159e4',   // ≈ Royal Blue
    // CHUVA_MODERADA: '#000000ff',
    CHUVA_FORTE: '#132572',      // ≈ Deep Koamaru
    CHUVA_MUITO_FORTE: '#c211fd' // ≈ Electric Violet
};

// 🌧️ FUNÇÃO PARA CLASSIFICAR CHUVA E RETORNAR COR
function obterCorPorChuva(estacao) {
    const chuva = estacao.historico.acumulado_intervalo_completo;

    if (chuva === null || chuva === undefined) {
        return {
            cor: CORES_CHUVA.SEM_DADOS,
            categoria: 'Sem Dados'
        };
    }

    if (chuva === 0) {
        return {
            cor: CORES_CHUVA.SEM_CHUVA,
            categoria: 'Sem Chuva'
        };
    } else if (chuva < 10) {
        return {
            cor: CORES_CHUVA.CHUVA_FRACA,
            categoria: 'Chuva Fraca'
        };
    } else if (chuva < 30) {
        return {
            cor: CORES_CHUVA.CHUVA_MODERADA,
            categoria: 'Chuva Moderada'
        };
    } else if (chuva < 70) {
        return {
            cor: CORES_CHUVA.CHUVA_FORTE,
            categoria: 'Chuva Forte'
        };
    } else {
        return {
            cor: CORES_CHUVA.CHUVA_MUITO_FORTE,
            categoria: 'Chuva Muito Forte'
        };
    }
}

export function atualizarCamadasAna({ map, estacoes, markerLayerRef,
    proxyLayerRef, clusterGroupRef, setEstacaoSelecionada, useCluster = false }) {

    if (!podeAtualizarMapa({ map, estacoes })) {
        console.warn('⚠️ Não é possível atualizar o mapa. Verifique o estado do mapa ou das estações.');
        return;
    }

    // Limpa todas as camadas
    limparCamadas(map, markerLayerRef, proxyLayerRef, clusterGroupRef);

    // Criar marcadores
    const markers = estacoes
        .map(estacao => criarMarkerEstacao(estacao, setEstacaoSelecionada))
        .filter(marker => marker !== null);
    // console.log('📍 Marcadores criados:', markers.length);

    // Decide qual camada usar com base no modo
    if (useCluster) {
        clusterGroupRef.current.addLayers(markers);
        proxyLayerRef.current.addLayer(clusterGroupRef.current);
    } else {
        markers.forEach(marker => markerLayerRef.current.addLayer(marker));
        proxyLayerRef.current.addLayer(markerLayerRef.current);
    }

    // Garantir que as camadas estejam visíveis
    garantirLayerAdicionado(map, proxyLayerRef);

}

function podeAtualizarMapa({ map, estacoes }) {
    return map && estacoes.length > 0;
}

function limparCamadas(map, markerRef, proxyRef, clusterRef) {
    const markerLayer = markerRef.current;
    const proxyLayer = proxyRef.current;
    const clusterLayer = clusterRef?.current;

    [markerLayer, proxyLayer, clusterLayer].forEach(layer => {
        if (layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
        if (layer) {
            layer.clearLayers();
        }
    });
}

/**
 * ✅ Garante que a camada proxy esteja visível no mapa.
 *
 * Necessária quando o mapa pode ter sido limpo ou reinicializado.
 *
 * @param {L.Map} map - Instância do mapa Leaflet
 * @param {Object} proxyRef - Ref para camada intermediária das estações
 */
function garantirLayerAdicionado(map, proxyRef) {
    const proxyLayer = proxyRef.current;
    if (!map.hasLayer(proxyLayer)) {
        map.addLayer(proxyLayer); // 🚀 Adiciona se estiver ausente
    }
}

function criarMarkerEstacao(estacao, setEstacaoSelecionada) {
    if (!estacao.Latitude || !estacao.Longitude) {
        console.warn('⚠️ Estação sem coordenadas:', estacao.codigo, estacao.nome);
        return null;
    }

    const lat = Number(estacao.Latitude);
    const lng = Number(estacao.Longitude);

    const { cor, categoria } = obterCorPorChuva(estacao);

    const classesCSS = `estacao-marker estacao-${categoria.toLowerCase().replace(/\s+/g, '-')}`;

    return L.circleMarker([lat, lng], {
        radius: 6, // Tamanho do marcador
        fillColor: cor, // Cor baseada na classificação de chuva
        color: '#FFF', // Cor da borda
        weight: 1, // Espessura da borda
        fillOpacity: 0.8, // Opacidade do preenchimento
    }).on('click', (e) => {
        L.DomEvent.stopPropagation(e); // Impede a propagação do clique para o mapa
        setEstacaoSelecionada(estacao);
    });
}