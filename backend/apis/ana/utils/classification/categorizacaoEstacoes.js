/**
 * @file backend/ana/utils/classification/categorizacaoEstacoes.js
 * @description Módulo responsável por aplicar classificações de chuva, nível e vazão às estações com base em regras de limiares configuráveis.
 *
 *
 * @summary Este módulo:
 *  - Classifica dados hidrometeorológicos por tipo
 *  - Agrupa estações por situação de atualização e categoria
 *  - Aplica lógica de fallback para registros ausentes
 */

/**
 * Importa configurações de classificação de estação (chuva, nível, vazão, limiares, períodos) do módulo de configuração global.
 */
import { STATION_CLASSIFICATION_CONFIG } from '#ana_utils/core/config.js';

/**
 * @param   {number|string} totalRainfall   Valor acumulado de chuva.
 * @param   {string}        stationCode     Código da estação (não utilizado na lógica atual).
 * @returns {string}                       Categoria de chuva ("Indefinido", "Sem Chuva", "Fraca", "Moderada", "Forte", "Muito Forte", "Extrema").
 *
 * @example
 * const categoria = classifyRainfall(12.5, '12345');
 * console.log(categoria); // "Moderada" ou "Forte"
 */
function classifyRainfall(totalRainfall, stationCode) {
  const config = STATION_CLASSIFICATION_CONFIG.RAINFALL;

  if (totalRainfall == null || isNaN(totalRainfall)) return config.undefined;
  if (totalRainfall === 0) return config.noRain;
  if (totalRainfall <= config.thresholds.weak) return config.weak;
  if (totalRainfall <= config.thresholds.moderate) return config.moderate;
  if (totalRainfall <= config.thresholds.strong) return config.strong;
  if (totalRainfall <= config.thresholds.veryStrong) return config.veryStrong;
  return config.extreme;
}

/**
 * @param   {number|string} latestLevel   Valor do nível mais recente.
 * @param   {string}        stationCode   Código da estação (não utilizado na lógica atual).
 * @returns {string}                     Categoria de nível ("Indefinido", "Baixo", "Normal", "Alto").
 *
 * @example
 * const categoria = classifyLevel(420, '12345');
 * console.log(categoria); // "Normal" ou "Alto"
 */
function classifyLevel(latestLevel, stationCode) {
  const config = STATION_CLASSIFICATION_CONFIG.LEVEL;
  const level = parseFloat(latestLevel);
  if (isNaN(level) || latestLevel == null) return config.undefined;
  if (level < config.thresholds.low) return config.low;
  if (level <= config.thresholds.normal) return config.normal;
  return config.high;
}

/**
 * @param   {number|string} latestDischarge   Valor da vazão mais recente.
 * @param   {string}        stationCode       Código da estação (não utilizado na lógica atual).
 * @returns {string}                         Categoria de vazão ("Indefinido", "Baixa", "Normal", "Alta").
 *
 * @example
 * const categoria = classifyDischarge(42.5, '12345');
 * console.log(categoria); // "Normal" ou "Alta"
 */
function classifyDischarge(latestDischarge, stationCode) {
  const config = STATION_CLASSIFICATION_CONFIG.DISCHARGE;
  const discharge = parseFloat(latestDischarge);
  if (isNaN(discharge) || latestDischarge == null) return config.undefined;
  if (discharge < config.thresholds.low) return config.low;
  if (discharge <= config.thresholds.normal) return config.normal;
  return config.high;
}

/**
 * @param   {string} dateStr   Data/hora em formato string (ex: '2025-07-13 10:00:00').
 * @returns {Date|null}        Objeto Date convertido ou null se inválido.
 *
 * @example
 * const data = parseLocalDate('2025-07-13 10:00:00');
 * console.log(data instanceof Date);
 */
function parseLocalDate(dateStr) {
  return dateStr ? new Date(dateStr.replace(" ", "T")) : null;
}

