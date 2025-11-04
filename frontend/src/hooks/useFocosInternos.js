// src/shared/hooks/useFocosInternos.js

import { useRef, useState } from 'react';
import L from 'leaflet';
import { criarClusterGroup } from '@shared/leaflet/leafletLayersHelpers';

/**
 * 🧠 useFocosInternos
 * 
 * Hook reativo e centralizado que fornece todas as referências e estados necessários
 * para controle de dados, interações e visualizações de focos térmicos no mapa.
 * Atua como um barramento completo do painel.
 * 
 * @returns {Object} - Objeto com todos os refs e estados controlados do sistema.
 */
export default function useFocosInternos() {
    const clusterGroupRef = useRef(criarClusterGroup());
    const markerLayerRef = useRef(L.layerGroup());
    const proxyLayerRef = useRef(L.layerGroup());
    const highlightLayerRef = useRef(L.layerGroup());
    const highlightData = useState(null);
    const controlRef = useRef(null);
    const focos = useState([]);
    const useCluster = useState(true);
    const focosSelecionados = useState([]);
    const posicaoTabela = useState(null);

    // console.log('useFocosInternos: Estado inicial criado:', {
    //     clusterGroupRef,
    //     markerLayerRef,
    //     proxyLayerRef,
    //     highlightLayerRef,
    //     highlightData,
    //     controlRef,
    //     focos,
    //     useCluster,
    //     focosSelecionados,
    //     posicaoTabela,
    // });

    return {
        clusterGroupRef,      // 🔁 Agrupamento inteligente.
        markerLayerRef,       // 🎯 Camada de marcadores simples.
        proxyLayerRef,        // 🛡️ Intermediário entre layers e mapa.
        highlightLayerRef,    // ✨ Destaques temporários.
        highlightData,
        controlRef,           // 🧭 UI do controle de camadas.
        focos,                // 🔥 Lista de focos do backend.
        useCluster,           // ⚙️ Modo de visualização.
        focosSelecionados,    // 🎯 Focos selecionados para painel.
        posicaoTabela,        // 📍 Posição da interface flutuante.
    };
}