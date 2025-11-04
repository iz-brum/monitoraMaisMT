/**
 * @file runtime.js
 * @description Utilidades de execução e ambiente (concurrency, leitura de config/env, logging, formatação de erros HTTP).
 * @escopo
 *   - Funções de suporte a execução (limitação de concorrência, leitura segura de variáveis de ambiente).
 *   - Logging padronizado.
 *   - Construção de objetos de erro para retorno HTTP.
 * @nao_conter
 *   - Lógica de negócio da ANA.
 *   - Cálculos estatísticos ou filtragem de dados.
 *   - Funções puras de transformação de dados (ficam em helpers.js).
 */

import pLimit from 'p-limit';

/**
 *  Utilitários para log/visualização dos dados das estações.
 */

export function logRainyStations(stationData, stationCode) {
    const rainyRecords = stationData.items.filter(item =>
        parseFloat(item.Chuva_Adotada || 0) > 0.00
    );

    if (rainyRecords.length === 0) return;

    // Cálculos
    const totalChuva = rainyRecords.reduce((sum, record) =>
        sum + parseFloat(record.Chuva_Adotada), 0);
    const mediaHoraria = totalChuva / rainyRecords.length;

    // Formatação melhorada
    console.log(`\n\x1b[1mESTAÇÃO ${stationCode} - REGISTROS DE CHUVA\x1b[0m`);

    // Cabeçalho
    console.log(
        ' '.padEnd(2) +
        'MEDIÇÃO'.padEnd(8) +
        'CHUVA'.padStart(14) +
        'ATUALIZAÇÃO'.padStart(18)
    );
    console.log('-'.repeat(50));

    // Registros
    rainyRecords.forEach(record => {
        const hora = formatTime(record.Data_Hora_Medicao).padEnd(12);
        const chuva = parseFloat(record.Chuva_Adotada).toFixed(2).padStart(6) + ' mm';
        const atualizacao = formatTime(record.Data_Atualizacao);

        console.log(`• ${hora} ${chuva.padStart(10)} ${atualizacao.padStart(18)}`);
    });

    // Resumo
    console.log('-'.repeat(50));
    console.log(
        `\x1b[1mTOTAL:\x1b[0m ${totalChuva.toFixed(2).padStart(6)} mm`.padEnd(25) +
        `\x1b[1mMÉDIA:\x1b[0m ${mediaHoraria.toFixed(2)} mm/h`.padStart(25)
    );
    console.log(`\x1b[90m(${rainyRecords.length} registro${rainyRecords.length > 1 ? 's' : ''})\x1b[0m`);
}

/**
 * Formata a data e hora para um formato legível.
 * Exemplo: "12/01 12:30".
 * @param {string} fullDate - Data completa a ser formatada.
 * @returns {string} Data formatada.
 */
function formatTime(fullDate) {
    if (!fullDate) return '--:-- (--/--)';
    const [date, time] = fullDate.split(/[ T]/);
    return `${time.substring(0, 5)} (${date.split('-').reverse().join('/').substring(0, 5)})`;
}

/**
 * Verifica se uma data é no fim de semana.
 * @param {Date} d - Data a ser verificada.
 * @returns {boolean} Verdadeiro se a data for um sábado ou domingo.
 */
const isWeekend = (d = new Date()) => {
    const wd = d.getDay();           // 0 = dom, 6 = sáb
    return wd === 0 || wd === 6;
};

/** Retorna um limitador: p-limit(N) no fim de semana, “pass-through” nos dias úteis
 * @param {number} weekendMax - Número máximo de promessas a serem executadas em paralelo no fim de semana.
 * @param {Date} dateRef - Data de referência para verificar se é fim de semana.
 * @returns {Function} Função limitadora.
 */
export function weekendLimiter(weekendMax = 5, dateRef = new Date()) {
    return isWeekend(dateRef) ? pLimit(weekendMax) : (fn) => fn();
}

/**
 * Monta um objeto de erro para a resposta da API.
 * @param {Object} param0 - Parâmetros do erro.
 * @param {number} param0.status - Código de status HTTP.
 * @param {string} param0.error - Mensagem de erro.
 * @param {string} param0.message - Mensagem detalhada do erro.
 * @param {string} param0.path - Caminho da requisição que gerou o erro.
 * @returns {Object} Objeto de erro formatado.
 */
export function montarErroAna({ status, error, message, path }) {
    return {
        timestamp: new Date().toISOString(),
        status,
        error,
        message,
        path
    };
}