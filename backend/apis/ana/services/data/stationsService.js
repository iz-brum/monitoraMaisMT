// @file: backend/apis/ana/services/data/stationsService.js

/**
O arquivo `stationsService.js` é um *service* de dados, responsável por buscar, filtrar, transformar e eventualmente enriquecer informações sobre estações. Ele é reutilizável por controllers e outros serviços.
*/

import { createRequire } from 'module';
import { matches } from '#ana_utils/core/helpers.js';
import { getStationHistory } from '#ana_services/data/hidrowebHistoryService.js';
import { loadLists } from '#ana_utils/filtragem_estacoes/stationLists.js';
import pLimit from 'p-limit';

// --- cache simples do inventário (igual ao controller) ---
const inventarioCache = { data: null, lastLoad: null };
const loadInventory = () => {
  if (inventarioCache.data) return inventarioCache.data;
  try {
    const require = createRequire(import.meta.url);
    inventarioCache.data = require('#ana_inventario');
    inventarioCache.lastLoad = Date.now();
  } catch (err) {
    console.error('Erro ao carregar inventário:', err);
    inventarioCache.data = [];
  }
  return inventarioCache.data;
};

// --- mapeamento e transformação padronizada ---
const FIELD_MAPPING = Object.freeze({
  codigoestacao: 'codigo_Estacao',
  Estacao_Nome: 'Estacao_Nome',
  Tipo_Estacao: 'Tipo_Estacao',
  Operando: 'Operando',
  Latitude: 'Latitude',
  Longitude: 'Longitude',
  Altitude: 'Altitude',
  Area_Drenagem: 'Area_Drenagem',
  Municipio_Nome: 'Municipio_Nome',
  UF_Estacao: 'UF_Estacao',
  Bacia_Nome: 'Bacia_Nome',
  Rio_Nome: 'Rio_Nome'
});

const pickFields = (item) => {
  const out = {};
  for (const [src, dest] of Object.entries(FIELD_MAPPING)) out[dest] = item[src];
  return out;
};

// --- filtros reutilizáveis (igual à lógica do controller) ---
const applyFilters = (query, data) => {
  const MAP = {
    tipo: 'Tipo_Estacao',
    municipio: 'Municipio_Nome',
    uf: 'UF_Estacao',
    bacia: 'Bacia_Nome',
    rio: 'Rio_Nome'
  };
  let result = data;
  for (const [param, field] of Object.entries(MAP)) {
    const v = query[param];
    if (v) result = result.filter(i => matches(i[field], v));
  }
  return result;
};

// --- API do serviço ---
// Mapa de promessas em voo, chaveado pelos parâmetros relevantes
const inFlight = new Map();

async function fetchStationHistoryBatch(stations, tipoFiltroData, dataBusca, intervalo) {
  try {
    console.log(`[DEBUG] Fetching history for batch of ${stations.length} stations.`);
    const results = await Promise.all(
      stations.map(async (station) => {
        try {
          return await getStationHistory(station.codigo_Estacao, tipoFiltroData, dataBusca, intervalo);
        } catch (error) {
          console.error(`[ERROR] Failed to fetch history for station: ${station.codigo_Estacao}`, error.message);
          return { status_estacao: 'ERRO' };
        }
      })
    );
    return results;
  } catch (error) {
    console.error(`[ERROR] Failed to fetch batch history: ${error.message}`);
    throw error;
  }
}

export async function getStationsData({
  filters = {},
  incluirHistorico = 'false',
  tipoFiltroData,
  dataBusca,
  intervalo
}) {
  const cacheKey = JSON.stringify({ filters, incluirHistorico, tipoFiltroData, dataBusca, intervalo });

  if (inFlight.has(cacheKey)) {
    return inFlight.get(cacheKey);
  }

  const promise = (async () => {
    const inventario = loadInventory();
    const totalInventario = inventario.length;

    const operantes = inventario.filter(i => matches(i.Operando, '1'));
    const totalOperantes = operantes.length;

    const { white } = await loadLists();
    const whiteSize = white.size;

    const filtered = applyFilters(filters, operantes);
    const totalFiltered = filtered.length;

    let estacoes = filtered.map(pickFields);

    const wl = estacoes.filter(s => white.has(s.codigo_Estacao));
    const wlCountRaw = wl.length;

    let historicoEstacoesConsultadas = 0;
    let historicoComItens = 0;
    let historicoComRegistroNoDia = 0;
    let historicoComErro = 0;

    if (incluirHistorico === 'true') {
      if (!tipoFiltroData || !dataBusca || !intervalo) {
        throw new Error('Histórico: informe tipoFiltroData, dataBusca e intervalo');
      }

      const limit = pLimit(5); // Limita a 5 lotes simultâneos
      const batchSize = 15; // Tamanho do lote
      const batches = [];

      for (let i = 0; i < wl.length; i += batchSize) {
        batches.push(wl.slice(i, i + batchSize));
      }

      estacoes = await Promise.all(
        batches.map(batch =>
          limit(async () => {
            const batchResults = await fetchStationHistoryBatch(batch, tipoFiltroData, dataBusca, intervalo);
            batchResults.forEach((result, index) => {
              const station = batch[index];
              if (result.status_estacao === 'ERRO') {
                historicoComErro++;
              } else {
                historicoEstacoesConsultadas++;
                if ((result.items || []).length > 0) historicoComItens++;
                if ((result.items || []).some(it => (it.Data_Hora_Medicao || '').slice(0, 10) === dataBusca)) {
                  historicoComRegistroNoDia++;
                }
              }
              Object.assign(station, { historico: result });
            });
            return batch;
          })
        )
      ).then(results => results.flat());
    }

    console.log(
      `[ANA/STATIONS_DATA]
        total_inventario=${totalInventario}
        total_operantes=${totalOperantes}
        total_whitelist=${whiteSize}
        total_filtradas=${totalFiltered}
        intersecao_whitelist_raw=${wlCountRaw}
        historico_estacoes_consultadas=${historicoEstacoesConsultadas}
        historico_com_itens=${historicoComItens}
        historico_com_registro_no_dia=${historicoComRegistroNoDia}
        historico_com_erro=${historicoComErro}
        data_busca=${dataBusca}`
    );

    return { estacoes };
  })();

  inFlight.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(cacheKey);
  }
}

export function contarEstacoesOperando(estacoes) {
  return estacoes.filter(estacao => {
    if (String(estacao.Operando) !== "1") return false;
    const hist = estacao.historico?.items || [];
    return hist.some(item =>
      [item.Chuva_Adotada, item.Cota_Adotada, item.Vazao_Adotada]
        .some(v => v !== null && v !== undefined && v !== "" && !isNaN(Number(v)))
    );
  }).length;
}
