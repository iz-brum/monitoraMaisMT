// backend/utils/tests/reportHelpers.js

function resumirResultado(obj, nivel = 0) {
    if (nivel > 1) return '[resumo truncado]';

    if (Array.isArray(obj)) {
        return {
            tipo: 'array',
            tamanho: obj.length,
            exemplo: obj.slice(0, 2).map(item => resumirResultado(item, nivel + 1))
        };
    }
    if (typeof obj === 'object' && obj !== null) {
        const chaves = Object.keys(obj);
        const resumo = {};
        chaves.slice(0, 3).forEach(k => {
            if (k === '_meta') return; // ignora _meta
            resumo[k] = resumirResultado(obj[k], nivel + 1);
        });
        if (chaves.length > 3) resumo['...'] = `+${chaves.length - 3} chaves`;
        return resumo;
    }
    return obj;
}

/**
 * @param {object} agrupamento  — o objeto resultado.agrupamento
 * @param {string} campo        — o nome exato do campo que foi usado no agrupamento (por ex. 'UF_Estacao' ou 'Municipio_Nome')
 */
function resumoAgrupamento(agrupamento, campo) {
    const keys = Object.keys(agrupamento).slice(0, 3);
    if (!keys.length) return [];

    // Mapeamento de campo → rótulo no JSON resumido
    const fieldToLabel = {
        UF_Estacao: 'uf',
        Municipio_Nome: 'municipio'
    };
    const label = fieldToLabel[campo] || 'grupo';

    return keys.map(key => ({
        [label]: key,
        exemplos: agrupamento[key]
            .slice(0, 2)
            .map(e => ({
                UF: e.UF_Estacao,
                Municipio: e.Municipio_Nome,
                Operando: e.Operando,
                codigoestacao: e.codigoestacao
            }))
    }));
}

export const reportHelpers = {
    resumirResultado,
    resumoAgrupamento
};
