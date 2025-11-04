// frontend/src/components/dashboard/MapaCard.jsx

// 📁 Importa o CSS específico para o cartão de mapa (estilização visual/layout)
import '@styles/dashboard/MapaCard.css'

// 🗺️ Importa o container principal do mapa e o controle de escala do Leaflet via React
import { MapContainer, ScaleControl, GeoJSON, useMap, useMapEvent, useMapEvents } from 'react-leaflet'

// 🔇 Declarações void para evitar warnings de "imports não utilizados" em análises estáticas
void MapContainer, ScaleControl, GeoJSON

// 🔄 Hook de estado do React, usado para armazenar focos selecionados e visibilidade de popups
import { useState, useEffect, useRef } from 'react'

// Documentar
import L from 'leaflet';

// 📦 Estilo base da biblioteca Leaflet para funcionamento correto dos mapas
import 'leaflet/dist/leaflet.css'

// 🧩 Conjunto de utilitários visuais e funcionais para o mapa:
// - BaseLayers: camadas base (OSM, satélite, etc.)
// - FullscreenButton: botão para alternar tela cheia
// - SearchControl: controle de busca usando Mapbox
import {
  BaseLayers,
  FullscreenButton,
  SearchControl
} from '@components/mapa/MapHelpers'

// 🔇 Garante que os utilitários importados não sejam eliminados por otimizadores
void BaseLayers, FullscreenButton, SearchControl

// 📂 Componente que permite o upload e leitura de arquivos geográficos (.geojson, .kml, .kmz)
import GeoFileLoader from '@components/geofiles/GeoFileLoader'
void GeoFileLoader // Supressão de warning de uso

// 🔥 Painel de controle de camadas com focos de calor (marcadores, cluster, toggle)
import FocosLayerControlPanel from '@components/layers/FocosLayerControlPanel'
void FocosLayerControlPanel

import AnaLayerControlPanel from '@components/layers/AnaLayerControlPanel'
void AnaLayerControlPanel

import EstacaoAnaDetalhesFlutuante from '@components/mapa/EstacaoDetalhesFlutuante'
void EstacaoAnaDetalhesFlutuante

// 🧾 Componente de popup flutuante com detalhes sobre focos selecionados (clicados)
import FocoDetalhesFlutuante from '@components/mapa/FocoDetalhes/FocoDetalhesFlutuante'
void FocoDetalhesFlutuante

import RotasControl from '@components/mapa/RotasControl';
void RotasControl

import RotasToggleControl from '@components/mapa/RotasToggleControl';
void RotasToggleControl

import { normalizeString } from '@domain/utils/normalizeString';

import { useMapaContexto } from '@context/MapaContexto'

import ImportedLayerControls from '@components/geofiles/ImportedLayerControls';
void ImportedLayerControls

import FloatingHudControl from "@components/mapa/geofileConfigs/FloatingHudControl";
void FloatingHudControl

import ImportedLayerControlsWrapper from "@components/geofiles/ImportedLayerControlsWrapper";
void ImportedLayerControlsWrapper

import DraggablePortalPanel from '@components/layout/DraggablePortalPanel';
void DraggablePortalPanel

import HUDDinamico from '@components/layout/HUDDinamico';
void HUDDinamico

import { useHUDManager } from '@hooks/useHUDManager';


// 🔐 Token de autenticação Mapbox retirado das variáveis de ambiente (.env)
// Usado pelo controle de busca por localização
const mapboxApiKey = import.meta.env.VITE_MAPBOX_TOKEN

