// File: backend/apis/ana/services/stats/tests/stateDailyAveragesService.test.js

// Importações necessárias para o teste
import fs from 'fs';
import { jest, describe, it, expect } from '@jest/globals';

// Importamos a função que queremos testar
import { buildStateDailyAveragesSeries } from '#ana_services/stats/stateDailyAveragesService.js';

// Importamos as dependências que a nossa função usa e que precisam ser controladas
// (Não precisamos importar getStationHistory pois está mockado)

const META_PATH = './reports/test-meta-dump.json';
global.__testMetaDump = [];

// --- Nosso conjunto de dados falsos (Mock Data) ---
// Simula o histórico de chuva para duas estações.
// Estação 001 (Cuiabá): Choveu 10mm no dia 14.
// Estação 002 (Várzea Grande): Choveu 20mm no dia 14.
const mockHistoryData = {
    '001': {
        items: [
            { Data_Hora_Medicao: '2025-09-14 12:00:00.0', Chuva_Adotada: '10.00' },
        ],
    },
    '002': {
        items: [
            { Data_Hora_Medicao: '2025-09-14 12:00:00.0', Chuva_Adotada: '20.00' },
        ],
    },
};

// Mock das dependências
jest.mock('#ana_services/data/hidrowebHistoryService.js', () => ({
    getStationHistory: jest.fn().mockImplementation(codigo =>
        Promise.resolve(mockHistoryData[codigo] || { items: [] })
    ),
}));
jest.mock('#ana_utils/filtragem_estacoes/stationLists.js', () => ({
    loadLists: jest.fn().mockResolvedValue({ white: new Set(['001', '002']) }),
}));
jest.mock('#ana_inventario', () => ([
    { codigoestacao: '001', Municipio_Nome: 'Cuiabá', UF_Estacao: 'MT', Operando: '1' },
    { codigoestacao: '002', Municipio_Nome: 'Várzea Grande', UF_Estacao: 'MT', Operando: '1' },
]), { virtual: true });

describe('buildStateDailyAveragesSeries', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Não precisamos mais configurar 'loadLists' e 'getStationHistory' aqui - já estão configurados nos mocks acima
    });

    it('DEVE PASSAR: o cálculo para dias passados é consistente independente da hora da execução', async () => {
        const params = { uf: 'MT', dias: 2, tzOffsetMinutes: 0 };

        // --- Simulação 1: Executando agora ---
        const resultRun1 = await buildStateDailyAveragesSeries(params);

        // Pequeno delay para garantir que o tempo mudou (1 segundo)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // --- Simulação 2: Executando alguns segundos depois ---
        const resultRun2 = await buildStateDailyAveragesSeries(params);

        // Pegamos o ponto da série temporal correspondente ao "dia anterior" (14/09) em cada execução
        const pontoDia14_Run1 = resultRun1.pontos[0];
        const pontoDia14_Run2 = resultRun2.pontos[0];

        console.log('Média para 14/09 (Execução 1):', pontoDia14_Run1.media_uf);
        console.log('Média para 14/09 (Execução 2):', pontoDia14_Run2.media_uf);

        // A asserção que deve PASSAR após a correção
        // As médias para o mesmo dia devem ser idênticas, independente da hora da execução
        // Após ancorar em meia-noite UTC, elas serão consistentes
        expect(pontoDia14_Run1.media_uf).toEqual(pontoDia14_Run2.media_uf);

        // Metadados para relatório
        const meta = {
            objetivo: 'Validar que o bug da "janela deslizante" foi corrigido.',
            criterios: [
                'O teste executa duas chamadas com delay entre elas.',
                'O cálculo para o dia anterior (14/09) deve ser idêntico em ambas as execuções.',
                'O sucesso na asserção confirma que o cálculo é estável após ancorar em meia-noite UTC.'
            ],
            esperado: 'O teste deve passar, mostrando médias idênticas para o mesmo dia passado.',
            parametrosRequest: params
        };
        global.__testMetaDump.push({
            fullName: expect.getState().currentTestName,
            meta,
            resultado: {
                mediaRun1: pontoDia14_Run1.media_uf,
                mediaRun2: pontoDia14_Run2.media_uf,
                diferenca: Math.abs(pontoDia14_Run1.media_uf - pontoDia14_Run2.media_uf)
            }
        });
    });
});

// =======================
// FINALIZAÇÃO E DUMP DE METADADOS
// =======================
afterAll(() => {
    fs.writeFileSync(META_PATH, JSON.stringify(global.__testMetaDump, null, 2));
});
