// src/components/layers/atualizarCamadasFocos.js

// 🧭 Importa o módulo principal da biblioteca Leaflet
// Isso permite acesso direto às APIs fundamentais para manipulação de:
// - camadas (Layer, LayerGroup)
// - controles de mapa (Control, DomUtil)
// - geometrias (LatLng, Bounds, etc.)
// É essencial para construir, atualizar ou remover camadas personalizadas de focos de calor.
import L from 'leaflet';

//
// == Interface pública ==
// Estas funções são acessíveis externamente. Elas coordenam atualizações no sistema visual
// de camadas e controles do mapa, com segurança e clareza.
//

/**
 * 🔁 Atualiza visualmente as camadas de focos no mapa.
 *
 * Função pública principal — deve ser chamada quando:
 * - Há mudança nos dados (novos focos).
 * - Há alteração no modo de visualização (cluster ou simples).
 *
 * @param {Object} deps - Dependências e estado atual do mapa e focos.
 */
export function atualizarCamadasFocos(deps) {
    if (!podeAtualizarMapa(deps)) return; // 🔒 Filtro de segurança: evita renderização desnecessária.
    executarAtualizacao(deps);            // 🧠 Orquestra o redesenho dos marcadores e clusters.
}

/**
 * 🔘 Atualiza o botão de modo de visualização.
 *
 * Altera o texto do botão (Cluster ↔ Simples) com base no estado atual `useCluster`.
 *
 * @param {Object} controlRef - Referência ao controle de camadas.
 * @param {boolean} useCluster - Estado atual do modo de visualização.
 */
export function atualizarBotao(controlRef, useCluster) {
    const btn = obterBotaoModo(controlRef);   // 🎯 Busca o botão de alternância.
    if (!btn) return;                         // 🚫 Botão não disponível no DOM — ignora com segurança.
    definirTextoDoBotao(btn, useCluster);     // 🔄 Atualiza o texto visível com base no estado atual.
}

//
// == Etapas principais ==
// Estas funções orquestram a atualização visual das camadas de focos no mapa.
// São chamadas internas pela interface pública.

/**
 * 🔐 Valida se o mapa e os focos estão disponíveis.
 *
 * Previne execução desnecessária do processo de atualização visual.
 *
 * @param {Object} deps - Deve conter { map, focos }
 * @returns {boolean} true se o mapa estiver pronto e houver focos.
 */
function podeAtualizarMapa({ map, focos }) {
    return map && focos.length > 0;
}

/**
 * 🧠 Processo completo de atualização das camadas de focos.
 *
 * Etapas:
 * 1. Limpa camadas anteriores
 * 2. Adiciona novos focos (como marcadores interativos)
 * 3. Aplica agrupamento (cluster) ou exibição simples
 * 4. Atualiza o botão de alternância
 * 5. Garante que a camada proxy está visível no mapa
 *
 * @param {Object} deps - Conjunto completo de refs e estados do mapa
 */
function executarAtualizacao({
    map,
    focos,
    useCluster,
    clusterGroupRef,
    markerLayerRef,
    proxyLayerRef,
    highlightLayerRef,
    controlRef,
    setFocosSelecionados,
    setPosicaoTabela,
    setHighlightData
}) {
    // 🧹 Etapa 1: Remove camadas antigas — sem resíduos visuais.
    limparCamadas(map, clusterGroupRef, markerLayerRef, proxyLayerRef);

    // 🔥 Etapa 2: Injeta novos focos no mapa com interações.
    adicionarFocos(
        focos,
        map,
        markerLayerRef,
        highlightLayerRef,
        setFocosSelecionados,
        setPosicaoTabela,
        setHighlightData
    );

    // 🔄 Etapa 3: Decide se deve agrupar ou mostrar simples, e aplica no proxy.
    aplicarClusterOuSimples(useCluster, clusterGroupRef, markerLayerRef, proxyLayerRef);

    // 🖲️ Etapa 4: Atualiza texto do botão de modo (Cluster/Simples).
    atualizarBotao(controlRef, useCluster);

    // ✅ Etapa 5: Garante que a camada proxy está visível no mapa.
    garantirLayerAdicionado(map, proxyLayerRef);
}

//
// == Manipulação de camadas ==
// Estas funções atuam diretamente nas camadas do Leaflet,
// realizando limpeza, injeção e organização dos marcadores.
//

/**
 * 🧹 Remove todas as camadas de marcadores do mapa e limpa seus conteúdos.
 *
 * Utilizada antes de qualquer re-renderização de focos para evitar sobreposição visual ou dados antigos.
 *
 * @param {L.Map} map - Instância do mapa Leaflet
 * @param {Object} clusterRef - Ref para o grupo de clusters
 * @param {Object} markerRef - Ref para camada de marcadores simples
 * @param {Object} proxyRef - Ref para camada intermediária usada para alternância de modo
 */