export default function MapaCard({ cidadesSelecionadas, onDesmarcarCidade }) {
  const {
    mapPosition, setMapPosition, hydrated,
    popupVisivel, setPopupVisivel,
    focosSelecionados, setFocosSelecionados,
  } = useMapaContexto();

  const [limitesGeoJson, setLimitesGeoJson] = useState(null);
  const [rotasModeAtivo, setRotasModeAtivo] = useState(false);
  const [waypoints, setWaypoints] = useState([]);
  const [rotaInfo, setRotaInfo] = useState(null);
  const [importedLayers, setImportedLayers] = useState([]);
  const [leafletMap, setLeafletMap] = useState(null);
  const [mapaPronto, setMapaPronto] = useState(false);
  const [estacaoSelecionada, setEstacaoSelecionada] = useState(null);
  const [painelEstacaoVisivel, setPainelEstacaoVisivel] = useState(false);
  const camadasPendentesRef = useRef([]);
  const {
    abasVisiveis,
    abaAtivaId,
    hudVisivel,
    fecharAba,
    fecharHUD,
    reabrirHUD,
    setAbaAtivaId,
    adicionarAba,
  } = useHUDManager([]);
  // Adicionar função para abrir o painel
  const abrirPainelEstacao = (estacao) => {
    setEstacaoSelecionada(estacao);
    setPainelEstacaoVisivel(true);
  };

  // Adicionar função para fechar o painel
  const fecharPainelEstacao = () => {
    setEstacaoSelecionada(null);
    setPainelEstacaoVisivel(false);
  };

  useEffect(() => {
    if (leafletMap) {
      setMapaPronto(true);
    }
  }, [leafletMap]);

  function handleLayerImported(layerObj) {
    const camadaComOpacidade = {
      ...layerObj,
      opacity: 1
    };

    camadasPendentesRef.current.push(camadaComOpacidade);
    setImportedLayers(prev => [...prev, camadaComOpacidade]);
  }

  useEffect(() => {
    if (camadasPendentesRef.current.length === 0) return;

    // Abre uma aba para cada camada pendente
    for (const camada of camadasPendentesRef.current) {
      const novaAba = {
        id: camada.id,
        titulo: camada.name || "Camada importada",
        conteudo: (
          <ImportedLayerControlsWrapper
            key={camada.id}
            layer={camada}
            onChangeOpacity={handleChangeOpacity}
            onFechar={() => fecharAba(camada.id)}
          />
        )
      };

      const jaExiste = abasVisiveis.some(a => a.id === camada.id);
      if (!jaExiste) {
        adicionarAba(novaAba);
      }
    }

    reabrirHUD();
    camadasPendentesRef.current = [];
  }, [importedLayers]);

  useEffect(() => {
    if (!hudVisivel) return;

    // Recria abas para qualquer camada que esteja no estado mas não tem aba
    const abasFaltando = importedLayers.filter(layer =>
      !abasVisiveis.some(aba => aba.id === layer.id)
    );

    for (const camada of abasFaltando) {
      adicionarAba({ id: camada.id, titulo: camada.name || camada.filename || "Camada importada" });
    }
  }, [hudVisivel]);

  function renderConteudoAba(layerId) {
    const camada = importedLayers.find(l => l.id === layerId);
    if (!camada) return <div>Camada não encontrada</div>;

    return (
      <ImportedLayerControlsWrapper
        key={camada.id} // força re-render quando opacidade muda
        layer={camada}
        onChangeOpacity={handleChangeOpacity}
        onFechar={() => fecharAba(camada.id)}
      />
    );
  }

  function handleChangeOpacity(layerId, newOpacity) {
    setImportedLayers(layers =>
      layers.map(layer => {
        if (layer.id === layerId) {
          if (layer.leafletLayer) {
            if (typeof layer.leafletLayer.setOpacity === "function") {
              layer.leafletLayer.setOpacity(newOpacity);
            }
            if (typeof layer.leafletLayer.setStyle === "function") {
              layer.leafletLayer.setStyle({ opacity: newOpacity });
            }
          }
          return { ...layer, opacity: newOpacity };
        }
        return layer;
      })
    );
  }

  // Adicione a função para gerenciar cliques no mapa
  const HandleMapClick = () => {

    useMapEvent('click', (e) => {
      if ( // --- Verifica se o clique foi em painel flutuante:
        e.originalEvent.target.closest('.route-info-panel') ||
        e.originalEvent.target.closest('.floating-panel')
      ) {
        // Se foi, não faz nada!
        return;
      }

      if (rotasModeAtivo) { // Só adiciona ponto se NÃO foi no painel!
        setWaypoints(prev => [...prev, {
          lat: e.latlng.lat,
          lng: e.latlng.lng
        }]);
      }
    });

    return null;
  }
  void HandleMapClick

  // Carregar o arquivo GeoJSON ao montar
  useEffect(() => {
    fetch('assets/geo/limites_administrativos.json')
      .then(res => res.json())
      .then(data => setLimitesGeoJson(data));
  }, []);

  // Aguarde a hidratação antes de renderizar o MapContainer
  if (!hydrated) return <div>Carregando mapa...</div>; // Ou pode exibir um loading spinner
  // console.log('mapPosition', mapPosition)


  /**
   * 🔄 Handler chamado ao clicar em um marcador de foco no mapa.
   * Define os focos selecionados e exibe o popup.
   *
   * @param {Array<Object>} focos - Lista de focos de calor próximos ao clique.
   */
  const abrirPopupFocos = (focos) => {
    setFocosSelecionados(focos);
    setPopupVisivel(true);
  };

  /**
   * ❌ Fecha o popup de detalhes e limpa os focos selecionados.
   */
  const fecharPopup = () => {
    setPopupVisivel(false);
    setFocosSelecionados([]);
  };

  void MapPositionTracker
  function MapPositionTracker() {
    useMapEvents({
      moveend: (e) => {
        const map = e.target;
        setMapPosition({
          center: [map.getCenter().lat, map.getCenter().lng],
          zoom: map.getZoom(),
        });
      },
      zoomend: (e) => {
        const map = e.target;
        setMapPosition({
          center: [map.getCenter().lat, map.getCenter().lng],
          zoom: map.getZoom(),
        });
      },
    });
    return null;
  }

  return (
    <div className="mapa-card" style={{ position: 'relative' }}>

      <MapContainer
        center={mapPosition.center}
        zoom={mapPosition.zoom}
        scrollWheelZoom={true}
        className="mapa-leaflet"
      >
        {hudVisivel && (
          <DraggablePortalPanel onClose={fecharHUD}>
            <HUDDinamico
              abas={abasVisiveis.map(aba => ({
                ...aba,
                conteudo: renderConteudoAba(aba.id)
              }))}
              abaAtivaId={abaAtivaId}
              onAbaChange={setAbaAtivaId}
              onClose={fecharAba}
            />
          </DraggablePortalPanel>
        )}

        {importedLayers.length > 0 && (
          <FloatingHudControl
            onClick={() => reabrirHUD(true)}
          />
        )}

        <MapPositionTracker />

        {/* Zoom nas cidades selecionadas */}
        {Array.isArray(cidadesSelecionadas) &&
          cidadesSelecionadas.map(cidade => (
            <ZoomCidade key={cidade.cidade + (cidade.clickId || '')} cidade={cidade} />
          ))
        }


        {/* Limites dos municípios selecionados */}
        {Array.isArray(cidadesSelecionadas) && cidadesSelecionadas.map(cidade => {
          const features = limitesGeoJson?.features.filter(
            feature =>
              feature.properties.name &&
              normalizeString(feature.properties.name) === normalizeString(cidade.cidade)
          );
          if (!features || !features.length) return null;

          const municipioSelecionadoGeoJson = {
            type: 'FeatureCollection',
            features,
          };
          // Detecta se é o último selecionado (pelo clickId mais recente)
          const isAnimado = cidade.clickId && cidade.clickId === Math.max(...cidadesSelecionadas.map(c => c.clickId || 0));

          // Defina a cor baseada no tipo
          let corLimite = "red";
          if (cidade.tipo === "chuva") corLimite = "#005AFF";
          else if (cidade.tipo === "focos") corLimite = "#ffa500";

          return (
            <GeoJSON
              key={cidade.cidade + (cidade.clickId || '')} 
              data={municipioSelecionadoGeoJson}
              style={{
                color: corLimite,
                weight: 2.5,
                dashArray: "8, 4",
                fillOpacity: 0.10,
                opacity: 1,
              }}
              className={isAnimado ? "municipio-animado" : ""}
              eventHandlers={{
                contextmenu: (e) => onDesmarcarCidade(cidade.cidade)
              }}
              
            />
          );
        })}

        <ScaleControl position="bottomleft" metric={true} imperial={false} />
        <CustomScrollZoom />
        <FullscreenButton />
        <SearchControl mapboxApiKey={mapboxApiKey} />
        <GeoFileLoader onLayerImported={handleLayerImported} />
        <RotasToggleControl
          isActive={rotasModeAtivo}
          onToggle={(active) => {
            setRotasModeAtivo(active);
            if (!active) {
              setWaypoints([]); // Limpa os waypoints ao desativar
            }
          }}
        />

        {/* Camadas base */}
        <BaseLayers />
        <FocosLayerControlPanel onMarkerClick={abrirPopupFocos} />
        <AnaLayerControlPanel onMarkerClick={abrirPainelEstacao} />

        <HandleMapClick />
        {waypoints.length > 0 && rotasModeAtivo && (
          <RotasControl
            waypoints={waypoints}
            onRouteCalculated={(info) => {
              if (info && info.clear) {
                setWaypoints([]);
                return;
              }
              setRotaInfo(info);
            }}
          />
        )}

        {painelEstacaoVisivel && estacaoSelecionada && (
          <EstacaoAnaDetalhesFlutuante
            estacao={estacaoSelecionada}
            onFechar={fecharPainelEstacao}
          />
        )}
      </MapContainer>

      {popupVisivel && (
        <FocoDetalhesFlutuante
          focos={focosSelecionados}
          onFechar={fecharPopup}
        />
      )}
    </div>
  );
}


