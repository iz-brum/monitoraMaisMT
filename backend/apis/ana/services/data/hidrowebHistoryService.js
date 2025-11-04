/**
 * @file backend/apis/ana/services/hidrowebHistoryService.js
 * Serviço para busca de histórico telemétrico na API ANA.
 */

/**
* 
-> O que DEVE ficar em um arquivo de serviço de dados (service):
- Funções de acesso a dados externos
Exemplo: Função getStationHistory que faz requisição HTTP à API da ANA.

- Validação de parâmetros de entrada
Exemplo: Módulo validators que checa formato de datas, códigos, intervalos, etc.

- Transformação e normalização de dados
Exemplo: Módulo dataTransformers que filtra, ordena e formata os dados recebidos da API.

- Lógica de autenticação para acesso à API
Exemplo: Uso de authenticateHidroweb() para obter token de acesso.

- Tratamento e logging de erros relacionados à integração
Exemplo: Bloco catch que loga detalhes do erro e lança exceção amigável.

- Funções auxiliares internas para manipulação dos dados
Exemplo: Ordenação, filtragem, cálculo de acumulados, etc.

- Configurações específicas do serviço
Exemplo: URLs, timeouts, headers, campos aceitos, etc.

-> O que NÃO DEVE ficar em um arquivo de serviço de dados:
- Lógica de roteamento HTTP ou Express

- Não deve haver req, res, nem definição de rotas.
Exemplo: Não deve haver res.json(...) ou req.params.

- Lógica de controle de fluxo da aplicação (controller)

- Não deve decidir qual status HTTP retornar, nem montar respostas para o cliente.

- Renderização de views/templates

- Não deve haver código para renderizar HTML, ejs, pug, etc.

- Acesso direto a banco de dados local (a não ser que o serviço seja para isso)

- Este arquivo é para integração com API externa, não para queries SQL/Mongo/etc.
- Funções utilitárias genéricas que não são específicas do serviço

- Utilitários genéricos devem ficar em arquivos de utilidades, não no service.

- Configurações globais da aplicação
Exemplo: Não deve definir middlewares, variáveis de ambiente globais, etc.
Testes unitários ou mocks

Testes devem ficar em arquivos separados, geralmente em uma pasta tests ou similar.
*/

import axios from 'axios';
import { authenticateHidroweb } from '#ana_services/auth/hidrowebAuth.js';
import { AnaConfig } from '#ana_constants/AnaConfig.js';
// import { logRainyStations } from '#ana_utils/core/runtime.js';
import { calcularAcumulados } from '#ana_utils/calculos/acumuladoChuva.js';
import {
    extrairValoresSerie,
    quantidadeEventosChuva,
    sequenciaMaximaChuva,
    sequenciaMaximaSemChuva,
    calcularEstatisticasSerie
} from '#ana_utils/calculos/estatisticasSerieTemporal.js';

// --- Constantes e Configuração ---
const { VALIDOS: VALID_INTERVALS } = AnaConfig.HIDROLOGIA.INTERVALOS;
const FIELD_ORDER = [
    'Data_Hora_Medicao',
    'Data_Atualizacao',
    'Chuva_Adotada',
    // 'Chuva_Adotada_Status',
    'Cota_Adotada',
    // 'Cota_Adotada_Status',
    'Vazao_Adotada',
    // 'Vazao_Adotada_Status'
];
const ACUM_OPTS = { tzOffsetMinutes: -180, mode: 'RELATIVE' };

// --- Validação ---
const isValidCodigoEstacao = codigo => !!codigo;
const isValidTipoFiltroData = tipo => ['DATA_LEITURA', 'DATA_ULTIMA_ATUALIZACAO'].includes(tipo);
const isValidDataBusca = data => /^\d{4}-\d{2}-\d{2}$/.test(data);
const isValidIntervalo = intervalo => VALID_INTERVALS.includes(intervalo);

