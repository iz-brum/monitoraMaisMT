import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import { addMapPing } from '@shared/leaflet/leafletPing';
import DraggablePortalPanel from '@components/layout/DraggablePortalPanel';
void DraggablePortalPanel;
import HUDDinamico from '@components/layout/HUDDinamico';
void HUDDinamico;
import { useHUDManager } from '@hooks/useHUDManager';


export default function SearchControl() {
  const map = useMap();
  const markersRef = useRef([]);
  const hud = useHUDManager([]);
  const adicionarMarcador = useMarcadorHandler(map, markersRef, {
    adicionarAba: hud.adicionarAba,
    reabrirHUD: hud.reabrirHUD,
    fecharAba: hud.fecharAba
  });

  useGeocoderComClick(map, markersRef, adicionarMarcador);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        markersRef.current.forEach(marker => map.removeLayer(marker));
        markersRef.current = [];

        hud.fecharTodasAbas(); // 👈 limpa abas e esconde HUD
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [map, hud]);

  return (
    <HUDWrapper
      abasVisiveis={hud.abasVisiveis}
      hudVisivel={hud.hudVisivel}
      abaAtivaId={hud.abaAtivaId}
      fecharHUD={hud.fecharHUD}
      fecharAba={hud.fecharAba}
      setAbaAtivaId={hud.setAbaAtivaId}
    />
  );
}

export function gerarChaveLatLng(lat, lng) {
  return `${parseFloat(lat).toFixed(5)}|${parseFloat(lng).toFixed(5)}`;
}

export const TRADUCOES_ADDRESS = {
  amenity: 'Serviço',
  aeroway: 'Aeroporto',
  shop: 'Comércio',
  tourism: 'Turismo',
  historic: 'Histórico',
  leisure: 'Lazer',
  office: 'Escritório',
  healthcare: 'Saúde',
  emergency: 'Emergência',
  house_number: 'Número',
  road: 'Rua',
  pedestrian: 'Calçadão',
  footway: 'Passagem de pedestres',
  path: 'Caminho',
  suburb: 'Bairro',
  quarter: 'Quarteirão',
  neighbourhood: 'Vizinhança',
  city: 'Cidade',
  town: 'Cidade',
  village: 'Vila',
  hamlet: 'Aldeia',
  locality: 'Localidade',
  municipality: 'Município',
  county: 'Condado',
  state_district: 'Distrito/Região',
  state: 'Estado',
  region: 'Região',
  postcode: 'CEP',
  country: 'País',
  country_code: 'Código do País',
  'ISO3166-2-lvl4': 'Código ISO',
  borough: 'Distrito Urbano',
  block: 'Bloco',
  city_district: 'Distrito da Cidade',
  island: 'Ilha',
  farm: 'Fazenda',
  residential: 'Residencial',
  commercial: 'Comercial',
  industrial: 'Industrial',
  construction: 'Obra',
  continent: 'Continente',
  place: 'Lugar'
};

export async function buscarEnderecoTraduzido(lat, lng) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
  const data = await response.json();
  const traduzido = {};
  for (const chave in data.address || {}) {
    const novaChave = TRADUCOES_ADDRESS[chave] || chave;
    traduzido[novaChave] = data.address[chave];
  }
  return traduzido;
}