/**
 * @param   {Array<Object>} records   Array de registros de dados hidrometeorológicos.
 * @returns {Object|null}             Registro mais recente (maior data) ou null se não houver registros.
 *
 * @example
 * const ultimo = getLatestRecord(records);
 * console.log(ultimo.Data_Hora_Medicao);
 */
function getLatestRecord(records) {
  if (!records || records.length === 0) return null;
  return records.reduce((latest, record) => {
    const recordDate = parseLocalDate(record.Data_Hora_Medicao);
    const latestDate = latest ? parseLocalDate(latest.Data_Hora_Medicao) : null;
    return (!latestDate || (recordDate && recordDate > latestDate)) ? record : latest;
  }, null);
}

/**
 * @param   {Array<Object>} records         Array de registros de dados hidrometeorológicos.
 * @param   {Date}          referenceDate   Data de referência para cálculo do acumulado.
 * @param   {string}        stationCode     Código da estação (não utilizado na lógica atual).
 * @returns {number|null}                   Valor acumulado de chuva no período ou null se não houver dados.
 *
 * @example
 * const acumulado = calculateAccumulatedRainfall(records, new Date(), '12345');
 * console.log(acumulado);
 */
function calculateAccumulatedRainfall(records, referenceDate, stationCode) {
  if (!records || !referenceDate) return null;
  const periodMs = STATION_CLASSIFICATION_CONFIG.RAINFALL_ACCUMULATION_PERIOD_HOURS * 60 * 60 * 1000;
  const startTime = new Date(referenceDate.getTime() - periodMs);

  const values = records
    .filter(record => {
      const recordDate = parseLocalDate(record.Data_Hora_Medicao);
      return recordDate && recordDate >= startTime && recordDate <= referenceDate;
    })
    .map(record => parseFloat(record.Chuva_Adotada))
    .filter(v => !isNaN(v));

  return values.length ? values.reduce((sum, val) => sum + val, 0) : null;
}

/**
 * @param   {Object} stationData         Objeto de dados de uma estação.
 * @returns {Object}                     Objeto categorizado com propriedades:
 *   @property {string}   codigoestacao          Código da estação.
 *   @property {string}   Estacao_Nome           Nome da estação.
 *   @property {string}   data                   Data de referência.
 *   @property {string}   Rio_Nome               Nome do rio.
 *   @property {number}   latitude               Latitude da estação.
 *   @property {number}   longitude              Longitude da estação.
 *   @property {number}   chuvaAcumulada         Chuva acumulada (mm).
 *   @property {number}   nivelMaisRecente       Nível mais recente (cm).
 *   @property {number}   vazaoMaisRecente       Vazão mais recente (m³/s).
 *   @property {string}   statusAtualizacao      Status de atualização ("Atualizado" ou "Desatualizado").
 *   @property {string}   classificacaoChuva     Categoria de chuva.
 *   @property {string}   classificacaoNivel     Categoria de nível.
 *   @property {string}   classificacaoVazao     Categoria de vazão.
 *
 * @example
 * const categorizada = categorizeStation(stationData);
 * console.log(categorizada.classificacaoChuva, categorizada.statusAtualizacao);
 */
