// frontend/src/components/geofiles/GeoFileLoader.jsx

// 📦 Importações fundamentais para o funcionamento do componente

// 🔄 React Hooks essenciais
// - useEffect: gerencia efeitos colaterais (ciclo de vida do componente)
// - useState: gerencia estados reativos (ex: features carregadas)
import { useEffect } from 'react'

// 🗺️ Hook do React-Leaflet que retorna a instância atual do mapa Leaflet
// Permite manipular diretamente métodos e propriedades do mapa
import { useMap } from 'react-leaflet'

// 🧭 Biblioteca Leaflet principal (não apenas React wrapper)
// Necessária para acessar APIs como L.Control, L.Layer, L.DomUtil, etc.
import L from 'leaflet'

// 📦 Biblioteca JSZip: usada para descompactar arquivos KMZ (zip contendo KML)
// Permite leitura direta de buffer binário e extração do XML
import JSZip from 'jszip'

// 🔁 Biblioteca toGeoJSON: converte arquivos KML para o formato GeoJSON
// Essencial para interoperabilidade com Leaflet (que usa GeoJSON nativamente)
import * as toGeoJSON from 'togeojson'

import DraggablePortalPanel from '@components/layout/DraggablePortalPanel';
void DraggablePortalPanel

import HUDDinamico from '@components/layout/HUDDinamico';
void HUDDinamico

import { useHUDManager } from '@hooks/useHUDManager';

// 🧠 Utilitário para extrair imagem de descrição textual (usado nos ícones de ponto)
import { extrairImagemDeFeature } from '@domain/utils/featureImagem'

import { MAPA_CONFIG } from '@domain/config/mapaConfig';

/**
 * 📁 GeoFileLoader
 *
 * Componente React responsável por:
 * - Inicializar o controle de upload no mapa Leaflet (botão + input hidden)
 * - Interpretar arquivos GeoJSON, KML e KMZ
 * - Exibir painel flutuante com os dados importados
 *
 * Funciona como "ponte" entre o DOM (input de arquivo) e o mapa do Leaflet.
 *
 * @component
 * @returns {JSX.Element|null}
 */
export default function GeoFileLoader({ onLayerImported }) {
    const map = useMap();
    const hud = useHUDManager([]);

    useEffect(() => {
        window.__GEOFILE_ON_LAYER_IMPORTED = onLayerImported;
        return () => { delete window.__GEOFILE_ON_LAYER_IMPORTED }
    }, [onLayerImported]);

    useEffect(() => {
        if (!podeIniciarComponente(map)) return;
        inicializarGeoFileControl(
            map,
            (newFeatures, nomeArquivo) => {
                const novas = Array.isArray(newFeatures) ? newFeatures : [newFeatures];
                novas.forEach((feature, i) => {
                    const id = gerarIdFeature(feature, nomeArquivo);

                    const props = feature?.properties || {};
                    const titulo =
                        props.nome ||
                        props.name ||
                        props.NOME ||
                        props.titulo ||
                        props.title ||
                        props.TITULO ||
                        props.TITLE ||
                        feature.id ||      // <-- agora busca na raiz do objeto também!
                        props.id ||
                        props.ID ||
                        props.CODIGO ||
                        props.codigo ||
                        props.descricao ||
                        props.description ||
                        `Feature ${i + 1}`;

                    hud.adicionarAba({
                        id,
                        titulo,
                        dados: feature
                    });
                    hud.setAbaAtivaId(id);
                });
                hud.reabrirHUD();
            },
            () => { } // posição não usada no HUD novo
        );
        return () => limparGeoFileControl(map);
    }, [map]);

    return (
        hud.abasVisiveis.length > 0 && hud.hudVisivel && (
            <DraggablePortalPanel onClose={hud.fecharHUD}>
                <HUDDinamico
                    abas={hud.abasVisiveis}
                    abaAtivaId={hud.abaAtivaId}
                    onClose={hud.fecharAba}
                    onAbaChange={hud.setAbaAtivaId}
                />
            </DraggablePortalPanel>
        )
    );
}

// ===========================================================
// == 🔧 FUNÇÕES AUXILIARES: Inicialização e Teardown
// ===========================================================

/**
 * 🔍 Verifica se o controle já foi adicionado ao mapa
 *
 * Evita múltiplas inicializações em renders subsequentes.
 *
 * @param {L.Map} map - Instância do mapa
 * @returns {boolean}
 */
function podeIniciarComponente(map) {
    return !!map && !map._geoFileControlAdded
}

/**
 * 🚀 Adiciona ao mapa:
 * - Input invisível de upload
 * - Botão de upload no canto do mapa
 * - Listener que envia o arquivo para parsing
 *
 * @param {L.Map} map - Mapa Leaflet
 * @param {Function} setFeatureImportada - Setter para estado com feature
 * @param {Function} setPosicaoTabela - Setter para posição do popup
 */
function inicializarGeoFileControl(map, setFeatureImportada, setPosicaoTabela) {
    map._geoFileControlAdded = true

    const input = criarInputUpload()                     // Cria input <input type="file">
    document.body.appendChild(input)                     // Adiciona ao body (não ao mapa)

    const geoFileControl = criarBotaoUpload(input)       // Cria botão Leaflet
    map.addControl(geoFileControl)                       // Adiciona botão ao mapa

    // 📡 Conecta o input ao handler de arquivo
    input.addEventListener('change', e =>
        handleArquivoSelecionado(e, map, setFeatureImportada, setPosicaoTabela)
    )

    // 🔒 Armazena referências no objeto do mapa (para posterior remoção)
    map._geoInputRef = input
    map._geoFileControlRef = geoFileControl
}

