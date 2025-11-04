// backend/apis/ana/services/stats/anaStatsService.js
import { getStationsData } from '#ana_services/data/stationsService.js';

const HOJE = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const num = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function fetchStationsWithHistory(uf, dataBusca) {
  try {
    console.log(`[DEBUG] Fetching stations with history for UF: ${uf}, Date: ${dataBusca}`);
    const { estacoes } = await getStationsData({
      filters: { uf },
      incluirHistorico: 'true',
      tipoFiltroData: 'DATA_LEITURA',
      dataBusca,
      intervalo: 'DIAS_14'
    });
    console.log(`[DEBUG] Fetched ${estacoes.length} stations.`);
    return estacoes;
  } catch (error) {
    console.error(`[ERROR] Failed to fetch stations with history: ${error.message}`);
    throw error;
  }
}

function aggregateStationTotals(estacoes) {
  console.log(`[DEBUG] Aggregating station totals for ${estacoes.length} stations.`);
  const stationTotals = new Map(); // id -> { municipio, perDay: { [YYYY-MM-DD]: total } }
  const allDays = new Set();

  for (const est of estacoes) {
    const itens = est.historico?.items || [];
    const perDay = {};
    for (const it of itens) {
      // (opcional) filtrar por QC: if (it.Chuva_Adotada_Status !== "0") continue;
      const v = num(it.Chuva_Adotada);
      if (v == null) continue;
      const dia = (it.Data_Hora_Medicao || '').slice(0, 10);
      if (!dia) continue;
      allDays.add(dia);
      perDay[dia] = (perDay[dia] || 0) + v;
    }
    stationTotals.set(est.codigo_Estacao, {
      municipio: est.Municipio_Nome || 'DESCONHECIDO',
      perDay
    });
  }

  console.log(`[DEBUG] Aggregated data for ${stationTotals.size} stations.`);
  return { stationTotals, allDays };
}

function pickDays(allDays, incluirDiaAtual, dias) {
  console.log(`[DEBUG] Picking days from ${allDays.size} total days.`);
  const hoje = HOJE();
  let days = Array.from(allDays).sort();
  if (!incluirDiaAtual) days = days.filter(d => d < hoje);
  if (dias) days = days.slice(-dias);
  console.log(`[DEBUG] Selected ${days.length} days.`);
  return days;
}

function buildMunicipalBuckets(stationTotals, dia) {
  // muni -> [totais das estações válidas no dia]
  const buckets = new Map();
  for (const [, info] of stationTotals) {
    const total = info.perDay[dia];
    if (total == null) continue;
    const muni = info.municipio;
    if (!buckets.has(muni)) buckets.set(muni, []);
    buckets.get(muni).push(total);
  }
  return buckets;
}

function calcMunicipalMeans(muniBuckets) {
  const muniMeans = [];
  const municipios = {};
  for (const [muni, totals] of muniBuckets.entries()) {
    const dividendo = totals.reduce((a, b) => a + b, 0);
    const divisor = totals.length;
    const media = dividendo / divisor;
    muniMeans.push(media);
    municipios[muni] = {
      media_municipio: media,
      acumulado_chuva_municipio: dividendo,
      estacoes_validas: divisor
    };
  }
  return { muniMeans, municipios };
}

function calcUfStats(muniMeans) {
  const dividendoUF = muniMeans.reduce((a, b) => a + b, 0);
  const divisorUF = muniMeans.length;
  const mediaUF = divisorUF ? (dividendoUF / divisorUF) : null;
  return { mediaUF, dividendoUF, divisorUF };
}

function countMonitoredMunicipalities(estacoes) {
  const set = new Set();
  for (const est of estacoes) {
    const nome = (est.Municipio_Nome ?? '').toString().trim();
    if (nome) set.add(nome);
  }
  return set.size;
}

