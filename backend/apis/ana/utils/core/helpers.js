/**
 * @file helpers.js
 * @description Funções utilitárias genéricas para manipulação de datas, horas, números e strings.
 * @escopo
 *   - Operações simples e puras, sem dependência de domínio (ANA) ou rede.
 *   - Funções de transformação de valores (normalização de strings, arredondamento, conversões de data).
 * @nao_conter
 *   - Lógica de negócio específica da ANA.
 *   - Acesso a arquivos, rede ou banco de dados.
 *   - Configurações de ambiente.
 *   - Lógicas complexas de cálculo estatístico ou geoespacial.
 */


/** ======================================
 *  Utilitários para manipulação de datas.
 *  ======================================
 */

/**
 * Retorna um objeto Date ajustado para o fuso de preferência.
 * @param {number} offset - Fuso horário em horas (padrão é -3 para GMT-3).
 * @param {Date|number} [date] - Data base (Date ou timestamp em ms). Se omitido, usa o horário atual.
 * @returns {Date} Objeto Date ajustado para o fuso horário especificado.
 */
export function nowGMT(offset = -3, date) {
    const time = typeof date === 'number'
        ? date
        : date instanceof Date
            ? date.getTime()
            : Date.now();

    return new Date(time + offset * 60 * 60 * 1000);
}

/**
 * Converte string ISO em objeto Date (com fallback)
 * @param {string} str
 * @returns {Date|null}
 */
export function parseData(str) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Retorna diferença em horas entre duas datas
 * @param {Date|string} d1
 * @param {Date|string} d2
 * @returns {number}
 */
export function diffHoras(d1, d2) {
    const dt1 = typeof d1 === 'string' ? new Date(d1) : d1;
    const dt2 = typeof d2 === 'string' ? new Date(d2) : d2;
    return Math.abs((dt2 - dt1) / (1000 * 60 * 60));
}

/**
 * Formata data para yyyy-mm-dd
 * @param {Date|string} date
 * @returns {string}
 */
export function formatarDataISO(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
}

// Função auxiliar para calcular o intervalo ideal
export function calcularIntervaloIdeal(dataInicio, dataFim) {
    if (!dataInicio || !dataFim) {
        console.warn(`[calcularIntervaloIdeal] dataInicio ou dataFim não informados, usando intervalo padrão: HORA_24.`);
        return 'HORA_24';
    }
    const ini = new Date(dataInicio);
    const fim = new Date(dataFim);
    const dias = (fim - ini) / (1000 * 60 * 60 * 24) + 1;

    const intervalos = [
        { min: 22, nome: 'DIAS_30' },
        { min: 15, nome: 'DIAS_21' },
        { min: 8, nome: 'DIAS_14' },
        { min: 3, nome: 'DIAS_7' },
        { min: 2, nome: 'DIAS_2' }
    ];

    for (const { min, nome } of intervalos) {
        if (dias >= min) return nome;
    }
    return 'HORA_24';
}

/** =======================================
 *  Utilitários para operações com strings.
 *  =======================================
 */

/**
 * Verifica se os itens estão em ordem cronológica.
 * Usa como referência a propriedade Data_Hora_Medicao dos itens.
 * @param {Array} items - Array de itens a serem verificados.
 * @returns {Object} - Objeto contendo o resultado da verificação.
 */
export function verificarOrdemItens(items) {
    if (!items || items.length === 0) {
        return { ordenado: true, mensagem: "Array vazio ou inválido" };
    }

    for (let i = 1; i < items.length; i++) {
        const dataAtual = new Date(items[i].Data_Hora_Medicao);
        const dataAnterior = new Date(items[i - 1].Data_Hora_Medicao);

        if (dataAtual < dataAnterior) {
            return {
                ordenado: false,
                mensagem: `Item fora de ordem encontrado na posição ${i}: ${items[i].Data_Hora_Medicao} vem depois de ${items[i - 1].Data_Hora_Medicao}`,
                posicaoErro: i,
                dataErro: items[i].Data_Hora_Medicao,
                dataAnterior: items[i - 1].Data_Hora_Medicao
            };
        }
    }

    return { ordenado: true, mensagem: "Todos os itens estão em ordem cronológica" };
}

/**
 * Compara duas strings de forma case-insensitive, sem espaços extras e sem acentuação.
 * @param {any} str1 - Primeira string a comparar.
 * @param {any} str2 - Segunda string, usada como padrão de comparação.
 * @returns {boolean}
 */
export function matches(str1, str2) {
    if (str1 == null || str2 == null) return false;

    // Normaliza string: remove acentos, espaços e converte para minúsculas
    const normalize = str =>
        str
            .toString()
            .normalize('NFD')                    // separa diacríticos
            .replace(/\p{Diacritic}/gu, '')     // remove diacríticos (acentos)
            .replace(/\s+/g, '')                // remove todos os espaços
            .toLowerCase();

    const a = normalize(str1);
    const b = normalize(str2);

    return a === b;
}


/** ================================================
 *  Utilitários para cálculos estatísticos em arrays.
 *  ================================================
 * / 

/**
 * Soma todos os elementos de um array.
 * @param {number[]} arr - Array de números a serem somados.
 * @returns {number} Soma dos elementos do array.
 */
export function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

/**
 * Calcula a média dos elementos de um array.
 * @param {number[]} arr - Array de números a serem calculados.
 * @returns {number|null} Média dos elementos do array ou null se o array estiver vazio.
 */
export function mean(arr) {
    if (!arr.length) return null;
    return sum(arr) / arr.length;
}

/**
 * Calcula a mediana dos elementos de um array.
 * @param {number[]} arr - Array de números a serem calculados.
 * @returns {number|null} Mediana dos elementos do array ou null se o array estiver vazio.
 */
export function median(arr) {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}