function limparCamadas(map, clusterRef, markerRef, proxyRef) {
    const clusterGroup = clusterRef.current;
    const markerLayer = markerRef.current;
    const proxyLayer = proxyRef.current;

    map.removeLayer(clusterGroup);    // ❌ Remove cluster group da tela
    map.removeLayer(markerLayer);     // ❌ Remove camada de marcadores

    proxyLayer.clearLayers();         // ♻️ Limpa proxy intermediário
    clusterGroup.clearLayers();       // ♻️ Limpa todos os clusters
    markerLayer.clearLayers();        // ♻️ Limpa todos os marcadores
}

/**
 * 🔥 Adiciona focos como marcadores interativos no mapa.
 *
 * Cria um marker para cada foco e injeta na camada de marcadores.  
 * Cada marker possui evento de clique com destaque visual.
 *
 * @param {Array} focos - Lista de objetos de foco contendo lat/lng
 * @param {L.Map} map - Instância do Leaflet
 * @param {Object} markerLayerRef - Ref para camada de marcadores
 * @param {Object} highlightLayerRef - Ref para camada de destaque visual
 * @param {Function} setFocosSelecionados - Setter para estado de seleção
 * @param {Function} setPosicaoTabela - Setter para posição da tabela flutuante
 */
function adicionarFocos(focos, map, markerLayerRef, highlightLayerRef, setFocosSelecionados, setPosicaoTabela, setHighlightData) {
    // Se recebeu só 1 foco e ele é dummy, adiciona marker invisível e sai
    if (focos.length === 1 && focos[0]._dummy) {
        const dummy = L.circleMarker([0, 0], { radius: 1, opacity: 0, fillOpacity: 0, interactive: false });
        markerLayerRef.current.addLayer(dummy);
        return;
    }

    focos.forEach(foco => {
        const marker = criarMarker(
            foco,
            focos,
            map,
            highlightLayerRef,
            setFocosSelecionados,
            setPosicaoTabela,
            setHighlightData
        );
        markerLayerRef.current.addLayer(marker); // ➕ Insere no mapa
    });
}

/**
 * 🔀 Aplica dinamicamente o modo "Cluster" ou "Simples" nos focos.
 *
 * Decide como a camada proxy será organizada de acordo com `useCluster`.
 * O proxyLayer é a camada intermediária exibida no controle de camadas.
 *
 * @param {boolean} useCluster - Se true, ativa modo agrupado
 * @param {Object} clusterRef - Ref para grupo de clusters
 * @param {Object} markerRef - Ref para camada de marcadores
 * @param {Object} proxyRef - Ref para camada proxy intermediária
 */
function aplicarClusterOuSimples(useCluster, clusterRef, markerRef, proxyRef) {
    const clusterGroup = clusterRef.current;
    const markerLayer = markerRef.current;
    const proxyLayer = proxyRef.current;

    if (useCluster) {
        clusterGroup.addLayer(markerLayer);     // 🧲 Envolve marcadores num cluster
        proxyLayer.addLayer(clusterGroup);      // 🎯 Exibe o grupo
    } else {
        proxyLayer.addLayer(markerLayer);       // 🔓 Exibe marcadores diretamente
    }
}

/**
 * ✅ Garante que a camada proxy esteja visível no mapa.
 *
 * Necessária quando o mapa pode ter sido limpo ou reinicializado.
 *
 * @param {L.Map} map - Instância do mapa Leaflet
 * @param {Object} proxyRef - Ref para camada intermediária de focos
 */
function garantirLayerAdicionado(map, proxyRef) {
    const proxyLayer = proxyRef.current;
    if (!map.hasLayer(proxyLayer)) {
        map.addLayer(proxyLayer); // 🚀 Adiciona se estiver ausente
    }
}

/**
 * 📏 Converte um raio em metros para área em km².
 *
 * Área = π * r², depois convertida de m² para km².
 * Usada para fins de visualização ou estatísticas.
 *
 * @param {number} raio - Raio em metros
 * @returns {string} Área formatada com 2 casas decimais (pt-BR)
 */
