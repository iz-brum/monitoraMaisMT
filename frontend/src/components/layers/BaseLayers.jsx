// src/components/mapa/BaseLayers.jsx

// 📦 React Hooks
import { useEffect, useRef } from 'react';

import { BASE_LAYERS } from '@domain/config/mapaConfig';

// 🌍 Componentes de controle de camadas do Leaflet via react-leaflet
import {
  LayersControl,   // Componente pai que encapsula múltiplas camadas base/overlay
  TileLayer,       // Representa um tile de mapa (como OSM, Esri, etc.)
  LayerGroup,      // Agrupa múltiplas camadas como se fosse uma única
  WMSTileLayer,
  useMap           // Hook para acessar o mapa atual (instância Leaflet)
} from 'react-leaflet';

// 📌 Declarações void apenas para evitar warnings de imports não utilizados diretamente
void LayersControl, TileLayer, LayerGroup, WMSTileLayer, useMap;

// 🧱 Leaflet base (para acesso direto a APIs de baixo nível, como DOMUtil)
import L from 'leaflet';
void L; // Manter L visível para bundlers/linters


/** 
 * Desestruturação do componente `BaseLayer` a partir do `LayersControl` do React-Leaflet.
 * Esse componente representa uma camada base (ex: mapas de fundo como satélite ou OSM),
 * e deve ser usado dentro de `<LayersControl>` para permitir alternância entre múltiplas bases.
 */
const { BaseLayer } = LayersControl;
void BaseLayer; // Garante que o símbolo seja mantido no bundle final (uso implícito)

/**
 * ============================
 * == Utilitários DOM/Controle ==
 * ============================
 * Estas funções oferecem compatibilidade entre diferentes formatos de acesso
 * aos containers dos controles do Leaflet (via React-Leaflet ou API nativa).
 */

/**
 * Verifica se o controle fornecido contém um elemento interno do Leaflet.
 * @param {any} controle - Referência potencialmente enriquecida com leafletElement
 * @returns {boolean} Verdadeiro se contém um leafletElement válido
 */
function temLeafletElement(controle) {
  return !!controle?.leafletElement;
}

/**
 * Verifica se o elemento do Leaflet possui o método getContainer().
 * @param {any} controle - Controle do Leaflet
 * @returns {boolean} Se é possível extrair um container do elemento interno
 */
function temLeafletContainer(controle) {
  return temLeafletElement(controle) &&
    typeof controle.leafletElement.getContainer === 'function';
}

/**
 * Verifica se o controle tem um método getContainer direto (sem usar leafletElement).
 * @param {any} controle - Objeto controle possivelmente customizado
 * @returns {boolean} Se o controle já expõe getContainer diretamente
 */
function temContainerDireto(controle) {
  return controle?.getContainer;
}

/**
 * Resolve o container DOM via elemento interno do Leaflet.
 * Útil para controles integrados via react-leaflet.
 * @param {any} controle
 * @returns {HTMLElement|null} Container do controle
 */
function resolveLeafletContainer(controle) {
  return temLeafletContainer(controle)
    ? controle.leafletElement.getContainer()
    : null;
}

/**
 * Resolve o container diretamente (fallback para casos fora do react-leaflet).
 * @param {any} controle
 * @returns {HTMLElement|null}
 */
function resolveDiretoContainer(controle) {
  return temContainerDireto(controle)
    ? controle.getContainer()
    : null;
}

/**
 * Tenta resolver o container DOM do controle, considerando todas as estratégias conhecidas.
 * @param {any} controle - Controle de camadas, botão ou similar
 * @returns {HTMLElement|null} Elemento DOM do container
 */
function resolveContainer(controle) {
  return resolveLeafletContainer(controle)
    ?? resolveDiretoContainer(controle);
}

/**
 * Interface segura para extrair o container do controle.
 * Retorna null se o controle for inválido.
 * @param {any} controle
 * @returns {HTMLElement|null}
 */
function obterContainerDeControle(controle) {
  return controle ? resolveContainer(controle) : null;
}

/**
 * Aplica uma classe CSS personalizada ao container do controle.
 * Permite estilização específica via CSS externo (ex: `.base-layer-control`)
 * @param {any} controle - Controle alvo para estilização
 */
function aplicarEstiloAoContainer(controle) {
  const container = obterContainerDeControle(controle);
  if (container) {
    container.classList.add('base-layer-control'); // 📌 Classe para custom styling
  }
}

/**
 * ✅ Verifica se o controle pode ser atribuído ao mapa Leaflet.
 *
 * @param {L.Map} map - Instância do mapa Leaflet.
 * @param {Object} controle - Controle do Leaflet (ex: LayersControl).
 * @returns {boolean} Retorna `true` se ambos `map` e `controle` estiverem definidos.
 *
 * 🔒 Utilizado como medida de segurança antes de atribuir o controle ao mapa,
 * evitando exceções por objetos indefinidos.
 */
const podeAtribuirControle = (map, controle) => Boolean(map && controle);

// ===================
// == Componente principal: BaseLayers
// ===================

/**
 * Componente React que injeta o controle de camadas base no mapa Leaflet.
 *
 * Este painel permite ao usuário alternar entre diferentes estilos de mapa (tiles),
 * como OpenStreetMap, Satélite e variações visuais (claro/escuro).
 *
 * Também garante que o controle seja acessível externamente via `map._layersControl`
 * e aplica uma classe customizada para permitir personalização visual via CSS.
 *
 * @returns {JSX.Element} LayersControl configurado com múltiplas opções de base layer.
 */
export default function BaseLayers() {
  const map = useMap();                  // 🌐 Hook do Leaflet para obter o mapa atual
  const layersControlRef = useRef();     // 🧭 Referência ao controle de camadas

  // 🎯 Efeito de inicialização para conectar o controle ao mapa e estilizar
  useEffect(() => {
    const controle = layersControlRef.current;

    // 🛡️ Evita erros caso mapa ou controle não estejam disponíveis
    if (!podeAtribuirControle(map, controle)) return;

    // 🔗 Expõe o controle dentro do objeto `map` para uso externo (ex: via `map._layersControl`)
    map._layersControl = controle;

    // 🎨 Aplica uma classe CSS ao container do controle para customização visual
    aplicarEstiloAoContainer(controle);
  }, [map]);

  return (
    <LayersControl ref={layersControlRef} position="topright">
      {BASE_LAYERS.map(layer =>
        layer.type === 'tile' ? (
          <BaseLayer
            key={layer.key}
            name={layer.name}
            checked={layer.checked}
          >
            <TileLayer
              url={layer.url}
              attribution={layer.attribution}
              maxZoom={layer.maxZoom}
            />
          </BaseLayer>
        ) : (
          <BaseLayer key={layer.key} name={layer.name}>
            <LayerGroup>
              {layer.urls.map((url, i) => (
                <TileLayer
                  key={i}
                  url={url}
                  attribution={layer.attribution}
                  maxZoom={layer.maxZoom}
                />
              ))}
            </LayerGroup>
          </BaseLayer>
        )
      )}
    </LayersControl>
  );
}