function setupGeocoder(map, adicionarMarcador) {
  const geocoder = L.Control.geocoder({
    defaultMarkGeocode: false,
    position: 'topleft',
    placeholder: 'Buscar endereço...',
    geocoder: L.Control.Geocoder.nominatim()
  });

  geocoder.on('markgeocode', async (e) => {
    const { lat, lng } = e.geocode.center;
    const address = await buscarEnderecoTraduzido(lat, lng);

    adicionarMarcador(lat, lng, address);
    map.setView(e.geocode.center, 14);
  });

  geocoder.addTo(map);

  // Substituir ícone padrão por SVG personalizado
  const iconEl = document.querySelector('.leaflet-control-geocoder-icon');
  if (iconEl) {
    iconEl.innerHTML = `
    <svg id="svg" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="22" height="22" viewBox="0, 0, 400,400"><g id="svgg"><path id="path0" d="M132.275 12.451 C 44.385 23.538,-8.160 114.556,26.293 196.032 C 58.992 273.360,156.192 301.327,223.766 252.852 L 228.220 249.657 241.471 262.791 C 248.759 270.015,254.833 275.989,254.969 276.065 C 255.106 276.142,254.702 277.690,254.072 279.504 C 251.891 285.794,252.311 292.095,255.240 297.015 C 257.108 300.153,340.952 383.672,343.915 385.347 C 369.074 399.567,397.210 373.262,384.835 347.090 C 383.399 344.053,301.573 261.202,296.517 257.666 C 291.643 254.258,284.559 253.111,278.849 254.807 L 276.024 255.646 262.880 242.509 C 255.650 235.284,249.735 229.189,249.735 228.964 C 249.735 228.739,251.136 226.793,252.848 224.638 C 283.547 186.007,289.565 131.293,268.042 86.508 C 243.930 36.334,187.398 5.497,132.275 12.451 M157.448 39.718 C 245.432 48.305,284.285 153.472,222.791 216.590 C 161.408 279.593,55.301 243.913,44.472 156.628 C 36.347 91.143,92.197 33.349,157.448 39.718 " stroke="none" fill="#000000" fill-rule="evenodd"></path></g></svg>
  `;
  }


  return geocoder;
}

function setupMapClickHandler(map, adicionarMarcador) {
  const clickHandler = async (e) => {
    // ⛔ Se o clique veio de uma feature, ignorar
    if (e.originalEvent?.__featureClick) return;

    const { lat, lng } = e.latlng;
    const ping = addMapPing(map, lat, lng);

    try {
      const address = await buscarEnderecoTraduzido(lat, lng);
      adicionarMarcador(lat, lng, address);
    } finally {
      setTimeout(() => {
        if (map.hasLayer(ping)) {
          map.removeLayer(ping);
        }
      }, 2000);
    }
  };

  map.on('click', clickHandler);
  return () => map.off('click', clickHandler);
}

function useMarcadorHandler(map, markersRef, { adicionarAba, reabrirHUD, fecharAba }) {
  return (lat, lng, address) => {
    const chave = gerarChaveLatLng(lat, lng);
    const marker = L.marker([lat, lng]).addTo(map);

    marker.on('click', () => {
      adicionarAba({
        id: chave,
        titulo: address['Cidade'] || address['Município'] || 'Localização',
        dados: {
          properties: { ...address, lat, lng },
          _tituloInterno: '📍 Detalhes da Localização'
        }
      });
      reabrirHUD();
    });

    marker.on('contextmenu', () => {
      map.removeLayer(marker);
      markersRef.current = markersRef.current.filter(m => m !== marker);
      fecharAba?.(chave); // 🔥 fecha aba correspondente
    });

    markersRef.current.push(marker);
  };
}

void HUDWrapper
function HUDWrapper({ abasVisiveis, hudVisivel, abaAtivaId, fecharHUD, fecharAba, setAbaAtivaId }) {
  if (abasVisiveis.length === 0 || !hudVisivel) return null;

  return (
    <DraggablePortalPanel onClose={fecharHUD}>
      <HUDDinamico
        abas={abasVisiveis}
        abaAtivaId={abaAtivaId}
        onClose={fecharAba}
        onAbaChange={setAbaAtivaId}
      />
    </DraggablePortalPanel>
  );
}

function useGeocoderComClick(map, markersRef, adicionarMarcador) {
  useEffect(() => {
    if (!map || !L.Control.Geocoder) return;

    const geocoder = setupGeocoder(map, adicionarMarcador);
    const cleanupClickHandler = setupMapClickHandler(map, adicionarMarcador);

    return () => {
      geocoder.remove();
      cleanupClickHandler();
    };
  }, [map]);
}

