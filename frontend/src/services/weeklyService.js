// src/services/weeklyService.js

import {
    montarUrl,
    buscarJson,
    logErroFetch,
    // obterDataDeHoje, → descomente se o endpoint precisar de um parâmetro `dt`
} from '@shared/utils/apiHelpers'

import { getRequestDate } from './dateControl';

/**
 * Endpoint de dados semanais de focos de calor.
 * Mantido igual ao que existia em indicadoresService.js:
 *   GET /api/firms/fires/weekly-stats
 */
const FIRE_WEEKLY_STATS = '/api/firms/fires/weekly-stats'

/**
 * Busca estatísticas semanais de focos de calor.
 * @returns {Promise<Array<{ data: string, focos: number }>>}
 * @description
 * - Retorna um array com total de focos por dia nos últimos 7 dias.
 * - Formato esperado: [ { data: 'YYYY-MM-DD', focos: número }, ... ]
 */
export async function buscarDadosSemanais() {
    try {
        const dt = getRequestDate();
        const url = montarUrl(FIRE_WEEKLY_STATS, { dt });
        // console.log(`[weeklyService] 🔁 Buscando dados semanais até ${dt}`);

        const json = await buscarJson(url);
        return Array.isArray(json?.dadosDiarios) ? json.dadosDiarios : [];
    } catch (error) {
        logErroFetch(error);
        return [];
    }
}