function validateParams({ codigoEstacao, tipoFiltroData, dataBusca, intervalo }) {
    if (!isValidCodigoEstacao(codigoEstacao)) throw new Error('Código da estação é obrigatório');
    if (!isValidTipoFiltroData(tipoFiltroData)) throw new Error('Tipo de filtro de data inválido. Use: DATA_LEITURA ou DATA_ULTIMA_ATUALIZACAO');
    if (!isValidDataBusca(dataBusca)) throw new Error('Formato de data inválido. Use YYYY-MM-DD');
    if (!isValidIntervalo(intervalo)) throw new Error(`Intervalo inválido. Use um dos: ${VALID_INTERVALS.join(', ')}`);
}

// --- Helpers de Dados ---
const isNumber = v => Number.isFinite(Number(v));

const hasValidRain = items =>
    Array.isArray(items) && items.some(item => isNumber(item.Chuva_Adotada));

const getStatusEstacao = (items, dataBusca) => {
    if (!Array.isArray(items) || items.length === 0) return 'Desatualizada';

    const hoje = new Date().toISOString().slice(0, 10);
    if (dataBusca === hoje) {
        const agora = new Date();
        return items.some(item => {
            const data = new Date(item.Data_Hora_Medicao);
            return !isNaN(data) && (agora - data) / 60000 <= 60 && (agora - data) >= 0;
        }) ? 'Atualizada' : 'Desatualizada';
    } else {
        return items.some(item => item.Data_Hora_Medicao.startsWith(dataBusca)) ? 'Atualizada' : 'Desatualizada';
    }
};
const getAcumulados = items => {
    if (!hasValidRain(items)) return { acumulado_geral: null, janelas_24h: null };
    const acumulados = calcularAcumulados(items, ACUM_OPTS);
    return {
        acumulado_geral: acumulados.acumulado_geral,
        janelas_24h: acumulados.janelas_24h
    };
};

/** */
function getEstatisticasSerieTemporal(items) {
    // Chuva
    const chuva = calcularEstatisticasSerie(items, 'Chuva_Adotada');
    // Cota (nível d'água)
    const cota = calcularEstatisticasSerie(items, 'Cota_Adotada');
    // Vazão
    const vazao = calcularEstatisticasSerie(items, 'Vazao_Adotada');

    // Eventos e sequências só fazem sentido para chuva
    const valoresChuva = extrairValoresSerie(items, 'Chuva_Adotada');
    return {
        // Chuva
        media_chuva: chuva.media,
        mediana_chuva: chuva.mediana,
        desvio_padrao_chuva: chuva.desvio_padrao,
        max_chuva: chuva.maximo,
        min_chuva: chuva.minimo,
        moda_chuva: chuva.moda,
        qtd_registros_chuva: valoresChuva.length,
        percentual_registros_validos_chuva: chuva.percentual_validos,
        tendencia_chuva: chuva.tendencia,
        qtd_eventos_chuva: quantidadeEventosChuva(valoresChuva),
        seq_max_chuva: sequenciaMaximaChuva(valoresChuva),
        seq_max_sem_chuva: sequenciaMaximaSemChuva(valoresChuva),

        // Cota
        media_cota: cota.media,
        mediana_cota: cota.mediana,
        desvio_padrao_cota: cota.desvio_padrao,
        max_cota: cota.maximo,
        min_cota: cota.minimo,
        moda_cota: cota.moda,
        qtd_registros_cota: extrairValoresSerie(items, 'Cota_Adotada').length,
        percentual_registros_validos_cota: cota.percentual_validos,
        tendencia_cota: cota.tendencia,

        // Vazão
        media_vazao: vazao.media,
        mediana_vazao: vazao.mediana,
        desvio_padrao_vazao: vazao.desvio_padrao,
        max_vazao: vazao.maximo,
        min_vazao: vazao.minimo,
        moda_vazao: vazao.moda,
        qtd_registros_vazao: extrairValoresSerie(items, 'Vazao_Adotada').length,
        percentual_registros_validos_vazao: vazao.percentual_validos,
        tendencia_vazao: vazao.tendencia
    };
}

// --- Transformação de Dados ---
const normalizeResponse = raw =>
    Array.isArray(raw.items) ? raw.items : [raw];

