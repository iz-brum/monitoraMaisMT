import { montarUrl, buscarJson, logErroFetch } from '@shared/utils/apiHelpers';

import { getRequestDate, setRequestDate } from './dateControl';

/**
 * Busca os focos de calor para uma data específica.
 * @param {string} dataISO - Data a ser consultada.
 * @returns {Promise<Array>} Lista de focos de calor.
 */
export async function buscarFocos(dataISO) {
  const dt = dataISO || getRequestDate();
  try {
    const url = montarUrl('/api/firms/fires', { dt, all: true });
    const json = await buscarJson(url);
    if (!json || !json.dados) return [];
    return json.dados;
  } catch (error) {
    logErroFetch(error);
    return [];
  }
}

/**
 * Realiza a busca assíncrona de dados de focos de calor para uma data específica e atualiza o estado.
 * @param {string} dataISO - Data no formato ISO (YYYY-MM-DD).
 * @param {Function} setFocos - Função que atualiza o estado de focos no React.
 */
export async function fetchFocosDoDia(dataISO, setFocos) {
  try {
    const focos = await buscarFocos(dataISO);
    setFocos(focos);
  } catch (e) {
    lidarComErro(e);
  }
}

/**
 * Handler padrão para falhas ao buscar focos de calor.
 * @param {Error} e - Objeto de erro capturado.
 */
function lidarComErro(e) {
  console.error('Erro ao buscar focos de calor:', e);
}