void ZoomCidade
function ZoomCidade({ cidade }) {
  const map = useMap();
  useEffect(() => {
    if (cidade && cidade.lat && cidade.lng) {
      map.setView([cidade.lat, cidade.lng], 8); // 8 é um bom zoom para cidades
    }
  }, [cidade, map]);
  return null;
}

void CustomScrollZoom;
function CustomScrollZoom() {
  useCustomScrollZoom({ minDelta: 200, delay: 100 });
  return null;
}

void useCustomScrollZoom
function useCustomScrollZoom({ minDelta, delay }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.scrollWheelZoom.disable(); // Desativa o nativo

    let lastTime = 0;

    const onWheel = (e) => {
      if (!map || !map.getContainer()) return;

      const now = Date.now();
      if (now - lastTime < delay) return; // Debounce simples

      lastTime = now;
      e.preventDefault();

      const delta = e.deltaY;
      const currentZoom = map.getZoom();

      // calcula ponto do mouse no container Leaflet
      const container = map.getContainer();
      const point = L.DomEvent.getMousePosition(e, container);

      if (delta > minDelta) {
        map.setZoomAround(point, currentZoom - 1);
      } else if (delta < -minDelta) {
        map.setZoomAround(point, currentZoom + 1);
      }
    };

    const container = map.getContainer();
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [map, minDelta, delay]);
}