const filterAndOrderFields = record => {
    const filtered = Object.fromEntries(
        Object.entries(record).filter(([k]) => FIELD_ORDER.includes(k))
    );
    return FIELD_ORDER.reduce((acc, k) => (k in filtered ? { ...acc, [k]: filtered[k] } : acc), {});
};

const sortByMeasurementDate = items => {
    const valid = [];
    const invalid = [];
    items.forEach(item => {
        const date = new Date(item.Data_Hora_Medicao);
        if (isNaN(date)) {
            invalid.push({
                ...item,
                _observacao: 'DATA_INVALIDA',
                _data_original: item.Data_Hora_Medicao,
                Data_Hora_Medicao: '1900-01-01 00:00:00.0'
            });
        } else {
            valid.push(item);
        }
    });
    valid.sort((a, b) => new Date(a.Data_Hora_Medicao) - new Date(b.Data_Hora_Medicao));
    return [...invalid, ...valid];
};

// --- Montagem da Resposta Final ---
function buildFinalResponse(raw, cleanItems, dataBusca) {
    const { acumulado_geral, janelas_24h } = getAcumulados(cleanItems);
    const statusEstacao = getStatusEstacao(cleanItems, dataBusca);
    // const estatisticasChuva = getEstatisticasSerieTemporal(cleanItems);

    return {
        message: raw.message,
        status_estacao: statusEstacao,
        acumulado_intervalo_completo: acumulado_geral,
        acumulado_intervalos_24h: janelas_24h,
        // ...estatisticasChuva,
        items: cleanItems
    };
}

// --- HTTP Client ---
async function getStationData(params, token) {
    return axios.get(
        'https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas/HidroinfoanaSerieTelemetricaAdotada/v1',
        {
            params,
            headers: { Authorization: `Bearer ${token}` },
            timeout: AnaConfig.HIDROLOGIA.TIMEOUT_HISTORICO_MS
        }
    );
}

// Registro de erros
const errorLogRegistry = new Set();

// --- Função Principal do Serviço ---
export async function getStationHistory(codigoEstacao, tipoFiltroData, dataBusca, intervalo) {
    try {
        validateParams({ codigoEstacao, tipoFiltroData, dataBusca, intervalo });

        const token = await authenticateHidroweb();

        const params = new URLSearchParams({
            'Código da Estação': String(codigoEstacao),
            'Tipo Filtro Data': tipoFiltroData,
            'Data de Busca (yyyy-MM-dd)': dataBusca,
            'Range Intervalo de busca': intervalo
        });

        const response = await getStationData(params, token);
        const raw = response.data;

        const normalizedItems = normalizeResponse(raw);
        const filteredItems = normalizedItems.map(filterAndOrderFields);
        const cleanItems = sortByMeasurementDate(filteredItems);

        // logRainyStations({ items: cleanItems }, codigoEstacao); // opcional

        return buildFinalResponse(raw, cleanItems, dataBusca);

    } catch (error) {
        let status = null;
        let logKey = 'unknown';

        if (error.response) {
            status = error.response.status;
            logKey = `response:${status}`;
        } else if (error.request) {
            logKey = 'no_response';
        } else {
            logKey = `config:${error.message}`;
        }

        if (!errorLogRegistry.has(logKey)) {
            errorLogRegistry.add(logKey);

            if (error.response) {
                console.error('\n[ERRO API ANA] Falha na resposta da API ANA:');
                console.error(`  - Status HTTP: ${status}`);
            } else if (error.request) {
                console.error('\n[ERRO API ANA] Nenhuma resposta recebida da API ANA.');
            } else {
                console.error('\n[ERRO API ANA] Erro ao configurar a requisição para a API ANA:');
                console.error(`  - Mensagem: ${error.message}\n`);
            }
            if (error.stack) {
                console.error('[ERRO API ANA] Stack trace:\n', error.stack, '\n');
            }
        }

        // Retorne um objeto de erro controlado, não lance exceção!
        return {
            status_estacao: 'ERRO',
            motivo_erro: error.message,
            codigo_estacao: codigoEstacao,
            items: []
        };
    }
}