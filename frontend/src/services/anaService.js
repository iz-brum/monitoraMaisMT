// frontend/src/services/anaService.js

import { montarUrl } from '../shared/utils/apiHelpers.js';

// Utilitário para data GMT-3 (Brasília)
function getDataBuscaGMT3() {
  const now = new Date();
  // GMT-3 = UTC-3, então soma 3 horas ao UTC
  const gmt3 = new Date(now.getTime() - (now.getTimezoneOffset() + 180) * 60000);
  return gmt3.toISOString().slice(0, 10);
}

export async function buscarEstacoesANA() {
  try {
    const params = {
      tipoFiltroData: 'DATA_LEITURA',
      dataBusca: getDataBuscaGMT3(),
      intervalo: 'HORA_24',
      incluirHistorico: true,
    };

    const url = montarUrl('/api/ana/estacoes/lista', params);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar estações ANA:', error);
    throw error;
  }
}

export async function buscarHistoricoEstacao(codigo, tipoFiltroData, dataBusca, intervalo) {
  try {
    // Adicionamos os parâmetros 'codigo' e 'incluirHistorico' para obter o comportamento desejado.
    const params = {
      codigo, // O código da estação específica.
      incluirHistorico: true, // Sinaliza que queremos o histórico.
      tipoFiltroData,
      dataBusca: dataBusca || getDataBuscaGMT3(),
      intervalo,
    };

    const url = montarUrl('/api/ana/estacoes/lista', params);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    // A resposta da API agora é o objeto da estação completo.
    const estacao = await response.json();

    // Retornamos apenas a propriedade 'historico' para manter a consistência
    // com o que a função retornava anteriormente.
    return estacao.historico;

  } catch (error) {
    console.error('Erro ao buscar histórico da estação:', error);
    throw error;
  }
}

/**
 * Busca as médias diárias de chuva da UF (MT) dos últimos 7 dias.
 * @returns {Promise<Object>} Dados da rota de médias diárias.
 */
export async function buscarMediasDiariasUF() {
  try {
    const url = montarUrl('/api/ana/estacoes/estatisticas/medias-diarias/mt/7');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar médias diárias da UF:', error);
    throw error;
  }
}

/**
 * Busca as estatísticas do dashboard.
 */
export async function buscarDashboardStats({
  tipoFiltroData = 'DATA_LEITURA',
  dataBusca = getDataBuscaGMT3(),
  intervalo = 'HORA_24',
  uf = "MT",
  dias = 1
} = {}) {
  const params = {
    tipoFiltroData,
    dataBusca,
    intervalo,
    uf,
    dias,
  };
  const url = montarUrl('/api/ana/estacoes/estatisticas/dashboard', params);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erro ao buscar estatísticas do dashboard');
  return await response.json();
}