export function formatAreaKm2(raio) {
    const areaKm2 = (Math.PI * raio * raio) / 1_000_000;
    return areaKm2.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
void formatAreaKm2 // Evita warning de função exportada não usada

//
// == Criação de marcador ==
// Cada marcador representa um foco de calor no mapa Leaflet.
// Ao ser clicado, ele:
// - Calcula os focos próximos
// - Gera um círculo de destaque visual
// - Atualiza o texto do painel flutuante
// - Posiciona o componente de detalhes de forma precisa
//

/**
 * 🔴 Cria um marcador interativo para representar um foco de calor.
 *
 * Cada marcador é um círculo laranja/vermelho com evento de clique:
 * - Agrupa focos próximos
 * - Calcula centro e raio de influência
 * - Atualiza a camada de destaque (highlight)
 * - Posiciona o painel de detalhes no mapa
 *
 * @param {Object} foco - Objeto representando o foco atual (latitude, longitude, etc.)
 * @param {Array<Object>} focos - Lista completa de focos renderizados
 * @param {L.Map} map - Instância do mapa Leaflet
 * @param {Object} highlightLayerRef - Ref para a camada de destaque visual (círculo)
 * @param {Function} setFocosSelecionados - Setter para o estado de focos agrupados
 * @param {Function} setPosicaoTabela - Setter para coordenadas da tabela flutuante
 * @returns {L.CircleMarker} Instância do marcador configurado
 */
function criarMarker(foco, focos, map, highlightLayerRef, setFocosSelecionados, setPosicaoTabela, setHighlightData) {
    const { latitude, longitude } = foco;

    const marker = L.circleMarker([latitude, longitude], {
        radius: 3,
        color: 'red',
        fillColor: 'yellow',
        fillOpacity: 1,
        weight: 2
    });

    marker.on('click', e => {
        L.DomEvent.stopPropagation(e);

        const multiSelect = e.originalEvent.ctrlKey || e.originalEvent.metaKey;

        setFocosSelecionados(prev => {
            const centro = L.latLng(latitude, longitude); // centro do clique
            const multiSelect = e.originalEvent.ctrlKey || e.originalEvent.metaKey;

            // Raio de seleção dinâmico
            const raio = multiSelect ? 2000 : 1000;

            // Filtros: encontra todos os focos dentro do raio
            const novosFocosSelecionados = focos.filter(f =>
                map.distance(centro, L.latLng(f.latitude, f.longitude)) <= raio
            );

            // Combina com os anteriores se for múltipla seleção
            const novaSelecao = multiSelect
                ? [...prev, ...novosFocosSelecionados].filter(
                    (value, index, self) =>
                        self.findIndex(
                            f => f.latitude === value.latitude && f.longitude === value.longitude
                        ) === index
                ) // remove duplicados
                : novosFocosSelecionados;

            // Recalcula centro e raio real da nova seleção
            const centroFinal = calcularCentro(novaSelecao);
            const raioFinal = novaSelecao.length <= 1 ? 1000 : calcularRaioDinamico(novaSelecao, map);

            // Atualiza círculo de destaque
            highlightLayerRef.current.clearLayers();
            const circulo = L.circle(centroFinal, {
                radius: raioFinal,
                color: '#8A2BE2',
                weight: 2,
                fillOpacity: 0.25,
                fillColor: '#8A2BE2'
            });
            highlightLayerRef.current.addLayer(circulo);
            map.addLayer(highlightLayerRef.current);

            // Atualiza texto no header
            setTimeout(() => {
                const headerStrong = document.querySelector('.foco-header strong');
                if (headerStrong) {
                    headerStrong.textContent = `Focos de calor (${novaSelecao.length}) – Área: ${formatAreaKm2(raioFinal)} km²`;
                }
            }, 0);

            // Posiciona painel com base no centro final
            const pixel = map.latLngToContainerPoint(centroFinal);
            setPosicaoTabela({ x: pixel.x + 20, y: pixel.y });

            setHighlightData({
                centro: centroFinal,
                raio: raioFinal,
                focos: novaSelecao
            });

            return novaSelecao;
        });

    });

    return marker;
}

/**
 * 📌 Calcula o centroide (ponto médio) de um conjunto de focos.
 *
 * Soma todas as latitudes e longitudes e divide pelo total.
 *
 * @param {Array<Object>} focos - Lista de focos com latitude/longitude
 * @returns {L.LatLng} Centro geográfico aproximado
 */
function calcularCentro(focos) {
    const lat = focos.reduce((sum, f) => sum + f.latitude, 0) / focos.length;
    const lng = focos.reduce((sum, f) => sum + f.longitude, 0) / focos.length;
    return L.latLng(lat, lng);
}

/**
 * 📏 Calcula o raio visual dinâmico em metros com base na dispersão dos focos.
 *
 * Mede a distância entre o centro do grupo e o ponto mais distante,
 * e adiciona um buffer de 1km para garantir clareza visual.
 *
 * @param {Array<Object>} focos - Lista de focos
 * @param {L.Map} map - Instância do Leaflet para cálculo geodésico
 * @returns {number} Raio em metros
 */
function calcularRaioDinamico(focos, map) {
    if (!focos.length) return 1000;

    const centro = calcularCentro(focos);

    const maxDist = focos.reduce((max, f) => {
        const d = map.distance(centro, [f.latitude, f.longitude]);
        return d > max ? d : max;
    }, 0);

    return maxDist + 1000; // Buffer extra para visualização
}

//
// == Botão: alternância de texto ==
// Este bloco controla a visibilidade e o conteúdo do botão de alternância de modo de visualização dos focos.
// Ele atua diretamente no DOM, dentro do container do controle de camadas do Leaflet.
//

/**
 * 🖊️ Atualiza o texto interno do botão de alternância.
 *
 * O botão permite que o usuário escolha entre visualização em modo "Cluster" (agrupado)
 * ou "Simples" (cada marcador individual). O texto serve como feedback e controle direto.
 *
 * @param {HTMLElement} botao - Referência ao elemento de botão no DOM
 * @param {boolean} useCluster - Estado atual: true para modo agrupado
 */
function definirTextoDoBotao(botao, useCluster) {
    botao.innerHTML = useCluster ? 'Cluster' : 'Simples'; // 🔁 Atualiza o texto conforme o modo ativo
}

/**
 * 🔍 Localiza o botão de alternância no container do controle Leaflet.
 *
 * Busca o botão responsável por trocar o modo de visualização no painel de camadas.
 * Opera com segurança: retorna `null` se o botão ou container não existir.
 *
 * @param {Object} controlRef - Referência React/Leaflet para o controle de camadas
 * @returns {HTMLElement|null} - Elemento do botão encontrado, ou null
 */
function obterBotaoModo(controlRef) {
    const container = obterContainer(controlRef); // 🧱 Busca o container DOM do controle Leaflet
    if (!container) return null;                 // 🚫 Evita erro se o controle ainda não está montado
    return obterBotaoToggle(container);          // 🎯 Retorna o botão DOM com a classe `.toggle-mode`
}

//
// == Utils DOM / refs ==
// 🔧 Utilitários para acesso e validação de referências (refs) e elementos do DOM.
//
// Estas funções são fundamentais para interagir com a estrutura do Leaflet dentro de React,
// garantindo segurança, clareza e robustez no acesso a containers e elementos.
//

/**
 * 🎯 Localiza o botão de alternância (.toggle-mode) dentro de um container DOM.
 *
 * @param {HTMLElement|null} container - Elemento HTML esperado como container
 * @returns {HTMLElement|null} - Botão encontrado ou null se não for possível acessar
 */
function obterBotaoToggle(container) {
    return podeSelecionar(container)
        ? container.querySelector('.toggle-mode') // 🔍 Busca pelo seletor CSS
        : null;                                   // ⚠️ Fallback seguro se container inválido
}

/**
 * 📦 Acessa o DOM container de um controle Leaflet a partir de uma ref React.
 *
 * Verifica se a ref está populada, e se seu objeto possui o método `getContainer()`.
 * Essa abordagem protege contra erros em ciclos de montagem e render.
 *
 * @param {Object} ref - Ref React com controle Leaflet
 * @returns {HTMLElement|null} - Container DOM ou null
 */
function obterContainer(ref) {
    const current = obterCurrentRef(ref);       // 🧲 Ref segura
    if (!temGetContainer(current)) return null; // 🚫 Protege contra acessos inválidos
    return current.getContainer();              // ✅ Retorna container se tudo estiver correto
}

/**
 * 🧼 Extrai .current da ref somente se estiver definida e válida.
 *
 * @param {Object} ref - Ref React
 * @returns {any|null} - Valor armazenado em .current ou null
 */
function obterCurrentRef(ref) {
    return refValido(ref) ? ref.current : null;
}

/**
 * ✅ Verifica se a ref React está corretamente definida.
 *
 * @param {any} ref - Objeto de ref
 * @returns {boolean} - true se a ref existe e está populada
 */
function refValido(ref) {
    return !!ref && !!ref.current;
}

/**
 * 🧠 Verifica se um objeto possui o método `getContainer()`.
 * Usado para checar se o objeto implementa a interface esperada de controle Leaflet.
 *
 * @param {any} obj - Objeto que pode ou não ser um controle Leaflet
 * @returns {boolean} - true se possui getContainer()
 */
function temGetContainer(obj) {
    return obj && typeof obj.getContainer === 'function';
}

/**
 * 🧬 Valida se um elemento DOM é capaz de realizar buscas com querySelector.
 *
 * @param {any} el - Elemento DOM
 * @returns {boolean} - true se for um Node com método querySelector
 */
function podeSelecionar(el) {
    return !!el && typeof el.querySelector === 'function';
}