// 🧹 limparGeoFileControl:
// Remove completamente o botão e o input do DOM e do mapa.
// Restaura o estado para permitir reinicialização segura.
function limparGeoFileControl(map) {
    if (map._geoFileLayersControl) {
        map.removeControl(map._geoFileLayersControl)
        delete map._geoFileLayersControl
    }

    document.body.removeChild(map._geoInputRef)     // ❌ Remove input do body.
    map.removeControl(map._geoFileControlRef)       // ❌ Remove botão do mapa.
    map._geoFileControlAdded = false                // 🔄 Permite nova inicialização.
}

//
// == Upload de Arquivo (Input e Botão) ==
// Este módulo adiciona ao mapa um botão "📁" no canto superior esquerdo,
// que aciona um input invisível para importar arquivos georreferenciados.
//

// 📂 criarInputUpload:
// Cria um input <input type="file"> oculto, aceitando os formatos suportados.
// O clique é disparado manualmente via botão externo.
function criarInputUpload() {
    const input = L.DomUtil.create('input', 'leaflet-control-geofile-input')
    input.type = 'file'
    input.accept = MAPA_CONFIG.ACCEPTED_FILE_TYPES;  // ✅ Tipos permitidos
    input.style.display = 'none'                     // 👻 Invisível na interface
    input.multiple = true;                           // documentar
    return input
}