export function categorizeStation(stationData) {
  const stationCode = String(stationData.codigoestacao);
  const records = Array.isArray(stationData.dados) ? stationData.dados : [];
  let latestRecord = getLatestRecord(records);

  // Se não houver dados, usa os campos diretos da estação
  if (!latestRecord) {
    latestRecord = {
      Data_Hora_Medicao: stationData.Data_Hora_Medicao || null,
      Chuva_Adotada: stationData.chuvaAcumulada ?? null,
      Cota_Adotada: stationData.nivelMaisRecente ?? null,
      Vazao_Adotada: stationData.vazaoMaisRecente ?? null
    };
  }

  const referenceDate = latestRecord ? parseLocalDate(latestRecord.Data_Hora_Medicao) : new Date();

  let accumulatedRainfall = calculateAccumulatedRainfall(records, referenceDate, stationCode);
  if (accumulatedRainfall === null) {
    accumulatedRainfall = stationData.chuvaAcumulada ?? null;
  }

  const updateThreshold = STATION_CLASSIFICATION_CONFIG.UPDATE_THRESHOLD_HOURS;
  const updateStatus = latestRecord.Data_Hora_Medicao
    ? ((new Date() - parseLocalDate(latestRecord.Data_Hora_Medicao)) / (1000 * 60 * 60) <= updateThreshold
        ? "Atualizado"
        : "Desatualizado")
    : "Desatualizado";

  const classificacaoChuva = classifyRainfall(accumulatedRainfall, stationCode);
  const classificacaoNivel = classifyLevel(latestRecord.Cota_Adotada, stationCode);
  const classificacaoVazao = classifyDischarge(latestRecord.Vazao_Adotada, stationCode);

  return {
    codigoestacao: stationCode,
    Estacao_Nome: stationData.Estacao_Nome,
    data: stationData.data,
    Rio_Nome: stationData.Rio_Nome || "Desconhecido",
    latitude: parseFloat(stationData.Latitude) || null,
    longitude: parseFloat(stationData.Longitude) || null,
    chuvaAcumulada: accumulatedRainfall != null ? Number(accumulatedRainfall.toFixed(2)) : null,
    nivelMaisRecente: latestRecord.Cota_Adotada,
    vazaoMaisRecente: latestRecord.Vazao_Adotada,
    statusAtualizacao: updateStatus,
    classificacaoChuva,
    classificacaoNivel,
    classificacaoVazao
  };
}

/**
 * @param   {Array<Object>} stationsArray   Array de objetos de dados de estações.
 * @returns {Object}                        Objeto agrupando estações por rio, situação de atualização e categoria.
 *
 * @property {Object}   byRiver             Agrupamento por nome do rio.
 * @property {Array}    updated             Estações com status "Atualizado".
 * @property {Array}    notUpdated          Estações com status "Desatualizado".
 * @property {Object}   byRainfall          Agrupamento por categoria de chuva.
 * @property {Object}   byLevel             Agrupamento por categoria de nível.
 * @property {Object}   byDischarge         Agrupamento por categoria de vazão.
 *
 * @example
 * const agrupados = categorizeStations(stationsArray);
 * console.log(agrupados.byRiver, agrupados.updated);
 */
export function categorizeStations(stationsArray) {
  const categorized = {
    byRiver: {},
    updated: [],
    notUpdated: [],
    byRainfall: {},
    byLevel: {},
    byDischarge: {}
  };

  stationsArray.forEach(stationData => {
    const category = categorizeStation(stationData);

    if (category.statusAtualizacao === "Atualizado") {
      categorized.updated.push(category);
    } else {
      categorized.notUpdated.push(category);
    }

    const rainKey = category.classificacaoChuva;
    categorized.byRainfall[rainKey] = categorized.byRainfall[rainKey] || [];
    categorized.byRainfall[rainKey].push(category);

    const levelKey = category.classificacaoNivel;
    categorized.byLevel[levelKey] = categorized.byLevel[levelKey] || [];
    categorized.byLevel[levelKey].push(category);

    const dischargeKey = category.classificacaoVazao;
    categorized.byDischarge[dischargeKey] = categorized.byDischarge[dischargeKey] || [];
    categorized.byDischarge[dischargeKey].push(category);

    const river = category.Rio_Nome;
    categorized.byRiver[river] = categorized.byRiver[river] || [];
    categorized.byRiver[river].push(category);
  });

  return categorized;
}

/**
 * @param   {Array<Object>} stationsArray   Array de objetos de dados de estações.
 * @returns {Array<Object>}                 Array de estações categorizadas, cada uma com propriedade 'index'.
 *
 * @example
 * const todas = getAllCategorizedStations(stationsArray);
 * console.log(todas[0].classificacaoChuva, todas[0].index);
 */
export function getAllCategorizedStations(stationsArray) {
  return stationsArray.map((stationData, index) => {
    const categorized = categorizeStation(stationData);
    categorized.index = index;
    return categorized;
  });
}