// helper novo: sumariza municípios COM/SEM registro de chuva e SEM dados válidos, no dia informado (YYYY-MM-DD)
function summarizeMunicipalRainStatus(estacoes, diaISO) {
  const isPresentNumeric = (v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string' && v.trim() === '') return false;
    const n = Number(v);
    return Number.isFinite(n);
  };

  const initializeMunicipalities = (estacoes) => {
    const munis = new Map();
    for (const est of estacoes) {
      const nome = (est.Municipio_Nome ?? '').toString().trim();
      if (nome && !munis.has(nome)) {
        munis.set(nome, { rainSum: 0, hasRainData: false, hasAnyValidAnyVar: false });
      }
    }
    return munis;
  };

  const updateMunicipalityState = (munis, estacoes, diaISO) => {
    const processStationItems = (state, items, diaISO) => {
      for (const it of items) {
        if ((it.Data_Hora_Medicao || '').slice(0, 10) !== diaISO) continue;

        const hasAnyVar =
          isPresentNumeric(it.Chuva_Adotada) ||
          isPresentNumeric(it.Cota_Adotada) ||
          isPresentNumeric(it.Vazao_Adotada);

        if (hasAnyVar) state.hasAnyValidAnyVar = true;

        if (isPresentNumeric(it.Chuva_Adotada)) {
          state.hasRainData = true;
          state.rainSum += Number(it.Chuva_Adotada);
        }
      }
    };

    for (const est of estacoes) {
      const nome = (est.Municipio_Nome ?? '').toString().trim();
      if (!nome) continue;
      const state = munis.get(nome);
      const items = est.historico?.items || [];
      processStationItems(state, items, diaISO);
    }
  };

  const countMunicipalities = (munis) => {
    let total_municipios_com_registro_de_chuva = 0;
    let total_municipios_sem_registro_de_chuva = 0;
    let total_municipios_sem_dados_validos = 0;

    for (const { rainSum, hasRainData, hasAnyValidAnyVar } of munis.values()) {
      if (!hasAnyValidAnyVar) {
        total_municipios_sem_dados_validos++;
      } else if (hasRainData && rainSum > 0) {
        total_municipios_com_registro_de_chuva++;
      } else {
        total_municipios_sem_registro_de_chuva++;
      }
    }

    return {
      total_municipios_com_registro_de_chuva,
      total_municipios_sem_registro_de_chuva,
      total_municipios_sem_dados_validos
    };
  };

  const munis = initializeMunicipalities(estacoes);
  updateMunicipalityState(munis, estacoes, diaISO);
  return countMunicipalities(munis);
}


// helper novo: cobertura por variável (contagem de estações com dados no dia)
// Conta estação se tiver PELO MENOS um registro numérico (0 incluso) no dia para a variável.
function summarizeStationDataCoverage(estacoes, diaISO) {
  const isPresentNumeric = (v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string' && v.trim() === '') return false;
    const n = Number(v);
    return Number.isFinite(n); // 0 é válido
  };

  const countStationsWithData = (estacoes, diaISO) => {
    const processStation = (items, diaISO) => {
      const checkDataPresence = (item, diaISO) => {
        if ((item.Data_Hora_Medicao || '').slice(0, 10) !== diaISO) return {};

        return {
          hasChuva: isPresentNumeric(item.Chuva_Adotada),
          hasCota: isPresentNumeric(item.Cota_Adotada),
          hasVazao: isPresentNumeric(item.Vazao_Adotada)
        };
      };

      let hasChuva = false, hasCota = false, hasVazao = false;

      for (const it of items) {
        const { hasChuva: chuva, hasCota: cota, hasVazao: vazao } = checkDataPresence(it, diaISO);

        if (chuva) hasChuva = true;
        if (cota) hasCota = true;
        if (vazao) hasVazao = true;

        if (hasChuva && hasCota && hasVazao) break;
      }

      return { hasChuva, hasCota, hasVazao };
    };

    let estacoes_com_dados_chuva = 0;
    let estacoes_com_dados_cota = 0;
    let estacoes_com_dados_vazao = 0;

    for (const est of estacoes) {
      const items = est.historico?.items || [];
      const { hasChuva, hasCota, hasVazao } = processStation(items, diaISO);

      if (hasChuva) estacoes_com_dados_chuva++;
      if (hasCota) estacoes_com_dados_cota++;
      if (hasVazao) estacoes_com_dados_vazao++;
    }

    return { estacoes_com_dados_chuva, estacoes_com_dados_cota, estacoes_com_dados_vazao };
  };

  return countStationsWithData(estacoes, diaISO);
}


