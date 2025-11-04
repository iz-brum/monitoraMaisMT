// src/components/layers/FocoFlutuanteHUD.jsx

import { useMemo } from 'react';
import FocoDetalhesFlutuante from '@components/mapa/FocoDetalhes/FocoDetalhesFlutuante';

/**
 * 📍 temY
 * Verifica se o objeto de posição contém a propriedade `y`.
 * 
 * @param {Object|null} posicao - Objeto de posição (x, y)
 * @returns {boolean} - true se possui `y` válido
 */
function temY(posicao) {
    return !!posicao && posicao.y != null;
}

/**
 * 📍 temX
 * Verifica se o objeto de posição contém a propriedade `x`.
 * 
 * @param {Object|null} posicao - Objeto de posição (x, y)
 * @returns {boolean} - true se possui `x` válido
 */
function temX(posicao) {
    return !!posicao && posicao.x != null;
}

/**
 * 🧮 calcularTop
 * Calcula a coordenada vertical (top) da HUD flutuante.
 * Se `y` não estiver presente, centraliza verticalmente.
 * 
 * @param {Object|null} posicao - Objeto de posição
 * @returns {number} - Posição `top` em pixels
 */
function calcularTop(posicao) {
    return temY(posicao)
        ? posicao.y
        : window.innerHeight / 2 - 150;
}

/**
 * 🧮 calcularLeft
 * Calcula a coordenada horizontal (left) da HUD flutuante.
 * Se `x` não estiver presente, centraliza horizontalmente.
 * 
 * @param {Object|null} posicao - Objeto de posição
 * @returns {number} - Posição `left` em pixels
 */
function calcularLeft(posicao) {
    return temX(posicao)
        ? posicao.x
        : window.innerWidth / 2 - 200;
}

/**
 * 🧠 deveRenderizarFlutuante
 * 
 * Determina se a interface flutuante deve ser renderizada com base na existência
 * de focos selecionados. Garante que o painel só apareça quando há dados a exibir.
 * 
 * @param {Array} focos - Lista de focos de calor selecionados.
 * @returns {boolean} - True se deve renderizar, false caso contrário.
 */
function deveRenderizarFlutuante(focos) {
    const resultado = Array.isArray(focos) && focos.length > 0;
    // console.log('[FocoFlutuanteHUD] deveRenderizarFlutuante:', { focos, resultado }); // Log para inspecionar focos e resultado
    return resultado;
}

/**
 * 🧊 renderizarFlutuante
 * 
 * Renderiza dinamicamente o painel flutuante de detalhes sobre os focos de calor.
 * Define posição absoluta com base no estado da aplicação e injeta o componente detalhista.
 * 
 * @param {Array} focos - Lista de focos a serem exibidos.
 * @param {Object|null} posicao - Coordenadas (x,y) para posicionamento do painel.
 * @param {Object} map - Instância do Leaflet map.
 * @param {Function} onClose - Callback para fechar o painel.
 * @param {string} keyId - Chave única para forçar renderização
 * @returns {JSX.Element} - JSX do painel flutuante.
 */
function renderizarFlutuante(focos, posicao, map, onClose, keyId) {
    const top = calcularTop(posicao);
    const left = calcularLeft(posicao);

    return (
        <div key={keyId} style={{ position: 'absolute', top, left, zIndex: 9999 }}>
            <FocoDetalhesFlutuante
                focosSelecionados={focos}
                onClose={onClose}
                leafletMap={map}
            />
        </div>
    );
}

/**
 * 🚀 Flutuante
 * 
 * Componente de alto nível que encapsula a lógica de decisão e renderização
 * do painel de informações detalhadas. Apenas exibe se houver focos válidos.
 * 
 * @param {Object} props
 * @param {Array} props.focosSelecionados - Focos a exibir no painel.
 * @param {Object|null} props.posicaoTabela - Posição do painel flutuante.
 * @param {Object} props.map - Instância do mapa Leaflet.
 * @param {Function} props.onClose - Callback de fechamento do painel.
 * @returns {JSX.Element|null} - JSX do painel ou null.
 */
export default function FocoFlutuanteHUD({ focosSelecionados, posicaoTabela, map, onClose }) {
    // 🔐 Sempre deve vir ANTES de qualquer return condicional
    const keyId = useMemo(() => {
        return Array.isArray(focosSelecionados)
            ? focosSelecionados
                .map(f => `${f.latitude.toFixed(5)},${f.longitude.toFixed(5)}`)
                .sort()
                .join('|')
            : 'empty';
    }, [focosSelecionados]);

    if (!deveRenderizarFlutuante(focosSelecionados)) return null;

    return renderizarFlutuante(focosSelecionados, posicaoTabela, map, onClose, keyId);
}

