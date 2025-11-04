// src/components/layers/FocoslayerControlPanel.jsx

// =============================
// 📦 Importações Principais
// =============================

// 🎣 React Hooks
import {
    useEffect,
    useRef,
    useState
} from 'react';

import {
    useMap,
    useMapEvents
} from 'react-leaflet';

// 🗺️ Leaflet e suas extensões
import L from 'leaflet';
import 'leaflet.markercluster/dist/leaflet.markercluster'; // 📍 Plugin de clusterização de marcadores
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'; // 🎨 Estilo padrão do cluster

// 🎨 Estilos personalizados do painel de camadas
import '@styles/dashboard/LayersControl.css';

// 📋 Componente flutuante para exibição de detalhes do foco
import FocoDetalhesFlutuante from '@components/mapa/FocoDetalhes/FocoDetalhesFlutuante';
// ⚠️ `void` para evitar warnings de importação não utilizada por ferramentas de análise estática
void FocoDetalhesFlutuante;

// 🔁 Função principal de sincronização de camadas no mapa
import { atualizarCamadasFocos } from '@components/layers/atualizarCamadasFocos';

import {
    configurarControleDeCamadas,
    limparCamadas,
} from '@shared/leaflet/leafletLayersHelpers';

import { prepararToggle } from '@shared/leaflet/leafletControlToggleHelpers';

import { fetchFocosDoDia } from '@services/focosService';

import FocoFlutuanteHUD from '@components/layers/FocoFlutuanteHUD';
// ⚠️ `void` para evitar warnings de importação não utilizada por ferramentas de análise estática
void FocoFlutuanteHUD

import useFocosInternos from '@hooks/useFocosInternos';
import { getRequestDate } from '@services/dateControl';
import useDragBoxSelect from '@hooks/useDragBoxSelect';

/**
 * @function FocosLayerControlPanel
 * @description
 * Componente React responsável por coordenar a lógica e interface de visualização dos focos de calor no mapa.
 * Ele controla a busca de dados, alternância de visualização (agrupada ou simples), camadas visuais e o painel de detalhes.
 *
 * 🔧 Internamente, o componente:
 * - Inicializa e atualiza os dados de focos de calor do dia atual.
 * - Gerencia três camadas principais do Leaflet: markers simples, clusterizados e destaques (highlight).
 * - Controla o painel flutuante de detalhes de focos quando o usuário interage.
 * - Permite alternar dinamicamente entre modo de exibição "Simples" ou "Cluster".
 *
 * @returns {JSX.Element} Elemento React que representa o controle visual e interativo dos focos no mapa.
 *
 * @example
 * <FocosLayerControlPanel />
 */