/**
 * Calcula: média das médias municipais por dia.
 * Retorna um objeto com:
 *  - dashboard_resumo (fora da lista/serie)
 *  - series: array de dias agregados
 */
export async function getStateDailyMunicipalMeans(uf, dias, incluirDiaAtual = true) {
  try {
    console.log(`[DEBUG] Calculating state daily municipal means for UF: ${uf}, Days: ${dias}, Include Today: ${incluirDiaAtual}`);
    const dataBusca = HOJE();
    const estacoes = await fetchStationsWithHistory(uf, dataBusca);

    const { stationTotals, allDays } = aggregateStationTotals(estacoes);
    const days = pickDays(allDays, incluirDiaAtual, dias);

    const onlyToday = process.env.ANA_STATS_MUNICIPIOS_ONLY_TODAY !== '0';
    const hoje = HOJE();

    // totais para o resumo do dashboard
    const total_estacoes_verificadas = estacoes.length; // hist_consultadas
    const total_municipios_monitorados = countMonitoredMunicipalities(estacoes);
    const {
      total_municipios_com_registro_de_chuva,
      total_municipios_sem_registro_de_chuva,
      total_municipios_sem_dados_validos
    } = summarizeMunicipalRainStatus(estacoes, hoje);

    // cobertura por variável (contagens + porcentagens em relação às estações verificadas)
    const {
      estacoes_com_dados_chuva,
      estacoes_com_dados_cota,
      estacoes_com_dados_vazao
    } = summarizeStationDataCoverage(estacoes, hoje);

    const denom = total_estacoes_verificadas || 1;
    const porcentagem_estacoes_com_dados_chuva = Number(((estacoes_com_dados_chuva / denom) * 100).toFixed(2));
    const porcentagem_estacoes_com_dados_cota = Number(((estacoes_com_dados_cota / denom) * 100).toFixed(2));
    const porcentagem_estacoes_com_dados_vazao = Number(((estacoes_com_dados_vazao / denom) * 100).toFixed(2));

    const series = days.map(dia => {
      const muniBuckets = buildMunicipalBuckets(stationTotals, dia);
      const { muniMeans, municipios } = calcMunicipalMeans(muniBuckets);
      const { mediaUF, dividendoUF, divisorUF } = calcUfStats(muniMeans);

      const includeMunicipios = !onlyToday || dia === hoje;

      return {
        dia,
        media: mediaUF,
        municipios_validos: divisorUF,
        [`acumulado_uf_${uf}`]: dividendoUF,
        ...(includeMunicipios ? { municipios } : {})
      };
    });

    console.log(`[DEBUG] Successfully calculated daily municipal means.`);
    return {
      dashboard_resumo: {
        total_estacoes_verificadas,
        total_municipios_monitorados,
        total_municipios_com_registro_de_chuva,
        total_municipios_sem_registro_de_chuva,
        total_municipios_sem_dados_validos,

        // contagens por variável
        estacoes_com_dados_chuva,
        estacoes_com_dados_cota,
        estacoes_com_dados_vazao,

        // porcentagens por variável (em % do total_estacoes_verificadas)
        porcentagem_estacoes_com_dados_chuva,
        porcentagem_estacoes_com_dados_cota,
        porcentagem_estacoes_com_dados_vazao
      },
      series
    };
  } catch (error) {
    console.error(`[ERROR] Failed to calculate state daily municipal means: ${error.message}`);
    throw error;
  }
}