// 🖲️ criarBotaoUpload:
// Cria um botão Leaflet customizado no mapa que aciona o input de upload.
// Estilizado e posicionado como um controle padrão do Leaflet.
function criarBotaoUpload(input) {
    const CustomGeoFileControl = L.Control.extend({
        onAdd: () => {
            const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom upload-toggle-btn');

            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg"
                     width="26" height="26" viewBox="0 0 900 900"
                     style="margin: -2px 0 -6px 0;">
                    <g transform="translate(0,900) scale(0.1,-0.1)" fill="black" stroke="none">
                        <path d="M1580 8931 c-239 -37 -444 -242 -491 -491 -20 -109 -21 -7790 -1
-7890 23 -109 58 -190 119 -272 71 -94 165 -164 288 -213 50 -20 74 -20 2945
-23 1726 -1 2919 1 2955 7 212 32 395 202 469 436 15 45 16 336 16 3032 l0
2981 -25 49 c-18 38 -212 236 -816 839 -1595 1591 -1490 1489 -1567 1526 l-47
23 -1900 1 c-1045 1 -1920 -2 -1945 -5z m3590 -1396 l5 -880 33 -60 c67 -123
174 -199 301 -216 36 -5 470 -8 964 -9 l897 0 0 -2869 0 -2869 -42 -36 -42
-36 -2799 0 -2800 0 -34 26 c-18 14 -40 38 -48 54 -13 26 -15 475 -15 3853 0
4160 -4 3868 56 3908 28 18 68 19 1774 16 l1745 -2 5 -880z"/>
<path d="M4440 6057 c-42 -9 -84 -48 -647 -611 -331 -330 -620 -624 -642 -652
-39 -50 -41 -56 -41 -124 0 -100 46 -176 135 -223 61 -32 176 -30 230 5 22 15
195 182 385 372 190 190 350 346 357 346 10 0 13 -263 15 -1247 3 -958 6
-1256 16 -1284 17 -49 73 -112 124 -139 34 -18 59 -23 121 -23 71 0 82 3 126
33 26 18 63 55 82 83 l34 50 3 1263 c2 976 5 1264 14 1264 7 0 170 -158 363
-350 192 -193 366 -360 385 -372 48 -30 181 -32 225 -3 125 79 175 202 126
308 -14 30 -198 220 -643 664 -343 342 -634 626 -648 631 -47 17 -75 19 -120
9z"/>
                    </g>
                </svg>
            `;
            btn.title = MAPA_CONFIG.UPLOAD_BTN_TITLE;
            btn.onclick = () => input.click();

            L.DomEvent.disableClickPropagation(btn);
            L.DomEvent.disableScrollPropagation(btn);

            return btn;
        }
    });

    return new CustomGeoFileControl({ position: 'topleft' });
}

//
// == Manipulação de Arquivos (Dispatcher + Handlers) ==
// Detecta, valida e despacha arquivos geográficos para o parser correto.
// Suporta GeoJSON, JSON, KML, KMZ. Protege contra formatos não reconhecidos.
//

// 🚦 handleArquivoSelecionado:
// Função principal chamada ao selecionar um arquivo.
// Valida, extrai e despacha para o handler correto.
function handleArquivoSelecionado(e, map, setFeatureImportada, setPosicaoTabela) {
    if (!temTargetComArquivo(e)) return;
    Array.from(e.target.files).forEach(file => {
        const handler = obterHandler(file);
        handler(file, map, setFeatureImportada, setPosicaoTabela);
    });
    e.target.value = ''; // Limpa input para permitir re-upload do mesmo arquivo
}

// ✅ temTargetComArquivo:
// Verifica se o evento contém arquivos válidos.
function temTargetComArquivo(e) {
    return validarEstruturaBasica(e) && validarArquivos(e)
}

// 🔍 validarEstruturaBasica:
// Confere se o evento e o target estão presentes.
function validarEstruturaBasica(e) {
    return ehEventoValido(e) && temTarget(e)
}

// 📁 validarArquivos:
// Confirma se há arquivos e se não estão vazios.
function validarArquivos(e) {
    return temFiles(e) && arquivosNaoVazios(e)
}

// 🧱 ehEventoValido:
function ehEventoValido(e) {
    return !!e
}

// 🧷 temTarget:
function temTarget(e) {
    return !!e.target
}

// 🧾 temFiles:
function temFiles(e) {
    return !!e.target.files
}

// 🔒 arquivosNaoVazios:
function arquivosNaoVazios(e) {
    return e.target.files.length > 0
}

// == 📦 Dispatcher ==

// 🗂️ mapaDeHandlers:
// Mapeia extensões para suas respectivas funções de leitura.
const mapaDeHandlers = {
    geojson: lerGeoJSONFile,
    json: lerGeoJSONFile,
    kml: lerKMLFile,
    kmz: lerKMZFile
}

// 🧭 obterHandler:
// Retorna o handler com base na extensão ou um fallback.
function obterHandler(file) {
    const ext = obterExtensao(file) // 🧪 Ex: "kml"
    return mapaDeHandlers[ext] ?? lidarFormatoNaoSuportado // 🛡️ Fallback seguro.
}

// 🔍 obterExtensao:
// Extrai a extensão do nome do arquivo, em minúsculas.
function obterExtensao(file) {
    return file.name.split('.').pop().toLowerCase()
}

// 🚫 lidarFormatoNaoSuportado:
// Alerta o operador de que o tipo não é aceito.
function lidarFormatoNaoSuportado() {
    alert('Formato de arquivo não suportado')
}

//
// == Parsing de Arquivos GeoJSON, KML, KMZ ==
// Este módulo interpreta e converte arquivos geográficos em dados GeoJSON
// prontos para renderização no Leaflet. Cobre três formatos: GeoJSON, KML e KMZ.
//

// ======= 📁 GeoJSON =======

// 📥 lerGeoJSONFile:
// Lê o arquivo GeoJSON como texto e inicia o parsing.
function lerGeoJSONFile(file, map, setFeatureImportada, setPosicaoTabela) {
    const reader = new FileReader()
    reader.onload = () =>
        tentarParsearGeoJSON(reader.result, file.name, map, setFeatureImportada, setPosicaoTabela)
    reader.readAsText(file)
}

// 🧠 tentarParsearGeoJSON:
// Tenta converter o texto em objeto, limita o número de features e renderiza.
function tentarParsearGeoJSON(texto, nome, map, setFeatureImportada, setPosicaoTabela) {
    try {
        const json = JSON.parse(texto)
        const limitado = limitarFeatures(json) // 🔐 Proteção contra overload.
        renderizarGeoJSON(limitado, map, nome, setFeatureImportada, setPosicaoTabela, window.__GEOFILE_ON_LAYER_IMPORTED)
    } catch (err) {
        lidarComErroDeArquivo(err)
    }
}

// ======= 🧭 KML =======

// 📥 lerKMLFile:
// Lê o conteúdo de um arquivo KML como texto.
function lerKMLFile(file, map, setFeatureImportada, setPosicaoTabela) {
    const reader = new FileReader()
    reader.onload = () =>
        tentarParsearKML(reader.result, file.name, map, setFeatureImportada, setPosicaoTabela)
    reader.readAsText(file)
}

// 🧠 tentarParsearKML:
// Converte o XML para GeoJSON e injeta ícones baseados nos estilos encontrados.
function tentarParsearKML(xmlTexto, nome, map, setFeatureImportada, setPosicaoTabela) {
    try {
        const geojson = converterKMLParaGeoJSONComEstilos(xmlTexto)
        const limitado = limitarFeatures(geojson)
        renderizarGeoJSON(limitado, map, nome, setFeatureImportada, setPosicaoTabela, window.__GEOFILE_ON_LAYER_IMPORTED)
    } catch (err) {
        lidarComErroDeArquivo(err)
    }
}

// 🔄 converterKMLParaGeoJSONComEstilos:
// Transforma o texto XML em DOM, extrai estilos e converte para GeoJSON com ícones injetados.
function converterKMLParaGeoJSONComEstilos(xmlTexto) {
    const xml = parsearXML(xmlTexto)
    const estiloMapeado = mapearEstilosDoKML(xml) // 🖌️ Mapeia estilos <Style>
    const geojson = toGeoJSON.kml(xml)            // 📦 Conversão com toGeoJSON

    geojson.features.forEach(f => injetarIconeNaFeature(f, estiloMapeado))
    return geojson
}

// 🧱 parsearXML:
// Converte string XML para DOM.
function parsearXML(texto) {
    return new DOMParser().parseFromString(texto, 'text/xml')
}

// ======= 🗜️ KMZ =======

// 📥 lerKMZFile:
// Lê um arquivo KMZ como ArrayBuffer para descompactação posterior.
function lerKMZFile(file, map, setFeatureImportada, setPosicaoTabela) {
    const reader = new FileReader()
    reader.onload = () =>
        tentarProcessarKMZ(reader.result, file.name, map, setFeatureImportada, setPosicaoTabela)
    reader.readAsArrayBuffer(file)
}

// 🧠 tentarProcessarKMZ:
// Descompacta o arquivo KMZ, extrai o .kml e converte para GeoJSON.
async function tentarProcessarKMZ(buffer, nome, map, setFeatureImportada, setPosicaoTabela) {
    try {
        const zip = await carregarZip(buffer);
        const kmlText = await extrairTextoKML(zip);
        const xml = new DOMParser().parseFromString(kmlText, 'text/xml');

        // 1. Adiciona GroundOverlay (imagem)
        await adicionarGroundOverlaysDoKMZ(zip, xml, map);

        // 2. Adiciona features vetoriais (GeoJSON)
        const geojson = converterKMLparaGeoJSON(kmlText);

        // 3. Substitui paths de imagens por blobs, se existirem
        await substituirPathsDeImagensPorBlobs(geojson, zip);

        if (geojson && geojson.features && geojson.features.length) {
            const limitado = limitarFeatures(geojson);
            renderizarGeoJSON(limitado, map, nome, setFeatureImportada, setPosicaoTabela, window.__GEOFILE_ON_LAYER_IMPORTED);
        }
    } catch (err) {
        lidarComErroDeArquivo(err);
    }
}



// Função utilitária para substituir paths de imagens por Blob URLs nas properties das features
async function substituirPathsDeImagensPorBlobs(geojson, zip) {
    console.log('[GeoFileLoader] Arquivos no ZIP:', Object.keys(zip.files));

    if (!geojson || !geojson.features) return;

    for (const feature of geojson.features) {
        if (!feature.properties) continue;
        for (const [key, value] of Object.entries(feature.properties)) {
            if (
                /^foto\s*\d*$/i.test(key) ||
                (typeof value === 'string' && /\.(jpg|jpeg|png|gif)$/i.test(value))
            ) {
                const fileInZip = buscarArquivoNoZip(zip, value);
                if (fileInZip) {
                    const blob = await fileInZip.async('blob');
                    const url = URL.createObjectURL(blob);
                    // Não sobrescreve o valor original!
                    feature.properties[`${key}_url`] = url;
                    console.debug('[GeoFileLoader] Imagem encontrada e convertida para blob:', value, url);
                } else {
                    console.warn('[GeoFileLoader] Imagem NÃO encontrada no KMZ:', value);
                }
            }
        }
    }
}

function buscarArquivoNoZip(zip, caminhoRelativo) {
    const arquivos = Object.keys(zip.files);

    // Busca exata
    let encontrado = arquivos.find(f => f === caminhoRelativo);
    if (encontrado) return zip.file(encontrado);

    // Busca ignorando case
    encontrado = arquivos.find(f => f.toLowerCase() === caminhoRelativo.toLowerCase());
    if (encontrado) return zip.file(encontrado);

    // Busca pelo final do caminho (ignora prefixo de pasta)
    encontrado = arquivos.find(f => f.endsWith('/' + caminhoRelativo) || f.endsWith('\\' + caminhoRelativo));
    if (encontrado) return zip.file(encontrado);

    // Busca só pelo nome do arquivo (caso não tenha pasta)
    const nomeArquivo = caminhoRelativo.split('/').pop();
    encontrado = arquivos.find(f => f.split('/').pop() === nomeArquivo);
    if (encontrado) return zip.file(encontrado);

    return null;
}


// 🗜️ carregarZip:
// Usa JSZip para carregar e descompactar o buffer.
async function carregarZip(buffer) {
    return JSZip.loadAsync(buffer)
}

// 🔎 extrairTextoKML:
// Localiza o primeiro arquivo .kml dentro do ZIP e extrai como texto.
async function extrairTextoKML(zip) {
    const kmlFile = encontrarArquivoKML(zip)
    if (!kmlFile) throw new Error('KMZ inválido')
    return zip.files[kmlFile].async('text')
}

// 🧭 encontrarArquivoKML:
// Busca o primeiro arquivo com extensão .kml dentro do ZIP.
function encontrarArquivoKML(zip) {
    return Object.keys(zip.files).find(f => f.endsWith('.kml'))
}

// 🔄 converterKMLparaGeoJSON:
// Conversão direta de texto XML para GeoJSON sem injetar estilos.
function converterKMLparaGeoJSON(kmlText) {
    const xml = new DOMParser().parseFromString(kmlText, 'text/xml')
    return toGeoJSON.kml(xml)
}

//
// == Estilos e Ícones Personalizados ==
// Este módulo interpreta estilos definidos em arquivos KML,
// associa ícones personalizados a features e injeta-os nas propriedades para renderização.
//

// 🗺️ mapearEstilosDoKML:
// Extrai todos os <Style> do XML e monta um mapa { id: href } com ícones encontrados.
function mapearEstilosDoKML(xmlDoc) {
    const mapa = {}
    const estilos = xmlDoc.querySelectorAll('Style')

    estilos.forEach(style => registrarEstilo(style, mapa)) // 🔁 Processa todos os estilos.
    return mapa // 🎯 Retorna mapa de estilos indexado por ID.
}

// 🏷️ registrarEstilo:
// Lê o ID e o href de um <Style> e, se forem válidos, adiciona ao mapa.
function registrarEstilo(style, mapa) {
    const id = extrairIdDoEstilo(style)     // 🆔 Ex: style id="placa1"
    const href = extrairHrefDoEstilo(style) // 🔗 Ex: Icon > href > "icone.png"

    if (estiloValido(id, href)) {
        atribuirEstiloAoMapa(id, href, mapa) // ✅ Armazena no mapa.
    }
}

// 🔍 extrairIdDoEstilo:
// Extrai o atributo "id" do nó <Style>.
function extrairIdDoEstilo(style) {
    return style.getAttribute('id')
}

// 🔗 extrairHrefDoEstilo:
// Acessa o texto de <Icon><href> dentro de um <Style>.
function extrairHrefDoEstilo(style) {
    return style.querySelector('Icon > href')?.textContent
}

// ✅ estiloValido:
// Verifica se tanto o id quanto o href são não-nulos e não vazios.
function estiloValido(id, href) {
    return Boolean(id) && Boolean(href)
}

// 🧭 atribuirEstiloAoMapa:
// Associa um ID de estilo ao seu ícone correspondente no mapa.
function atribuirEstiloAoMapa(id, href, mapa) {
    mapa[id] = href
}

// 🖼️ injetarIconeNaFeature:
// Se a feature tiver styleUrl e ele existir no mapa de estilos,
// injeta o URL como _iconePersonalizado nas propriedades.
function injetarIconeNaFeature(feature, estilos) {
    const styleId = obterStyleId(feature)
    const urlIcone = estilos[styleId]

    if (urlIcone) {
        feature.properties._iconePersonalizado = urlIcone // 🎯 Tag usada na renderização.
    }
}

// 📦 obterStyleId:
// Extrai o styleId da feature, limpando o caractere '#' do início.
function obterStyleId(feature) {
    const props = acessarProperties(feature)
    return extrairStyleUrl(props)
}

// 🔐 acessarProperties:
// Acessa o objeto de propriedades da feature com segurança.
function acessarProperties(f) {
    return temProps(f) ? f.properties : {}
}

// ✅ temProps:
// Verifica se o objeto possui um campo .properties válido.
function temProps(f) {
    return Boolean(f) && Boolean(f.properties)
}

// 🧼 extrairStyleUrl:
// Remove o prefixo "#" do styleUrl (padrão KML) para usar como chave no mapa.
function extrairStyleUrl(props) {
    const raw = props.styleUrl
    return raw ? raw.replace(/^#/, '') : ''
}

//
// == Limitação e Renderização ==
// Este módulo gerencia o volume de dados exibido e executa a renderização controlada
// de camadas GeoJSON, garantindo performance e navegação segura.
//

// 🚦 limitarFeatures:
// Impõe um limite de features por arquivo para evitar travamentos no navegador.
// Se excedido, alerta o usuário e recorta os dados.
function limitarFeatures(geojson) {
    // const LIMITE = 200
    const LIMITE = MAPA_CONFIG.LIMITE_FEATURES_IMPORT;

    if (geojson.features.length > LIMITE) {
        alert(`⚠️ Arquivo muito grande (${geojson.features.length} features).\nApenas as ${LIMITE} primeiras serão carregadas.`)
        geojson.features = geojson.features.slice(0, LIMITE) // ✂️ Recorte seguro.
    }

    return geojson // 🔁 Retorna versão segura do GeoJSON.
}

// 🧭 renderizarGeoJSON:
// Pipeline completo de renderização de GeoJSON no mapa.
// Cria camada, adiciona ao mapa, registra no controle e ajusta a visão.
function renderizarGeoJSON(geojson, map, nomeArquivo, setFeatureImportada, setPosicaoTabela, onLayerImported) {
    const layer = configGeoJSONLayer(geojson, map, setFeatureImportada, setPosicaoTabela) // 🔧 Cria camada com eventos.
    adicionarLayerNoMapa(layer, map, nomeArquivo)                                         // ➕ Adiciona no mapa e no controle.
    ajustarZoomSeguro(map, layer)                                                         // 🔍 Ajusta a visão.

    if (typeof onLayerImported === "function") {
        onLayerImported({
            id: Date.now() + Math.random(),
            name: nomeArquivo,
            leafletLayer: layer,
            type: "vector"
        });
    }
}

// 🔍 ajustarZoomSeguro:
// Tenta ajustar o zoom para exibir toda a camada.
// Protege contra falhas de geometria inválida ou vazia.
function ajustarZoomSeguro(map, layer) {
    try {
        map.fitBounds(layer.getBounds()) // 🧭 Enquadra a camada no mapa.
    } catch (err) {
        console.warn('fitBounds falhou:', err) // 🛑 Diagnóstico leve para falhas não críticas.
    }
}

//
// == Criação de Layers no Mapa ==
// Este módulo transforma um objeto GeoJSON em uma camada Leaflet interativa.
// Possui tratamento especial para pontos: usa ícones personalizados quando disponíveis.
//

// 🧭 configGeoJSONLayer:
// Cria uma camada Leaflet a partir de GeoJSON, com eventos de clique
// e suporte a pontos com ícone ou marcador padrão.
function configGeoJSONLayer(geojson, map, setFeatureImportada, setPosicaoTabela) {
    return L.geoJSON(geojson, {
        onEachFeature: (feature, layer) => {
            layer.on('click', e => {
                const pixel = map.latLngToContainerPoint(e.latlng)
                setFeatureImportada([feature])
                setPosicaoTabela({ x: pixel.x + 20, y: pixel.y })

                if (e.originalEvent) {
                    e.originalEvent.__featureClick = true
                }
            })
        },

        // 🎨 Estilo baseado nas propriedades do arquivo de origem
        style: feature => {
            const props = feature.properties || {}

            return {
                color: props.stroke || MAPA_CONFIG.DEFAULT_POLY_STROKE,
                weight: Number(props['stroke-width']) || MAPA_CONFIG.DEFAULT_POLY_WEIGHT,
                opacity: props['stroke-opacity'] != null ? Number(props['stroke-opacity']) : MAPA_CONFIG.DEFAULT_POLY_OPACITY,
                fillColor: props.fill || MAPA_CONFIG.DEFAULT_POLY_FILL,
                fillOpacity: props['fill-opacity'] != null ? Number(props['fill-opacity']) : MAPA_CONFIG.DEFAULT_POLY_FILL_OPACITY

            }
        },

        // 🧬 Ícones para pontos continuam funcionando
        pointToLayer: (feature, latlng) =>
            criarCamadaParaPonto(feature, latlng, map.getZoom())
    })
}

// 🎯 criarCamadaParaPonto:
// Decide qual tipo de camada criar para um ponto — ícone personalizado ou marcador padrão.
function criarCamadaParaPonto(feature, latlng, zoom) {
    const icon = tentarCriarIcone(feature, zoom)
    return icon
        ? L.marker(latlng, { icon })     // 🖼️ Com ícone
        : criarMarcadorPadrao(latlng)   // 🔵 Fallback padrão
}

// 🔍 tentarCriarIcone:
// Tenta extrair um ícone da descrição da feature.
// Se houver URL de imagem, gera um ícone compatível e limitado em tamanho.
function tentarCriarIcone(feature, zoom) {
    const img = extrairImagemDeFeature(feature);
    if (!img || !img.url) return null;
    return gerarIconeImagem(img.url, zoom, { min: 15, max: 30 });
}


// 🖼️ gerarIconeImagem:
// Cria um ícone do Leaflet a partir de uma URL, com escala ajustada ao zoom atual
// e tamanho máximo definido em MAPA_CONFIG.
// 🖼️ gerarIconeImagem:
// Ajusta tamanho do ícone conforme zoom (dinâmico):
// - Zoom < 8: menor (padrão/cidade)
// - Zoom >= 8 e < 14: escala média (bairro/rua)
// - Zoom >= 14: maior (edifício/ponto de interesse)

function gerarIconeImagem(url, zoom, { min = 15, max = 30 } = {}) {
    let tamanho;
    if (zoom < 6) {
        tamanho = 18;
    } else if (zoom >= 6 && zoom < 10) {
        tamanho = 19;
    } else {
        tamanho = 20;
    }

    // Garante os limites
    tamanho = Math.max(min, Math.min(max, tamanho));

    return L.icon({
        iconUrl: url,
        iconSize: [tamanho, tamanho],
        iconAnchor: [tamanho / 2, tamanho],
        popupAnchor: [0, -tamanho],
        className: 'icone-customizado-da-feature'
    });
}


// 🔵 criarMarcadorPadrao:
// Fallback para exibir ponto como circleMarker com estilo pré-definido.
function criarMarcadorPadrao(latlng) {
    return L.circleMarker(latlng, {
        radius: MAPA_CONFIG.DEFAULT_MARKER_RADIUS,
        fillColor: MAPA_CONFIG.DEFAULT_MARKER_COLOR,
        color: MAPA_CONFIG.DEFAULT_MARKER_STROKE,
        weight: MAPA_CONFIG.DEFAULT_MARKER_WEIGHT,
        opacity: MAPA_CONFIG.DEFAULT_MARKER_OPACITY,
        fillOpacity: MAPA_CONFIG.DEFAULT_MARKER_FILL_OPACITY,
        renderer: L.canvas() // 💨 Melhor performance com muitos pontos.
    })
}

//
// == Registro no Layer Control ==
// Este módulo integra novas camadas geográficas ao painel de controle do Leaflet.
// Cada camada importada é identificada, nomeada e organizada visualmente.
//

// 🧭 adicionarLayerNoMapa:
// Adiciona a camada ao mapa e tenta registrá-la no controle de camadas.
function adicionarLayerNoMapa(layer, map, nomeArquivo) {
    layer.addTo(map) // 🗺️ Exibe imediatamente no mapa.
    tentarRegistrarNoLayerControl(map, nomeArquivo, layer) // 📋 Tenta listar no controle lateral.
}

// 🔍 tentarRegistrarNoLayerControl:
// Verifica se o controle de camadas está presente antes de tentar registrar.
function tentarRegistrarNoLayerControl(map, nomeArquivo, layer) {
    // 🛑 Cria o controle só agora, e garante o título depois
    if (!map._geoFileLayersControl) {
        const controleImportados = L.control.layers(null, {}, {
            collapsed: true,
            position: 'topright'
        }).addTo(map)

        controleImportados.getContainer().classList.add('geo-file-layer-control')
        controleImportados.getContainer().classList.add('import-layer-control')
        map._geoFileLayersControl = controleImportados
    }

    // ✅ Registra camada
    registrarNoLayerControl(map, nomeArquivo, layer)
}

// 🗂️ registrarNoLayerControl:
// Remove extensão do nome, insere título do grupo se necessário e adiciona o overlay.
function registrarNoLayerControl(map, nomeArquivo, layer) {
    const nomeCamada = removerExtensao(nomeArquivo)       // 🧼 Nome limpo.
    adicionarOverlayImportado(map, layer, nomeCamada)     // 📄 Entrada registrada no controle.
}

// 🧽 removerExtensao:
// Remove extensão do nome do arquivo (ex: .geojson, .zip).
function removerExtensao(nomeArquivo) {
    return nomeArquivo.replace(/\.[^/.]+$/, '')
}

// 🏷️ criarTituloCamadas:
// Cria um separador visual com o título do grupo de camadas importadas.
function criarTituloCamadas() {
    const el = L.DomUtil.create('div');
    el.className = 'leaflet-control-layers-imported-header'; // Classe única
    el.innerHTML = MAPA_CONFIG.CAMADAS_IMPORTADAS_LABEL_HTML;
    return el;
}

/**
 * == Registro de Overlays Importados ==
 * Este módulo insere camadas geográficas no controle visual do Leaflet
 * e adiciona, se necessário, um cabeçalho visual agrupador.
 */

// 📥 obterListaOverlays:
// Retorna o container HTML onde ficam os overlays (checkboxes de camadas).
function obterListaOverlays(map) {
    const container = map._geoFileLayersControl.getContainer();
    return container.querySelector('.leaflet-control-layers-overlays');
}

// 🔎 inserirTituloSeFaltando:
// Verifica se já existe um separador/título. Se não, insere no topo da lista.
function inserirTituloSeFaltando(lista) {
    const jaExiste = !!lista.querySelector('.leaflet-control-layers-imported-header');
    if (!jaExiste) {
        const header = criarTituloCamadas();
        lista.insertBefore(header, lista.firstChild);
    }
}

// 🧠 inserirTituloSeNecessario:
// Executa a verificação no contexto do mapa.
function inserirTituloSeNecessario(map) {
    const lista = obterListaOverlays(map);
    if (lista) {
        inserirTituloSeFaltando(lista);
    }
}

// ➕ adicionarOverlayImportado:
// Registra uma nova camada no controle visual de overlays do Leaflet,
// e garante que o título de seção seja inserido (caso ainda não exista).
function adicionarOverlayImportado(map, layer, nomeCamada) {
    map._geoFileLayersControl.addOverlay(layer, `📄 ${nomeCamada}`);

    // ⚙️ Usa setTimeout para aguardar renderização DOM da nova camada
    setTimeout(() => {
        inserirTituloSeNecessario(map);
    }, MAPA_CONFIG.OVERLAY_HEADER_INSERT_DELAY);
}

//
// == Erros ==
// Responsável por interceptar falhas ao carregar arquivos geográficos.
// Fornece feedback ao operador de forma clara e imediata.
//

// ⚠️ lidarComErroDeArquivo:
// Handler simples e direto para erros ao ler arquivos (ex: GeoJSON, shapefile, etc).
// Loga o erro no console e alerta o operador com uma mensagem amigável.
function lidarComErroDeArquivo(err) {
    console.error('Erro ao carregar arquivo:', err)  // 📟 Log técnico para diagnóstico.
    alert('Erro ao ler arquivo geográfico.')         // 📢 Feedback direto ao usuário.
}

//
// == GroundOverlay via KMZ/KML ==
// Este módulo extrai, converte e adiciona imagens de GroundOverlay de arquivos KMZ/KML ao mapa Leaflet.
// As imagens são registradas como camadas no controle de overlays, com suporte a popup informativo ao clicar.
// Suporta tanto imagens internas ao KMZ quanto URLs externas especificadas no KML.
//

/**
 * 🗺️ adicionarGroundOverlaysDoKMZ:
 * Extrai todos os GroundOverlays presentes no XML KML dentro de um arquivo KMZ,
 * resolve suas imagens (internas ou externas) e adiciona como L.imageOverlay no mapa.
 * Cada overlay é também registrado no controle de camadas.
 *
 * @param {JSZip} zip - Instância de JSZip representando o arquivo KMZ descompactado.
 * @param {XMLDocument} xml - Documento XML já parseado do KML.
 * @param {L.Map} map - Instância do mapa Leaflet.
 */
async function adicionarGroundOverlaysDoKMZ(zip, xml, map) {
    const overlays = extrairGroundOverlays(xml);

    for (const overlay of overlays) {
        const nome = overlay.name || 'Imagem KMZ';
        const imgFile = zip.file(overlay.href);

        if (imgFile) {
            // 📦 Caso a imagem esteja embutida no KMZ, gera blob local
            const blob = await imgFile.async('blob');
            const url = URL.createObjectURL(blob);
            criarERegistrarImageOverlay(map, url, overlay.bounds, nome, overlay, window.__GEOFILE_ON_LAYER_IMPORTED);
            console.log('Adicionado GroundOverlay:', url, overlay.bounds);
        } else {
            // 🌐 Caso seja uma URL externa ou não encontrada no ZIP, usa diretamente o href
            criarERegistrarImageOverlay(map, overlay.href, overlay.bounds, nome, overlay, window.__GEOFILE_ON_LAYER_IMPORTED);
            console.log('Tentativa GroundOverlay externa:', overlay.href, overlay.bounds, window.__GEOFILE_ON_LAYER_IMPORTED);
        }
    }
}

/**
 * 🧭 extrairGroundOverlays:
 * Extrai todas as tags <GroundOverlay> do XML do KML, convertendo cada uma
 * para um objeto JS contendo: href da imagem, bounds do overlay e nome descritivo.
 *
 * @param {XMLDocument} xmlDoc - Documento XML do KML.
 * @returns {Array} Lista de overlays extraídos.
 *          Exemplo: [{ href, bounds: [[south, west], [north, east]], name }]
 */
function extrairGroundOverlays(xmlDoc) {
    const overlays = [];
    const nodes = xmlDoc.querySelectorAll('GroundOverlay');

    nodes.forEach(node => {
        const href = node.querySelector('Icon > href')?.textContent;
        const box = node.querySelector('LatLonBox');
        if (!href || !box) return;

        // Converte LatLonBox para bounds no formato Leaflet [[S,W],[N,E]]
        const north = parseFloat(box.querySelector('north')?.textContent || 0);
        const south = parseFloat(box.querySelector('south')?.textContent || 0);
        const east = parseFloat(box.querySelector('east')?.textContent || 0);
        const west = parseFloat(box.querySelector('west')?.textContent || 0);

        overlays.push({
            href,
            bounds: [[south, west], [north, east]],
            name: node.querySelector('name')?.textContent || ''
        });
    });

    return overlays;
}

/**
 * 🖼️ criarERegistrarImageOverlay:
 * Cria uma camada L.imageOverlay a partir da URL/bounds especificados, adiciona ao mapa,
 * faz zoom automático para a área da imagem, e registra um popup customizado para click (exceto drag).
 * O overlay também é integrado ao controle visual de camadas.
 *
 * @param {L.Map} map - Instância do mapa Leaflet.
 * @param {string} url - URL da imagem (local ou remota).
 * @param {Array} bounds - Limites da imagem no formato [[S,W],[N,E]].
 * @param {string} nome - Nome a ser exibido na camada e popup.
 * @param {Object} info - Informações adicionais (ex: href original).
 * @returns {L.ImageOverlay} A camada criada.
 */
function criarERegistrarImageOverlay(map, url, bounds, nome, info = {}, onLayerImported) {
    const overlayLayer = L.imageOverlay(url, bounds, { opacity: 0.55 });
    overlayLayer.addTo(map);

    // Centraliza o mapa nos bounds do overlay após adicionar
    map.fitBounds(bounds);

    // Lógica para detectar drag vs. click na imagem
    let downPoint = null;

    overlayLayer.once('load', function () {
        const img = overlayLayer.getElement();
        if (img) {
            img.style.pointerEvents = 'auto';

            img.addEventListener('mousedown', function (e) {
                downPoint = { x: e.clientX, y: e.clientY };
            });

            img.addEventListener('mouseup', function (e) {
                img._lastMouseUp = { x: e.clientX, y: e.clientY };
            });

            img.addEventListener('click', function (e) {
                // Ignora caso seja drag (movimento maior que 5px)
                if (downPoint) {
                    const dx = Math.abs(e.clientX - downPoint.x);
                    const dy = Math.abs(e.clientY - downPoint.y);
                    if (dx > 5 || dy > 5) return; // Foi drag!
                }
                e.stopPropagation();
                const containerPoint = L.DomEvent.getMousePosition(e, map.getContainer());
                const latlng = map.containerPointToLatLng(containerPoint);

                // Exibe popup ao clicar sobre a imagem
                L.popup()
                    .setLatLng(latlng)
                    .setContent(`
                      <b>${nome || 'Imagem Overlay'}</b><br>
                      <small>Bounds:</small><br>
                      ${bounds.map(b => b.join(',')).join('<br>')}
                      ${info.href ? `<br><small>Arquivo:</small> ${info.href}` : ''}
                    `)
                    .openOn(map);
            });
        }
    });

    // Registra a camada no controle visual de overlays
    adicionarLayerNoMapa(overlayLayer, map, nome || 'Imagem Overlay');

    // Notifica o React do layer criado!
    if (typeof onLayerImported === "function") {
        onLayerImported({
            id: Date.now() + Math.random(), // ou use algum id mais sofisticado,
            name: nome || 'Imagem Overlay',
            leafletLayer: overlayLayer,
            type: "image"
        });
    }

    return overlayLayer;
}

/**
 * 
 */

function gerarIdFeature(feature, nomeArquivo = '') {
    if (feature.id) return feature.id;
    if (feature.properties?.id) return feature.properties.id;
    if (feature.properties?.CODIGO) return feature.properties.CODIGO;
    if (feature.properties?.nome) return feature.properties.nome;
    // Se só tem uma feature, use o nome do arquivo
    if (nomeArquivo) return `feature-${nomeArquivo}`;
    // Fallback: hash simples da geometria
    return btoa(JSON.stringify(feature.geometry)).slice(0, 12);
}