// src/components/layers/AnaLayerControlPanel.jsx
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { configurarControleDeCamadas, limparCamadas } from '@shared/leaflet/leafletLayersHelpers';
import { prepararToggle } from '@shared/leaflet/leafletControlToggleHelpers';
import { useAnaDados } from '@context/AnaDadosContext';
import { atualizarCamadasAna } from './atualizarCamadasAna';
import DraggablePortalPanel from '@components/layout/DraggablePortalPanel';
import HUDDinamico from '@components/layout/HUDDinamico';
import { useHUDManager } from '@hooks/useHUDManager';

function LegendaChuva() {
    return (
        <div className="ana-legenda-compact">
            <div className="ana-legenda-titulo">Chuva Telemétrica (ANA)</div>
            <div className="ana-legenda-linha">
                <span className="ana-legenda-bolinha chuva-muito-forte" />
                <span>Chuva Muito Forte <em>(70mm+)</em></span>
            </div>
            <div className="ana-legenda-linha">
                <span className="ana-legenda-bolinha chuva-forte" />
                <span>Chuva Forte <em>(30-70mm)</em></span>
            </div>
            <div className="ana-legenda-linha">
                <span className="ana-legenda-bolinha chuva-moderada" />
                <span>Chuva Moderada <em>(10-30mm)</em></span>
            </div>
            <div className="ana-legenda-linha">
                <span className="ana-legenda-bolinha chuva-fraca" />
                <span>Chuva Fraca <em>(&lt;10mm)</em></span>
            </div>
            <div className="ana-legenda-linha">
                <span className="ana-legenda-bolinha sem-chuva" />
                <span>Sem Chuva</span>
            </div>
            <div className="ana-legenda-linha">
                <span className="ana-legenda-bolinha sem-dados" />
                <span>Sem Dados</span>
            </div>
        </div>
    );
}

export default function AnaLayerControlPanel({ onMarkerClick }) {
    const map = useMap();
    const markerLayerRef = useRef(L.featureGroup());
    const proxyLayerRef = useRef(L.featureGroup());
    const controlRef = useRef(null);
    const { dados: estacoes } = useAnaDados();
    const primeiraVezRef = useRef(true);
    const [layerAtivo, setLayerAtivo] = useState(false);
    const [useCluster, setUseCluster] = useState(true);
    const [viewportKey, setViewportKey] = useState(0);

    const clusterGroupRef = useRef(L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function (cluster) {
            const count = cluster.getChildCount();
            const sizePixels = 30;
            const anchor = [sizePixels / 2, sizePixels / 2];
            return L.divIcon({
                html: `<div class="ana-cluster-icon"><span className="ana-cluster-count">${count}</span></div>`,
                className: 'ana-cluster',
                iconSize: [sizePixels, sizePixels],
                iconAnchor: anchor,
                popupAnchor: [0, -sizePixels / 2]
            });
        }
    }));

    // Atualiza o viewport ao mover ou dar zoom no mapa
    useEffect(() => {
        if (!map) return;
        const atualizarViewport = () => setViewportKey(prev => prev + 1);
        map.on('moveend zoomend', atualizarViewport);
        return () => map.off('moveend zoomend', atualizarViewport);
    }, [map]);

    // Configura os controles de camadas no mapa
    useEffect(() => {
        if (!map || controlRef.current) return;
        function handleOverlayAdd(e) {
            if (e.name === 'Estações ANA') {
                setLayerAtivo(true);
            }
        }
        function handleOverlayRemove(e) {
            if (e.name === 'Estações ANA') {
                setLayerAtivo(false);
                markerLayerRef.current.clearLayers();
                clusterGroupRef.current.clearLayers();
                proxyLayerRef.current.clearLayers();
            }
        }
        const layers = { anaLayer: proxyLayerRef.current };
        configurarControleDeCamadas(map, controlRef, layers);
        setTimeout(() => prepararToggle(map, controlRef, useCluster, proxyLayerRef, setUseCluster, 'ana'), 50);
        map.on('overlayadd', handleOverlayAdd);
        map.on('overlayremove', handleOverlayRemove);
        return () => {
            map.off('overlayadd', handleOverlayAdd);
            map.off('overlayremove', handleOverlayRemove);
            limparCamadas(map, { markerLayerRef, proxyLayerRef, clusterGroupRef, controlRef });
        };
    }, [map]);

    // Atualiza as camadas com as estações visíveis
    useEffect(() => {
        if (!map || !estacoes?.length || !layerAtivo) return; // Ajuste para acessar `estacoes.estacoes`
        const bounds = map.getBounds();
        const visiveis = estacoes.filter(estacao => { // Acessa `estacoes.estacoes`
            const lat = Number(estacao.Latitude);
            const lng = Number(estacao.Longitude);
            return bounds.contains([lat, lng]);
        });
        const forceZoom = primeiraVezRef.current;
        primeiraVezRef.current = false;
        requestAnimationFrame(() => atualizarCamadasAna({
            map,
            estacoes: visiveis,
            markerLayerRef,
            proxyLayerRef,
            clusterGroupRef,
            setEstacaoSelecionada: onMarkerClick,
            forceZoom,
            useCluster
        }));
    }, [map, estacoes, layerAtivo, viewportKey, onMarkerClick, useCluster]);

    // Atualiza o botão de alternância de cluster
    useEffect(() => {
        if (!map || !layerAtivo) return;
        setTimeout(() => prepararToggle(map, controlRef, useCluster, proxyLayerRef, setUseCluster, 'ana'), 150);
    }, [map, layerAtivo, useCluster]);

    const abasLegenda = [
        {
            id: 'legenda-chuva',
            titulo: 'Legenda de Chuva',
            conteudo: <LegendaChuva />,
        },
    ];

    const [abasIniciais] = useState(abasLegenda);

    const {
        abasVisiveis,
        abaAtivaId,
        hudVisivel,
        fecharAba,
        fecharHUD,
        reabrirHUD: reabrirHUDOriginal,
        setAbaAtivaId,
        adicionarAba
    } = useHUDManager([]);

    const reabrirHUD = () => {
        if (abasVisiveis.length === 0) {
            abasIniciais.forEach((aba) => adicionarAba(aba));
        }
        reabrirHUDOriginal();
        setAbaAtivaId(abasIniciais[0]?.id);
    };

    useEffect(() => {
        if (!map || !layerAtivo) return;

        const legendaControl = L.Control.extend({
            options: { position: 'topright' },
            onAdd: function () {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-legend-btn');
                container.style.width = '35px';
                container.style.height = '35px';
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.style.backgroundColor = 'white';

                const button = L.DomUtil.create('a', '', container);
                button.href = '#';
                button.title = 'Ver legenda';

                // Usa classe CSS para renderizar o ícone (imagem por background) em vez de <img> inline
                button.className = 'legend-control-button';
                button.setAttribute('aria-label', 'Ver legenda');

                L.DomEvent.on(button, 'click', function (e) {
                    L.DomEvent.stopPropagation(e);
                    L.DomEvent.preventDefault(e);
                    reabrirHUD();
                });

                return container;
            }
        });

        const control = new legendaControl();
        map.addControl(control);

        return () => map.removeControl(control);
    }, [map, layerAtivo]);

    return (
        hudVisivel && (
            <DraggablePortalPanel onClose={fecharHUD}>
                <HUDDinamico
                    abas={abasVisiveis}
                    abaAtivaId={abaAtivaId}
                    onClose={fecharAba}
                    onAbaChange={setAbaAtivaId}
                />
            </DraggablePortalPanel>
        )
    );
}