export default function FocosLayerControlPanel() {
    const map = useMap();

    const {
        clusterGroupRef,
        markerLayerRef,
        proxyLayerRef,
        highlightLayerRef,
        controlRef,
        focos: [focos, setFocos],
        useCluster: [useCluster, setUseCluster],
        focosSelecionados: [focosSelecionados, setFocosSelecionados],
        posicaoTabela: [posicaoTabela, setPosicaoTabela],
        highlightData: [highlightData, setHighlightData],
    } = useFocosInternos();

    const [viewportKey, setViewportKey] = useState(0);
    useMapEvents({
        moveend: () => setViewportKey(k => k + 1),
        zoomend: () => setViewportKey(k => k + 1),
    });

    useDragBoxSelect(map, focos, (selecionados, bounds) => {
        setFocosSelecionados(selecionados);

        const centro = bounds.getCenter();
        const raio = map.distance(bounds.getNorthWest(), bounds.getSouthEast()) / 2;

        setHighlightData({ centro, raio, focos: selecionados });

        const pixel = map.latLngToContainerPoint(centro);
        setPosicaoTabela({ x: pixel.x + 20, y: pixel.y });
    });


    // 1️⃣ Carrega focos do dia (e atualiza em intervalo)
    useEffect(() => {
        function atualizarFocos() {
            // fetchFocosDoDia(undefined, setFocos); // — se quiser usar data atual
            fetchFocosDoDia(getRequestDate(), setFocos); // — se quiser explicitar

        }
        atualizarFocos();
        const interval = setInterval(atualizarFocos, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // 2️⃣ Setup de overlays, controles, listeners e limpeza
    useEffect(() => {
        if (!map || controlRef.current) return;

        const layers = {
            focosLayer: proxyLayerRef.current // Garante que existe
        };

        configurarControleDeCamadas(map, controlRef, layers);

        // Injeta o botão depois do DOM estar pronto
        setTimeout(() => {
            prepararToggle(map, controlRef, useCluster, proxyLayerRef, setUseCluster, 'focos');
        }, 0);

        // Handlers de overlays
        function handleOverlayAdd(e) {
            // console.log('handleOverlayAdd: Overlay adicionado:', e.name); // Log para inspecionar o overlay adicionado
            if (e.name === 'Focos de Calor') {
                atualizarTudo(); // força atualização dos marcadores e clusters!
                setViewportKey(k => k + 1); // (opcional: força update geral)
            }
        }

        function handleOverlayRemove(e) {
            // console.log('handleOverlayRemove: Overlay removido:', e.name); // Log para inspecionar o overlay removido
            if (e.name === 'Focos de Calor') {
                clusterGroupRef.current.clearLayers();
                markerLayerRef.current.clearLayers();
                proxyLayerRef.current.clearLayers();
            }
        }

        map.on('overlayadd', handleOverlayAdd);
        map.on('overlayremove', handleOverlayRemove);

        return () => {
            map.off('overlayadd', handleOverlayAdd);
            map.off('overlayremove', handleOverlayRemove);
            limparCamadas(
                map,
                clusterGroupRef,
                markerLayerRef,
                proxyLayerRef,
                highlightLayerRef,
                controlRef
            );
        };
        // Só depende dos refs do controle e do mapa!
    }, [map, controlRef, proxyLayerRef, clusterGroupRef, markerLayerRef, highlightLayerRef]);

    // 3️⃣ Atualiza camadas, botão e highlight sempre que algum estado/dado mudar!
    useEffect(() => {
        if (!map) return;

        // console.log('useEffect: Atualizando camadas e highlights'); // Log para inspecionar o início da atualização

        // Só atualiza se layer está visível!
        const isFocosLayerActive = map && proxyLayerRef.current && map.hasLayer(proxyLayerRef.current);
        // console.log('useEffect: focosLayer está ativo:', isFocosLayerActive); // Log para verificar se a camada está ativa
        if (!isFocosLayerActive) return;

        const bounds = map.getBounds();
        const focosVisiveis = focos.filter(foco =>
            bounds.contains([foco.latitude, foco.longitude])
        );
        // console.log('useEffect: focos visíveis calculados:', focosVisiveis); // Log para inspecionar os focos visíveis

        atualizarCamadasFocos({
            map,
            focos: focosVisiveis,
            useCluster,
            clusterGroupRef, markerLayerRef, proxyLayerRef,
            highlightLayerRef, controlRef,
            setFocosSelecionados, setPosicaoTabela,
            setHighlightData
        });

        // console.log('useEffect: focosSelecionados após atualização:', focosSelecionados); // Log para inspecionar focosSelecionados

        // Botão sempre depois de mexer nos overlays
        setTimeout(() => {
            prepararToggle(map, controlRef, useCluster, proxyLayerRef, setUseCluster, 'focos');
        }, 0);

        // Highlight (círculo de destaque)
        if (highlightData && highlightData.focos && highlightData.focos.length > 0) {
            if (bounds.contains(highlightData.centro)) {
                highlightLayerRef.current.clearLayers();
                const circle = L.circle(highlightData.centro, {
                    radius: highlightData.raio,
                    color: '#8A2BE2',
                    weight: 2,
                    fillOpacity: 0.25,
                    fillColor: '#8A2BE2'
                });
                highlightLayerRef.current.addLayer(circle);
                map.addLayer(highlightLayerRef.current);
            } else {
                highlightLayerRef.current.clearLayers();
            }
        } else {
            highlightLayerRef.current.clearLayers();
        }
    }, [map, focos, viewportKey, highlightData, useCluster,
        clusterGroupRef, markerLayerRef, proxyLayerRef, highlightLayerRef, controlRef]);

    // ------------------------------------
    // Helper: Atualiza tudo em overlayadd (para DRY)
    function atualizarTudo() {
        // console.log('atualizarTudo: Atualizando tudo'); // Log para inspecionar o início da atualização
        if (!map) return;
        const bounds = map.getBounds();
        const focosVisiveis = focos.filter(foco =>
            bounds.contains([foco.latitude, foco.longitude])
        );
        // console.log('atualizarTudo: focos visíveis calculados:', focosVisiveis); // Log para inspecionar os focos visíveis

        atualizarCamadasFocos({
            map,
            focos: focosVisiveis,
            useCluster,
            clusterGroupRef, markerLayerRef, proxyLayerRef,
            highlightLayerRef, controlRef,
            setFocosSelecionados, setPosicaoTabela,
            setHighlightData
        });

        // console.log('atualizarTudo: focosSelecionados após atualização:', focosSelecionados); // Log para inspecionar focosSelecionados

        setTimeout(() => {
            prepararToggle(map, controlRef, useCluster, proxyLayerRef, setUseCluster, 'focos');
        }, 0);
    }

    // ------------------------------------
    // HUD
    const handleFecharDetalhes = () => {
        highlightLayerRef.current.clearLayers();
        setFocosSelecionados([]);
        setHighlightData(null); // <-- Adicione esta linha!
    };

    return (
        <FocoFlutuanteHUD
            focosSelecionados={focosSelecionados}
            posicaoTabela={posicaoTabela}
            map={map}
            onClose={handleFecharDetalhes}
        />
    );
}
