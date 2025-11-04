// src/shared/leaflet/leafletControlToggleHelpers.js

import L from 'leaflet';

const estados = {
    focos: {
        toggleTimeoutId: null,
        mutationObserver: null,
        currentControlRef: null,
        currentState: null,
    },
    ana: {
        toggleTimeoutId: null,
        mutationObserver: null, 
        currentControlRef: null,
        currentState: null,
    }
};

/**
 * 🔁 prepararToggle
 * Injeta dinamicamente o botão de alternância de modo (Cluster vs Simples) dentro do controle do Leaflet.
 * Agora com MutationObserver para detectar mudanças no DOM e recriar o botão automaticamente.
 */
export function prepararToggle(map, controlRef, useCluster, proxyRef, setUseCluster, tipo = 'focos') {
    const estado = estados[tipo];
    
    // Salva o estado atual para o observer
    estado.currentControlRef = controlRef;
    estado.currentState = { map, useCluster, proxyRef, setUseCluster };

    // ✅ USA O ESTADO ESPECÍFICO
    if (estado.toggleTimeoutId) {
        clearTimeout(estado.toggleTimeoutId);
    }

    estado.toggleTimeoutId = setTimeout(() => {
        prepararToggleInterno(map, controlRef, useCluster, proxyRef, setUseCluster);
        setupMutationObserver(controlRef, tipo); // ✅ PASSA O TIPO
        estado.toggleTimeoutId = null;
    }, 100);
}

/**
 * 🔍 setupMutationObserver
 * Configura o observer para detectar mudanças no DOM do controle e recriar o botão
 */
function setupMutationObserver(controlRef, tipo) {
    const estado = estados[tipo]; // ✅ OBTÉM O ESTADO CORRETO
    
    // ✅ USA O ESTADO ESPECÍFICO
    if (estado.mutationObserver) {
        estado.mutationObserver.disconnect();
    }

    const container = obterContainerSeguro(controlRef);
    if (!container) return;

    estado.mutationObserver = new MutationObserver((mutations) => {
        let shouldRecreateButton = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const label = container.querySelector('.leaflet-control-layers-overlays label');
                const existingButton = label?.querySelector('.toggle-mode');

                if (label && !existingButton) {
                    shouldRecreateButton = true;
                }
            }
        });

        // ✅ USA O ESTADO ESPECÍFICO
        if (shouldRecreateButton && estado.currentState) {
            // console.log(`🔄 MutationObserver (${tipo}) detectou mudanças, recriando botão...`);
            setTimeout(() => {
                prepararToggleInterno(
                    estado.currentState.map,
                    estado.currentControlRef,
                    estado.currentState.useCluster,
                    estado.currentState.proxyRef,
                    estado.currentState.setUseCluster
                );
            }, 50);
        }
    });

    // ✅ USA O ESTADO ESPECÍFICO
    estado.mutationObserver.observe(container, {
        childList: true,
        subtree: true
    });
}

/**
 * 🔁 prepararToggleInterno
 * Função interna que executa a lógica de preparação do toggle com verificações robustas.
 */
function prepararToggleInterno(map, controlRef, useCluster, proxyRef, setUseCluster) {
    // console.log('🔄 Preparando toggle com useCluster:', useCluster);

    const label = encontrarLabel(controlRef);
    if (!label) {
        console.warn('⚠️ Label não encontrado');
        return;
    }

    // Verifica se o botão já existe e tem o texto correto
    const btnExistente = label.querySelector('.toggle-mode');
    if (btnExistente) {
        const textoAtual = btnExistente.innerHTML;
        const textoEsperado = useCluster ? 'Cluster' : 'Simples';

        if (textoAtual === textoEsperado) {
            // console.log('✅ Botão já existe com texto correto, pulando recreação');
            return;
        }

        // console.log('🔄 Atualizando texto do botão existente');
        btnExistente.innerHTML = textoEsperado;
        return;
    }

    // Só cria um novo botão se não existir
    // console.log('🆕 Criando novo botão');
    const btn = criarBotaoAlternancia(useCluster);
    btn.style.marginLeft = '16px';
    btn.style.padding = '2px 8px';
    btn.style.borderRadius = '4px';
    btn.style.border = '1px solid #bbb';
    btn.style.background = '#fff';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '12px';
    btn.style.opacity = '0.95';

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!map.hasLayer(proxyRef.current)) return;
        // console.log('👆 Clique no botão, alterando de:', useCluster, 'para:', !useCluster);
        setUseCluster(prev => !prev);
    });

    label.appendChild(btn);
}


/**
 * Extrai o valor `.current` de uma ref do React.
 * @param {React.RefObject} ref - Referência React.
 * @returns {any|null} Valor da ref ou null se ausente.
 */
function extrairCurrent(ref) {
    return ref.current ?? null;
}

/**
 * Verifica se um objeto possui o método `.getContainer()`, típico de controles Leaflet.
 * @param {any} obj - Objeto a ser inspecionado.
 * @returns {boolean} `true` se for um objeto com `.getContainer()`.
 */
function temGetContainer(obj) {
    return !!obj && typeof obj.getContainer === 'function';
}

/**
 * Retorna o container DOM de um objeto com `.getContainer()`, se válido.
 * @param {any} obj - Objeto com potencial de ser um controle Leaflet.
 * @returns {HTMLElement|null} Container DOM ou null.
 */
function obterContainerSeValido(obj) {
    if (!temGetContainer(obj)) return null;
    return obj.getContainer();
}

/**
 * Caminho completo e seguro para extrair o container DOM a partir de uma ref.
 * @param {React.RefObject} ref - Referência React para um controle Leaflet.
 * @returns {HTMLElement|null} Container extraído ou null.
 */
function obterContainerSeguro(ref) {
    if (!ref) return null;
    const current = extrairCurrent(ref);
    return obterContainerSeValido(current);
}

/**
 * Verifica se o elemento é um nó DOM que permite `querySelector`.
 * @param {any} container - Elemento DOM.
 * @returns {boolean} `true` se for possível usar `querySelector` nele.
 */
function podeSelecionarLabel(container) {
    return !!container && typeof container.querySelector === 'function';
}

/**
 * Tenta localizar o primeiro `<label>` dentro da seção de overlays do Leaflet.
 * @param {HTMLElement|null} container - Container DOM potencialmente válido.
 * @returns {HTMLElement|null} Elemento `<label>` ou null se não encontrado.
 */
function selecionarLabel(container) {
    if (!podeSelecionarLabel(container)) return null;
    return container.querySelector('.leaflet-control-layers-overlays label');
}

/**
 * Roteia toda a jornada: de uma ref até o `<label>` relevante no controle de camadas.
 * @param {React.RefObject} ref - Ref para o controle de camadas do Leaflet.
 * @returns {HTMLElement|null} Elemento `<label>` ou null.
 */
function encontrarLabel(ref) {
    const container = obterContainerSeguro(ref);
    return container ? selecionarLabel(container) : null;
}

/**
 * 🚀 Cria um botão de alternância entre os modos de visualização: Cluster vs Simples.
 * @param {boolean} useCluster - Indica se o modo atual é Cluster.
 * @returns {HTMLButtonElement} Botão DOM pronto para inserção.
 */
function criarBotaoAlternancia(useCluster) {
    const btn = document.createElement('button');
    btn.className = 'toggle-mode';
    btn.innerHTML = useCluster ? 'Cluster' : 'Simples';

    // Previne que o botão propague eventos que interfiram no mapa
    L.DomEvent.disableClickPropagation(btn);
    L.DomEvent.disableScrollPropagation(btn);

    return btn;
}